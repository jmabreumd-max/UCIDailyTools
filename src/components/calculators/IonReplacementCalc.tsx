import { calcFieldValidator } from "@/utils/validation";
import React, { useMemo } from "react";
import { useCalculatorForm } from "@/hooks/useCalculatorForm";
import { usePatient } from "@/contexts/PatientContext";
import CalcField from "../CalcField";
import InfoTooltip from "../InfoTooltip";
import CollapsibleSection from "../CollapsibleSection";
import Interpretation from "../Interpretation";
import { AlertCircle } from "lucide-react";
import { z } from "zod";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

export default function IonReplacementCalc({ schema, defaultValues }: CalculatorProps = {}) {
  const { pesoAtual } = usePatient();
  const peso = parseFloat(pesoAtual) || 0;

  const calcSchema = z.object({
    naAtual: calcFieldValidator(),
    naAlvo: calcFieldValidator(),
    kAtual: calcFieldValidator(),
    kAlvo: calcFieldValidator(),
  });

  const form = useCalculatorForm(calcSchema, {});
  const { register, formState: { errors } } = form;
  
  const naAtual = form.watch("naAtual");
  const naAlvo = form.watch("naAlvo");
  const kAtual = form.watch("kAtual");
  const kAlvo = form.watch("kAlvo");

  const tbw = peso * 0.6; // Simplified Total Body Water (0.6 for men, usually 0.5 for women)

  // Sodium calculation
  const naResult = useMemo(() => {
    const current = parseFloat(naAtual || "");
    const target = parseFloat(naAlvo || "");
    if (!current || !target || !peso || target <= current) return null;

    const deficit = tbw * (target - current);
    
    // Safety check (max 8mEq/L in 24h to avoid ODS)
    const isUnsafe = (target - current) > 8;

    return {
      deficit: deficit.toFixed(1),
      nacl09: Math.round(deficit / 0.154),
      nacl3: Math.round(deficit / 0.513),
      nacl20: Math.round(deficit / 3.42),
      isUnsafe
    };
  }, [naAtual, naAlvo, tbw, peso]);

  // Potassium calculation
  const kResult = useMemo(() => {
    const current = parseFloat(kAtual || "");
    const target = parseFloat(kAlvo || "");
    if (!current || !target || !peso || target <= current) return null;

    const deficit = 0.4 * peso * (target - current);
    
    return {
      deficit: deficit.toFixed(1),
      maxRate: 10,
      maxRateCentral: 20
    };
  }, [kAtual, kAlvo, peso]);


  return (
    <CollapsibleSection title="Reposição Iónica e Eletrólitos" info={<InfoTooltip formula="Cálculos de défice de Sódio (Na) e Potássio (K)" reference="Sódio Máx Correção: 8 mEq/L/24h" />}>
      {!peso ? (
        <div className="text-[10px] text-warning bg-warning/10 p-2 rounded border border-warning/20 mb-3 flex gap-1 items-center">
          <AlertCircle className="w-3 h-3 min-w-[12px]" />
          Adicione o peso Atual na aba Geral para usar as fórmulas de eletrólitos.
        </div>
      ) : null}

      {/* Sódio */}
      <div className="bg-muted/20 border border-border rounded-lg p-3 mb-3">
        <h3 className="text-[12px] font-bold text-primary mb-2">Correção de Hiponatremia</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <CalcField label="Sódio (Na) Atual" {...register("naAtual")} error={errors.naAtual?.message as string} unit="mEq/L" />
          <CalcField label="Sódio (Na) Alvo" {...register("naAlvo")} error={errors.naAlvo?.message as string} unit="mEq/L" />
        </div>
        
        {naResult && (
          <div className="bg-primary/5 border border-primary/20 rounded p-2 text-[11px]">
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Défice de Sódio (Na)</span>
              <span className="font-bold text-primary">{naResult.deficit} mEq</span>
            </div>
            
            {naResult.isUnsafe && (
              <div className="text-destructive bg-destructive/10 px-2 py-1 flex items-center gap-1 rounded mt-1 mb-2 font-medium">
                <AlertCircle className="w-3 h-3" />
                Risco Osmótico! Correção &gt; 8 mEq/L em 24h. Ajuste o Alvo.
              </div>
            )}
            
            <p className="text-[10px] text-muted-foreground mt-2 mb-1 font-semibold">Volume para correção total (escolher um):</p>
            <div className="grid grid-cols-3 gap-1 text-center font-mono text-[9px]">
              <div className="bg-muted/50 rounded py-1 border border-border">
                <span className="block opacity-70">NaCl 0.9%</span>
                <span className="font-bold text-[10px]">{naResult.nacl09} mL</span>
              </div>
              <div className="bg-muted/50 rounded py-1 border border-border">
                <span className="block opacity-70">NaCl 3%</span>
                <span className="font-bold text-[10px]">{naResult.nacl3} mL</span>
              </div>
              <div className="bg-muted/50 rounded py-1 border border-border">
                <span className="block opacity-70">NaCl 20%</span>
                <span className="font-bold text-[10px]">{naResult.nacl20} mL</span>
              </div>
            </div>
            <p className="text-[9px] mt-1.5 opacity-60 mb-2">* Administrar de forma faseada conforme protocolo da unidade.</p>
            <Interpretation text={`A reposição salina corrige ativamente o déficit. Não exceder um aumento > 8 mEq/L/24h devido ao risco de Síndrome de Desmielinização Osmótica. ${naResult.isUnsafe ? "⚠️ Risco: Correção solicitada superior ao limite seguro de 8mEq/24h." : "Alvo dentro da margem de segurança de 24h (< 8mEq/L)."}`} status={naResult.isUnsafe ? "danger" : "normal"} />
          </div>
        )}
      </div>

      {/* Potássio */}
      <div className="bg-muted/20 border border-border rounded-lg p-3">
        <h3 className="text-[12px] font-bold text-primary mb-2">Correção de Hipocaliemia</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <CalcField label="Potássio (K) Atual" {...register("kAtual")} error={errors.kAtual?.message as string} unit="mEq/L" />
          <CalcField label="Potássio (K) Alvo" {...register("kAlvo")} error={errors.kAlvo?.message as string} unit="mEq/L" />
        </div>

        {kResult && (
          <div className="bg-primary/5 border border-primary/20 rounded p-2 text-[11px]">
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Défice Estimado de K+</span>
              <span className="font-bold text-primary">{Math.round(parseFloat(kResult.deficit))} a {Math.round(parseFloat(kResult.deficit)*1.5)} mEq</span>
            </div>
            <div className="text-[9px] space-y-1 mt-1 font-mono bg-muted/30 p-1.5 rounded border border-border/50">
              <div className="flex justify-between"><span>KCl 7.45%:</span> <span>1 mL = 1 mEq</span></div>
              <div className="flex justify-between"><span>Vazão Máx Periférica:</span> <span className="text-warning">10 mEq/h</span></div>
              <div className="flex justify-between"><span>Vazão Máx Via Central:</span> <span className="text-destructive">20 mEq/h</span></div>
            </div>
            <div className="mt-2">
              <Interpretation text={`Potássio alvo: ${kAlvo}. A reposição de K+ deve ser lenta (< 10-20 mEq/h) pelas repercussões arrítmicas agudas. Aumentos rápidos (< 0.5 a 1 mEq/L) ocorrem imediatamente, mas as reservas intracelulares repõem-se de forma muito mais lenta. Reavaliar K+ a cada poucas horas.`} />
            </div>
          </div>
        )}
      </div>

    </CollapsibleSection>
  );
}

