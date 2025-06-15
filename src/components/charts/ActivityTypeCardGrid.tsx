
import React, { useState } from "react";
import { FileText, Repeat, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "@radix-ui/react-tooltip";

const TYPE_CONFIG = {
  standard: {
    label: "Padrão",
    icon: FileText,
    gradient: "from-indigo-400 to-indigo-600",
    color: "#6366f1",
    shadow: "shadow-indigo-200/50",
  },
  template_based: {
    label: "Predefinida",
    icon: Copy,
    gradient: "from-cyan-400 to-cyan-600",
    color: "#06b6d4",
    shadow: "shadow-cyan-200/50",
  },
  recurring: {
    label: "Repetitiva",
    icon: Repeat,
    gradient: "from-amber-400 to-orange-500",
    color: "#f59e42",
    shadow: "shadow-orange-200/50",
  },
} as const;

type ActivityType = keyof typeof TYPE_CONFIG;
type CardData = { type: ActivityType; value: number; percent: number; };

interface Props {
  data: { type: ActivityType; value: number }[];
  total: number;
}

export const ActivityTypeCardGrid: React.FC<Props> = ({ data, total }) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const cardList: CardData[] = data.map((d) => ({
    ...d,
    percent: total > 0 ? Math.round((d.value / total) * 100) : 0,
  }));

  return (
    <div className="w-full grid gap-6 sm:grid-cols-2 md:grid-cols-3">
      {cardList.map((c, idx) => {
        const Conf = TYPE_CONFIG[c.type];
        const isActive = expandedIdx === idx;

        return (
          <motion.div
            key={c.type}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: idx * 0.07, type: "spring", stiffness: 100, damping: 18 }}
            tabIndex={0}
            aria-label={Conf.label}
            className={cn(
              "relative group cursor-pointer rounded-3xl bg-white/70 dark:bg-slate-700/60 glass shadow-lg ring-1 ring-transparent transition-all duration-300 focus:outline-none",
              "hover:scale-[1.035] hover:shadow-2xl hover:ring-2",
              Conf.shadow,
              isActive && "scale-105 ring-2 ring-primary/80 z-20"
            )}
            style={{ minHeight: 180 }}
            onClick={() => setExpandedIdx(isActive ? null : idx)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setExpandedIdx(isActive ? null : idx);
            }}
          >
            <div className="p-5 flex flex-col items-center">
              <span
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center mb-2 shadow-lg bg-gradient-to-br",
                  Conf.gradient
                )}
              >
                <Conf.icon className="w-7 h-7 text-white" />
              </span>
              <div className="flex items-center gap-1 mb-1">
                <span className="font-bold text-xl text-foreground">{c.value}</span>
                <span className="text-xs text-muted-foreground">{Conf.label}</span>
              </div>
              <div className="w-full flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1 text-sm">
                  <Progress value={c.percent} className="w-[80px] h-[7px] rounded-full bg-muted" />
                  <span className="ml-2 font-medium text-indigo-700 dark:text-cyan-400">
                    {c.percent}%
                  </span>
                </div>
              </div>
              {/* Tooltip informação extra */}
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <span className="text-xs underline decoration-dotted text-muted-foreground cursor-help">
                    Ver detalhes
                  </span>
                </Tooltip.Trigger>
                <Tooltip.Content side="top" className="z-30 px-3 py-2 rounded-md bg-white dark:bg-slate-900 border text-xs shadow-xl">
                  <span>
                    {Conf.label}: <b>{c.value}</b> atividade{c.value !== 1 ? "s" : ""}
                    <br />
                    Isso representa <b>{c.percent}%</b> do total.
                  </span>
                </Tooltip.Content>
              </Tooltip.Root>
            </div>
            {/* Detalhes expandidos */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  className="flex flex-col items-center p-4 border-t border-muted-foreground/10 bg-muted/40 dark:bg-slate-800/50 rounded-b-3xl"
                >
                  <div className="mb-2 text-xs text-muted-foreground font-medium">
                    Estatística detalhada:
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    {c.value} de {total} atividades
                  </div>
                  <div className="text-xs mt-1">
                    Percentual: <b>{c.percent}%</b>
                  </div>
                  {/* Aqui pode-se adicionar mais dados/contexto/performance */}
                  <div className="mt-2 flex gap-1 items-center text-xs">
                    <span className="rounded-full px-2 py-0.5 bg-primary/10 text-primary shadow">
                      {Conf.label}
                    </span>
                    {/* Micro-feedback visual */}
                    <span className="animate-pulse w-2 h-2 rounded-full bg-green-400" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Sombra de luz efeito glass */}
            <div className={cn(
              "absolute inset-0 rounded-3xl pointer-events-none",
              "bg-gradient-to-t from-white/30 dark:from-slate-600/50 to-transparent"
            )} />
          </motion.div>
        );
      })}
    </div>
  );
};

export default ActivityTypeCardGrid;
