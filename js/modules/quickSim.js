// ── SIMULAÇÃO RÁPIDA ──
// 5 telas otimizadas: Total+Saldo → Taxa → Encargos → %+Mês → Parcela Fin (opcional)


// TELA 1 (QuickSim)
// ── ATUALIZAR DIFF-BOX: VALOR DO IMÓVEL ──
function _atualizaImovelQuick() {
  const elVT  = document.getElementById(QUESTION_IDS.valorTotal);
  const elFin = document.getElementById(QUESTION_IDS.financiamentoTotal);
  const vt  = maskRead(elVT)  || 0;
  const fin = maskRead(elFin) || 0;
  const box = document.getElementById('box-imovel-quick');
  if (vt > 0 && fin > 0 && fin < vt) {
    const entrada   = vt - fin;
    const percFin   = (fin / vt) * 100;
    document.getElementById('dq-total').textContent   = fmtBRL(vt);
    document.getElementById('dq-entrada').textContent = fmtBRL(entrada);
    document.getElementById('dq-fin').textContent     = fmtBRL(fin);
    document.getElementById('dq-perc-fin').textContent = fmtPerc(percFin, 2);
    if (box) box.style.display = 'block';
  } else {
    if (box) box.style.display = 'none';
  }
}

// ── CALCULAR % AUTOMATICAMENTE (usa saldo do DOM se disponível, senão formQuick) ──
function _calcPercAutomatico() {
  const total = parseFloat(formQuick.totalFinanciado || 0);
  const saldo = parseFloat(formQuick.saldoAtual || 0);
  if (total <= 0) return 0;
  return (saldo / total) * 100;
}

// TELA 4 (QuickSim)
// ── ATUALIZAR INFO DE % CALCULADO E PRÉ-PREENCHER CAMPO ──
function _atualizaPercCalculado() {
  const elSaldo = document.getElementById(QUESTION_IDS.saldoDevedor);
  const total   = parseFloat(formQuick.totalFinanciado || 0);
  const saldo   = maskRead(elSaldo) || 0;
  const perc    = total > 0 ? (saldo / total) * 100 : 0;
  const group   = document.getElementById('group-perc-obra');
  const hint    = document.getElementById('hint-perc-calc');
  const elPerc  = document.getElementById(QUESTION_IDS.percentualObra);
  const boxDisc = document.getElementById('box-discrepancia');
  const txtDisc = document.getElementById('text-discrepancia');

  if (perc > 0) {
    const percFormatado = perc.toFixed(2).replace('.', ',');
    if (group) group.style.display = 'block';
    if (hint)  hint.textContent = `Estimamos ${percFormatado}% com base no saldo acima. Corrija se necessário.`;
    if (elPerc) {
      elPerc.placeholder = percFormatado;
      if (!maskRead(elPerc)) attachMask(QUESTION_IDS.percentualObra, 'perc2', perc);
    }
    // Discrepância dinâmica
    const percInformado = maskRead(elPerc) || perc;
    const diferenca = Math.abs(perc - percInformado);
    if (boxDisc && txtDisc) {
      if (diferenca > 10) {
        txtDisc.textContent = `⚠️ Atenção: há uma diferença de ${diferenca.toFixed(1)}% entre o % calculado e o informado. Verifique se os valores estão corretos.`;
        boxDisc.style.display = 'block';
      } else {
        boxDisc.style.display = 'none';
      }
    }
  } else {
    if (group) group.style.display = 'none';
    if (boxDisc) boxDisc.style.display = 'none';
  }
}

// TELA 2
// ── TAXA ANUAL PARA MENSAL + TR (DIDÁTICO) ──
function _atualizaTaxaQuick() {
  const el = document.getElementById(QUESTION_IDS.taxaAnual);
  const ta = maskRead(el) || 0;
  const box         = document.getElementById('box-taxa');
  const boxInfo     = document.getElementById('box-taxa-info');
  const elMensal    = document.getElementById('val-taxa-mensal');
  const elCombinada = document.getElementById('val-taxa');
  if (box) box.style.display = ta > 0 ? 'block' : 'none';
  if (boxInfo) boxInfo.style.display = ta > 0 ? 'block' : 'none';
  if (elMensal)    elMensal.textContent    = ta > 0 ? fmtPerc(ta / 12, 4) : '—';
  if (elCombinada) elCombinada.textContent = ta > 0 ? fmtPerc(ta / 12 + 0.1, 4) : '—';
}

