// ── SIMULAÇÃO RÁPIDA ──
// 5 telas: encargos → saldo devedor → taxa de juros → % obra → última parcela
// Resultado simplificado gratuito + CTA para simulação completa

const STEPS_QUICK = [
  {
    num: '01 / 05',
    title: 'Quais os seus encargos mensais?',
    hint: 'Valores cobrados mensalmente pela Caixa, independente do andamento da obra.',
  },
  {
    num: '02 / 05',
    title: 'Qual o seu saldo devedor atual?',
    hint: 'Consulte o extrato do seu financiamento no app Habitação Caixa ou no internet banking da Caixa.',
  },
  {
    num: '03 / 05',
    title: 'Qual a taxa de juros anual do seu financiamento?',
    hint: 'Consta no item 1.4 do seu contrato com a Caixa Econômica Federal.',
  },
  {
    num: '04 / 05',
    title: 'Qual o percentual atual de evolução de obra?',
    hint: 'Consulte o app Habitação Caixa ou o último comunicado da construtora.',
  },
  {
    num: '05 / 05',
    title: 'Quanto você pagou na sua última parcela?',
    hint: 'Valor total debitado, incluindo juros e encargos. Consulte seu extrato bancário.',
  }
];

// ── TR: tenta carregar do JSON histórico; fallback 0,1000% ──
async function _getTRAtual() {
  try {
    const res = await fetch('data/tr-historico.json');
    if (!res.ok) throw new Error('not found');
    const json = await res.json();
    const chaves = Object.keys(json).sort();
    const ultima = chaves[chaves.length - 1];
    return { valor: json[ultima], mes: ultima };
  } catch {
    return { valor: 0.1, mes: null };
  }
}

