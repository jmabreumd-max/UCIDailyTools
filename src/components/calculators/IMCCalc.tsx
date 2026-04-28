import { calcFieldValidator } from "@/utils/validation";
import {  useMemo  } from "react";
import { z } from "zod";
import { useCalculatorForm } from "@/hooks/useCalculatorForm";
import { usePatient } from "@/contexts/PatientContext";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Scale } from "lucide-react";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const IMCCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const p = usePatient();

  const calcSchema = z.object({
    peso: calcFieldValidator(),
  altura: calcFieldValidator(),
  });
  const form = useCalculatorForm(calcSchema, {
    peso: { global: p.pesoAtual, setGlobal: p.setPesoAtual },
    altura: { global: p.altura, setGlobal: p.setAltura }
  });
  const { register, formState: { errors } } = form;
  const peso = form.watch("peso");
  const altura = form.watch("altura");
  
  
  

  const resultado = useMemo(() => {
    const p = parseFloat(peso);
    const h = parseFloat(altura);
    if (!p || !h || h <= 0) return null;
    return (p / ((h / 100) ** 2)).toFixed(1);
  }, [peso, altura]);

  const classificacao = useMemo(() => {
    if (!resultado) return null;
    const r = parseFloat(resultado);
    if (r < 18.5) return { text: "Abaixo do peso", status: "warning" as const };
    if (r < 25) return { text: "Eutrófico", status: "normal" as const };
    if (r < 30) return { text: "Sobrepeso", status: "warning" as const };
    if (r < 35) return { text: "Obesidade I", status: "warning" as const };
    if (r < 40) return { text: "Obesidade II", status: "danger" as const };
    return { text: "Obesidade III", status: "danger" as const };
  }, [resultado]);

  const interpretation = useMemo(() => {
    if (!resultado) return null;
    const r = parseFloat(resultado);
    if (r < 16) return "IMC < 16 — desnutrição grave. Alto risco de síndrome de realimentação. Iniciar nutrição com 10 kcal/kg/dia e repor tiamina, fósforo, potássio e magnésio.";
    if (r < 18.5) return "IMC < 18.5 — desnutrição. Usar peso atual para cálculo nutricional. Atenção à síndrome de realimentação. Meta calórica progressiva.";
    if (r < 25) return "IMC 18.5–24.9 — eutrófico. Usar peso ideal para cálculo de VC. Meta nutricional padrão (25–30 kcal/kg/d).";
    if (r < 30) return "IMC 25–29.9 — sobrepeso. Usar peso ideal para VM. Nutrição com 25 kcal/kg peso ideal.";
    if (r < 35) return "IMC 30–34.9 — obesidade grau I. Usar peso ajustado para nutrição (PI + 0.25×(Atual−PI)). VC por peso ideal. Atenção à via aérea difícil.";
    if (r < 40) return "IMC 35–39.9 — obesidade grau II. Peso ajustado para nutrição. 11–14 kcal/kg peso atual ou 22–25 kcal/kg peso ideal. Proteína 2 g/kg peso ideal.";
    return "IMC ≥ 40 — obesidade mórbida. Usar peso ajustado. Calorias: 11–14 kcal/kg peso atual. Proteína elevada (≥ 2 g/kg PI). Risco aumentado de VM prolongada e VAP.";
  }, [resultado]);

  return (
    <CalculatorCard
      title="IMC"
      icon={<Scale className="w-4 h-4" />}
      formula="Peso / Altura²"
      definition="O Índice de Massa Corporal classifica o estado nutricional e orienta escolha do peso para cálculos em terapia intensiva."
      rationale="Define se usar peso atual (desnutrição), peso ideal (eutrófico) ou peso ajustado (obesidade) para nutrição e ventilação mecânica."
    >
      <div className="grid grid-cols-2 gap-3">
        <CalcField label="Peso" {...register("peso")} error={errors.peso?.message as string} unit="kg" />
        <CalcField label="Altura" {...register("altura")} error={errors.altura?.message as string} unit="cm" />
      </div>
      <CalcResult label="IMC" value={resultado} unit="kg/m²" status={classificacao?.status} />
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

export default IMCCalc;
