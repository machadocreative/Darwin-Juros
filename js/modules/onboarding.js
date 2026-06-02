// ── ONBOARDING (Simulação Completa — 7 passos) ──

function novaSimulacao(target) {
  currentProfileId = null;
  window._editMode = null;
  migrationSkipCheck = null;
  migrationAbort = null;
  fluxo = target === 'quick' ? 'quick' : 'complete';
  Object.keys(form).forEach(k => { form[k] = ''; });
  form.percFinanciado      = 80.00;
  form.valorFinanciado     = null;
  form.parcelaFinanciamento = null;
  form.historicoPagamentos = [];
  Object.keys(formQuick).forEach(k => { formQuick[k] = ''; });
  formQuick.parcelaFinanciamento = null;
  meses = []; currentStep = 0;
  if (target === 'quick') {
    hideBottomNav();
    initFlow(FLOW_QUICKSIM); screen = 'quick'; currentStep = 0; renderFlowStep();
  } else if (target === 'complete') {
    hideBottomNav();
    initFlow(FLOW_FULLSIM); screen = 'onboarding'; currentStep = 0; renderFlowStep();
  } else {
    renderHome();
  }
}

// ── EDITAR SIMULAÇÃO EXISTENTE ──
// Volta ao onboarding A mantendo todos os dados já preenchidos.
function editarSimulacao() {
  if (hasUnsavedChanges) {
    showSaveReminder(() => { hasUnsavedChanges = false; _iniciarEdicao(); });
  } else {
    _iniciarEdicao();
  }
}

function _iniciarEdicao() {
  migrationSkipCheck = null;
  migrationAbort = null;
  fluxo = 'complete';
  const mesesBackup     = JSON.parse(JSON.stringify(meses));
  const profileIdBackup = currentProfileId;
  screen = 'onboarding';
  currentStep = 0;
  window._editMode = { mesesBackup, profileIdBackup };
  renderEditScreen();
}