// TELA 3 
// ── ATUALIZAR ENCARGOS ──
function atualizaEncargosQuick() {
  const elSeg = document.getElementById(QUESTION_IDS.seguro);
  const elAdm = document.getElementById(QUESTION_IDS.taxaAdm);
  const s = maskRead(elSeg) || 0;
  const aRaw = maskRead(elAdm);            // NaN se vazio, 0 se zerado
  const a = isNaN(aRaw) ? 25 : aRaw;       // default 25 só quando vazio
  const box = document.getElementById('box-enc');
  const val = document.getElementById('val-enc');
  if (box && val) {
    box.style.display = s > 0 ? 'block' : 'none';
    val.textContent = fmtBRL(s + a);
  }
}


// TELA 4
// ── IMPEDIR PERCENTUAL DE OBRA ACIMA DE 100% ──
function _limitPercQuick(el) {
  const v = maskRead(el);
  if (isNaN(v)) return;

  if (v > 100) {
    el.value = '100,00';
    el.dataset.rawDigits = '10000';
  }
}

// ── OPÇÃO DE PREENCHER COM O MÊS ATUAL ──
function _mesAtual() {
  const d = new Date();

  return {
    y: d.getFullYear(),
    m: d.getMonth() + 1
  };
}

// Valor "YYYY-MM" do mês atual
function _mesAtualValor() {
  const a = _mesAtual();
  return a.y + '-' + String(a.m).padStart(2, '0');
}

// Marca/desmarca o botão "Inserir Mês atual" conforme o input bate com o mês atual
function _syncBotaoMesAtual(inputEl, btnEl) {
  if (!btnEl) return;
  btnEl.classList.toggle('active', !!inputEl && inputEl.value === _mesAtualValor());
}

// Preenche o input de mês com o mês atual. inputId/btnId opcionais (default: quicksim).
function preencherMesAtual(inputId, btnId) {
  const el  = document.getElementById(inputId || QUESTION_IDS.mesMedido);
  if (!el) return;
  el.value = _mesAtualValor();
  el.classList.remove('invalid');

  // Atualiza o estado conforme o campo (mesMedido na quick, mesInicial na completa)
  if ((inputId || QUESTION_IDS.mesMedido) === QUESTION_IDS.mesMedido) {
    formQuick.mesMedido = el.value;
    _atualizaTRInfo();
  } else if ((inputId) === QUESTION_IDS.mesInicial) {
    form.mesInicial = el.value;
    if (typeof atualizaMesesStep0 === 'function') atualizaMesesStep0();
  }

  const btn = document.getElementById(btnId || 'btn-mes-atual-quick');
  _syncBotaoMesAtual(el, btn);
}

// ── ASSOCIAR VALOR DE TR COM O JSON PELO MÊS INFORMADO ──
function _atualizaTRInfo() {
  const el  = document.getElementById(QUESTION_IDS.mesMedido);
  const mes = el?.value;
  const box  = document.getElementById('box-tr-info');
  const text = document.getElementById('tr-info-text');

  if (!mes) {
    if (box) box.style.display = 'none';
    return;
  }
  if (!box || !text) return;

  const ym    = parseMS(mes);
  const trDec = getTRParaMes(ym);

  if (trDec > 0) {
    const trPerc = (trDec * 100).toFixed(4);
    text.innerHTML = `
      <div class="d-title">Taxa Referencial do Mês</div>
      <div class="diff-row">
        <span class="d-label">${mLabel(ym)}</span>
        <span class="d-val">${trPerc}%</span>
      </div>`;
  } else {
    text.innerHTML = `
      <div class="d-title">Taxa Referencial do Mês</div>
      <div class="diff-row">
        <span class="d-label">${mLabel(ym)}</span>
        <span class="d-val">indisponível</span>
      </div>`;
  }
  box.style.display = 'block';
}

