
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ActivityFormData } from '@/types/activity';

interface BasicInfoFormProps {
  formData: ActivityFormData;
  onFormChange: (updates: Partial<ActivityFormData>) => void;
}

export const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
  formData,
  onFormChange,
}) => {
  return (
    <>
      <div>
        <Label htmlFor="title" className="text-gray-700 dark:text-gray-200">Título</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => onFormChange({ title: e.target.value })}
          placeholder="Ex: Lançamento do produto"
          className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        />
      </div>

      <div>
        <Label htmlFor="description" className="text-gray-700 dark:text-gray-200">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onFormChange({ description: e.target.value })}
          placeholder="Descreva a atividade..."
          className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        />
      </div>
    </>
  );
};
