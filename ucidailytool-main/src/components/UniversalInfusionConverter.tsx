import { useState, useMemo } from "react";
import { usePatient } from "@/contexts/PatientContext";
import CalcField from "./CalcField";
import CalcResult from "./CalcResult";
import InfoTooltip from "./InfoTooltip";

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
  const [mode, setMode] = useState<"dose_to_rate" | "rate_to_dose">("dose_to_rate");
  const [inputValue, setInputValue] = useState("");

  const conc = concentrations[selectedConc];

  const isMcg = doseUnit.includes("mcg");
  const isPerMin = doseUnit.includes("/min");
  const isPerKg = doseUnit.includes("/kg");
  const factor = isMcg ? 1000 : 1; // mg vs mcg

  const result = useMemo(() => {
    const val = parseFloat(inputValue);
    if (!val) return null;
    if (isPerKg && needsWeight && !peso) return null;

    if (mode === "dose_to_rate") {
      // dose → mL/h
      let mgPerHour: number;
      const w = isPerKg ? peso : 1;
      if (isPerMin) {
        mgPerHour = (val * w * 60) / factor;
      } else {
        mgPerHour = (val * w) / factor;
      }
      const mlH = mgPerHour / conc.mgPerMl;
      onRateChange?.(mlH);
      return { label: "Vazão", value: mlH.toFixed(1), unit: "mL/h" };
    } else {
      // mL/h → dose
      const mgPerHour = val * conc.mgPerMl;
      const w = isPerKg ? peso : 1;
      let dose: number;
      if (isPerMin) {
        dose = (mgPerHour * factor) / (w * 60);
      } else {
        dose = (mgPerHour * factor) / w;
      }
      return { label: "Dose", value: dose.toFixed(3), unit: doseUnit };
    }
  }, [inputValue, peso, conc, mode, isPerKg, isPerMin, factor, needsWeight, doseUnit, onRateChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-foreground">{drugName}</span>
        <InfoTooltip
          formula={`Dose(${doseUnit}) × Peso × 60 / (Conc × 1000)`}
          reference={`Faixa: ${doseRange} ${doseUnit}`}
        />
      </div>

      {concentrations.length > 1 && (
        <div className="flex gap-1">
          {concentrations.map((c, i) => (
            <button key={c.label} onClick={() => { setSelectedConc(i); setInputValue(""); }}
              className={`flex-1 px-2 py-1 rounded-md text-[10px] transition-all ${
                i === selectedConc ? "bg-primary/15 text-primary border border-primary/25" : "bg-muted/50 text-muted-foreground border border-border"
              }`}>{c.label}</button>
          ))}
        </div>
      )}
      {concentrations.length === 1 && (
        <p className="text-[10px] text-muted-foreground font-mono">💊 {conc.label}</p>
      )}

      <div className="flex gap-1.5">
        <button onClick={() => { setMode("dose_to_rate"); setInputValue(""); }}
          className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-all ${mode === "dose_to_rate" ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`}>
          Dose → mL/h
        </button>
        <button onClick={() => { setMode("rate_to_dose"); setInputValue(""); }}
          className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-all ${mode === "rate_to_dose" ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`}>
          mL/h → Dose
        </button>
      </div>

      <CalcField
        label={mode === "dose_to_rate" ? `Dose (${doseUnit})` : "Vazão (mL/h)"}
        value={inputValue}
        onChange={setInputValue}
        unit={mode === "dose_to_rate" ? doseUnit : "mL/h"}
      />

      {result && <CalcResult label={result.label} value={result.value} unit={result.unit} />}
      <p className="text-[9px] text-muted-foreground text-center font-mono">Faixa: {doseRange} {doseUnit}</p>
    </div>
  );
};

export default UniversalInfusionConverter;
