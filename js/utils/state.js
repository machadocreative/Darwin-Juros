// ── CONSTANTES ──
const MAX_MESES = 48;
const STORAGE_KEY = 'juros_obra_perfis';
const TOTAL_STEPS = 7;
const CUPOM_VALIDO = 'DARWIN10';

// ── ESTADO GLOBAL ──
let currentStep = 0;
let currentProfileId = null;
let screen = 'onboarding'; // 'profiles' | 'onboarding' | 'result' | 'tabela' | 'bifurcacao' | 'fluxoB' | 'confirmacaoB'
let hasUnsavedChanges = false;
let fluxo = 'A'; // 'A' | 'B'

// ── DADOS DO FORMULÁRIO ──
const form = {
  mesInicial: '', valorTotal: '', percFinanciado: 80,
  valorTerreno: '', seguro: '', taxaAdm: '',
  taxaAnual: '', trInicial: 0.001, mesEntrega: '',
  nomeSimulacao: ''
};

// Dados brutos coletados no fluxo B
const formB = {
  mesesPagos: '',     // inteiro — quantos meses já pagou
  percAtual: '',      // % de obra atual
  saldoDevedor: '',   // R$ saldo devedor atual
  ultimaParcela: ''   // R$ valor da última parcela paga
};

let meses = [];
