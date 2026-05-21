// ── FLOWENGINE.JS ──
// Motor genérico de navegação de fluxos
// Elimina duplicação entre quickSim.js e onboarding.js
// Pode ser usado com qualquer fluxo definido em flows.js

let currentFlowArray = null;     // Array de questões do fluxo atual
let currentFlowStep = 0;         // Índice atual no fluxo

// ────────────────────────────────────────────────────────────────
// INICIALIZAÇÃO DO FLUXO
// ────────────────────────────────────────────────────────────────

function initFlow(flowArray) {
  currentFlowArray = flowArray;
  currentFlowStep = 0;
  currentStep = 0; // sincroniza com a variável global
  fluxo = flowArray === FLOW_QUICKSIM ? 'quick' : 'complete';
}

// ────────────────────────────────────────────────────────────────
// RENDERIZAÇÃO DO PASSO ATUAL
// ────────────────────────────────────────────────────────────────

function renderFlowStep() {
  if (!currentFlowArray) {
    console.error('flowEngine: Nenhum fluxo inicializado.');
    return;
  }

  const questionKey = getCurrentQuestion(currentFlowArray, currentFlowStep);
  const questionObj = questions[questionKey];

  if (!questionObj) {
    console.error(`flowEngine: Questão '${questionKey}' não encontrada em questions.js`);
    return;
  }

  // Renderiza o HTML da questão
  const questionHtml = questionObj.render();

  // Renderiza o container com a questão + botões de navegação
  const totalSteps = getTotalStepsForFlow(currentFlowArray);
  const isFirst = currentFlowStep === 0;
  const isLast = currentFlowStep === totalSteps - 1;

  //const html = `


function nextFlowStep() {
  if (!currentFlowArray) return;

  const questionKey = getCurrentQuestion(currentFlowArray, currentFlowStep);
  const questionObj = questions[questionKey];

  // Valida a resposta
  if (!questionObj.validate()) {
    return; // Validação falhou, não avança
  }

  // Salva os dados
  if (questionObj.save) {
    questionObj.save();
  }

  // Avança para próximo passo
  currentFlowStep++;
  currentStep = currentFlowStep; // sincroniza

  const totalSteps = getTotalStepsForFlow(currentFlowArray);

  // Verifica se chegou ao final
  if (currentFlowStep >= totalSteps) {
    _finalizeFlow();
  } else {
    renderFlowStep();
  }
}

function prevFlowStep() {
  if (currentFlowStep > 0) {
    currentFlowStep--;
    currentStep = currentFlowStep; // sincroniza
    renderFlowStep();
  }
}

// ────────────────────────────────────────────────────────────────
// FINALIZAÇÕES DE FLUXO
// ────────────────────────────────────────────────────────────────

function _finalizeFlow() {
  if (currentFlowArray === FLOW_QUICKSIM) {
    renderResultQuick();
  } else if (currentFlowArray === FLOW_FULLSIM) {
    _finalizarOnboarding();
  }
}

// ────────────────────────────────────────────────────────────────
// HELPERS DE RENDERIZAÇÃO
// ────────────────────────────────────────────────────────────────

function _renderProgressBar(totalSteps) {
  const dots = Array.from({ length: totalSteps }, (_, i) => {
    const status = i < currentFlowStep ? 'done' : i === currentFlowStep ? 'active' : '';
    return `<div class="progress-dot ${status}"></div>`;
  }).join('');

  return `<div class="progress-wrap">${dots}</div>`;
}

function _formatStepNumber(current, total) {
  return `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
}

// ────────────────────────────────────────────────────────────────
// NAVEGAÇÃO SEGURA (com lembrete de salvar)
// ────────────────────────────────────────────────────────────────

function goProfilesSafeFlow() {
  if ((screen === 'result' || screen === 'tabela') && hasUnsavedChanges) {
    showSaveReminder(() => { hasUnsavedChanges = false; goProfiles(); });
  } else {
    goProfiles();
  }
}

function novaSimulacaoSafeFlow() {
  if ((screen === 'result' || screen === 'tabela') && hasUnsavedChanges) {
    showSaveReminder(() => { hasUnsavedChanges = false; novaSimulacao(); });
  } else {
    novaSimulacao();
  }
}
}