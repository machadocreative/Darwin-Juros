// ── SIMULAÇÃO RÁPIDA ──
// 6 telas: % de obra → última parcela paga → saldo devedor → taxa de juros → encargos → parcela de financiamento para comparação

const STEPS_QUICK = [
  {
    num: '01 / 06',
    title: 'Qual o percentual atual de evolução de obra?',
    hint: 'Consulte o Internet Banking Caixa ou o app Habitação.',
  },
  {
    num: '02 / 06',
    title: 'Qual o valor da prestação paga mais recente?',
    hint: 'Consulte seu extrato bancário.',
  },
  {
    num: '03 / 06',
    title: 'Qual o seu saldo devedor atual?',
    hint: 'Consulte o extrato do seu financiamento no app Habitação Caixa ou no internet banking da Caixa.',
  },
  {
    num: '04 / 06',
    title: 'Qual a Taxa de Juros Anual do seu financiamento?',
    hint: 'O app irá converter sua taxa anual para mensal abaixo.',
  },
  {
    num: '05 / 06',
    title: 'Quais os seus encargos mensais?',
    hint: 'Valores cobrados mensalmente pela Caixa, independente do andamento da obra.',
  },
  {
    num: '06 / 06',
    title: 'Qual o valor da sua 1ª parcela do financiamento? — Opcional',
    hint: 'Compararemos o valor dos seus Juros de Evolução de Obra com a Parcela do Financiamento.',
  }
];

