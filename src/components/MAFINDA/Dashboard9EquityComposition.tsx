import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { motion } from 'motion/react';
import { Wallet } from 'lucide-react';

interface EquityCompositionData {
  modal: number;
  labaDitahan: number;
  deviden: number;
  total: number;
}

interface Props {
  data: EquityCompositionData | null;
  loading?: boolean;
}

function formatRupiah(value: number): string {
  if (Math.abs(value) >= 1000000000) {
    return `Rp ${(value / 1000000000).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)}M`;
  }
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export default function Dashboard9EquityComposition({ data, loading }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-lg text-center">
        <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No equity data available</p>
      </div>
    );
  }

  const chartData = [
    {
      name: 'Modal',
      value: data.modal,
      percentage: ((data.modal / data.total) * 100).toFixed(1),
      color: '#f59e0b',
      gradient: 'from-amber-400 to-amber-600'
    },
    {
      name: 'Laba Ditahan',
      value: data.labaDitahan,
      percentage: ((data.labaDitahan / data.total) * 100).toFixed(1),
      color: '#10b981',
      gradient: 'from-emerald-400 to-emerald-600'
    },
    {
      name: 'Deviden',
      value: data.deviden,
      percentage: ((data.deviden / data.total) * 100).toFixed(1),
      color: '#6366f1',
      gradient: 'from-indigo-400 to-indigo-600'
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-2xl border-2 border-gray-100 backdrop-blur-sm">
          <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
          <p className="text-sm text-gray-600">Value: {formatRupiah(data.value)}</p>
          <p className="text-sm text-gray-600">Percentage: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  // 3D Active Shape
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    return (
      <g>
        {/* Shadow layer for 3D effect */}
        <Sector
          cx={cx}
          cy={cy + 5}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill="#00000020"
        />
        {/* Main sector with enhanced size */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        {/* Highlight layer */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={outerRadius + 10}
          outerRadius={outerRadius + 15}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.3}
        />
      </g>
    );
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-bold text-sm drop-shadow-lg"
        style={{ 
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          paintOrder: 'stroke fill'
        }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-2xl overflow-hidden border border-purple-100"
    >
      {/* Header with 3D effect */}
      <div className="relative bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 p-6 overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}></div>
        </div>
        
        <div className="relative">
          <h3 className="text-xl font-bold text-white mb-2 drop-shadow-lg">Equity Composition</h3>
          <p className="text-purple-100 text-sm drop-shadow">Total Equity: {formatRupiah(data.total)}</p>
        </div>
        
        {/* 3D bottom edge effect */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-700 to-pink-700"></div>
      </div>

      {/* Chart with 3D container */}
      <div className="p-6 relative">
        {/* 3D shadow base */}
        <div className="absolute inset-6 bg-gradient-to-br from-purple-100 to-transparent rounded-full blur-2xl opacity-30"></div>
        
        <div className="relative" style={{ 
          filter: 'drop-shadow(0 10px 30px rgba(147, 51, 234, 0.3))'
        }}>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <defs>
                {chartData.map((entry, index) => (
                  <linearGradient key={`gradient-${index}`} id={`equity-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={110}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#equity-gradient-${index})`}
                    style={{
                      filter: `drop-shadow(0 4px 8px ${entry.color}40)`,
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with 3D cards */}
        <div className="mt-8 space-y-3">
          {chartData.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, x: 5 }}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
              className={`relative flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer ${
                activeIndex === index 
                  ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-2xl' 
                  : 'bg-white hover:bg-gray-50 shadow-lg'
              }`}
              style={{
                transform: activeIndex === index ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: activeIndex === index 
                  ? `0 10px 30px ${item.color}40, 0 0 0 1px ${item.color}20`
                  : '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              {/* 3D indicator */}
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-5 h-5 rounded-lg shadow-lg relative"
                  style={{ 
                    background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}dd 100%)`,
                    boxShadow: `0 4px 8px ${item.color}40, inset 0 -2px 4px rgba(0,0,0,0.2)`
                  }}
                >
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white to-transparent opacity-30"></div>
                </div>
                <span className={`font-semibold ${activeIndex === index ? 'text-white' : 'text-gray-700'}`}>
                  {item.name}
                </span>
              </div>
              <div className="text-right">
                <p className={`font-bold text-lg ${activeIndex === index ? 'text-white' : 'text-gray-900'}`}>
                  {formatRupiah(item.value)}
                </p>
                <p className={`text-sm ${activeIndex === index ? 'text-white/90' : 'text-gray-500'}`}>
                  {item.percentage}%
                </p>
              </div>
              
              {/* 3D edge highlight */}
              {activeIndex === index && (
                <div className="absolute inset-0 rounded-xl border-2 border-white/30 pointer-events-none"></div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