// ── CÁLCULOS ──

// Parcela estimada no % atual (usa saldo REAL + TR obtida silenciosamente)
function _calcTotalParcelaAtual() {
  const saldo = parseFloat(formQuick.saldoAtual || 0);
  const tm = (parseFloat(formQuick.taxaAnual) / 100) / 12;
  const enc = parseFloat(formQuick.seguro || 0) + taxaAdmValor(formQuick.taxaAdm);
  const ym = formQuick.mesMedido ? parseMS(formQuick.mesMedido) : null;
  const tr = ym ? getTRParaMes(ym) : 0; // obtém TR silenciosamente
  return (tm + tr) * saldo + enc;
}

// TR em R$: (0 + tr) × saldoAtual — sem encargos
function _calcTRParcela() {
  if (!formQuick.mesMedido) return { trPerc: null, trReais: null };
  const ym    = parseMS(formQuick.mesMedido);
  const trDec = getTRParaMes(ym);
  if (!trDec) return { trPerc: null, trReais: null };
  const saldo   = parseFloat(formQuick.saldoAtual || 0);
  const trPerc  = trDec * 100;
  const trReais = trDec * saldo;
  return { trPerc, trReais };
}

// ENCONTRAR MÊS INFORMADO + 1
function _nextMesLabel(ym) {
  let { y, m } = ym;

  m += 1;
  if (m > 12) {
    m = 1;
    y += 1;
  }

  return { y, m };
}

