'use client';

import React from 'react';

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
  bgColor?: string;
  showPercent?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 56,
  strokeWidth = 6,
  strokeColor = '#1E3A5F',
  bgColor = '#FFE4EE',
  showPercent = true,
}) => {
  const cleanProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (cleanProgress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress bar */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showPercent && (
        <span className="absolute text-xs font-black text-ink">
          {cleanProgress}%
        </span>
      )}
    </div>
  );
};

interface ProgressBarProps {
  progress: number; // 0 to 100
  height?: string;
  color?: string;
  trackColor?: string;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 'h-2.5',
  color = 'bg-ink',
  trackColor = 'bg-blush',
  showLabel = false,
}) => {
  const cleanProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs font-bold text-ink/75 mb-1">
          <span>Progres</span>
          <span>{cleanProgress}%</span>
        </div>
      )}
      <div className={`w-full ${trackColor} border border-ink/20 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${cleanProgress}%` }}
        />
      </div>
    </div>
  );
};
