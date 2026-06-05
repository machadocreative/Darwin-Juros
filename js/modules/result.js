// ── TELA DE PERFIS ──
function goProfiles() { renderProfiles(); }

const PF_ICON_OPTIONS = ['🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏯','🏰','🗼','🛖','🏗️'];

function renderProfiles() {
  screen = 'profiles';
  _navPush('perfis');
  showBottomNav();
  setNavActive('perfis');

  const profiles = loadProfiles().sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  const n = profiles.length;

  const list = n
    ? profiles.map(p => {
        const perc = ultimaPercPaga(p.meses);
        const icon = p.icon || '🏠';
        const iconBtn = p.premium
          ? `<button class="pf-avatar pf-avatar-btn" onclick="event.stopPropagation();abrirIconePerfil('${p.id}')" title="Trocar ícone">${icon}</button>`
          : `<div class="pf-avatar">${icon}</div>`;
        const statsBlock = p.premium && perc !== null
          ? `<div class="pf-stats">
               <div class="pf-stats-num">${perc}%</div>
               <div class="pf-stats-label">Obra</div>
             </div>`
          : '';
        const premiumBadge = p.premium
          ? `<div class="pc-premium-stripe">✦</div>`
          : '';
        return `
        <div class="profile-card${p.premium ? ' profile-card-premium' : ''}" id="pc-${p.id}" onclick="loadProfile('${p.id}')">
          ${iconBtn}
          <div class="pf-content">
            <div class="pf-name">${escHtml(p.nome)}</div>
            <div class="pf-info">${p.meses.length} parcelas · salvo ${fmtDateRelative(p.savedAt)}</div>
          </div>
          ${statsBlock}
          ${premiumBadge}
        </div>
        <div class="pc-actions" onclick="event.stopPropagation()" style="margin-top:-6px;margin-bottom:10px;display:flex;gap:6px;padding:0 2px">
          <button class="pc-btn" onclick="abrirRenomearPerfil('${p.id}')">✏️ Renomear</button>
          <button class="pc-btn del" id="del-${p.id}" onclick="deleteProfile('${p.id}')">🗑️ Excluir</button>
        </div>`;
      }).join('')
    : `<div class="empty-state"><div class="es-icon">🏢</div><p>Nenhum perfil salvo ainda.<br>Inicie uma <strong>Simulação Completa</strong> para salvar seu primeiro imóvel.</p></div>`;

  const label = n === 1 ? '1 perfil salvo' : `${n} perfis salvos`;

  setHtml(`
    <div class="greeting">
      <div class="greeting-row">
        <div class="greeting-logo">📁</div>
        <div class="greeting-title">Meus Imóveis</div>
      </div>
      <div class="greeting-sub">Gerencie e acompanhe seus financiamentos</div>
    </div>
    ${n ? `<div class="section-label">${label}</div>` : ''}
    <div class="profile-list">${list}</div>
    <button class="btn-add-profile" onclick="renderBifurcacao()">+ Nova simulação</button>
  `);
}

