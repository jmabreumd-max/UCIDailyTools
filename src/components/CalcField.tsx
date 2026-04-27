import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";

interface CalcFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
  step?: number | string;
  schema?: z.ZodType<any>;
}

const CalcField = ({ 
  label, 
  value, 
  onChange, 
  unit, 
  placeholder, 
  type = "number",
  min,
  max,
  schema: customSchema 
}: CalcFieldProps) => {

  // Definir um esquema base usando Zod caso não seja fornecido um customizado
  const schema = customSchema || z.object({
    val: z.string().refine((val) => {
      if (!val) return true; // Permite vazio (reset)
      if (type === "number") {
        const num = parseFloat(val);
        if (isNaN(num)) return false;
        if (min !== undefined && num < min) return false;
        if (max !== undefined && num > max) return false;
      }
      return true;
    }, {
      message: min !== undefined && max !== undefined 
        ? `Valor entre ${min} e ${max}`
        : min !== undefined 
          ? `Mínimo ${min}`
          : max !== undefined
            ? `Máximo ${max}`
            : "Valor inválido"
    })
  });

  const { register, setValue, trigger, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { val: value },
    mode: "onChange"
  });

  // Manter o formulário interno sincronizado com o valor externo (Ex: Limpeza de formulário)
  useEffect(() => {
    setValue("val", value);
    if (value) {
      trigger("val");
    }
  }, [value, setValue, trigger]);

  const internalOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setValue("val", newVal, { shouldValidate: true });
    onChange(newVal);
  };

  return (
    <div>
      <label className="calc-label">{label}</label>
      <div className="relative">
        <input
          type={type}
          {...register("val")}
          value={value}
          onChange={internalOnChange}
          placeholder={placeholder || "0"}
          className={cn(
            "calc-input pr-12 transition-colors",
            errors.val && "border-red-500 focus:ring-red-500/40 focus:border-red-500"
          )}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
            {unit}
          </span>
        )}
      </div>
      {errors.val && (
        <span className="text-red-500 text-[10px] mt-1 block font-medium">
          {errors.val.message as string}
        </span>
      )}
    </div>
  );
};

export default CalcField;
