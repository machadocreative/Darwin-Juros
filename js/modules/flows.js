// ── FLOWS.JS ──
// Define as sequências de questões para cada fluxo de simulação
// Usado pelo flowEngine.js para gerenciar navegação e renderização
// As strings aqui devem corresponder às chaves do objeto `questions` em questions.js

// Fluxo rápido (5 passos)
const FLOW_QUICKSIM = [
  'financiamentoTotal',      // 01 / 06 — Valor do Financiamento + Saldo Devedor
  'taxaAnual',               // 02 / 06 — Taxa de Juros Anual
  'seguro',                  // 03 / 06 — Seguro + Taxa Administrativa
  'percentualObra',          // 04 / 06 — % de Obra + Mês da Medição (mesMedido renderizado junto)
  'parcelaFinanciamento'     // 05 / 06 — Parcela do Financiamento (opcional)
];

// Fluxo completo (7 passos)
const FLOW_FULLSIM = [
  'mesInicial',              // 01 / 07 — Datas iniciais
  'valorImovel',             // 02 / 07 — Valor Total + % Financiado
  'valorTerreno',            // 03 / 07 — Valor do Terreno
  'taxaAnual',               // 04 / 07 — Taxa de Juros Anual
  'seguro',                  // 05 / 07 — Seguro + Taxa Administrativa
  'historicoP agamentos',    // 06 / 07 — Histórico de Pagamentos (opcional)
  'nomePerfil'               // 07 / 07 — Nome da Simulação
];

// Função auxiliar para obter o total de steps de um fluxo
function getTotalStepsForFlow(flowArray) {
  return flowArray.length;
}

// Função auxiliar para obter a pergunta atual
function getCurrentQuestion(flowArray, stepIndex) {
  return flowArray[stepIndex] || null;
}

// Mapa com labels dos fluxos (para exibição de progresso, se necessário)
const FLOW_LABELS = {
  [JSON.stringify(FLOW_QUICKSIM)]: 'Simulação Rápida',
  [JSON.stringify(FLOW_FULLSIM)]: 'Simulação Detalhada'
};
