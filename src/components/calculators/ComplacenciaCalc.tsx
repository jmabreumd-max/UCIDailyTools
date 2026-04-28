import { useState, useMemo } from "react";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Gauge } from "lucide-react";
import { z } from "zod";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const ComplacenciaCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const [vc, setVc] = useState(defaultValues?.vc || "");
  const [pplato, setPplato] = useState(defaultValues?.pplato || "");
  const [peep, setPeep] = useState(defaultValues?.peep || "");

  const resultado = useMemo(() => {
    const v = parseFloat(vc);
    const pp = parseFloat(pplato);
    const pe = parseFloat(peep);
    if (!v || !pp || isNaN(pe) || pp - pe <= 0) return null;
    return (v / (pp - pe)).toFixed(1);
  }, [vc, pplato, peep]);

  const status = useMemo(() => {
    if (!resultado) return undefined;
    const r = parseFloat(resultado);
    if (r < 30) return "danger" as const;
    if (r < 50) return "warning" as const;
    return "normal" as const;
  }, [resultado]);

  const interpretation = useMemo(() => {
    if (!resultado) return null;
    const r = parseFloat(resultado);
    if (r < 30) return "Cst < 30 mL/cmH₂O — pulmão rígido. Sugere SDRA, fibrose, edema pulmonar ou derrame pleural volumoso. VM protetora com VC baixo.";
    if (r < 50) return "Cst 30–50 — complacência reduzida. Monitorizar driving pressure e considerar recrutamento alveolar se indicado.";
    return "Cst > 50 mL/cmH₂O — complacência normal. Pulmão distensível; avaliar necessidade de desmame ventilatório.";
  }, [resultado]);

  return (
    <CalculatorCard
      title="Complacência Estática"
      icon={<Gauge className="w-4 h-4" />}
      formula="VC / (Pplatô - PEEP)"
      definition="A complacência estática mede a distensibilidade do sistema respiratório, refletindo o quanto o pulmão se expande por unidade de pressão."
      rationale="Avalia gravidade da lesão pulmonar e resposta ao recrutamento. Valores baixos indicam pulmão restritivo (SDRA, fibrose)."
    >
      <div className="grid grid-cols-3 gap-2">
        <CalcField label="VC" value={vc} onChange={setVc} unit="mL" />
        <CalcField label="P. Platô" value={pplato} onChange={setPplato} unit="cmH₂O" />
        <CalcField label="PEEP" value={peep} onChange={setPeep} unit="cmH₂O" />
      </div>
      <CalcResult label="Cst" value={resultado} unit="mL/cmH₂O" status={status} />
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default ComplacenciaCalc;
