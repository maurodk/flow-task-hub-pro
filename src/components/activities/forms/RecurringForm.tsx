
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ActivityFormData } from '@/types/activity';

interface RecurringFormProps {
  formData: ActivityFormData;
  onFormChange: (updates: Partial<ActivityFormData>) => void;
}

export const RecurringForm: React.FC<RecurringFormProps> = ({
  formData,
  onFormChange,
}) => {
  if (formData.activity_type !== 'recurring') {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_recurring"
          checked={formData.is_recurring}
          onCheckedChange={(checked) => onFormChange({ is_recurring: Boolean(checked) })}
        />
        <Label htmlFor="is_recurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-200">
          Atividade Repetitiva
        </Label>
      </div>

      {formData.is_recurring && (
        <div>
          <Label htmlFor="recurrence_type" className="text-gray-700 dark:text-gray-200">Frequência</Label>
          <Select 
            value={formData.recurrence_type} 
            onValueChange={(value) => onFormChange({ recurrence_type: value })}
          >
            <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
              <SelectValue placeholder="Selecione a frequência" />
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
              <SelectItem value="daily">Diária</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
