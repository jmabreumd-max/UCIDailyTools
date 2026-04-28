import { useState, useMemo } from "react";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { User } from "lucide-react";
import { z } from "zod";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const PesoIdealCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const [altura, setAltura] = useState(defaultValues?.altura || "");
  const [sexo, setSexo] = useState<"M" | "F">("M");

  const resultado = useMemo(() => {
    const h = parseFloat(altura);
    if (!h || h < 100 || h > 250) return null;
    const hInch = h / 2.54;
    if (sexo === "M") return (50 + 2.3 * (hInch - 60)).toFixed(1);
    return (45.5 + 2.3 * (hInch - 60)).toFixed(1);
  }, [altura, sexo]);

  const vc = resultado ? (parseFloat(resultado) * 6).toFixed(0) + " – " + (parseFloat(resultado) * 8).toFixed(0) : null;

  const interpretation = useMemo(() => {
    if (!resultado) return null;
    const pi = parseFloat(resultado);
    const vcMin = (pi * 6).toFixed(0);
    const vcMax = (pi * 8).toFixed(0);
    return `Peso ideal: ${pi} kg. Volume corrente protetor: ${vcMin}–${vcMax} mL (6–8 mL/kg IBW). Em SDRA, usar 6 mL/kg. NUNCA usar peso atual para calcular VC — risco de volutrauma em obesos.`;
  }, [resultado]);

  return (
    <CalculatorCard
      title="Peso Ideal & Volume Corrente"
      icon={<User className="w-4 h-4" />}
      formula="♂ 50 + 2.3×(pol-60) | ♀ 45.5 + 2.3×(pol-60)"
      definition="O peso ideal (IBW) é baseado na altura e sexo (fórmula de Devine). É a referência para calcular o volume corrente na ventilação mecânica protetora."
      rationale="O VC deve ser indexado ao peso ideal (6–8 mL/kg IBW), não ao peso real. Isso previne lesão pulmonar induzida pelo ventilador (VILI), especialmente em obesos."
    >
      <div className="flex gap-2">
        <button
          onClick={() => setSexo("M")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            sexo === "M"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          ♂ Masculino
        </button>
        <button
          onClick={() => setSexo("F")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            sexo === "F"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          ♀ Feminino
        </button>
      </div>
      <CalcField label="Altura" value={altura} onChange={setAltura} unit="cm" />
      <div className="grid grid-cols-2 gap-3">
        <CalcResult label="Peso Ideal" value={resultado} unit="kg" />
        <CalcResult label="VC (6-8 ml/kg)" value={vc} unit="ml" />
      </div>
      {interpretation && <Interpretation text={interpretation} />}
    </CalculatorCard>
  );
};

export default PesoIdealCalc;
