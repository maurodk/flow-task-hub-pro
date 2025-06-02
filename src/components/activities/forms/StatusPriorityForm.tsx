
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivityFormData } from '@/types/activity';

interface StatusPriorityFormProps {
  formData: ActivityFormData;
  onFormChange: (updates: Partial<ActivityFormData>) => void;
}

export const StatusPriorityForm: React.FC<StatusPriorityFormProps> = ({
  formData,
  onFormChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="status" className="text-gray-700 dark:text-gray-200">Status</Label>
        <Select 
          value={formData.status} 
          onValueChange={(value: 'pending' | 'in_progress' | 'completed' | 'on_hold') => 
            onFormChange({ status: value })
          }
        >
          <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Progresso</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="on_hold">Em Espera</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="priority" className="text-gray-700 dark:text-gray-200">Prioridade</Label>
        <Select 
          value={formData.priority} 
          onValueChange={(value: 'low' | 'medium' | 'high') => 
            onFormChange({ priority: value })
          }
        >
          <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
