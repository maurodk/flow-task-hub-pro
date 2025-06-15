
import React from "react";
import { format, subDays, subMonths, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { DatePicker } from "@/components/activities/DatePicker";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RangePreset = "7d" | "30d" | "90d" | "180d" | "365d" | "custom";
type GroupBy = "daily" | "weekly" | "monthly";

interface LineChartFiltersProps {
  rangePreset: RangePreset;
  onRangePreset: (value: RangePreset) => void;
  customRange: [Date | undefined, Date | undefined];
  onCustomRange: (value: [Date | undefined, Date | undefined]) => void;
  groupBy: GroupBy;
  onGroupBy: (value: GroupBy) => void;
}

const presets = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "3 meses" },
  { value: "180d", label: "6 meses" },
  { value: "365d", label: "1 ano" },
  { value: "custom", label: "Personalizado" }
];

const groupOptions = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" }
];

export default function LineChartFilters({
  rangePreset,
  onRangePreset,
  customRange,
  onCustomRange,
  groupBy,
  onGroupBy
}: LineChartFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 items-start lg:items-end mb-3">
      {/* Filtro de período */}
      <div>
        <Select value={rangePreset} onValueChange={(v) => onRangePreset(v as RangePreset)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {presets.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {rangePreset === "custom" && (
        <div>
          <DatePicker
            date={customRange[0] || undefined}
            onDateChange={(start) => onCustomRange([start, customRange[1]])}
            placeholder="Data inicial"
            className="w-[120px]"
            disabled={false}
          />
          <span className="mx-1">-</span>
          <DatePicker
            date={customRange[1] || undefined}
            onDateChange={(end) => onCustomRange([customRange[0], end])}
            placeholder="Data final"
            className="w-[120px]"
            disabled={false}
          />
        </div>
      )}
      {/* Filtro de agrupamento */}
      <ToggleGroup
        type="single"
        value={groupBy}
        onValueChange={v => v && onGroupBy(v as GroupBy)}
        className="ml-auto"
      >
        {groupOptions.map(opt =>
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            size="sm"
            aria-label={opt.label}
          >
            {opt.label}
          </ToggleGroupItem>
        )}
      </ToggleGroup>
    </div>
  );
}
