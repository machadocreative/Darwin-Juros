// ── FLUXO B — 4 perguntas ──
// Máscaras: mesesPagos=int, percAtual=perc1, saldoDevedor=brl, ultimaParcela=brl
const STEPS_B = [
  {
    num: '01 / 04',
    title: 'Quantas parcelas de juros de obra você já pagou?',
    hint: 'Considere a partir da primeira parcela de evolução de obra, mesmo que tenha sido de 0%. Exemplo: se você pagou Janeiro, Fevereiro e Março, responda 3.',
    field: 'mesesPagos', mask: 'int', placeholder: '17', suffix: 'parcelas', prefix: null
  },
  {
    num: '02 / 04',
    title: 'Qual o percentual atual de evolução de obra?',
    hint: 'Consulte o App Habitação Caixa ou o último comunicado da construtora.',
    field: 'percAtual', mask: 'perc1', placeholder: '50,0', suffix: '%', prefix: null
  },
  {
    num: '03 / 04',
    title: 'Qual o seu saldo devedor atual?',
    hint: 'Consulte o extrato do seu financiamento no app Habitação Caixa ou no internet banking da Caixa.',
    field: 'saldoDevedor', mask: 'brl', placeholder: '145.000,00', suffix: null, prefix: 'R$'
  },
  {
    num: '04 / 04',
    title: 'Quanto você pagou na sua última parcela?',
    hint: 'Valor total debitado, incluindo juros e encargos. Consulte seu extrato bancário.',
    field: 'ultimaParcela', mask: 'brl', placeholder: '1.283,33', suffix: null, prefix: 'R$'
  }
];

function renderFluxoB() {
  const s = STEPS_B[currentStep];
  let inputHtml = '';
  if (s.prefix) {
    inputHtml = `<div class="input-wrap"><span class="pre">${s.prefix}</span><input type="text" id="inp-b" class="has-pre" placeholder="${s.placeholder}" inputmode="numeric" oninput="maskOnInput(this);this.classList.remove('invalid')"></div>`;
  } else if (s.suffix) {
    inputHtml = `<div class="input-wrap"><input type="text" id="inp-b" class="has-suf" placeholder="${s.placeholder}" inputmode="numeric" oninput="maskOnInput(this);this.classList.remove('invalid')"><span class="suf">${s.suffix}</span></div>`;
  }

  setHtml(`
    ${renderProgressB()}
    <div class="step-card">
      <div class="step-num">${s.num}</div>
      <div class="step-title">${s.title}</div>
      <div class="step-hint">${s.hint}</div>
      ${inputHtml}
      <button class="btn btn-primary" onclick="nextStepB()">Continuar →</button>
      ${currentStep > 0
        ? '<button class="btn btn-back" onclick="prevStepB()">← Voltar</button>'
        : '<button class="btn btn-back" onclick="renderBifurcacao()">← Voltar</button>'}
    </div>`);

  // Aplica máscara e restaura valor já digitado
  setTimeout(() => {
    const el = document.getElementById('inp-b');
    if (!el) return;
    const saved = formB[s.field];
    maskInit(el, s.mask, saved !== '' ? saved : null);
    el.focus();
  }, 80);
}

function renderProgressB() {
  return `<div class="progress-wrap">${Array.from({ length: 4 }, (_, i) =>
    `<div class="progress-dot ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}"></div>`
  ).join('')}</div>`;
}

function nextStepB() {
  const el = document.getElementById('inp-b');
  const s  = STEPS_B[currentStep];
  const v  = maskRead(el);

  if (isNaN(v) || v <= 0) { el?.classList.add('invalid'); return; }
  if (s.mask === 'int' && !Number.isInteger(v)) {
    el.classList.add('invalid');
    showToast('⚠️ Informe um número inteiro maior que zero.');
    return;
  }

  formB[s.field] = v;
  if (currentStep < STEPS_B.length - 1) { currentStep++; renderFluxoB(); }
  else { inferirDadosB(); }
}

