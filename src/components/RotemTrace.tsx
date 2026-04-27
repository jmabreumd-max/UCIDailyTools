import React from 'react';

type RotemType = 'normal' | 'prolonged_ct' | 'low_mcf' | 'hyperlysis';

interface Props {
  type: RotemType;
  label?: string;
}

export const RotemTrace: React.FC<Props> = ({ type, label }) => {
  const getPath = () => {
    switch (type) {
      case 'normal':
        return "M 10 50 L 40 50 C 45 30, 80 20, 150 20 L 150 20 C 80 20, 45 70, 40 50 Z M 10 50 L 40 50 C 45 70, 80 80, 150 80 L 150 80 C 80 80, 45 30, 40 50 Z";
      case 'prolonged_ct':
        return "M 10 50 L 80 50 C 85 30, 120 20, 150 20 L 150 20 C 120 20, 85 70, 80 50 Z M 10 50 L 80 50 C 85 70, 120 80, 150 80 L 150 80 C 120 80, 85 30, 80 50 Z";
      case 'low_mcf':
        return "M 10 50 L 40 50 C 45 40, 80 35, 150 35 L 150 35 C 80 35, 45 60, 40 50 Z M 10 50 L 40 50 C 45 60, 80 65, 150 65 L 150 65 C 80 65, 45 40, 40 50 Z";
      case 'hyperlysis':
        return "M 10 50 L 40 50 C 45 30, 80 20, 100 20 C 120 20, 130 45, 150 50 L 150 50 C 130 55, 120 80, 100 80 C 80 80, 45 70, 40 50 Z M 10 50 L 40 50 C 45 70, 80 80, 100 80 C 120 80, 130 55, 150 50 L 150 50 C 130 45, 120 20, 100 20 C 80 20, 45 30, 40 50 Z";
    }
  };

  const getColor = () => {
    if (type === 'normal') return 'text-primary';
    if (type === 'hyperlysis') return 'text-destructive';
    if (type === 'prolonged_ct') return 'text-warning';
    return 'text-warning'; // low_mcf
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 100" className={`w-full max-w-[120px] h-auto fill-current ${getColor()} opacity-80`}>
        {/* Center line */}
        <line x1="0" y1="50" x2="160" y2="50" stroke="currentColor" strokeWidth="1" className="opacity-30" />
        <path d={getPath()} />
      </svg>
      {label && <span className="text-[9px] font-semibold text-muted-foreground mt-1">{label}</span>}
    </div>
  );
};

export default RotemTrace;
