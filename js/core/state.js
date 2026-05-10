// ── CONSTANTES ──
const MAX_MESES = 48;
const STORAGE_KEY = 'juros_obra_perfis';
const TOTAL_STEPS = 7; // simulação completa: 7 passos (0–6)
const CUPOM_VALIDO = 'DARWIN10';

// ── ESTADO GLOBAL ──
let currentStep = 0;
let currentProfileId = null;
let screen = 'onboarding'; // 'profiles' | 'bifurcacao' | 'onboarding' | 'result' | 'tabela' | 'quick' | 'resultQuick'
let hasUnsavedChanges = false;
let fluxo = 'complete'; // 'quick' | 'complete'

// ── DADOS DO FORMULÁRIO (simulação completa) ──
const form = {
  mesInicial: '', mesEntrega: '',
  valorTotal: '', percFinanciado: 80,
  valorTerreno: '',
  seguro: '', taxaAdm: '',
  taxaAnual: '',
  nomeSimulacao: '',
  historicoPagamentos: []  // [{ valor: Number }] — uma entrada por parcela paga (tela 6)
};

// ── DADOS DO FORMULÁRIO (simulação rápida) ──
const formQuick = {
  seguro:         '',   // R$
  taxaAdm:        '',   // R$
  saldoDevedor:   '',   // R$
  taxaAnual:      '',   // % a.a.
  percObra:       50,   // % — posição do slider / input manual
  ultimaParcela:  '',   // R$ — valor da última parcela paga (tela 5)
  mesParcela:     ''    // YYYY-MM — mês da última parcela paga (tela 5)
};

let meses = [];
