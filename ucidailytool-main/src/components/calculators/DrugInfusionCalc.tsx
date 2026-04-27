import { useState, useMemo } from "react";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Syringe } from "lucide-react";

interface DrugConfig {
  name: string;
  concentrations: { label: string; mgPerMl: number }[];
  doseUnit: string;
  doseRange: string;
  factor: number;
}

const DRUGS: DrugConfig[] = [
  {
    name: "Noradrenalina",
    concentrations: [
      { label: "4mg/4mL (1mg/mL) em 250mL", mgPerMl: 4 / 254 },
      { label: "8mg/4mL em 250mL", mgPerMl: 8 / 254 },
      { label: "16mg/4mL em 250mL", mgPerMl: 16 / 254 },
    ],
    doseUnit: "mcg/kg/min",
    doseRange: "0.05–1.0",
    factor: 1000,
  },
  {
    name: "Dobutamina",
    concentrations: [
      { label: "250mg em 230mL SG5%", mgPerMl: 250 / 250 },
    ],
    doseUnit: "mcg/kg/min",
    doseRange: "2.5–20",
    factor: 1000,
  },
  {
    name: "Nitroprussiato",
    concentrations: [
      { label: "50mg em 250mL SG5%", mgPerMl: 50 / 250 },
    ],
    doseUnit: "mcg/kg/min",
    doseRange: "0.5–10",
    factor: 1000,
  },
  {
    name: "Nitroglicerina",
    concentrations: [
      { label: "50mg em 250mL SG5%", mgPerMl: 50 / 250 },
    ],
    doseUnit: "mcg/min",
    doseRange: "5–200",
    factor: 1000,
  },
  {
    name: "Midazolam",
    concentrations: [
      { label: "150mg em 120mL SF (puro)", mgPerMl: 150 / 120 },
      { label: "50mg em 100mL SF", mgPerMl: 50 / 100 },
    ],
    doseUnit: "mg/h",
    doseRange: "1–20",
    factor: 1,
  },
  {
    name: "Fentanil",
    concentrations: [
      { label: "2500mcg (50mL) puro", mgPerMl: 0.05 },
      { label: "2500mcg em 250mL SF", mgPerMl: 2.5 / 250 },
    ],
    doseUnit: "mcg/h",
    doseRange: "25–200",
    factor: 1000,
  },
];

const DRUG_INTERPRETATIONS: Record<string, (dose: number, unit: string) => string> = {
  "Noradrenalina": (dose) => {
    if (dose < 0.05) return "Dose < 0.05 mcg/kg/min — infraterapêutica. Considerar descontinuar se PAM adequada sem vasopressor.";
    if (dose <= 0.3) return `Dose ${dose.toFixed(2)} mcg/kg/min — faixa baixa-moderada. Primeira linha no choque séptico. Alvo PAM ≥ 65 mmHg.`;
    if (dose <= 0.5) return `Dose ${dose.toFixed(2)} — faixa moderada-alta. Considerar associar vasopressina (0.03 U/min) como poupador de catecolamina.`;
    return `Dose ${dose.toFixed(2)} — dose alta (> 0.5). Choque refratário. Associar vasopressina, avaliar corticoide (hidrocortisona 200mg/dia) e IC com inotrópico.`;
  },
  "Dobutamina": (dose) => {
    if (dose < 2.5) return "Dose < 2.5 — infraterapêutica.";
    if (dose <= 10) return `Dose ${dose.toFixed(1)} mcg/kg/min — faixa baixa-moderada. Efeito inotrópico predominante. Monitorizar FC e arritmias.`;
    if (dose <= 20) return `Dose ${dose.toFixed(1)} — faixa alta. Efeito cronotrópico relevante. Risco de taquicardia e aumento do consumo de O₂ miocárdico.`;
    return `Dose ${dose.toFixed(1)} — acima da faixa usual. Avaliar alternativas (milrinona, levosimendan).`;
  },
  "Nitroprussiato": (dose) => {
    if (dose <= 2) return `Dose ${dose.toFixed(1)} — faixa baixa. Vasodilatador arterial e venoso.`;
    if (dose <= 5) return `Dose ${dose.toFixed(1)} — faixa moderada. Monitorizar PA invasiva.`;
    return `Dose ${dose.toFixed(1)} — dose alta (> 5). Risco de intoxicação por cianeto se > 48h ou > 4 mcg/kg/min. Monitorizar lactato e acidose.`;
  },
  "Nitroglicerina": (dose) => {
    if (dose <= 50) return `Dose ${dose.toFixed(0)} mcg/min — faixa baixa. Predomina venodilatação (reduz pré-carga).`;
    if (dose <= 100) return `Dose ${dose.toFixed(0)} — faixa moderada. Efeito misto (arterial + venoso). Útil em SCA e EAP.`;
    return `Dose ${dose.toFixed(0)} — faixa alta (> 100). Vasodilatação arterial significativa. Risco de hipotensão e cefaleia. Taquifilaxia em 24–48h.`;
  },
  "Midazolam": (dose) => {
    if (dose <= 5) return `Dose ${dose.toFixed(1)} mg/h — faixa baixa. Sedação leve. Risco de acúmulo em insuficiência renal/hepática.`;
    if (dose <= 15) return `Dose ${dose.toFixed(1)} mg/h — faixa moderada. Avaliar RASS alvo e considerar sedação com alfa-2 agonista se longa duração.`;
    return `Dose ${dose.toFixed(1)} mg/h — dose alta. Acúmulo de metabólito ativo. Considerar trocar para propofol ou dexmedetomidina.`;
  },
  "Fentanil": (dose) => {
    if (dose <= 50) return `Dose ${dose.toFixed(0)} mcg/h — analgesia leve. Ajustar conforme escala de dor (BPS/CPOT).`;
    if (dose <= 100) return `Dose ${dose.toFixed(0)} mcg/h — analgesia moderada. Faixa usual para IOT. Monitorizar sedação e íleo.`;
    return `Dose ${dose.toFixed(0)} mcg/h — dose alta. Risco de depressão respiratória, rigidez torácica e íleo paralítico. Considerar rotação de opioide.`;
  },
};

