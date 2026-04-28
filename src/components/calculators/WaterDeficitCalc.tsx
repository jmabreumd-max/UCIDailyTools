import { calcFieldValidator } from "@/utils/validation";
import {  useMemo  } from "react";
import { z } from "zod";
import { useCalculatorForm } from "@/hooks/useCalculatorForm";
import { usePatient } from "@/contexts/PatientContext";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Waves } from "lucide-react";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const WaterDeficitCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const p = usePatient();

  const calcSchema = z.object({
    peso: calcFieldValidator(),
  naAtual: calcFieldValidator(),
  sexo: z.string().optional()
  });
  const form = useCalculatorForm(calcSchema, {
    peso: { global: p.pesoAtual, setGlobal: p.setPesoAtual }
  });
  const { register, formState: { errors }, watch, setValue } = form;
  const peso = watch("peso");
  const naAtual = watch("naAtual");
  const sexo = watch("sexo") ?? "M";
  
  
  
  

  const resultado = useMemo(() => {
    const p = parseFloat(peso);
    const na = parseFloat(naAtual);
    if (!p || !na) return null;
    const fator = sexo === "M" ? 0.6 : 0.5;
    const deficit = fator * p * ((na / 140) - 1);
    return deficit.toFixed(1);
  }, [peso, naAtual, sexo]);

  const status = useMemo(() => {
    if (!resultado) return undefined;
    const r = parseFloat(resultado);
    if (r > 5) return "danger" as const;
    if (r > 3) return "warning" as const;
    return "normal" as const;
  }, [resultado]);

  const interpretation = useMemo(() => {
    if (!resultado) return null;
    const r = parseFloat(resultado);
    const na = parseFloat(naAtual);
    if (r <= 0) return "Sem déficit de água livre. Na⁺ ≤ 140 mEq/L — não há hipernatremia a corrigir.";
    const rateMax = "Correção máxima: 10–12 mEq/L em 24h (crônica) ou 1–2 mEq/h nas primeiras horas (aguda).";
    if (na > 160) return `Déficit de ${r} L — hipernatremia grave (Na⁺ > 160). Repor água livre com SG 5% ou água via enteral. ${rateMax} Risco de edema cerebral se correção rápida.`;
    if (na > 150) return `Déficit de ${r} L — hipernatremia moderada. Repor gradualmente com fluidos hipotônicos. ${rateMax}`;
    return `Déficit de ${r} L — hipernatremia leve. Repor via enteral (preferência) ou SG 5% IV. ${rateMax}`;
  }, [resultado, naAtual]);

  return (
    <CalculatorCard
      title="Déficit de Água Livre"
      icon={<Waves className="w-4 h-4" />}
      formula="Fator × Peso × (Na/140 - 1)"
      definition="Estima o volume de água livre necessário para corrigir hipernatremia, baseado na água corporal total e no Na⁺ atual."
      rationale="Guia reposição de água livre na hipernatremia. A correção deve ser gradual (máx 10–12 mEq/24h) para evitar edema cerebral."
    >
      <div className="flex gap-2">
        <button
          onClick={() => setValue("sexo", "M")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            sexo === "M"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          ♂ (0.6)
        </button>
        <button
          onClick={() => setValue("sexo", "F")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            sexo === "F"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          ♀ (0.5)
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CalcField label="Peso" {...register("peso")} error={errors.peso?.message as string} unit="kg" />
        <CalcField label="Na⁺ atual" {...register("naAtual")} error={errors.naAtual?.message as string} unit="mEq/L" />
      </div>
      <CalcResult label="Déficit de Água Livre" value={resultado} unit="L" status={status} />
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default WaterDeficitCalc;