function abrirIconePerfil(profileId) {
  const opts = PF_ICON_OPTIONS.map(ico =>
    `<button class="pf-icon-opt" onclick="salvarIconePerfil('${profileId}','${ico}')">${ico}</button>`
  ).join('');
  const overlay = document.createElement('div');
  overlay.id = 'modal-icone-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">Escolha um ícone</div>
      <div class="pf-icon-grid">${opts}</div>
      <div class="modal-actions">
        <button class="btn btn-back" onclick="document.getElementById('modal-icone-overlay').remove()">← Cancelar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function salvarIconePerfil(profileId, icon) {
  const profiles = loadProfiles();
  const idx = profiles.findIndex(p => p.id === profileId);
  if (idx >= 0) { profiles[idx].icon = icon; saveProfiles(profiles); }
  document.getElementById('modal-icone-overlay')?.remove();
  renderProfiles();
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

// % de obra da linha ativa imediatamente acima de i (pula bloqueadas). -1 se não houver.
function _percAnterior(i) {
  for (let j = i - 1; j >= 0; j--) {
    if (!meses[j].bloqueado) return meses[j].perc;
  }
  return -1;
}

// Chamado pelo oninput da máscara perc2 — lê via maskRead e comita
function updatePercMask(i) {
  const el = document.getElementById('pi-' + i);
  if (!el || meses[i].pago) return;
  const v = maskRead(el);
  if (isNaN(v) || v < 0 || v > 100) { el.classList.add('invalid'); return; }

  const prevPerc = _percAnterior(i);
  if (v < prevPerc) {
    el.classList.add('invalid');
    el.title = 'O valor não pode ser menor que a linha anterior (' + fmtPerc(prevPerc, 2) + ').';
    return;
  }

  el.classList.remove('invalid'); el.title = '';
  meses[i].perc = v;
  recalcRow(i);
  aplicaBloqueio();
  hasUnsavedChanges = true;
  // Atualiza sub-row em tempo real sem refreshTable completo
  const subSaldo = document.getElementById('sub-saldo-val-' + i);
  const subPrev  = document.getElementById('sub-prev-val-' + i);
  if (subSaldo) subSaldo.textContent = fmtBRL(meses[i].saldo);
  if (subPrev)  subPrev.textContent  = fmtBRL(meses[i].previsto);
  updateSummary();
}

function validatePercBlur(i) {
  const el = document.getElementById('pi-' + i); if (!el) return;
  const v = maskRead(el);
  if (isNaN(v) || v < 0 || v > 100) { el.classList.add('invalid'); return; }

  const prevPerc = _percAnterior(i);
  if (v < prevPerc) {
    el.classList.add('invalid');
    el.title = 'O valor não pode ser menor que a linha anterior (' + fmtPerc(prevPerc, 2) + ').';
    showToast('⚠️ A % de obra não pode ser menor que a da linha acima (' + fmtPerc(prevPerc, 2) + '). Corrija o valor ou use “↺ Atualizar tabela”.');
    return;
  }
  el.classList.remove('invalid'); el.title = '';
}

// Redistribui % de obra linearmente do último mês pago até 100% no último mês
function redistribuirPerc() {
  const ativas = meses.filter(r => !r.bloqueado);
  const ultimaPagaIdx = ativas.reduce((acc, r, i) => r.pago ? i : acc, -1);
  const inicioIdx = ultimaPagaIdx + 1; // primeiro não-pago
  const total = ativas.length;
  if (inicioIdx >= total) { showToast('Todas as parcelas já estão pagas.'); return; }

  const percInicio = ultimaPagaIdx >= 0 ? ativas[ultimaPagaIdx].perc : 0;
  const passos = total - 1 - ultimaPagaIdx; // quantos passos até 100%

  for (let k = inicioIdx; k < total; k++) {
    const frac = passos === 0 ? 1 : (k - ultimaPagaIdx) / passos;
    ativas[k].perc = parseFloat((percInicio + (100 - percInicio) * frac).toFixed(2));
    recalcRow(meses.indexOf(ativas[k]));
  }
  aplicaBloqueio();
  hasUnsavedChanges = true;
  refreshTable();
  showToast('✅ % de obra redistribuída.');
}

// ── REFRESH DA TABELA (atualização sem re-render completo) ──
function refreshTable() {
  const alt = i => i % 2 === 1 ? ' row-alt' : '';
  const rowCls = (r, i) => 'main-row' + (r.bloqueado ? ' obra-done' : r.pago ? ' pago-row' : '') + alt(i);
  const subCls = (r, i) => {
    const subrow = document.getElementById('subrow-' + i);
    const hidden = subrow?.classList.contains('sub-row-hidden') ? ' sub-row-hidden' : '';
    return 'sub-row' + (r.bloqueado ? ' obra-done' : r.pago ? ' pago-row' : '') + hidden + alt(i);
  };

  meses.forEach((r, i) => {
    const row = document.getElementById('row-' + i); if (!row) return;
    row.className = rowCls(r, i);

    const subrow = document.getElementById('subrow-' + i);
    if (subrow) subrow.className = subCls(r, i);

    // % Obra
    const percCell = row.cells[2];
    if (percCell) {
      if (r.bloqueado) {
        percCell.innerHTML = `<span class="perc-static">—</span>`;
      } else if (r.pago) {
        percCell.innerHTML = `<span class="perc-static">${fmtPerc(r.perc, 2)}</span>`;
      } else {
        const pi = document.getElementById('pi-' + i);
        if (pi) {
          // Reaplica máscara + valor preservando o handler de commit
          attachMask('pi-' + i, 'perc2', r.perc, () => updatePercMask(i));
        } else {
          percCell.innerHTML = `<input id="pi-${i}" class="perc-input" type="text" inputmode="numeric" placeholder="0,00%"
            onblur="validatePercBlur(${i})">`;
          setTimeout(() => attachMask('pi-' + i, 'perc2', r.perc, () => updatePercMask(i)), 0);
        }
      }
    }

    // Valor (previsto ou real)
    const rv = document.getElementById('rv-' + i);
    if (rv) {
      if (r.bloqueado) {
        rv.innerHTML = '—';
      } else if (r.pago) {
        const prevAnt = i > 0 ? meses[i - 1].previsto : null;
        rv.innerHTML = r.valorReal
          ? `<span class="rv-val">${fmtBRL(r.valorReal)}</span>`
          : `<span class="rv-val" style="color:var(--muted)">${prevAnt != null ? fmtBRL(prevAnt) : '—'}</span>`;
      } else {
        const ph = i > 0 ? fmtBRL(meses[i - 1].previsto) : '—';
        rv.innerHTML = `<input id="rv-input-${i}" class="rv-input" type="text" inputmode="numeric" placeholder="${ph}">`;
        setTimeout(() => _initSingleRvMask(i), 0);
      }
    }

    // Badge pago
    const bp = document.getElementById('bp-' + i);
    if (bp) {
      if (r.bloqueado)  bp.outerHTML = `<span id="bp-${i}" class="badge-blocked">—</span>`;
      else if (r.pago)  bp.outerHTML = `<button id="bp-${i}" class="badge-pago" onclick="togglePago(${i})">✓ Pago</button>`;
      else              bp.outerHTML = `<button id="bp-${i}" class="badge-nao" onclick="togglePago(${i})">Não pago</button>`;
    }

    // Sub-row: atualiza as 3 células separadas
    r._idx = i;
    const subSaldo = document.getElementById('sub-saldo-val-' + i);
    const subTaxa  = document.getElementById('sub-taxa-val-' + i);
    const subPrev  = document.getElementById('sub-prev-val-' + i);
    if (subSaldo) subSaldo.textContent = fmtBRL(r.saldo);
    if (subPrev)  subPrev.textContent  = fmtBRL(r.previsto);
    if (subTaxa) {
      const tm = parseFloat(form.taxaAnual) / 100 / 12;
      const totalPct = ((tm + r.tr) * 100).toFixed(4);
      subTaxa.innerHTML = r.tr > 0
        ? `${totalPct}%`
        : `${(tm * 100).toFixed(4)}% <span class="sub-tr-ind">(TR indisponível)</span>`;
    }
  });

  const btnAdd = document.getElementById('btn-add'), btnRem = document.getElementById('btn-rem');
  if (btnAdd) btnAdd.disabled = meses.length >= MAX_MESES;
  if (btnRem) { const last = meses[meses.length - 1]; btnRem.disabled = meses.length <= 1 || (last && last.pago); }
  const sub = document.getElementById('result-subtitle');
  const ativasCount = meses.filter(r => !r.bloqueado).length;
  const subText = ativasCount + ' parcelas · ' + (meses[0]?.mes || '') + ' → ' + ultimoMesAtivo();
  if (sub) sub.textContent = subText;
  _refreshBannerPagas();
  _syncSliderPremium();
  updateSummary();
}

function updateSummary() {
  const ativas    = meses.filter(r => !r.bloqueado);
  const pagas     = ativas.filter(r => r.pago);
  const total     = ativas.reduce((s, r) => s + r.previsto, 0);
  const media     = ativas.length ? total / ativas.length : 0;
  const totalPago = pagas.reduce((s, r) => s + (r.valorReal || r.previsto), 0);
  const totalReal = pagas.reduce((s, r) => s + (r.valorReal || 0), 0);
  const totalHibrid = ativas.reduce((s, r) => s + (r.valorReal || r.previsto), 0);
  const totalRealBruto = ativas.reduce((s, r) => s + (r.valorReal || 0), 0);
  const diff      = totalRealBruto - total;
  const e = id => document.getElementById(id);
  if (e('sum-total')) e('sum-total').textContent = fmtBRL(total);
  if (e('sum-pago'))  e('sum-pago').textContent  = fmtBRL(pagas.length > 0 ? totalPago : 0);
  if (e('sum-media')) e('sum-media').textContent = fmtBRL(media);
  if (e('sum-comp-previsto')) e('sum-comp-previsto').textContent = fmtBRL(total);
  if (e('sum-real'))  e('sum-real').textContent  = fmtBRL(totalRealBruto);
  if (e('sum-diff')) {
    e('sum-diff').textContent = (diff >= 0 ? '+' : '−') + ' ' + fmtBRL(Math.abs(diff));
    e('sum-diff').className = 'comp-val' + (diff > 100 ? ' val-over' : diff < -100 ? ' val-under' : '');
  }
  const blocoComp = document.getElementById('bloco-comparacao');
  if (blocoComp) blocoComp.style.display = totalRealBruto > 0 ? '' : 'none';

  // Cards da tela da tabela
  if (e('res-total-hibrido')) e('res-total-hibrido').textContent = fmtBRL(totalHibrid);
  if (e('res-total-real'))    e('res-total-real').textContent    = fmtBRL(totalReal);
  if (e('res-total-falta'))   e('res-total-falta').textContent   = fmtBRL(totalHibrid - totalReal);
  if (e('res-total-prev'))    e('res-total-prev').textContent    = fmtBRL(total);

  // Saldo devedor atual em todas as telas que o exibem
  const elSaldoAtual = document.getElementById('res-saldo-atual');
  if (elSaldoAtual) elSaldoAtual.textContent = fmtBRL(calcSaldoAtual());
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

function _initPercMasks() {
  meses.forEach((r, i) => {
    if (r.bloqueado || r.pago) return;
    attachMask('pi-' + i, 'perc2', r.perc, () => updatePercMask(i));
  });
}

// ── HELPER: toggle expand/collapse da sub-row ──
function toggleSubRow(i) {
  const sub = document.getElementById('subrow-' + i);
  const btn = document.getElementById('sub-toggle-' + i);
  if (!sub || !btn) return;
  const hidden = sub.classList.toggle('sub-row-hidden');
  btn.textContent = hidden ? '▸' : '▾';
}

// ── HELPER: conteúdo da sub-row em 3 células separadas ──
function _subRowCells(r) {
  if (r.bloqueado) return `<td colspan="6" class="td-sub-c">—</td>`;
  const tm = parseFloat(form.taxaAnual) / 100 / 12;
  const totalPct = ((tm + r.tr) * 100).toFixed(4);
  const taxaStr = r.tr > 0
    ? `${totalPct}%`
    : `${(tm * 100).toFixed(4)}% <span class="sub-tr-ind">(TR indisponível)</span>`;
  return `
    <td class="td-sub-c td-sub-saldo" id="sub-saldo-${r._idx}"><span class="sub-label">Saldo dev.</span> <span id="sub-saldo-val-${r._idx}">${fmtBRL(r.saldo)}</span></td>
    <td class="td-sub-c td-sub-taxa"><span class="sub-label">Total juros</span> <span id="sub-taxa-val-${r._idx}">${taxaStr}</span></td>
    <td class="td-sub-c td-sub-prev" colspan="4"><span class="sub-label">Previsto mês seguinte</span> <span id="sub-prev-val-${r._idx}">${fmtBRL(r.previsto)}</span></td>`;
}

// ── HELPER: linhas da tabela (main-row + sub-row fechada por padrão) ──
function _buildTableRows() {
  const rowClass = r => r.bloqueado ? 'obra-done' : r.pago ? 'pago-row' : '';
  return meses.map((r, i) => {
    r._idx = i;
    const cls = rowClass(r);
    const alt = i % 2 === 1 ? ' row-alt' : '';

    const percCell = r.bloqueado
      ? `<span class="perc-static">—</span>`
      : r.pago
        ? `<span class="perc-static">${fmtPerc(r.perc, 2)}</span>`
        : `<input id="pi-${i}" class="perc-input" type="text" inputmode="numeric" placeholder="0,00%"
             onblur="validatePercBlur(${i})">`;

    // O valor cobrado no mês i é calculado sobre a medição do mês i-1
    const prevAnterior = i > 0 ? meses[i - 1].previsto : null;
    const valorCell = r.bloqueado
      ? '—'
      : r.pago
        ? (r.valorReal
            ? `<span class="rv-val">${fmtBRL(r.valorReal)}</span>`
            : `<span class="rv-val" style="color:var(--muted)">${prevAnterior != null ? fmtBRL(prevAnterior) : '—'}</span>`)
        : `<input id="rv-input-${i}" class="rv-input" type="text" inputmode="numeric" placeholder="${prevAnterior != null ? fmtBRL(prevAnterior) : '—'}">`;

    const badge = r.bloqueado
      ? `<span id="bp-${i}" class="badge-blocked">—</span>`
      : r.pago
        ? `<button id="bp-${i}" class="badge-pago" onclick="togglePago(${i})">✓ Pago</button>`
        : `<button id="bp-${i}" class="badge-nao" onclick="togglePago(${i})">Não pago</button>`;

    return `
    <tr id="row-${i}" class="main-row${cls ? ' ' + cls : ''}${alt}">
      <td class="num-col">${i + 1}</td>
      <td class="td-mes">${escHtml(r.mes)}</td>
      <td class="td-right">${percCell}</td>
      <td id="rv-${i}" class="td-valor-principal">${valorCell}</td>
      <td class="td-center">${badge}</td>
      <td class="td-center td-toggle">
        ${r.bloqueado ? '' : `<button id="sub-toggle-${i}" class="sub-toggle-btn" onclick="toggleSubRow(${i})">▸</button>`}
      </td>
    </tr>
    <tr id="subrow-${i}" class="sub-row sub-row-hidden${cls ? ' ' + cls : ''}${alt}">
      ${_subRowCells(r)}
    </tr>`;
  }).join('');
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

// Alinha o cabeçalho sticky logo abaixo do card sticky (alturas variam por tela).
function _syncStickyOffsets() {
  const card = document.querySelector('.tabela-sticky-card');
  if (!card) return;
  const h = card.getBoundingClientRect().height;
  // grava o offset numa CSS var usada pelo thead (ver style.css)
  document.documentElement.style.setProperty('--sticky-head-top', Math.round(h) + 'px');
}

// Reposiciona ao girar/redimensionar a tela
window.addEventListener('resize', () => {
  if (screen === 'tabela') _syncStickyOffsets();
});

// ── GERAR A TABELA COMPLETA - Sugerido por GPT ──
function renderTabela() {
  screen = 'tabela'; _navPush('tabela'); showBottomNav(); setHtml(buildTabela(false));
  setTimeout(() => { _initRvMasks(); _initPercMasks(); _syncStickyOffsets(); }, 80);
}

// ── CONSTUIR A TABELA COMO PÁGINA INDEPENDENTE - Sugerido por GPT ──
function buildTabela(inline = false) {
  aplicaBloqueio();

  const lastPago   = meses[meses.length - 1]?.pago || false;
  const saldoMax   = calcSaldoMaximo();
  const saldoAtual = calcSaldoAtual();
  const temPagas   = meses.filter(r => !r.bloqueado && r.pago).length > 0;
  const ativas     = meses.filter(r => !r.bloqueado);
  const pagas      = ativas.filter(r => r.pago);

  const totalReal   = pagas.reduce((s, r) => s + (r.valorReal || 0), 0);
  const totalPrev   = ativas.reduce((s, r) => s + r.previsto, 0);
  const totalHibrid = ativas.reduce((s, r) => s + (r.valorReal || r.previsto), 0);
  const totalFalta  = totalHibrid - totalReal;

  return `
    ${!inline ? `<button class="breadcrumb-back" onclick="history.back()">← Voltar à tela de resultados</button>
    <div class="screen-title">Histórico de Prestações</div>` : ''}

    <div class="result-grid" style="margin-bottom:12px;">
      <div class="result-card">
        <div class="qrc-label">Total pago</div>
        <div class="qrc-val" id="res-total-real">${fmtBRL(totalReal)}</div>
        <div class="qrc-note">Soma dos valores inseridos na tabela abaixo</div>
      </div>
      <div class="result-card" style="background-color: #ffeccf;">
        <div class="qrc-label">Falta pagar</div>
        <div class="qrc-val" id="res-total-falta">${fmtBRL(totalFalta)}</div>
        <div class="qrc-note">Estimativa (−) Valores já pago</div>
      </div>
    </div>

    <div class="result-card accent result-card-full tabela-sticky-card" style="margin-top:0;margin-bottom:10px">
      <div class="qrc-label">Total estimado de Juros de Obra</div>
      <div class="qrc-val" id="res-total-hibrido">${fmtBRL(totalHibrid)}</div>
      <div class="qrc-note">Estimativas futuras podem variar · TR futura indisponível</div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="th-center">#</th>
            <th>Mês</th>
            <th class="th-right">% Obra</th>
            <th class="th-right">Valor</th>
            <th class="th-center">Pago?</th>
            <th class="th-center td-toggle-th"></th>
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

    <button class="btn-redistribuir" onclick="redistribuirPerc()">↺ Atualizar tabela</button>
  `;
}

// ── TELA DE RESULTADO ──
function renderResult() {
  screen = 'result';
  _navPush('result');
  showBottomNav();
  aplicaBloqueio();
  const fin          = calcFin();
  const saldoMax     = calcSaldoMaximo();
  const ativas       = meses.filter(r => !r.bloqueado);
  const pagas        = ativas.filter(r => r.pago);
  const total        = ativas.reduce((s, r) => s + r.previsto, 0);
  const media        = ativas.length ? total / ativas.length : 0;
  const premium      = isPremium();
  const saldoAtual   = premium ? calcSaldoAtual() : null;

  // Para cada parcela paga: usa valorReal se disponível, senão previsto
  const totalPago = pagas.reduce((s, r) => s + (r.valorReal || r.previsto), 0);
  const temPago   = pagas.length > 0;
  const temReal   = pagas.some(r => r.valorReal);

  // Nota do card "pago": indica precisão do valor
  const notaPago = !temPago
    ? 'Nenhum registro'
    : temReal
      ? (premium ? '✦ Combinando real + estimado' : 'Combinando real + estimado')
      : (premium ? '✦ Valor estimado' : 'Valor estimado');

  // Estimativa total da obra: usa real onde disponível, previsto para o restante
  const totalObra = ativas.reduce((s, r) => s + (r.valorReal || r.previsto), 0);
  const proporcaoReal = ativas.length ? pagas.filter(r => r.valorReal).length / ativas.length : 0;

  setHtml(`
    <div class="result-header">
      <h2>${escHtml(form.nomeSimulacao || 'Apto 101')}</h2>
      <p id="result-subtitle">${ativas.length} parcelas · ${meses[0]?.mes || ''} → ${ultimoMesAtivo()}</p>
      <div class="rh-actions">
        <button class="pc-btn save" onclick="saveProfile()">💾 Salvar</button>
        <button class="pc-btn" onclick="abrirRenomearPerfil()">✏️ Renomear</button>
        <button class="pc-btn" onclick="editarSimulacao()">🔧 Editar</button>
        <button class="pc-btn del" id="rh-btn-del" onclick="deleteProfileFromResult()">🗑️ Excluir</button>
      </div>
    </div>

    <div class="result-card accent">
      <div class="qrc-label">Saldo devedor atual</div>
      <div class="qrc-val" id="res-saldo-atual">${fmtBRL(saldoAtual)}</div>
      <div class="qrc-note">${temPago ? 'Na última medição de obra' : 'Nenhuma parcela paga'}</div>
    </div>

    <div class="result-card">
      <div class="qrc-label">Saldo Devedor Máximo</div>
      <div class="qrc-val">${fmtBRL(fin)}</div>
    </div>


    <div class="result-grid" style="margin-top:10px">
      <div class="result-card">
        <div class="qrc-label">Pago até o momento</div>
        <div class="qrc-val" id="res-total-pago">${fmtBRL(totalPago)}</div>
        <div class="qrc-note">${notaPago}</div>
      </div>
      <div class="result-card">
        <div class="qrc-label">Parcela média estimada</div>
        <div class="qrc-val">${fmtBRL(media)}</div>
      </div>
    </div>

    <div class="result-card result-card-full" style="margin-top:10px">
      <div class="qrc-label">Total estimado de juros de obra
        ${premium && proporcaoReal > 0 ? `<span class="qrc-badge-refinado">✦ ${Math.round(proporcaoReal * 100)}% refinado</span>` : ''}
      </div>
      <div class="qrc-val">${fmtBRL(totalObra)}</div>
      <div class="qrc-note">${premium && proporcaoReal === 0
        ? 'Estimativa — refine inserindo os valores reais no Histórico de Parcelas'
        : premium
          ? 'Combinando valores reais com estimativas futuras'
          : 'Estimativa — TR futura, % de obra e prazo podem variar'
      }</div>
    </div>

    <div class="feature-grid">
      <button class="feat-btn" onclick="renderSliderResult()">
        <span class="feat-icon">📊</span>
        <span class="feat-label">Visualizador de Prestações</span>
      </button>
      <button class="feat-btn" onclick="${premium ? 'renderTabela()' : 'renderMiniTabela()'}">
        <span class="feat-icon">📋</span>
        <span class="feat-label">Histórico de Parcelas</span>
        ${premium ? '<span class="feat-badge feat-badge-premium">✦ Premium</span>' : ''}
      </button>
      <button class="feat-btn feat-soon" disabled>
        <span class="feat-icon">📤</span>
        <span class="feat-label">Exportar Excel</span>
        <span class="feat-badge feat-badge-soon">Em breve</span>
      </button>
      <button class="feat-btn feat-soon" disabled>
        <span class="feat-icon">🖼️</span>
        <span class="feat-label">Exportar Imagem</span>
        <span class="feat-badge feat-badge-soon">Em breve</span>
      </button>
      <button class="feat-btn feat-soon" disabled>
        <span class="feat-icon">🏦</span>
        <span class="feat-label">Banco vs Realidade</span>
        <span class="feat-badge feat-badge-soon">Em breve</span>
      </button>
      <button class="feat-btn feat-soon" disabled>
        <span class="feat-icon">📅</span>
        <span class="feat-label">Timeline Visual</span>
        <span class="feat-badge feat-badge-soon">Em breve</span>
      </button>
    </div>

    ${!premium ? `
    <button class="free-preview-cta" onclick="showPaywall()" style="margin-top:20px">
      🔓 Libere mais funcionalidades
      <span class="cta-price">R$ 4,99</span>
    </button>` : ''}

    <div class="quick-disclaimer-end">
      <p>Darwin não é uma ferramenta preditiva. Utilizamos a fórmula oficial de cálculo divulgada pela Caixa Econômica. Não nos responsabilizamos se previsões futuras não corresponderem à realidade, uma vez que valores cobrados serão sempre de encargo da instituição financeira.</p>
    </div>
  `);
}

// ── SLIDER (tela dedicada) ──
function renderSliderResult() {
  screen = 'sliderResult';
  _navPush('sliderResult');
  showBottomNav();
  aplicaBloqueio();

  const premium    = isPremium();
  const temFin     = parseFloat(form.parcelaFinanciamento || 0) > 0;
  const percPaga   = premium ? _ultimaPercPagaAtual() : 50;
  const ativas     = meses.filter(r => !r.bloqueado);
  const pagas      = premium ? ativas.filter(r => r.pago) : [];
  const temPagas   = pagas.length > 0;

  // Cards "Parcela atual" e "TR" — derivados do último mês pago
  let cardsPremium = '';
  if (premium && temPagas) {
    const ultimaPaga = pagas[pagas.length - 1];
    const idxUltima  = meses.indexOf(ultimaPaga);
    // "Parcela atual" = a próxima a vencer (mês seguinte à última paga).
    // O valor cobrado no mês i+1 é calculado sobre a medição do mês i (a última paga),
    // mesmo critério da tabela (ver _buildTableRows) e da quickSim ("Vence em mesMedido+1").
    const parcelaAtual = ultimaPaga.previsto;
    const trUltima     = ultimaPaga.tr;
    const temTR        = trUltima > 0;
    const trReais      = trUltima * ultimaPaga.saldo;
    const ini          = parseMS(form.mesInicial);
    const ymUltima     = addM(ini, idxUltima);
    const ymVence      = addM(ini, idxUltima + 1);

    cardsPremium = `
      <div class="result-header">
        <div class="result-card accent result-card-full">
          <div class="qrc-label">Parcela atual<br>Vence em ${mLabel(ymVence)}</div>
          <div class="qrc-val">${fmtBRL(parcelaAtual)}</div>
          <div class="qrc-note">${temTR ? 'Valor total' : 'Valor sem TR'}</div>
        </div>

        <h3>O valor da prestação acima é composto por:</h3>
        <div class="result-grid" style="margin-top:10px">
          <div class="result-card">
            <div class="qrc-label">Valor base</div>
            <div class="qrc-val">${fmtBRL(parcelaAtual - (trReais || 0))}</div>
            <div class="qrc-note">Juros sobre o Saldo Devedor</div>
          </div>
          <div class="result-card">
            <div class="qrc-label">Taxa Referencial<br>${temTR ? fmtPerc(trUltima * 100, 4) + ' · ' + mLabel(ymUltima) : ''}</div>
            <div class="qrc-val">${temTR ? fmtBRL(trReais) : '<small>Indisponível</small>'}</div>
            <div class="qrc-note">${temTR ? 'Correção Monetária' : '—'}</div>
          </div>
        </div>
      </div>`;
  }

  setHtml(`
    <button class="breadcrumb-back" onclick="history.back()">← Voltar à tela de resultados</button>
    <div class="screen-title">Visualizador de Prestações</div>

    ${cardsPremium}

    <div class="preview-slider-card" style="margin-top:12px">
      <div class="preview-slider-header">
        <div class="preview-slider-sub"><span>Arraste para simular diferentes estágios de obra</span></div>
      </div>
      <div class="slider-wrap">
        <div class="slider-labels">
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
        <input type="range" id="preview-slider" class="preview-slider"
          min="0" max="100" step="${premium ? 1 : 10}" value="${percPaga}"
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
          <dt class="slider-result-label">Prestação simulada<br><strong>Taxa Referencial = 0,0000%</strong></dt>
          <dd class="slider-result-val accent" id="slider-val">—</dd>
        </dl>
      </div>
    </div>
    ${temFin ? `
    <div class="result-grid-slider">
      <div class="result-card accent">
        <div class="qrc-label">1ª Parcela do Financiamento</div>
        <div class="qrc-val">${fmtBRL(form.parcelaFinanciamento)}</div>
      </div>
      <div id="slider-fin-bloco" class="slider-fin-bloco"></div>
    </div>` : ''}
    ${!premium ? `
    <button class="free-preview-cta" onclick="showPaywall()">
      🔓 Libere mais funcionalidades
      <span class="cta-price">R$ 4,99</span>
    </button>` : ''}
  `);

  setTimeout(() => { atualizaSlider(); if (premium) _syncSliderPremium(); }, 80);
}

// ── MINI TABELA (tela de pagamentos — versão gratuita) ──
function renderMiniTabela() {
  screen = 'tabela';
  _navPush('tabela');
  showBottomNav();
  aplicaBloqueio();

  const ativas = meses.filter(r => !r.bloqueado);
  if (!ativas.length) { history.back(); return; }

  const now    = new Date();
  const ymNow  = { y: now.getFullYear(), m: now.getMonth() + 1 };
  const ymIni  = parseMS(form.mesInicial);
  const ymFim  = parseMS(form.mesEntrega);

  const decorridos = mBetween(ymIni, ymNow);
  const totalSim   = mBetween(ymIni, ymFim);

  if (decorridos < 0) {
    setHtml(`
      <button class="breadcrumb-back" onclick="history.back()">← Voltar à tela de resultados</button>
      <div class="screen-title">Histórico de Parcelas</div>
      <div class="info-box" style="margin-top:12px">A simulação ainda não iniciou. O histórico estará disponível a partir de ${mLabel(ymIni)}.</div>
    `);
    return;
  }

  const countRows = Math.min(decorridos + 1, totalSim + 1, ativas.length);

  const rows = ativas.slice(0, countRows).map((r, i) => `
    <tr id="mini-row-${i}" class="${r.pago ? 'pago-row' : ''}${i % 2 === 1 ? ' row-alt' : ''}">
      <td class="num-col">${i + 1}</td>
      <td class="td-mes">${escHtml(r.mes)}</td>
      <td class="td-right">
        <div class="input-wrap mini-val-wrap">
          <span class="pre" style="font-size:12px">R$</span>
          <input type="text" id="mini-val-${i}" class="has-pre mini-val-input" inputmode="numeric" placeholder="—">
        </div>
      </td>
      <td class="td-center">
        <span id="mini-badge-${i}" class="${r.pago ? 'badge-pago' : 'badge-nao'}">${r.pago ? '✓ Pago' : 'Não pago'}</span>
      </td>
    </tr>`).join('');

  setHtml(`
    <button class="breadcrumb-back" onclick="history.back()">← Voltar à tela de resultados</button>
    <div class="screen-title">Histórico de Parcelas</div>
    ${totalSim < decorridos ? '<div class="info-box" style="margin-top:12px;margin-bottom:12px">⚠️ A data de entrega está no passado — ajuste-a em <strong>Editar</strong> se necessário.</div>' : ''}
    <div class="mini-somatorio-sticky" id="mini-somatorio">
      <span class="mini-soma-label">Total pago</span>
      <span class="mini-soma-val" id="mini-total-val">${fmtBRL(0)}</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th class="th-center">#</th>
          <th>Mês</th>
          <th class="th-right">Valor pago</th>
          <th class="th-center">Pago?</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <button class="free-preview-cta" onclick="showPaywall()" style="margin-top:16px">
      🔓 Libere mais funcionalidades
      <span class="cta-price">R$ 4,99</span>
    </button>
  `);

  setTimeout(() => _initMiniTabelaMasks(countRows), 80);
}

function _initMiniTabelaMasks(countRows) {
  const ativas = meses.filter(r => !r.bloqueado);
  for (let i = 0; i < countRows; i++) {
    const r = ativas[i];
    if (!r) break;
    const mesIdx = meses.indexOf(r);
    attachMask('mini-val-' + i, 'brl', r.valorReal || '');
    const el = document.getElementById('mini-val-' + i);
    if (!el) continue;
    el.oninput = () => {
      maskValue(el, 'brl');
      const v = maskRead(el);
      if (v && v > 0) {
        r.pago      = true;
        r.valorReal = v;
      } else {
        r.pago      = false;
        r.valorReal = null;
      }
      hasUnsavedChanges = true;
      _syncValorRealToForm(mesIdx);
      const badge = document.getElementById('mini-badge-' + i);
      if (badge) { badge.className = r.pago ? 'badge-pago' : 'badge-nao'; badge.textContent = r.pago ? '✓ Pago' : '—'; }
      const row = document.getElementById('mini-row-' + i);
      if (row) row.className = r.pago ? 'pago-row' : '';
      _updateMiniSomatorio(countRows);
    };
  }
  _updateMiniSomatorio(countRows);
}

function _updateMiniSomatorio(countRows) {
  const ativas = meses.filter(r => !r.bloqueado);
  let total = 0;
  for (let i = 0; i < countRows; i++) {
    if (ativas[i]?.valorReal) total += ativas[i].valorReal;
  }
  const val = document.getElementById('mini-total-val');
  if (val) val.textContent = fmtBRL(total);
}
