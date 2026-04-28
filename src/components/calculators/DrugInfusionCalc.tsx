import { calcFieldValidator } from "@/utils/validation";
import { useState, useMemo, useEffect } from "react";
import { z } from "zod";
import { useCalculatorForm } from "@/hooks/useCalculatorForm";
import { usePatient } from "@/contexts/PatientContext";
import { usePersistedState } from "@/hooks/usePersistedState";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Syringe, Settings, X, Plus, Trash2 } from "lucide-react";
import { useEventLog } from "@/contexts/EventLogContext";

interface Concentration {
  label: string;
  mgPerMl: number;
}

interface DrugConfig {
  name: string;
  concentrations: Concentration[];
  doseUnit: string;
  doseRange: string;
  factor: number;
  inputUnit: "mg" | "mcg";
}

const DEFAULT_DRUGS: DrugConfig[] = [
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
    inputUnit: "mg",
  },
  {
    name: "Adrenalina",
    concentrations: [
      { label: "10mg em 250mL SG5%", mgPerMl: 10 / 250 },
    ],
    doseUnit: "mcg/kg/min",
    doseRange: "0.01–1.0",
    factor: 1000,
    inputUnit: "mg",
  },
  {
    name: "Vasopressina",
    concentrations: [
      { label: "40U em 40mL SF (1U/mL)", mgPerMl: 1 },
      { label: "20U em 100mL SF", mgPerMl: 20 / 100 },
    ],
    doseUnit: "U/min",
    doseRange: "0.01–0.04",
    factor: 1,
    inputUnit: "mg", // We treat U as mg for weight calculations UI
  },
  {
    name: "Dobutamina",
    concentrations: [
      { label: "250mg em 230mL SG5%", mgPerMl: 250 / 250 },
    ],
    doseUnit: "mcg/kg/min",
    doseRange: "2.5–20",
    factor: 1000,
    inputUnit: "mg",
  },
  {
    name: "Nitroprussiato",
    concentrations: [
      { label: "50mg em 250mL SG5%", mgPerMl: 50 / 250 },
    ],
    doseUnit: "mcg/kg/min",
    doseRange: "0.5–10",
    factor: 1000,
    inputUnit: "mg",
  },
  {
    name: "Nitroglicerina",
    concentrations: [
      { label: "50mg em 250mL SG5%", mgPerMl: 50 / 250 },
    ],
    doseUnit: "mcg/min",
    doseRange: "5–200",
    factor: 1000,
    inputUnit: "mg",
  },
  {
    name: "Amiodarona",
    concentrations: [
      { label: "900mg em 50mL SG5%", mgPerMl: 900 / 50 },
    ],
    doseUnit: "mg/h",
    doseRange: "35–50", // actually mostly fixed dose per hour, roughly 900mg/24h -> 37.5 mg/h
    factor: 1,
    inputUnit: "mg", 
  },
  {
    name: "Labetalol",
    concentrations: [
      { label: "100mg puro (5mg/mL)", mgPerMl: 5 },
      { label: "500mg em 250mL", mgPerMl: 2 },
    ],
    doseUnit: "mg/h",
    doseRange: "10–120",
    factor: 1,
    inputUnit: "mg",
  },
  {
    name: "Midazolam",
    concentrations: [
      { label: "150mg em 120mL SF", mgPerMl: 150 / 120 },
      { label: "50mg em 100mL SF", mgPerMl: 50 / 100 },
    ],
    doseUnit: "mg/h",
    doseRange: "1–20",
    factor: 1,
    inputUnit: "mg",
  },
  {
    name: "Propofol",
    concentrations: [
      { label: "Propofol 2% (20mg/mL)", mgPerMl: 20 },
      { label: "Propofol 1% (10mg/mL)", mgPerMl: 10 },
    ],
    doseUnit: "mg/kg/h",
    doseRange: "0.5–4.0",
    factor: 1,
    inputUnit: "mg",
  },
  {
    name: "Dexmedetomidina",
    concentrations: [
      { label: "400mcg em 100mL SF", mgPerMl: 0.004 },
      { label: "200mcg em 50mL SF", mgPerMl: 0.004 },
    ],
    doseUnit: "mcg/kg/h",
    doseRange: "0.2–1.4",
    factor: 1000,
    inputUnit: "mcg",
  },
  {
    name: "Fentanil",
    concentrations: [
      { label: "500mcg (50mL) puro", mgPerMl: 0.01 },
      { label: "500mcg em 250mL SF", mgPerMl: 0.5 / 250 },
      { label: "1000mcg (100mL) puro", mgPerMl: 0.01 },
    ],
    doseUnit: "mcg/h",
    doseRange: "25–200",
    factor: 1000,
    inputUnit: "mcg",
  },
  {
    name: "Remifentanil",
    concentrations: [
      { label: "2mg em 50mL (40mcg/mL)", mgPerMl: 0.04 },
      { label: "5mg em 50mL (100mcg/mL)", mgPerMl: 0.1 },
    ],
    doseUnit: "mcg/kg/min",
    doseRange: "0.05–0.25",
    factor: 1000,
    inputUnit: "mg",
  },
  {
    name: "Sufentanil",
    concentrations: [
      { label: "250mcg em 50mL (5mcg/mL)", mgPerMl: 0.005 },
    ],
    doseUnit: "mcg/kg/h",
    doseRange: "0.1–0.5",
    factor: 1000,
    inputUnit: "mcg",
  },
  {
    name: "Cetamina",
    concentrations: [
      { label: "500mg em 50mL (10mg/mL)", mgPerMl: 10 },
      { label: "Puro (50mg/mL)", mgPerMl: 50 },
    ],
    doseUnit: "mg/kg/h",
    doseRange: "0.1–0.5",
    factor: 1,
    inputUnit: "mg",
  },
  {
    name: "Atracúrio",
    concentrations: [
      { label: "250mg em 50mL (5mg/mL)", mgPerMl: 5 },
    ],
    doseUnit: "mg/kg/h",
    doseRange: "0.3–0.6",
    factor: 1,
    inputUnit: "mg",
  },
  {
    name: "Cisatracúrio",
    concentrations: [
      { label: "100mg em 50mL (2mg/mL)", mgPerMl: 2 },
    ],
    doseUnit: "mg/kg/h",
    doseRange: "0.06–0.2",
    factor: 1,
    inputUnit: "mg",
  },
  {
    name: "Rocurónio",
    concentrations: [
      { label: "500mg em 50mL (10mg/mL)", mgPerMl: 10 },
    ],
    doseUnit: "mg/kg/h",
    doseRange: "0.3–0.6",
    factor: 1,
    inputUnit: "mg",
  },
];

