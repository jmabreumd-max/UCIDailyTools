import { calcFieldValidator } from "@/utils/validation";
import {  useMemo  } from "react";
import { z } from "zod";
import { useCalculatorForm } from "@/hooks/useCalculatorForm";
import { usePatient } from "@/contexts/PatientContext";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { FlaskConical } from "lucide-react";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const ClearanceCreatCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const p = usePatient();

  const calcSchema = z.object({
    idade: calcFieldValidator(),
  peso: calcFieldValidator(),
  creatinina: calcFieldValidator(),
  sexo: z.string().optional()
  });
  const form = useCalculatorForm(calcSchema, {
    idade: { global: p.idade, setGlobal: p.setIdade },
    peso: { global: p.pesoAtual, setGlobal: p.setPesoAtual },
    creatinina: { global: p.creatinina, setGlobal: p.setCreatinina },
    sexo: { global: p.sexo, setGlobal: p.setSexo }
  });
  const { register, formState: { errors }, watch, setValue } = form;
  const idade = watch("idade");
  const peso = watch("peso");
  const creatinina = watch("creatinina");
  const sexo = watch("sexo") ?? "M";
  
  
  
  
  

  const resultado = useMemo(() => {
    const i = parseFloat(idade);
    const p = parseFloat(peso);
    const cr = parseFloat(creatinina);
    if (!i || !p || !cr || cr <= 0) return null;
    const base = ((140 - i) * p) / (72 * cr);
    return (sexo === "F" ? base * 0.85 : base).toFixed(1);
  }, [idade, peso, creatinina, sexo]);

  const status = useMemo(() => {
    if (!resultado) return undefined;
    const r = parseFloat(resultado);
    if (r < 15) return "danger" as const;
    if (r < 60) return "warning" as const;
    return "normal" as const;
  }, [resultado]);

  const interpretation = useMemo(() => {
    if (!resultado) return null;
    const r = parseFloat(resultado);
    if (r >= 90) return "ClCr ≥ 90 mL/min — função renal normal (estágio G1). Sem necessidade de ajuste de dose.";
    if (r >= 60) return "ClCr 60–89 — DRC estágio G2 (leve). Monitorizar progressão. Ajustar aminoglicosídeos e vancomicina.";
    if (r >= 30) return "ClCr 30–59 — DRC estágio G3 (moderada). Ajustar doses de antibióticos, anticoagulantes e outras drogas nefrotóxicas.";
    if (r >= 15) return "ClCr 15–29 — DRC estágio G4 (grave). Avaliar preparo para terapia renal substitutiva. Ajuste rigoroso de todas as medicações.";
    return "ClCr < 15 mL/min — DRC estágio G5 (falência renal). Indicação de diálise. Evitar drogas nefrotóxicas.";
  }, [resultado]);

  return (
    <CalculatorCard
      title="Clearance de Creatinina"
      icon={<FlaskConical className="w-4 h-4" />}
      formula="Cockcroft-Gault: (140-idade)×peso / 72×Cr"
      definition="O clearance de creatinina estima a taxa de filtração glomerular (TFG), refletindo a função renal e a capacidade de depuração de fármacos."
      rationale="Essencial para ajuste de dose de medicamentos com excreção renal (vancomicina, aminoglicosídeos, anticoagulantes) e estadiamento de DRC."
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
          ♂ Masculino
        </button>
        <button
          onClick={() => setValue("sexo", "F")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            sexo === "F"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          ♀ Feminino
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <CalcField label="Idade" {...register("idade")} error={errors.idade?.message as string} unit="anos" />
        <CalcField label="Peso" {...register("peso")} error={errors.peso?.message as string} unit="kg" />
        <CalcField label="Creatinina" {...register("creatinina")} error={errors.creatinina?.message as string} unit="mg/dL" />
      </div>
      <CalcResult label="ClCr" value={resultado} unit="mL/min" status={status} />
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default ClearanceCreatCalc;
