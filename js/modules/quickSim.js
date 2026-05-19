// ── SIMULAÇÃO RÁPIDA ──
// 5 telas otimizadas: Total+Saldo → Taxa → Encargos → %+Mês → Parcela Fin (opcional)

const STEPS_QUICK = [
  {
    num: '01 / 05',
    title: 'Informe os valores abaixo.',
    hint: 'Consulte nos apps Caixa ou no seu contrato.',
  },
  {
    num: '02 / 05',
    title: 'Qual a Taxa de Juros Anual do seu financiamento?',
    hint: 'O app irá converter sua taxa anual para mensal abaixo.',
  },
  {
    num: '03 / 05',
    title: 'Quais os seus encargos mensais?',
    hint: 'Valores cobrados mensalmente pela Caixa, independente do andamento da obra.',
  },
  {
    num: '04 / 05',
    title: 'Informe a última medição da evolução de obra.',
    hint: 'Consulte seu extrato bancário ou app Habitação Caixa.',
  },
  {
    num: '05 / 05',
    title: 'Qual o valor da sua 1ª parcela do financiamento? — Opcional',
    hint: 'Compararemos o valor dos seus Juros de Evolução de Obra com a Parcela do Financiamento.',
  }
];

// ── RENDER PRINCIPAL ──
function renderQuickStep() {
  screen = 'quick';
  const s    = STEPS_QUICK[currentStep];
  const qseg = parseFloat(formQuick.seguro  || 0);
  const qadm = parseFloat(formQuick.taxaAdm || 25);

  let inputsHtml = '';

  if (currentStep === 0) {
    inputsHtml = `
      <div class="field-group">
        <label class="field-label">Valor do seu Financiamento</label>
        <div class="label-hint">O total de crédito liberado pelo banco — Sem a entrada da Construtora.</div>
        <div class="input-wrap">
          <span class="pre">R$</span>
          <input type="text" id="qinp-total" class="has-pre" placeholder="150.000,00" inputmode="numeric" oninput="maskOnInput(this);this.classList.remove('invalid')">
        </div>
      </div>
      <br>
      <label class="field-label">Saldo devedor atual</label>
      <div class="label-hint">Valor repassado à Construtora até o momento</div>
      <div class="input-wrap">
        <span class="pre">R$</span>
        <input type="text" id="qinp-saldo" class="has-pre" placeholder="125.000,00" inputmode="numeric" oninput="maskOnInput(this);this.classList.remove('invalid');_atualizaPercCalculado()">
      </div>
      <div class="info-box" id="box-perc-calc" style="margin-top: 12px; display:none">
        📊 Com base nos valores acima, Darwin calculou: <strong>Aproximadamente <span id="perc-calc-valor">—</span></strong>% de evolução de obra
      </div>

      <div class="help-section">
        <button class="help-toggle" onclick="toggleHelp('help-tela0')">
          ❓ Não sabe onde encontrar esses valores? 
        </button>
        <div class="help-content" id="help-tela0" style="display:none">
          <img src="data/ajuda-extrato-saldo.png" alt="Onde encontrar" class="help-image">
          <p class="help-caption">Consulte seu extrato bancário ou app Habitação Caixa</p>
        </div>
      </div>`;

  } else if (currentStep === 1) {
    inputsHtml = `
      <div class="input-wrap">
        <input type="text" id="qinp-taxa" class="has-suf" placeholder="5,4321" inputmode="numeric"
          oninput="maskOnInput(this);this.classList.remove('invalid');_atualizaTaxaQuick()">
        <span class="suf">% a.a.</span>
      </div>
      <div class="diff-box" id="box-taxa" style="display:none">
        <div class="d-title">Como funcionam os juros na Evolução de Obra?</div>
        <div class="diff-row">
          <span class="d-label">Sua Taxa de Juros Mensal</span>
          <span class="d-val" id="val-taxa-mensal">—</span>
        </div>
        <div class="diff-row">
          <span class="d-label">(+) Taxa Referencial do mês</span>
          <span class="d-val">0,1000%</span>
        </div>
        <hr class="diff-divider">
        <div class="diff-row hl">
          <span class="d-label">Taxa de Juros para cálculo</span>
          <span class="d-val" id="val-taxa">—</span>
        </div>
      </div>
      <div class="info-box" id="box-taxa-info" style="display:none">
        💡 Aqui utilizamos TR de 0,1000% apenas como exemplo didático. O valor oficial é divulgado pelo Banco Central todos os meses.
      </div>
      
      <div class="help-section">
        <button class="help-toggle" onclick="toggleHelp('help-tela1')">
          ❓ Não sabe onde encontrar esse valor?
        </button>
        <div class="help-content" id="help-tela1" style="display:none">
          <img src="data/ajuda-taxa-juros.png" alt="Onde encontrar taxa de juros" class="help-image">
          <p class="help-caption">Consulte seu contrato ou app Habitação Caixa</p>
        </div>
      </div>`;

  } else if (currentStep === 2) {
    inputsHtml = `
      <label class="field-label">1. Seguro</label>
      <div class="label-hint">O valor de seguro é único para cada comprador — Verifique no seu contrato.</div>
      <div class="input-wrap">
        <span class="pre">R$</span>
        <input type="text" id="qinp-seguro" class="has-pre" placeholder="00,00" inputmode="numeric"
          oninput="maskOnInput(this);atualizaEncargosQuick();this.classList.remove('invalid')">
      </div>
      <div class="field-group">
        <label class="field-label">2. Taxa Administrativa</label>
        <div class="label-hint">A Taxa de Administração da Caixa Econômica possui um valor fixo de R$ 25,00.</div>
        <div class="input-wrap">
          <span class="pre">R$</span>
          <input type="text" id="qinp-taxaAdm" class="has-pre" placeholder="25,00" inputmode="numeric"
            oninput="maskOnInput(this);atualizaEncargosQuick()">
        </div>
      </div>
      <div class="confirm-box" id="box-enc" style="${qseg > 0 ? '' : 'display:none'}">
        <div><div class="c-label">Total de encargos mensais</div></div>
        <div class="c-val" id="val-enc">${qseg > 0 ? fmtBRL(qseg + qadm) : ''}</div>
      </div>
      
      <div class="help-section">
        <button class="help-toggle" onclick="toggleHelp('help-tela2')">
          ❓ Não sabe onde encontrar esses valores?
        </button>
        <div class="help-content" id="help-tela2" style="display:none">
          <img src="data/ajuda-encargos.png" alt="Onde encontrar encargos" class="help-image">
          <p class="help-caption">Consulte seu extrato bancário ou contrato</p>
        </div>
      </div>`;

  } else if (currentStep === 3) {
    const percCalc = _calcPercAutomatico();
    const diferenca = Math.abs(percCalc - (formQuick.percObra || percCalc));
    const temDiscrepancia = diferenca > 10;
    
    inputsHtml = `
      <div class="field-group">
        <label class="field-label">Percentual atual de Evolução de Obra</label>
        <div class="label-hint">Baseado nos dados informados, estimamos ${percCalc.toFixed(1)}%. Está correto?</div>
        <div class="input-wrap">
          <input type="text" id="qinp-perc" class="has-suf" placeholder="00,00" inputmode="numeric"
            oninput="maskOnInput(this);_limitPercQuick(this);this.classList.remove('invalid')">
          <span class="suf">%</span>
        </div>
      </div>
      
      ${temDiscrepancia ? `
        <div class="info-box" style="margin-top:8px;background:var(--warn-bg);border-color:#F6E0A0">
        ⚠️ Atenção: há uma diferença de ${diferenca.toFixed(1)}% entre o % calculado e o informado. Verifique se os valores estão corretos.
        </div>` : ''}
      <br>

      <label class="field-label">Mês dessa Medição</label>
      <div class="label-hint">A qual mês essa % de obra se refere?</div>
      <input type="month" id="qinp-mes-medido" value="${formQuick.mesMedido || ''}"
        oninput="this.classList.remove('invalid');_atualizaTRInfo()">
      <div class="info-box" id="box-tr-info" style="margin-top: 8px; display: none">
        <span id="tr-info-text"></span>
      </div>`;

  } else if (currentStep === 4) {
    inputsHtml = `
      <div class="input-wrap">
        <span class="pre">R$</span>
        <input type="text" id="qinp-parcela-fin" class="has-pre" placeholder="1.234,56" inputmode="numeric"
          oninput="maskOnInput(this)">
      </div>`;
  }

  const isFirst = currentStep === 0;
  const isLast  = currentStep === STEPS_QUICK.length - 1;

  setHtml(`
    ${_renderProgressQuick()}
    <div class="step-card">
      <div class="step-num">${s.num}</div>
      <div class="step-title">${s.title}</div>
      <div class="step-hint">${s.hint}</div>
      ${inputsHtml}
      <button class="btn btn-primary" onclick="nextStepQuick()">
        ${isLast ? 'Ver resultado →' : 'Continuar →'}
      </button>
      <button class="btn btn-back" onclick="${isFirst ? 'renderBifurcacao()' : 'prevStepQuick()'}">
        ← Voltar
      </button>
    </div>`);

  setTimeout(() => {
    if (currentStep === 0) {
      attachMask('qinp-total', 'brl', formQuick.totalFinanciado || '');
      attachMask('qinp-saldo', 'brl', formQuick.saldoAtual || '');
      _atualizaPercCalculado();
    }
    if (currentStep === 1) {
      attachMask('qinp-taxa', 'perc4', formQuick.taxaAnual || '');
      const el = document.getElementById('qinp-taxa');
      if (el) el.oninput = () => { maskValue(el, 'perc4'); el.classList.remove('invalid'); _atualizaTaxaQuick(); };
      if (formQuick.taxaAnual) _atualizaTaxaQuick();
    }
    if (currentStep === 2) {
      attachMask('qinp-seguro',  'brl', formQuick.seguro  || '');
      attachMask('qinp-taxaAdm', 'brl', formQuick.taxaAdm || 25);
      const qsegEl = document.getElementById('qinp-seguro');
      const qadmEl = document.getElementById('qinp-taxaAdm');
      if (qsegEl) qsegEl.oninput = () => { maskValue(qsegEl, 'brl'); qsegEl.classList.remove('invalid'); atualizaEncargosQuick(); };
      if (qadmEl) qadmEl.oninput = () => { maskValue(qadmEl, 'brl'); atualizaEncargosQuick(); };
    }
    if (currentStep === 3) {
      const percCalc = _calcPercAutomatico();
      // Inicializa com valor calculado se não houver valor salvo
      const valorInicial = formQuick.percObra || percCalc;
      attachMask('qinp-perc', 'perc2', valorInicial);
      const elMes = document.getElementById('qinp-mes-medido');
      if (elMes && formQuick.mesMedido) elMes.value = formQuick.mesMedido;
      _atualizaTRInfo();
    }
    if (currentStep === 4) {
      attachMask('qinp-parcela-fin', 'brl', formQuick.parcelaFinanciamento || '');
    }
    const f = document.querySelector('.step-card input:not([type=range])');
    if (f && currentStep !== 2) f.focus();
  }, 80);
}