const DRUG_INTERPRETATIONS: Record<string, (dose: number, unit: string) => string> = {
  "Noradrenalina": (dose) => {
    if (dose < 0.05) return "Dose < 0.05 mcg/kg/min — infraterapêutica. Considerar descontinuar se PAM adequada sem vasopressor.";
    if (dose <= 0.3) return `Dose ${dose.toFixed(2)} mcg/kg/min — faixa baixa-moderada. Primeira linha no choque séptico. Alvo PAM ≥ 65 mmHg.`;
    if (dose <= 0.5) return `Dose ${dose.toFixed(2)} — faixa moderada-alta. Considerar associar vasopressina (0.03 U/min) como poupador de catecolamina.`;
    return `Dose ${dose.toFixed(2)} — dose alta (> 0.5). Choque refratário. Associar vasopressina, avaliar corticoide (hidrocortisona 200mg/dia) e IC com inotrópico.`;
  },
  "Adrenalina": (dose) => {
    if (dose <= 0.05) return `Dose ${dose.toFixed(2)} mcg/kg/min — inotrópico leve.`;
    if (dose <= 0.3) return `Dose ${dose.toFixed(2)} — inotrópico e vasopressor misto. Atenção ao lactato e potencial arritmogénico.`;
    return `Dose ${dose.toFixed(2)} — dose alta. Risco de isquemia periférica e taquicardia severa.`;
  },
  "Vasopressina": (dose) => {
    if (dose > 0.04) return `Dose ${dose.toFixed(2)} U/min — alta. Risco elevado de isquemia esplâncnica, digital e coronária (faixa ótima: 0.01 - 0.04 U/min).`;
    return `Dose ${dose.toFixed(2)} U/min — faixa adequada como poupador de catecolaminas.`;
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
  "Amiodarona": (dose) => {
    return `Amiodarona IV contínua requer monitorização de QT e risco de bradicardia/hipotensão.`;
  },
  "Labetalol": (dose) => {
    return `Monitorizar frequência cardíaca (beta-bloqueio) e pressão arterial (alfa-bloqueio).`;
  },
  "Midazolam": (dose) => {
    if (dose <= 5) return `Dose ${dose.toFixed(1)} mg/h — faixa baixa. Sedação leve. Risco de acúmulo em insuficiência renal/hepática.`;
    if (dose <= 15) return `Dose ${dose.toFixed(1)} mg/h — faixa moderada. Avaliar RASS alvo e considerar sedação com alfa-2 agonista se longa duração.`;
    return `Dose ${dose.toFixed(1)} mg/h — dose alta. Acúmulo de metabólito ativo. Considerar trocar para propofol ou dexmedetomidina.`;
  },
  "Propofol": (dose) => {
    if (dose > 4) return `Dose ${dose.toFixed(1)} mg/kg/h — Muito alta! Risco elevado de Síndrome de Perfusão do Propofol (PRIS) se mantida > 48h. Monitorizar triglicerídeos, CK, lactato.`;
    return `Dose ${dose.toFixed(1)} mg/kg/h — sedação. Lembrar de contabilizar o aporte lipídico (1.1 kcal/mL na solução a 1%).`;
  },
  "Dexmedetomidina": (dose) => {
    if (dose > 1.4) return `Dose ${dose.toFixed(1)} mcg/kg/h — acima do limite usual. Maior risco de bradicardia e hipotensão profundas.`;
    return `Dose ${dose.toFixed(1)} mcg/kg/h — sedação cooperante. Monitorizar para bradicardia.`;
  },
  "Fentanil": (dose) => {
    if (dose <= 50) return `Dose ${dose.toFixed(0)} mcg/h — analgesia leve. Ajustar conforme escala de dor (BPS/CPOT).`;
    if (dose <= 100) return `Dose ${dose.toFixed(0)} mcg/h — analgesia moderada. Faixa usual para IOT. Monitorizar sedação e íleo.`;
    return `Dose ${dose.toFixed(0)} mcg/h — dose alta. Risco de depressão respiratória, rigidez torácica e íleo paralítico. Considerar rotação de opioide.`;
  },
  "Remifentanil": (dose) => {
    if (dose <= 0.1) return `Dose ${dose.toFixed(2)} mcg/kg/min — analgesia basal. Despertar após paragem da perfusão é muito rápido.`;
    if (dose > 0.25) return `Dose ${dose.toFixed(2)} mcg/kg/min — dose elevada. Monitorizar bradicardia/hipotensão e risco de hiperalgesia na suspensão.`;
    return `Dose ${dose.toFixed(2)} mcg/kg/min — analgesia profunda.`;
  },
  "Sufentanil": (dose) => {
    return `Dose ${dose.toFixed(2)} mcg/kg/h. Opióide 10x mais potente que o fentanilo. Requer atenção à acumulação prolongada após vários dias de uso.`;
  },
  "Cetamina": (dose) => {
    if (dose < 0.3) return `Dose subdissociativa (${dose.toFixed(2)} mg/kg/h) — Efeito misto analgésico e antidepressivo. Menor risco de alucinações.`;
    return `Dose dissociativa. Adicionar pequenas doses de midazolam para atenuar reações de emergência se necessário.`;
  },
  "Atracúrio": (dose) => {
    return `Atracúrio. Metabolismo por via de Hofmann (independente do fígado/rim). Liberta histamina.`;
  },
  "Cisatracúrio": (dose) => {
    return `Cisatracúrio. Metabolismo por via de Hofmann, mas liberta menos histamina que o Atracúrio. Mais estabilidade hemodinâmica.`;
  },
  "Rocurónio": (dose) => {
    return `Rocurónio. Requer monitorização por TOF (alvo 1-2 twitches). Metabolismo predominantemente hepático.`;
  },
};

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const DrugInfusionCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const p = usePatient();

  const calcSchema = z.object({
    peso: calcFieldValidator(),
  customMass: calcFieldValidator(),
  customVolume: calcFieldValidator(),
  inputValue: calcFieldValidator(),
  });
  const form = useCalculatorForm(calcSchema, {
    peso: { global: p.pesoAtual, setGlobal: p.setPesoAtual }
  });
  const { register, formState: { errors } } = form;
  const peso = form.watch("peso");
  const customMass = form.watch("customMass");
  const customVolume = form.watch("customVolume");
  const inputValue = form.watch("inputValue");
  
  const [customConfigs, setCustomConfigs] = usePersistedState<Record<string, Concentration[]>>("drug-configs-override", {});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const DRUGS = useMemo(() => {
    return DEFAULT_DRUGS.map(d => ({
      ...d,
      concentrations: customConfigs[d.name] || d.concentrations
    }));
  }, [customConfigs]);

  const [selectedDrug, setSelectedDrug] = useState(0);
  const [selectedConc, setSelectedConc] = useState(0);
  const [isCustomDilution, setIsCustomDilution] = useState(false);
  
  
  
  const [mode, setMode] = useState<"dose_to_rate" | "rate_to_dose">("dose_to_rate");
  

  const drug = DRUGS[selectedDrug] || DRUGS[0];
  const conc = drug.concentrations[selectedConc] || drug.concentrations[0];
  const needsWeight = drug.doseUnit.includes("/kg");

  const actualMgPerMl = useMemo(() => {
    if (isCustomDilution) {
      const mass = parseFloat(customMass);
      const vol = parseFloat(customVolume);
      if (!mass || !vol) return 0;
      if (drug.inputUnit === "mcg") {
        return mass / 1000 / vol;
      }
      return mass / vol;
    }
    return conc.mgPerMl;
  }, [isCustomDilution, customMass, customVolume, conc.mgPerMl, drug.inputUnit]);

  const result = useMemo(() => {
    const val = parseFloat(inputValue);
    const w = parseFloat(peso);
    if (!val || actualMgPerMl === 0) return null;
    if (needsWeight && !w) return null;

    const mgPerMl = actualMgPerMl;

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
  }, [inputValue, peso, mode, drug, needsWeight, actualMgPerMl]);

  const { addLog } = useEventLog();
  const [lastLoggedVal, setLastLoggedVal] = useState<string | null>(null);

  useEffect(() => {
    if (result && result.value !== lastLoggedVal) {
      const modeKey = mode === "dose_to_rate" ? "Dose para mL/h" : "mL/h para Dose";
      const info = `Fármaco: ${drug.name} | Cálculo: ${modeKey} | Resultado: ${result.value} ${result.unit}`;
      addLog("CALCULATION", "Cálculo de Perfusão Realizado", info);
      setLastLoggedVal(result.value);
    }
  }, [result, addLog, drug.name, mode, lastLoggedVal]);

  const interpretation = useMemo(() => {
    if (!result) return null;
    const doseVal = mode === "dose_to_rate" ? parseFloat(inputValue) : result.dose;
    if (!doseVal || isNaN(doseVal)) return null;
    const fn = DRUG_INTERPRETATIONS[drug.name];
    if (!fn) return null;
    return fn(doseVal, drug.doseUnit);
  }, [result, inputValue, mode, drug]);

  return (
    <>
    <CalculatorCard
      title="Drogas em Perfusão"
      icon={<Syringe className="w-4 h-4" />}
      definition="Calculadora de conversão dose ↔ vazão para drogas vasoativas e sedativos em infusão contínua na UTI."
      rationale="Permite ajuste preciso de vasopressores, inotrópicos e sedativos. Evita erros de cálculo na diluição e garante dose dentro da faixa terapêutica."
      headerAction={<button onClick={() => setIsSettingsOpen(true)} className="p-1 hover:bg-muted rounded-md transition-colors"><Settings className="w-4 h-4 text-muted-foreground" /></button>}
    >
      {/* Drug selector */}
      <div className="flex flex-wrap gap-1.5">
        {DRUGS.map((d, i) => (
          <button
            key={d.name}
            onClick={() => { setSelectedDrug(i); setSelectedConc(0); setIsCustomDilution(false); setInputValue(""); }}
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
      <div className="space-y-1">
        <label className="calc-label">Diluição</label>
        <div className="flex flex-col gap-1">
          {drug.concentrations.map((c, i) => (
            <button
              key={c.label}
              onClick={() => { setSelectedConc(i); setIsCustomDilution(false); }}
              className={`text-left px-2.5 py-1.5 rounded-md text-[11px] transition-all ${
                i === selectedConc && !isCustomDilution
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "bg-muted/50 text-muted-foreground border border-border"
              }`}
            >
              {c.label}
            </button>
          ))}
          <button
            onClick={() => setIsCustomDilution(true)}
            className={`text-left px-2.5 py-1.5 rounded-md text-[11px] transition-all ${
              isCustomDilution
                ? "bg-primary/15 text-primary border border-primary/25"
                : "bg-muted/50 text-muted-foreground border border-border"
            }`}
          >
            Personalizada...
          </button>
        </div>
      </div>

      {isCustomDilution && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-md border border-border mt-2">
          <CalcField
            label={`Fármaco (${drug.inputUnit})`}
            {...register("customMass")} error={errors.customMass?.message as string}
            placeholder="Ex: 50"
            unit={drug.inputUnit}
          />
          <CalcField
            label="Volume Solvente"
            {...register("customVolume")} error={errors.customVolume?.message as string}
            placeholder="Ex: 250"
            unit="mL"
          />
        </div>
      )}

      {!isCustomDilution && drug.concentrations.length === 1 && (
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
        {needsWeight && <CalcField label="Peso" {...register("peso")} error={errors.peso?.message as string} unit="kg" />}
        <CalcField
          label={mode === "dose_to_rate" ? `Dose (${drug.doseUnit})` : "Vazão"}
          {...register("inputValue")} error={errors.inputValue?.message as string}
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

    {isSettingsOpen && (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card w-full max-w-md max-h-[85vh] overflow-y-auto rounded-xl border border-border shadow-lg flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-border sticky top-0 bg-card z-10">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Settings className="w-4 h-4" /> Configurar Diluições PADRÃO</h3>
            <button onClick={() => setIsSettingsOpen(false)} className="p-1 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-4 space-y-6">
            <p className="text-[11px] text-muted-foreground leading-relaxed -mt-2">Configure as concentrações Padrão de cada fármaco disponíveis na sua unidade. Pode adicionar ou remover concentrações.</p>
            {DEFAULT_DRUGS.map(d => {
              const acts = customConfigs[d.name] || d.concentrations;
              return (
                <div key={d.name} className="border border-border/50 rounded-lg p-3 bg-muted/10">
                  <h4 className="font-medium text-[12px] text-foreground mb-2 flex items-center gap-1.5"><Syringe className="w-3.5 h-3.5 text-primary" /> {d.name}</h4>
                  <div className="space-y-1.5 flex flex-col">
                    {acts.map((c, i) => (
                      <div key={i} className="flex gap-2 items-center">
                         <div className="flex-1 bg-background border border-border p-1.5 px-2 rounded flex items-center justify-between text-[11px]">
                            <span>{c.label}</span>
                            <span className="font-mono text-[10px] opacity-70">{c.mgPerMl.toFixed(3)} {d.inputUnit}/mL</span>
                         </div>
                         <button 
                             onClick={() => {
                               const nw = [...acts]; nw.splice(i, 1);
                               if (nw.length === 0) return; // don't delete last
                               setCustomConfigs({ ...customConfigs, [d.name]: nw });
                             }}
                             className="p-1.5 hover:bg-destructive/10 text-destructive rounded"
                             disabled={acts.length === 1}
                         >
                           <Trash2 className="w-3 h-3" />
                         </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <form className="flex gap-2 items-end" onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const massInput = form.elements.namedItem('mass') as HTMLInputElement;
                      const volInput = form.elements.namedItem('vol') as HTMLInputElement;
                      const volStr = volInput.value;
                      const massStr = massInput.value;
                      if(!volStr || !massStr) return;
                      const mass = parseFloat(massStr);
                      const vol = parseFloat(volStr);
                      const mgPerMl = d.inputUnit === "mcg" ? (mass / 1000 / vol) : (mass / vol);
                      const nw = [...acts, { label: `${mass}${d.inputUnit} em ${vol}mL`, mgPerMl }];
                      setCustomConfigs({ ...customConfigs, [d.name]: nw });
                      form.reset();
                    }}>
                       <div className="flex-1">
                          <label className="text-[9px] text-muted-foreground uppercase">Massa ({d.inputUnit})</label>
                          <input name="mass" type="number" step="0.01" required className="w-full calc-input text-[11px] py-1" />
                       </div>
                       <div className="flex-1">
                          <label className="text-[9px] text-muted-foreground uppercase">Diluente (mL)</label>
                          <input name="vol" type="number" step="0.1" required className="w-full calc-input text-[11px] py-1" />
                       </div>
                       <button type="submit" className="p-1.5 px-3 bg-primary text-primary-foreground font-semibold rounded text-[11px] hover:opacity-90 flex items-center h-[26px]">
                         Adicionar
                       </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted/20 sticky bottom-0">
             <button onClick={() => {
                if(confirm("Repor padrões de fábrica?")) setCustomConfigs({});
             }} className="px-3 py-1.5 border border-border text-[11px] font-medium rounded hover:bg-muted text-muted-foreground">Repor Padrões</button>
             <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-1.5 bg-primary text-primary-foreground text-[11px] font-bold rounded shadow-sm hover:opacity-90">Concluído</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default DrugInfusionCalc;
