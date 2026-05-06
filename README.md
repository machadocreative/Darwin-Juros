# 🏗️ Darwin Juros

> **Sua evolução sem surpresas.**  
> Estime e acompanhe as parcelas de juros de evolução de obra mês a mês.

---

## 📋 O Problema

Compradores de imóveis na planta são frequentemente pegos de surpresa com os aumentos progressivos das parcelas de **juros de evolução de obra** — um custo que cresce conforme a construção avança e que não é bem explicado pelas construtoras ou bancos.

O Darwin Juros resolve isso com uma calculadora transparente, de fácil uso, diretamente no celular.

---

## ✨ Funcionalidades

- **Fluxo A** — Para quem ainda não começou a pagar: insere os dados do contrato e obtém a projeção completa de parcelas
- **Fluxo B** — Para quem já está pagando: infere os dados automaticamente a partir das últimas parcelas
- **Tabela de parcelas** (Premium) — Edite % de obra e Taxa Referencial mês a mês
- **Simulador slider** (Free) — Visualize estimativas sem precisar da tabela completa
- **Múltiplos perfis** — Salve e gerencie vários imóveis
- **Acompanhamento de pagamentos** — Marque parcelas como pagas e veja o total já pago
- **PWA** — Funciona offline e pode ser instalado como app no celular

---

## 🗂️ Estrutura do Projeto

```
darwin/
│
├── index.html              ← HTML principal (PWA)
├── manifest.json           ← Configuração do PWA
├── style.css               ← Estilos globais
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
    │   ├── onboarding.js   ← Fluxo A: 7 passos de coleta de dados
    │   ├── fluxoB.js       ← Fluxo B: 4 perguntas + inferência automática
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
→ calculator.js → onboarding.js → fluxoB.js → result.js → paywall.js
→ main.js
```

---

## 🧮 A Fórmula

```
Parcela = (Taxa Mensal + TR) × Saldo Devedor + Encargos
```

Onde:
- **Taxa Mensal** = Taxa Anual / 12
- **TR** = Taxa Referencial do mês (divulgada pelo Banco Central)
- **Saldo Devedor** = Terreno + (Financiado − Terreno) × (% Obra / 100)
- **Encargos** = Seguro + Taxa Administrativa

---

## 🚀 Como Rodar Localmente

Basta servir os arquivos estáticos. Com Python:

```bash
python3 -m http.server 8080
```

Ou com Node.js (npx):

```bash
npx serve .
```

Acesse `http://localhost:8080`.

---

## 🔧 Tech Stack

- Vanilla JavaScript (sem frameworks)
- HTML5 + CSS3
- LocalStorage para persistência
- PWA (manifest + meta tags)

---

## 📄 Licença

MIT © Darwin Juros