const DrugInfusionCalc = () => {
  const [selectedDrug, setSelectedDrug] = useState(0);
  const [selectedConc, setSelectedConc] = useState(0);
  const [peso, setPeso] = useState("");
  const [mode, setMode] = useState<"dose_to_rate" | "rate_to_dose">("dose_to_rate");
  const [inputValue, setInputValue] = useState("");

  const drug = DRUGS[selectedDrug];
  const conc = drug.concentrations[selectedConc];
  const needsWeight = drug.doseUnit.includes("/kg");

  const result = useMemo(() => {
    const val = parseFloat(inputValue);
    const w = parseFloat(peso);
    if (!val) return null;
    if (needsWeight && !w) return null;

    const mgPerMl = conc.mgPerMl;

    if (mode === "dose_to_rate") {
      let mgPerMin: number;
      if (drug.doseUnit === "mcg/kg/min") {
        mgPerMin = (val * w) / drug.factor;
      } else if (drug.doseUnit === "mcg/min") {
        mgPerMin = val / drug.factor;
      } else if (drug.doseUnit === "mcg/h") {
        mgPerMin = val / drug.factor / 60;
      } else {
        mgPerMin = val / 60;
      }
      const mlPerH = (mgPerMin / mgPerMl) * 60;
      return { value: mlPerH.toFixed(1), unit: "mL/h", dose: val };
    } else {
      const mlPerMin = val / 60;
      const mgPerMin = mlPerMin * mgPerMl;

      if (drug.doseUnit === "mcg/kg/min") {
        const dose = (mgPerMin * drug.factor) / w;
        return { value: dose.toFixed(2), unit: drug.doseUnit, dose };
      } else if (drug.doseUnit === "mcg/min") {
        const dose = mgPerMin * drug.factor;
        return { value: dose.toFixed(1), unit: drug.doseUnit, dose };
      } else if (drug.doseUnit === "mcg/h") {
        const dose = mgPerMin * drug.factor * 60;
        return { value: dose.toFixed(1), unit: drug.doseUnit, dose };
      } else {
        const dose = mgPerMin * 60;
        return { value: dose.toFixed(2), unit: drug.doseUnit, dose };
      }
    }
  }, [inputValue, peso, selectedDrug, selectedConc, mode, conc, drug, needsWeight]);

  const interpretation = useMemo(() => {
    if (!result) return null;
    const doseVal = mode === "dose_to_rate" ? parseFloat(inputValue) : result.dose;
    if (!doseVal || isNaN(doseVal)) return null;
    const fn = DRUG_INTERPRETATIONS[drug.name];
    if (!fn) return null;
    return fn(doseVal, drug.doseUnit);
  }, [result, inputValue, mode, drug]);

  return (
    <CalculatorCard
      title="Drogas em Perfusão"
      icon={<Syringe className="w-4 h-4" />}
      definition="Calculadora de conversão dose ↔ vazão para drogas vasoativas e sedativos em infusão contínua na UTI."
      rationale="Permite ajuste preciso de vasopressores, inotrópicos e sedativos. Evita erros de cálculo na diluição e garante dose dentro da faixa terapêutica."
    >
      {/* Drug selector */}
      <div className="flex flex-wrap gap-1.5">
        {DRUGS.map((d, i) => (
          <button
            key={d.name}
            onClick={() => { setSelectedDrug(i); setSelectedConc(0); setInputValue(""); }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              i === selectedDrug
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* Concentration selector */}
      {drug.concentrations.length > 1 && (
        <div className="space-y-1">
          <label className="calc-label">Diluição</label>
          <div className="flex flex-col gap-1">
            {drug.concentrations.map((c, i) => (
              <button
                key={c.label}
                onClick={() => setSelectedConc(i)}
                className={`text-left px-2.5 py-1.5 rounded-md text-[11px] transition-all ${
                  i === selectedConc
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "bg-muted/50 text-muted-foreground border border-border"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {drug.concentrations.length === 1 && (
        <p className="text-[10px] text-muted-foreground font-mono">💊 {conc.label}</p>
      )}

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setMode("dose_to_rate"); setInputValue(""); }}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            mode === "dose_to_rate"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          Dose → mL/h
        </button>
        <button
          onClick={() => { setMode("rate_to_dose"); setInputValue(""); }}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            mode === "rate_to_dose"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          mL/h → Dose
        </button>
      </div>

      {/* Inputs */}
      <div className={`grid gap-3 ${needsWeight ? "grid-cols-2" : "grid-cols-1"}`}>
        {needsWeight && <CalcField label="Peso" value={peso} onChange={setPeso} unit="kg" />}
        <CalcField
          label={mode === "dose_to_rate" ? `Dose (${drug.doseUnit})` : "Vazão"}
          value={inputValue}
          onChange={setInputValue}
          unit={mode === "dose_to_rate" ? drug.doseUnit : "mL/h"}
        />
      </div>

      <CalcResult
        label={mode === "dose_to_rate" ? "Vazão" : "Dose"}
        value={result?.value ?? null}
        unit={result?.unit}
      />

      <p className="text-[10px] text-muted-foreground text-center font-mono">
        Faixa: {drug.doseRange} {drug.doseUnit}
      </p>

      {interpretation && <Interpretation text={interpretation} />}
    </CalculatorCard>
  );
};

export default DrugInfusionCalc;
