'use client';

import React from 'react';
import { formatRupiah, formatShortRupiah } from '@/lib/utils/formatters';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  totalLabel?: string;
  size?: number;
  thickness?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  totalLabel = 'Total',
  size = 180,
  thickness = 22,
}) => {
  const total = segments.reduce((acc, s) => acc + (s.value > 0 ? s.value : 0), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Base circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#FFE4EE"
            strokeWidth={thickness}
            fill="none"
          />

          {total > 0 &&
            segments.map((seg, idx) => {
              if (seg.value <= 0) return null;
              const ratio = seg.value / total;
              const strokeLength = ratio * circumference;
              const strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
              const strokeDashoffset = -currentOffset;
              currentOffset += strokeLength;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={thickness}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  fill="none"
                  className="transition-all duration-700 ease-out"
                />
              );
            })}
        </svg>

        {/* Center Text */}
        <div className="absolute text-center px-2">
          <p className="text-[11px] font-semibold text-ink/60 uppercase tracking-wider">{totalLabel}</p>
          <p className="text-base font-extrabold text-ink leading-tight">
            {formatShortRupiah(total)}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3 w-full">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-xs text-ink/80">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="font-medium">{seg.label}:</span>
            <span className="font-bold">{formatShortRupiah(seg.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
