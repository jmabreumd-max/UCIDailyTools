import { useState, useMemo } from "react";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Activity } from "lucide-react";
import { z } from "zod";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const DrivingPressureCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const [pplato, setPplato] = useState(defaultValues?.pplato || "");
  const [peep, setPeep] = useState(defaultValues?.peep || "");

  const dp = useMemo(() => {
    const pp = parseFloat(pplato);
    const pe = parseFloat(peep);
    if (!pp || pe === undefined || isNaN(pe)) return null;
    return (pp - pe).toFixed(0);
  }, [pplato, peep]);

  const status = useMemo(() => {
    if (!dp) return undefined;
    const r = parseFloat(dp);
    if (r > 15) return "danger" as const;
    if (r > 13) return "warning" as const;
    return "normal" as const;
  }, [dp]);

  const interpretation = useMemo(() => {
    if (!dp) return null;
    const r = parseFloat(dp);
    if (r <= 13) return "DP ≤ 13 cmH₂O — ventilação protetora. Menor risco de VILI. Manter estratégia atual.";
    if (r <= 15) return "DP 14–15 cmH₂O — limítrofe. Tentar reduzir VC ou otimizar PEEP para diminuir DP. Reavaliação frequente.";
    return "DP > 15 cmH₂O — risco elevado de lesão pulmonar induzida pelo ventilador (VILI). Reduzir VC, otimizar PEEP, considerar prona.";
  }, [dp]);

  return (
    <CalculatorCard
      title="Driving Pressure"
      icon={<Activity className="w-4 h-4" />}
      formula="Pplatô - PEEP (alvo ≤ 15 cmH₂O)"
      definition="A Driving Pressure (ΔP) representa o stress cíclico aplicado ao pulmão em cada inspiração. É o melhor preditor de mortalidade em SDRA."
      rationale="Guia ajuste de VC e PEEP na ventilação protetora. Alvo ≤ 15 cmH₂O reduz mortalidade em SDRA."
    >
      <div className="grid grid-cols-2 gap-3">
        <CalcField label="P. Platô" value={pplato} onChange={setPplato} unit="cmH₂O" />
        <CalcField label="PEEP" value={peep} onChange={setPeep} unit="cmH₂O" />
      </div>
      <CalcResult label="Driving Pressure" value={dp} unit="cmH₂O" status={status} />
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default DrivingPressureCalc;
