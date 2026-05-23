// ── TELA DE PERFIS ──
function goProfiles() { screen = 'profiles'; renderProfiles(); }

function renderProfiles() {
  const profiles = loadProfiles();
  const list = profiles.length
    ? profiles.map(p => {
        const perc = ultimaPercPaga(p.meses);
        const percLabel = perc !== null ? `✅ Última parcela paga: ${perc}% de obra` : 'Nenhuma parcela paga ainda';
        return `<div class="profile-card" id="pc-${p.id}" onclick="loadProfile('${p.id}')">
          <div>
            <div class="pc-name">${escHtml(p.nome)}${p.premium ? '<span class="pc-premium-badge">✦ Premium</span>' : ''}</div>
            <div class="pc-sub">Salvo em ${fmtDate(p.savedAt)} · ${p.meses.length} parcelas</div>
            <div class="pc-perc">${percLabel}</div>
          </div>
          <div class="pc-actions" onclick="event.stopPropagation()">
            <button class="pc-btn" onclick="loadProfile('${p.id}')">Abrir</button>
            <button class="pc-btn" onclick="abrirRenomearPerfil('${p.id}')">Renomear</button>
            <button class="pc-btn del" id="del-${p.id}" onclick="deleteProfile('${p.id}')">Excluir</button>
          </div>
        </div>`;
      }).join('')
    : `<div class="empty-state"><div class="es-icon">🏢</div><p>Nenhum perfil salvo ainda.<br>Você pode salvar um perfil na tela de resultados após concluir a <strong>Simulação Completa</strong>.</p></div>`;

  setHtml(`
    <div class="screen-title">Meus Imóveis</div>
    <div class="screen-sub">Simule e salve quantos perfis quiser.</div>
    <div class="profile-list">${list}</div>
    <button class="btn btn-primary" onclick="novaSimulacao()">📄 Nova Simulação</button>
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
  const btnAdd = document.getElementById('btn-add'), btnRem = document.getElementById('btn-rem'), rcInfo = document.getElementById('rc-info');
  if (btnAdd) btnAdd.disabled = meses.length >= MAX_MESES;
  if (btnRem) { const last = meses[meses.length - 1]; btnRem.disabled = meses.length <= 1 || (last && last.pago); }
  if (rcInfo) rcInfo.textContent = meses.length + ' parcela(s) · máx. ' + MAX_MESES;
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
  const total     = ativas.reduce((s, r) => s + r.previsto, 0);
  const pago      = ativas.filter(r => r.pago).reduce((s, r) => s + r.previsto, 0);
  const media     = ativas.length ? total / ativas.length : 0;
  const totalReal = ativas.reduce((s, r) => s + (r.valorReal || 0), 0);
  const diff      = totalReal - total;
  const e = id => document.getElementById(id);
  if (e('sum-total')) e('sum-total').textContent = fmtBRL(total);
  if (e('sum-pago'))  e('sum-pago').textContent  = fmtBRL(pago);
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
  const pendentes = _calcPagasPendentes();
  if (pendentes === 0) return '';
  const ate = _contarAteUltimaPaga();
  return `
    <div class="marcar-pagas-bloco" id="marcar-pagas-bloco">
      <div class="mp-icon">📋</div>
      <div class="mp-content">
        <div class="mp-title">Você tem ${pendentes} parcela(s) não marcada(s) como pagas</div>
        <div class="mp-sub">Marque-as para manter o controle correto do que já foi pago.</div>
      </div>
      <div class="mp-actions">
        <button class="mp-btn-sim" onclick="marcarPagasPendentes(${ate})">✓ Marcar todas</button>
        <button class="mp-btn-nao" onclick="dispensarBannerPagas()">Ignorar</button>
      </div>
    </div>`;
}

function _refreshBannerPagas() {
  const bloco = document.getElementById('marcar-pagas-bloco');
  if (!bloco) return;
  const pendentes = _calcPagasPendentes();
  if (pendentes === 0) { bloco.remove(); return; }
  const ate = _contarAteUltimaPaga();
  bloco.querySelector('.mp-title').textContent = `Você tem ${pendentes} parcela(s) não marcada(s) como pagas`;
  bloco.querySelector('.mp-btn-sim').setAttribute('onclick', `marcarPagasPendentes(${ate})`);
}

function marcarPagasPendentes(ate) {
  // `ate` = número de parcelas ativas (da primeira até a última paga inclusive) a marcar
  const ativas = meses.filter(r => !r.bloqueado);
  ativas.slice(0, ate).forEach(r => { r.pago = true; });
  hasUnsavedChanges = true;
  refreshTable();
  showToast('✅ Parcelas marcadas como pagas.');
}

function dispensarBannerPagas() {
  const bloco = document.getElementById('marcar-pagas-bloco');
  if (bloco) bloco.remove();
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
  slider.value = percPaga;                        // ← linha nova
  _applySliderTrack(slider, percPaga, percPaga);
  atualizaSlider();                               // ← linha nova (atualiza label e valores)
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
function renderTabela() { screen = 'tabela'; setHtml(buildTabela(false)); }

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
  aplicaBloqueio();
  const fin     = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100);
  const ativas  = meses.filter(r => !r.bloqueado);
  const total   = ativas.reduce((s, r) => s + r.previsto, 0);
  const pago    = ativas.filter(r => r.pago).reduce((s, r) => s + r.previsto, 0);
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
        <div class="comparison-card">
          <div class="comp-label">Inserido pelo usuário</div>
          <div class="comp-val" id="sum-real">${fmtBRL(totalReal)}</div>
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
    <div class="${premium ? 'premium-preview-card' : 'free-preview-card'}">
      <div class="free-preview-header">
        <div class="free-preview-title">Simulador Rápido</div>
        <div class="free-preview-sub">${premium
          ? 'O slider marca quanto de % já foi pago de acordo com a tabela abaixo.'
          : 'Arraste para simular cenários futuros em qualquer % de obra'}</div>
      </div>
      <div class="slider-wrap">
        <div class="slider-labels">
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
        <input type="range" id="preview-slider" class="preview-slider"
          min="0" max="100" step="${premium ? 1 : 10}" value="${sliderInicio}"
          oninput="atualizaSlider()">
        <div class="slider-perc-label" id="slider-perc">${sliderInicio}%${premium && percPaga > 0 ? ' · última paga' : ''}</div>
      </div>
      <div class="slider-result">
        <dl class="slider-result-row">
          <dt class="slider-result-label">Saldo devedor estimado</dt>
          <dd class="slider-result-val" id="slider-saldo">—</dd>
        </dl>
        <dl class="slider-result-row highlight">
          <dt class="slider-result-label">Parcela estimada</dt>
          <dd class="slider-result-val accent" id="slider-val">—</dd>
        </dl>
        <div class="slider-result-note">${premium
          ? ''
          : 'Exibição da Taxa Referencial na versão completa'}</div>
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
        <div class="summary-card accent">
          <div class="s-label">Total estimado de Juros de Obra</div>
          <div class="s-val" id="sum-total">${fmtBRL(total)}</div>
        </div>
        <div class="summary-card paid">
          <div class="s-label">Pago até o momento</div>
          <div class="s-val" id="sum-pago">${fmtBRL(pago)}</div>
        </div>` : ''}
      </div>
    </div>

    ${blocoSlider}
    ${blocoBannerPagas}
    ${blocoComparacao}
    ${blocoTabelaInline}
  `);

  setTimeout(() => { atualizaSlider(); _initRvMasks(); }, 80);
}
