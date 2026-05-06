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
            <button class="pc-btn del" id="del-${p.id}" onclick="deleteProfile('${p.id}')">Excluir</button>
          </div>
        </div>`;
      }).join('')
    : `<div class="empty-state"><div class="es-icon">📭</div><p>Nenhum perfil salvo ainda.<br>Faça uma simulação e clique em <strong>Salvar</strong>.</p></div>`;

  setHtml(`
    <div class="screen-title">Meus Imóveis</div>
    <div class="screen-sub">Simule e salve quantos perfis quiser.</div>
    <div class="profile-list">${list}</div>
    <button class="btn btn-primary" onclick="novaSimulacao()">📄 Nova Simulação</button>
  `);
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
  const subTabela = document.getElementById('tabela-sub-el');
  const ativasCount = meses.filter(r => !r.bloqueado).length;
  const subText = ativasCount + ' parcelas · ' + (meses[0]?.mes || '') + ' → ' + ultimoMesAtivo();
  if (sub) sub.textContent = subText;
  if (subTabela) subTabela.textContent = subText;
  updateSummary();
}

function updateSummary() {
  const ativas = meses.filter(r => !r.bloqueado);
  const total  = ativas.reduce((s, r) => s + r.previsto, 0);
  const pago   = ativas.filter(r => r.pago).reduce((s, r) => s + r.previsto, 0);
  const media  = ativas.length ? total / ativas.length : 0;
  const e = id => document.getElementById(id);
  if (e('sum-total')) e('sum-total').textContent = fmtBRL(total);
  if (e('sum-pago'))  e('sum-pago').textContent  = fmtBRL(pago);
  if (e('sum-media')) e('sum-media').textContent = fmtBRL(media);
}

// ── HELPER: linhas da tabela (reutilizado em result e tabela) ──
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
      <td class="td-center">
        ${r.bloqueado
          ? `<span id="bp-${i}" class="badge-blocked">—</span>`
          : r.pago
            ? `<button id="bp-${i}" class="badge-pago" onclick="togglePago(${i})">✓ Pago</button>`
            : `<button id="bp-${i}" class="badge-nao" onclick="togglePago(${i})">—</button>`}
      </td>
    </tr>`).join('');
}

// ── TELA DE TABELA COMPLETA (premium) ──
function renderTabela() {
  aplicaBloqueio();
  screen = 'tabela';
  const lastPago = meses[meses.length - 1]?.pago || false;
  const ativas   = meses.filter(r => !r.bloqueado);

  setHtml(`
    <div class="tabela-header">
      <button class="tabela-back-btn" onclick="voltarParaResultado()">← Resumo</button>
      <div class="tabela-title">${escHtml(form.nomeSimulacao || 'Apto 101')}</div>
      <div class="tabela-sub" id="tabela-sub-el">${ativas.length} parcelas · ${meses[0]?.mes || ''} → ${ultimoMesAtivo()}</div>
    </div>
    <div class="alert" style="margin-top:12px">💡 Edite % de obra e Taxa Referencial — <a href="https://www.debit.com.br/tabelas/tr-bacen" target="_blank">Consulte aqui</a> o valor oficial mês a mês.</div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th class="th-center">#</th><th>Mês</th>
          <th class="th-right">% Obra</th><th class="th-right">Saldo dev.</th>
          <th class="th-right">TR %</th><th class="th-right">Previsto</th>
          <th class="th-center">Pago?</th>
        </tr></thead>
        <tbody>${_buildTableRows()}</tbody>
      </table>
      <div class="row-controls">
        <span class="rc-info" id="rc-info">Use + / − para ajustar o número de parcelas (máx. ${MAX_MESES})</span>
        <button class="rc-btn" id="btn-rem" onclick="removerLinha()" title="Remover última parcela" ${meses.length <= 1 || lastPago ? 'disabled' : ''}>−</button>
        <button class="rc-btn" id="btn-add" onclick="adicionarLinha()" title="Adicionar parcela" ${meses.length >= MAX_MESES ? 'disabled' : ''}>+</button>
      </div>
    </div>
    <button class="btn-reset" onclick="voltarParaResultado()">← Voltar ao resumo</button>
  `);
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

  const blocoTabela = premium ? `
    <button class="cta-tabela-btn" onclick="renderTabela()">
      <div class="cta-tabela-left">
        <span class="cta-tabela-icon">📋</span>
        <div>
          <div class="cta-tabela-label">Ver tabela completa de parcelas</div>
          <div class="cta-tabela-sub">${ativas.length} parcelas · edite % de obra e TR mês a mês</div>
        </div>
      </div>
      <span class="cta-tabela-arrow">→</span>
    </button>` : `
    <div class="free-preview-card">
      <div class="free-preview-header">
        <div class="free-preview-title">Simulador de parcela</div>
        <div class="free-preview-sub">Arraste para ver a previsão em qualquer % de obra</div>
      </div>
      <div class="slider-wrap">
        <div class="slider-labels">
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
        <input type="range" id="preview-slider" class="preview-slider"
          min="0" max="100" step="10" value="50"
          oninput="atualizaSlider()">
        <div class="slider-perc-label" id="slider-perc">50%</div>
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
        <div class="slider-result-note">Edite a Taxa Referencial na versão completa</div>
      </div>
      <button class="free-preview-cta" onclick="showPaywall()">
        🔓 Ver tabela completa de parcelas
        <span class="cta-price">R$ 4,99</span>
      </button>
    </div>`;

  setHtml(`
    <div class="result-header">
      <h2>${escHtml(form.nomeSimulacao || 'Apto 101')}</h2>
      <p id="result-subtitle">${ativas.length} parcelas · ${meses[0]?.mes || ''} → ${ultimoMesAtivo()}</p>
      <div class="rh-actions">
        <button class="rh-btn save" onclick="saveProfile()">💾 Salvar</button>
        <button class="rh-btn" onclick="editarSimulacao()">✏️ Editar</button>
      </div>
    </div>

    <div class="sticky-summary">
      <div class="summary-grid">
        <div class="summary-card">
          <div class="s-label">Valor Financiado</div>
          <div class="s-val">${fmtBRL(fin)}</div>
        </div>
        <div class="summary-card">
          <div class="s-label">Média estimada</div>
          <div class="s-val" id="sum-media">${fmtBRL(media)}</div>
        </div>
        ${premium ? `
        <div class="summary-card accent">
          <div class="s-label">Soma das parcelas (Estimado)</div>
          <div class="s-val" id="sum-total">${fmtBRL(total)}</div>
        </div>
        <div class="summary-card paid">
          <div class="s-label">Total pago até agora</div>
          <div class="s-val" id="sum-pago">${fmtBRL(pago)}</div>
        </div>` : ''}
      </div>
    </div>

    ${blocoTabela}
  `);

  setTimeout(() => atualizaSlider(), 50);
}
