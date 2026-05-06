// ── ONBOARDING (Fluxo A — 7 passos) ──

function novaSimulacao() {
  currentProfileId = null;
  window._editMode = null;
  window._inferidoB = null;
  fluxo = 'A';
  Object.keys(form).forEach(k => { form[k] = ''; });
  Object.keys(formB).forEach(k => { formB[k] = ''; });
  form.percFinanciado = 80; form.trInicial = 0.001;
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
  // fluxo B sempre redireciona para o onboarding A completo (com dados pré-preenchidos)
  fluxo = 'A';
  window._inferidoB = null;
  const mesesBackup = JSON.parse(JSON.stringify(meses));
  const profileIdBackup = currentProfileId;
  screen = 'onboarding';
  currentStep = 0;
  window._editMode = { mesesBackup, profileIdBackup };
  renderStep();
}

// ── BIFURCAÇÃO INICIAL ──
function renderBifurcacao() {
  screen = 'bifurcacao';
  setHtml(`
    <div class="step-card">
      <div class="step-title">Em que fase você está?</div>
      <div class="step-hint">Escolha a opção que melhor descreve o seu momento.</div>
      <div class="bifurcacao-grid">
        <button class="btn-bifurc bifurc-a" onclick="escolherFluxo('A')">
          <span class="bifurc-icon">💰</span>
          <div>
            <div class="bifurc-label">Ainda não comecei a pagar</div>
            <div class="bifurc-sub">Meu contrato foi assinado recentemente ou as parcelas ainda não começaram</div>
          </div>
        </button>
        <button class="btn-bifurc bifurc-b" onclick="escolherFluxo('B')">
          <span class="bifurc-icon">💸</span>
          <div>
            <div class="bifurc-label">Já estou pagando juros de obra</div>
            <div class="bifurc-sub">Já paguei algumas parcelas e quero acompanhar as próximas</div>
          </div>
        </button>
      </div>
    </div>
  `);
}

function escolherFluxo(f) {
  fluxo = f;
  if (f === 'A') {
    screen = 'onboarding'; currentStep = 0; renderStep();
  } else {
    screen = 'fluxoB'; currentStep = 0; renderFluxoB();
  }
}

// ── VALIDAÇÃO E AVANÇO DE PASSOS ──
function nextStep() {
  try {
    if (currentStep === 0) {
      const v = document.getElementById('inp-mesInicial').value;
      if (!v) { markError('inp-mesInicial'); return; }
      form.mesInicial = v;
      // Captura mesEntrega já na tela 0 (campo duplo)
      const ve = document.getElementById('inp-mesEntrega');
      if (ve && ve.value) form.mesEntrega = ve.value;
    } else if (currentStep === 1) {
      const elVT = document.getElementById('inp-valorTotal');
      const elPF = document.getElementById('inp-percFinanciado');
      const v = maskRead(elVT);
      if (!v || v <= 0) { elVT?.classList.add('invalid'); return; }
      form.valorTotal = String(v);
      form.percFinanciado = maskRead(elPF) || 80;
    } else if (currentStep === 2) {
      const elTer = document.getElementById('inp-valorTerreno');
      const v = maskRead(elTer);
      const fin = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100);
      if (!v || v <= 0) { elTer?.classList.add('invalid'); return; }
      if (v >= fin) { elTer?.classList.add('invalid'); document.getElementById('err-terreno').style.display = 'block'; return; }
      form.valorTerreno = String(v);
    } else if (currentStep === 3) {
      const elSeg = document.getElementById('inp-seguro');
      const elAdm = document.getElementById('inp-taxaAdm');
      const s = maskRead(elSeg);
      if (!s || s <= 0) { elSeg?.classList.add('invalid'); return; }
      form.seguro = String(s);
      form.taxaAdm = String(maskRead(elAdm) || 25);
    } else if (currentStep === 4) {
      const elTa = document.getElementById('inp-taxaAnual');
      const v = maskRead(elTa);
      if (!v || v <= 0) { elTa?.classList.add('invalid'); return; }
      form.taxaAnual = String(v);
    } else if (currentStep === 5) {
      const v = document.getElementById('inp-mesEntrega').value;
      if (!v) { markError('inp-mesEntrega'); return; }
      const ini = parseMS(form.mesInicial), fin = parseMS(v);
      if (mBetween(ini, fin) < 1) { markError('inp-mesEntrega'); return; }
      form.mesEntrega = v;
    } else if (currentStep === 6) {
      const raw = sanitizeName(document.getElementById('inp-nome').value) || 'Apto 101';
      const profiles = loadProfiles();
      const duplicado = profiles.find(p => p.nome.toLowerCase() === raw.toLowerCase() && p.id !== currentProfileId);
      if (duplicado) { showToast('⚠️ Já existe um perfil com esse nome. Utilize um nome diferente.'); markError('inp-nome'); return; }
      form.nomeSimulacao = raw;
    }

    currentStep++;

    if (currentStep >= TOTAL_STEPS) {
      _finalizarOnboarding();
    } else {
      renderStep();
    }
  } catch (e) { console.error(e); }
}

