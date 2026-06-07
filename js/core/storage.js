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
    // preserva o ícone escolhido pelo usuário (default tratado na renderização)
    icon: existente?.icon || undefined,
    // preserva preferência de suprimir aviso de obra incompleta
    skipAvisoObra: existente?.skipAvisoObra || undefined
  };
  const idx = profiles.findIndex(p => p.id === data.id);
  if (idx >= 0) profiles[idx] = data; else profiles.push(data);
  currentProfileId = data.id;
  saveProfiles(profiles);
  hasUnsavedChanges = false;
  showToast(toastMsg);
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
  if (p.premium) {
    // Premium: restaura tabela salva e reaplica TR do JSON nas parcelas não pagas.
    meses = JSON.parse(JSON.stringify(p.meses));
    const ini = parseMS(form.mesInicial);
    meses.forEach((r, i) => {
      if (r.pago) return;
      const ym = addM(ini, i);
      const trNova = getTRParaMes(ym);
      if (r.tr !== trNova) { r.tr = trNova; recalcRow(i); }
    });
  } else {
    // Free: recalcula a tabela completa — sem dados de usuário a preservar,
    // garante que novos meses apareçam e TR fique atualizada.
    meses = calcTable();
  }

  screen = 'result';
  hasUnsavedChanges = false;
  renderResult();
}
