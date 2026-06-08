// ── FIREBASE ──
// Inicialização, autenticação (Google) e sincronização de perfis (Firestore)

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAJInJODvitfOwyBlaj1P39wHCa0jzOvk8",
  authDomain: "darwin-juros.firebaseapp.com",
  projectId: "darwin-juros",
  storageBucket: "darwin-juros.firebasestorage.app",
  messagingSenderId: "961650011640",
  appId: "1:961650011640:web:89b7e49724dadf598c7a0d"
};

const _fbApp = initializeApp(firebaseConfig);
const _auth  = getAuth(_fbApp);
const _db    = getFirestore(_fbApp);

// Usuário atual — acessível globalmente
window.currentUser = null;

// Evita sincronizações simultâneas
let _syncing = false;

// ── Login com Google (popup) ──
async function loginComGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(_auth, provider);
    if (result?.user) {
      window.currentUser = result.user;
      _updateAuthUI();
      showToast('Login realizado com sucesso!');
      _syncProfiles(); // sincroniza perfis logo após login
    }
  } catch (e) {
    if (e.code === 'auth/popup-closed-by-user' ||
        e.code === 'auth/cancelled-popup-request') {
      return;
    }
    console.error('Erro no login:', e);
    showToast('Não foi possível fazer login. Tente novamente.');
  }
}

// ── Logout ──
async function logoutGoogle() {
  try {
    await signOut(_auth);
    window.currentUser = null;
    _updateAuthUI();
    showToast('Você saiu da sua conta.');
  } catch (e) {
    showToast('Erro ao sair. Tente novamente.');
  }
}

// ── FIRESTORE: caminho da subcoleção de perfis do usuário ──
function _profilesCol() {
  return collection(_db, 'users', window.currentUser.uid, 'profiles');
}

// ── FIRESTORE: salvar/atualizar um perfil na nuvem ──
// Chamado em background pelo storage.js. Silencioso em caso de erro.
async function _cloudSaveProfile(profile) {
  if (!window.currentUser || !profile?.id) return;
  try {
    const ref = doc(_db, 'users', window.currentUser.uid, 'profiles', profile.id);
    await setDoc(ref, profile);
  } catch (e) {
    console.error('Erro ao salvar perfil na nuvem:', e);
  }
}

// ── FIRESTORE: excluir um perfil na nuvem ──
async function _cloudDeleteProfile(id) {
  if (!window.currentUser || !id) return;
  try {
    const ref = doc(_db, 'users', window.currentUser.uid, 'profiles', id);
    await deleteDoc(ref);
  } catch (e) {
    console.error('Erro ao excluir perfil na nuvem:', e);
  }
}

// ── FIRESTORE: carregar todos os perfis da nuvem ──
async function _cloudLoadProfiles() {
  if (!window.currentUser) return [];
  try {
    const snap = await getDocs(_profilesCol());
    return snap.docs.map(d => d.data());
  } catch (e) {
    console.error('Erro ao carregar perfis da nuvem:', e);
    return [];
  }
}

// ── Merge: combina local + nuvem por id, mantendo a versão mais recente ──
function _mergeProfiles(local, cloud) {
  const map = new Map();
  cloud.forEach(p => { if (p?.id) map.set(p.id, p); });
  local.forEach(p => {
    if (!p?.id) return;
    const existente = map.get(p.id);
    // Mantém o mais recente por savedAt; sem savedAt, o local prevalece
    if (!existente ||
        new Date(p.savedAt || 0) >= new Date(existente.savedAt || 0)) {
      map.set(p.id, p);
    }
  });
  return Array.from(map.values());
}

// ── Sincronização: sobe locais, baixa nuvem, faz merge, atualiza local ──
async function _syncProfiles() {
  if (!window.currentUser || _syncing) return;
  if (typeof loadProfiles !== 'function' || typeof saveProfiles !== 'function') return;

  _syncing = true;
  try {
    const local  = loadProfiles();
    const cloud  = await _cloudLoadProfiles();
    const merged = _mergeProfiles(local, cloud);

    // Grava o conjunto consolidado na nuvem
    for (const p of merged) { await _cloudSaveProfile(p); }

    // Atualiza o espelho local
    saveProfiles(merged);

    // Re-renderiza se o usuário estiver vendo a tela de perfis
    if (typeof screen !== 'undefined' && screen === 'perfis' &&
        typeof renderProfiles === 'function') {
      renderProfiles();
    }
  } catch (e) {
    console.error('Erro na sincronização:', e);
  } finally {
    _syncing = false;
  }
}

// ── Atualiza o avatar/botão no greeting ──
function _updateAuthUI() {
  const btn = document.getElementById('auth-btn');
  if (!btn) return;

  if (window.currentUser) {
    const photo = window.currentUser.photoURL;
    const name  = window.currentUser.displayName || 'Usuário';
    btn.innerHTML = photo
      ? `<img src="${photo}" alt="${name}" class="auth-avatar" title="${name}">`
      : `<div class="auth-avatar auth-avatar-placeholder" title="${name}">${name.charAt(0).toUpperCase()}</div>`;
    btn.onclick = () => _showLogoutMenu();
  } else {
    btn.innerHTML = `<span class="auth-login-btn">Entrar</span>`;
    btn.onclick = () => loginComGoogle();
  }
}

// ── Mini-menu de logout ──
function _showLogoutMenu() {
  document.getElementById('auth-menu')?.remove();

  const user = window.currentUser;
  const menu = document.createElement('div');
  menu.id = 'auth-menu';
  menu.className = 'auth-menu';
  menu.innerHTML = `
    <div class="auth-menu-user">
      <div class="auth-menu-name">${escHtml(user.displayName || 'Usuário')}</div>
      <div class="auth-menu-email">${escHtml(user.email || '')}</div>
    </div>
    <button class="auth-menu-logout" id="auth-logout-btn">Sair da conta</button>
  `;
  document.body.appendChild(menu);

  document.getElementById('auth-logout-btn').addEventListener('click', () => {
    menu.remove();
    logoutGoogle();
  });

  setTimeout(() => {
    document.addEventListener('click', function _close(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', _close);
      }
    });
  }, 0);
}

// ── AUTO-INICIALIZAÇÃO ──
// Observa o estado de autenticação. Dispara ao abrir o app já logado
// (persistência) — sincroniza os perfis da nuvem para este dispositivo.
onAuthStateChanged(_auth, (user) => {
  const erajLogado = !!window.currentUser;
  window.currentUser = user || null;
  requestAnimationFrame(() => _updateAuthUI());
  // Sincroniza ao detectar login na abertura do app (não logo após o popup,
  // que já chama _syncProfiles diretamente)
  if (user && !erajLogado) _syncProfiles();
});

// Expõe para os outros módulos (storage.js é script clássico)
window.loginComGoogle    = loginComGoogle;
window.logoutGoogle      = logoutGoogle;
window._updateAuthUI     = _updateAuthUI;
window._cloudSaveProfile = _cloudSaveProfile;
window._cloudDeleteProfile = _cloudDeleteProfile;
window._syncProfiles     = _syncProfiles;
window._db               = _db;
