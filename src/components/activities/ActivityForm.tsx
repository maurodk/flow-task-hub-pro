
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ActivityData, ActivityFormData, UserTemplate, SubtaskData } from '@/types/activity';
import { DatePicker } from './DatePicker';

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
  });

  const [subtasks, setSubtasks] = useState<Omit<SubtaskData, 'id'>[]>([]);
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
    });
    setSubtasks([]);
    setDueDate(undefined);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = userTemplates.find(t => t.id === templateId);
    if (!template) return;

    setActivityForm(prev => ({ ...prev, template_id: templateId }));
    setSubtasks(template.subtasks.map(st => ({
      title: st.title,
      description: st.description,
      is_completed: false,
      order_index: st.order_index,
    })));
  };

  const calculateNextDueDate = (recurrenceType: string, recurrenceInterval: number): Date => {
    const now = new Date();
    const nextDue = new Date(now);
    
    switch (recurrenceType) {
      case 'daily':
        nextDue.setDate(nextDue.getDate() + recurrenceInterval);
        break;
      case 'weekly':
        nextDue.setDate(nextDue.getDate() + (7 * recurrenceInterval));
        break;
      case 'monthly':
        nextDue.setMonth(nextDue.getMonth() + recurrenceInterval);
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

      // Se é uma atividade recorrente, calcular a próxima data baseada na data atual
      if (activityForm.is_recurring && activityForm.recurrence_type && activityForm.recurrence_time) {
        const interval = parseInt(activityForm.recurrence_time) || 1;
        nextDueAt = calculateNextDueDate(activityForm.recurrence_type, interval);
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
        recurrence_time: activityForm.is_recurring ? activityForm.recurrence_time || null : null,
        template_id: activityForm.activity_type === 'template_based' ? activityForm.template_id || null : null,
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
        <div>
          <Label htmlFor="title" className="text-gray-700 dark:text-gray-200">Título</Label>
          <Input
            id="title"
            value={activityForm.title}
            onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
            placeholder="Ex: Lançamento do produto"
            className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-gray-700 dark:text-gray-200">Descrição</Label>
          <Textarea
            id="description"
            value={activityForm.description}
            onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
            placeholder="Descreva a atividade..."
            className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status" className="text-gray-700 dark:text-gray-200">Status</Label>
            <Select value={activityForm.status} onValueChange={(value: 'pending' | 'in_progress' | 'completed' | 'on_hold') => setActivityForm({ ...activityForm, status: value })}>
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
            <Select value={activityForm.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setActivityForm({ ...activityForm, priority: value })}>
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

        <div>
          <Label htmlFor="due_date" className="text-gray-700 dark:text-gray-200">Data de Vencimento</Label>
          <DatePicker
            date={dueDate}
            onDateChange={setDueDate}
            placeholder="Selecione a data de vencimento"
            className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>

        <div>
          <Label htmlFor="activity_type" className="text-gray-700 dark:text-gray-200">Tipo de Atividade</Label>
          <Select value={activityForm.activity_type} onValueChange={(value: 'standard' | 'template_based' | 'recurring') => {
            setActivityForm({ ...activityForm, activity_type: value });
            if (value !== 'template_based') {
              setActivityForm(prev => ({ ...prev, template_id: '' }));
            }
            if (value !== 'recurring') {
              setActivityForm(prev => ({ ...prev, is_recurring: false, recurrence_type: '', recurrence_time: '' }));
            }
          }}>
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

        {activityForm.activity_type === 'template_based' && (
          <div>
            <Label htmlFor="template_id" className="text-gray-700 dark:text-gray-200">Template</Label>
            <Select value={activityForm.template_id} onValueChange={handleTemplateSelect}>
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

        {activityForm.activity_type === 'recurring' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_recurring"
                checked={activityForm.is_recurring}
                onCheckedChange={(checked) => setActivityForm({ ...activityForm, is_recurring: Boolean(checked) })}
              />
              <Label htmlFor="is_recurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-200">
                Atividade Repetitiva
              </Label>
            </div>

            {activityForm.is_recurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurrence_type" className="text-gray-700 dark:text-gray-200">Frequência</Label>
                  <Select value={activityForm.recurrence_type} onValueChange={(value) => setActivityForm({ ...activityForm, recurrence_type: value })}>
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

                <div>
                  <Label htmlFor="recurrence_time" className="text-gray-700 dark:text-gray-200">
                    Intervalo ({activityForm.recurrence_type === 'daily' ? 'dias' : activityForm.recurrence_type === 'weekly' ? 'semanas' : 'meses'})
                  </Label>
                  <Input
                    type="number"
                    id="recurrence_time"
                    value={activityForm.recurrence_time}
                    onChange={(e) => setActivityForm({ ...activityForm, recurrence_time: e.target.value })}
                    placeholder="Ex: 1"
                    min="1"
                    className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <Label className="text-gray-700 dark:text-gray-200">Subtarefas</Label>
          {subtasks.map((subtask, index) => (
            <div key={index} className="flex items-center space-x-2 py-2 border-b border-gray-200 dark:border-slate-700">
              <Input
                type="text"
                value={subtask.title}
                onChange={(e) => {
                  const newSubtasks = [...subtasks];
                  newSubtasks[index].title = e.target.value;
                  setSubtasks(newSubtasks);
                }}
                placeholder={`Subtarefa ${index + 1}`}
                className="flex-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newSubtasks = subtasks.filter((_, i) => i !== index);
                  setSubtasks(newSubtasks);
                }}
              >
                Remover
              </Button>
            </div>
          ))}
        </div>

        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setSubtasks([...subtasks, { title: '', description: '', is_completed: false, order_index: subtasks.length }])} 
          className="w-full dark:border-slate-600 dark:text-slate-200"
        >
          Adicionar Subtarefa
        </Button>

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
