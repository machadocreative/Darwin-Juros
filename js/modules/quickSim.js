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
    document.getElementById('dq-perc-fin').textContent = fmtPerc(percFin, 1);
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

  if (perc > 0) {
    const percFormatado = perc.toFixed(2).replace('.', ',');
    if (group) group.style.display = 'block';
    if (hint)  hint.textContent = `Estimamos ${percFormatado}% com base no saldo acima. Corrija se necessário.`;
    if (elPerc) {
      elPerc.placeholder = percFormatado;
      if (!maskRead(elPerc)) attachMask(QUESTION_IDS.percentualObra, 'perc2', perc);
    }
  } else {
    if (group) group.style.display = 'none';
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
  const a = maskRead(elAdm) || 25;
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

function preencherMesAtual() {
  const atual = _mesAtual();

  const valor =
    atual.y + '-' + String(atual.m).padStart(2, '0');

  const el = document.getElementById(QUESTION_IDS.mesMedido);

  if (!el) return;

  el.value = valor;
  formQuick.mesMedido = valor;
  el.classList.remove('invalid');
  _atualizaTRInfo();
}

// ── ASSOCIAR VALOR DE TR COM O JSON PELO MÊS INFORMADO ──
function _atualizaTRInfo() {
  const el  = document.getElementById(QUESTION_IDS.mesMedido);
  const mes = el?.value;
  const box  = document.getElementById('box-tr-info');
  const text = document.getElementById('tr-info-text');

  if (!mes || !box || !text) return;

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

// Saldo no % informado na tela 4
function _calcSaldoNoPerc() {
  const total = parseFloat(formQuick.totalFinanciado || 0);
  const perc  = parseFloat(formQuick.percObra || 0);
  return total * (perc / 100);
}

// Parcela sem TR
function _calcParcelaSemTR(saldo) {
  const tm  = (parseFloat(formQuick.taxaAnual) / 100) / 12;
  const enc = parseFloat(formQuick.seguro || 0) + parseFloat(formQuick.taxaAdm || 25);
  return tm * saldo + enc;
}

// Parcela estimada no % atual (usa saldo REAL + TR obtida silenciosamente)
function _calcParcelaAtual() {
  const saldo = parseFloat(formQuick.saldoAtual || 0);
  const tm = (parseFloat(formQuick.taxaAnual) / 100) / 12;
  const enc = parseFloat(formQuick.seguro || 0) + parseFloat(formQuick.taxaAdm || 25);
  const ym = formQuick.mesMedido ? parseMS(formQuick.mesMedido) : null;
  const tr = ym ? getTRParaMes(ym) : 0; // obtém TR silenciosamente
  return (tm + tr) * saldo + enc;
}

// TR em R$ (obtida silenciosamente via mês)
function _calcTREmReais() {
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

  const { trPerc, trReais } = _calcTREmReais();
  const temTR = trPerc !== null && trPerc > 0;

  const ymAtual = parseMS(formQuick.mesMedido);
  const ymSeguinte = _nextMesLabel(ymAtual);
  const proxMesLabel = mLabel(ymSeguinte);

  const parcelaAtual = _calcParcelaAtual();

  const card1Html = `
    <div class="quick-result-card">
      <div class="qrc-label">Parcela atual<br>Vence em ${proxMesLabel}</div>
      <div class="qrc-val">${fmtBRL(parcelaAtual)}</div>
      <div class="qrc-note">${temTR ? 'Valor total' : 'Valor sem TR'}</div>
    </div>`;

  setHtml(`
    <div class="result-header">
      <h2>Simulação Rápida</h2>
    </div>

    <div class="quick-result-grid-top">
      <div class="quick-result-card accent">
        <div class="qrc-label">Saldo devedor atual</div>
        <div class="qrc-val">${fmtBRL(formQuick.saldoAtual)}</div>
        <div class="qrc-note">de ${fmtBRL(formQuick.totalFinanciado)}</div>
      </div>
      <div class="quick-result-card">
        <div class="qrc-label">Evolução de Obra</div>
        <div class="qrc-val">${fmtPerc(percInformado, 2)}</div>
        <div class="qrc-note">Medição para ${mesLabel}</div>
      </div>
    </div>

    <div class="quick-disclaimer-top">
      ⚠️ IMPORTANTE: Na simulação rápida, o saldo devedor será calculado de forma aproximada em relação à evolução de obra.
    </div>

    <div class="preview-slider-card" style="margin-top:12px">
      <div class="preview-slider-header">
        <div class="preview-slider-title">Visualizador de Prestações</div>
        <div class="preview-slider-sub"><span>Arraste para simular suas próximas prestações</span></div>
      </div>

      <div class="quick-result-grid-top qrg-inner">
        ${card1Html}
        <div class="quick-result-card">
          <div class="qrc-label">Taxa Referencial<br>${temTR ? fmtPerc(trPerc, 4) + ' · ' + mesLabel : ''}</div>
          <div class="qrc-val">${temTR ? fmtBRL(trReais) : '<small>Indisponível</small>'}</div>
          <div class="qrc-note">${temTR ? 'Embutido na prestação' : '-'}</div>
        </div>
      </div>

      <div class="slider-wrap">
        <div class="slider-labels">
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
        <input type="range" id="preview-slider" class="preview-slider"
          min="0" max="100" step="5" value="${sliderMin}"
          oninput="atualizaSliderQuick()">
      </div>
      <div class="slider-result">
        <dl class="slider-result-row">
          <dt class="slider-result-label">Evolução de Obra</dt>
          <dd class="slider-result-perc" id="slider-perc">${sliderMin}%</dd>
          <dt class="slider-result-label">Saldo devedor</dt>
          <dd class="slider-result-val" id="slider-saldo">—</dd>
        </dl>
        <dl class="slider-result-row highlight">
          <dt class="slider-result-label">Prestação simulada<br><strong>Taxa Referencial = 0,0000%</strong></dt>
          <dd class="slider-result-val accent" id="slider-val">—</dd>
        </dl>
      </div>
      ${temFin ? `
        <div class="quick-result-grid-slider">
          <div class="quick-result-card accent">
            <div class="qrc-label">1ª Parcela do Financiamento</div>
            <div class="qrc-val">${fmtBRL(formQuick.parcelaFinanciamento)}</div>
          </div>
          <div id="slider-fin-bloco" class="slider-fin-bloco"></div>
        </div>` : ''}
    </div>

    <div class="quick-cta-card">
      <div class="quick-cta-title">Quer uma projeção mês a mês?</div>
      <div class="quick-cta-sub">Você pode aproveitar os dados inseridos da sua simulação rápida e partir para a versão detalhada.<br>
      Com a simulação detalhada, você acessa a tabela com todas as parcelas, acompanha pagamentos e evolução mês a mês.</div>
      <button class="btn btn-primary" onclick="irParaSimulacaoCompleta()">
        Prosseguir para Simulação Completa →
      </button>
      <button class="btn btn-back" onclick="reiniciarSimulacaoRapida()">
        ← Refazer simulação rápida
      </button>
    </div>

    <div class="quick-disclaimer-end">
      <p>Darwin não é uma ferramenta preditiva. Utilizamos a fórmula oficial de cálculo divulgada pela Caixa Econômica. Não nos responsabilizamos se previsões futuras não corresponderem à realidade, uma vez que valores cobrados serão sempre de encargo da instituição financeira.</p>
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
  const enc = parseFloat(formQuick.seguro || 0) + parseFloat(formQuick.taxaAdm || 25);

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

  // Card: Comparativo de evolução com a parcela de financiamento
  const bloco = document.getElementById('slider-fin-bloco');
  if (bloco && formQuick.parcelaFinanciamento > 0) {
    const fin  = parseFloat(formQuick.parcelaFinanciamento);
    const diff = fin - previsto;
    bloco.className = 'slider-fin-bloco' + (diff < 0 ? ' slider-fin-danger' : '');
    bloco.innerHTML = diff < 0
      ? `🚨 Evolução supera o financiamento em <span>+<strong>${fmtBRL(Math.abs(diff))}</strong><span>`
      : `<span><strong>${fmtBRL(diff)}</strong></span> para igualar a parcela de financiamento`;
  }
}

// ── REINICIAR ──
function reiniciarSimulacaoRapida() {
  Object.keys(formQuick).forEach(k => { formQuick[k] = ''; });
  formQuick.percObra = 50;
  currentStep = 0;
  initFlow(FLOW_QUICKSIM); renderFlowStep();
}

// ── CTA: migrar para simulação detalhada ──
function irParaSimulacaoCompleta() {
  form.seguro    = String(formQuick.seguro   || '');
  form.taxaAdm   = String(formQuick.taxaAdm  || 25);
  form.taxaAnual = String(formQuick.taxaAnual || '');
  form.parcelaFinanciamento = formQuick.parcelaFinanciamento || null;

  if (formQuick.valorTotal && formQuick.totalFinanciado) {
    form.valorTotal    = String(formQuick.valorTotal);
    form.percFinanciado = parseFloat(((formQuick.totalFinanciado / formQuick.valorTotal) * 100).toFixed(2));
  } else {
    form.valorTotal    = '';
    form.percFinanciado = 80;
  }

  form.mesInicial          = '';
  form.mesEntrega          = '';
  form.valorTerreno        = '';
  form.nomeSimulacao       = '';
  form.historicoPagamentos = [];

  // Define quais telas pular por já terem dados do QuickSim
  migrationSkipCheck = (questionKey) => {
    switch (questionKey) {
      case 'valorImovel':         return !!(form.valorTotal && form.percFinanciado);
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
