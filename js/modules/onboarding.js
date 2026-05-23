// ── ONBOARDING (Simulação Completa — 7 passos) ──

function novaSimulacao() {
  currentProfileId = null;
  window._editMode = null;
  migrationSkipCheck = null;
  fluxo = 'complete';
  Object.keys(form).forEach(k => { form[k] = ''; });
  form.percFinanciado      = 80.00;
  form.parcelaFinanciamento = null;
  form.historicoPagamentos = [];
  Object.keys(formQuick).forEach(k => { formQuick[k] = ''; });
  formQuick.percObra             = 50;
  formQuick.parcelaFinanciamento = null;
  meses = []; currentStep = 0;
  renderBifurcacao();
}

// ── NAVEGAÇÃO SEGURA (com lembrete de salvar) ──
function goProfilesSafe() {
  if ((screen === 'result' || screen === 'tabela') && hasUnsavedChanges) {
    showSaveReminder(() => { hasUnsavedChanges = false; goProfiles(); });
  } else {
    goProfiles();
  }
}

function novaSimulacaoSafe() {
  if ((screen === 'result' || screen === 'tabela') && hasUnsavedChanges) {
    showSaveReminder(() => { hasUnsavedChanges = false; novaSimulacao(); });
  } else {
    novaSimulacao();
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
  const html = `
    <div class="edit-screen">
      <div class="step-card edit-intro-card">
        <div class="step-title">Editar Simulação</div>
        <div class="step-hint">Altere os campos desejados e confirme no final da página.</div>
      </div>

      <div class="edit-section">
        <div class="edit-section-title">Datas</div>
        ${questions.mesInicial.render()}
      </div>

      <div class="edit-section">
        <div class="edit-section-title">Valor do Imóvel</div>
        ${questions.valorImovel.render()}
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
        <div class="edit-section-title">Histórico de Pagamentos — Opcional</div>
        ${questions.historicoPagamentos.render()}
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
    questions.mesInicial.init();
    questions.valorImovel.init();
    questions.valorTerreno.init();
    questions.taxaAnual.init();
    questions.seguro.init();
    questions.parcelaFinanciamento.init();
    questions.historicoPagamentos.init();
    questions.nomePerfil.init();
  }, 80);
}

function confirmarEdicao() {
  if (!questions.mesInicial.validate())   return;
  if (!questions.valorImovel.validate())  return;
  // Save valorImovel early so valorTerreno/parcelaFinanciamento validations use updated form values
  questions.valorImovel.save();
  if (!questions.valorTerreno.validate()) return;
  if (!questions.taxaAnual.validate())    return;
  if (!questions.seguro.validate())       return;
  if (!questions.parcelaFinanciamento.validate()) return;
  if (!questions.nomePerfil.validate())   return;

  questions.mesInicial.save();
  questions.valorTerreno.save();
  questions.taxaAnual.save();
  questions.seguro.save();
  questions.parcelaFinanciamento.save();
  questions.historicoPagamentos.save();
  questions.nomePerfil.save();

  _finalizarOnboarding();
}

function cancelarEdicao() {
  window._editMode = null;
  screen = 'result';
  renderResult();
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
        oninput="document.getElementById('modal-char-count').textContent=this.value.length+' / 30'">
      <div class="char-count" id="modal-char-count">${nomeAtual.length} / 30</div>
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
    showToast('⚠️ Já existe um perfil com esse nome. Utilize um nome diferente.');
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

// ── BIFURCAÇÃO INICIAL ──
function renderBifurcacao() {
  screen = 'bifurcacao';
  setHtml(`
    <div class="step-card">
      <div class="step-title">O que você precisa agora?</div>
      <div class="step-hint">Escolha o tipo de simulação.</div>
        <button class="btn-bifurc bifurc-b" onclick="escolherFluxo('quick')">
          <span class="bifurc-icon">⚡</span>
          <div>
            <div class="bifurc-label">Simulação rápida</div>
            <div class="bifurc-sub">Descubra de forma aproximada quais serão suas próximas prestações. Apenas 4 perguntas.</div>
          </div>
        </button>

        <button class="btn-bifurc bifurc-a" onclick="escolherFluxo('onboarding')" title="Em breve">
          <span class="bifurc-icon">📋</span>
          <div>
            <div class="bifurc-label">Simulação detalhada</div>
            <div class="bifurc-sub">Recomendado para quem quer ter mais controle de todas as prestações desde o início da obra. EM BREVE.</div>
          </div>
        </button>
    </div>
  `);
}

function escolherFluxo(f) {
  fluxo = f;
  if (f === 'quick') {
    initFlow(FLOW_QUICKSIM); screen = 'quick'; currentStep = 0; renderFlowStep();
  } else {
    initFlow(FLOW_FULLSIM); screen = 'onboarding'; currentStep = 0; renderFlowStep();
  }
}

function _finalizarOnboarding() {
  migrationSkipCheck = null;
  const edit = window._editMode;
  if (edit) {
    const newTable = calcTable();
    const backup   = edit.mesesBackup;

    const novoTotal = newTable.length;
    const linhasPagasASerPerdidas = backup.slice(novoTotal).filter(r => r.pago && !r.bloqueado);
    if (linhasPagasASerPerdidas.length > 0) {
      if (!window._confirmouReducaoPrazo) {
        window._confirmouReducaoPrazo = true;
        currentStep--;
        showToast('⚠️ O novo prazo é menor que o original. ' + linhasPagasASerPerdidas.length + ' parcela(s) paga(s) serão perdidas. Clique em continuar novamente para confirmar.');
        return;
      }
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
    currentProfileId  = edit.profileIdBackup;
    window._editMode  = null;
    hasUnsavedChanges = true;
  } else {
    meses = calcTable();
    // Aplica histórico de pagamentos (tela 6) se o usuário preencheu
    const hist = form.historicoPagamentos || [];
    const ativas = meses.filter(r => !r.bloqueado);
    hist.forEach((entry, i) => {
      if (i < ativas.length && entry.valor > 0) {
        ativas[i].pago = true;
      }
    });
    aplicaBloqueio();
    hasUnsavedChanges = false;
  }
  screen = 'result';
  renderResult();
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
  const badge = document.getElementById('badge-meses');
  if (!badge || !ini || !fim) return;
  const iniParsed = parseMS(ini), fimParsed = parseMS(fim);
  const n = mBetween(iniParsed, fimParsed);
  const totalParcelas = n + 1;
  if (n >= 1 && totalParcelas <= MAX_MESES)
    badge.innerHTML = `<div class="months-badge">📅 ${mLabelFull(ini)} → ${mLabelFull(fim)} = <strong>${totalParcelas} parcela(s)</strong></div>`;
  else if (totalParcelas > MAX_MESES)
    badge.innerHTML = `<div class="months-badge err">⚠️ Máximo ${MAX_MESES} parcelas. Serão exibidas apenas as primeiras ${MAX_MESES}.</div>`;
  else
    badge.innerHTML = `<div class="months-badge err">⚠️ A data de entrega deve ser após a 1ª parcela.</div>`;
}
function atualizaFin() {
  const elVT = document.getElementById('inp-valorTotal');
  const elPF = document.getElementById('inp-percFinanciado');
  const vt = maskRead(elVT) || 0;
  const p = maskRead(elPF) || 80;
  const fin = vt * (p / 100);
  const nfin = vt - fin;
  const box = document.getElementById('box-fin');
  if (box) box.style.display = vt > 0 ? 'block' : 'none';
  const elTotal = document.getElementById('val-total');
  const elFin = document.getElementById('val-fin');
  const elNfin = document.getElementById('val-nfin');
  const elPercLabel = document.getElementById('val-perc-label');
  const elNfinPerc = document.getElementById('val-nfin-perc');
  if (elTotal) elTotal.textContent = fmtBRL(vt);
  if (elFin)   elFin.textContent = fmtBRL(fin);
  if (elNfin)  elNfin.textContent = fmtBRL(nfin);
  if (elPercLabel) elPercLabel.textContent = p;
  if (elNfinPerc)  elNfinPerc.textContent = parseFloat((100 - p).toFixed(1));
}

function atualizaTer() {
  const fin = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100);
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
  let total = 0, i = 0;
  while (document.getElementById(`hist-val-${i}`)) {
    total += maskRead(document.getElementById(`hist-val-${i}`)) || 0;
    i++;
  }
  const box = document.getElementById('box-somatorio');
  const val = document.getElementById('val-somatorio');
  if (box) box.style.display = total > 0 ? 'block' : 'none';
  if (val) val.textContent   = fmtBRL(total);
}