function _renderProgressQuick() {
  return `<div class="progress-wrap">${Array.from({ length: STEPS_QUICK.length }, (_, i) =>
    `<div class="progress-dot ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}"></div>`
  ).join('')}</div>`;
}

// ── TOGGLE AJUDA VISUAL ──
function toggleHelp(id) {
  const content = document.getElementById(id);
  if (!content) return;
  content.style.display = content.style.display === 'none' ? 'block' : 'none';
}

// TELA 1
// ── CALCULAR % AUTOMATICAMENTE ──
function _calcPercAutomatico() {
  const total = parseFloat(formQuick.totalFinanciado || 0);
  const saldo = parseFloat(formQuick.saldoAtual || 0);
  if (total <= 0) return 0;
  return (saldo / total) * 100;
}

// ── ATUALIZAR INFO DE % CALCULADO ──
function _atualizaPercCalculado() {
  const perc = _calcPercAutomatico();
  const box = document.getElementById('box-perc-calc');
  const val = document.getElementById('perc-calc-valor');
  if (perc > 0 && box && val) {
    val.textContent = perc.toFixed(1);
    box.style.display = 'block';
  } else if (box) {
    box.style.display = 'none';
  }
}

// ── ATUALIZAR ENCARGOS ──
function atualizaEncargosQuick() {
  const elSeg = document.getElementById('qinp-seguro');
  const elAdm = document.getElementById('qinp-taxaAdm');
  const s = maskRead(elSeg) || 0;
  const a = maskRead(elAdm) || 25;
  const box = document.getElementById('box-enc');
  const val = document.getElementById('val-enc');
  if (box && val) {
    box.style.display = s > 0 ? 'block' : 'none';
    val.textContent = fmtBRL(s + a);
  }
}

