import { calcFieldValidator } from "@/utils/validation";
import {  useMemo  } from "react";
import { z } from "zod";
import { useCalculatorForm } from "@/hooks/useCalculatorForm";
import { usePatient } from "@/contexts/PatientContext";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Thermometer } from "lucide-react";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const SodioCorrigidoCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const p = usePatient();

  const calcSchema = z.object({
    sodio: calcFieldValidator(),
  glicemia: calcFieldValidator(),
  });
  const form = useCalculatorForm(calcSchema, {
    sodio: { global: p.sodio, setGlobal: p.setSodio },
    glicemia: { global: p.glicemia, setGlobal: p.setGlicemia }
  });
  const { register, formState: { errors } } = form;
  const sodio = form.watch("sodio");
  const glicemia = form.watch("glicemia");
  
  
  

  const resultado = useMemo(() => {
    const na = parseFloat(sodio);
    const gli = parseFloat(glicemia);
    if (!na || !gli) return null;
    return (na + 1.6 * ((gli - 100) / 100)).toFixed(1);
  }, [sodio, glicemia]);

  const status = useMemo(() => {
    if (!resultado) return undefined;
    const r = parseFloat(resultado);
    if (r < 135) return "warning" as const;
    if (r > 145) return "danger" as const;
    return "normal" as const;
  }, [resultado]);

  const interpretation = useMemo(() => {
    if (!resultado) return null;
    const r = parseFloat(resultado);
    if (r < 130) return "Na⁺ corrigido < 130 — hiponatremia moderada a grave. Avaliar volemia, osmolaridade sérica e urinária. Se sintomática, considerar NaCl 3%.";
    if (r < 135) return "Na⁺ corrigido 130–134 — hiponatremia leve. Investigar causa (SIADH, hipovolemia, hipotireoidismo). Restrição hídrica se euvolêmico.";
    if (r <= 145) return "Na⁺ corrigido normal (135–145 mEq/L). O sódio medido pode estar falsamente baixo pela hiperglicemia.";
    return "Na⁺ corrigido > 145 — hipernatremia verdadeira mesmo com hiperglicemia. Repor déficit de água livre. Máximo correção: 10–12 mEq/24h.";
  }, [resultado]);

  return (
    <CalculatorCard
      title="Sódio Corrigido"
      icon={<Thermometer className="w-4 h-4" />}
      formula="Na + 1.6 × ((Glicemia - 100) / 100)"
      definition="O sódio corrigido pela glicose revela o Na⁺ verdadeiro em hiperglicemia, corrigindo o efeito osmótico dilucional da glicose elevada."
      rationale="Na hiperglicemia, o Na⁺ medido está falsamente baixo. A correção evita diagnóstico errôneo de hiponatremia e guia reposição adequada."
    >
      <div className="grid grid-cols-2 gap-3">
        <CalcField label="Na⁺ sérico" {...register("sodio")} error={errors.sodio?.message as string} unit="mEq/L" />
        <CalcField label="Glicemia" {...register("glicemia")} error={errors.glicemia?.message as string} unit="mg/dL" />
      </div>
      <CalcResult label="Na⁺ Corrigido" value={resultado} unit="mEq/L" status={status} />
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default SodioCorrigidoCalc;
