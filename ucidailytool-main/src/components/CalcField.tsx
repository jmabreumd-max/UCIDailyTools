interface CalcFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  placeholder?: string;
  type?: string;
}

const CalcField = ({ label, value, onChange, unit, placeholder, type = "number" }: CalcFieldProps) => (
  <div>
    <label className="calc-label">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "0"}
        className="calc-input pr-12"
      />
      {unit && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
          {unit}
        </span>
      )}
    </div>
  </div>
);

export default CalcField;
