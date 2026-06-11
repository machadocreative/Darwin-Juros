// ── STORAGE ──
// Leitura/escrita local (localStorage) com sincronização em nuvem (Firestore)
// em segundo plano quando há usuário logado.

function loadProfiles() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch (e) { return []; }
}

function saveProfiles(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

// ── TOMBSTONES (marcas de exclusão) ──
// Guarda os IDs de perfis excluídos para que o merge da nuvem não os
// "ressuscite". Sem isso, um perfil ainda presente no localStorage de outro
// dispositivo seria regravado na nuvem no próximo sync. Cada tombstone guarda
// quando foi criado, permitindo expirá-los depois de um tempo.
const TOMBSTONE_KEY = 'juros_obra_excluidos';
const TOMBSTONE_TTL_MS = 1000 * 60 * 60 * 24 * 90; // 90 dias

function loadTombstones() {
  try {
    const arr = JSON.parse(localStorage.getItem(TOMBSTONE_KEY) || '[]');
    // expira marcas antigas para a lista não crescer indefinidamente
    const agora = Date.now();
    const vivas = arr.filter(t => t && t.id && (agora - (t.at || 0)) < TOMBSTONE_TTL_MS);
    if (vivas.length !== arr.length) {
      localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(vivas));
    }
    return vivas;
  } catch (e) { return []; }
}

function tombstoneIds() {
  return new Set(loadTombstones().map(t => t.id));
}

// Marca um perfil como excluído. Idempotente.
function addTombstone(id) {
  if (!id) return;
  const arr = loadTombstones();
  if (!arr.some(t => t.id === id)) {
    arr.push({ id, at: Date.now() });
    localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(arr));
  }
}

// Remove a marca de exclusão (ex.: o usuário recria/recebe o mesmo id de novo).
function clearTombstone(id) {
  if (!id) return;
  const arr = loadTombstones().filter(t => t.id !== id);
  localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(arr));
}

// ── PATCH de perfil (mutação parcial consistente) ──
// Aplica uma alteração pontual (renomear, trocar ícone, ativar premium) de
// forma consistente: atualiza savedAt (para vencer o desempate do merge na
// nuvem), grava local E sincroniza em background. Centraliza o que antes
// estava repetido — e propenso a esquecer o sync/savedAt — em cada função.
function patchProfile(id, mutator) {
  if (!id || typeof mutator !== 'function') return null;
  const profiles = loadProfiles();
  const idx = profiles.findIndex(p => p.id === id);
  if (idx < 0) return null;

  mutator(profiles[idx]);
  profiles[idx].savedAt = new Date().toISOString();
  saveProfiles(profiles);

  if (window.currentUser && typeof window._cloudSaveProfile === 'function') {
    window._cloudSaveProfile(profiles[idx]);
  }
  return profiles[idx];
}

// Exclusão consistente: remove local, marca tombstone e remove da nuvem.
function removeProfile(id) {
  if (!id) return;
  saveProfiles(loadProfiles().filter(p => p.id !== id));
  addTombstone(id);
  if (window.currentUser && typeof window._cloudDeleteProfile === 'function') {
    window._cloudDeleteProfile(id);
  }
}

function ultimaPercPaga(mesArr) {
  // percorre de trás para frente e acha a última linha paga não bloqueada
  for (let i = mesArr.length - 1; i >= 0; i--) {
    if (mesArr[i].pago && !mesArr[i].bloqueado) return mesArr[i].perc;
  }
  return null;
}

// Espelho dos valores efetivamente usados no cálculo.
// NÃO altera os campos originais do form (preserva a distinção vazio vs. zero
// de que taxaAdmValor() depende). Serve apenas para refletir na nuvem o valor
// real aplicado — útil para conferência, backup e suporte ao usuário.
function _valoresEfetivos() {
  const ef = {
    taxaAdm: taxaAdmValor(form.taxaAdm),       // vazio → 25; "0" digitado → 0
    seguro: parseFloat(form.seguro || 0)        // vazio → 0
  };
  // percFinanciado é calculado em tempo real (não é mais input).
  // Grava o valor real exibido, em vez do resíduo "80" do objeto form.
  const vt = parseFloat(form.valorTotal || 0);
  const vf = parseFloat(form.valorFinanciado || 0);
  if (vt > 0 && vf > 0) {
    ef.percFinanciado = parseFloat(((vf / vt) * 100).toFixed(2));
  }
  return ef;
}

function saveProfile(premiumFlag, toastMsg = 'Alterações salvas com sucesso!') {
  const profiles = loadProfiles();
  const existente = profiles.find(p => p.id === (currentProfileId || ''));
  const data = {
    id: currentProfileId || Date.now().toString(),
    nome: form.nomeSimulacao || 'Apto 101',
    form: { ...form },
    meses: JSON.parse(JSON.stringify(meses)),
    savedAt: new Date().toISOString(),
    // preserva flag premium existente; aplica novo se passado
    premium: premiumFlag === true ? true : (existente?.premium || false),
    // espelho dos valores reais usados no cálculo (apenas para a nuvem)
    _efetivo: _valoresEfetivos()
  };
  // Preserva o ícone do perfil. saveProfile reconstrói o objeto do zero; sem
  // isto, qualquer save (ex.: após a tela de edição) apagaria o ícone
  // escolhido, voltando ao padrão. Só inclui a chave se houver um ícone, para
  // não gravar `icon: undefined`.
  if (existente?.icon) data.icon = existente.icon;
  const idx = profiles.findIndex(p => p.id === data.id);
  if (idx >= 0) profiles[idx] = data; else profiles.push(data);
  currentProfileId = data.id;
  // perfil (re)criado/salvo deixa de estar "excluído" — evita que um
  // tombstone antigo do mesmo id o derrube no próximo sync
  clearTombstone(data.id);
  saveProfiles(profiles);
  hasUnsavedChanges = false;

  // Sincroniza com a nuvem em segundo plano (se logado)
  if (window.currentUser && typeof window._cloudSaveProfile === 'function') {
    window._cloudSaveProfile(data);
  }

  showToast(toastMsg);
}

function deleteProfile(id) {
  const card = document.getElementById('pc-' + id);
  if (!card) return;
  if (card.dataset.confirming === '1') {
    removeProfile(id);
    showToast('Perfil excluído.');
    renderProfiles();
    return;
  }
  card.dataset.confirming = '1';
  const btn = document.getElementById('del-' + id);
  if (btn) { btn.textContent = 'Confirmar?'; btn.style.color = 'var(--danger)'; btn.style.borderColor = 'var(--danger)'; }
  setTimeout(() => {
    if (card && card.dataset.confirming === '1') {
      card.dataset.confirming = '0';
      if (btn) { btn.textContent = 'Excluir'; btn.style.color = ''; btn.style.borderColor = ''; }
    }
  }, 4000);
}

function loadProfile(id) {
  const p = loadProfiles().find(p => p.id === id);
  if (!p) return;
  currentProfileId = p.id;
  Object.assign(form, p.form);
  meses = JSON.parse(JSON.stringify(p.meses));
  screen = 'result';
  hasUnsavedChanges = false;
  renderResult();
}
