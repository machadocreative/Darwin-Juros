# 🏗️ Darwin Juros

> **Sua evolução sem surpresas.**  
> Estime e acompanhe as parcelas de juros de evolução de obra mês a mês.

---

## 📋 O Problema

Compradores de imóveis na planta são frequentemente pegos de surpresa com os aumentos progressivos das parcelas de **juros de evolução de obra** — um custo que cresce conforme a construção avança e que não é bem explicado pelas construtoras ou bancos.

O Darwin Juros resolve isso com uma calculadora transparente, de fácil uso, diretamente no celular.

---

## 🧮 A Fórmula

A fórmula oficial da Caixa Econômica Federal usa calcula a evolução de obra usando a Taxa Mensal de Juros, a Taxa Referencial do mês corrente, o Saldo Devedor atual (valor liberado da Caixa Econômica para a Construtora, de acordo com a % de evolução da obra do mês em questão) e por fim, os encargos de cada comprador (Seguro e taxa administrativa).

Chega de papel de caneta ou de planilhas confusas no Excel!

---

## ✨ O que você pode fazer com Darwin:

- **Fluxo de telas inicial** — Você insere os dados necessários referentes ao seu financiamento imobiliário em uma sequência de telas rápidas e bem didáticas. Não demora 5 minutos!
- **Simulador Rápido em slider** — Visualize estimativas sem precisar pagar nada a mais por isso.
- **Não precisa de conexão com a internet** — Instale como app no seu celular uma vez e use offline sempre!
- **Múltiplos perfis** — Salve e gerencie vários imóveis gratuitamente.

A versão premium contará com um preço bastante atrativo, pensado para atender beneficiários de programas habitacionais — como o Minha Casa Minha Vida. Por um valor simbólico, libere as seguintes funcionalidades extras:

- **Tabela de parcelas** (Premium) — Edite % de obra e Taxa Referencial mês a mês
- **Acompanhamento de parcelas pagas** (Premium) — Marque seus pagamentos e veja os totais pagos até o momento (Inclusive no simulador slider!)

---

## 🗂️ Estrutura do Projeto

```
darwin/
│
├── index.html              ← HTML principal (PWA)
├── manifest.json           ← Configuração do PWA
├── style.css               ← Estilos globais
│
├── data/
│    └── tr-histórico.json   ← Série histórica da taxa referencial dos últimos 6 anos
│
└── js/
    ├── main.js             ← Inicialização do app
    │
    ├── core/
    │   ├── state.js        ← Constantes e estado global (form, meses, screen…)
    │   └── storage.js      ← CRUD de perfis no localStorage
    │
    ├── modules/
    │   ├── calculator.js   ← Fórmula dos juros de obra, recálculo, premium
    │   ├── onboarding.js   ← Simulação completa: 7 passos de coleta de dados
    │   ├── quickSim.js     ← Simulação rápida: 7
    │   ├── result.js       ← Telas de resultado, tabela e perfis
    │   └── paywall.js      ← Paywall + validação de cupom
    │
    └── utils/
        ├── format.js       ← Formatação BRL, %, datas e máscaras de input
        └── ui.js           ← Toast, celebração, save reminder, helpers DOM
```

### Ordem de carregamento dos scripts

Os scripts são carregados em ordem no `index.html`, respeitando as dependências:

```
state.js → storage.js → format.js → ui.js
→ calculator.js → onboarding.js → quickSim.js → result.js → paywall.js
→ main.js
```

---

## 🔧 Tech Stack

- Vanilla JavaScript (sem frameworks)
- HTML5 + CSS3
- LocalStorage para persistência
- PWA (manifest + meta tags)
