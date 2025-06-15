
import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from "recharts";
import { FileText, Repeat, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

// Tipos de atividade, cor e ícone
const TYPE_CONFIG = {
  standard: {
    label: "Padrão",
    color: "#6366f1",
    icon: FileText,
    gradient: "from-indigo-400 to-indigo-600"
  },
  template_based: {
    label: "Predefinida",
    color: "#06b6d4",
    icon: Copy,
    gradient: "from-cyan-400 to-cyan-600"
  },
  recurring: {
    label: "Repetitiva",
    color: "#f59e42",
    icon: Repeat,
    gradient: "from-amber-400 to-orange-500"
  }
} as const;

type ActivityType = keyof typeof TYPE_CONFIG;

interface DonutActivityTypeChartProps {
  data: { type: ActivityType; value: number }[];
  total: number;
}

const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload
  } = props;
  // Destaca o segmento ativo com bordo e leve sombra/glow
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={3}
        filter="drop-shadow(0 0 8px rgba(0,0,0,0.12))"
      />
    </g>
  );
};

export const DonutActivityTypeChart: React.FC<DonutActivityTypeChartProps> = ({ data, total }) => {
  // Estado do segmento ativo (hover/click)
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Dados dos segmentos e centros
  const activeTypeInfo =
    activeIndex !== null && data[activeIndex]
      ? TYPE_CONFIG[data[activeIndex].type]
      : null;

  // Valor e percentual ativo
  const activeValue =
    activeIndex !== null && data[activeIndex]?.value ? data[activeIndex].value : total;
  const activePercent =
    activeIndex !== null && data[activeIndex]?.value && total > 0
      ? Math.round((data[activeIndex].value / total) * 100)
      : 100;

  // Ícone central (se ativo) - fallback: circle
  const CenterIcon =
    (activeIndex !== null && data[activeIndex] && TYPE_CONFIG[data[activeIndex].type].icon) || FileText;

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { type } = payload[0].payload;
      const config = TYPE_CONFIG[type as ActivityType];
      return (
        <div className="px-3 py-2 rounded-lg shadow-lg border bg-background text-xs font-semibold text-foreground flex items-center gap-1">
          <config.icon className="w-4 h-4 mr-1" /> {config.label}:&nbsp;
          {payload[0].value} atividade{payload[0].value !== 1 ? "s" : ""}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="relative max-w-xs w-full mx-auto aspect-square flex items-center justify-center"
      style={{ minHeight: 240 }}
    >
      {/* Central info animada */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center scale-100 transition-all z-10">
        <span
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg mb-2",
            activeTypeInfo ? `from-80% ${activeTypeInfo.gradient}` : "bg-muted"
          )}
          style={{ transition: "background 0.3s" }}
        >
          <CenterIcon className="w-7 h-7 text-white" />
        </span>
        <span className="font-bold text-xl text-foreground">
          {activePercent}%
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          {activeTypeInfo
            ? activeTypeInfo.label
            : "Todas"}
        </span>
        <span className="text-xs font-semibold text-foreground mt-1">
          {activeValue} atividade{activeValue !== 1 ? "s" : ""}
        </span>
      </div>
      {/* Gráfico donut moderno */}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="type"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            startAngle={90}
            endAngle={-270}
            isAnimationActive={true}
            animationDuration={500}
            onMouseEnter={(_, idx) => setActiveIndex(idx)}
            onMouseLeave={() => setActiveIndex(null)}
            activeIndex={activeIndex ?? undefined}
            activeShape={renderActiveShape}
            paddingAngle={2}
            blendStroke
          >
            {data.map((entry, idx) => (
              <Cell
                key={`cell-${entry.type}`}
                fill={TYPE_CONFIG[entry.type].color}
                className="transition-all duration-300"
                style={{
                  filter: activeIndex === idx ? "drop-shadow(0 0 10px rgba(0,0,0,0.18))" : undefined
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Legenda customizada */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-3 bg-white/70 dark:bg-slate-800/80 rounded-xl px-4 py-2 mt-2 shadow ring-1 ring-muted-foreground/10 backdrop-blur-sm">
        {data.map((entry, idx) => {
          const conf = TYPE_CONFIG[entry.type];
          return (
            <div
              key={entry.type}
              className={cn(
                "flex items-center gap-1 cursor-pointer transition-all font-medium text-xs group",
                activeIndex === idx && "scale-110 font-semibold"
              )}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span
                className="block w-3 h-3 rounded-full"
                style={{ background: conf.color }}
              />
              <conf.icon
                className={cn(
                  "w-3 h-3",
                  activeIndex === idx ? "text-foreground" : "text-muted-foreground"
                )}
              />
              <span>
                {conf.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DonutActivityTypeChart;
