import { calcFieldValidator } from "@/utils/validation";
import {  useMemo  } from "react";
import { z } from "zod";
import { useCalculatorForm } from "@/hooks/useCalculatorForm";
import { usePatient } from "@/contexts/PatientContext";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { TrendingUp } from "lucide-react";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const IndiceCardiacoCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const p = usePatient();

  const calcSchema = z.object({
    altura: calcFieldValidator(),
  peso: calcFieldValidator(),
  dc: calcFieldValidator(),
  fc: calcFieldValidator(),
  vs: calcFieldValidator(),
  });
  const form = useCalculatorForm(calcSchema, {
    altura: { global: p.altura, setGlobal: p.setAltura },
    peso: { global: p.pesoAtual, setGlobal: p.setPesoAtual }
  });
  const { register, formState: { errors } } = form;
  const altura = form.watch("altura");
  const peso = form.watch("peso");
  const dc = form.watch("dc");
  const fc = form.watch("fc");
  const vs = form.watch("vs");
  
  
  
  
  
  

  const scCalc = useMemo(() => {
    const h = parseFloat(altura);
    const p = parseFloat(peso);
    if (!h || !p) return null;
    return Math.sqrt((h * p) / 3600);
  }, [altura, peso]);

  const dcCalc = useMemo(() => {
    const d = parseFloat(dc);
    if (d) return d;
    const f = parseFloat(fc);
    const v = parseFloat(vs);
    if (f && v) return (f * v) / 1000;
    return null;
  }, [dc, fc, vs]);

  const ic = useMemo(() => {
    if (!dcCalc || !scCalc) return null;
    return (dcCalc / scCalc).toFixed(1);
  }, [dcCalc, scCalc]);

  const status = useMemo(() => {
    if (!ic) return undefined;
    const r = parseFloat(ic);
    if (r < 2.2) return "danger" as const;
    if (r > 4.0) return "warning" as const;
    return "normal" as const;
  }, [ic]);

  const interpretation = useMemo(() => {
    if (!ic) return null;
    const r = parseFloat(ic);
    if (r < 2.2) return "IC < 2.2 — baixo débito cardíaco. Considerar inotrópico (dobutamina), otimizar pré-carga e avaliar causa (cardiogênico, obstrutivo).";
    if (r <= 4.0) return "IC normal (2.2–4.0 L/min/m²). Perfusão sistêmica adequada.";
    return "IC > 4.0 — estado hiperdinâmico. Comum em sepse, cirrose, anemia grave. Correlacionar com lactato e SvO₂.";
  }, [ic]);

  return (
    <CalculatorCard
      title="Índice Cardíaco"
      icon={<TrendingUp className="w-4 h-4" />}
      formula="IC = DC / SC (normal 2.5–4.0 L/min/m²)"
      definition="O Índice Cardíaco normaliza o débito cardíaco pela superfície corporal, permitindo comparação entre pacientes de diferentes tamanhos."
      rationale="Avalia perfusão sistêmica. Essencial no choque cardiogênico e na monitorização hemodinâmica avançada."
    >
      <div className="grid grid-cols-2 gap-3">
        <CalcField label="Altura" {...register("altura")} error={errors.altura?.message as string} unit="cm" />
        <CalcField label="Peso" {...register("peso")} error={errors.peso?.message as string} unit="kg" />
      </div>
      <CalcField label="DC (ou calcular abaixo)" {...register("dc")} error={errors.dc?.message as string} unit="L/min" placeholder="ex: 5.0" />
      <div className="grid grid-cols-2 gap-3">
        <CalcField label="FC" {...register("fc")} error={errors.fc?.message as string} unit="bpm" />
        <CalcField label="Vol. Sistólico" {...register("vs")} error={errors.vs?.message as string} unit="mL" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CalcResult label="SC (Mosteller)" value={scCalc?.toFixed(2) ?? null} unit="m²" />
        <CalcResult label="Índice Cardíaco" value={ic} unit="L/min/m²" status={status} />
      </div>
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default IndiceCardiacoCalc;
