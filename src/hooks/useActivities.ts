
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ActivityData, UserTemplate, SubtaskData } from '@/types/activity';

export const useActivities = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          activity_subtasks (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedActivities = data?.map(activity => ({
        ...activity,
        status: activity.status as 'pending' | 'in_progress' | 'completed' | 'on_hold',
        priority: activity.priority as 'low' | 'medium' | 'high',
        activity_type: activity.activity_type as 'standard' | 'template_based' | 'recurring',
        subtasks: activity.activity_subtasks?.sort((a: any, b: any) => a.order_index - b.order_index) || []
      })) || [];

      setActivities(formattedActivities);
    } catch (error: any) {
      console.error('Erro ao buscar atividades:', error);
      toast.error('Erro ao carregar atividades');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTemplates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_activity_templates')
        .select(`
          *,
          user_template_subtasks (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formattedTemplates = data?.map(template => ({
        ...template,
        subtasks: template.user_template_subtasks.sort((a, b) => a.order_index - b.order_index)
      })) || [];

      setUserTemplates(formattedTemplates);
    } catch (error: any) {
      console.error('Erro ao buscar templates:', error);
    }
  };

  const createRecurringActivity = async (formData: any) => {
    if (!user) return;

    try {
      // Calcular próxima execução
      let nextDueAt = null;
      if (formData.is_recurring && formData.recurrence_type && formData.recurrence_time) {
        const now = new Date();
        const [hours, minutes] = formData.recurrence_time.split(':');
        
        switch (formData.recurrence_type) {
          case 'daily':
            nextDueAt = new Date(now);
            nextDueAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            if (nextDueAt <= now) {
              nextDueAt.setDate(nextDueAt.getDate() + 1);
            }
            break;
          case 'weekly':
            nextDueAt = new Date(now);
            nextDueAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            nextDueAt.setDate(nextDueAt.getDate() + (7 - nextDueAt.getDay()));
            break;
          case 'monthly':
            nextDueAt = new Date(now);
            nextDueAt.setMonth(nextDueAt.getMonth() + 1);
            nextDueAt.setDate(1);
            nextDueAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            break;
        }
      }

      const { data: activity, error } = await supabase
        .from('activities')
        .insert({
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          priority: formData.priority,
          due_date: formData.due_date || null,
          activity_type: formData.activity_type,
          is_recurring: formData.is_recurring,
          recurrence_type: formData.recurrence_type || null,
          recurrence_time: formData.recurrence_time || null,
          template_id: formData.template_id || null,
          next_due_at: nextDueAt?.toISOString() || null,
          user_id: user.id,
          progress: 0
        })
        .select()
        .single();

      if (error) throw error;

      return activity;
    } catch (error: any) {
      console.error('Erro ao criar atividade recorrente:', error);
      throw error;
    }
  };

  const toggleSubtask = async (activityId: string, subtaskId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('activity_subtasks')
        .update({ 
          is_completed: !isCompleted,
          completed_at: !isCompleted ? new Date().toISOString() : null
        })
        .eq('id', subtaskId);

      if (error) throw error;

      fetchActivities();
    } catch (error: any) {
      console.error('Erro ao atualizar subtask:', error);
      toast.error('Erro ao atualizar subtarefa');
    }
  };

  const deleteActivity = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      toast.success('Atividade excluída!');
      fetchActivities();
    } catch (error: any) {
      console.error('Erro ao excluir atividade:', error);
      toast.error('Erro ao excluir atividade');
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchUserTemplates();
  }, []);

  return {
    activities,
    userTemplates,
    loading,
    fetchActivities,
    fetchUserTemplates,
    toggleSubtask,
    deleteActivity,
    createRecurringActivity,
  };
};
