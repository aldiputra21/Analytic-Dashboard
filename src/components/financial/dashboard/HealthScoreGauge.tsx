// HealthScoreGauge.tsx - Health score 0-100 with color coding
// Requirements: 4.3, 4.4

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../../../utils/cn';

interface HealthScoreGaugeProps {
  score: number; // 0-100
  subsidiaryName: string;
  subsidiaryColor: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Returns color based on health score:
 * 0-50: red (risky), 51-75: yellow (moderate), 76-100: green (healthy)
 * Requirements: 4.4
 */
export function getHealthScoreColor(score: number): string {
  if (score <= 50) return '#ef4444';   // red
  if (score <= 75) return '#eab308';   // yellow
  return '#22c55e';                     // green
}

export function getHealthScoreLabel(score: number): string {
  if (score <= 50) return 'Risky';
  if (score <= 75) return 'Moderate';
  return 'Healthy';
}

// Gauge arc data: red 0-50 (50%), yellow 51-75 (25%), green 76-100 (25%)
const GAUGE_DATA = [
  { name: 'Risky',    value: 50, fill: '#ef4444' },
  { name: 'Moderate', value: 25, fill: '#eab308' },
  { name: 'Healthy',  value: 25, fill: '#22c55e' },
];

/**
 * Maps score (0-100) to needle angle in degrees.
 * Gauge spans 180° (left=0, right=100).
 */
function scoreToAngle(score: number): number {
  const clamped = Math.max(0, Math.min(100, score));
  // 180° at score=0, 0° at score=100
  return 180 - (clamped / 100) * 180;
}

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = React.memo(({
  score,
  subsidiaryName,
  subsidiaryColor,
  size = 'md',
}) => {
  const color = React.useMemo(() => getHealthScoreColor(score), [score]);
  const label = React.useMemo(() => getHealthScoreLabel(score), [score]);
  const needleAngle = React.useMemo(() => scoreToAngle(score), [score]);

  const heights: Record<string, string> = { sm: 'h-[120px]', md: 'h-[160px]', lg: 'h-[200px]' };
  const textSizes: Record<string, string> = { sm: 'text-2xl', md: 'text-3xl', lg: 'text-4xl' };
  const innerR: Record<string, number> = { sm: 50, md: 65, lg: 85 };
  const outerR: Record<string, number> = { sm: 70, md: 90, lg: 115 };
  const needleH: Record<string, string> = { sm: 'h-[55px]', md: 'h-[70px]', lg: 'h-[90px]' };

  return (
    <div className="flex flex-col items-center">
      {/* Subsidiary label with color dot */}
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: subsidiaryColor }} />
        <span className="text-xs font-semibold text-slate-600 truncate max-w-[120px]">{subsidiaryName}</span>
      </div>

      {/* Gauge */}
      <div className={cn('relative w-full', heights[size])}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={GAUGE_DATA}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius={innerR[size]}
              outerRadius={outerR[size]}
              paddingAngle={1}
              dataKey="value"
              stroke="none"
            >
              {GAUGE_DATA.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} opacity={0.85} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Needle */}
        <motion.div
          className="absolute bottom-[15%] left-1/2"
          style={{ width: '4px', transformOrigin: 'bottom center' }}
          initial={{ rotate: 180, x: '-50%' }}
          animate={{ rotate: needleAngle, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
        >
          <div className={cn('w-full bg-slate-700 rounded-full', needleH[size])} />
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-700 rounded-full border-2 border-white shadow" />
        </motion.div>

        {/* Score display */}
        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <motion.p
            key={score}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn('font-black leading-none', textSizes[size])}
            style={{ color }}
          >
            {Math.round(score)}
          </motion.p>
          <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color }}>
            {label}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[9px] text-slate-400">0-50</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-[9px] text-slate-400">51-75</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[9px] text-slate-400">76-100</span>
        </div>
      </div>
    </div>
  );
});
