// ── TELA DE PERFIS ──
function goProfiles() { renderProfiles(); }

function renderProfiles() {
  screen = 'profiles';
  showBottomNav();
  setNavActive('perfis');

  const profiles = loadProfiles().sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

  const list = profiles.length
    ? profiles.map(p => {
        const perc = ultimaPercPaga(p.meses);
        return `<div class="profile-card" id="pc-${p.id}" onclick="loadProfile('${p.id}')">
          <div class="pf-avatar">🏠</div>
          <div class="pf-content">
            <div class="pf-name">${escHtml(p.nome)}${p.premium ? ' <span class="pc-premium-badge">✦</span>' : ''}</div>
            <div class="pf-info">${p.meses.length} parcelas · salvo ${fmtDateRelative(p.savedAt)}</div>
          </div>
          <div class="pf-stats">
            <div class="pf-stats-num">${perc !== null ? perc + '%' : '—'}</div>
            <div class="pf-stats-label">Obra</div>
          </div>
        </div>
        <div class="pc-actions" onclick="event.stopPropagation()" style="margin-top:-6px;margin-bottom:10px;display:flex;gap:6px;padding:0 2px">
          <button class="pc-btn" onclick="abrirRenomearPerfil('${p.id}')">✏️ Renomear</button>
          <button class="pc-btn del" id="del-${p.id}" onclick="deleteProfile('${p.id}')">🗑️ Excluir</button>
        </div>`;
      }).join('')
    : `<div class="empty-state"><div class="es-icon">🏢</div><p>Nenhum perfil salvo ainda.<br>Inicie uma <strong>Simulação Completa</strong> para salvar seu primeiro imóvel.</p></div>`;

  setHtml(`
    <div class="greeting">
      <div class="greeting-row">
        <div class="greeting-logo">📁</div>
        <div class="greeting-title">Meus Imóveis</div>
      </div>
      <div class="greeting-sub">Gerencie e acompanhe seus financiamentos</div>
    </div>
    ${profiles.length ? `<div class="section-label">${profiles.length} perfil${profiles.length > 1 ? 'is' : ''} salvo${profiles.length > 1 ? 's' : ''}</div>` : ''}
    <div class="profile-list">${list}</div>
    <button class="btn-add-profile" onclick="renderBifurcacao()">+ Nova simulação</button>
  `);
}

// ── EXCLUIR PERFIL A PARTIR DA TELA DE RESULTADO ──
function deleteProfileFromResult() {
  const btn = document.getElementById('rh-btn-del');
  if (!btn) return;
  if (btn.dataset.confirming === '1') {
    if (currentProfileId) {
      saveProfiles(loadProfiles().filter(p => p.id !== currentProfileId));
      currentProfileId = null;
      showToast('Perfil excluído.');
    }
    goProfiles();
    return;
  }
  btn.dataset.confirming = '1';
  btn.textContent = '⚠️ Confirmar?';
  btn.style.color = 'var(--danger)';
  btn.style.borderColor = 'var(--danger)';
  setTimeout(() => {
    if (btn && btn.dataset.confirming === '1') {
      btn.dataset.confirming = '0';
      btn.textContent = '🗑️ Excluir';
      btn.style.color = '';
      btn.style.borderColor = '';
    }
  }, 4000);
}

// ── EDIÇÃO INLINE DA TABELA ──
function togglePago(i) {
  const r = meses[i];
  if (r.bloqueado) return;
  if (!r.pago) {
    for (let j = 0; j < i; j++) {
      if (!meses[j].bloqueado && !meses[j].pago) { showToast('⚠️ Marque primeiro a parcela de ' + meses[j].mes + '.'); return; }
    }
    r.pago = true;
    hasUnsavedChanges = true;
    if (r.perc >= 100) setTimeout(showCelebration, 300);
  } else {
    for (let j = i + 1; j < meses.length; j++) {
      if (!meses[j].bloqueado && meses[j].pago) { showToast('⚠️ Desmarque primeiro a parcela de ' + meses[j].mes + '.'); return; }
    }
    r.pago = false;
    hasUnsavedChanges = true;
  }
  refreshTable();
}

