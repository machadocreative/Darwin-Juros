// ── STORAGE ──
function loadProfiles() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch (e) { return []; }
}

function saveProfiles(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function ultimaPercPaga(mesArr) {
  // percorre de trás para frente e acha a última linha paga não bloqueada
  for (let i = mesArr.length - 1; i >= 0; i--) {
    if (mesArr[i].pago && !mesArr[i].bloqueado) return mesArr[i].perc;
  }
  return null;
}

function saveProfile(premiumFlag) {
  const profiles = loadProfiles();
  const existente = profiles.find(p => p.id === (currentProfileId || ''));
  const data = {
    id: currentProfileId || Date.now().toString(),
    nome: form.nomeSimulacao || 'Apto 101',
    form: { ...form },
    meses: JSON.parse(JSON.stringify(meses)),
    savedAt: new Date().toISOString(),
    // preserva flag premium existente; aplica novo se passado
    premium: premiumFlag === true ? true : (existente?.premium || false)
  };
  const idx = profiles.findIndex(p => p.id === data.id);
  if (idx >= 0) profiles[idx] = data; else profiles.push(data);
  currentProfileId = data.id;
  saveProfiles(profiles);
  hasUnsavedChanges = false;
  showToast('Perfil salvo com sucesso!');
}

function deleteProfile(id) {
  const card = document.getElementById('pc-' + id);
  if (!card) return;
  if (card.dataset.confirming === '1') {
    saveProfiles(loadProfiles().filter(p => p.id !== id));
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
  hideBottomNav();
  renderResult();
}