function prevStepB() {
  if (currentStep > 0) { currentStep--; renderFluxoB(); }
}

// ── INFERÊNCIA DOS DADOS (Fluxo B) ──
function inferirDadosB() {
  const mesesPagos = parseInt(formB.mesesPagos);
  const percAtual  = parseFloat(formB.percAtual);
  const saldo      = parseFloat(formB.saldoDevedor);
  const ultimaParc = parseFloat(formB.ultimaParcela);

  // TR zerada na inferência — usuário pode ajustar na confirmação
  const trUsada   = 0;
  const encPadrao = 25;

  // Fórmula: parcela = (tm + TR) × saldo + encargos
  // => tm = (parcela − encargos) / saldo − TR
  const tm = (ultimaParc - encPadrao) / saldo - trUsada;
  const taxaAnualInferida = Math.max(tm * 12 * 100, 0);

  // Mês inicial: mês atual − (mesesPagos − 1)
  // Ex: maio/2026, 17 pagas → início = janeiro/2025
  const hoje    = new Date();
  const iniDate = new Date(hoje.getFullYear(), hoje.getMonth() - (mesesPagos - 1), 1);
  const mesInicialInferido = `${iniDate.getFullYear()}-${String(iniDate.getMonth() + 1).padStart(2, '0')}`;

  window._inferidoB = {
    taxaAnualInferida: taxaAnualInferida.toFixed(4),
    mesInicialInferido,
    mesesPagos, percAtual, saldo, ultimaParc,
    encPadrao, trUsada,
    prazoTotalEstimado: 36
  };

  renderConfirmacaoB();
}