function updatePerc(i, rawVal) {
  const el = document.getElementById('pi-' + i);
  if (meses[i].pago) {
    if (el) el.value = meses[i].perc;
    showToast('⚠️ Desmarque "Pago" antes de editar a % desta parcela.');
    return;
  }
  const v = parseDecimal(rawVal);
  if (rawVal === '' || isNaN(v) || v < 0 || v > 100) { if (el) el.classList.add('invalid'); return; }

  let prevPerc = -1;
  for (let j = i - 1; j >= 0; j--) {
    if (!meses[j].bloqueado) { prevPerc = meses[j].perc; break; }
  }
  if (v < prevPerc) {
    if (el) { el.classList.add('invalid'); el.title = 'O valor não pode ser menor que a linha anterior (' + prevPerc + '%).'; }
    showToast('⚠️ % de obra não pode ser menor que a linha anterior: ' + prevPerc + '%');
    return;
  }

  if (el) { el.classList.remove('invalid'); el.title = ''; }
  meses[i].perc = v;
  recalcRow(i);
  aplicaBloqueio();
  hasUnsavedChanges = true;
  refreshTable();
}

function validatePercBlur(i) {
  const el = document.getElementById('pi-' + i); if (!el) return;
  const v = parseDecimal(el.value);
  if (el.value === '' || isNaN(v) || v < 0 || v > 100) { el.classList.add('invalid'); }
  else { el.classList.remove('invalid'); }
}

function updateTR(i, rawVal) {
  const el = document.getElementById('ti-' + i);
  const v = parseDecimal(rawVal);
  if (rawVal === '' || isNaN(v) || v < 0) { if (el) el.classList.add('invalid'); return; }
  if (el) { el.classList.remove('invalid'); el.title = ''; }
  meses[i].tr = v / 100;
  recalcRow(i);
  hasUnsavedChanges = true;
  const elP = document.getElementById('rp-' + i);
  if (elP) elP.textContent = meses[i].bloqueado ? '—' : fmtBRL(meses[i].previsto);
  updateSummary();
}

function validateTRBlur(i) {
  const el = document.getElementById('ti-' + i); if (!el) return;
  const v = parseDecimal(el.value);
  if (el.value === '' || isNaN(v) || v < 0) { el.classList.add('invalid'); }
  else { el.classList.remove('invalid'); }
}

// ── REFRESH DA TABELA (atualização sem re-render completo) ──
function refreshTable() {
  meses.forEach((r, i) => {
    const row = document.getElementById('row-' + i); if (!row) return;
    row.className = r.bloqueado ? 'obra-done' : r.pago ? 'pago-row' : '';
    const pi = document.getElementById('pi-' + i);
    if (pi) {
      pi.disabled = r.bloqueado;
      if (!r.bloqueado) pi.value = r.perc;
      pi.classList.toggle('perc-locked', r.pago && !r.bloqueado);
    }
    const ti = document.getElementById('ti-' + i);
    if (ti) ti.disabled = r.bloqueado;
    const rs = document.getElementById('rs-' + i);
    if (rs) rs.textContent = r.bloqueado ? '—' : fmtBRL(r.saldo);
    const rp = document.getElementById('rp-' + i);
    if (rp) rp.textContent = r.bloqueado ? '—' : fmtBRL(r.previsto);
    const rv = document.getElementById('rv-' + i);
    if (rv) {
      if (r.bloqueado) {
        rv.innerHTML = '—';
      } else if (r.pago) {
        rv.innerHTML = r.valorReal ? `<span class="rv-val">${fmtBRL(r.valorReal)}</span>` : '—';
      } else {
        rv.innerHTML = `<input id="rv-input-${i}" class="rv-input" type="text" inputmode="numeric" placeholder="—">`;
        setTimeout(() => _initSingleRvMask(i), 0);
      }
    }
    const bp = document.getElementById('bp-' + i);
    if (bp) {
      if (r.bloqueado)    bp.outerHTML = `<span id="bp-${i}" class="badge-blocked">—</span>`;
      else if (r.pago)    bp.outerHTML = `<button id="bp-${i}" class="badge-pago" onclick="togglePago(${i})">✓ Pago</button>`;
      else                bp.outerHTML = `<button id="bp-${i}" class="badge-nao" onclick="togglePago(${i})">—</button>`;
    }
  });
  const btnAdd = document.getElementById('btn-add'), btnRem = document.getElementById('btn-rem');
  if (btnAdd) btnAdd.disabled = meses.length >= MAX_MESES;
  if (btnRem) { const last = meses[meses.length - 1]; btnRem.disabled = meses.length <= 1 || (last && last.pago); }
  const sub = document.getElementById('result-subtitle');
  const ativasCount = meses.filter(r => !r.bloqueado).length;
  const subText = ativasCount + ' parcelas · ' + (meses[0]?.mes || '') + ' → ' + ultimoMesAtivo();
  if (sub) sub.textContent = subText;
  // Atualiza banner de pagas pendentes
  _refreshBannerPagas();
  // Sincroniza faixa do slider premium
  _syncSliderPremium();
  updateSummary();
}