// ── RENDER PRINCIPAL ──
function renderQuickStep() {
  screen = 'quick';
  const s = STEPS_QUICK[currentStep];
  let inputsHtml = '';

  if (currentStep === 0) {
    const perc = formQuick.percObra ?? 50;
    const sliderMin = 5;
    const sliderStart = Math.max(sliderMin, perc);
    inputsHtml = `
      <div class="quick-perc-wrap">
        <div class="slider-labels">
          <span>1%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
        <input type="range" id="qinp-slider" class="preview-slider"
          min="sliderMin" max="100" step="5" value="${sliderStart}"
          oninput="_syncPercQuick(this.value)">
        <div class="slider-perc-label" id="qslider-perc">${perc}%<</div>
        <div class="quick-perc-row">
          <span class="quick-perc-label">Ou digite:</span>
          <div class="input-wrap quick-perc-input-wrap">
            <input type="text" id="qinp-perc" class="has-suf" inputmode="numeric"
              placeholder="50,00" oninput="maskOnInput(this);_syncPercFromInput()">
            <span class="suf">%</span>
          </div>
        </div>
      </div>`;

  } else if (currentStep === 1) {
    inputsHtml = `
      <div class="field-group">
        <label class="field-label">Valor pago</label>
        <div class="input-wrap">
          <span class="pre">R$</span>
          <input type="text" id="qinp-ultima" class="has-pre" placeholder="123,45" inputmode="numeric"
            oninput="maskOnInput(this);this.classList.remove('invalid')">
        </div>
      </div><br>
      <label class="field-label">Mês</label>
      <input type="month" id="qinp-mes-parcela" value="${formQuick.mesParcela || ''}"
        oninput="this.classList.remove('invalid')">`;

  } else if (currentStep === 2) {
    inputsHtml = `
      <div class="input-wrap">
        <span class="pre">R$</span>
        <input type="text" id="qinp-saldo" class="has-pre" placeholder="123.456,78" inputmode="numeric"
          oninput="maskOnInput(this);this.classList.remove('invalid')">
      </div>`;

  } else if (currentStep === 3) {
    inputsHtml = `
      <div class="input-wrap">
        <input type="text" id="qinp-taxa" class="has-suf" placeholder="5,4321" inputmode="numeric"
          oninput="maskOnInput(this);this.classList.remove('invalid');_atualizaTaxaQuick()">
        <span class="suf">% a.a.</span>
      </div>

      <div class="diff-box" id="box-taxa" style="${formQuick.taxaAnual > 0 ? '' : 'display:none'}">
        <div class="d-title">Como funcionam os juros na Evolução de Obra?</div>
        <div class="diff-row">
        <span class="d-label">Taxa de Juros Mensal</span>
        <span class="d-val" id="val-taxa-mensal">${formQuick.taxaAnual > 0 ? fmtPerc(formQuick.taxaAnual / 12, 4) : ''}</span>
      </div>
      <div class="diff-row">
        <span class="d-label">(+) Taxa Referencial do mês</span><span class="d-val">0,1000%</span>
      </div>
      <hr class="diff-divider">
      <div class="diff-row hl"><span class="d-label">Taxa no cálculo da prestação</span><span class="d-val" id="val-taxa">${formQuick.taxaAnual > 0 ? fmtPerc(formQuick.taxaAnual / 12 + 0.1, 4) : ''}</span></div>
    </div>
    <div class="info-box" style="${formQuick.taxaAnual > 0 ? '' : 'display:none'}">
      💡 Aqui utilizamos TR de 0,1000% apenas como exemplo didático. O valor oficial é divulgado pelo Banco Central todos os meses.</div>`;

  } else if (currentStep === 4) {
    inputsHtml = `
      <label class="field-label">1. Seguro</label>
      <div class="label-hint">O valor de seguro é único para cada comprador — Verifique no seu contrato.</div>
      <div class="input-wrap">
        <span class="pre">R$</span>
        <input type="text" id="qinp-seguro" class="has-pre" placeholder="00,00" inputmode="numeric"
          oninput="maskOnInput(this);atualizaEncargos();this.classList.remove('invalid')">
      </div>

      <div class="field-group">
        <label class="field-label">2. Taxa Administrativa</label>
        <div class="label-hint">A Taxa de Administração da Caixa Econômica possui um valor fixo de R$ 25,00.</div>
        <div class="input-wrap">
          <span class="pre">R$</span>
          <input type="text" id="qinp-taxaAdm" class="has-pre" placeholder="25,00" inputmode="numeric"
            oninput="maskOnInput(this);atualizaEncargos()">
        </div>
      </div>

      <div class="confirm-box" id="box-enc" style="${qseg > 0 ? '' : 'display:none'}">
        <div><div class="c-label">Total de encargos mensais</div></div>
        <div class="c-val" id="val-enc">${qseg > 0 ? fmtBRL(qseg + 25) : ''}</div>
      </div>`;

  } else if (currentStep === 5) {
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
      attachMask('qinp-perc', 'perc2', formQuick.percObra ?? 50);
      _syncPercQuick(formQuick.percObra ?? 50);
    }
    if (currentStep === 1) {
      attachMask('qinp-ultima', 'brl', formQuick.ultimaParcela || '');
      const elMes = document.getElementById('qinp-mes-parcela');
      if (elMes && formQuick.mesParcela) elMes.value = formQuick.mesParcela;
    }
    if (currentStep === 2) {
      attachMask('qinp-saldo', 'brl', formQuick.saldoDevedor || '');
    }
    if (currentStep === 3) {
      attachMask('qinp-taxa', 'perc4', formQuick.taxaAnual || '');
      const el = document.getElementById('qinp-taxa');
      if (el) el.oninput = () => { maskValue(el, 'perc4'); el.classList.remove('invalid'); _atualizaTaxaQuick(); };
      if (formQuick.taxaAnual) _atualizaTaxaQuick();
    }
    if (currentStep === 4) {
      attachMask('qinp-seguro',  'brl', formQuick.seguro  || '');
      attachMask('qinp-taxaAdm', 'brl', formQuick.taxaAdm || 25);
      const qseg = document.getElementById('qinp-seguro');
      const qadm = document.getElementById('qinp-taxaAdm');
      if (qseg) qseg.oninput = () => { maskValue(qseg, 'brl'); qseg.classList.remove('invalid'); atualizaEncargos(); };
      if (qadm) qadm.oninput = () => { maskValue(qadm, 'brl'); atualizaEncargos(); };
    }
    if (currentStep === 5) {
      attachMask('qinp-parcela-fin', 'brl', formQuick.parcelaFinanciamento || '');
    }
    const f = document.querySelector('.step-card input:not([type=range])');
    if (f && currentStep !== 3) f.focus();
  }, 80);
}

