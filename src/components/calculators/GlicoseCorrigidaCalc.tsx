import { calcFieldValidator } from "@/utils/validation";
import {  useMemo  } from "react";
import { z } from "zod";
import { useCalculatorForm } from "@/hooks/useCalculatorForm";
import { usePatient } from "@/contexts/PatientContext";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Droplets } from "lucide-react";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const GlicoseCorrigidaCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const p = usePatient();

  const calcSchema = z.object({
    glicose: calcFieldValidator(),
  sodio: calcFieldValidator(),
  });
  const form = useCalculatorForm(calcSchema, {
    glicose: { global: p.glicemia, setGlobal: p.setGlicemia },
    sodio: { global: p.sodio, setGlobal: p.setSodio }
  });
  const { register, formState: { errors } } = form;
  const glicose = form.watch("glicose");
  const sodio = form.watch("sodio");
  
  
  

  const naCorrResult = useMemo(() => {
    const gli = parseFloat(glicose);
    const na = parseFloat(sodio);
    if (!gli || !na) return null;
    const naCorr = na + 1.6 * ((gli - 100) / 100);
    return naCorr.toFixed(1);
  }, [glicose, sodio]);

  const deltaOsm = useMemo(() => {
    const gli = parseFloat(glicose);
    if (!gli) return null;
    return (gli / 18).toFixed(1);
  }, [glicose]);

  const status = useMemo(() => {
    if (!naCorrResult) return undefined;
    const r = parseFloat(naCorrResult);
    if (r < 135) return "warning" as const;
    if (r > 145) return "danger" as const;
    return "normal" as const;
  }, [naCorrResult]);

  const interpretation = useMemo(() => {
    const gli = parseFloat(glicose);
    const naCorr = naCorrResult ? parseFloat(naCorrResult) : null;
    if (!gli || !naCorr) return null;
    let text = "";
    if (naCorr < 135) text = `Na⁺ corrigido ${naCorr} — hiponatremia verdadeira (dilucional pela hiperglicemia + déficit real de Na⁺). `;
    else if (naCorr > 145) text = `Na⁺ corrigido ${naCorr} — hipernatremia. Há déficit de água livre mesmo com hiperglicemia. `;
    else text = `Na⁺ corrigido normal (${naCorr}). A hiponatremia é puramente dilucional pela hiperglicemia. `;
    if (gli > 250) text += "⚠️ Hiperglicemia grave — investigar cetoacidose diabética ou EHH. Corrigir glicemia e reavaliar Na⁺.";
    else if (gli > 180) text += "Hiperglicemia — considerar insulina. O Na⁺ tende a normalizar com correção da glicemia.";
    return text;
  }, [glicose, naCorrResult]);

  return (
    <CalculatorCard
      title="Correção Na⁺ pela Glicose"
      icon={<Droplets className="w-4 h-4" />}
      formula="Na + 1.6 × ((Gli - 100) / 100)"
      definition="Corrige o sódio sérico pelo efeito osmótico da hiperglicemia, que puxa água para o espaço extracelular diluindo o Na⁺."
      rationale="Evita diagnóstico errôneo de hiponatremia em cetoacidose/EHH. O Na⁺ verdadeiro pode estar normal ou elevado apesar de Na⁺ medido baixo."
    >
      <div className="grid grid-cols-2 gap-3">
        <CalcField label="Glicemia" {...register("glicose")} error={errors.glicose?.message as string} unit="mg/dL" />
        <CalcField label="Na⁺ sérico" {...register("sodio")} error={errors.sodio?.message as string} unit="mEq/L" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CalcResult label="Na⁺ Corrigido" value={naCorrResult} unit="mEq/L" status={status} />
        <CalcResult label="Contribuição Osm Glicose" value={deltaOsm} unit="mOsm/L" />
      </div>
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default GlicoseCorrigidaCalc;