function updateSummary() {
  const ativas    = meses.filter(r => !r.bloqueado);
  const total        = ativas.reduce((s, r) => s + r.previsto, 0);
  const pagoPrevisto = ativas.filter(r => r.pago).reduce((s, r) => s + r.previsto, 0);
  const media        = ativas.length ? total / ativas.length : 0;
  const totalReal    = ativas.reduce((s, r) => s + (r.valorReal || 0), 0);
  const diff         = totalReal - total;
  const e = id => document.getElementById(id);
  if (e('sum-total')) e('sum-total').textContent = fmtBRL(total);
  if (e('sum-pago'))  e('sum-pago').textContent  = fmtBRL(totalReal > 0 ? totalReal : pagoPrevisto);
  if (e('sum-media')) e('sum-media').textContent = fmtBRL(media);
  if (e('sum-comp-previsto')) e('sum-comp-previsto').textContent = fmtBRL(total);
  if (e('sum-real'))  e('sum-real').textContent  = fmtBRL(totalReal);
  if (e('sum-diff')) {
    e('sum-diff').textContent = (diff >= 0 ? '+' : '−') + ' ' + fmtBRL(Math.abs(diff));
    e('sum-diff').className = 'comp-val' + (diff > 100 ? ' val-over' : diff < -100 ? ' val-under' : '');
  }
  const blocoComp = document.getElementById('bloco-comparacao');
  if (blocoComp) blocoComp.style.display = totalReal > 0 ? '' : 'none';
}

// ── VALOR REAL: edição inline na tabela ──

function _atualizaRvRow(i) {
  const el = document.getElementById('rv-input-' + i);
  if (!el || meses[i].bloqueado || meses[i].pago) return;
  const v = maskRead(el);
  if (v !== null && !isNaN(v) && v >= 0) {
    el.classList.remove('invalid');
    meses[i].valorReal = v > 0 ? v : null;
    hasUnsavedChanges = true;
    _syncValorRealToForm(i);
    updateSummary();
  } else {
    el.classList.add('invalid');
  }
}

function _syncValorRealToForm(mesIdx) {
  const ativas = meses.filter(r => !r.bloqueado);
  const j = ativas.indexOf(meses[mesIdx]);
  if (j < 0) return;
  if (!form.historicoPagamentos) form.historicoPagamentos = [];
  while (form.historicoPagamentos.length <= j) form.historicoPagamentos.push({ valor: 0 });
  form.historicoPagamentos[j] = { valor: meses[mesIdx].valorReal || 0 };
}

function _initSingleRvMask(i) {
  const r = meses[i];
  if (!r || r.bloqueado || r.pago) return;
  attachMask('rv-input-' + i, 'brl', r.valorReal || '');
  const el = document.getElementById('rv-input-' + i);
  if (el) el.oninput = () => { maskValue(el, 'brl'); _atualizaRvRow(i); };
}

function _initRvMasks() {
  meses.forEach((_, i) => _initSingleRvMask(i));
}

// ── HELPER: linhas da tabela ──
function _buildTableRows() {
  return meses.map((r, i) => `
    <tr id="row-${i}" class="${r.bloqueado ? 'obra-done' : r.pago ? 'pago-row' : ''}">
      <td class="num-col">${i + 1}</td>
      <td class="td-mes">${escHtml(r.mes)}</td>
      <td class="td-right">
        <input id="pi-${i}" class="perc-input${r.pago ? ' perc-locked' : ''}" type="text" inputmode="decimal" value="${r.perc}"
          ${r.bloqueado ? 'disabled' : ''}
          onchange="updatePerc(${i},this.value)"
          onblur="validatePercBlur(${i})">
      </td>
      <td id="rs-${i}" class="val-col">${r.bloqueado ? '—' : fmtBRL(r.saldo)}</td>
      <td class="td-right">
        <input id="ti-${i}" class="tr-input" type="text" inputmode="decimal" value="${(r.tr * 100).toFixed(4)}"
          ${r.bloqueado ? 'disabled' : ''}
          onchange="updateTR(${i},this.value)"
          onblur="validateTRBlur(${i})">
      </td>
      <td id="rp-${i}" class="val-col td-prev">${r.bloqueado ? '—' : fmtBRL(r.previsto)}</td>
      <td id="rv-${i}" class="val-col td-right">
        ${r.bloqueado
          ? '—'
          : r.pago
            ? (r.valorReal ? `<span class="rv-val">${fmtBRL(r.valorReal)}</span>` : '—')
            : `<input id="rv-input-${i}" class="rv-input" type="text" inputmode="numeric" placeholder="—">`}
      </td>
      <td class="td-center">
        ${r.bloqueado
          ? `<span id="bp-${i}" class="badge-blocked">—</span>`
          : r.pago
            ? `<button id="bp-${i}" class="badge-pago" onclick="togglePago(${i})">✓ Pago</button>`
            : `<button id="bp-${i}" class="badge-nao" onclick="togglePago(${i})">—</button>`}
      </td>
    </tr>`).join('');
}