// ── RENDER PRINCIPAL ──
function renderQuickStep() {
  screen = 'quick';
  const s = STEPS_QUICK[currentStep];
  let inputsHtml = '';

  if (currentStep === 0) {
    inputsHtml = `
      <label class="field-label">1. Seguro</label>
      <div class="input-wrap">
        <span class="pre">R$</span>
        <input type="text" id="qinp-seguro" class="has-pre" placeholder="00,00" inputmode="numeric"
          oninput="maskOnInput(this);this.classList.remove('invalid')">
      </div>
      <div class="field-group">
        <label class="field-label">2. Taxa Administrativa</label>
        <div class="input-wrap">
          <span class="pre">R$</span>
          <input type="text" id="qinp-taxaAdm" class="has-pre" placeholder="25,00" inputmode="numeric"
            oninput="maskOnInput(this)">
        </div>
        <div class="info-box">💡 Taxa de Administração da Caixa: R$ 25,00 fixos. O seguro consta no seu extrato mensal como "Seguro MIP/DFI".</div>
      </div>`;

  } else if (currentStep === 1) {
    inputsHtml = `
      <div class="input-wrap">
        <span class="pre">R$</span>
        <input type="text" id="qinp-saldo" class="has-pre" placeholder="145.000,00" inputmode="numeric"
          oninput="maskOnInput(this);this.classList.remove('invalid')">
      </div>`;

  } else if (currentStep === 2) {
    inputsHtml = `
      <div class="input-wrap">
        <input type="text" id="qinp-taxa" class="has-suf" placeholder="7,0000" inputmode="numeric"
          oninput="maskOnInput(this);this.classList.remove('invalid');_atualizaTaxaQuick()">
        <span class="suf">% a.a.</span>
      </div>
      <div class="diff-box" id="qbox-taxa" style="display:none">
        <div class="d-title">Composição dos juros mensais</div>
        <div class="diff-row"><span class="d-label">Taxa de Juros Mensal</span><span class="d-val" id="qval-taxa-mensal"></span></div>
        <div class="diff-row"><span class="d-label">(+) Taxa Referencial</span><span class="d-val">0,1000%</span></div>
        <hr class="diff-divider">
        <div class="diff-row hl"><span class="d-label">Estimativa de Juros Mensais</span><span class="d-val" id="qval-taxa"></span></div>
      </div>
      <div class="info-box">💡 Consta no item 1.4 do seu contrato com a Caixa Econômica Federal.</div>`;

  } else if (currentStep === 3) {
    const perc = formQuick.percObra ?? 50;
    inputsHtml = `
      <div class="quick-perc-wrap">
        <div class="slider-labels">
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
        <input type="range" id="qinp-slider" class="preview-slider"
          min="0" max="100" step="10" value="${perc}"
          oninput="_syncPercQuick(this.value)">
        <div class="slider-perc-label" id="qslider-perc">${perc}%</div>
        <div class="quick-perc-row">
          <span class="quick-perc-label">Ou digite:</span>
          <div class="input-wrap quick-perc-input-wrap">
            <input type="text" id="qinp-perc" class="has-suf" inputmode="numeric"
              placeholder="50,0" oninput="maskOnInput(this);_syncPercFromInput()">
            <span class="suf">%</span>
          </div>
        </div>
      </div>`;

  } else if (currentStep === 4) {
    inputsHtml = `
      <div class="input-wrap">
        <span class="pre">R$</span>
        <input type="text" id="qinp-ultima" class="has-pre" placeholder="1.283,33" inputmode="numeric"
          oninput="maskOnInput(this);this.classList.remove('invalid')">
      </div>
      <div id="qbox-tr" class="info-box" style="margin-top:8px">
        💡 Carregando TR do mês mais recente…
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
      <button class="btn btn-back" onclick="${isFirst ? 'renderBifurcacao()' : 'prevStepQuick()'}">← Voltar</button>
    </div>`);

  setTimeout(() => {
    if (currentStep === 0) {
      attachMask('qinp-seguro',  'brl', formQuick.seguro  || '');
      attachMask('qinp-taxaAdm', 'brl', formQuick.taxaAdm || 25);
    }
    if (currentStep === 1) {
      attachMask('qinp-saldo', 'brl', formQuick.saldoDevedor || '');
    }
    if (currentStep === 2) {
      attachMask('qinp-taxa', 'perc4', formQuick.taxaAnual || '');
      const el = document.getElementById('qinp-taxa');
      if (el) el.oninput = () => { maskValue(el, 'perc4'); el.classList.remove('invalid'); _atualizaTaxaQuick(); };
      if (formQuick.taxaAnual) _atualizaTaxaQuick();
    }
    if (currentStep === 3) {
      attachMask('qinp-perc', 'perc1', formQuick.percObra ?? 50);
      _syncPercQuick(formQuick.percObra ?? 50);
    }
    if (currentStep === 4) {
      attachMask('qinp-ultima', 'brl', formQuick.ultimaParcela || '');
      _getTRAtual().then(({ valor, mes }) => {
        formQuick._trAtual = valor;
        const el = document.getElementById('qbox-tr');
        if (el) {
          el.textContent = mes
            ? `💡 TR de ${_fmtMesISOQuick(mes)} carregada: ${fmtPerc(valor, 4)} · Será usada no cálculo.`
            : `💡 TR não encontrada — usando 0,1000% como estimativa.`;
        }
      });
    }
    const f = document.querySelector('.step-card input:not([type=range])');
    if (f && currentStep !== 3) f.focus();
  }, 80);
}

function _fmtMesISOQuick(iso) {
  if (!iso) return '';
  return mLabel(parseMS(iso));
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
  const clamped = Math.min(100, Math.max(0, v));
  formQuick.percObra = clamped;
  const slider = document.getElementById('qinp-slider');
  const label  = document.getElementById('qslider-perc');
  if (slider) {
    slider.value = Math.round(clamped / 10) * 10;
    slider.style.background = `linear-gradient(to right, var(--accent) ${clamped}%, var(--border) ${clamped}%)`;
  }
  if (label) label.textContent = clamped + '%';
}

