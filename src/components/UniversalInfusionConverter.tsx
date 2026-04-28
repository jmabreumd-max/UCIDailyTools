import { useState, useMemo, useCallback } from "react";
import { usePatient } from "@/contexts/PatientContext";
import CalcField from "./CalcField";
import CalcResult from "./CalcResult";
import InfoTooltip from "./InfoTooltip";
import { AlertCircle } from "lucide-react";

interface Concentration {
  label: string;
  mgPerMl: number;
}

interface UniversalInfusionConverterProps {
  drugName: string;
  concentrations: Concentration[];
  doseUnit: string; // e.g. "mcg/kg/min", "mg/kg/h", "U/h", "mg/h"
  doseRange: string;
  needsWeight?: boolean;
  onRateChange?: (mlH: number) => void;
}

const UniversalInfusionConverter = ({
  drugName,
  concentrations,
  doseUnit,
  doseRange,
  needsWeight = true,
  onRateChange,
}: UniversalInfusionConverterProps) => {
  const { pesoReferencia } = usePatient();
  const peso = pesoReferencia || 0;

  const [selectedConc, setSelectedConc] = useState(0);
  const [isCustomConc, setIsCustomConc] = useState(false);
  const [customMg, setCustomMg] = useState("");
  const [customMl, setCustomMl] = useState("50");
  
  const [mode, setMode] = useState<"dose_to_rate" | "rate_to_dose">("dose_to_rate");
  const [inputValue, setInputValue] = useState("");

  const activeConc = useMemo(() => {
    if (isCustomConc) {
      const mg = parseFloat(customMg) || 0;
      const ml = parseFloat(customMl) || 1;
      return { label: `Personalizada (${customMg || 0}mg / ${customMl || 1}mL)`, mgPerMl: mg / ml };
    }
    return concentrations[selectedConc];
  }, [isCustomConc, customMg, customMl, concentrations, selectedConc]);

  const isMcg = doseUnit.includes("mcg");
  const isPerMin = doseUnit.includes("/min");
  const isPerKg = doseUnit.includes("/kg");
  const factor = isMcg ? 1000 : 1; // mg vs mcg

  const parsedRange = useMemo(() => {
    const match = doseRange.replace(",", ".").match(/([0-9.]+)[^0-9.]+([0-9.]+)/);
    if (match) return [parseFloat(match[1]), parseFloat(match[2])];
    const single = doseRange.replace(",", ".").match(/([0-9.]+)/);
    if (single) return [0, parseFloat(single[1])];
    return [0, Number.MAX_VALUE];
  }, [doseRange]);

  const [minDose, maxDose] = parsedRange;

  const calcRate = useCallback((dose: number) => {
    const w = isPerKg ? peso : 1;
    const mgPerHour = isPerMin ? (dose * w * 60) / factor : (dose * w) / factor;
    return activeConc.mgPerMl > 0 ? mgPerHour / activeConc.mgPerMl : 0;
  }, [isPerKg, peso, isPerMin, factor, activeConc.mgPerMl]);

  const calcDose = useCallback((rate: number) => {
    const mgPerHour = rate * activeConc.mgPerMl;
    const w = isPerKg ? (peso || 1) : 1;
    return isPerMin ? (mgPerHour * factor) / (w * 60) : (mgPerHour * factor) / w;
  }, [activeConc.mgPerMl, isPerKg, peso, isPerMin, factor]);

  const result = useMemo(() => {
    const val = parseFloat(inputValue);
    if (isNaN(val) || val <= 0) return null;
    if (isPerKg && needsWeight && !peso) return null;
    if (activeConc.mgPerMl <= 0) return null;

    if (mode === "dose_to_rate") {
      const mlH = calcRate(val);
      onRateChange?.(mlH);
      return { label: "Vazão", value: mlH.toFixed(1), unit: "mL/h", numericValue: val };
    } else {
      const dose = calcDose(val);
      return { label: "Dose", value: dose.toFixed(3), unit: doseUnit, numericValue: dose };
    }
  }, [inputValue, peso, activeConc.mgPerMl, mode, isPerKg, needsWeight, doseUnit, onRateChange, calcRate, calcDose]);

  const isOutOfRange = result !== null && (result.numericValue < minDose || result.numericValue > maxDose);
  
  const minRate = calcRate(minDose);
  const maxRate = calcRate(maxDose);

  return (
    <div className="space-y-3 p-3 bg-muted/20 border border-border rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-bold text-primary">{drugName}</span>
          <InfoTooltip
            formula={`Dose(${doseUnit}) × Peso × 60 / (Conc × ${factor})`}
            reference={`Faixa recomendada: ${doseRange} ${doseUnit}`}
          />
        </div>
        {isPerKg && needsWeight && peso > 0 && (
          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-bold">{peso} kg</span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1">
          {concentrations.map((c, i) => (
            <button key={c.label} onClick={() => { setIsCustomConc(false); setSelectedConc(i); setInputValue(""); }}
              className={`flex-1 min-w-[30%] px-2 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                !isCustomConc && i === selectedConc ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
              }`}>{c.label}</button>
          ))}
          <button onClick={() => { setIsCustomConc(true); setInputValue(""); }}
            className={`flex-1 min-w-[30%] px-2 py-1.5 rounded-md text-[10px] font-medium transition-all ${
              isCustomConc ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
            }`}>Outra</button>
        </div>

        {isCustomConc && (
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/50">
            <CalcField label="Fármaco (mg)" value={customMg} onChange={(e) => setCustomMg(e.target.value)} unit="mg" />
            <CalcField label="Volume (mL)" value={customMl} onChange={(e) => setCustomMl(e.target.value)} unit="mL" />
          </div>
        )}
        {!isCustomConc && concentrations.length === 1 && (
          <p className="text-[10px] text-muted-foreground font-mono mt-1">💊 {activeConc.label}</p>
        )}
      </div>

      <div className="flex gap-1.5 pt-2">
        <button onClick={() => { setMode("dose_to_rate"); setInputValue(""); }}
          className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-all shadow-sm ${mode === "dose_to_rate" ? "bg-primary/20 text-primary border border-primary/40 ring-1 ring-primary/20" : "bg-muted/40 text-muted-foreground border border-border hover:bg-muted"}`}>
          Dose → Vazão (mL/h)
        </button>
        <button onClick={() => { setMode("rate_to_dose"); setInputValue(""); }}
          className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-all shadow-sm ${mode === "rate_to_dose" ? "bg-primary/20 text-primary border border-primary/40 ring-1 ring-primary/20" : "bg-muted/40 text-muted-foreground border border-border hover:bg-muted"}`}>
          Vazão (mL/h) → Dose
        </button>
      </div>

      <div className="pt-1">
        <CalcField
          label={mode === "dose_to_rate" ? `Dose Alvo (${doseUnit})` : "Vazão Bomba (mL/h)"}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          unit={mode === "dose_to_rate" ? doseUnit : "mL/h"}
        />
      </div>

      {isPerKg && needsWeight && !peso ? (
         <div className="text-[10px] text-destructive bg-destructive/10 p-2 rounded border border-destructive/20 flex gap-1 items-center">
            <AlertCircle className="w-3 h-3" />
            Adicione o Peso do Doente na aba Geral para usar este calculador.
         </div>
      ) : result ? (
        <div className={`p-2.5 rounded-md border ${isOutOfRange ? "bg-destructive/10 border-destructive/30" : "bg-primary/5 border-primary/20"} transition-colors`}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-semibold text-muted-foreground">{result.label} Calculada</span>
            <span className={`text-lg font-bold ${isOutOfRange ? "text-destructive" : "text-primary"}`}>
              {result.value} <span className="text-[11px] font-normal">{result.unit}</span>
            </span>
          </div>
          {isOutOfRange && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-destructive font-medium">
              <AlertCircle className="w-3 h-3" />
              <span>Atenção: Dose fora da faixa terapêutica habitual.</span>
            </div>
          )}
        </div>
      ) : null}

      <div className="flex justify-between items-center text-[9px] mt-2 font-mono px-1">
        <div className="text-muted-foreground text-left">
          <span className="block opacity-70">Faixa Terapêutica (Dose)</span>
          <span className="font-semibold">{minDose} - {maxDose === Number.MAX_VALUE ? "∞" : maxDose} {doseUnit.split('/')[0]}</span>
        </div>
        
        {(!needsWeight || (needsWeight && peso > 0)) && activeConc.mgPerMl > 0 && maxDose !== Number.MAX_VALUE && (
          <div className="text-muted-foreground text-right border-l pl-2 border-border/50">
            <span className="block opacity-70">Para {peso > 0 ? peso + 'kg' : 'este doente'} (mL/h)</span>
            <span className="font-semibold text-primary">{minRate.toFixed(1)} - {maxRate.toFixed(1)} mL/h</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversalInfusionConverter;

