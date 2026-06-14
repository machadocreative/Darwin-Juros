// ── FLOWENGINE.JS ──
// Motor genérico de navegação de fluxos (quicksim e simulação completa).

let currentFlowArray = null;     // Array de questões do fluxo atual
let currentFlowStep = 0;         // Índice atual no fluxo

// ────────────────────────────────────────────────────────────────
// INICIALIZAÇÃO DO FLUXO
// ────────────────────────────────────────────────────────────────

function initFlow(flowArray) {
  currentFlowArray = flowArray;
  currentFlowStep = 0;
  currentStep = 0;
  _navFlowDepth = 0; // reinicia contador de profundidade de histórico
  fluxo = flowArray === FLOW_QUICKSIM ? 'quick' : 'complete';
}

// ────────────────────────────────────────────────────────────────
// RENDERIZAÇÃO DO PASSO ATUAL
// ────────────────────────────────────────────────────────────────

function renderFlowStep() {
  if (!currentFlowArray) {
    console.error('flowEngine: nenhum fluxo inicializado.');
    return;
  }

  // Pula passos flagados pela migração QuickSim→FullSim
  if (migrationSkipCheck) {
    while (currentFlowStep < getTotalStepsForFlow(currentFlowArray)) {
      const key = getCurrentQuestion(currentFlowArray, currentFlowStep);
      if (!migrationSkipCheck(key)) break;
      currentFlowStep++;
      currentStep = currentFlowStep;
    }
    if (currentFlowStep >= getTotalStepsForFlow(currentFlowArray)) {
      _finalizeFlow();
      return;
    }
  }

  const questionKey = getCurrentQuestion(currentFlowArray, currentFlowStep);
  const questionObj = questions[questionKey];

  if (!questionObj) {
    console.error(`flowEngine: questão '${questionKey}' não encontrada em questions.js`);
    return;
  }

  // Renderiza o HTML da questão
  const questionHtml = questionObj.render();

  // Renderiza o container com a questão + botões de navegação
  const totalSteps = getTotalStepsForFlow(currentFlowArray);
  const isLast = currentFlowStep === totalSteps - 1;
  const isOptionalLast = isLast && !!questionObj.optional;

  const html = `
    ${_renderProgressBar(totalSteps)}
    <div class="step-card">
      ${questionObj.help ? `<button class="help-btn" onclick="openHelpModal('${questionKey}')">❓</button>` : ''}
      <div class="step-num">${_formatStepNumber(currentFlowStep + 1, totalSteps)}</div>
      ${questionHtml}
      ${isOptionalLast ? `
        <button class="btn btn-primary" id="btn-step-primary">Pular e ver resultados →</button>
      ` : `
        <button class="btn btn-primary" onclick="nextFlowStep()">
          ${isLast ? 'Ver resultado →' : 'Continuar →'}
        </button>
      `}
      <button class="btn btn-back" onclick="history.back()">
        ← Voltar
      </button>
    </div>`;

  setHtml(html);

  // Inicializa máscaras, callbacks e estado da questão
  if (questionObj.init) {
    setTimeout(() => questionObj.init(), 80);
  }

  // Ajusta tela
  screen = currentFlowArray === FLOW_QUICKSIM ? 'quick' : 'onboarding';
  _navPush(screen, { step: currentFlowStep });
}

// ────────────────────────────────────────────────────────────────
// NAVEGAÇÃO (próximo/anterior)
// ────────────────────────────────────────────────────────────────

function nextFlowStep() {
  if (!currentFlowArray) {
    console.error('flowEngine: nenhum fluxo inicializado');
    return;
  }

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

function skipFlowStep() {
  if (!currentFlowArray) return;
  const questionKey = getCurrentQuestion(currentFlowArray, currentFlowStep);
  const questionObj = questions[questionKey];
  if (questionObj.onSkip) questionObj.onSkip();
  currentFlowStep++;
  currentStep = currentFlowStep;
  const totalSteps = getTotalStepsForFlow(currentFlowArray);
  if (currentFlowStep >= totalSteps) {
    _finalizeFlow();
  } else {
    renderFlowStep();
  }
}

function prevFlowStep() {
  if (currentFlowStep > 0) {
    currentFlowStep--;
    currentStep = currentFlowStep;
    // Pula para trás passos migrados (mantém pelo menos o passo 0)
    while (migrationSkipCheck && currentFlowStep > 0) {
      const key = getCurrentQuestion(currentFlowArray, currentFlowStep);
      if (!migrationSkipCheck(key)) break;
      currentFlowStep--;
      currentStep = currentFlowStep;
    }
    // Se o passo 0 também é migrado, o usuário chegou ao limite — aborta a migração
    if (migrationAbort && migrationSkipCheck && currentFlowStep === 0) {
      const key = getCurrentQuestion(currentFlowArray, 0);
      if (migrationSkipCheck(key)) {
        const fn = migrationAbort;
        migrationAbort = null;
        migrationSkipCheck = null;
        fn();
        return;
      }
    }
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
  } else {
    console.error('flowEngine: fluxo desconhecido ao finalizar.');
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
// BIFURCAÇÃO INICIAL
// ────────────────────────────────────────────────────────────────

function renderBifurcacao() {
  screen = 'bifurcacao';
  _navPush('bifurcacao');
  showBottomNav();
  setHtml(`
    <div class="step-card">
      <div class="step-title">O que você precisa agora?</div>
      <div class="step-hint">Escolha o tipo de simulação.</div>
        <button class="btn-bifurc bifurc-quick" onclick="escolherFluxo('quick')">
          <span class="bifurc-icon">⚡</span>
          <div>
            <div class="bifurc-label">Simulação rápida</div>
            <div class="bifurc-sub">Descubra de forma aproximada quais serão suas próximas prestações. Apenas 4 perguntas.</div>
          </div>
        </button>

        <button class="btn-bifurc bifurc-full" onclick="escolherFluxo('onboarding')">
          <span class="bifurc-icon">📋</span>
          <div>
            <div class="bifurc-label">Simulação detalhada</div>
            <div class="bifurc-sub">Recomendado para quem quer ter mais controle de todas as prestações desde o início da obra.</div>
          </div>
        </button>
    </div>
  `);
}

function escolherFluxo(f) {
  novaSimulacao(f === 'quick' ? 'quick' : 'complete');
}
