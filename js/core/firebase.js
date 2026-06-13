// ── FIREBASE ──
// Inicialização, autenticação (Google) e sincronização de perfis (Firestore)
//
// ┌──────────────────────────────────────────────────────────────────────────┐
// │ COMO OS DADOS SE COMPORTAM (modelo "local primeiro")                      │
// │                                                                          │
// │ • O app SEMPRE lê e escreve no armazenamento do aparelho (localStorage). │
// │   É a "cópia de trabalho" — por isso o app funciona até sem internet.    │
// │ • A nuvem (Firestore) é o BACKUP e o ponto de encontro entre aparelhos.  │
// │   Ela guarda os perfis e os entrega para outro celular do mesmo usuário. │
// │                                                                          │
// │ Quando os dois se encontram (no login, ao abrir o app ou no F5), o app   │
// │ junta os dois lados perfil por perfil, com estas regras de prioridade:   │
// │   1. Vence a versão salva MAIS RECENTEMENTE (campo savedAt).             │
// │   2. Empate de data → a NUVEM ganha.                                     │
// │   3. Premium nunca cai: se foi premium em algum lado, continua premium.  │
// │   4. Perfil apagado aqui continua apagado (marca de exclusão / tombstone │
// │      em localStorage) — não "ressuscita" pela nuvem.                     │
// │                                                                          │
// │ Por isso toda edição local (renomear, ícone, premium) passa por          │
// │ patchProfile (em storage.js): ele atualiza a data e sobe pra nuvem,      │
// │ garantindo que a alteração recente vença na próxima junção.              │
// └──────────────────────────────────────────────────────────────────────────┘

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp }
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
// Throttle: ignora syncs não-forçados disparados em menos de 30s do último.
// (Entrar/sair da aba Perfis repetidamente não dispara N syncs seguidos.)
let _lastSyncAt = 0;
const _SYNC_THROTTLE_MS = 30000;