// ── TELA DE RESULTADO ──
function renderResultQuick() {
  screen = 'resultQuick';
  _navPush('resultQuick');

  const percInformado = parseFloat(formQuick.percObra || 0);
  const mesLabel = formQuick.mesMedido ? mLabel(parseMS(formQuick.mesMedido)) : '—';
  const temFin = formQuick.parcelaFinanciamento > 0;
  const sliderMin = Math.max(5, Math.ceil(percInformado / 5) * 5);

  const { trPerc, trReais } = _calcTRParcela();
  const temTR = trPerc !== null && trPerc > 0;

  const ymAtual = parseMS(formQuick.mesMedido);
  const ymSeguinte = _nextMesLabel(ymAtual);
  const proxMesLabel = mLabel(ymSeguinte);

  const parcelaAtual = _calcTotalParcelaAtual();

  const card1Html = `
    <div class="result-card accent result-card-full large">
      <div class="card-large-left">
        <div class="qrc-label">Sua Parcela atual<br>Vence em ${proxMesLabel}</div>
        <div class="qrc-note">${temTR ? 'Valor total' : 'Valor sem Correção Monetária'}</div>
      </div>
      <div class="qrc-val">${fmtBRL(parcelaAtual)}</div>
    </div>`;

  setHtml(`
    <div class="result-header">
      <h2>Simulação Rápida</h2>
    </div>

    <div class="result-grid">
      <div class="result-card accent">
        <div class="qrc-label">Saldo devedor</div>
        <div class="qrc-val">${fmtBRL(formQuick.saldoAtual)}</div>
        <div class="qrc-note">de ${fmtBRL(formQuick.totalFinanciado)}</div>
      </div>
      <div class="result-card">
        <div class="qrc-label">Evolução de Obra</div>
        <div class="qrc-val">${fmtPerc(percInformado, 2)}</div>
        <div class="qrc-note">Medição: ${mesLabel}</div>
      </div>
    </div>

    <div class="result-header">
      <h3>Visualizador de Prestações</h3>
 
      ${card1Html}

      <h4>O valor da prestação acima é composto por:</h4>

      <div class="result-grid result-grid-inner" style="margin-top:10px">
        <div class="result-card">
          <div class="qrc-label">Valor base</div>
          <div class="qrc-val">${fmtBRL(parcelaAtual - (trReais || 0))}</div>
          <div class="qrc-note">Juros + Encargos</div>
        </div>
        <div class="result-card">
          <div class="qrc-label">Correção</div>
          <div class="qrc-val">${temTR ? fmtBRL(trReais) : '<small>Indisponível</small>'}</div>
          <div class="qrc-note">${temTR ?  'TR ' + fmtPerc(trPerc, 4) + ' · ' + mesLabel : ''}</div>
        </div>
      </div>
     </div>

    <div class="preview-slider-card" style="margin-top:12px">
      <div class="preview-slider-header">

        <div class="preview-slider-sub"><span>Arraste para simular suas prestações futuras</span></div>
      </div>

      <div class="slider-wrap">
        <div class="slider-labels">
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
        <input type="range" id="preview-slider" class="preview-slider"
          min="0" max="100" step="5" value="${sliderMin}"
          oninput="atualizaSliderQuick()">
      </div>
      <div class="quick-disclaimer-slider">
        Na simulação rápida, o saldo devedor é uma estimativa aproximada.
      </div>

      <div class="slider-result">
        <dl class="slider-result-row">
          <dt class="slider-result-label">Evolução<br>de Obra</dt>
          <dd class="slider-result-perc" id="slider-perc">${sliderMin}%</dd>
          <dt class="slider-result-label">Saldo devedor<br>estimado</dt>
          <dd class="slider-result-val" id="slider-saldo">—</dd>
        </dl>
        <dl class="slider-result-row highlight">
          <dt class="slider-result-label">Valor base previsto<br><strong>Taxa Referencial = 0,0000%</strong></dt>
          <dd class="slider-result-val accent" id="slider-val">—</dd>
        </dl>
        ${temFin ? `
        <dl class="slider-result-row slider-fin-dl" id="slider-fin-dl">
          <dt class="slider-result-label">Evolução x Financiamento<br><strong>Sua 1ª parcela: ${fmtBRL(formQuick.parcelaFinanciamento)}</strong></dt>
          <dd class="slider-result-val" id="slider-fin-bloco">—</dd>
        </dl>` : ''}
      </div>
    </div>

    <div class="quick-cta-card">
      <div class="quick-cta-title">Quer acompanhar essa evolução?</div>
      <div class="quick-cta-sub">Você pode aproveitar alguns dados já inseridos e partir para a versão detalhada. Com a simulação completa, você acompanha pagamentos e evolução mês a mês com maior precisão.</div>
      <button class="btn btn-primary" onclick="irParaSimulacaoCompleta()">
        Simulação Completa →
      </button>
      <button class="btn btn-back" onclick="reiniciarSimulacaoRapida()">
        ← Refazer simulação rápida
      </button>
    </div>

    <div class="quick-disclaimer-end">
      <p>Darwin não é uma ferramenta preditiva. Utilizamos a fórmula oficial de cálculo divulgada pela Caixa Econômica. Não nos responsabilizamos se previsões futuras não corresponderem à realidade, uma vez que a instituição financeira é a encarregada de realizar as cobranças.</p>
    </div>
  `);

  setTimeout(() => atualizaSliderQuick(), 50);
}

