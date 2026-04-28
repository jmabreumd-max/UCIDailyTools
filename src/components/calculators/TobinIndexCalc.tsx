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

const TobinIndexCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const [fr, setFr] = useState(defaultValues?.fr || "");
  const [vt, setVt] = useState(defaultValues?.vt || "");

  const resultado = useMemo(() => {
    const f = parseFloat(fr);
    const v = parseFloat(vt);
    if (!f || !v) return null;
    const vtL = v > 10 ? v / 1000 : v;
    return (f / vtL).toFixed(0);
  }, [fr, vt]);

  const status = useMemo(() => {
    if (!resultado) return undefined;
    const r = parseFloat(resultado);
    if (r > 105) return "danger" as const;
    if (r > 80) return "warning" as const;
    return "normal" as const;
  }, [resultado]);

  const interpretation = useMemo(() => {
    if (!resultado) return null;
    const r = parseFloat(resultado);
    if (r <= 80) return "RSBI < 80 — favorável ao desmame. Alta probabilidade de sucesso na extubação. Proceder com teste de respiração espontânea (TRE).";
    if (r <= 105) return "RSBI 80–105 — zona cinzenta. Reavaliar pré-requisitos para desmame: nível de consciência, tosse eficaz, balanço hídrico, correção da causa base.";
    return "RSBI > 105 — alta probabilidade de falha no desmame. Não extubar. Identificar e tratar fatores reversíveis antes de nova tentativa.";
  }, [resultado]);

  return (
    <CalculatorCard
      title="Índice de Tobin (RSBI)"
      icon={<Gauge className="w-4 h-4" />}
      formula="FR / VT (L)"
      definition="O Índice de Tobin (RSBI — Rapid Shallow Breathing Index) avalia a relação entre frequência respiratória e volume corrente durante respiração espontânea."
      rationale="Principal preditor de sucesso de desmame ventilatório. RSBI < 105 tem VPN alto para falha de extubação."
    >
      <div className="grid grid-cols-2 gap-3">
        <CalcField label="FR" value={fr} onChange={setFr} unit="irpm" />
        <CalcField label="Volume Corrente" value={vt} onChange={setVt} unit="mL" />
      </div>
      <CalcResult label="RSBI" value={resultado} unit="irpm/L" status={status} />
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default TobinIndexCalc;