// ── BANNER INLINE: parcelas pendentes de confirmação ──
// Aparece para qualquer perfil (fluxo A ou B) onde a última parcela ativa
// paga tenha parcelas não-pagas antes dela — indica que o usuário marcou
// apenas a mais recente mas não as anteriores.

function _calcPagasPendentes() {
  const ativas = meses.filter(r => !r.bloqueado);
  const ultimaPagaIdx = ativas.reduce((acc, r, i) => r.pago ? i : acc, -1);
  if (ultimaPagaIdx < 0) return 0;
  return ativas.slice(0, ultimaPagaIdx).filter(r => !r.pago).length;
}

function _contarAteUltimaPaga() {
  // Quantas parcelas ativas existem até (e incluindo) a última paga
  const ativas = meses.filter(r => !r.bloqueado);
  const ultimaPagaIdx = ativas.reduce((acc, r, i) => r.pago ? i : acc, -1);
  return ultimaPagaIdx + 1;
}

function _buildBannerPagas() {
  return '';
}

function _abrirModalPagas(pendentes, ate) {
  const overlay = document.createElement('div');
  overlay.id = 'modal-pagas-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">Parcelas não confirmadas</div>
      <div class="mp-content">
        <div class="mp-title" id="mp-title-count">Você tem ${pendentes} parcela(s) não marcada(s) como pagas</div>
        <div class="mp-sub">Marque-as para manter o controle correto do que já foi pago.</div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-back" onclick="dispensarBannerPagas()">← Ignorar</button>
        <button class="btn btn-primary" id="mp-btn-marcar" onclick="marcarPagasPendentes(${ate})">✓ Marcar todas</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function _refreshBannerPagas() {
  if (!isPremium()) return;
  const pendentes = _calcPagasPendentes();
  const existing = document.getElementById('modal-pagas-overlay');
  if (pendentes === 0) { if (existing) existing.remove(); return; }
  const ate = _contarAteUltimaPaga();
  if (!existing) {
    _abrirModalPagas(pendentes, ate);
  } else {
    const t = document.getElementById('mp-title-count');
    const b = document.getElementById('mp-btn-marcar');
    if (t) t.textContent = `Você tem ${pendentes} parcela(s) não marcada(s) como pagas`;
    if (b) b.setAttribute('onclick', `marcarPagasPendentes(${ate})`);
  }
}

function marcarPagasPendentes(ate) {
  const ativas = meses.filter(r => !r.bloqueado);
  ativas.slice(0, ate).forEach(r => { r.pago = true; });
  hasUnsavedChanges = true;
  dispensarBannerPagas();
  refreshTable();
  showToast('✅ Parcelas marcadas como pagas.');
}

function dispensarBannerPagas() {
  const overlay = document.getElementById('modal-pagas-overlay');
  if (overlay) overlay.remove();
}

// ── SLIDER PREMIUM: faixa "já pago" vs "simulação futura" ──
function _ultimaPercPagaAtual() {
  const perc = ultimaPercPaga(meses);
  return perc !== null ? perc : 0;
}

function _syncSliderPremium() {
  const slider = document.getElementById('preview-slider');
  if (!slider || !isPremium()) return;
  const percPaga = _ultimaPercPagaAtual();
  slider.value = percPaga;
  _applySliderTrack(slider, percPaga, percPaga);
  atualizaSlider();
  const pagoLabel = document.getElementById('slider-pago-label');
  if (pagoLabel) {
    if (percPaga > 0) {
      pagoLabel.textContent = percPaga + '% · de obra concluída';
      pagoLabel.style.visibility = '';
    } else {
      pagoLabel.style.visibility = 'hidden';
    }
  }
}

function _applySliderTrack(slider, percPaga, val) {
  // [0, percPaga] = verde apagado (já pago), [percPaga, val] = verde vivo (simulação), [val, 100] = cinza
  const p = percPaga;
  const v = Math.max(val, p);
  slider.style.background = [
    `linear-gradient(to right,`,
    `  var(--slider-pago, #a8d5b5) 0% ${p}%,`,
    `  var(--accent) ${p}% ${v}%,`,
    `  var(--border) ${v}% 100%`,
    `)`
  ].join(' ');
}

// ── GERAR A TABELA COMPLETA - Sugerido por GPT ──
function renderTabela() { screen = 'tabela'; showBottomNav(); setHtml(buildTabela(false)); }

// ── CONSTUIR A TABELA COMO PÁGINA INDEPENDENTE - Sugerido por GPT ──
function buildTabela(inline = false) {
  aplicaBloqueio();

  const lastPago = meses[meses.length - 1]?.pago || false;

  return `
    ${!inline ? `
      <div class="tabela-header">
        <button class="tabela-back-btn" onclick="voltarParaResultado()">← Resumo</button>
        <div class="tabela-title">${escHtml(form.nomeSimulacao || 'Apto 101')}</div>
      </div>
      <div class="alert" style="margin-top:12px">
        💡 Edite % de obra e Taxa Referencial.
      </div>
    ` : ''}

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="th-center">#</th>
            <th>Mês</th>
            <th class="th-right">% Obra</th>
            <th class="th-right">Saldo dev.</th>
            <th class="th-right">TR %</th>
            <th class="th-right">Previsto</th>
            <th class="th-right">Valor Real</th>
            <th class="th-center">Pago?</th>
          </tr>
        </thead>
        <tbody>${_buildTableRows()}</tbody>
      </table>

      <div class="row-controls">
        <span class="rc-info" id="rc-info">
          Utilize +/- para acrescentar/remover linhas · máx. ${MAX_MESES}
        </span>

        <button class="rc-btn" id="btn-rem"
          onclick="removerLinha()"
          title="Remover última parcela"
          ${meses.length <= 1 || lastPago ? 'disabled' : ''}>
          −
        </button>

        <button class="rc-btn" id="btn-add"
          onclick="adicionarLinha()"
          title="Adicionar parcela"
          ${meses.length >= MAX_MESES ? 'disabled' : ''}>
          +
        </button>
      </div>
    </div>

    ${!inline ? `
      <button class="btn-reset" onclick="voltarParaResultado()">
        ← Voltar à tela de resultados
      </button>
    ` : ''}
  `;
}

function voltarParaResultado() {
  screen = 'result';
  renderResult();
}

// ── TELA DE RESULTADO ──
function renderResult() {
  showBottomNav();
  aplicaBloqueio();
  const fin     = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100);
  const ativas  = meses.filter(r => !r.bloqueado);
  const total   = ativas.reduce((s, r) => s + r.previsto, 0);
  const pagoPrevisto = ativas.filter(r => r.pago).reduce((s, r) => s + r.previsto, 0);
  const media   = ativas.length ? total / ativas.length : 0;
  const premium = isPremium();

  const temFin    = parseFloat(form.parcelaFinanciamento || 0) > 0;
  const totalReal = ativas.reduce((s, r) => s + (r.valorReal || 0), 0);

  // Bloco de comparação Previsto vs Real (premium, aparece quando há valorReal)
  const blocoComparacao = premium ? (() => {
    const diff = totalReal - total;
    const diffStr = (diff >= 0 ? '+' : '−') + ' ' + fmtBRL(Math.abs(diff));
    const diffClass = diff > 100 ? ' val-over' : diff < -100 ? ' val-under' : '';
    return `
    <div class="comparison-section" id="bloco-comparacao" style="${totalReal > 0 ? '' : 'display:none'}">
      <div class="comparison-section-title">Previsto vs Real</div>
      <div class="comparison-grid">
        <div class="comparison-card">
          <div class="comp-label">Previsto pela fórmula</div>
          <div class="comp-val" id="sum-comp-previsto">${fmtBRL(total)}</div>
        </div>
        <div class="comparison-card full">
          <div class="comp-label">Diferença (real − previsto)</div>
          <div class="comp-val${diffClass}" id="sum-diff">${diffStr}</div>
        </div>
      </div>
    </div>`;
  })() : '';

  // Slider: premium parte da última % paga; free parte de 50%
  const percPaga     = premium ? _ultimaPercPagaAtual() : 50;
  const sliderInicio = percPaga;

  const blocoSlider = `
    <div class="preview-slider-card">
      <div class="preview-slider-header">
        <div class="preview-slider-title">Visualizador de Prestações</div>
        <div class="preview-slider-sub">Simule suas prestações sem o cálculo da TR.</div>
      </div>
      <div class="slider-wrap">
        <div class="slider-labels">
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
        <input type="range" id="preview-slider" class="preview-slider"
          min="0" max="100" step="${premium ? 1 : 10}" value="${sliderInicio}"
          oninput="atualizaSlider()">
        ${premium ? `<div class="slider-pago-label" id="slider-pago-label" style="${percPaga > 0 ? '' : 'visibility:hidden'}">${percPaga > 0 ? percPaga + '% · já pago' : '—'}</div>` : ''}
      </div>
      <div class="slider-result">
        <dl class="slider-result-row">
          <dt class="slider-result-label">Evolução de Obra</dt>
          <dd class="slider-result-perc" id="slider-perc">—</dd>
          <dt class="slider-result-label">Saldo devedor estimado</dt>
          <dd class="slider-result-val" id="slider-saldo">—</dd>
        </dl>
        <dl class="slider-result-row highlight">
          <dt class="slider-result-label">Prestação simulada <strong>SEM TR</strong></dt>
          <dd class="slider-result-val accent" id="slider-val">—</dd>
        </dl>
      </div>
      ${temFin ? `
      <div class="quick-result-grid-slider">
        <div class="quick-result-card accent">
          <div class="qrc-label">1ª Parcela do Financiamento</div>
          <div class="qrc-val">${fmtBRL(form.parcelaFinanciamento)}</div>
        </div>
        <div id="slider-fin-bloco" class="slider-fin-bloco"></div>
      </div>` : ''}
      ${!premium ? `
      <button class="free-preview-cta" onclick="showPaywall()">
        🔓 Ver tabela completa de parcelas
        <span class="cta-price">R$ 4,99</span>
      </button>` : ''}
    </div>`;

// ── CHAMAR A TABELA INLINE DENTRO DO PREMIUM
  const blocoTabelaInline = premium ? buildTabela(true) : '';

  // Banner inline de pagas pendentes (universal — fluxo A e B)
  const blocoBannerPagas = _buildBannerPagas();

  setHtml(`
    <div class="result-header">
      <h2>${escHtml(form.nomeSimulacao || 'Apto 101')}</h2>
      <p id="result-subtitle">${ativas.length} parcelas · ${meses[0]?.mes || ''} → ${ultimoMesAtivo()}</p>
      <div class="rh-actions">
        <button class="rh-btn save" onclick="saveProfile()">💾 Salvar</button>
        <button class="rh-btn" onclick="abrirRenomearPerfil()">✏️ Renomear</button>
        <button class="rh-btn" onclick="editarSimulacao()">🔧 Editar</button>
        <button class="rh-btn del" id="rh-btn-del" onclick="deleteProfileFromResult()">🗑️ Excluir</button>
      </div>
    </div>

    <div class="sticky-summary">
      <div class="summary-grid">
        <div class="summary-card">
          <div class="s-label">Valor Financiado</div>
          <div class="s-val">${fmtBRL(fin)}</div>
        </div>
        <div class="summary-card">
          <div class="s-label">Valor médio estimado</div>
          <div class="s-val" id="sum-media">${fmtBRL(media)}</div>
        </div>
        ${premium ? `
        <div class="summary-card paid">
          <div class="s-label">Pago até o momento</div>
          <div class="s-val" id="sum-pago">${fmtBRL(totalReal > 0 ? totalReal : pagoPrevisto)}</div>
        </div>` : ''}
      </div>
    </div>

    ${blocoSlider}
    ${blocoBannerPagas}
    ${blocoComparacao}
    ${blocoTabelaInline}

    <div class="quick-disclaimer-end">
      <p>Darwin não é uma ferramenta preditiva. Utilizamos a fórmula oficial de cálculo divulgada pela Caixa Econômica. Não nos responsabilizamos se previsões futuras não corresponderem à realidade, uma vez que valores cobrados serão sempre de encargo da instituição financeira.</p>
    </div>
        
  `);

  setTimeout(() => { atualizaSlider(); _initRvMasks(); _refreshBannerPagas(); }, 80);
}
