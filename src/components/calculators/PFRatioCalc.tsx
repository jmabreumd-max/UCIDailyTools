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

const PFRatioCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const p = usePatient();

  const calcSchema = z.object({
    pao2: calcFieldValidator(),
  fio2: calcFieldValidator(),
  });
  const form = useCalculatorForm(calcSchema, {
    pao2: { global: p.pao2, setGlobal: p.setPao2 },
    fio2: { global: p.fio2, setGlobal: p.setFio2 }
  });
  const { register, formState: { errors } } = form;
  const pao2 = form.watch("pao2");
  const fio2 = form.watch("fio2");
  
  
  

  const resultado = useMemo(() => {
    const p = parseFloat(pao2);
    const f = parseFloat(fio2);
    if (!p || !f || f <= 0) return null;
    const fDecimal = f > 1 ? f / 100 : f;
    return (p / fDecimal).toFixed(0);
  }, [pao2, fio2]);

  const classificacao = useMemo(() => {
    if (!resultado) return null;
    const r = parseFloat(resultado);
    if (r >= 400) return { text: "Normal", status: "normal" as const };
    if (r >= 300) return { text: "SDRA Leve (Berlin)", status: "warning" as const };
    if (r >= 200) return { text: "SDRA Moderada (Berlin)", status: "warning" as const };
    if (r >= 100) return { text: "SDRA Grave (Berlin)", status: "danger" as const };
    return { text: "SDRA Muito Grave", status: "danger" as const };
  }, [resultado]);

  const interpretation = useMemo(() => {
    if (!resultado) return null;
    const r = parseFloat(resultado);
    if (r >= 400) return "P/F ≥ 400 — oxigenação normal. Sem critério para SDRA.";
    if (r >= 300) return "P/F 300–399 — SDRA leve (Berlin). Considerar PEEP ≥ 5, VC 6 mL/kg, FiO₂ ajustada para SpO₂ 92–96%.";
    if (r >= 200) return "P/F 200–299 — SDRA moderada. VM protetora obrigatória. Considerar prona se P/F < 150. Driving pressure ≤ 15.";
    if (r >= 100) return "P/F 100–199 — SDRA grave. Indicar posição prona ≥ 16h/dia, bloqueador neuromuscular, PEEP elevada. Considerar ECMO se refratário.";
    return "P/F < 100 — SDRA muito grave. Prona imediata, BNM, PEEP otimizada. Avaliar ECMO venovenosa se hipoxemia refratária.";
  }, [resultado]);

  return (
    <CalculatorCard
      title="Relação P/F"
      icon={<Wind className="w-4 h-4" />}
      formula="PaO₂ / FiO₂"
      definition="A relação PaO₂/FiO₂ quantifica a eficiência da troca gasosa pulmonar. É o critério central da definição de Berlin para SDRA."
      rationale="Classifica gravidade da SDRA, guia estratégia ventilatória (prona, PEEP, BNM) e indica necessidade de ECMO."
    >
      <div className="grid grid-cols-2 gap-3">
        <CalcField label="PaO₂" {...register("pao2")} error={errors.pao2?.message as string} unit="mmHg" />
        <CalcField label="FiO₂" {...register("fio2")} error={errors.fio2?.message as string} unit="%" placeholder="21-100" />
      </div>
      <CalcResult label="Relação P/F" value={resultado} status={classificacao?.status} />
      {classificacao && (
        <p className={`text-xs font-medium text-center ${
          classificacao.status === "danger" ? "text-destructive" :
          classificacao.status === "warning" ? "text-warning" : "text-success"
        }`}>
          {classificacao.text}
        </p>
      )}
      {interpretation && <Interpretation text={interpretation} status={classificacao?.status} />}
    </CalculatorCard>
  );
};

export default PFRatioCalc;