// ── TELA ÚNICA DE EDIÇÃO ──
function renderEditScreen() {
  _navPush('editScreen');
  const premium = isPremium();
  const _vtFmt  = (parseFloat(form.valorTotal) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const _finAmt = parseFloat(form.valorFinanciado || 0);
  const _finFmt = _finAmt.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const html = `
    <div class="edit-screen">
      <div class="step-card edit-intro-card">
        <div class="step-title">Editar Simulação</div>
        <div class="step-hint">Altere os campos desejados e confirme no final da página.</div>
      </div>

      <div class="edit-section">
        <div class="edit-section-title">Valor do Imóvel</div>
        ${premium ? `
          <div class="field-group">
            <label class="field-label">1. Imóvel</label>
            <div class="input-wrap">
              <span class="pre">R$</span>
              <input type="text" id="${QUESTION_IDS.valorTotal}" class="has-pre" value="${_vtFmt}" disabled style="opacity:.5;cursor:not-allowed">
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">2. Financiamento</label>
            <div class="input-wrap">
              <span class="pre">R$</span>
              <input type="text" id="${QUESTION_IDS.financiamentoTotal}" class="has-pre" value="${_finFmt}" disabled style="opacity:.5;cursor:not-allowed">
            </div>
          </div>
          <div class="info-box" style="margin-top:8px;font-size:13px">🔒 Bloqueado após o desbloqueio premium. Para alterar esses valores, crie uma nova simulação.</div>
        ` : questions.valorImovel.render()}
      </div>

      <div class="edit-section">
        <div class="edit-section-title">Valor do Terreno</div>
        ${questions.valorTerreno.render()}
      </div>

      <div class="edit-section">
        <div class="edit-section-title">Taxa de Juros</div>
        ${questions.taxaAnual.render()}
      </div>

      <div class="edit-section">
        <div class="edit-section-title">Encargos Mensais</div>
        ${questions.seguro.render()}
      </div>

      <div class="edit-section">
        <div class="edit-section-title">1ª Parcela do Financiamento — Opcional</div>
        ${questions.parcelaFinanciamento.render()}
      </div>

      <div class="edit-section">
        <div class="edit-section-title">Datas</div>
        ${isPremium() ? `
          <div class="step-hint">O mês de início está bloqueado. Você pode alterar apenas a data de entrega prevista.</div>
          <div class="field-group">
            <label class="field-label">1. Início dos pagamentos</label>
            <div class="label-hint">Mês da sua primeira prestação, quando inicia a obra.</div>
            <input type="month" id="${QUESTION_IDS.mesInicial}" value="${form.mesInicial}" disabled style="opacity:.5;cursor:not-allowed">
            <div class="info-box" style="margin-top:8px;font-size:13px">🔒 Bloqueado após o desbloqueio premium. Para iniciar em outro mês, crie uma nova simulação.</div>
          </div>
          <br>
          <div class="field-group">
            <label class="field-label">2. Data de entrega prevista</label>
            <div class="label-hint">Mês previsto para a última prestação de juros de Evolução de Obra. A amortização do Financiamento inicia no mês seguinte a este.</div>
            <input type="month" id="${QUESTION_IDS.mesEntrega}" value="${form.mesEntrega}" oninput="atualizaMesesStep0();this.classList.remove('invalid');document.getElementById('err-mes-entrega').style.display='none'">
            <div class="error-msg" id="err-mes-entrega" style="display:none">A data de entrega deve ser após a 1ª parcela.</div>
          </div>
          <div id="badge-meses"></div>
          <div class="info-box" id="info-box-entrega">💡 A entrega do seu imóvel poderá ser antecipada ou sofrer atrasos — Altere essa data sempre que for necessário.</div>
        ` : questions.mesInicial.render()}
      </div>

      <div class="edit-section">
        <div class="edit-section-title">Nome da Simulação</div>
        ${questions.nomePerfil.render()}
      </div>
    </div>

    <div class="edit-sticky-footer">
      <button class="btn btn-back" onclick="cancelarEdicao()">← Cancelar</button>
      <button class="btn btn-primary" onclick="confirmarEdicao()">Confirmar →</button>
    </div>`;

  setHtml(html);

  setTimeout(() => {
    if (!premium) questions.valorImovel.init();
    questions.valorTerreno.init();
    questions.taxaAnual.init();
    questions.seguro.init();
    questions.parcelaFinanciamento.init();
    questions.mesInicial.init();
    questions.nomePerfil.init();
  }, 80);
}

function confirmarEdicao() {
  const premium = isPremium();
  if (!premium) {
    if (!questions.valorImovel.validate()) return;
    questions.valorImovel.save(); // necessário antes de valorTerreno e parcelaFinanciamento validarem
  }
  if (!questions.valorTerreno.validate()) return;
  if (!questions.taxaAnual.validate())    return;
  if (!questions.seguro.validate())       return;
  if (!questions.parcelaFinanciamento.validate()) return;
  if (!questions.mesInicial.validate())   return;
  if (!questions.nomePerfil.validate())   return;

  questions.valorTerreno.save();
  questions.taxaAnual.save();
  questions.seguro.save();
  questions.parcelaFinanciamento.save();
  if (premium) {
    form.mesEntrega = document.getElementById(QUESTION_IDS.mesEntrega)?.value || form.mesEntrega;
  } else {
    questions.mesInicial.save();
  }
  questions.nomePerfil.save();

  _finalizarOnboarding();
}

function cancelarEdicao() {
  window._editMode = null;
  history.back();
}

// ── MODAL RENOMEAR PERFIL ──
function abrirRenomearPerfil(targetId) {
  const id = (targetId !== undefined && targetId !== null) ? targetId : currentProfileId;
  const profiles = loadProfiles();
  const p = id ? profiles.find(pr => pr.id === id) : null;
  const nomeAtual = p ? p.nome : (form.nomeSimulacao || '');

  const overlay = document.createElement('div');
  overlay.id = 'modal-renomear-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">Como deseja chamar essa simulação?</div>
      <input type="hidden" id="modal-target-id" value="${escHtml(id || '')}">
      <input type="text" id="modal-nome-input" class="modal-input" placeholder="Apto 101"
        maxlength="30" value="${escHtml(nomeAtual)}"
        oninput="document.getElementById('modal-char-count').textContent=this.value.length+' / 30';document.getElementById('err-modal-nome').style.display='none'">
      <div class="char-count" id="modal-char-count">${nomeAtual.length} / 30</div>
      <div class="error-msg" id="err-modal-nome" style="display:none">Já existe um perfil com esse nome. Utilize um nome diferente.</div>
      <div class="modal-actions">
        <button class="btn btn-back" onclick="fecharModalRenomear()">← Cancelar</button>
        <button class="btn btn-primary" onclick="confirmarRenomearPerfil()">Confirmar →</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const el = document.getElementById('modal-nome-input');
  if (el) { el.focus(); el.select(); }
}

function fecharModalRenomear() {
  const overlay = document.getElementById('modal-renomear-overlay');
  if (overlay) overlay.remove();
}

function confirmarRenomearPerfil() {
  const el = document.getElementById('modal-nome-input');
  const hiddenId = document.getElementById('modal-target-id');
  if (!el) return;

  const raw = sanitizeName(el.value) || 'Apto 101';
  const targetId = hiddenId?.value || null;

  const profiles = loadProfiles();
  const duplicado = profiles.find(p => p.nome.toLowerCase() === raw.toLowerCase() && p.id !== targetId);
  if (duplicado) {
    el.classList.add('invalid');
    const e = document.getElementById('err-modal-nome'); if (e) e.style.display = 'block';
    return;
  }

  if (targetId) {
    const idx = profiles.findIndex(p => p.id === targetId);
    if (idx >= 0) { profiles[idx].nome = raw; saveProfiles(profiles); }
  }

  if (targetId === currentProfileId) {
    form.nomeSimulacao = raw;
  } else if (!targetId && currentProfileId === null) {
    form.nomeSimulacao = raw;
    hasUnsavedChanges = true;
  }

  fecharModalRenomear();
  showToast('✅ Simulação renomeada.');

  if (screen === 'result') renderResult();
  else if (screen === 'profiles') renderProfiles();
}


function _finalizarOnboarding() {
  migrationSkipCheck = null;
  const edit = window._editMode;
  if (edit) {
    const newTable = calcTable();
    const backup   = edit.mesesBackup;

    const novoTotal = newTable.length;
    const linhasAfetadas = backup.slice(novoTotal).filter(r => (r.pago || r.valorReal != null) && !r.bloqueado);
    if (linhasAfetadas.length > 0 && !window._confirmouReducaoPrazo) {
      _mostrarModalPerdaDados(linhasAfetadas);
      return;
    }
    window._confirmouReducaoPrazo = false;

    meses = newTable.map((row, i) => {
      if (i < backup.length) {
        return { ...row, perc: backup[i].perc, tr: backup[i].tr, pago: backup[i].pago };
      }
      return row;
    });
    meses.forEach((_, i) => recalcRow(i));
    aplicaBloqueio();
    // Aplica valorReal a partir de form.historicoPagamentos (fonte de verdade — mantida em sync por _syncValorRealToForm e historicoPagamentos.save)
    const histEdit  = form.historicoPagamentos || [];
    const ativasEdit = meses.filter(r => !r.bloqueado);
    histEdit.forEach((entry, j) => {
      if (j < ativasEdit.length) ativasEdit[j].valorReal = entry.valor > 0 ? entry.valor : null;
    });
    currentProfileId  = edit.profileIdBackup;
    window._editMode  = null;
    hasUnsavedChanges = true;
  } else {
    meses = calcTable();
    // Aplica histórico de pagamentos (tela 7) e popula valorReal
    const hist = form.historicoPagamentos || [];
    const ativas = meses.filter(r => !r.bloqueado);
    hist.forEach((entry, i) => {
      if (i < ativas.length && entry.valor > 0) {
        ativas[i].pago = true;
        ativas[i].valorReal = entry.valor;
      }
    });
    aplicaBloqueio();
    saveProfile(false, 'Perfil salvo com sucesso!');
  }
  _navResetFlow('result', () => { screen = 'result'; renderResult(); });
}



function _mostrarModalPerdaDados(linhasAfetadas) {
  const mesesLabel = linhasAfetadas.map(r => r.mes).join(', ');
  const overlay = document.createElement('div');
  overlay.id = 'modal-perda-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">⚠️ Dados serão perdidos</div>
      <p style="margin:12px 0 4px">Ao continuar, <strong>${linhasAfetadas.length}</strong> mês(es) será(ão) removido(s):</p>
      <p style="margin-bottom:12px;color:var(--muted)"><strong>${mesesLabel}</strong></p>
      <p>Parcelas pagas ou com valores registrados nesses meses serão perdidas permanentemente.</p>
      <div class="modal-actions" style="margin-top:16px">
        <button class="btn btn-back" onclick="document.getElementById('modal-perda-overlay').remove();window._confirmouReducaoPrazo=false">← Cancelar</button>
        <button class="btn btn-primary" onclick="document.getElementById('modal-perda-overlay').remove();window._confirmouReducaoPrazo=true;_finalizarOnboarding()">Confirmar →</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

// ── ATUALIZAÇÕES INLINE DOS CAMPOS ──

// Badge de meses na tela 0 — lê ambos os campos da mesma tela
function atualizaMesesStep0() {
  const elIni = document.getElementById('inp-mesInicial');
  const elFim = document.getElementById('inp-mesEntrega');
  if (!elIni || !elFim) return;
  const ini = elIni.value;
  const fim = elFim.value;
  // Atualiza form.mesInicial em tempo real para que mLabelFull funcione nas telas seguintes
  if (ini) form.mesInicial = ini;
  _renderBadgeMeses(ini, fim);
}

// Badge de meses genérico (reutilizado em atualizaMeses se necessário)
function _renderBadgeMeses(ini, fim) {
  const badge   = document.getElementById('badge-meses');
  const infoBox = document.getElementById('info-box-entrega');
  if (!badge || !ini || !fim) {
    if (infoBox) infoBox.style.display = 'none';
    return;
  }
  const iniParsed = parseMS(ini), fimParsed = parseMS(fim);
  const n = mBetween(iniParsed, fimParsed);
  const totalParcelas = n + 1;
  if (infoBox) infoBox.style.display = n >= 1 ? '' : 'none';
  if (n >= 1 && totalParcelas <= MAX_MESES)
    badge.innerHTML = `
      <div class="confirm-box">
        <div><div class="c-label">📅 ${mLabelFull(ini)} → ${mLabelFull(fim)}</div></div>
        <div class="c-val">${totalParcelas} parcela(s)</div>
      </div>`;
  else if (totalParcelas > MAX_MESES)
    badge.innerHTML = `<div class="confirm-box err">⚠️ Máximo ${MAX_MESES} parcelas. Serão exibidas apenas as primeiras ${MAX_MESES}.</div>`;
  else
    badge.innerHTML = `<div class="confirm-box err">⚠️ A data de entrega deve ser após a 1ª parcela.</div>`;
}
function atualizaTer() {
  const fin = parseFloat(formQuick.totalFinanciado || form.valorFinanciado) || 0;
  const elTer = document.getElementById('inp-valorTerreno');
  const ter = maskRead(elTer) || 0;
  const box = document.getElementById('box-ter');
  if (box) box.style.display = ter > 0 ? 'block' : 'none';
  const dt = document.getElementById('d-ter'), ds = document.getElementById('d-saldo');
  if (dt) dt.textContent = fmtBRL(ter);
  if (ds) ds.textContent = fmtBRL(Math.max(0, fin - ter));
}

function atualizaTaxa() {
  const el = document.getElementById('inp-taxaAnual');
  // Lê via maskRead para garantir que a máscara já foi aplicada
  const ta = maskRead(el) || 0;
  const box = document.getElementById('box-taxa');
  if (box) box.style.display = ta > 0 ? 'block' : 'none';
  const elMensal    = document.getElementById('val-taxa-mensal');
  const elCombinada = document.getElementById('val-taxa');
  if (elMensal)    elMensal.textContent    = fmtPerc(ta / 12, 4);
  if (elCombinada) elCombinada.textContent = fmtPerc(ta / 12 + 0.1, 4);
}

function atualizaEncargos() {
  const s = maskRead(document.getElementById('inp-seguro')) || 0;
  const a = maskRead(document.getElementById('inp-taxaAdm')) || 25;
  const box = document.getElementById('box-enc'), val = document.getElementById('val-enc');
  if (box && val) { box.style.display = s > 0 ? 'flex' : 'none'; val.textContent = fmtBRL(s + a); }
}

// ── MINI-TABELA DE HISTÓRICO (tela 5) ──

// Inicializa máscaras de todos os inputs de histórico presentes no DOM
function _initHistMasks() {
  const hist = form.historicoPagamentos || [];
  let i = 0;
  while (document.getElementById(`hist-val-${i}`)) {
    const savedVal = hist[i]?.valor || 0;
    attachMask(`hist-val-${i}`, 'brl', savedVal > 0 ? savedVal : '');
    i++;
  }
  _updateHistControls();
}

function _updateHistControls() {
  let count = 0;
  while (document.getElementById(`hist-val-${count}`)) count++;
  const info   = document.getElementById('hist-rc-info');
  const btnRem = document.getElementById('hist-btn-rem');
  if (info)   info.textContent = count + ' parcela(s)';
  if (btnRem) btnRem.disabled  = count <= 1;
}

function histAdicionarLinha() {
  const tbody = document.getElementById('hist-tbody');
  if (!tbody) return;
  // Conta linhas existentes
  let i = 0;
  while (document.getElementById(`hist-val-${i}`)) i++;
  if (i >= MAX_MESES) { showToast(`⚠️ Máximo ${MAX_MESES} parcelas.`); return; }
  const mesLabel = form.mesInicial
    ? mLabel(addM(parseMS(form.mesInicial), i))
    : `Parcela ${i + 1}`;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="num-col">${i + 1}</td>
    <td class="td-mes" style="font-size:12px">${mesLabel}</td>
    <td class="td-right">
      <div class="input-wrap">
        <span class="pre" style="font-size:12px">R$</span>
        <input type="text" id="hist-val-${i}" class="has-pre hist-val-input"
          placeholder="0,00" inputmode="numeric"
          oninput="maskOnInput(this);_atualizaSomatorio()">
      </div>
    </td>`;
  tbody.appendChild(tr);
  attachMask(`hist-val-${i}`, 'brl', '');
  _updateHistControls();
  document.getElementById(`hist-val-${i}`)?.focus();
}

function histRemoverLinha() {
  const tbody = document.getElementById('hist-tbody');
  if (!tbody) return;
  let count = 0;
  while (document.getElementById(`hist-val-${count}`)) count++;
  if (count <= 1) return;
  tbody.removeChild(tbody.lastElementChild);
  _updateHistControls();
  _atualizaSomatorio();
}

function _atualizaSomatorio() {
  const fin = parseFloat(formQuick.totalFinanciado || form.valorFinanciado) || 0;
  let total = 0, i = 0, hasError = false;
  while (document.getElementById(`hist-val-${i}`)) {
    const el = document.getElementById(`hist-val-${i}`);
    const v = maskRead(el) || 0;
    total += v;
    if (fin > 0 && v > fin) {
      el.classList.add('invalid');
      hasError = true;
    } else {
      el.classList.remove('invalid');
    }
    i++;
  }
  const box = document.getElementById('box-somatorio');
  const val = document.getElementById('val-somatorio');
  const err = document.getElementById('err-hist-parcela');
  if (box) box.style.display = total > 0 ? 'block' : 'none';
  if (val) val.textContent   = fmtBRL(total);
  if (err) err.style.display = hasError ? 'block' : 'none';
}
