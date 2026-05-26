// ── TELA HISTÓRICO DA TR ──

let _trhMesSel = null;

function renderTRHistorico() {
  screen = 'trHistorico';
  showBottomNav();
  _trhMesSel = null;

  const data = window._trHistorico || {};
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  const byYear = {};
  Object.entries(data)
    .filter(([, v]) => v !== null && v !== undefined)
    .forEach(([key, val]) => {
      const year = key.split('-')[0];
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push({ key, val });
    });

  const rows = Object.entries(byYear)
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => `
      <div class="section-label">${year}</div>
      <div class="tr-table">
        ${items.map(({ key, val }) => {
          const mm = parseInt(key.split('-')[1], 10);
          const isZero = val === 0;
          const shortLabel = months[mm - 1] + '/' + key.split('-')[0].slice(2);
          return `<div class="tr-row" id="trh-row-${key}" onclick="_trhSelectRow('${key}', ${val}, '${shortLabel}')">
            <span class="tr-mes">${months[mm - 1]}</span>
            <span class="tr-val${isZero ? ' tr-zero' : ''}">${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}%</span>
          </div>`;
        }).join('')}
      </div>`).join('');

  setHtml(`
    <button class="btn-screen-back" onclick="renderHome()">← Voltar</button>
    <div class="screen-title">Histórico da TR</div>
    <div class="screen-sub">Taxa Referencial mensal divulgada pelo Banco Central do Brasil. Utilizada nos cálculos de evolução de obra.</div>

    <div class="diff-box trh-sticky">
      <div class="d-title">Simule sua taxa com a TR</div>
      <div class="trh-input-row">
        <label class="trh-input-label">Sua taxa de juros anual</label>
        <div class="input-wrap">
          <input type="text" id="trh-taxa-input" class="has-suf" placeholder="5,0000" inputmode="numeric">
          <span class="suf">% a.a.</span>
        </div>
      </div>
      <div id="trh-breakdown" style="display:none">
        <div class="diff-row"><span class="d-label">Sua taxa de juros mensal</span><span class="d-val" id="trh-mensal">—</span></div>
        <div class="diff-row"><span class="d-label">(+) TR de <span id="trh-mes-label">—</span></span><span class="d-val" id="trh-tr-val">—</span></div>
        <hr class="diff-divider">
        <div class="diff-row hl"><span class="d-label">Sua taxa de juros neste mês</span><span class="d-val" id="trh-soma-val">—</span></div>
      </div>
      <div class="info-box" id="trh-hint">💡 Digite sua taxa anual e selecione um mês para ver o cálculo.</div>
    </div>

    ${rows}
  `);

  setTimeout(() => {
    attachMask('trh-taxa-input', 'perc4', '');
    const el = document.getElementById('trh-taxa-input');
    if (el) el.oninput = () => { maskValue(el, 'perc4'); _trhAtualizaTaxa(); };
  }, 0);
}

function _trhAtualizaTaxa() {
  const el = document.getElementById('trh-taxa-input');
  if (!el) return;
  const anual = maskRead(el);
  if (!anual || anual <= 0 || isNaN(anual)) {
    const bd = document.getElementById('trh-breakdown');
    const hint = document.getElementById('trh-hint');
    if (bd) bd.style.display = 'none';
    if (hint) hint.style.display = '';
    return;
  }
  const mensal = anual / 12;
  const elMensal = document.getElementById('trh-mensal');
  if (elMensal) elMensal.textContent = fmtPerc(mensal, 4);
  const hint = document.getElementById('trh-hint');
  if (hint) hint.style.display = 'none';
  if (_trhMesSel) _trhUpdateBreakdown(mensal);
}

function _trhSelectRow(key, val, label) {
  if (_trhMesSel) {
    const prev = document.getElementById('trh-row-' + _trhMesSel.key);
    if (prev) prev.classList.remove('tr-row-selected');
  }
  _trhMesSel = { key, val, label };
  const row = document.getElementById('trh-row-' + key);
  if (row) row.classList.add('tr-row-selected');

  const el = document.getElementById('trh-taxa-input');
  const anual = el ? maskRead(el) : NaN;
  if (!anual || anual <= 0 || isNaN(anual)) {
    const hint = document.getElementById('trh-hint');
    if (hint) { hint.textContent = '💡 Digite sua taxa anual acima para ver o cálculo.'; hint.style.display = ''; }
    return;
  }
  const mensal = anual / 12;
  const elMensal = document.getElementById('trh-mensal');
  if (elMensal) elMensal.textContent = fmtPerc(mensal, 4);
  _trhUpdateBreakdown(mensal);
}

function _trhUpdateBreakdown(mensal) {
  if (!_trhMesSel) return;
  const { val, label } = _trhMesSel;
  const soma = mensal + val;
  document.getElementById('trh-mes-label').textContent = label;
  document.getElementById('trh-tr-val').textContent = fmtPerc(val, 4);
  document.getElementById('trh-soma-val').textContent = fmtPerc(soma, 4);
  document.getElementById('trh-breakdown').style.display = '';
  const hint = document.getElementById('trh-hint');
  if (hint) hint.style.display = 'none';
}
