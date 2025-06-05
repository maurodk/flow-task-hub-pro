
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SubtaskFormData } from '@/types/activity';

interface SubtasksFormProps {
  subtasks: SubtaskFormData[];
  onSubtasksChange: (subtasks: SubtaskFormData[]) => void;
}

export const SubtasksForm: React.FC<SubtasksFormProps> = ({
  subtasks,
  onSubtasksChange,
}) => {
  const updateSubtask = (index: number, title: string) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index].title = title;
    onSubtasksChange(newSubtasks);
  };

  const removeSubtask = (index: number) => {
    const newSubtasks = subtasks.filter((_, i) => i !== index);
    onSubtasksChange(newSubtasks);
  };

  const addSubtask = () => {
    onSubtasksChange([
      ...subtasks,
      { 
        title: '', 
        description: '', 
        is_completed: false, 
        order_index: subtasks.length 
      }
    ]);
  };

  return (
    <>
      <div>
        <Label className="text-gray-700 dark:text-gray-200">Subtarefas</Label>
        {subtasks.map((subtask, index) => (
          <div key={index} className="flex items-center space-x-2 py-2 border-b border-gray-200 dark:border-slate-700">
            <Input
              type="text"
              value={subtask.title}
              onChange={(e) => updateSubtask(index, e.target.value)}
              placeholder={`Subtarefa ${index + 1}`}
              className="flex-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeSubtask(index)}
            >
              Remover
            </Button>
          </div>
        ))}
      </div>

      <Button 
        type="button" 
        variant="outline" 
        onClick={addSubtask}
        className="w-full dark:border-slate-600 dark:text-slate-200"
      >
        Adicionar Subtarefa
      </Button>
    </>
  );
};
