// ── PREMIUM ──
// O status premium fica gravado dentro do próprio perfil no localStorage.
function isPremium() {
  if (!currentProfileId) return false;
  const p = loadProfiles().find(p => p.id === currentProfileId);
  return p?.premium === true;
}

function ativarPremiumPerfil() {
  if (!currentProfileId) {
    // perfil ainda não foi salvo — salva primeiro, depois ativa
    saveProfile(true);
    return;
  }
  const profiles = loadProfiles();
  const idx = profiles.findIndex(p => p.id === currentProfileId);
  if (idx >= 0) { profiles[idx].premium = true; saveProfiles(profiles); }
}

// ── CÁLCULO ──
function calcTable() {
  const fin = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100);
  const ter = parseFloat(form.valorTerreno);
  const enc = parseFloat(form.seguro || 0) + parseFloat(form.taxaAdm || 25);
  const tm = parseFloat(form.taxaAnual) / 100 / 12;
  const sMax = fin - ter;
  const ini = parseMS(form.mesInicial), ent = parseMS(form.mesEntrega);
  // total de parcelas = diferença de meses + 1 (inclui o mês inicial)
  const totalParcelas = Math.min(mBetween(ini, ent) + 1, MAX_MESES);
  const rows = [];
  for (let i = 0; i < totalParcelas; i++) {
    const ym = addM(ini, i);
    // parcela 1 (i=0): 0% de obra, saldo = terreno
    // últimas parcelas chegam a 100%
    const perc = totalParcelas === 1 ? 0 : parseFloat(((i / (totalParcelas - 1)) * 100).toFixed(1));
    const saldo = ter + sMax * (perc / 100);
    rows.push({ mes: mLabel(ym), perc, saldo, tr: form.trInicial, previsto: (tm + form.trInicial) * saldo + enc, pago: false, bloqueado: false });
  }
  return rows;
}

function recalcRow(i) {
  const r = meses[i];
  const fin = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100);
  const ter = parseFloat(form.valorTerreno);
  const enc = parseFloat(form.seguro || 0) + parseFloat(form.taxaAdm || 25);
  const tm = parseFloat(form.taxaAnual) / 100 / 12;
  r.saldo = ter + (fin - ter) * (r.perc / 100);
  r.previsto = (tm + r.tr) * r.saldo + enc;
}

function aplicaBloqueio() {
  let found = false;
  meses.forEach(r => {
    if (found) { r.bloqueado = true; }
    else if (r.perc >= 100) { found = true; r.bloqueado = false; }
    else { r.bloqueado = false; }
  });
}

function proximoMes() {
  const ini = parseMS(form.mesInicial);
  return mLabel(addM(ini, meses.length));
}

// Retorna o mês/ano da última parcela ativa (não bloqueada)
function ultimoMesAtivo() {
  const ativas = meses.filter(r => !r.bloqueado);
  return ativas.length ? ativas[ativas.length - 1].mes : mLabel(parseMS(form.mesInicial));
}

function adicionarLinha() {
  if (meses.length >= MAX_MESES) return;
  const fin = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100);
  const ter = parseFloat(form.valorTerreno);
  const enc = parseFloat(form.seguro || 0) + parseFloat(form.taxaAdm || 25);
  const tm = parseFloat(form.taxaAnual) / 100 / 12;
  const perc = Math.min(meses[meses.length - 1]?.perc || 0, 100);
  const saldo = ter + (fin - ter) * (perc / 100);
  meses.push({ mes: proximoMes(), perc, saldo, tr: form.trInicial, previsto: (tm + form.trInicial) * saldo + enc, pago: false, bloqueado: false });
  aplicaBloqueio();
  hasUnsavedChanges = true;
  renderResult();
}

function removerLinha() {
  const last = meses[meses.length - 1];
  if (!last || last.pago || meses.length <= 1) return;
  meses.pop();
  aplicaBloqueio();
  hasUnsavedChanges = true;
  renderResult();
}

// ── SLIDER DE % DE EVOLUÇÃO (versão free) ──
function calcPreviewSlider(perc) {
  const fin = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100);
  const ter = parseFloat(form.valorTerreno);
  const enc = parseFloat(form.seguro || 0) + parseFloat(form.taxaAdm || 25);
  const tm = parseFloat(form.taxaAnual) / 100 / 12;
  const saldo = ter + (fin - ter) * (perc / 100);
  const previsto = tm * saldo + enc; // Na previsão do slider NÃO é considerada a TR
  return { saldo, previsto };
}

function atualizaSlider() {
  const slider = document.getElementById('preview-slider');
  if (!slider) return;
  const perc = parseInt(slider.value);
  const { saldo, previsto } = calcPreviewSlider(perc);
  const elPerc = document.getElementById('slider-perc');
  const elVal = document.getElementById('slider-val');
  const elSaldo = document.getElementById('slider-saldo');
  if (elPerc) elPerc.textContent = perc + '%';
  if (elVal) elVal.innerHTML = `${fmtBRL(previsto)} <small> + TR Mensal</small>`;
  if (elSaldo) elSaldo.textContent = fmtBRL(saldo);
  const pct = (perc / 100) * 100;
  slider.style.background = `linear-gradient(to right, var(--accent) ${pct}%, var(--border) ${pct}%)`;
}
