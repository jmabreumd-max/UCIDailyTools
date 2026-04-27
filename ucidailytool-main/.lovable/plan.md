

## Plan: Add Clinical Definitions, Rationale, and Dynamic Interpretations to All Calculators

### Approach

1. **Extend `CalculatorCard` component** to accept two new optional props:
   - `description`: short clinical definition of the parameter and why it's used in ICU
   - `interpretation`: a reactive string/ReactNode for dynamic interpretation of the current result
   - The description will be shown as a collapsible "ℹ️ O que é?" section below the title
   - The interpretation will render below the result as a styled clinical interpretation box

2. **Add a reusable `ClinicalInfo` component** (`src/components/ClinicalInfo.tsx`):
   - Collapsible section with icon, showing definition + "Por que usar?" rationale
   - Keeps cards compact by default, expandable on tap

3. **Add a reusable `Interpretation` component** (`src/components/Interpretation.tsx`):
   - Styled box that shows dynamic clinical interpretation based on calculated value
   - Color-coded border matching status (normal/warning/danger)
   - Text with clinical guidance

4. **Update all 20 calculators** to include:

   | Calculator | Definition (resumo) | Interpretation logic |
   |---|---|---|
   | **PAM** | Perfusão orgânica; alvo >65 em choque | <65: hipoperfusão, vasopressor; 65-100: adequada; >100: considerar reduzir |
   | **Índice Cardíaco** | DC indexado à SC; avalia perfusão | <2.2: baixo DC; 2.2-4.0: normal; >4.0: hiperdinâmico |
   | **P/F** | Oxigenação; classifica SDRA Berlin | >=400 normal, 300-399 leve, 200-299 mod, 100-199 grave, <100 muito grave |
   | **Driving Pressure** | Lesão pulmonar induzida por VM | <=13: protetor; 14-15: limítrofe; >15: risco de VILI |
   | **Complacência** | Distensibilidade pulmonar | <30: pulmão rígido (SDRA, fibrose); 30-50: reduzida; >50: normal |
   | **ROX** | Predição falha de CNAF | <3.85: IOT provável; 3.85-4.88: reavaliar 2h; >4.88: manter |
   | **Tobin (RSBI)** | Predição sucesso desmame VM | <80: favorável; 80-105: incerto; >105: falha provável |
   | **ClCr** | Função renal; ajuste de dose | Estágios DRC: >90 normal, 60-89 leve, 30-59 mod, 15-29 grave, <15 dialítica |
   | **Ânion Gap** | Etiologia acidose metabólica | >12: AG elevado (MUDPILES); <=12: AG normal (hiperclorémica) |
   | **Na⁺ Corrigido** | Na real em hiperglicemia | <135: hiponatremia verdadeira; 135-145: normal; >145: hipernatremia |
   | **Ca²⁺ Corrigido** | Cálcio ajustado à albumina | <8.5: hipocalcemia; 8.5-10.5: normal; >10.5: hipercalcemia |
   | **Osmolaridade** | Estado osmolar; avalia EHH | <275: hipo-osmolar; 275-295: normal; >295: hiper-osmolar |
   | **Déficit HCO₃** | Reposição em acidose metabólica | Interpretação do volume necessário e velocidade de infusão |
   | **Déficit Água Livre** | Correção hipernatremia | Volume e velocidade de correção (max 10-12 mEq/24h) |
   | **GASA** | Etiologia da ascite | >=1.1: portal; <1.1: não-portal |
   | **Correção Na/Glicose** | Na verdadeiro na hiperglicemia | Grau de hiponatremia dilucional |
   | **Fenitoína Corrigida** | Nível real com hipoalbuminemia | <10: subterapêutico; 10-20: terapêutico; >20: tóxico |
   | **Peso Ideal & VC** | Base para VM protetora | VC 6-8 mL/kg IBW; interpretação se adequado |
   | **IMC** | Classificação nutricional | Faixas OMS com orientação |
   | **Nutrição** | Suporte nutricional no crítico | Fase aguda vs estável, calorias propofol |
   | **Drogas em Perfusão** | Doses e faixas terapêuticas | Se dose está dentro/fora da faixa recomendada |

### Implementation Steps

1. **Create `ClinicalInfo` component** - collapsible "ℹ️ Sobre" with `definition` and `rationale` props
2. **Create `Interpretation` component** - dynamic result interpretation box with status styling
3. **Update `CalculatorCard`** - add optional `description` prop, render `ClinicalInfo` below title
4. **Update each calculator** (all 20) - add `description`/`rationale` text and dynamic `interpretation` logic based on computed values

### Technical Details

- `ClinicalInfo`: uses local `useState` for expand/collapse, renders `Info` icon from lucide, text in `text-[11px]`
- `Interpretation`: receives `text` and `status` props, renders bordered box with clinical text
- Each calculator already computes `status` and most have `alerta` -- the interpretation will be more detailed and educational, replacing/complementing existing alerts
- All text in Portuguese (pt-BR) to match existing content