// ── TELA DE CONFIRMAÇÃO — todos os campos editáveis ──
function renderConfirmacaoB() {
  const inf = window._inferidoB;
  screen = 'confirmacaoB';

  setHtml(`
    <div class="step-card">
      <div class="step-num" style="color:var(--accent)">✦ Darwin calculou os seguintes dados</div>
      <div class="step-title">Confira e complete as informações</div>
      <div class="step-hint">Preencha os campos obrigatórios (<span class="field-required">*</span>) e ajuste o que estiver incorreto.</div>

      <div class="diff-box" style="margin-bottom:16px">
        <div class="d-title">O que você informou</div>
        <div class="diff-row"><span class="d-label">Meses já pagos</span><span class="d-val">${inf.mesesPagos}</span></div>
        <div class="diff-row"><span class="d-label">% de obra atual</span><span class="d-val">${inf.percAtual}%</span></div>
        <div class="diff-row"><span class="d-label">Saldo devedor</span><span class="d-val">${fmtBRL(inf.saldo)}</span></div>
        <div class="diff-row"><span class="d-label">Última parcela paga</span><span class="d-val">${fmtBRL(inf.ultimaParc)}</span></div>
      </div>

      <label class="field-label">Mês inicial das parcelas <span class="field-required">*</span></label>
      <input type="month" id="cb-mes-inicial" value="${inf.mesInicialInferido}" oninput="this.classList.remove('invalid')">

      <label class="field-label" style="margin-top:12px">Taxa de juros anual (inferida) <span class="field-required">*</span></label>
      <div class="input-wrap">
        <input type="text" id="cb-inp-taxa" class="has-suf" placeholder="${inf.taxaAnualInferida}" inputmode="numeric" oninput="maskOnInput(this);this.classList.remove('invalid')">
        <span class="suf">% a.a.</span>
      </div>

      <label class="field-label" style="margin-top:12px">Valor total do imóvel <span class="field-required">*</span></label>
      <div class="input-wrap">
        <span class="pre">R$</span>
        <input type="text" id="cb-inp-valor-total" class="has-pre" placeholder="300.000,00" inputmode="numeric" oninput="maskOnInput(this);this.classList.remove('invalid')">
      </div>

      <label class="field-label" style="margin-top:12px">Valor do terreno <span class="field-required">*</span></label>
      <div class="input-wrap">
        <span class="pre">R$</span>
        <input type="text" id="cb-inp-terreno" class="has-pre" placeholder="10.000,00" inputmode="numeric" oninput="maskOnInput(this);this.classList.remove('invalid')">
      </div>
      <div class="info-box" style="margin-top:6px;margin-bottom:12px">💡 Consta no item 1.7 do seu contrato com a Caixa.</div>

      <label class="field-label">Seguro mensal <span class="field-required">*</span></label>
      <div class="input-wrap">
        <span class="pre">R$</span>
        <input type="text" id="cb-inp-seguro" class="has-pre" placeholder="00,00" inputmode="numeric" oninput="maskOnInput(this);this.classList.remove('invalid')">
      </div>

      <label class="field-label" style="margin-top:12px">Taxa Administrativa</label>
      <div class="input-wrap">
        <span class="pre">R$</span>
        <input type="text" id="cb-inp-taxaAdm" class="has-pre" placeholder="25,00" inputmode="numeric" oninput="maskOnInput(this)">
      </div>

      <label class="field-label" style="margin-top:12px">Prazo total da obra (meses) <span class="field-required">*</span></label>
      <div class="input-wrap">
        <input type="text" id="cb-inp-prazo" class="has-suf" placeholder="${inf.prazoTotalEstimado}" inputmode="numeric" oninput="maskOnInput(this);this.classList.remove('invalid')">
        <span class="suf">meses</span>
      </div>

      <label class="field-label" style="margin-top:12px">Percentual financiado</label>
      <div class="input-wrap">
        <input type="text" id="cb-inp-perc-fin" class="has-suf" placeholder="80,0" inputmode="numeric" oninput="maskOnInput(this)">
        <span class="suf">%</span>
      </div>

      <label class="field-label" style="margin-top:12px">Taxa Referencial (TR) inicial</label>
      <div class="input-wrap">
        <input type="text" id="cb-inp-tr" class="has-suf" placeholder="0,0000" inputmode="numeric" oninput="maskOnInput(this)">
        <span class="suf">% a.m.</span>
      </div>
      <div class="info-box" style="margin-top:6px;margin-bottom:12px">💡 TR zerada por padrão. Você poderá editar mês a mês na tabela de parcelas.</div>

      <label class="field-label">Nome desta simulação</label>
      <input type="text" id="cb-inp-nome" placeholder="Apto 101" value="${escHtml(form.nomeSimulacao || '')}" maxlength="30" oninput="updateCharCount(this)">
      <div class="char-count" id="char-count">0 / 30</div>

      <button class="btn btn-primary" onclick="confirmarB()" style="margin-top:16px">Ver resultados →</button>
      <button class="btn btn-back" onclick="voltarParaFluxoB()">← Voltar</button>
    </div>`);

  setTimeout(() => {
    attachMask('cb-inp-taxa',        'perc4', inf.taxaAnualInferida);
    attachMask('cb-inp-valor-total', 'brl',   '');
    attachMask('cb-inp-terreno',     'brl',   '');
    attachMask('cb-inp-seguro',      'brl',   '');
    attachMask('cb-inp-taxaAdm',     'brl',   inf.encPadrao);
    attachMask('cb-inp-prazo',       'int',   inf.prazoTotalEstimado);
    attachMask('cb-inp-perc-fin',    'perc1', 80);
    attachMask('cb-inp-tr',          'perc4', 0);
    const elNome = document.getElementById('cb-inp-nome');
    if (elNome) updateCharCount(elNome);
  }, 80);
}

function voltarParaFluxoB() {
  screen = 'fluxoB'; currentStep = STEPS_B.length - 1; renderFluxoB();
}

