import { calcFieldValidator } from "@/utils/validation";
import {  useMemo  } from "react";
import { z } from "zod";
import { useCalculatorForm } from "@/hooks/useCalculatorForm";
import { usePatient } from "@/contexts/PatientContext";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Beaker } from "lucide-react";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const OsmolaridadeCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const p = usePatient();

  const calcSchema = z.object({
    na: calcFieldValidator(),
  glicemia: calcFieldValidator(),
  ureia: calcFieldValidator(),
  });
  const form = useCalculatorForm(calcSchema, {
    na: { global: p.sodio, setGlobal: p.setSodio },
    glicemia: { global: p.glicemia, setGlobal: p.setGlicemia },
    ureia: { global: p.ureia, setGlobal: p.setUreia }
  });
  const { register, formState: { errors } } = form;
  const na = form.watch("na");
  const glicemia = form.watch("glicemia");
  const ureia = form.watch("ureia");
  
  
  
  

  const resultado = useMemo(() => {
    const n = parseFloat(na);
    const g = parseFloat(glicemia);
    const u = parseFloat(ureia);
    if (!n) return null;
    const gli = g ? g / 18 : 0;
    const ur = u ? u / 6 : 0;
    return (2 * n + gli + ur).toFixed(0);
  }, [na, glicemia, ureia]);

  const status = useMemo(() => {
    if (!resultado) return undefined;
    const r = parseFloat(resultado);
    if (r < 275) return "warning" as const;
    if (r > 295) return "danger" as const;
    return "normal" as const;
  }, [resultado]);

  const interpretation = useMemo(() => {
    if (!resultado) return null;
    const r = parseFloat(resultado);
    if (r < 275) return "Osm < 275 — hipo-osmolaridade. Associada a hiponatremia hipotônica. Avaliar SIADH, hipotireoidismo, insuficiência adrenal. Restrição hídrica se euvolêmico.";
    if (r <= 295) return "Osmolaridade normal (275–295 mOsm/L). Estado osmolar equilibrado.";
    if (r <= 320) return "Osm 296–320 — hiper-osmolaridade moderada. Pensar em hiperglicemia, hipernatremia ou acúmulo de solutos. Hidratar e investigar causa.";
    return "Osm > 320 — hiper-osmolaridade grave. Alto risco de Estado Hiperosmolar Hiperglicêmico (EHH) ou hipernatremia grave. Hidratação agressiva, correção gradual.";
  }, [resultado]);

  return (
    <CalculatorCard
      title="Osmolaridade Sérica"
      icon={<Beaker className="w-4 h-4" />}
      formula="2×Na + Gli/18 + Ureia/6"
      definition="A osmolaridade sérica calculada estima a concentração total de solutos no plasma. Reflete o estado de hidratação e equilíbrio osmolar."
      rationale="Essencial para diagnóstico de EHH, hiponatremia e avaliação do gap osmolar (osmolaridade medida vs calculada) na intoxicação."
    >
      <div className="grid grid-cols-3 gap-2">
        <CalcField label="Na⁺" {...register("na")} error={errors.na?.message as string} unit="mEq/L" />
        <CalcField label="Glicemia" {...register("glicemia")} error={errors.glicemia?.message as string} unit="mg/dL" />
        <CalcField label="Ureia" {...register("ureia")} error={errors.ureia?.message as string} unit="mg/dL" />
      </div>
      <CalcResult label="Osmolaridade" value={resultado} unit="mOsm/L" status={status} />
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default OsmolaridadeCalc;
