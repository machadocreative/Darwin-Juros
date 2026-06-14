# 🧮 Núcleo de Cálculo — Darwin Juros

Documentação das fórmulas de cálculo de juros de evolução de obra usadas no app.
Fonte no código: [calculator.js](js/modules/calculator.js), [quickSim.js](js/modules/quickSim.js),
[main.js](js/main.js) (`getTRParaMes`).

---

## 1. Variáveis e unidades

| Símbolo | No código | O que é | Unidade |
|---|---|---|---|
| `fin` | `valorFinanciado` | Valor financiado (crédito do banco) | R$ |
| `ter` | `valorTerreno` | Valor do terreno (saldo devedor inicial) | R$ |
| `enc` | `seguro + taxaAdm` | Encargos mensais fixos | R$ |
| `tm`  | `taxaAnual / 100 / 12` | Juros mensais | decimal (ex.: 0,004167) |
| `tr`  | `getTRParaMes(mês) / 100` | Taxa Referencial do mês | decimal (ex.: 0,001687) |
| `perc`| `% de obra` | Evolução da obra | % (0 a 100) |
| `saldo` | `saldo devedor` | Base sobre a qual incidem juros + TR | R$ |

> **Juros mensais = anual ÷ 12** (divisão simples, *não* composta). O app é
> consistente nisso: a tela [Histórico da TR](js/modules/trhistorico.js) também
> mostra `anual / 12`.

---

## 2. Fórmula da parcela (completa)

```
valor previsto da parcela = (juros mensais + TR mensal) × saldo devedor + encargos
previsto = (tm + tr) × saldo + enc
```

### Saldo devedor (simulação completa)
O saldo **escala com a % de obra** — esta é a parte que faltava na descrição
original:

```
saldo devedor = terreno + (financiamento − terreno) × (% obra / 100)
saldo = ter + (fin − ter) × (perc / 100)
```

- Com `perc = 0%` → `saldo = ter` (só o terreno).
- Com `perc = 100%` → `saldo = fin` (financiamento total liberado).
- `(fin − ter)` é o **saldo máximo** repassado à construtora (`sMax`).

### % de obra (simulação completa)
Distribuída **linearmente** ao longo das parcelas:

```
perc(i) = (i / (totalParcelas − 1)) × 100,  arredondado a 1 casa decimal
```

⚠️ Esse arredondamento a 1 casa é um dos pontos de divergência com o Excel — ver §7.

---

## 3. Decomposição: valor base vs. correção (TR)

A parcela é exibida decomposta em duas partes (tela premium e quicksim):

```
valor base   = (juros mensais + 0) × saldo + encargos = tm × saldo + enc
correção (TR) = (0 + TR mensal) × saldo + 0           = tr × saldo
parcela total = valor base + correção
```

Confere algebricamente: `tm·saldo + enc + tr·saldo = (tm + tr)·saldo + enc`. ✅

- O **valor base** é o que aparece nos sliders (TR sempre = 0 nos sliders).
- A **correção em R$** é `tr × saldo` (sem encargos) — é quanto a TR adiciona.

---

## 4. Timing: a parcela vence no mês seguinte (mês + 1)

A medição da obra de um mês **M** gera a parcela que **vence em M + 1**.

- Premium: `ymVence = mêsInicial + (índice da última paga) + 1` — o card mostra
  "Sua Parcela atual · Vence em [M+1]", mas o cálculo usa o saldo e a TR do mês
  **M** (mês medido).
- QuickSim: `addM(mesMedido, 1)` = mês medido + 1.

> Convenção do app: a TR aplicada é a do **mês da medição (M)**, não a de M+1.
> A tela mostra essa referência de forma transparente ("TR x% · [mês M]").

---

## 5. Simulação rápida (QuickSim) — adaptação

A quicksim **não coleta o terreno**. Diferenças em relação à completa:

| | Simulação completa | QuickSim |
|---|---|---|
| **Saldo devedor** | calculado: `ter + (fin−ter)·perc/100` | **informado direto** pelo usuário (`saldoAtual`) |
| **% de obra** | dirige o saldo (linear) | **estimada** a partir do saldo: `saldoAtual / financiamento × 100` |
| **Terreno** | usado | ignorado (denominador é só o `financiamento`) |

