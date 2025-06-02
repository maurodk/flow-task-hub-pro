
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivityFormData, UserTemplate } from '@/types/activity';

interface ActivityTypeFormProps {
  formData: ActivityFormData;
  onFormChange: (updates: Partial<ActivityFormData>) => void;
  userTemplates: UserTemplate[];
  onTemplateSelect: (templateId: string) => void;
}

export const ActivityTypeForm: React.FC<ActivityTypeFormProps> = ({
  formData,
  onFormChange,
  userTemplates,
  onTemplateSelect,
}) => {
  return (
    <>
      <div>
        <Label htmlFor="activity_type" className="text-gray-700 dark:text-gray-200">Tipo de Atividade</Label>
        <Select 
          value={formData.activity_type} 
          onValueChange={(value: 'standard' | 'template_based' | 'recurring') => {
            onFormChange({ activity_type: value });
            if (value !== 'template_based') {
              onFormChange({ template_id: '' });
            }
            if (value !== 'recurring') {
              onFormChange({ is_recurring: false, recurrence_type: '', recurrence_time: '' });
            }
          }}
        >
          <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            <SelectItem value="standard">Padrão</SelectItem>
            <SelectItem value="template_based">Baseada em Template</SelectItem>
            <SelectItem value="recurring">Repetitiva</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.activity_type === 'template_based' && (
        <div>
          <Label htmlFor="template_id" className="text-gray-700 dark:text-gray-200">Template</Label>
          <Select value={formData.template_id} onValueChange={onTemplateSelect}>
            <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
              <SelectValue placeholder="Selecione um template" />
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
              {userTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
};
