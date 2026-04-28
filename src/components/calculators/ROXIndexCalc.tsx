import { calcFieldValidator } from "@/utils/validation";
import {  useMemo  } from "react";
import { z } from "zod";
import { useCalculatorForm } from "@/hooks/useCalculatorForm";
import { usePatient } from "@/contexts/PatientContext";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Wind } from "lucide-react";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const ROXIndexCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const p = usePatient();

  const calcSchema = z.object({
    fio2: calcFieldValidator(),
  spo2: calcFieldValidator(),
  fr: calcFieldValidator(),
  });
  const form = useCalculatorForm(calcSchema, {
    fio2: { global: p.fio2, setGlobal: p.setFio2 }
  });
  const { register, formState: { errors } } = form;
  const fio2 = form.watch("fio2");
  const spo2 = form.watch("spo2");
  const fr = form.watch("fr");
  
  
  
  

  const resultado = useMemo(() => {
    const s = parseFloat(spo2);
    const f = parseFloat(fio2);
    const r = parseFloat(fr);
    if (!s || !f || !r) return null;
    const fio2Dec = f > 1 ? f / 100 : f;
    return ((s / fio2Dec) / r).toFixed(2);
  }, [spo2, fio2, fr]);

  const status = useMemo(() => {
    if (!resultado) return undefined;
    const r = parseFloat(resultado);
    if (r < 3.85) return "danger" as const;
    if (r < 4.88) return "warning" as const;
    return "normal" as const;
  }, [resultado]);

  const interpretation = useMemo(() => {
    if (!resultado) return null;
    const r = parseFloat(resultado);
    if (r < 3.85) return "ROX < 3.85 — alto risco de falha de CNAF. Forte indicação para intubação orotraqueal. Não adiar IOT.";
    if (r < 4.88) return "ROX 3.85–4.88 — risco intermediário. Reavaliar em 2 horas. Se não melhorar, considerar IOT precoce.";
    return "ROX ≥ 4.88 — baixo risco de falha. Manter CNAF e monitorizar. Reavaliar periodicamente com tendência.";
  }, [resultado]);

  return (
    <CalculatorCard
      title="Índice ROX"
      icon={<Wind className="w-4 h-4" />}
      formula="(SpO₂/FiO₂) / FR"
      definition="O Índice ROX prediz falha da cânula nasal de alto fluxo (CNAF), integrando oxigenação (SpO₂/FiO₂) e esforço respiratório (FR)."
      rationale="Evita atraso na intubação em pacientes com insuficiência respiratória hipoxêmica em CNAF. Validado para avaliação às 2, 6 e 12h."
    >
      <div className="grid grid-cols-3 gap-2">
        <CalcField label="SpO₂" {...register("spo2")} error={errors.spo2?.message as string} unit="%" />
        <CalcField label="FiO₂" {...register("fio2")} error={errors.fio2?.message as string} unit="%" />
        <CalcField label="FR" {...register("fr")} error={errors.fr?.message as string} unit="irpm" />
      </div>
      <CalcResult label="ROX Index" value={resultado} status={status} />
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default ROXIndexCalc;