function _finalizarOnboarding() {
  const edit = window._editMode;
  if (edit) {
    const newTable = calcTable();
    const backup = edit.mesesBackup;

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
    currentProfileId = edit.profileIdBackup;
    window._editMode = null;
    hasUnsavedChanges = true;
  } else {
    meses = calcTable();
    hasUnsavedChanges = false;
  }
  screen = 'result';
  renderResult();
}

function prevStep() {
  if (currentStep > 0) { currentStep--; renderStep(); }
}

// ── RENDER DAS TELAS DO ONBOARDING ──
function renderStep() {
  const fin_val = form.valorTotal ? parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100) : 0;
  const ter = parseFloat(form.valorTerreno) || 0;
  const fin = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100) || 0;
  const seg = parseFloat(form.seguro) || 0;
  const ta = parseFloat(form.taxaAnual) || 0;

  const steps = [
    // Passo 0 — Datas
    `<div class="step-num">01 / 07</div>
    <div class="step-title">Quando inicia o pagamento de Juros de Evolução de Obra?</div>
    <div class="step-hint">Verifique no seu contrato com a Caixa Econômica.</div>
    <input type="month" id="inp-mesInicial" value="${form.mesInicial}" oninput="this.classList.remove('invalid')">
    <br><br>
    <div class="step-title">Qual a data de entrega prevista?</div>
    <div class="step-hint">A data de entrega define quantos meses de evolução serão simulados.</div>
    <input type="month" id="inp-mesEntrega" value="${form.mesEntrega}" oninput="atualizaMeses();this.classList.remove('invalid')">
    <div id="badge-meses"></div>
    <div class="info-box">💡 A entrega do seu imóvel poderá ser antecipada ou sofrer atrasos — Altere essa data sempre que necessário.</div>`,

    // Passo 1 — Valor do imóvel
    `<div class="step-num">02 / 07</div>
    <div class="step-title">Qual o valor do seu imóvel?</div>
    <div class="step-hint">O valor total do apartamento conforme contrato.</div>
    <label class="field-label">Valor total</label>
    <div class="input-wrap"><span class="pre">R$</span><input type="number" id="inp-valorTotal" class="has-pre" placeholder="300.000,00" value="${form.valorTotal}" min="0" step="100" oninput="atualizaFin()"></div>
    <div class="field-group">
      <label class="field-label">Percentual financiado</label>
      <div class="input-wrap"><input type="number" id="inp-percFinanciado" class="has-suf" placeholder="80" value="${form.percFinanciado}" min="1" max="100" step="1" oninput="atualizaFin()"><span class="suf">%</span></div>
    </div>
    <div class="diff-box" id="box-fin" style="${fin_val > 0 ? '' : 'display:none'}">
      <div class="d-title">Composição dos valores</div>
      <div class="diff-row"><span class="d-label">Valor total do imóvel</span><span class="d-val" id="val-total">${fin_val > 0 ? fmtBRL(parseFloat(form.valorTotal)) : ''}</span></div>
      <div class="diff-row"><span class="d-label">(−) Valor não financiado (<span id="val-perc-label">${form.percFinanciado || 80}</span>% → <span id="val-nfin-perc">${100 - parseFloat(form.percFinanciado || 80)}</span>%)</span><span class="d-val" id="val-nfin">${fin_val > 0 ? fmtBRL(parseFloat(form.valorTotal) - fin_val) : ''}</span></div>
      <hr class="diff-divider">
      <div class="diff-row hl"><span class="d-label">Valor financiado</span><span class="d-val" id="val-fin">${fin_val > 0 ? fmtBRL(fin_val) : ''}</span></div>
    </div>`,

    // Passo 2 — Valor do terreno
    `<div class="step-num">03 / 07</div>
    <div class="step-title">Qual o valor do terreno?</div>
    <div class="step-hint">Nos contratos da Caixa/Minha Casa Minha Vida, consta no <strong>item 1.7</strong>.</div>
    <div class="input-wrap"><span class="pre">R$</span><input type="number" id="inp-valorTerreno" class="has-pre" placeholder="10.000,00" value="${form.valorTerreno}" min="0" step="100" oninput="atualizaTer();this.classList.remove('invalid');document.getElementById('err-terreno').style.display='none'"></div>
    <div class="error-msg" id="err-terreno">O valor do terreno deve ser menor que o total financiado (${fmtBRL(fin)}).</div>
    <div class="diff-box" id="box-ter" style="${ter > 0 ? '' : 'display:none'}">
      <div class="d-title">Composição do financiamento</div>
      <div class="diff-row"><span class="d-label">Valor total financiado</span><span class="d-val">${fmtBRL(fin)}</span></div>
      <div class="diff-row"><span class="d-label">(−) Terreno</span><span class="d-val" id="d-ter">${ter > 0 ? fmtBRL(ter) : '—'}</span></div>
      <hr class="diff-divider">
      <div class="diff-row hl"><span class="d-label">Saldo devedor repassado à Construtora</span><span class="d-val" id="d-saldo">${ter > 0 ? fmtBRL(fin - ter) : '—'}</span></div>
    </div>
    <div class="info-box">💡 O valor do terreno é considerado como saldo devedor desde o primeiro mês. Isso explica porque você terá pagamento de parcelas mesmo em 0% de Evolução de Obra.</div>`,

    // Passo 3 — Encargos
    `<div class="step-num">04 / 07</div>
    <div class="step-title">Quais os seus encargos mensais?</div>
    <div class="step-hint">Valores cobrados mensalmente pela Caixa, independente do andamento da obra.</div>
    <label class="field-label">1. Seguro</label>
    <div class="input-wrap"><span class="pre">R$</span><input type="number" id="inp-seguro" class="has-pre" placeholder="00,00" value="${form.seguro}" min="0" step="0.01" oninput="atualizaEncargos();this.classList.remove('invalid')"></div>
    <div class="field-group">
      <label class="field-label">2. Taxa Administrativa</label>
      <div class="input-wrap"><span class="pre">R$</span><input type="number" id="inp-taxaAdm" class="has-pre" placeholder="25,00" value="${form.taxaAdm || ''}" min="0" step="0.01" oninput="atualizaEncargos()"></div>
      <div class="info-box">💡 O valor de seguro é único para cada comprador — Verifique no seu contrato. Já a Taxa de Administração da Caixa Econômica possui um valor fixo de R$ 25,00.</div>
    </div>
    <div class="confirm-box" id="box-enc" style="${seg > 0 ? '' : 'display:none'}">
      <div><div class="c-label">Total de encargos mensais</div></div>
      <div class="c-val" id="val-enc">${seg > 0 ? fmtBRL(seg + 25) : ''}</div>
    </div>`,

    // Passo 4 — Taxa de juros
    `<div class="step-num">05 / 07</div>
    <div class="step-title">Qual a Taxa de Juros anual do seu Financiamento?</div>
    <div class="step-hint">O app irá converter sua taxa anual para mensal abaixo. Já os juros das parcelas de Evolução de Obra são definidos pela soma da <strong>Taxa de Juros Mensal</strong> do seu financiamento com a <strong>Taxa Referencial (TR)</strong>, divulgada pelo Banco Central todo mês.</div>
    <div class="input-wrap"><input type="number" id="inp-taxaAnual" class="has-suf" placeholder="7,0000" value="${form.taxaAnual}" min="0" step="0.01" oninput="atualizaTaxa()"><span class="suf">% a.a.</span></div>
    <div class="diff-box" id="box-taxa" style="${ta > 0 ? '' : 'display:none'}">
      <div class="d-title">Composição dos juros mensais</div>
      <div class="diff-row"><span class="d-label">Taxa de Juros Mensal</span><span class="d-val" id="val-taxa-mensal">${ta > 0 ? fmtPerc(ta / 12, 4) : ''}</span></div>
      <div class="diff-row"><span class="d-label">(+) Taxa Referencial</span><span class="d-val">0,1000%</span></div>
      <hr class="diff-divider">
      <div class="diff-row hl"><span class="d-label">Estimativa de Juros Mensais</span><span class="d-val" id="val-taxa">${ta > 0 ? fmtPerc(ta / 12 + 0.1000, 4) : ''}</span></div>
    </div>
    <div class="info-box">💡 Aqui utilizamos 0,1000% de TR como valor inicial — Você poderá editar esse valor mês a mês na sua tabela de parcelas para maior precisão.</div>`,

    // Passo 5 — Data de entrega
    `<div class="step-num">06 / 07</div>
    <div class="step-title">Qual a data de entrega prevista?</div>
    <div class="step-hint">Sua 1ª parcela começa em <strong>${mLabelFull(form.mesInicial)}</strong>. A data de entrega define quantos meses de evolução serão simulados.</div>
    <input type="month" id="inp-mesEntrega" value="${form.mesEntrega}" oninput="atualizaMeses();this.classList.remove('invalid')">
    <div id="badge-meses"></div>
    <div class="info-box">💡 A entrega do seu imóvel poderá ser antecipada ou sofrer atrasos — Altere essa data sempre que necessário.</div>`,

    // Passo 6 — Nome da simulação
    `<div class="step-num">07 / 07</div>
    <div class="step-title">Como quer chamar essa simulação?</div>
    <div class="step-hint">Máximo 30 caracteres. Ex: Apto Centro, Torre B, Meu apê...</div>
    <input type="text" id="inp-nome" placeholder="Apto 101" value="${escHtml(form.nomeSimulacao || '')}" maxlength="30" oninput="updateCharCount(this)">
    <div class="char-count" id="char-count">0 / 30</div>`
  ];

  const btnLabel = currentStep === 6 ? 'Ver resultados →' : (currentStep === 1 ? 'Confirmar e continuar →' : 'Continuar →');
  setHtml(`
    ${renderProgress()}
    <div class="step-card">
      ${steps[currentStep]}
      <button class="btn btn-primary" onclick="nextStep()">${btnLabel}</button>
      ${currentStep > 0 ? '<button class="btn btn-back" onclick="prevStep()">← Voltar</button>' : ''}
    </div>`);

  if (currentStep === 5) setTimeout(() => { if (form.mesEntrega) atualizaMeses(); }, 50);
  if (currentStep === 6) setTimeout(() => { const el = document.getElementById('inp-nome'); if (el) updateCharCount(el); }, 50);
  if (currentStep === 2) setTimeout(() => { if (ter > 0) atualizaTer(); }, 50);

  // aplica máscaras após render
  setTimeout(() => {
    if (currentStep === 1) {
      attachMask('inp-valorTotal', 'brl', form.valorTotal || '');
      attachMask('inp-percFinanciado', 'perc1', form.percFinanciado || 80);
      // re-bind atualizaFin depois de aplicar máscara
      const vt = document.getElementById('inp-valorTotal');
      const pf = document.getElementById('inp-percFinanciado');
      if (vt) vt.oninput = () => { maskValue(vt, 'brl'); vt.classList.remove('invalid'); atualizaFin(); };
      if (pf) pf.oninput = () => { maskValue(pf, 'perc1'); pf.classList.remove('invalid'); atualizaFin(); };
    }
    if (currentStep === 2) {
      attachMask('inp-valorTerreno', 'brl', form.valorTerreno || '');
      const vt = document.getElementById('inp-valorTerreno');
      if (vt) vt.oninput = () => { maskValue(vt, 'brl'); vt.classList.remove('invalid'); document.getElementById('err-terreno').style.display = 'none'; atualizaTer(); };
    }
    if (currentStep === 3) {
      attachMask('inp-seguro', 'brl', form.seguro || '');
      attachMask('inp-taxaAdm', 'brl', form.taxaAdm || 25);
      const seg = document.getElementById('inp-seguro');
      const adm = document.getElementById('inp-taxaAdm');
      if (seg) seg.oninput = () => { maskValue(seg, 'brl'); seg.classList.remove('invalid'); atualizaEncargos(); };
      if (adm) adm.oninput = () => { maskValue(adm, 'brl'); atualizaEncargos(); };
    }
    if (currentStep === 4) {
      attachMask('inp-taxaAnual', 'perc4', form.taxaAnual || '');
      const ta = document.getElementById('inp-taxaAnual');
      if (ta) ta.oninput = () => { maskValue(ta, 'perc4'); ta.classList.remove('invalid'); atualizaTaxa(); };
    }
    const f = document.querySelector('.step-card input');
    if (f) f.focus();
  }, 80);
}

