import { useState, useMemo } from "react";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Utensils } from "lucide-react";

const NutricaoCalc = () => {
  const [sexo, setSexo] = useState<"M" | "F">("M");
  const [altura, setAltura] = useState("");
  const [pesoAtual, setPesoAtual] = useState("");
  const [propofolRate, setPropofolRate] = useState("");
  const [propofolConc, setPropofolConc] = useState<"1" | "2">("1");
  const [metaCal, setMetaCal] = useState("25");
  const [metaProt, setMetaProt] = useState("1.5");

  const ibw = useMemo(() => {
    const h = parseFloat(altura);
    if (!h || h < 100 || h > 250) return null;
    const hInch = h / 2.54;
    return sexo === "M"
      ? 50 + 2.3 * (hInch - 60)
      : 45.5 + 2.3 * (hInch - 60);
  }, [altura, sexo]);

  const imc = useMemo(() => {
    const p = parseFloat(pesoAtual);
    const h = parseFloat(altura);
    if (!p || !h) return null;
    return p / ((h / 100) ** 2);
  }, [pesoAtual, altura]);

  const pesoAjustado = useMemo(() => {
    const pa = parseFloat(pesoAtual);
    if (!ibw || !pa) return null;
    return ibw + 0.25 * (pa - ibw);
  }, [ibw, pesoAtual]);

  const pesoUsado = useMemo<{ valor: number; tipo: string } | null>(() => {
    const pa = parseFloat(pesoAtual);
    if (!ibw || !imc || !pa || !pesoAjustado) return null;
    if (imc < 18.5) {
      return { valor: pa, tipo: "Peso Atual (desnutrição)" };
    }
    if (imc >= 30) {
      return { valor: pesoAjustado, tipo: "Peso Ajustado (obesidade)" };
    }
    return { valor: ibw, tipo: "Peso Ideal" };
  }, [ibw, imc, pesoAtual, pesoAjustado]);

  // Propofol: 1% = 10mg/mL, 2% = 20mg/mL; veículo lipídico = 1.1 kcal/mL
  const propofolKcal = useMemo(() => {
    const rate = parseFloat(propofolRate);
    if (!rate) return null;
    // Propofol é em emulsão lipídica a 10% (1%) ou 20% (2%)
    // Cada mL da emulsão = 1.1 kcal
    const kcalPerDay = rate * 24 * 1.1;
    return kcalPerDay;
  }, [propofolRate]);

  const mc = parseFloat(metaCal) || 25;
  const mp = parseFloat(metaProt) || 1.5;

  const calTotal = useMemo(() => {
    if (!pesoUsado) return null;
    return pesoUsado.valor * mc;
  }, [pesoUsado, mc]);

  const calLiquida = useMemo(() => {
    if (!calTotal) return null;
    return calTotal - (propofolKcal || 0);
  }, [calTotal, propofolKcal]);

  const protTotal = useMemo(() => {
    if (!pesoUsado) return null;
    return pesoUsado.valor * mp;
  }, [pesoUsado, mp]);

  const interpretation = useMemo(() => {
    if (!calTotal || !protTotal || !pesoUsado) return null;
    let text = `Meta: ${calTotal.toFixed(0)} kcal/dia e ${protTotal.toFixed(0)} g proteína/dia (usando ${pesoUsado.tipo}: ${pesoUsado.valor.toFixed(1)} kg). `;
    if (mc <= 20) text += "Fase aguda (D1-D3): iniciar com 15–20 kcal/kg/dia e progredir em 3–5 dias. ";
    else text += "Fase estável: meta plena de 25–30 kcal/kg/dia. ";
    if (propofolKcal && propofolKcal > 0) {
      text += `Propofol contribui com ${propofolKcal.toFixed(0)} kcal/dia — descontar da dieta. `;
      if (calLiquida && calLiquida < 0) text += "⚠️ Propofol já excede a meta calórica — reduzir dieta ou considerar trocar sedação.";
    }
    return text;
  }, [calTotal, protTotal, pesoUsado, mc, propofolKcal, calLiquida]);

  return (
    <CalculatorCard
      title="Nutrição no Doente Crítico"
      icon={<Utensils className="w-4 h-4" />}
      definition="O suporte nutricional no doente crítico previne catabolismo proteico e melhora desfechos. A meta depende do peso adequado e da fase da doença."
      rationale="Iniciar nutrição enteral precoce (24–48h). Fase aguda: 15–20 kcal/kg. Estável: 25–30 kcal/kg. Proteína: 1.2–2.0 g/kg. Descontar calorias não-nutricionais (propofol, SG)."
    >
      {/* Sexo */}
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

      {/* Dados antropométricos */}
      <div className="grid grid-cols-2 gap-3">
        <CalcField label="Altura" value={altura} onChange={setAltura} unit="cm" />
        <CalcField label="Peso Atual" value={pesoAtual} onChange={setPesoAtual} unit="kg" />
      </div>

      {/* Pesos calculados */}
      {ibw && imc && pesoAjustado && pesoUsado && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 border border-border">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">IMC</span>
            <span className={`font-mono font-medium ${
              imc < 18.5 || imc >= 30 ? "text-warning" : "text-foreground"
            }`}>{imc.toFixed(1)} kg/m²</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Peso Ideal</span>
            <span className="font-mono text-foreground">{ibw.toFixed(1)} kg</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Peso Ajustado</span>
            <span className="font-mono text-foreground">{pesoAjustado.toFixed(1)} kg</span>
          </div>
          <div className="border-t border-border pt-1.5 flex justify-between text-[11px]">
            <span className="text-primary font-medium">→ Usar</span>
            <span className="text-primary font-mono font-semibold">
              {pesoUsado.valor.toFixed(1)} kg ({pesoUsado.tipo})
            </span>
          </div>
          {imc < 18.5 && (
            <p className="text-[10px] text-warning">IMC &lt;18.5: usar peso atual (desnutrição)</p>
          )}
          {imc >= 30 && (
            <p className="text-[10px] text-warning">
              IMC ≥30: usar peso ajustado = PI + 0.25×(Atual−PI)
            </p>
          )}
        </div>
      )}

      {/* Metas */}
      <div className="grid grid-cols-2 gap-3">
        <CalcField label="Meta calórica" value={metaCal} onChange={setMetaCal} unit="kcal/kg/d" />
        <CalcField label="Meta proteica" value={metaProt} onChange={setMetaProt} unit="g/kg/d" />
      </div>
      <p className="text-[10px] text-muted-foreground font-mono -mt-1">
        📌 Agudo: 15–20 kcal/kg | Estável: 25–30 kcal/kg | Proteína: 1.2–2.0 g/kg
      </p>

      {/* Propofol */}
      <div className="space-y-2">
        <label className="calc-label">Propofol em uso? (subtrai calorias lipídicas)</label>
        <div className="flex gap-2">
          <button
            onClick={() => setPropofolConc("1")}
            className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-all ${
              propofolConc === "1"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            1% (10mg/mL)
          </button>
          <button
            onClick={() => setPropofolConc("2")}
            className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-all ${
              propofolConc === "2"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            2% (20mg/mL)
          </button>
        </div>
        <CalcField label="Vazão Propofol" value={propofolRate} onChange={setPropofolRate} unit="mL/h" />
        {propofolKcal !== null && propofolKcal > 0 && (
          <p className="text-[10px] text-warning font-mono text-center">
            ⚡ Propofol: {propofolKcal.toFixed(0)} kcal/dia (1.1 kcal/mL de emulsão lipídica)
          </p>
        )}
      </div>

      {/* Resultados */}
      <div className="grid grid-cols-2 gap-3">
        <CalcResult label="Calorias totais/dia" value={calTotal?.toFixed(0) ?? null} unit="kcal" />
        <CalcResult
          label="Calorias líquidas"
          value={calLiquida?.toFixed(0) ?? null}
          unit="kcal"
          status={calLiquida && calLiquida < 0 ? "danger" : "normal"}
        />
      </div>
      <CalcResult label="Proteína total/dia" value={protTotal?.toFixed(0) ?? null} unit="g" />

      {interpretation && <Interpretation text={interpretation} status={calLiquida && calLiquida < 0 ? "danger" : "normal"} />}
    </CalculatorCard>
  );
};

export default NutricaoCalc;
