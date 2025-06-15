
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ActivityData, ActivityFormData, UserTemplate, SubtaskFormData } from '@/types/activity';
import { DatePicker } from './DatePicker';
import { BasicInfoForm } from './forms/BasicInfoForm';
import { StatusPriorityForm } from './forms/StatusPriorityForm';
import { ActivityTypeForm } from './forms/ActivityTypeForm';
import { RecurringForm } from './forms/RecurringForm';
import { SubtasksForm } from './forms/SubtasksForm';
import SectorForm from './forms/SectorForm';

interface ActivityFormProps {
  editingActivity: ActivityData | null;
  userTemplates: UserTemplate[];
  onSuccess: () => void;
  onClose: () => void;
  createActivity: (formData: any) => Promise<any>;
}

const ActivityForm: React.FC<ActivityFormProps> = ({
  editingActivity,
  userTemplates,
  onSuccess,
  onClose,
  createActivity,
}) => {
  const { user } = useAuth();
  const [activityForm, setActivityForm] = useState<ActivityFormData>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    activity_type: 'standard',
    is_recurring: false,
    recurrence_type: '',
    recurrence_time: '',
    template_id: '',
    sector_id: '',
  });

  const [subtasks, setSubtasks] = useState<SubtaskFormData[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>();

  useEffect(() => {
    if (editingActivity) {
      setActivityForm({
        title: editingActivity.title,
        description: editingActivity.description || '',
        status: editingActivity.status,
        priority: editingActivity.priority,
        due_date: editingActivity.due_date || '',
        activity_type: editingActivity.activity_type,
        is_recurring: editingActivity.is_recurring || false,
        recurrence_type: editingActivity.recurrence_type || '',
        recurrence_time: editingActivity.recurrence_time || '',
        template_id: editingActivity.template_id || '',
        sector_id: editingActivity.sector_id || '',
      });
      
      if (editingActivity.due_date) {
        setDueDate(new Date(editingActivity.due_date));
      }
      
      setSubtasks(editingActivity.subtasks?.map(st => ({
        title: st.title,
        description: st.description,
        is_completed: st.is_completed,
        order_index: st.order_index,
      })) || []);
    } else {
      resetForm();
    }
  }, [editingActivity]);

  const resetForm = () => {
    setActivityForm({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      due_date: '',
      activity_type: 'standard',
      is_recurring: false,
      recurrence_type: '',
      recurrence_time: '',
      template_id: '',
      sector_id: '',
    });
    setSubtasks([]);
    setDueDate(undefined);
  };

  const handleFormChange = (updates: Partial<ActivityFormData>) => {
    setActivityForm(prev => ({ ...prev, ...updates }));
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = userTemplates.find(t => t.id === templateId);
    if (!template) return;

    handleFormChange({ template_id: templateId });
    setSubtasks(template.subtasks.map(st => ({
      title: st.title,
      description: st.description,
      is_completed: false,
      order_index: st.order_index,
    })));
  };

  const calculateNextDueDate = (recurrenceType: string): Date => {
    const now = new Date();
    const nextDue = new Date(now);
    
    switch (recurrenceType) {
      case 'daily':
        nextDue.setDate(nextDue.getDate() + 1);
        break;
      case 'weekly':
        nextDue.setDate(nextDue.getDate() + 7);
        break;
      case 'monthly':
        nextDue.setMonth(nextDue.getMonth() + 1);
        break;
    }
    
    return nextDue;
  };

  const handleSaveActivity = async () => {
    if (!user || !activityForm.title.trim()) {
      toast.error('Título da atividade é obrigatório');
      return;
    }

    try {
      let activityId: string;
      let nextDueAt = null;

      if (activityForm.is_recurring && activityForm.recurrence_type) {
        nextDueAt = calculateNextDueDate(activityForm.recurrence_type);
      }

      const activityData = {
        title: activityForm.title,
        description: activityForm.description || null,
        status: activityForm.status,
        priority: activityForm.priority,
        due_date: dueDate ? dueDate.toISOString().split('T')[0] : null,
        activity_type: activityForm.activity_type,
        is_recurring: activityForm.is_recurring,
        recurrence_type: activityForm.is_recurring ? activityForm.recurrence_type || null : null,
        recurrence_time: null,
        template_id: activityForm.activity_type === 'template_based' ? activityForm.template_id || null : null,
        sector_id: activityForm.sector_id || null,
        next_due_at: nextDueAt?.toISOString() || null,
      };

      if (editingActivity) {
        const { error } = await supabase
          .from('activities')
          .update({
            ...activityData,
            user_id: user.id,
            progress: editingActivity.progress,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingActivity.id);

        if (error) throw error;
        activityId = editingActivity.id;

        await supabase
          .from('activity_subtasks')
          .delete()
          .eq('activity_id', activityId);
      } else {
        const activity = await createActivity(activityData);
        activityId = activity.id;
      }

      if (subtasks.length > 0) {
        const subtasksToInsert = subtasks.map((subtask, index) => ({
          activity_id: activityId,
          title: subtask.title,
          description: subtask.description,
          order_index: index,
          is_completed: subtask.is_completed,
        }));

        const { error: subtasksError } = await supabase
          .from('activity_subtasks')
          .insert(subtasksToInsert);

        if (subtasksError) throw subtasksError;
      }

      toast.success(editingActivity ? 'Atividade atualizada!' : 'Atividade criada!');
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar atividade:', error);
      toast.error('Erro ao salvar atividade');
    }
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
      <DialogHeader>
        <DialogTitle className="text-gray-900 dark:text-white">
          {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
        </DialogTitle>
        <DialogDescription className="text-gray-600 dark:text-gray-300">
          {editingActivity ? 'Edite os detalhes da atividade.' : 'Crie uma nova atividade ou use um template.'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 p-4">
        <BasicInfoForm formData={activityForm} onFormChange={handleFormChange} />
        
        <StatusPriorityForm formData={activityForm} onFormChange={handleFormChange} />

        <div>
          <Label htmlFor="due_date" className="text-gray-700 dark:text-gray-200">Data de Vencimento</Label>
          <DatePicker
            date={dueDate}
            onDateChange={setDueDate}
            placeholder="Selecione a data de vencimento"
            className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>

        <SectorForm 
          value={activityForm.sector_id || ''} 
          onChange={(value) => handleFormChange({ sector_id: value })} 
        />

        <ActivityTypeForm 
          formData={activityForm} 
          onFormChange={handleFormChange}
          userTemplates={userTemplates}
          onTemplateSelect={handleTemplateSelect}
        />

        <RecurringForm formData={activityForm} onFormChange={handleFormChange} />

        <SubtasksForm subtasks={subtasks} onSubtasksChange={setSubtasks} />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSaveActivity}>
            {editingActivity ? 'Atualizar Atividade' : 'Criar Atividade'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};

export default ActivityForm;
