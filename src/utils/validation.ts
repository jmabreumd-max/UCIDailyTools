import { z } from "zod";

export const calcFieldValidator = (min?: number, max?: number) => {
  return z.string().optional().refine(val => {
    if (!val) return true; // keep empty string valid
    // also strings like "." or "-" might be intermediate, but we can't easily validate them here without blocking typing if strictly on onChange, but we'll accept them or ignore?
    // Actually, mode: "onChange" might show error on intermediate states like "1." 
    const num = parseFloat(val);
    if (isNaN(num)) return false;
    if (min !== undefined && num < min) return false;
    if (max !== undefined && num > max) return false;
    return true;
  }, {
    message: min !== undefined && max !== undefined 
      ? `Entre ${min} e ${max}`
      : min !== undefined 
        ? `Mín. ${min}`
        : max !== undefined
          ? `Máx. ${max}`
          : "Inválido"
  });
};