Fórmula da parcela na quicksim (mesma estrutura):
```
parcela = (tm + tr) × saldoAtual + enc          // _calcTotalParcelaAtual
correção = tr × saldoAtual                        // _calcTRParcela
```

> Correção da descrição original: na quicksim **não** existe um "saldo = terreno +
> financiamento". O saldo é o `saldoAtual` digitado; o "teto do financiamento" é
> usado apenas como **denominador da % de obra estimada**.

---

## 6. Taxa Referencial (TR)

- Série histórica em [data/tr-historico.json](data/tr-historico.json), carregada
  uma vez na inicialização (`window._trHistorico`).
- Armazenada como **percentual** (ex.: `0.1687` = 0,1687%).
- `getTRParaMes(mês)` divide por 100 → decimal, para multiplicar pelo saldo.
- **Mês futuro / ausente / JSON não carregado → TR = 0.** Ou seja, parcelas
  futuras são estimadas só com o "valor base" (sem correção monetária).
- A tela de TR mantém o valor em **%** (não divide por 100) — cada consumidor
  trata a unidade no seu contexto.

---

## 7. Arredondamento e a diferença vs. Excel

**É solucionável em JavaScript.** O JS usa ponto flutuante IEEE-754 de 64 bits —
o mesmo do Excel. Mesma fórmula + mesmos pontos de arredondamento ⇒ mesmo
resultado. As diferenças de centavos vêm de **onde** cada um arredonda:

1. **% de obra arredondada a 1 casa decimal** (`toFixed(1)` em `calcTable`).
   Como o saldo depende da %, arredondar `18,5185…%` para `18,5%` desloca o saldo
   em alguns reais e a parcela em alguns centavos. **Suspeito principal.**
2. **Valores monetários intermediários sem arredondamento.** O app carrega
   `saldo` e `previsto` em precisão total e só arredonda para 2 casas na
   **exibição** (`fmtBRL`). Se a planilha aplica `ARRED()` (ROUND) a cada célula,
   os resultados divergem por centavos.
3. **Taxa mensal exibida com 4 casas, mas calculada com precisão total.** Se no
   Excel você digita a taxa mensal arredondada que vê na tela (ex.: `0,4167%`),
   diverge do `tm` de precisão total usado no cálculo.

> **Não é** diferença de juros simples vs. compostos — essa daria diferença
> grande, não centavos. Ambos usam `anual / 12`.

### Decisão (2026-06-13): o APP é a fonte da verdade
Diagnóstico concluído contra a planilha: a diferença de 1 centavo vinha **só** do
suspeito nº 3 — a **taxa mensal de juros**. A planilha usava a taxa arredondada a
4 casas (`0,5140% a.m.`), enquanto o app usa precisão total (`0,51397500% a.m.`).
`%` e `saldo` já batem exatamente entre os dois.

Optou-se por **manter o app em precisão total** (sem arredondar a taxa) e ajustar
a planilha para segui-lo. Portanto **o cálculo do app NÃO foi alterado**.

Para a planilha bater com o app, a taxa mensal de juros deve ser **full precision**
(não arredondar a 4 casas):
```
juros mensal = taxa anual / 12        (ex.: 6,1677% / 12 = 0,51397500%  — NÃO 0,5140%)
previsão     = (juros mensal + TR mensal) × saldo devedor + encargos    (sem ARRED na taxa)
```
Só o valor final em R$ é arredondado a 2 casas (formato de moeda) — isso já é igual
nos dois lados.

> Observação: como o banco/contrato usa a taxa arredondada a 4 casas, a previsão do
> app (precisão total) tende a ficar ~1 centavo **abaixo** da cobrança real. É uma
> escolha consciente de manter o app como referência matemática.

---

## 8. Outras regras

- **Encargos:** `taxaAdm` default R$ 25 só quando nunca preenchido (0 explícito é
  respeitado); `seguro` vazio = 0 (opcional).
- **Bloqueio:** a partir da primeira parcela com `perc ≥ 100%`, as seguintes são
  marcadas `bloqueado` (não entram no cálculo ativo).
- **Limite:** `MAX_MESES` parcelas.