// ── BOX DE TAXA ──
function _atualizaTaxaQuick() {
  const el = document.getElementById('qinp-taxa');
  const ta = maskRead(el) || 0;
  const box         = document.getElementById('qbox-taxa');
  const elMensal    = document.getElementById('qval-taxa-mensal');
  const elCombinada = document.getElementById('qval-taxa');
  if (box) box.style.display = ta > 0 ? 'block' : 'none';
  if (elMensal)    elMensal.textContent    = fmtPerc(ta / 12, 4);
  if (elCombinada) elCombinada.textContent = fmtPerc(ta / 12 + 0.1, 4);
}

// ── NAVEGAÇÃO ──
function nextStepQuick() {
  if (currentStep === 0) {
    const elSeg = document.getElementById('qinp-seguro');
    const s = maskRead(elSeg);
    if (!s || s <= 0) { elSeg?.classList.add('invalid'); showToast('⚠️ Informe o valor do seguro.'); return; }
    formQuick.seguro  = s;
    formQuick.taxaAdm = maskRead(document.getElementById('qinp-taxaAdm')) || 25;

  } else if (currentStep === 1) {
    const el = document.getElementById('qinp-saldo');
    const v  = maskRead(el);
    if (!v || v <= 0) { el?.classList.add('invalid'); showToast('⚠️ Informe o saldo devedor.'); return; }
    formQuick.saldoDevedor = v;

  } else if (currentStep === 2) {
    const el = document.getElementById('qinp-taxa');
    const v  = maskRead(el);
    if (!v || v <= 0) { el?.classList.add('invalid'); showToast('⚠️ Informe a taxa de juros.'); return; }
    formQuick.taxaAnual = v;

  } else if (currentStep === 3) {
    const el = document.getElementById('qinp-perc');
    if (el) {
      const v = maskRead(el);
      if (!isNaN(v)) formQuick.percObra = Math.min(100, Math.max(0, v));
    }

  } else if (currentStep === 4) {
    const el = document.getElementById('qinp-ultima');
    const v  = maskRead(el);
    if (!v || v <= 0) { el?.classList.add('invalid'); showToast('⚠️ Informe o valor da última parcela.'); return; }
    formQuick.ultimaParcela = v;
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
  const tr   = (formQuick._trAtual || 0.1) / 100;
  const enc  = parseFloat(formQuick.seguro || 0) + parseFloat(formQuick.taxaAdm || 25);
  const sd   = parseFloat(formQuick.saldoDevedor || 0);
  const perc = parseFloat(formQuick.percObra || 0);

  const parcelaAtual = (tm + tr) * sd + enc;

  const percProxima = Math.min(perc + 10, 100);
  const sdProxima   = perc > 0 ? sd * (percProxima / perc) : sd * 1.05;
  const parcelaProxima = (tm + tr) * sdProxima + enc;

  return { parcelaAtual, parcelaProxima, percProxima };
}

// ── TELA DE RESULTADO SIMPLIFICADO ──
function renderResultQuick() {
  screen = 'resultQuick';
  const { parcelaAtual, parcelaProxima, percProxima } = _calcQuick();
  const perc    = parseFloat(formQuick.percObra || 0);
  const trUsada = formQuick._trAtual || 0.1;

  setHtml(`
    <div class="result-header">
      <h2>Simulação Rápida</h2>
      <p>Estimativa baseada nos dados informados · <span style="color:var(--accent);font-weight:500">Gratuito</span></p>
    </div>

    <div class="quick-result-cards">
      <div class="quick-result-card accent">
        <div class="qrc-label">Parcela estimada agora</div>
        <div class="qrc-perc">${perc}% de obra · TR ${fmtPerc(trUsada, 4)}</div>
        <div class="qrc-val">${fmtBRL(parcelaAtual)}</div>
        <div class="qrc-note">+ TR Mensal</div>
      </div>
      <div class="quick-result-card">
        <div class="qrc-label">Previsão próxima parcela</div>
        <div class="qrc-perc">estimado em ${percProxima}% de obra</div>
        <div class="qrc-val">${fmtBRL(parcelaProxima)}</div>
        <div class="qrc-note">+ TR Mensal</div>
      </div>
    </div>

    <div class="free-preview-card" style="margin-top:12px">
      <div class="free-preview-header">
        <div class="free-preview-title">Simule outros cenários</div>
        <div class="free-preview-sub">Arraste para ver a estimativa em qualquer % de obra</div>
      </div>
      <div class="slider-wrap">
        <div class="slider-labels">
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
        <input type="range" id="preview-slider" class="preview-slider"
          min="0" max="100" step="10" value="${perc}"
          oninput="atualizaSliderQuick()">
        <div class="slider-perc-label" id="slider-perc">${perc}%</div>
      </div>
      <div class="slider-result">
        <dl class="slider-result-row highlight">
          <dt class="slider-result-label">Parcela estimada</dt>
          <dd class="slider-result-val accent" id="slider-val">—</dd>
        </dl>
        <div class="slider-result-note">Estimativa sem TR · valores reais podem variar</div>
      </div>
    </div>

    <div class="quick-disclaimer">
      ⚠️ Estimativa simplificada. Os valores reais dependem do saldo devedor atualizado, da TR divulgada pelo Banco Central e do percentual exato de evolução de obra.
    </div>

    <div class="quick-cta-card">
      <div class="quick-cta-title">Quer uma projeção mês a mês?</div>
      <div class="quick-cta-sub">Com a simulação completa você vê todas as parcelas, acompanha pagamentos e acessa a tabela editável.</div>
      <button class="btn btn-primary" onclick="irParaSimulacaoCompleta()">
        📋 Fazer simulação completa →
      </button>
      <button class="btn btn-back" onclick="prevStepQuick(); currentStep = STEPS_QUICK.length - 1; renderQuickStep();">
        ← Refazer simulação rápida
      </button>
    </div>
  `);

  setTimeout(() => atualizaSliderQuick(), 50);
}

// Slider da tela de resultado rápido (usa formQuick, não form)
function atualizaSliderQuick() {
  const slider = document.getElementById('preview-slider');
  if (!slider) return;
  const perc      = parseInt(slider.value);
  const tm        = (parseFloat(formQuick.taxaAnual) / 100) / 12;
  const enc       = parseFloat(formQuick.seguro || 0) + parseFloat(formQuick.taxaAdm || 25);
  const sd        = parseFloat(formQuick.saldoDevedor || 0);
  const percAtual = parseFloat(formQuick.percObra || 1) || 1;
  const sdProj    = perc > 0 ? sd * (perc / percAtual) : sd;
  const previsto  = tm * sdProj + enc; // TR zerada no slider

  const elPerc = document.getElementById('slider-perc');
  const elVal  = document.getElementById('slider-val');
  if (elPerc) elPerc.textContent = perc + '%';
  if (elVal)  elVal.innerHTML = `${fmtBRL(previsto)} <small>+ TR Mensal</small>`;
  slider.style.background = `linear-gradient(to right, var(--accent) ${perc}%, var(--border) ${perc}%)`;
}

// ── CTA: migrar para simulação completa ──
function irParaSimulacaoCompleta() {
  // Pré-preenche campos já coletados
  form.seguro    = String(formQuick.seguro   || '');
  form.taxaAdm   = String(formQuick.taxaAdm  || 25);
  form.taxaAnual = String(formQuick.taxaAnual || '');
  // Demais campos ficam em branco para o usuário preencher
  form.mesInicial          = '';
  form.mesEntrega          = '';
  form.valorTotal          = '';
  form.valorTerreno        = '';
  form.percFinanciado      = 80;
  form.nomeSimulacao       = '';
  form.historicoPagamentos = [];
  form.trInicial           = 0.001;

  fluxo = 'complete';
  currentStep = 0;
  screen = 'onboarding';
  renderStep();
}