function _renderProgressQuick() {
  return `<div class="progress-wrap">${Array.from({ length: STEPS_QUICK.length }, (_, i) =>
    `<div class="progress-dot ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}"></div>`
  ).join('')}</div>`;
}

// ── SYNC % OBRA (slider ↔ input) ──
function _syncPercQuick(val) {
  const n = Math.min(100, Math.max(0, parseInt(val) || 0));
  formQuick.percObra = n;
  const slider = document.getElementById('qinp-slider');
  const inp    = document.getElementById('qinp-perc');
  const label  = document.getElementById('qslider-perc');
  if (slider) {
    slider.value = n;
    slider.style.background = `linear-gradient(to right, var(--accent) ${n}%, var(--border) ${n}%)`;
  }
  if (label) label.textContent = n + '%';
  if (inp) {
    const tenths = Math.round(n * 10);
    inp.dataset.rawDigits = String(tenths);
    inp.value = maskApply(String(tenths), 'perc1');
  }
}

function _syncPercFromInput() {
  const el = document.getElementById('qinp-perc');
  if (!el) return;
  const v = maskRead(el);
  if (isNaN(v)) return;
  let clamped = Math.min(100, Math.max(5, v));  // limita entre 5 e 100
  clamped = Math.round(clamped / 5) * 5;        // arredonda para múltiplos de 5

  formQuick.percObra = clamped;
  const slider = document.getElementById('qinp-slider');
  const label  = document.getElementById('qslider-perc');
  if (slider) {
    slider.value = clamped;
    slider.style.background = `linear-gradient(to right, var(--accent) ${clamped}%, var(--border) ${clamped}%)`;
  }
  if (label) label.textContent = clamped + '%';
  el.value = clamped + ',00';
}

// ── BOX DE TAXA ──
function _atualizaTaxaQuick() {
  const el = document.getElementById('qinp-taxa');
  const ta = maskRead(el) || 0;
  const box         = document.getElementById('qbox-taxa');
  const elMensal    = document.getElementById('qval-taxa-mensal');
  const elCombinada = document.getElementById('qval-taxa');
  if (box) box.style.display = ta > 0 ? 'block' : 'none';
  if (elMensal)    elMensal.textContent    = fmtPerc(formQuick.taxaAnual / 12, 4);
  if (elCombinada) elCombinada.textContent = fmtPerc(formQuick.taxaAnual / 12 + 0.1, 4);
}

// ── NAVEGAÇÃO ──
function nextStepQuick() {
  if (currentStep === 0) {
    const el = document.getElementById('qinp-perc');
    if (el) {
      const v = maskRead(el);
      if (!isNaN(v)) formQuick.percObra = Math.min(100, Math.max(1, v));
    }

  } else if (currentStep === 1) {
    const elMes   = document.getElementById('qinp-mes-parcela');
    const elValor = document.getElementById('qinp-ultima');
    const mes     = elMes?.value;
    const valor   = maskRead(elValor);
    if (!mes)              { elMes?.classList.add('invalid');   showToast('⚠️ Informe o mês da última parcela.'); return; }
    if (!valor || valor <= 0) { elValor?.classList.add('invalid'); showToast('⚠️ Informe o valor da última parcela.'); return; }
    formQuick.mesParcela    = mes;
    formQuick.ultimaParcela = valor;

  } else if (currentStep === 2) {
    const el = document.getElementById('qinp-saldo');
    const v  = maskRead(el);
    if (!v || v <= 0) { el?.classList.add('invalid'); showToast('⚠️ Informe o saldo devedor.'); return; }
    formQuick.saldoDevedor = v;

  } else if (currentStep === 3) {
    const el = document.getElementById('qinp-taxa');
    const v  = maskRead(el);
    if (!v || v <= 0) { el?.classList.add('invalid'); showToast('⚠️ Informe a taxa de juros.'); return; }
    formQuick.taxaAnual = v;

  } else if (currentStep === 4) {
    const elSeg = document.getElementById('qinp-seguro');
    const s = maskRead(elSeg);
    if (!s || s <= 0) { elSeg?.classList.add('invalid'); showToast('⚠️ Informe o valor do seguro.'); return; }
    formQuick.seguro  = s;
    formQuick.taxaAdm = maskRead(document.getElementById('qinp-taxaAdm')) || 25;

  } else if (currentStep === 5) {
    // Opcional — salva se preenchido, null se pulado
    const el = document.getElementById('qinp-parcela-fin');
    const v  = maskRead(el);
    formQuick.parcelaFinanciamento = (!isNaN(v) && v > 0) ? v : null;
    renderResultQuick();
    return;
  }

  currentStep++;
  renderQuickStep();
}

