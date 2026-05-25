// ── CONSTANTES ──
const MAX_MESES = 48;
const STORAGE_KEY = 'juros_obra_perfis';
const CUPOM_VALIDO = 'DARWIN10';

// ── ESTADO GLOBAL ──
let currentStep = 0;
let currentProfileId = null;
let screen = 'profiles'; // 'profiles' | 'bifurcacao' | 'onboarding' | 'result' | 'tabela' | 'quick' | 'resultQuick'
let hasUnsavedChanges = false;
let fluxo = 'complete'; // 'quick' | 'complete'
let migrationSkipCheck = null; // fn(questionKey) => bool — set during QuickSim→FullSim migration
let migrationAbort = null;    // fn() — called when user presses Voltar past all migrated steps

// ── DADOS DO FORMULÁRIO (simulação completa) ──
const form = {
  mesInicial: '', mesEntrega: '',
  valorTotal: '', percFinanciado: 80,
  valorTerreno: '',
  seguro: '', taxaAdm: '',
  taxaAnual: '',
  parcelaFinanciamento: null, // R$ — opcional
  nomeSimulacao: '',
  historicoPagamentos: []  // [{ valor: Number }] — uma entrada por parcela paga
};

// ── DADOS DO FORMULÁRIO (simulação rápida) ──
const formQuick = {
  valorTotal:            '',   // R$ — valor total do imóvel (entrada + financiamento)
  totalFinanciado:       '',   // R$ — valor do financiamento (crédito liberado pelo banco)
  saldoAtual:            '',   // R$ — saldo devedor repassado à construtora até o momento
  taxaAnual:             '',   // % a.a.
  seguro:                '',   // R$
  taxaAdm:               '',   // R$
  percObra:              50,   // % — evolução de obra informada/calculada
  mesMedido:             '',   // YYYY-MM — mês de referência da medição
  parcelaFinanciamento:  null  // R$ — opcional, para comparação no resultado
};

let meses = [];
