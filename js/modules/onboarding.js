// ── ONBOARDING (Simulação Completa — 7 passos) ──

function novaSimulacao() {
  currentProfileId = null;
  window._editMode = null;
  fluxo = 'complete';
  Object.keys(form).forEach(k => { form[k] = ''; });
  form.percFinanciado      = 80.00;
  form.historicoPagamentos = [];
  Object.keys(formQuick).forEach(k => { formQuick[k] = ''; });
  formQuick.percObra = 50;
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
  fluxo = 'complete';
  const mesesBackup    = JSON.parse(JSON.stringify(meses));
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
      <div class="step-title">O que você precisa agora?</div>
      <div class="step-hint">Escolha o tipo de simulação.</div>
      <div class="bifurcacao-grid">
        <button class="btn-bifurc bifurc-b" onclick="escolherFluxo('quick')">
          <span class="bifurc-icon">⚡</span>
          <div>
            <div class="bifurc-label">Simulação rápida</div>
            <div class="bifurc-sub">Descubra quanto vai pagar agora com apenas 5 perguntas. Totalmente gratuito.</div>
          </div>
        </button>
        <button class="btn-bifurc bifurc-a" onclick="escolherFluxo('complete')">
          <span class="bifurc-icon">📋</span>
          <div>
            <div class="bifurc-label">Simulação completa</div>
            <div class="bifurc-sub">Veja todas as parcelas mês a mês e acompanhe o que já foi pago.</div>
          </div>
        </button>
      </div>
    </div>
  `);
}

function escolherFluxo(f) {
  fluxo = f;
  if (f === 'quick') {
    screen = 'quick'; currentStep = 0; renderQuickStep();
  } else {
    screen = 'onboarding'; currentStep = 0; renderStep();
  }
}

// ── VALIDAÇÃO E AVANÇO DE PASSOS ──
function nextStep() {
  try {
    if (currentStep === 0) {
      const elIni = document.getElementById('inp-mesInicial');
      const elFim = document.getElementById('inp-mesEntrega');
      if (!elIni.value) { markError('inp-mesInicial'); return; }
      if (!elFim.value) { markError('inp-mesEntrega'); return; }
      const ini = parseMS(elIni.value), fim = parseMS(elFim.value);
      if (mBetween(ini, fim) < 1) { markError('inp-mesEntrega'); showToast('⚠️ A data de entrega deve ser após a 1ª parcela.'); return; }
      form.mesInicial = elIni.value;
      form.mesEntrega = elFim.value;

    } else if (currentStep === 1) {
      const elVT = document.getElementById('inp-valorTotal');
      const elPF = document.getElementById('inp-percFinanciado');
      const v  = maskRead(elVT);
      const pf = maskRead(elPF);
      if (!v || v <= 0)               { elVT?.classList.add('invalid'); return; }
      if (!pf || pf <= 10 || pf > 80) { elPF?.classList.add('invalid'); showToast('⚠️ O percentual financiado deve ser entre 10% e 80%.'); return; }
      form.valorTotal     = String(v);
      form.percFinanciado = pf;

    } else if (currentStep === 2) {
      const elTer = document.getElementById('inp-valorTerreno');
      const v = maskRead(elTer);
      const fin = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100);
      if (!v || v <= 0) { elTer?.classList.add('invalid'); return; }
      if (v >= fin) { elTer?.classList.add('invalid'); document.getElementById('err-terreno').style.display = 'block'; return; }
      form.valorTerreno = String(v);

    } else if (currentStep === 3) {
      const elTa = document.getElementById('inp-taxaAnual');
      const v = maskRead(elTa);
      if (!v || v <= 0) { elTa?.classList.add('invalid'); return; }
      form.taxaAnual = String(v);

    } else if (currentStep === 4) {
      const elSeg = document.getElementById('inp-seguro');
      const elAdm = document.getElementById('inp-taxaAdm');
      const s = maskRead(elSeg);
      if (!s || s <= 0) { elSeg?.classList.add('invalid'); return; }
      form.seguro  = String(s);
      form.taxaAdm = String(maskRead(elAdm) || 25);

    } else if (currentStep === 5) {
      // Coleta histórico de pagamentos da mini-tabela (opcional)
      const rows = [];
      let i = 0;
      while (document.getElementById(`hist-val-${i}`)) {
        const el = document.getElementById(`hist-val-${i}`);
        const v  = maskRead(el);
        rows.push({ valor: isNaN(v) || v < 0 ? 0 : v });
        i++;
      }
      form.historicoPagamentos = rows;

    } else if (currentStep === 6) {
      const raw = sanitizeName(document.getElementById('inp-nome').value) || 'Apto 101';
      const profiles = loadProfiles();
      const duplicado = profiles.find(p => p.nome.toLowerCase() === raw.toLowerCase() && p.id !== currentProfileId);
      if (duplicado) { showToast('⚠️ Já existe um perfil com esse nome. Utilize um nome diferente.'); markError('inp-nome'); return; }
      form.nomeSimulacao = raw;
    }

    currentStep++;
    if (currentStep >= 7) {
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

function prevStep() {
  if (currentStep > 0) { currentStep--; renderStep(); }
}

// ── RENDER DAS TELAS DO ONBOARDING ──
function renderStep() {
  const fin_val = form.valorTotal ? parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100) : 0;
  const ter = parseFloat(form.valorTerreno) || 0;
  const fin = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100) || 0;
  const seg = parseFloat(form.seguro) || 0;
  const ta  = parseFloat(form.taxaAnual) || 0;

  // Tela 5: gera linhas da mini-tabela de histórico
  // Usa os dados já salvos em form.historicoPagamentos, ou começa vazia com 1 linha
  const histRows = (form.historicoPagamentos && form.historicoPagamentos.length > 0)
    ? form.historicoPagamentos
    : [{ valor: 0 }];

  function _buildHistRows(rows) {
    return rows.map((r, i) => {
      const mesLabel = form.mesInicial
        ? mLabel(addM(parseMS(form.mesInicial), i))
        : `Parcela ${i + 1}`;
      return `<tr>
        <td class="num-col">${i + 1}</td>
        <td class="td-mes" style="font-size:12px">${mesLabel}</td>
        <td class="td-right">
          <div class="input-wrap">
            <span class="pre" style="font-size:12px">R$</span>
            <input type="text" id="hist-val-${i}" class="has-pre hist-val-input"
              placeholder="0,00" inputmode="numeric"
              oninput="maskOnInput(this)">
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  const steps = [
    // Passo 0 — Datas
    `<div class="step-num">01 / 07</div>
    <div class="step-title">Quando inicia o pagamento de Juros de Evolução de Obra?</div>
    <div class="step-hint">Mês da sua primeira prestação.</div>
    <input type="month" id="inp-mesInicial" value="${form.mesInicial}" oninput="atualizaMesesStep0();this.classList.remove('invalid')">
    <br><br>
    <div class="step-title">Qual a data de entrega prevista?</div>
    <div class="step-hint">A data de entrega define quantos meses de evolução serão simulados.</div>
    <input type="month" id="inp-mesEntrega" value="${form.mesEntrega}" oninput="atualizaMesesStep0();this.classList.remove('invalid')">
    <div id="badge-meses"></div>
    <div class="info-box">💡 A entrega do seu imóvel poderá ser antecipada ou sofrer atrasos — Altere essa data sempre que for necessário.</div>`,

    // Passo 1 — Valor do imóvel
    `<div class="step-num">02 / 07</div>
    <div class="step-title">Qual o valor do seu imóvel?</div>
    <div class="step-hint">O valor total do apartamento conforme contrato.</div>
    <label class="field-label">Valor total</label>
    <div class="input-wrap"><span class="pre">R$</span><input type="text" id="inp-valorTotal" class="has-pre" placeholder="300.000,00" inputmode="numeric" oninput="atualizaFin()"></div>
    <div class="field-group">
      <label class="field-label">Percentual financiado</label>
      <div class="input-wrap"><input type="text" id="inp-percFinanciado" class="has-suf" placeholder="80,00" inputmode="numeric" oninput="atualizaFin()"><span class="suf">%</span></div>
    </div>
    <div class="diff-box" id="box-fin" style="${fin_val > 0 ? '' : 'display:none'}">
      <div class="d-title">Composição dos valores</div>
      <div class="diff-row"><span class="d-label">Valor total do imóvel</span><span class="d-val" id="val-total">${fin_val > 0 ? fmtBRL(parseFloat(form.valorTotal)) : ''}</span></div>
      <div class="diff-row"><span class="d-label">(−) Valor não financiado (<span id="val-perc-label">${form.percFinanciado || 80}</span>% → <span id="val-nfin-perc">${parseFloat((100 - parseFloat(form.percFinanciado || 80)).toFixed(2))}</span>%)</span><span class="d-val" id="val-nfin">${fin_val > 0 ? fmtBRL(parseFloat(form.valorTotal) - fin_val) : ''}</span></div>
      <hr class="diff-divider">
      <div class="diff-row hl"><span class="d-label">Valor financiado</span><span class="d-val" id="val-fin">${fin_val > 0 ? fmtBRL(fin_val) : ''}</span></div>
    </div>`,

    // Passo 2 — Terreno
    `<div class="step-num">03 / 07</div>
    <div class="step-title">Qual o valor do terreno?</div>
    <div class="step-hint">Nos contratos da Caixa/Minha Casa Minha Vida, consta no <strong>item 1.7</strong>.</div>
    <div class="input-wrap"><span class="pre">R$</span><input type="text" id="inp-valorTerreno" class="has-pre" placeholder="10.000,00" inputmode="numeric" oninput="atualizaTer();this.classList.remove('invalid');document.getElementById('err-terreno').style.display='none'"></div>
    <div class="error-msg" id="err-terreno">O valor do terreno deve ser menor que o total financiado (${fmtBRL(fin)}).</div>
    <div class="diff-box" id="box-ter" style="${ter > 0 ? '' : 'display:none'}">
      <div class="d-title">Composição do financiamento</div>
      <div class="diff-row"><span class="d-label">Valor total financiado</span><span class="d-val">${fmtBRL(fin)}</span></div>
      <div class="diff-row"><span class="d-label">(−) Terreno</span><span class="d-val" id="d-ter">${ter > 0 ? fmtBRL(ter) : '—'}</span></div>
      <hr class="diff-divider">
      <div class="diff-row hl"><span class="d-label">Saldo devedor repassado à Construtora</span><span class="d-val" id="d-saldo">${ter > 0 ? fmtBRL(fin - ter) : '—'}</span></div>
    </div>
    <div class="info-box">💡 O valor do terreno é considerado como saldo devedor desde o primeiro mês. Isso explica porque você terá pagamento de parcelas mesmo em 0% de Evolução de Obra.</div>`,

    // Passo 3 — Taxa de juros
    `<div class="step-num">04 / 07</div>
    <div class="step-title">Qual a Taxa de Juros anual do seu Financiamento?</div>
    <div class="step-hint">O app irá converter sua taxa anual para mensal abaixo.</div>
    <div class="input-wrap"><input type="text" id="inp-taxaAnual" class="has-suf" placeholder="5,4321" inputmode="numeric" oninput="atualizaTaxa()"><span class="suf">% a.a.</span></div>
    <div class="diff-box" id="box-taxa" style="${ta > 0 ? '' : 'display:none'}">
    
      <div class="d-title">Como funcionam os juros na prestação de Evolução de Obra?</div>
      <div class="diff-row"><span class="d-label">Taxa de Juros Mensal</span><span class="d-val" id="val-taxa-mensal">${ta > 0 ? fmtPerc(ta / 12, 4) : ''}</span></div>
      <div class="diff-row"><span class="d-label">(+) Taxa Referencial do mês</span><span class="d-val">0,1000%</span></div>
      <hr class="diff-divider">
      <div class="diff-row hl"><span class="d-label">Taxa de Juros no cálculo da Evolução</span><span class="d-val" id="val-taxa">${ta > 0 ? fmtPerc(ta / 12 + 0.1, 4) : ''}</span></div>
    </div>
    <div class="info-box">💡 Aqui utilizamos TR de 0,1000% apenas como exemplo didático. O valor oficial é divulgado pelo Banco Central todos os meses.</div>`,

    // Passo 4 — Encargos
    `<div class="step-num">05 / 07</div>
    <div class="step-title">Quais os seus encargos mensais?</div>
    <div class="step-hint">Valores cobrados mensalmente pela Caixa, independente do andamento da obra.</div>
    <label class="field-label">1. Seguro</label>
    <div class="label-hint">O valor de seguro é único para cada comprador — Verifique no seu contrato.</div>
    <div class="input-wrap"><span class="pre">R$</span><input type="text" id="inp-seguro" class="has-pre" placeholder="00,00" inputmode="numeric" oninput="atualizaEncargos();this.classList.remove('invalid')"></div>

    <div class="field-group">
      <label class="field-label">2. Taxa Administrativa</label>
      <div class="label-hint">A Taxa de Administração da Caixa Econômica possui um valor fixo de R$ 25,00.</div>
      <div class="input-wrap"><span class="pre">R$</span><input type="text" id="inp-taxaAdm" class="has-pre" placeholder="25,00" inputmode="numeric" oninput="atualizaEncargos()"></div>
    </div>

    <div class="confirm-box" id="box-enc" style="${seg > 0 ? '' : 'display:none'}">
      <div><div class="c-label">Total de encargos mensais</div></div>
      <div class="c-val" id="val-enc">${seg > 0 ? fmtBRL(seg + 25) : ''}</div>
    </div>`,

    // Passo 5 — Histórico de pagamentos (opcional)
    `<div class="step-num">06 / 07</div>
    <div class="step-title">Você já pagou alguma parcela? — Opcional</div>
    <div class="step-hint">Informe os valores de meses já debitados para acompanhamento. Deixe em branco se quiser pular ou se ainda não pagou nenhuma parcela.<br></div>
    <div class="table-wrap" id="hist-table-wrap">
      <table>
        <thead><tr>
          <th class="th-center">#</th>
          <th>Mês</th>
          <th class="th-right">Valor pago</th>
        </tr></thead>
        <tbody id="hist-tbody">${_buildHistRows(histRows)}</tbody>
      </table>
      <div class="row-controls">
        <span class="rc-info" id="hist-rc-info">Use + / − para adicionar ou remover parcelas.</span>
        <button class="rc-btn" id="hist-btn-rem" onclick="histRemoverLinha()" ${histRows.length <= 1 ? 'disabled' : ''}>−</button>
        <button class="rc-btn" id="hist-btn-add" onclick="histAdicionarLinha()">+</button>
      </div>
    </div>`,

    // Passo 6 — Nome do Perfil
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

  // Inicializações pós-render
  if (currentStep === 0) setTimeout(() => {
    if (form.mesInicial && form.mesEntrega) atualizaMesesStep0();
  }, 50);
  if (currentStep === 2) setTimeout(() => { if (ter > 0) atualizaTer(); }, 50);
  if (currentStep === 5) setTimeout(() => { _initHistMasks(); }, 80);
  if (currentStep === 6) setTimeout(() => { const el = document.getElementById('inp-nome'); if (el) updateCharCount(el); }, 50);

  // Aplica máscaras após render
  setTimeout(() => {
    if (currentStep === 1) {
      attachMask('inp-valorTotal',     'brl',   form.valorTotal || '');
      attachMask('inp-percFinanciado', 'perc2', form.percFinanciado || 80);
      const vt = document.getElementById('inp-valorTotal');
      const pf = document.getElementById('inp-percFinanciado');
      if (vt) vt.oninput = () => { maskValue(vt, 'brl');   vt.classList.remove('invalid'); atualizaFin(); };
      if (pf) pf.oninput = () => { maskValue(pf, 'perc2'); pf.classList.remove('invalid'); atualizaFin(); };
    }
    if (currentStep === 2) {
      attachMask('inp-valorTerreno', 'brl', form.valorTerreno || '');
      const vt = document.getElementById('inp-valorTerreno');
      if (vt) vt.oninput = () => { maskValue(vt, 'brl'); vt.classList.remove('invalid'); document.getElementById('err-terreno').style.display = 'none'; atualizaTer(); };
    }
    if (currentStep === 3) {
      attachMask('inp-taxaAnual', 'perc4', form.taxaAnual || '');
      const ta = document.getElementById('inp-taxaAnual');
      if (ta) ta.oninput = () => { maskValue(ta, 'perc4'); ta.classList.remove('invalid'); atualizaTaxa(); };
      if (form.taxaAnual) atualizaTaxa();
    }
    if (currentStep === 4) {
      attachMask('inp-seguro',  'brl', form.seguro  || '');
      attachMask('inp-taxaAdm', 'brl', form.taxaAdm || 25);
      const seg = document.getElementById('inp-seguro');
      const adm = document.getElementById('inp-taxaAdm');
      if (seg) seg.oninput = () => { maskValue(seg, 'brl'); seg.classList.remove('invalid'); atualizaEncargos(); };
      if (adm) adm.oninput = () => { maskValue(adm, 'brl'); atualizaEncargos(); };
    }
    if (currentStep !== 5) {
      const f = document.querySelector('.step-card input');
      if (f) f.focus();
    }
  }, 80);
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
          oninput="maskOnInput(this)">
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
}