function prevStepQuick() {
  if (currentStep > 0) { currentStep--; renderQuickStep(); }
}

// ── CÁLCULO ──
function _calcQuick() {
  const tm   = (parseFloat(formQuick.taxaAnual) / 100) / 12;
  const enc  = parseFloat(formQuick.seguro || 0) + parseFloat(formQuick.taxaAdm || 25);
  const sd   = parseFloat(formQuick.saldoDevedor || 0);
  const perc = parseFloat(formQuick.percObra || 0);

  // TR = 0 na simulação rápida
  const parcelaAtual = tm * sd + enc;

  return { parcelaAtual, tm, enc, sd, perc };
}

// TR da última parcela em % e R$ (do JSON histórico)
function _calcTRUltimaParcela() {
  if (!formQuick.mesParcela) return { trPerc: null, trReais: null };
  const ym   = parseMS(formQuick.mesParcela);
  const trDec = getTRParaMes(ym); // já em decimal (ex: 0.001687)
  const sd   = parseFloat(formQuick.saldoDevedor || 0);
  const trPerc  = trDec * 100;          // volta para % (ex: 0.1687)
  const trReais = trDec * sd;           // valor em R$
  return { trPerc, trReais };
}

// ── TELA DE RESULTADO SIMPLIFICADO ──
function renderResultQuick() {
  screen = 'resultQuick';
  const { parcelaAtual, tm, enc, sd, perc } = _calcQuick();
  const { trPerc, trReais } = _calcTRUltimaParcela();
  const mesLabel  = formQuick.mesParcela ? mLabel(parseMS(formQuick.mesParcela)) : '—';
  const temTR     = trPerc !== null && trPerc > 0;
  const temFin    = formQuick.parcelaFinanciamento > 0;
  const sliderMin = 5; // thumb mínimo 5%
  const sliderStart = Math.max(sliderMin, perc); // thumb do slider % de obra atual, mínimo 5

  // Card 2: TR
  const card2Html = `
    <div class="quick-result-card">
      <div class="qrc-label">TR de ${mesLabel}</div>
      <div class="qrc-perc">${temTR ? fmtPerc(trPerc, 4) : '—'}</div>
      <div class="qrc-val">${temTR ? fmtBRL(trReais) : '—'}</div>
      <div class="qrc-note">Aplicada para o cálculo da prestação</div>
    </div>`;

  setHtml(`
    <div class="result-header">
      <h2>Resultado da sua Simulação Rápida</h2>

      <div class="quick-disclaimer">
        ⚠️ Os valores reais dependem do saldo devedor atualizado, da TR divulgada pelo Banco Central e do percentual exato de evolução de obra. As estimativas serão sempre apresentadas sem a TR oficial.
      </div>
    </div>

    <div class="quick-result-cards">
      <div class="quick-result-card accent">
        <div class="qrc-label">Última parcela paga</div>
        <div class="qrc-perc">${perc}% de obra · ref. ${mesLabel}</div>
        <div class="qrc-val">${fmtBRL(formQuick.ultimaParcela)}</div>
        <div class="qrc-note">valor informado</div>
      </div>
      ${card2Html}
    </div>

    <div class="free-preview-card" style="margin-top:12px">
      <div class="free-preview-header">
        <div class="free-preview-title">Simule suas prestações</div>
        <div class="free-preview-sub">Arraste para ver a estimativa em qualquer % de obra</div>
      </div>
      <div class="slider-wrap">
        <div class="slider-labels">
          <span>1%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
        <input type="range" id="preview-slider" class="preview-slider"
          min="1" max="100" step="1" value="${sliderStart}"
          oninput="atualizaSliderQuick()">
        <div class="slider-perc-label" id="slider-perc">${sliderStart}%</div>
      </div>
      <div class="slider-result">
        <dl class="slider-result-row">
          <dt class="slider-result-label">Saldo devedor</dt>
          <dd class="slider-result-val" id="slider-saldo">—</dd>
        </dl>
        <dl class="slider-result-row highlight">
          <dt class="slider-result-label">Estimativa</dt>
          <dd class="slider-result-val accent" id="slider-val">—</dd>
        </dl>
        <div class="slider-result-note">Estimativa sem TR · valores reais podem variar</div>
      </div>
      ${temFin ? `
      <div id="slider-fin-aviso" style="padding:10px 20px 14px">
        <div id="slider-fin-bloco" class="slider-fin-bloco"></div>
      </div>` : ''}
    </div>


    <div class="quick-cta-card">
      <div class="quick-cta-title">Quer uma projeção mês a mês?</div>
      <div class="quick-cta-sub">Com a simulação completa você vê todas as parcelas, acompanha pagamentos e acessa a tabela editável.</div>
      <button class="btn btn-primary" onclick="irParaSimulacaoCompleta()">
        📋 Fazer simulação completa →
      </button>
      <button class="btn btn-back" onclick="reiniciarSimulacaoRapida()">
        ← Refazer simulação rápida
      </button>
    </div>

    <p>Darwin é uma ferramenta de cálculo não preditiva. Não nos responsabilizamos se previsões futuras não corresponderem à realidade. As estimativas apresentadas funcionam melhor quando os dados inseridos são mais precisos, mas podem haver variações sutis, uma vez que a instutição financeira é a responsável final pelos valores cobrados.</p>
  `);

  setTimeout(() => atualizaSliderQuick(), 50);
}

