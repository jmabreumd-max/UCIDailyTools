import { useEffect } from "react";
import { useForm, UseFormProps, FieldValues, Path, PathValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

export function useCalculatorForm<T extends FieldValues>(
  schema: z.ZodType<T>,
  bindings: Partial<Record<keyof T, { global: string; setGlobal: (v: string) => void }>>
) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: "onChange",
    // We start with values derived from global bindings
    defaultValues: Object.keys(bindings).reduce((acc, key) => {
      const b = bindings[key as keyof T];
      if (b) {
        acc[key as keyof T] = (b.global || "") as any;
      }
      return acc;
    }, {} as any),
  });

  const { watch, setValue } = form;

  // Watch all values
  const values = watch();

  // Sync LOCAL -> GLOBAL
  useEffect(() => {
    Object.keys(bindings).forEach((key) => {
      const binding = bindings[key as keyof T];
      const localVal = values[key as keyof T];
      if (binding && typeof localVal === "string" && localVal !== binding.global) {
        binding.setGlobal(localVal);
      }
    });
  }, [values, bindings]);

  // Sync GLOBAL -> LOCAL
  useEffect(() => {
    Object.keys(bindings).forEach((key) => {
      const binding = bindings[key as keyof T];
      const localVal = values[key as keyof T];
      if (binding && binding.global !== localVal && typeof binding.global === "string") {
        setValue(key as Path<T>, binding.global as PathValue<T, Path<T>>, {
          shouldValidate: true,
        });
      }
    });
  }, [bindings, setValue, values]);

  return form;
}
