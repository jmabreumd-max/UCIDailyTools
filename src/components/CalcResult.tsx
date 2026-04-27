interface CalcResultProps {
  label: string;
  value: string | number | null;
  unit?: string;
  status?: "normal" | "warning" | "danger";
}

const CalcResult = ({ label, value, unit, status }: CalcResultProps) => {
  const statusColor =
    status === "danger"
      ? "text-destructive border-destructive/30 bg-destructive/10"
      : status === "warning"
      ? "text-warning border-warning/30 bg-warning/10"
      : "text-primary border-primary/20 bg-primary/10";

  return (
    <div>
      <label className="calc-label">{label}</label>
      <div className={`rounded-lg p-3 font-mono text-lg font-semibold text-center border ${statusColor}`}>
        {value !== null && value !== "" ? (
          <>
            {value}
            {unit && <span className="text-xs ml-1 opacity-70">{unit}</span>}
          </>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </div>
    </div>
  );
};

export default CalcResult;
