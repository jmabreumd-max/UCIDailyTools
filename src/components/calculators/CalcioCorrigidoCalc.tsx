import { useState, useMemo } from "react";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Droplets } from "lucide-react";
import { z } from "zod";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const CalcioCorrigidoCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const [calcio, setCalcio] = useState(defaultValues?.calcio || "");
  const [albumina, setAlbumina] = useState(defaultValues?.albumina || "");

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
        <CalcField label="Cálcio Total" value={calcio} onChange={setCalcio} unit="mg/dL" min={2.0} max={20.0} />
        <CalcField label="Albumina" value={albumina} onChange={setAlbumina} unit="g/dL" min={0.5} max={8.0} />
      </div>
      <CalcResult label="Cálcio Corrigido" value={resultado} unit="mg/dL" status={status} />
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default CalcioCorrigidoCalc;
