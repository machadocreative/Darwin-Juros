// ── FLUXO B — 4 perguntas ──
const STEPS_B = [
  {
    num: '01 / 04',
    title: 'Quantas parcelas de juros de obra você já pagou?',
    hint: 'Considere a partir da primeira parcela de evolução de obra, mesmo que tenha sido de 0%. Exemplo: se você pagou Janeiro, Fevereiro e Março, responda 3.',
    field: 'mesesPagos', type: 'number', placeholder: '3', min: 1, step: 1, suffix: 'parcelas', prefix: null
  },
  {
    num: '02 / 04',
    title: 'Qual o percentual atual de evolução de obra?',
    hint: 'Consulte o App Habitação Caixa ou o último comunicado da construtora.',
    field: 'percAtual', type: 'number', placeholder: '35', min: 0, max: 100, step: 0.1, suffix: '%', prefix: null
  },
  {
    num: '03 / 04',
    title: 'Qual o seu saldo devedor atual?',
    hint: 'Consulte o extrato do seu financiamento no app Habitação Caixa ou no internet banking da Caixa.',
    field: 'saldoDevedor', type: 'number', placeholder: '180.000,00', min: 0, step: 100, suffix: null, prefix: 'R$'
  },
  {
    num: '04 / 04',
    title: 'Quanto você pagou na sua última parcela?',
    hint: 'Valor total debitado, incluindo juros e encargos. Consulte seu extrato bancário.',
    field: 'ultimaParcela', type: 'number', placeholder: '1.250,00', min: 0, step: 0.01, suffix: null, prefix: 'R$'
  }
];

function renderFluxoB() {
  const s = STEPS_B[currentStep];
  const val = formB[s.field] || '';
  let inputHtml = '';
  if (s.prefix) {
    inputHtml = `<div class="input-wrap"><span class="pre">${s.prefix}</span><input type="number" id="inp-b" class="has-pre" placeholder="${s.placeholder}" value="${val}" min="${s.min || 0}" step="${s.step || 1}" inputmode="decimal" oninput="this.classList.remove('invalid')"></div>`;
  } else if (s.suffix) {
    inputHtml = `<div class="input-wrap"><input type="number" id="inp-b" class="has-suf" placeholder="${s.placeholder}" value="${val}" min="${s.min || 0}" ${s.max ? `max="${s.max}"` : ''} step="${s.step || 1}" inputmode="decimal" oninput="this.classList.remove('invalid')"><span class="suf">${s.suffix}</span></div>`;
  } else {
    inputHtml = `<input type="number" id="inp-b" placeholder="${s.placeholder}" value="${val}" min="${s.min || 0}" step="${s.step || 1}" inputmode="numeric" oninput="this.classList.remove('invalid')">`;
  }
  setHtml(`
    ${renderProgressB()}
    <div class="step-card">
      <div class="step-num">${s.num}</div>
      <div class="step-title">${s.title}</div>
      <div class="step-hint">${s.hint}</div>
      ${inputHtml}
      <button class="btn btn-primary" onclick="nextStepB()">Continuar →</button>
      ${currentStep > 0 ? '<button class="btn btn-back" onclick="prevStepB()">← Voltar</button>' : '<button class="btn btn-back" onclick="renderBifurcacao()">← Voltar</button>'}
    </div>`);
  setTimeout(() => { const f = document.getElementById('inp-b'); if (f) f.focus(); }, 80);
}

function renderProgressB() {
  return `<div class="progress-wrap">${Array.from({ length: 4 }, (_, i) =>
    `<div class="progress-dot ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}"></div>`
  ).join('')}</div>`;
}