// ── SLIDER DO RESULTADO RÁPIDO ──
function atualizaSliderQuick() {
  const slider = document.getElementById('preview-slider');
  if (!slider) return;
  const perc      = parseInt(slider.value);
  const tm        = (parseFloat(formQuick.taxaAnual) / 100) / 12;
  const enc       = parseFloat(formQuick.seguro || 0) + parseFloat(formQuick.taxaAdm || 25);
  const sd        = parseFloat(formQuick.saldoDevedor || 0);
  const percAtual = parseFloat(formQuick.percObra || 1) || 1;

  // Projeta saldo proporcionalmente ao % do slider vs % atual
  const sdProj   = sd * (perc / percAtual);
  const previsto = tm * sdProj + enc; // TR = 0

  const elPerc  = document.getElementById('slider-perc');
  const elVal   = document.getElementById('slider-val');
  const elSaldo = document.getElementById('slider-saldo');
  if (elPerc)  elPerc.textContent  = perc + '%';
  if (elVal)   elVal.innerHTML     = `${fmtBRL(previsto)} <small>(+ TR)</small>`;
  if (elSaldo) elSaldo.textContent = fmtBRL(sdProj);

  slider.style.background = `linear-gradient(to right, var(--accent) ${perc}%, var(--border) ${perc}%)`;

  // Aviso de ultrapassagem da parcela de financiamento (tempo real)
  const bloco = document.getElementById('slider-fin-bloco');
  if (bloco && formQuick.parcelaFinanciamento > 0) {
    const fin   = parseFloat(formQuick.parcelaFinanciamento);
    const diff  = fin - previsto;
    const ultrapassou = diff < 0;
    bloco.className = 'slider-fin-bloco' + (ultrapassou ? ' slider-fin-danger' : '');
    bloco.innerHTML = ultrapassou
      ? `🚨 Parcela de obra ultrapassou o financiamento em <strong>${fmtBRL(Math.abs(diff))}</strong>`
      : `Faltam <strong>${fmtBRL(diff)}</strong> para igualar a parcela de financiamento`;
  }
}

// ── REINICIAR ──
function reiniciarSimulacaoRapida() {
  Object.keys(formQuick).forEach(k => { formQuick[k] = ''; });
  formQuick.percObra = 50;
  currentStep = 0;
  renderQuickStep();
}

// ── CTA: migrar para simulação completa ──
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