// ── ATUALIZAÇÕES INLINE DOS CAMPOS ──
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

function atualizaEncargos() {
  const s = maskRead(document.getElementById('inp-seguro')) || 0;
  const a = maskRead(document.getElementById('inp-taxaAdm')) || 25;
  const box = document.getElementById('box-enc'), val = document.getElementById('val-enc');
  if (box && val) { box.style.display = s > 0 ? 'flex' : 'none'; val.textContent = fmtBRL(s + a); }
}

function atualizaTaxa() {
  const ta = parseFloat(document.getElementById('inp-taxaAnual')?.value) || 0;
  const box = document.getElementById('box-taxa');
  if (box) box.style.display = ta > 0 ? 'block' : 'none';
  const elMensal = document.getElementById('val-taxa-mensal');
  const elCombinada = document.getElementById('val-taxa');
  if (elMensal)    elMensal.textContent = fmtPerc(ta / 12, 4);
  if (elCombinada) elCombinada.textContent = fmtPerc(ta / 12 + 0.001, 4);
}

function atualizaMeses() {
  const v = document.getElementById('inp-mesEntrega')?.value;
  if (!v || !form.mesInicial) return;
  const ini = parseMS(form.mesInicial), fin = parseMS(v);
  const n = mBetween(ini, fin);
  const totalParcelas = n + 1;
  const badge = document.getElementById('badge-meses');
  if (!badge) return;
  if (n >= 1 && totalParcelas <= MAX_MESES)
    badge.innerHTML = `<div class="months-badge">📅 ${mLabelFull(form.mesInicial)} → ${mLabelFull(v)} = <strong>${totalParcelas} parcela(s)</strong></div>`;
  else if (totalParcelas > MAX_MESES)
    badge.innerHTML = `<div class="months-badge err">⚠️ Máximo ${MAX_MESES} parcelas. Serão exibidas apenas as primeiras ${MAX_MESES}.</div>`;
  else
    badge.innerHTML = `<div class="months-badge err">⚠️ A data de entrega deve ser após a 1ª parcela.</div>`;
}