function nextStepB() {
  const el = document.getElementById('inp-b');
  const s = STEPS_B[currentStep];
  const v = parseDecimal(el?.value);
  if (!el?.value || isNaN(v) || v < 0) { el?.classList.add('invalid'); return; }
  if (s.field === 'mesesPagos' && (!Number.isInteger(v) || v < 1)) {
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

  const encPadrao = 25;     // taxa adm padrão
  const trPadrao  = 0.001;  // 0,1000% a.m.

  // inferir taxa mensal: parcela = (tm + TR) * saldo + encargos
  // => tm = (parcela - encargos) / saldo - TR
  const tm = (ultimaParc - encPadrao) / saldo - trPadrao;
  const taxaAnualInferida = Math.max(tm * 12 * 100, 0);

  // inferir mês inicial: hoje - mesesPagos meses
  const hoje = new Date();
  const iniDate = new Date(hoje.getFullYear(), hoje.getMonth() - mesesPagos + 1, 1);
  const mesInicialInferido = `${iniDate.getFullYear()}-${String(iniDate.getMonth()).padStart(2, '0')}`;

  // prazo total estimado: 36 parcelas
  const prazoTotalEstimado = 36;
  const entDate = new Date(iniDate.getFullYear(), iniDate.getMonth() + prazoTotalEstimado - 1, 1);
  const mesEntregaInferido = `${entDate.getFullYear()}-${String(entDate.getMonth() + 1).padStart(2, '0')}`;

  // preencher form com valores inferidos
  form.mesInicial     = mesInicialInferido;
  form.mesEntrega     = mesEntregaInferido;
  form.taxaAnual      = taxaAnualInferida.toFixed(4);
  form.taxaAdm        = String(encPadrao);
  form.seguro         = '';
  form.percFinanciado = 80;
  form.trInicial      = trPadrao;
  form.valorTotal     = (saldo / 0.8).toFixed(2);
  form.valorTerreno   = (saldo * ((100 - percAtual) / 100) * 0.06).toFixed(2);

  window._inferidoB = {
    taxaAnualInferida: taxaAnualInferida.toFixed(4),
    mesInicialInferido, mesEntregaInferido,
    mesesPagos, percAtual, saldo, ultimaParc,
    encPadrao, trPadrao,
    prazoTotalEstimado
  };

  renderConfirmacaoB();
}

function renderConfirmacaoB() {
  const inf = window._inferidoB;
  screen = 'confirmacaoB';
  setHtml(`
    <div class="step-card">
      <div class="step-num" style="color:var(--accent)">✦ Darwin inferiu os seguintes dados</div>
      <div class="step-title">Confira e ajuste se necessário</div>
      <div class="step-hint">Com base nas suas respostas, estimamos os valores abaixo. Edite o que estiver incorreto antes de continuar.</div>

      <div class="diff-box" style="margin-bottom:16px">
        <div class="d-title">Resumo inferido</div>
        <div class="diff-row"><span class="d-label">Meses já pagos</span><span class="d-val">${inf.mesesPagos}</span></div>
        <div class="diff-row"><span class="d-label">% de obra atual</span><span class="d-val">${inf.percAtual}%</span></div>
        <div class="diff-row"><span class="d-label">Saldo devedor</span><span class="d-val">${fmtBRL(inf.saldo)}</span></div>
        <div class="diff-row"><span class="d-label">Última parcela paga</span><span class="d-val">${fmtBRL(inf.ultimaParc)}</span></div>
        <hr class="diff-divider">
        <div class="diff-row hl"><span class="d-label">Taxa de juros anual inferida</span><span class="d-val" id="cb-taxa">${fmtPerc(parseFloat(inf.taxaAnualInferida), 4)}</span></div>
        <div class="diff-row hl"><span class="d-label">Prazo total estimado</span><span class="d-val" id="cb-prazo">${inf.prazoTotalEstimado} meses</span></div>
      </div>

      <div class="info-box" style="margin-bottom:16px">⚠️ Valores aproximados — Taxa Administrativa assumida como R$ 25,00 e TR em 0,1000%. Você poderá ajustar qualquer campo pelo botão ✏️ Editar após ver os resultados.</div>

      <label class="field-label">Ajustar taxa anual (% a.a.)</label>
      <div class="input-wrap" style="margin-bottom:12px">
        <input type="number" id="cb-inp-taxa" class="has-suf" placeholder="${inf.taxaAnualInferida}" value="${inf.taxaAnualInferida}" min="0" step="0.01" inputmode="decimal" oninput="atualizaConfirmacaoB()">
        <span class="suf">% a.a.</span>
      </div>

      <label class="field-label">Ajustar prazo total (meses)</label>
      <div class="input-wrap" style="margin-bottom:4px">
        <input type="number" id="cb-inp-prazo" class="has-suf" placeholder="${inf.prazoTotalEstimado}" value="${inf.prazoTotalEstimado}" min="1" max="${MAX_MESES}" step="1" inputmode="numeric" oninput="atualizaConfirmacaoB()">
        <span class="suf">meses</span>
      </div>

      <label class="field-label" style="margin-top:12px">Nome desta simulação</label>
      <input type="text" id="cb-inp-nome" placeholder="Apto 101" value="${escHtml(form.nomeSimulacao || '')}" maxlength="30" oninput="updateCharCount(this)">
      <div class="char-count" id="char-count">0 / 30</div>

      <button class="btn btn-primary" onclick="confirmarB()">Ver resultados →</button>
      <button class="btn btn-back" onclick="voltarParaFluxoB()">← Voltar</button>
    </div>`);
  setTimeout(() => { const el = document.getElementById('cb-inp-nome'); if (el) updateCharCount(el); }, 50);
}

function atualizaConfirmacaoB() {
  const ta = parseFloat(document.getElementById('cb-inp-taxa')?.value) || 0;
  const pr = parseInt(document.getElementById('cb-inp-prazo')?.value) || 36;
  const elT = document.getElementById('cb-taxa');
  const elP = document.getElementById('cb-prazo');
  if (elT) elT.textContent = fmtPerc(ta, 4);
  if (elP) elP.textContent = pr + ' meses';
  if (window._inferidoB) { window._inferidoB.prazoTotalEstimado = pr; }
}

function voltarParaFluxoB() {
  screen = 'fluxoB'; currentStep = STEPS_B.length - 1; renderFluxoB();
}

function confirmarB() {
  const ta   = parseFloat(document.getElementById('cb-inp-taxa')?.value);
  const pr   = parseInt(document.getElementById('cb-inp-prazo')?.value);
  const nome = sanitizeName(document.getElementById('cb-inp-nome')?.value || '');

  if (!ta || ta <= 0) { document.getElementById('cb-inp-taxa')?.classList.add('invalid'); return; }
  if (!pr || pr < 1)  { document.getElementById('cb-inp-prazo')?.classList.add('invalid'); return; }

  const profiles  = loadProfiles();
  const nomeFinal = nome || 'Apto 101';
  const duplicado = profiles.find(p => p.nome.toLowerCase() === nomeFinal.toLowerCase() && p.id !== currentProfileId);
  if (duplicado) { showToast('⚠️ Já existe um perfil com esse nome. Utilize um nome diferente.'); return; }

  form.taxaAnual     = String(ta);
  form.nomeSimulacao = nomeFinal;

  const inf     = window._inferidoB;
  const iniDate = parseMS(form.mesInicial);
  const entDate = addM(iniDate, pr - 1);
  form.mesEntrega = `${entDate.y}-${String(entDate.m).padStart(2, '0')}`;

  meses = calcTable();

  const mesesPagos      = parseInt(inf.mesesPagos);
  const linhasParaMarcar = Math.min(mesesPagos, meses.length);

  for (let i = 0; i < linhasParaMarcar; i++) {
    if (i === linhasParaMarcar - 1) meses[i].perc = parseFloat(inf.percAtual);
    recalcRow(i);
  }
  aplicaBloqueio();

  screen = 'result';
  hasUnsavedChanges = false;
  renderResult();

  setTimeout(() => { perguntarMarcarPagas(linhasParaMarcar); }, 400);
}

function perguntarMarcarPagas(n) {
  const banner = document.createElement('div');
  banner.id        = 'marcar-pagas-banner';
  banner.className = 'save-reminder';
  banner.innerHTML = `
    <div class="save-reminder-title">📋 Você já pagou ${n} parcela(s)</div>
    <div class="save-reminder-sub">Deseja marcá-las como pagas automaticamente na tabela?</div>
    <div class="save-reminder-actions">
      <button class="save-reminder-save" id="marcar-sim-btn">✓ Marcar como pagas</button>
      <button class="save-reminder-discard" id="marcar-nao-btn">Deixar em branco</button>
    </div>
  `;
  document.body.appendChild(banner);
  document.getElementById('marcar-sim-btn').addEventListener('click', () => {
    for (let i = 0; i < n; i++) { if (meses[i] && !meses[i].bloqueado) meses[i].pago = true; }
    hasUnsavedChanges = true;
    banner.remove();
    refreshTable();
    showToast('✅ ' + n + ' parcela(s) marcada(s) como pagas.');
  });
  document.getElementById('marcar-nao-btn').addEventListener('click', () => { banner.remove(); });
}