// ── SLIDER ──
function atualizaSliderQuick() {
  const slider = document.getElementById('preview-slider');
  if (!slider) return;

  // 1. Definir variáveis PRIMEIRO
  const percInformado = parseFloat(formQuick.percObra || 5);
  const sliderMinLock = Math.max(5, Math.ceil(percInformado / 5) * 5);
  // Trava thumb abaixo do % atual de obra
  if (parseInt(slider.value) < sliderMinLock) slider.value = sliderMinLock;
  const percSlider = parseInt(slider.value);
  const total = parseFloat(formQuick.totalFinanciado || 0);
  const tm = (parseFloat(formQuick.taxaAnual) / 100) / 12;
  const enc = parseFloat(formQuick.seguro || 0) + taxaAdmValor(formQuick.taxaAdm);

  // 2. DEPOIS aplicar coloração
  slider.style.background = `linear-gradient(to right,
    var(--accent) 0% ${percInformado}%,
    var(--border) ${percInformado}% 100%)`;

  // 3. Calcular valores
  const sdProj = total * (percSlider / 100);
  const previsto = tm * sdProj + enc;

  const elPerc  = document.getElementById('slider-perc');
  const elVal   = document.getElementById('slider-val');
  const elSaldo = document.getElementById('slider-saldo');
  if (elPerc)  elPerc.textContent  = percSlider + '%';
  if (elVal)   elVal.innerHTML     = `${fmtBRL(previsto)}`;
  if (elSaldo) elSaldo.textContent = fmtBRL(sdProj);

  // Comparativo de evolução com a parcela de financiamento
  const dl    = document.getElementById('slider-fin-dl');
  const bloco = document.getElementById('slider-fin-bloco');
  if (dl && bloco && formQuick.parcelaFinanciamento > 0) {
    const fin  = parseFloat(formQuick.parcelaFinanciamento);
    const diff = fin - previsto;
    dl.className = 'slider-result-row slider-fin-dl' + (diff < 0 ? ' slider-fin-danger' : '');
    bloco.innerHTML = (diff < 0 ? 'Supera em<br>' : 'Faltando<br>') + fmtBRL(Math.abs(diff));
  }
}

// ── REINICIAR ──
function reiniciarSimulacaoRapida() {
  const savedFin    = formQuick.totalFinanciado;
  const savedTaxa   = formQuick.taxaAnual;
  const savedSeguro = formQuick.seguro;
  const savedAdm    = formQuick.taxaAdm;
  Object.keys(formQuick).forEach(k => { formQuick[k] = ''; });
  formQuick.totalFinanciado = savedFin;
  formQuick.taxaAnual       = savedTaxa;
  formQuick.seguro          = savedSeguro;
  formQuick.taxaAdm         = savedAdm;
  currentStep = 0;
  // _navResetFlow deve capturar _navFlowDepth antes de initFlow o zerar.
  // Por isso: reseta o histórico primeiro, e inicia o fluxo dentro do callback.
  hideBottomNav();
  _navResetFlow('bifurcacao', () => {
    initFlow(FLOW_QUICKSIM);
    renderFlowStep();
  });
}

// ── CTA: migrar para simulação detalhada ──
function irParaSimulacaoCompleta() {
  form.seguro    = String(formQuick.seguro   || '');
  // preserva 0 explícito; vazio fica '' (cálculos aplicam default 25 via taxaAdmValor)
  form.taxaAdm   = (formQuick.taxaAdm === '' || formQuick.taxaAdm == null) ? '' : String(formQuick.taxaAdm);
  form.taxaAnual = String(formQuick.taxaAnual || '');
  form.parcelaFinanciamento = formQuick.parcelaFinanciamento || null;

  form.valorTotal      = '';
  form.percFinanciado  = 80;
  form.valorFinanciado = null;

  form.mesInicial          = '';
  form.mesEntrega          = '';
  form.valorTerreno        = '';
  form.nomeSimulacao       = '';
  form.historicoPagamentos = [];

  // Define quais telas pular por já terem dados do QuickSim
  // valorImovel nunca é pulado — usuário informa valorTotal; financiamentoTotal vem pré-populado
  migrationSkipCheck = (questionKey) => {
    switch (questionKey) {
      case 'taxaAnual':           return !!form.taxaAnual;
      case 'seguro':              return !!form.seguro;
      case 'parcelaFinanciamento': return form.parcelaFinanciamento !== null;
      default:                    return false;
    }
  };

  migrationAbort = () => {
    migrationSkipCheck = null;
    migrationAbort = null;
    renderResultQuick();
  };

  fluxo = 'complete';
  currentStep = 0;
  screen = 'onboarding';
  initFlow(FLOW_FULLSIM);
  renderFlowStep();
}
