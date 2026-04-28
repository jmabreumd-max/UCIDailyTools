import { calcFieldValidator } from "@/utils/validation";
import {  useMemo  } from "react";
import { z } from "zod";
import { useCalculatorForm } from "@/hooks/useCalculatorForm";
import { usePatient } from "@/contexts/PatientContext";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Pill } from "lucide-react";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const FenitoinaCorrigidaCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const p = usePatient();

  const calcSchema = z.object({
    albumina: calcFieldValidator(),
  fenitoina: calcFieldValidator(),
  });
  const form = useCalculatorForm(calcSchema, {
    albumina: { global: p.albumina, setGlobal: p.setAlbumina }
  });
  const { register, formState: { errors } } = form;
  const albumina = form.watch("albumina");
  const fenitoina = form.watch("fenitoina");
  
  
  

  const resultado = useMemo(() => {
    const f = parseFloat(fenitoina);
    const alb = parseFloat(albumina);
    if (!f || !alb) return null;
    return (f / (0.2 * alb + 0.1)).toFixed(1);
  }, [fenitoina, albumina]);

  const status = useMemo(() => {
    if (!resultado) return undefined;
    const r = parseFloat(resultado);
    if (r > 20) return "danger" as const;
    if (r < 10) return "warning" as const;
    return "normal" as const;
  }, [resultado]);

  const interpretation = useMemo(() => {
    if (!resultado) return null;
    const r = parseFloat(resultado);
    if (r > 20) return "Nível tóxico (> 20 mcg/mL). Risco de nistagmo, ataxia, disartria, arritmias e rebaixamento. Suspender dose, monitorizar ECG e nível sérico em 6–12h.";
    if (r < 10) return "Nível subterapêutico (< 10 mcg/mL). Risco de crises convulsivas não controladas. Considerar dose de ataque ou ajuste para cima. Verificar adesão.";
    return "Nível terapêutico (10–20 mcg/mL). Faixa adequada para controle de crises. Manter dose atual e monitorizar periodicamente.";
  }, [resultado]);

  return (
    <CalculatorCard
      title="Fenitoína Corrigida"
      icon={<Pill className="w-4 h-4" />}
      formula="Medida / (0.2 × Alb + 0.1)"
      definition="A fórmula de Winter-Tozer corrige o nível de fenitoína pela albumina sérica, estimando o nível real da fração livre em hipoalbuminemia."
      rationale="Na UTI, hipoalbuminemia é comum e eleva a fração livre de fenitoína. O nível total pode parecer normal mas estar tóxico. A correção evita sub ou superdosagem."
    >
      <div className="grid grid-cols-2 gap-3">
        <CalcField label="Fenitoína Medida" {...register("fenitoina")} error={errors.fenitoina?.message as string} unit="mcg/mL" />
        <CalcField label="Albumina" {...register("albumina")} error={errors.albumina?.message as string} unit="g/dL" />
      </div>
      <CalcResult label="Fenitoína Corrigida" value={resultado} unit="mcg/mL" status={status} />
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default FenitoinaCorrigidaCalc;