function confirmarB() {
  const elMesIni  = document.getElementById('cb-mes-inicial');
  const elTaxa    = document.getElementById('cb-inp-taxa');
  const elVT      = document.getElementById('cb-inp-valor-total');
  const elTer     = document.getElementById('cb-inp-terreno');
  const elSeg     = document.getElementById('cb-inp-seguro');
  const elAdm     = document.getElementById('cb-inp-taxaAdm');
  const elPrazo   = document.getElementById('cb-inp-prazo');
  const elPercFin = document.getElementById('cb-inp-perc-fin');
  const elTR      = document.getElementById('cb-inp-tr');
  const elNome    = document.getElementById('cb-inp-nome');

  const mesIni  = elMesIni?.value;
  const ta      = maskRead(elTaxa);
  const vt      = maskRead(elVT);
  const ter     = maskRead(elTer);
  const seg     = maskRead(elSeg);
  const adm     = maskRead(elAdm) || 25;
  const prazo   = maskRead(elPrazo);
  const percFin = maskRead(elPercFin) || 80;
  const trVal   = maskRead(elTR) || 0;   // em %, ex: 0.1 → depois divide por 100
  const nome    = sanitizeName(elNome?.value || '');

  // Validações
  let valido = true;
  if (!mesIni)             { elMesIni?.classList.add('invalid');  valido = false; }
  if (!ta || ta <= 0)      { elTaxa?.classList.add('invalid');    valido = false; }
  if (!vt || vt <= 0)      { elVT?.classList.add('invalid');      valido = false; }
  if (!ter || ter <= 0)    { elTer?.classList.add('invalid');     valido = false; }
  if (!seg || seg <= 0)    { elSeg?.classList.add('invalid');     valido = false; }
  if (!prazo || prazo < 1) { elPrazo?.classList.add('invalid');   valido = false; }

  if (valido) {
    const fin = vt * (percFin / 100);
    if (ter >= fin) {
      elTer?.classList.add('invalid');
      showToast('⚠️ Valor do terreno deve ser menor que o total financiado (' + fmtBRL(fin) + ').');
      valido = false;
    }
  }

  if (!valido) { showToast('⚠️ Preencha todos os campos obrigatórios.'); return; }

  const nomeFinal = nome || 'Apto 101';
  const duplicado = loadProfiles().find(p => p.nome.toLowerCase() === nomeFinal.toLowerCase() && p.id !== currentProfileId);
  if (duplicado) { showToast('⚠️ Já existe um perfil com esse nome. Utilize um nome diferente.'); return; }

  // Calcula mês de entrega: mês inicial + prazo − 1
  const iniParsed  = parseMS(mesIni);
  const entDate    = addM(iniParsed, prazo - 1);
  const mesEntrega = `${entDate.y}-${String(entDate.m).padStart(2, '0')}`;

  // Preenche o form global com todos os valores confirmados
  form.mesInicial     = mesIni;
  form.mesEntrega     = mesEntrega;
  form.taxaAnual      = String(ta);
  form.valorTotal     = String(vt);
  form.valorTerreno   = String(ter);
  form.seguro         = String(seg);
  form.taxaAdm        = String(adm);
  form.percFinanciado = percFin;
  form.trInicial      = trVal / 100;   // converte % → decimal (0,1% → 0,001)
  form.nomeSimulacao  = nomeFinal;

  meses = calcTable();

  const inf             = window._inferidoB;
  const mesesPagos      = parseInt(inf.mesesPagos);
  const linhasParaMarcar = Math.min(mesesPagos, meses.length);

  // Marca a última linha paga com o % de obra informado
  for (let i = 0; i < linhasParaMarcar; i++) {
    if (i === linhasParaMarcar - 1) meses[i].perc = parseFloat(inf.percAtual);
    recalcRow(i);
  }
  aplicaBloqueio();

  screen = 'result';
  hasUnsavedChanges = false;
  renderResult();
  // O banner de "marcar pagas" é renderizado inline por renderResult()
  // via _buildBannerPagas(), que detecta automaticamente parcelas pendentes.
}
