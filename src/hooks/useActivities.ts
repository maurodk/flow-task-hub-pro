
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useAuth';
import { useSectors } from '@/hooks/useSectors';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ActivityData, UserTemplate, SubtaskData } from '@/types/activity';

export const useActivities = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { userSectors, loading: sectorsLoading } = useSectors();
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchActivities = async (sectorFilter?: string) => {
    if (!user || roleLoading || sectorsLoading) return;

    try {
      console.log('🔍 Buscando atividades para usuário:', user.id);
      console.log('👤 É admin?', isAdmin);
      console.log('🏢 Setores do usuário:', userSectors.map(us => us.sector_id));

      // Com RLS ativo, a consulta já está protegida automaticamente
      // Usuários só verão atividades próprias ou de setores onde pertencem
      // Admins verão todas as atividades
      let query = supabase
        .from('activities')
        .select(`
          *,
          activity_subtasks (*),
          sector:sectors(name)
        `);

      // Aplicar filtro de setor específico se selecionado
      if (sectorFilter) {
        query = query.eq('sector_id', sectorFilter);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const formattedActivities = data?.map(activity => ({
        ...activity,
        // Converter "on_hold" para "pending" para manter compatibilidade
        status: activity.status === 'on_hold' ? 'pending' : activity.status as 'pending' | 'in_progress' | 'completed',
        priority: activity.priority as 'low' | 'medium' | 'high',
        activity_type: activity.activity_type as 'standard' | 'template_based' | 'recurring',
        subtasks: activity.activity_subtasks?.sort((a: any, b: any) => a.order_index - b.order_index) || [],
        sector_name: activity.sector?.name || null
      })) || [];

      console.log('📋 Atividades encontradas (protegidas por RLS):', formattedActivities.length);
      setActivities(formattedActivities);
    } catch (error: any) {
      console.error('Erro ao buscar atividades:', error);
      if (error.message.includes('row-level security')) {
        toast.error('Erro de permissão ao carregar atividades');
      } else {
        toast.error('Erro ao carregar atividades');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTemplates = async () => {
    if (!user) return;

    try {
      // Com RLS ativo, usuário só vê seus próprios templates
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
      if (error.message.includes('row-level security')) {
        toast.error('Erro de permissão ao carregar templates');
      }
    }
  };

  const calculateNextDueDate = (recurrenceType: string, recurrenceTime: string): Date => {
    const now = new Date();
    const nextDue = new Date(now);
    const interval = parseInt(recurrenceTime) || 1;
    
    switch (recurrenceType) {
      case 'daily':
        nextDue.setDate(nextDue.getDate() + interval);
        break;
      case 'weekly':
        nextDue.setDate(nextDue.getDate() + (7 * interval));
        break;
      case 'monthly':
        nextDue.setMonth(nextDue.getMonth() + interval);
        break;
    }
    
    return nextDue;
  };

  const createActivity = async (formData: any) => {
    if (!user) return;

    try {
      // Calcular próxima execução para atividades recorrentes
      let nextDueAt = null;
      if (formData.is_recurring && formData.recurrence_type && formData.recurrence_time) {
        nextDueAt = calculateNextDueDate(formData.recurrence_type, formData.recurrence_time);
      }

      // Com RLS ativo, apenas o próprio usuário pode criar atividades em seu nome
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
          sector_id: formData.sector_id || null,
          next_due_at: nextDueAt?.toISOString() || null,
          user_id: user.id,
          progress: 0
        })
        .select()
        .single();

      if (error) throw error;

      return activity;
    } catch (error: any) {
      console.error('Erro ao criar atividade:', error);
      if (error.message.includes('row-level security')) {
        toast.error('Erro de permissão ao criar atividade');
      }
      throw error;
    }
  };

  const toggleSubtask = async (activityId: string, subtaskId: string, isCompleted: boolean) => {
    try {
      // Com RLS ativo, apenas usuários autorizados podem modificar subtasks
      const { error } = await supabase
        .from('activity_subtasks')
        .update({ 
          is_completed: !isCompleted,
          completed_at: !isCompleted ? new Date().toISOString() : null
        })
        .eq('id', subtaskId);

      if (error) throw error;

      fetchActivities(selectedSector);
    } catch (error: any) {
      console.error('Erro ao atualizar subtask:', error);
      if (error.message.includes('row-level security')) {
        toast.error('Você não tem permissão para modificar esta subtarefa');
      } else {
        toast.error('Erro ao atualizar subtarefa');
      }
    }
  };

  const deleteActivity = async (activityId: string) => {
    try {
      // Com RLS ativo, apenas o proprietário ou admin pode excluir
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      toast.success('Atividade excluída!');
      fetchActivities(selectedSector);
    } catch (error: any) {
      console.error('Erro ao excluir atividade:', error);
      if (error.message.includes('row-level security')) {
        toast.error('Você não tem permissão para excluir esta atividade');
      } else {
        toast.error('Erro ao excluir atividade');
      }
    }
  };

  useEffect(() => {
    // Só buscar atividades quando todas as dependências estiverem carregadas
    if (!roleLoading && !sectorsLoading) {
      fetchActivities(selectedSector);
      fetchUserTemplates();
    }
  }, [selectedSector, roleLoading, sectorsLoading, isAdmin, userSectors]);

  return {
    activities,
    userTemplates,
    selectedSector,
    loading,
    setSelectedSector,
    fetchActivities,
    fetchUserTemplates,
    toggleSubtask,
    deleteActivity,
    createActivity,
  };
};