// ── ATUALIZAR TAXA (DIDÁTICO) ──
function _atualizaTaxaQuick() {
  const el = document.getElementById('qinp-taxa');
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

// ── ATUALIZAR INFO DE TR VIA MÊS INFORMADO ──
function _atualizaTRInfo() {
  const el = document.getElementById('qinp-mes-medido');
  const mes = el?.value;
  const box = document.getElementById('box-tr-info');
  const text = document.getElementById('tr-info-text');
  
  if (!mes || !box || !text) return;
  
  const ym = parseMS(mes);
  const trDec = getTRParaMes(ym); // retorna 0 se não encontrar
  
  if (trDec > 0) {
    const trPerc = (trDec * 100).toFixed(4);
    text.innerHTML = `📊 Taxa Referencial de ${mLabel(ym)}: <strong>${trPerc}%</strong>`;
    box.style.display = 'block';
  } else {
    const mesLabel = mLabel(ym);
    text.innerHTML = `⏳ Taxa Referencial indisponível para o mês informado`;
    box.style.display = 'block';
  }
}

// ── NAVEGAÇÃO ──
function nextStepQuick() {
if (currentStep === 0) {
    const elTotal = document.getElementById('qinp-total');
    const total   = maskRead(elTotal);
    if (!total || total <= 0) {
      elTotal?.classList.add('invalid');
      showToast('⚠️ Informe o valor total do financiamento.'); return; }
    formQuick.totalFinanciado = total;

    const elSaldo = document.getElementById('qinp-saldo');
    const saldo   = maskRead(elSaldo);
    if (!saldo || saldo <= 0) {
      elSaldo?.classList.add('invalid');
      showToast('⚠️ Informe o saldo devedor atual.'); return; }
    if (saldo > total) {
      elSaldo?.classList.add('invalid');
      showToast('⚠️ Saldo devedor não pode ser maior que o valor financiado.'); return; }
    formQuick.saldoAtual = saldo;

  } else if (currentStep === 1) {
    const el = document.getElementById('qinp-taxa');
    const v  = maskRead(el);
    if (!v || v <= 0) { el?.classList.add('invalid'); showToast('⚠️ Informe a taxa de juros.'); return; }
    formQuick.taxaAnual = v;

  } else if (currentStep === 2) {
    const elSeg = document.getElementById('qinp-seguro');
    const s = maskRead(elSeg);
    if (!s || s <= 0) { elSeg?.classList.add('invalid'); showToast('⚠️ Informe o valor do seguro.'); return; }
    formQuick.seguro  = s;
    formQuick.taxaAdm = maskRead(document.getElementById('qinp-taxaAdm')) || 25;

  } else if (currentStep === 3) {
    const elPerc = document.getElementById('qinp-perc');
    const elMes = document.getElementById('qinp-mes-medido');
    const perc = maskRead(elPerc);
    const mes = elMes?.value;
    if (!perc || perc <= 0 || perc > 100) { elPerc?.classList.add('invalid'); showToast('⚠️ Informe uma evolução entre 0,01% e 100%.'); return; }
    if (!mes) { elMes?.classList.add('invalid'); showToast('⚠️ Informe o mês da medição.'); return; }
    formQuick.percObra = perc;
    formQuick.mesMedido = mes;

  } else if (currentStep === 4) {
    const el = document.getElementById('qinp-parcela-fin');
    const v  = maskRead(el);

    if (!v || v <= 0) {
      el?.classList.add('invalid'); showToast('⚠️ Informe o valor da parcela.'); return;}

    const total = formQuick.totalFinanciado || 0;

    if (v > total) {
      elv?.classList.add('invalid');
      showToast('⚠️ Parcela não pode ser maior que o valor total financiado.'); return; }

    formQuick.parcelaFinanciamento = v;

    renderResultQuick();
    return;
  }

  currentStep++;
  renderQuickStep();
}

function prevStepQuick() {
  if (currentStep > 0) { currentStep--; renderQuickStep(); }
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
  const saldo  = _calcSaldoNoPerc();
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

  const perc      = parseFloat(formQuick.percObra || 0);
  const mesLabel  = formQuick.mesMedido ? mLabel(parseMS(formQuick.mesMedido)) : '—';
  const temFin    = formQuick.parcelaFinanciamento > 0;
  const sliderStart = Math.max(5, perc);

  const { trPerc, trReais } = _calcTREmReais();
  const temTR = trPerc !== null && trPerc > 0;

  const ymAtual = parseMS(formQuick.mesMedido);
  const ymSeguinte = _nextMesLabel(ymAtual);
  const proxMesLabel = mLabel(ymSeguinte);

  // Card 1: Parcela Estimada no % Atual
  const parcelaAtual = _calcParcelaAtual();

  const card1Html = `
    <div class="quick-result-card">
      <div class="qrc-label">Parcela atual<br>Vence em ${proxMesLabel}</div>
      <div class="qrc-val">${fmtBRL(parcelaAtual)}</div>
      <div class="qrc-note">${temTR ? 'Valor total' : 'Valor sem TR'}</div>
    </div>`;

  // Card large → 100% de largura para caber o saldo devedor em 10 dígitos
  // Card 1 → Última parcela com TR do mês / Card 3 → TR do mês

  setHtml(`
    <div class="result-header">
      <h2>Simulação Rápida</h2>
    </div>

    <div class="quick-result-card accent large">
      <div class="qrc-label">Saldo devedor informado<br></div>
      <div class="qrc-val">${fmtBRL(formQuick.saldoAtual)}</div>
      <div class="qrc-note">${perc.toFixed(1)}% de obra · ${mesLabel}</div>
    </div>

    <div class="quick-result-grid-top">
      ${card1Html}

      <div class="quick-result-card">
        <div class="qrc-label">Taxa Referencial ${temTR ? fmtPerc(trPerc, 4) : ''}</div>
        <div class="qrc-val">${temTR ? fmtBRL(trReais) : '<small>Indisponível</small>'}</div>
        <div class="qrc-note">${temTR ? 'Embutido na prestação' : '-'}</div>
      </div>
    </div>

    <div class="quick-disclaimer-top">
        ⚠️ <strong>IMPORTANTE: Os valores abaixo são estimativas aproximadas por não incluírem a TR oficial e o valor do Terreno. Em caso de discrepância entre a % de Obra e o Saldo Devedor, opte por considerar o Saldo Devedor mais aproximado.</strong>
    </div>

    <div class="free-preview-card" style="margin-top:12px">
      <div class="free-preview-header">
        <div class="free-preview-title">Próximas Prestações <span>· Arraste para simular</span></div>
      </div>
      <div class="slider-wrap">
        <div class="slider-labels">
          <span>5%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
        <input type="range" id="preview-slider" class="preview-slider"
          min="5" max="100" step="5" value="${sliderStart}"
          oninput="atualizaSliderQuick()">
      </div>
      <div class="slider-result">
        <dl class="slider-result-row">
          <dt class="slider-result-label">Evolução de Obra</dt>
          <dd class="slider-result-perc" id="slider-perc">${sliderStart}%</dd>
          <dt class="slider-result-label">Saldo devedor</dt>
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
            <div class="qrc-val">${fmtBRL(formQuick.parcelaFinanciamento)}</div>
          </div>
          <div id="slider-fin-bloco" class="slider-fin-bloco"></div>
        </div>` : ''}
    </div>

    <div class="quick-cta-card">
      <div class="quick-cta-title">Quer uma projeção mês a mês?</div>
      <div class="quick-cta-sub">Você pode aproveitar alguns dados da sua simulação e partir para a versão detalhada.<br>
      Com a simulação detalhada, você acessa a tabela com todas as parcelas, acompanha pagamentos e evolução mês a mês.</div>
      <button class="btn btn-primary" onclick="irParaSimulacaoCompleta()">
        ⚠ EM TESTES ⚠
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

  const perc      = parseInt(slider.value);
  const total     = parseFloat(formQuick.totalFinanciado || 0);
  const tm        = (parseFloat(formQuick.taxaAnual) / 100) / 12;
  const enc       = parseFloat(formQuick.seguro || 0) + parseFloat(formQuick.taxaAdm || 25);
  const percObra  = parseFloat(formQuick.percObra || 5);

  const sdProj   = total * (perc / 100);
  const previsto = tm * sdProj + enc;

  const elPerc  = document.getElementById('slider-perc');
  const elVal   = document.getElementById('slider-val');
  const elSaldo = document.getElementById('slider-saldo');
  if (elPerc)  elPerc.textContent  = perc + '%';
  if (elVal)   elVal.innerHTML     = `${fmtBRL(previsto)}`;
  if (elSaldo) elSaldo.textContent = fmtBRL(sdProj);

  // Coloração estática: faixa verde na % informada, referência fixa
  slider.style.background = `linear-gradient(to right,
    var(--accent) 0% ${percObra}%,
    var(--border) ${percObra}% 100%)`;

  // Aviso: ultrapassagem da parcela de financiamento
  const bloco = document.getElementById('slider-fin-bloco');
  if (bloco && formQuick.parcelaFinanciamento > 0) {
    const fin  = parseFloat(formQuick.parcelaFinanciamento);
    const diff = fin - previsto;
    bloco.className = 'slider-fin-bloco' + (diff < 0 ? ' slider-fin-danger' : '');
    bloco.innerHTML = diff < 0
      ? `🚨 Evolução de obra supera o financiamento em <span>+<strong>${fmtBRL(Math.abs(diff))}</strong><span>`
      : `<span><strong>${fmtBRL(diff)}</strong></span> para igualar a parcela de financiamento`;
  }
}

// ── REINICIAR ──
function reiniciarSimulacaoRapida() {
  Object.keys(formQuick).forEach(k => { formQuick[k] = ''; });
  formQuick.percObra = 50;
  currentStep = 0;
  renderQuickStep();
}

// ── CTA: migrar para simulação detalhada ──
function irParaSimulacaoCompleta() {
  form.seguro    = String(formQuick.seguro   || '');
  form.taxaAdm   = String(formQuick.taxaAdm  || 25);
  form.taxaAnual = String(formQuick.taxaAnual || '');
  form.mesInicial          = '';
  form.mesEntrega          = '';
  form.valorTotal          = '';
  form.valorTerreno        = '';
  form.percFinanciado      = 80;
  form.nomeSimulacao       = '';
  form.historicoPagamentos = [];

  fluxo = 'complete';
  currentStep = 0;
  screen = 'onboarding';
  renderStep();
}
