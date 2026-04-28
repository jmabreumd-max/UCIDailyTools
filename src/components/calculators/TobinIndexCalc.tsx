import { calcFieldValidator } from "@/utils/validation";
import {  useMemo  } from "react";
import { z } from "zod";
import { useCalculatorForm } from "@/hooks/useCalculatorForm";
import { usePatient } from "@/contexts/PatientContext";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Gauge } from "lucide-react";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const TobinIndexCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const p = usePatient();

  const calcSchema = z.object({
    fr: calcFieldValidator(),
  vt: calcFieldValidator(),
  });
  const form = useCalculatorForm(calcSchema, {

  });
  const { register, formState: { errors } } = form;
  const fr = form.watch("fr");
  const vt = form.watch("vt");
  
  
  

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
        <CalcField label="FR" {...register("fr")} error={errors.fr?.message as string} unit="irpm" />
        <CalcField label="Volume Corrente" {...register("vt")} error={errors.vt?.message as string} unit="mL" />
      </div>
      <CalcResult label="RSBI" value={resultado} unit="irpm/L" status={status} />
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default TobinIndexCalc;
