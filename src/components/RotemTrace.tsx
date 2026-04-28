import React from 'react';

type RotemType = 'normal' | 'prolonged_ct' | 'low_mcf' | 'hyperlysis';

interface Props {
  type: RotemType;
  label?: string;
}

export const RotemTrace: React.FC<Props> = ({ type, label }) => {
  const getTracePoints = () => {
    let ct = 20;
    let mcf = 25; // max half-amplitude (total thickness = 50)
    let lysisPoint = 160;
    let endAmplitude = 25;
    let alphaStart = 40; // width of the rising slope

    switch (type) {
      case 'normal':
        break; // default
      case 'prolonged_ct':
        ct = 60;
        alphaStart = 40;
        break;
      case 'low_mcf':
        mcf = 8;
        endAmplitude = 8;
        alphaStart = 60; // slower angle
        break;
      case 'hyperlysis':
        lysisPoint = 80;
        endAmplitude = 2; // severe lysis
        break;
    }

    // Y center is 50. Left is 0, Right is 160.
    // Top Half points:
    // P0: 0, 50 (start)
    // P1: ct, 50 (end of CT)
    // P2: ct + alphaStart, 50 - mcf (reached max amplitude)
    // P3: lysisPoint, 50 - mcf (starts breaking down)
    // P4: 160, 50 - endAmplitude (end)

    const topPath = `M 0 50 L ${ct} 50 C ${ct + alphaStart*0.5} 50, ${ct + alphaStart*0.7} ${50 - mcf}, ${ct + alphaStart} ${50 - mcf} L ${lysisPoint} ${50 - mcf} C ${lysisPoint + 20} ${50 - mcf}, 160 ${50 - endAmplitude}, 160 ${50 - endAmplitude}`;
    const botPath = `L 160 ${50 + endAmplitude} C ${lysisPoint + 20} ${50 + endAmplitude}, ${lysisPoint} ${50 + mcf}, ${lysisPoint} ${50 + mcf} L ${ct + alphaStart} ${50 + mcf} C ${ct + alphaStart*0.7} ${50 + mcf}, ${ct + alphaStart*0.5} 50, ${ct} 50 L 0 50 Z`;

    return topPath + " " + botPath;
  };

  const getColor = () => {
    if (type === 'normal') return 'text-primary';
    if (type === 'hyperlysis') return 'text-destructive';
    if (type === 'prolonged_ct') return 'text-warning';
    return 'text-amber-500'; // low_mcf
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 100" className={`w-full max-w-[120px] h-auto fill-current ${getColor()} opacity-80 filter drop-shadow-sm`}>
        {/* Center line */}
        <line x1="0" y1="50" x2="160" y2="50" stroke="currentColor" strokeWidth="0.5" className="opacity-40" />
        <path d={getTracePoints()} className="opacity-90 transition-all duration-500" />
      </svg>
      {label && <span className="text-[10px] font-semibold text-muted-foreground mt-1.5">{label}</span>}
    </div>
  );
};

export default RotemTrace;
