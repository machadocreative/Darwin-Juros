// ── FIREBASE ──
// Inicialização e funções de autenticação + Firestore

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithRedirect,
         getRedirectResult, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

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

// ── Login com Google (redirect) ──
async function loginComGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(_auth, provider);
  } catch (e) {
    console.error('Erro no redirect:', e);
  }
}

// ── Logout ──
async function logoutGoogle() {
  try {
    await signOut(_auth);
    showToast('Você saiu da sua conta.');
  } catch (e) {
    showToast('Erro ao sair. Tente novamente.');
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

  // Fecha ao clicar fora
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
// Processa o retorno do redirect e observa o estado de autenticação
// assim que o módulo carrega — sem depender do main.js.
getRedirectResult(_auth)
  .then((result) => {
    console.log('Redirect result:', result);
    if (result?.user) {
      window.currentUser = result.user;
      requestAnimationFrame(() => _updateAuthUI());
    }
  })
  .catch((e) => { console.error('Redirect error:', e); });

onAuthStateChanged(_auth, (user) => {
  window.currentUser = user || null;
  requestAnimationFrame(() => _updateAuthUI());
});

// Expõe para os outros módulos
window.loginComGoogle = loginComGoogle;
window.logoutGoogle   = logoutGoogle;
window._updateAuthUI  = _updateAuthUI;
window._db            = _db;
