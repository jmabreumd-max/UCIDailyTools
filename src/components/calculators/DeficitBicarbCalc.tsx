import { calcFieldValidator } from "@/utils/validation";
import {  useMemo  } from "react";
import { z } from "zod";
import { useCalculatorForm } from "@/hooks/useCalculatorForm";
import { usePatient } from "@/contexts/PatientContext";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Minus } from "lucide-react";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const DeficitBicarbCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const p = usePatient();

  const calcSchema = z.object({
    peso: calcFieldValidator(),
    hco3Atual: calcFieldValidator(),
    hco3Desejado: calcFieldValidator(),
  });
  const form = useCalculatorForm(calcSchema, {
    peso: { global: p.pesoAtual, setGlobal: p.setPesoAtual }
  });
  
  // Set default manually if not synced or provided via schema defaults
  // Actually, wait, useCalculatorForm supports defaultValues. But easier to do local state or just provide a default value effect.
  // We can just use setValue if it's empty, but the easiest is just having the schema... let's just make sure it's watched.
  const { register, formState: { errors }, watch, setValue } = form;
  const peso = watch("peso");
  const hco3Atual = watch("hco3Atual");
  const hco3Desejado = watch("hco3Desejado") ?? "24";

  const resultado = useMemo(() => {
    const p = parseFloat(peso);
    const atual = parseFloat(hco3Atual);
    const desejado = parseFloat(hco3Desejado);
    if (!p || !atual || !desejado) return null;
    return (0.3 * p * (desejado - atual)).toFixed(1);
  }, [peso, hco3Atual, hco3Desejado]);

  const mlBic84 = useMemo(() => {
    if (!resultado) return null;
    return parseFloat(resultado).toFixed(0);
  }, [resultado]);

  const interpretation = useMemo(() => {
    if (!resultado || !mlBic84) return null;
    const mEq = parseFloat(resultado);
    if (mEq <= 0) return "HCO₃ atual ≥ alvo — sem déficit de bicarbonato. Não há indicação de reposição.";
    const ml = parseFloat(mlBic84);
    const metade = (ml / 2).toFixed(0);
    return `Déficit de ${mEq.toFixed(0)} mEq. Repor ${metade} mL de NaHCO₃ 8,4% (1 mEq/mL) em 4–6h (50% do déficit). Reavaliar gasometria antes de completar. Infundir diluído em acesso central. Atenção: risco de hipernatremia e hipocalemia.`;
  }, [resultado, mlBic84]);

  const status = useMemo(() => {
    if (!resultado) return undefined;
    const mEq = parseFloat(resultado);
    if (mEq > 100) return "danger" as const;
    if (mEq > 50) return "warning" as const;
    return "normal" as const;
  }, [resultado]);

  return (
    <CalculatorCard
      title="Déficit de Bicarbonato"
      icon={<Minus className="w-4 h-4" />}
      formula="0.3 × Peso × (HCO₃ desejado - HCO₃ atual)"
      definition="Calcula a quantidade de bicarbonato necessária para corrigir acidose metabólica, estimando o espaço de distribuição do HCO₃⁻."
      rationale="Guia a reposição de NaHCO₃ em acidose metabólica grave (pH < 7.1). Reposição deve ser parcial (50%) com reavaliação gasométrica."
    >
      <div className="grid grid-cols-3 gap-2">
        <CalcField label="Peso" {...register("peso")} error={errors.peso?.message as string} unit="kg" />
        <CalcField label="HCO₃ atual" {...register("hco3Atual")} error={errors.hco3Atual?.message as string} unit="mEq/L" />
        <CalcField label="HCO₃ alvo" {...register("hco3Desejado")} error={errors.hco3Desejado?.message as string} unit="mEq/L" placeholder="24" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CalcResult label="Déficit" value={resultado} unit="mEq" status={status} />
        <CalcResult label="NaHCO₃ 8,4%" value={mlBic84} unit="mL" />
      </div>
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default DeficitBicarbCalc;
