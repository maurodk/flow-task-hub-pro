
import React, { useState } from "react";
import { FileText, Repeat, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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
    // Container geral mais largo, centralizado, padding horizontal para não encostar nas laterais
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {cardList.map((c, idx) => {
          const Conf = TYPE_CONFIG[c.type];
          const isActive = expandedIdx === idx;

          return (
            <motion.div
              key={c.type}
              layout
              transition={{
                duration: isActive ? 0.19 : 0.13,
                type: "tween",
                ease: isActive ? "easeInOut" : "easeOut",
                delay: idx * 0.025,
              }}
              initial={{ opacity: 0, y: 10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              tabIndex={0}
              aria-label={Conf.label}
              className={cn(
                "relative group cursor-pointer rounded-3xl bg-white/80 dark:bg-slate-800/70 glass",
                "shadow-lg ring-1 ring-transparent transition-all duration-200 focus:outline-none",
                "hover:scale-[1.03] hover:shadow-2xl hover:ring-2",
                Conf.shadow,
                isActive && "scale-105 ring-2 ring-primary/90 z-20",
                // sizing ajustado:
                "min-h-[180px] md:min-h-[200px] min-w-[325px] max-w-[500px] w-full px-9 py-4 flex flex-col justify-between",
                isActive
                  ? "md:shadow-2xl md:ring-2 md:scale-105"
                  : "md:shadow-lg"
              )}
              style={{
                margin: "0 auto"
              }}
              onClick={() => setExpandedIdx(isActive ? null : idx)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setExpandedIdx(isActive ? null : idx);
              }}
            >
              <div className="flex flex-col items-center justify-center h-full w-full">
                <span
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-lg bg-gradient-to-br",
                    Conf.gradient
                  )}
                >
                  <Conf.icon className="w-8 h-8 text-white" />
                </span>
                <div className="flex items-center gap-1 mb-1">
                  <span className="font-bold text-2xl text-foreground">{c.value}</span>
                  <span className="text-base text-muted-foreground">{Conf.label}</span>
                </div>
                <div className="w-full flex items-center justify-center gap-2 mb-2">
                  <Progress value={c.percent} className="w-[90px] h-[7px] rounded-full bg-muted" />
                  <span className="ml-2 font-medium text-cyan-700 dark:text-cyan-400">
                    {c.percent}%
                  </span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs underline decoration-dotted text-muted-foreground cursor-help">
                      Ver detalhes
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="z-30 px-3 py-2 rounded-md bg-white dark:bg-slate-900 border text-xs shadow-xl">
                    <span>
                      {Conf.label}: <b>{c.value}</b> atividade{c.value !== 1 ? "s" : ""}
                      <br />
                      Isso representa <b>{c.percent}%</b> do total.
                    </span>
                  </TooltipContent>
                </Tooltip>
              </div>
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 14 }}
                    transition={{ duration: 0.13, type: "tween", ease: "easeOut" }}
                    className="flex flex-col items-center p-4 mt-1 border-t border-muted-foreground/10 bg-muted/40 dark:bg-slate-800/60 rounded-b-3xl"
                  >
                    <div className="mb-1 text-xs text-muted-foreground font-medium">
                      Estatística detalhada:
                    </div>
                    <div className="text-lg font-semibold text-foreground">
                      {c.value} de {total} atividades
                    </div>
                    <div className="text-xs mt-1">
                      Percentual: <b>{c.percent}%</b>
                    </div>
                    <div className="mt-2 flex gap-1 items-center text-xs">
                      <span className="rounded-full px-2 py-0.5 bg-primary/10 text-primary shadow">
                        {Conf.label}
                      </span>
                      <span className="animate-pulse w-2 h-2 rounded-full bg-green-400" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Glassmorphism highlight on card bottom for modern look */}
              <div className={cn(
                "absolute inset-0 rounded-3xl pointer-events-none",
                "bg-gradient-to-t from-white/25 dark:from-slate-700/30 to-transparent"
              )} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTypeCardGrid;
