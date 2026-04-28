import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CalcFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  unit?: string;
  error?: string | null;
}

const CalcField = forwardRef<HTMLInputElement, CalcFieldProps>(({ 
  label, 
  unit, 
  error,
  className,
  type = "number",
  onChange,
  ...props 
}, ref) => {

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div>
      <label className="calc-label">{label}</label>
      <div className="relative">
        <input
          ref={ref}
          type={type}
          className={cn(
            "calc-input transition-colors",
            unit && "pr-12",
            error && "border-red-500 focus:ring-red-500/40 focus:border-red-500",
            className
          )}
          onChange={handleChange}
          {...props}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
            {unit}
          </span>
        )}
      </div>
      {error && (
        <span className="text-red-500 text-[10px] mt-1 block font-medium">
          {error}
        </span>
      )}
    </div>
  );
});

CalcField.displayName = "CalcField";

export default CalcField;



