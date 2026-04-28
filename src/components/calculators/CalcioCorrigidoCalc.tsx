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

const CalcioCorrigidoCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const p = usePatient();

  const calcSchema = z.object({
    calcio: calcFieldValidator(2.0, 20.0),
  albumina: calcFieldValidator(0.5, 8.0),
  });
  const form = useCalculatorForm(calcSchema, {
    calcio: { global: p.calcioTotal, setGlobal: p.setCalcioTotal },
    albumina: { global: p.albumina, setGlobal: p.setAlbumina }
  });
  const { register, formState: { errors } } = form;
  const calcio = form.watch("calcio");
  const albumina = form.watch("albumina");
  
  
  

  const resultado = useMemo(() => {
    const ca = parseFloat(calcio);
    const alb = parseFloat(albumina);
    if (!ca || !alb) return null;
    return (ca + 0.8 * (4 - alb)).toFixed(1);
  }, [calcio, albumina]);

  const status = useMemo(() => {
    if (!resultado) return undefined;
    const r = parseFloat(resultado);
    if (r < 8.5) return "danger" as const;
    if (r > 10.5) return "warning" as const;
    return "normal" as const;
  }, [resultado]);

  const interpretation = useMemo(() => {
    if (!resultado) return null;
    const r = parseFloat(resultado);
    if (r < 7.5) return "Hipocalcemia grave (< 7.5). Risco de arritmias, convulsões e laringospasmo. Repor com gluconato de cálcio IV. Monitorizar ECG (QT longo).";
    if (r < 8.5) return "Hipocalcemia (8.5–7.5). Avaliar Mg²⁺ (hipomagnesemia impede correção), vitamina D e PTH. Repor cálcio conforme gravidade.";
    if (r <= 10.5) return "Cálcio corrigido normal (8.5–10.5 mg/dL). Sem necessidade de intervenção.";
    if (r <= 12) return "Hipercalcemia leve (10.5–12). Investigar causa: hiperparatireoidismo, neoplasia. Hidratação vigorosa com SF 0,9%.";
    return "Hipercalcemia grave (> 12). Risco de arritmias, rebaixamento. Hidratação agressiva, calcitonina, considerar bifosfonato e diálise.";
  }, [resultado]);

  return (
    <CalculatorCard
      title="Cálcio Corrigido"
      icon={<Droplets className="w-4 h-4" />}
      formula="Ca + 0.8 × (4 - Albumina)"
      definition="O cálcio corrigido ajusta o cálcio total pela albumina sérica, estimando o cálcio iônico quando este não está disponível."
      rationale="Na hipoalbuminemia (comum em UTI), o cálcio total subestima o valor real. A correção evita tratamento desnecessário ou omissão de reposição."
    >
      <div className="grid grid-cols-2 gap-3">
        <CalcField label="Cálcio Total" {...register("calcio")} error={errors.calcio?.message as string} unit="mg/dL" min={2.0} max={20.0} />
        <CalcField label="Albumina" {...register("albumina")} error={errors.albumina?.message as string} unit="g/dL" min={0.5} max={8.0} />
      </div>
      <CalcResult label="Cálcio Corrigido" value={resultado} unit="mg/dL" status={status} />
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default CalcioCorrigidoCalc;
