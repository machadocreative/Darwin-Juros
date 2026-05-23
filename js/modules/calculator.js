// ── TR HISTÓRICO ──
// Cache do JSON carregado uma vez
let _trCache = null;

async function _loadTRCache() {
  if (_trCache) return _trCache;
  try {
    const res = await fetch('tr-historico.json');
    _trCache = await res.json();
  } catch (e) {
    _trCache = {};
  }
  return _trCache;
}

// Retorna TR para um mês {y, m} em decimal (ex: 0.001687)
// Se o JSON não tiver o mês ou o valor for null → retorna 0
function getTRParaMes(ym) {
  if (!ym) return 0;
  const key = ym.y + '-' + String(ym.m).padStart(2, '0');
  if (!_trCache) return 0;
  const val = _trCache[key];
  if (val === null || val === undefined) return 0;
  // Os valores no JSON já estão em % (ex: 0.1687 = 0,1687%)
  // Precisamos em decimal para multiplicar pelo saldo: dividir por 100
  return val / 100;
}

// Inicializa o cache do JSON antes de qualquer cálculo
// Chamada uma vez no main.js
function initTRCache(data) {
  _trCache = data;
}

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
  const tm  = parseFloat(form.taxaAnual) / 100 / 12;
  const sMax = fin - ter;
  const ini  = parseMS(form.mesInicial), ent = parseMS(form.mesEntrega);
  const totalParcelas = Math.min(mBetween(ini, ent) + 1, MAX_MESES);
  const rows = [];
  for (let i = 0; i < totalParcelas; i++) {
    const ym    = addM(ini, i);
    const tr    = getTRParaMes(ym); // 0 se mês futuro (null no JSON) ou ausente
    const perc  = totalParcelas === 1 ? 0 : parseFloat(((i / (totalParcelas - 1)) * 100).toFixed(1));
    const saldo = ter + sMax * (perc / 100);
    rows.push({
      mes: mLabel(ym),
      perc,
      saldo,
      tr,
      previsto: (tm + tr) * saldo + enc,
      pago: false,
      bloqueado: false,
      valorReal: null
    });
  }
  return rows;
}

function recalcRow(i) {
  const r   = meses[i];
  const fin = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100);
  const ter = parseFloat(form.valorTerreno);
  const enc = parseFloat(form.seguro || 0) + parseFloat(form.taxaAdm || 25);
  const tm  = parseFloat(form.taxaAnual) / 100 / 12;
  r.saldo   = ter + (fin - ter) * (r.perc / 100);
  // Mantém a TR que já está na linha (editada pelo usuário ou vinda do JSON)
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

function _proximoMesYM() {
  const ini = parseMS(form.mesInicial);
  return addM(ini, meses.length);
}

// Retorna o mês/ano da última parcela ativa (não bloqueada)
function ultimoMesAtivo() {
  const ativas = meses.filter(r => !r.bloqueado);
  return ativas.length ? ativas[ativas.length - 1].mes : mLabel(parseMS(form.mesInicial));
}

function adicionarLinha() {
  if (meses.length >= MAX_MESES) return;
  const fin   = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100);
  const ter   = parseFloat(form.valorTerreno);
  const enc   = parseFloat(form.seguro || 0) + parseFloat(form.taxaAdm || 25);
  const tm    = parseFloat(form.taxaAnual) / 100 / 12;
  const perc  = Math.min(meses[meses.length - 1]?.perc || 0, 100);
  const saldo = ter + (fin - ter) * (perc / 100);
  const ym    = _proximoMesYM();
  const tr    = getTRParaMes(ym);
  meses.push({
    mes: mLabel(ym),
    perc,
    saldo,
    tr,
    previsto: (tm + tr) * saldo + enc,
    pago: false,
    bloqueado: false,
    valorReal: null
  });
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

// ── SLIDER DE % DE EVOLUÇÃO ──
// TR sempre zerada em todos os sliders (free, premium, rápido)
function calcPreviewSlider(perc) {
  const fin   = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100);
  const ter   = parseFloat(form.valorTerreno);
  const enc   = parseFloat(form.seguro || 0) + parseFloat(form.taxaAdm || 25);
  const tm    = parseFloat(form.taxaAnual) / 100 / 12;
  const saldo = ter + (fin - ter) * (perc / 100);
  const previsto = tm * saldo + enc; // TR = 0
  return { saldo, previsto };
}

function atualizaSlider() {
  const slider = document.getElementById('preview-slider');
  if (!slider) return;
  const perc = parseInt(slider.value);
  const { saldo, previsto } = calcPreviewSlider(perc);
  const elPerc  = document.getElementById('slider-perc');
  const elVal   = document.getElementById('slider-val');
  const elSaldo = document.getElementById('slider-saldo');

  if (elVal)   elVal.innerHTML = `${fmtBRL(previsto)} <small>+ TR Mensal</small>`;
  if (elSaldo) elSaldo.textContent = fmtBRL(saldo);

  const bloco = document.getElementById('slider-fin-bloco');
  if (bloco && parseFloat(form.parcelaFinanciamento || 0) > 0) {
    const fin  = parseFloat(form.parcelaFinanciamento);
    const diff = fin - previsto;
    bloco.className = 'slider-fin-bloco' + (diff < 0 ? ' slider-fin-danger' : '');
    bloco.innerHTML = diff < 0
      ? `🚨 Evolução de obra supera o financiamento em <span>+<strong>${fmtBRL(Math.abs(diff))}</strong></span>`
      : `<span><strong>${fmtBRL(diff)}</strong></span> para igualar a parcela de financiamento`;
  }

  if (isPremium()) {
    const percPaga = _ultimaPercPagaAtual();
    if (elPerc) {
      elPerc.textContent = perc + '%' + (percPaga > 0 && perc <= percPaga ? ' · já pago' : '');
    }
    _applySliderTrack(slider, percPaga, perc);
  } else {
    if (elPerc) elPerc.textContent = perc + '%';
    slider.style.background = `linear-gradient(to right, var(--accent) ${perc}%, var(--border) ${perc}%)`;
  }
}
