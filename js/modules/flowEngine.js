// ── FLOWENGINE.JS (COM DEBUG) ──
// Motor genérico de navegação de fluxos
// Este arquivo tem logs para ajudar a debugar problemas

let currentFlowArray = null;     // Array de questões do fluxo atual
let currentFlowStep = 0;         // Índice atual no fluxo

console.log('✅ flowEngine.js CARREGADO com sucesso!');

// ────────────────────────────────────────────────────────────────
// INICIALIZAÇÃO DO FLUXO
// ────────────────────────────────────────────────────────────────

function initFlow(flowArray) {
  console.log('🚀 initFlow() chamada com:', flowArray);
  currentFlowArray = flowArray;
  currentFlowStep = 0;
  currentStep = 0; // sincroniza com a variável global
  fluxo = flowArray === FLOW_QUICKSIM ? 'quick' : 'complete';
  console.log('✅ Fluxo inicializado. currentFlowArray:', currentFlowArray);
  console.log('✅ Fluxo tipo:', fluxo);
}

// ────────────────────────────────────────────────────────────────
// RENDERIZAÇÃO DO PASSO ATUAL
// ────────────────────────────────────────────────────────────────

function renderFlowStep() {
  console.log('📖 renderFlowStep() chamada');
  console.log('  currentFlowArray:', currentFlowArray);
  console.log('  currentFlowStep:', currentFlowStep);
  
  if (!currentFlowArray) {
    console.error('❌ flowEngine: Nenhum fluxo inicializado.');
    return;
  }

  const questionKey = getCurrentQuestion(currentFlowArray, currentFlowStep);
  console.log('  Pergunta atual key:', questionKey);
  
  const questionObj = questions[questionKey];
  console.log('  Pergunta objeto:', questionObj);

  if (!questionObj) {
    console.error(`❌ flowEngine: Questão '${questionKey}' não encontrada em questions.js`);
    return;
  }

  // Renderiza o HTML da questão
  const questionHtml = questionObj.render();
  console.log('  HTML da pergunta renderizado');

  // Renderiza o container com a questão + botões de navegação
  const totalSteps = getTotalStepsForFlow(currentFlowArray);
  const isFirst = currentFlowStep === 0;
  const isLast = currentFlowStep === totalSteps - 1;

  console.log(`  Total de steps: ${totalSteps}, É primeiro: ${isFirst}, É último: ${isLast}`);

  const html = `
    ${_renderProgressBar(totalSteps)}
    <div class="step-card">
      <div class="step-num">${_formatStepNumber(currentFlowStep + 1, totalSteps)}</div>
      ${questionHtml}
      <button class="btn btn-primary" onclick="nextFlowStep()">
        ${isLast ? 'Ver resultado →' : 'Continuar →'}
      </button>
      <button class="btn btn-back" onclick="${isFirst ? 'renderBifurcacao()' : 'prevFlowStep()'}">
        ← Voltar
      </button>
    </div>`;

  console.log('  Chamando setHtml()');
  setHtml(html);

  // Inicializa máscaras, callbacks e estado da questão
  if (questionObj.init) {
    console.log('  Inicializando máscaras da pergunta');
    setTimeout(() => questionObj.init(), 80);
  }

  // Ajusta tela
  screen = currentFlowArray === FLOW_QUICKSIM ? 'quick' : 'onboarding';
  console.log('✅ renderFlowStep() completado. screen:', screen);
}

// ────────────────────────────────────────────────────────────────
// NAVEGAÇÃO (próximo/anterior)
// ────────────────────────────────────────────────────────────────

function nextFlowStep() {
  console.log('➡️ nextFlowStep() chamada');
  
  if (!currentFlowArray) {
    console.error('❌ Nenhum fluxo inicializado');
    return;
  }

  const questionKey = getCurrentQuestion(currentFlowArray, currentFlowStep);
  const questionObj = questions[questionKey];

  console.log('  Validando pergunta:', questionKey);
  
  // Valida a resposta
  if (!questionObj.validate()) {
    console.log('  ❌ Validação falhou, não avança');
    return; // Validação falhou, não avança
  }

  console.log('  ✅ Validação passou');

  // Salva os dados
  if (questionObj.save) {
    console.log('  Salvando dados');
    questionObj.save();
  }

  // Avança para próximo passo
  currentFlowStep++;
  currentStep = currentFlowStep; // sincroniza

  const totalSteps = getTotalStepsForFlow(currentFlowArray);

  console.log(`  Avançou para passo ${currentFlowStep} de ${totalSteps}`);

  // Verifica se chegou ao final
  if (currentFlowStep >= totalSteps) {
    console.log('  🏁 Fluxo finalizado, chamando _finalizeFlow()');
    _finalizeFlow();
  } else {
    console.log('  Renderizando próximo passo');
    renderFlowStep();
  }
}

function prevFlowStep() {
  console.log('⬅️ prevFlowStep() chamada');
  
  if (currentFlowStep > 0) {
    currentFlowStep--;
    currentStep = currentFlowStep; // sincroniza
    console.log(`  Voltou para passo ${currentFlowStep}`);
    renderFlowStep();
  } else {
    console.log('  Já está no primeiro passo');
  }
}

// ────────────────────────────────────────────────────────────────
// FINALIZAÇÕES DE FLUXO
// ────────────────────────────────────────────────────────────────

function _finalizeFlow() {
  console.log('🏁 _finalizeFlow() chamada');
  console.log('  currentFlowArray === FLOW_QUICKSIM?', currentFlowArray === FLOW_QUICKSIM);
  console.log('  currentFlowArray === FLOW_FULLSIM?', currentFlowArray === FLOW_FULLSIM);
  
  if (currentFlowArray === FLOW_QUICKSIM) {
    console.log('  Chamando renderResultQuick()');
    renderResultQuick();
  } else if (currentFlowArray === FLOW_FULLSIM) {
    console.log('  Chamando _finalizarOnboarding()');
    _finalizarOnboarding();
  } else {
    console.error('  ❌ Fluxo desconhecido!');
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

console.log('✅ Todas as funções do flowEngine carregadas com sucesso!');