// ── Login com Google (popup) ──
async function loginComGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(_auth, provider);
    if (result?.user) {
      window.currentUser = result.user;
      _updateAuthUI();
      showToast('Login realizado com sucesso!');
      _syncProfiles(true); // sincroniza perfis logo após login (força, ignora throttle)
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
    // Limpa o espelho local para não vazar os perfis desta conta para uma
    // outra que logue no mesmo navegador (o sync regravaria os perfis antigos
    // na nova conta). Os dados continuam seguros na nuvem e voltam no próximo
    // login. Tombstones também são zerados — pertenciam à conta que saiu.
    if (typeof saveProfiles === 'function') saveProfiles([]);
    try { localStorage.removeItem('juros_obra_excluidos'); } catch (e) {}
    try { localStorage.removeItem('juros_obra_last_sync'); } catch (e) {}
    if (typeof currentProfileId !== 'undefined') currentProfileId = null;
    _updateAuthUI();
    if (typeof renderProfiles === 'function' && screen === 'profiles') {
      renderProfiles();
    } else if (typeof renderHome === 'function' && (screen === 'home' || screen === 'nova')) {
      renderHome();
    }
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
// Além de apagar o perfil, grava uma "marca de exclusão" (tombstone) na nuvem,
// em users/{uid}/excluidos/{id}. Sem isso, a exclusão ficava só no aparelho que
// apagou — outro dispositivo, que ainda tinha o perfil, o regravava no sync e
// ele "ressuscitava". Com o tombstone na nuvem, todos os aparelhos ficam
// sabendo que aquele id foi excluído.
async function _cloudDeleteProfile(id) {
  if (!window.currentUser || !id) return;
  try {
    const ref = doc(_db, 'users', window.currentUser.uid, 'profiles', id);
    await deleteDoc(ref);
  } catch (e) {
    console.error('Erro ao excluir perfil na nuvem:', e);
  }
  // grava o tombstone (separado do delete: mesmo se o delete falhar, a marca
  // de exclusão precisa propagar)
  try {
    const tref = doc(_db, 'users', window.currentUser.uid, 'excluidos', id);
    await setDoc(tref, { excluidoEm: serverTimestamp() });
  } catch (e) {
    console.error('Erro ao marcar exclusão na nuvem:', e);
  }
}

// ── FIRESTORE: carregar as marcas de exclusão (tombstones) da nuvem ──
// Retorna um Set de ids que foram excluídos em qualquer dispositivo.
async function _cloudLoadTombstones() {
  if (!window.currentUser) return new Set();
  try {
    const col = collection(_db, 'users', window.currentUser.uid, 'excluidos');
    const snap = await getDocs(col);
    return new Set(snap.docs.map(d => d.id));
  } catch (e) {
    console.error('Erro ao carregar exclusões da nuvem:', e);
    return new Set();
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

// ── RESGATE ÚNICO DE CUPOM ──
// Reserva um código criando 'cupons_resgatados/{codigo}'. A atomicidade vem das
// Security Rules (ver firestore.rules): elas permitem CREATE de um documento
// inexistente, mas proíbem UPDATE. Logo, se o código já foi resgatado, o
// documento existe e a gravação cai na regra de update → 'permission-denied'.
// Isso nos dá o "já usado" sem precisar de leitura prévia (que é restrita a
// admins). O checksum já deve ter sido validado offline ANTES de chamar esta
// função (não gastamos rede com lixo). Se dois aparelhos tentam o mesmo código
// ao mesmo tempo, só a primeira criação vence; a segunda recebe permission-denied.
//
// Retorna um objeto de status:
//   { ok: true }                         → código era inédito, premium liberado
//   { ok: false, motivo: 'ja_usado' }    → código já foi resgatado antes
//   { ok: false, motivo: 'sem_login' }   → precisa estar logado
//   { ok: false, motivo: 'sem_rede' }    → falha de conexão / erro inesperado
async function _resgatarCupom(codigo, profileId) {
  if (!window.currentUser) return { ok: false, motivo: 'sem_login' };
  const cod = (codigo || '').toUpperCase().trim();
  if (!cod) return { ok: false, motivo: 'sem_rede' };

  const ref = doc(_db, 'cupons_resgatados', cod);
  try {
    await setDoc(ref, {
      uid: window.currentUser.uid,
      profileId: profileId || null,
      resgatadoEm: serverTimestamp()
    });
    return { ok: true };
  } catch (e) {
    // Documento já existia → a regra de update barra → permission-denied.
    if (e && e.code === 'permission-denied') return { ok: false, motivo: 'ja_usado' };
    console.error('Erro ao resgatar cupom:', e);
    return { ok: false, motivo: 'sem_rede' };
  }
}

// ── Merge: combina local + nuvem por id, mantendo a versão mais recente ──
// Regras de desempate:
//   1. Vence a versão com savedAt mais recente.
//   2. Em empate de savedAt, a NUVEM prevalece (fonte da verdade quando logado).
//   3. Premium é direito adquirido: se qualquer versão for premium, o
//      resultado mantém premium=true (um sync nunca "rebaixa" um perfil pago).
// `excluidos` é um Set de ids excluídos (local + nuvem unidos pelo chamador).
// Quando não passado, cai nos tombstones locais (compatibilidade).
function _mergeProfiles(local, cloud, excluidos) {
  const map = new Map();
  if (!(excluidos instanceof Set)) {
    excluidos = (typeof tombstoneIds === 'function') ? tombstoneIds() : new Set();
  }

  cloud.forEach(p => { if (p?.id && !excluidos.has(p.id)) map.set(p.id, p); });

  local.forEach(p => {
    if (!p?.id || excluidos.has(p.id)) return;
    const existente = map.get(p.id);
    // Estritamente MAIOR: em empate, mantém a nuvem (já está no map)
    if (!existente ||
        new Date(p.savedAt || 0) > new Date(existente.savedAt || 0)) {
      map.set(p.id, p);
    }
  });

  // Blindagem do premium: percorre as duas fontes e garante que,
  // se o perfil já foi premium em algum lugar, continua premium.
  const garantePremium = (p) => {
    if (!p?.id || excluidos.has(p.id)) return;
    const atual = map.get(p.id);
    if (atual && p.premium === true && atual.premium !== true) {
      map.set(p.id, { ...atual, premium: true });
    }
  };
  cloud.forEach(garantePremium);
  local.forEach(garantePremium);

  return Array.from(map.values());
}

// ── Sincronização: sobe locais, baixa nuvem, faz merge, atualiza local ──
// force=true ignora o throttle (usado no login e na detecção de sessão).
async function _syncProfiles(force) {
  if (!window.currentUser || _syncing) return;
  if (typeof loadProfiles !== 'function' || typeof saveProfiles !== 'function') return;
  if (!force && Date.now() - _lastSyncAt < _SYNC_THROTTLE_MS) return;

  _syncing = true;
  try {
    const local = loadProfiles();
    // leituras independentes em paralelo
    const [cloud, tombCloud] = await Promise.all([
      _cloudLoadProfiles(),
      _cloudLoadTombstones()
    ]);

    // Une as marcas de exclusão dos dois lados: o que foi apagado aqui (local)
    // E o que foi apagado em qualquer outro dispositivo (nuvem). É esta união
    // que faz a exclusão CONVERGIR entre dispositivos.
    const tombLocal = (typeof tombstoneIds === 'function') ? tombstoneIds() : new Set();
    const excluidos = new Set([...tombLocal, ...tombCloud]);

    const merged = _mergeProfiles(local, cloud, excluidos);

    // Índice da nuvem por id — usado para subir só o que mudou (incremental).
    const cloudById = new Map(cloud.filter(p => p?.id).map(p => [p.id, p]));

    // Espelha as exclusões nos dois sentidos:
    //  (a) tombstone local que ainda não está na nuvem → sobe (avisa os outros)
    const exclusaoOps = [];
    if (typeof addTombstone === 'function') {
      for (const id of tombLocal) {
        if (!tombCloud.has(id)) {
          const tref = doc(_db, 'users', window.currentUser.uid, 'excluidos', id);
          exclusaoOps.push(
            setDoc(tref, { excluidoEm: serverTimestamp() })
              .catch(e => console.error('Erro ao subir exclusão:', e))
          );
        }
      }
      //  (b) tombstone que veio da nuvem → registra localmente (para este
      //      aparelho não regravar o perfil em syncs futuros, mesmo offline)
      for (const id of tombCloud) {
        if (!tombLocal.has(id)) addTombstone(id);
      }
    }

    //  (c) perfil ainda presente na nuvem mas marcado como excluído → apaga
    for (const p of cloud) {
      if (p?.id && excluidos.has(p.id)) exclusaoOps.push(_cloudDeleteProfile(p.id));
    }

    // Sobe na nuvem APENAS os perfis novos ou alterados (savedAt ou premium
    // diferentes do que já está lá). Antes regravava todos a cada sync — agora
    // que o sync roda ao abrir Perfis, isso evitava dezenas de writes por visita.
    const uploadOps = [];
    for (const p of merged) {
      const cv = cloudById.get(p.id);
      if (!cv || cv.savedAt !== p.savedAt || cv.premium !== p.premium) {
        uploadOps.push(_cloudSaveProfile(p));
      }
    }

    // Writes em paralelo (cada _cloud* já trata o próprio erro internamente)
    await Promise.all([...exclusaoOps, ...uploadOps]);

    // Atualiza o espelho local
    saveProfiles(merged);

    // Carimba o horário desta sincronização bem-sucedida (exibido na tela
    // de Perfis como "Última sincronização")
    try { localStorage.setItem('juros_obra_last_sync', new Date().toISOString()); } catch (e) {}

    // Re-renderiza a tela atual para refletir os perfis recém-sincronizados.
    // renderProfiles(true): skipSync evita que este re-render dispare outro
    // sync (que dispararia outro render → loop).
    if (typeof screen !== 'undefined') {
      if (screen === 'profiles' && typeof renderProfiles === 'function') {
        renderProfiles(true);
      } else if ((screen === 'home' || screen === 'nova') && typeof renderHome === 'function') {
        renderHome();
      }
    }
  } catch (e) {
    console.error('Erro na sincronização:', e);
  } finally {
    _syncing = false;
    // marca o fim desta tentativa (base do throttle dos próximos syncs)
    _lastSyncAt = Date.now();
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
    btn.classList.add('auth-btn-logado');
  } else {
    btn.innerHTML = `<span class="auth-login-btn">Entrar</span>`;
    btn.onclick = () => loginComGoogle();
    btn.classList.remove('auth-btn-logado');
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
  if (user && !erajLogado) _syncProfiles(true); // força no login detectado (abertura/F5)
});

// Expõe para os outros módulos (storage.js é script clássico)
window.loginComGoogle    = loginComGoogle;
window.logoutGoogle      = logoutGoogle;
window._updateAuthUI     = _updateAuthUI;
window._cloudSaveProfile = _cloudSaveProfile;
window._cloudDeleteProfile = _cloudDeleteProfile;
window._syncProfiles     = _syncProfiles;
window._resgatarCupom    = _resgatarCupom;
window._db               = _db;
