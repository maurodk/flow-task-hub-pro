
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ActivityLog } from './useActivityLogs';

export const useActivityLog = (activityId: string) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivityLogs = async () => {
    if (!user || !activityId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Buscando logs da atividade:', activityId);
      
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('📋 Logs da atividade encontrados:', data?.length || 0);
      const typedLogs = (data || []).map(log => ({
        ...log,
        action_type: log.action_type as 'created' | 'completed' | 'updated' | 'deleted'
      }));
      
      setLogs(typedLogs);
    } catch (error) {
      console.error('Erro ao buscar logs da atividade:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionText = (log: ActivityLog) => {
    // Se tem detalhes específicos (como subtarefas), usar eles com mais contexto
    if (log.details && log.subtask_title) {
      return `${log.details} "${log.subtask_title}" na atividade "${log.activity_title}"`;
    }
    
    // Caso contrário, usar os textos padrão
    switch (log.action_type) {
      case 'created':
        return `criou a atividade "${log.activity_title}"`;
      case 'completed':
        return `completou a atividade "${log.activity_title}"`;
      case 'updated':
        return `atualizou a atividade "${log.activity_title}"`;
      case 'deleted':
        return `excluiu a atividade "${log.activity_title}"`;
      default:
        return `modificou a atividade "${log.activity_title}"`;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return 'text-green-600 dark:text-green-400';
      case 'completed':
        return 'text-blue-600 dark:text-blue-400';
      case 'updated':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'deleted':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  useEffect(() => {
    fetchActivityLogs();

    // Configurar realtime para logs desta atividade específica
    const channel = supabase
      .channel(`activity-log-${activityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `activity_id=eq.${activityId}`
        },
        (payload) => {
          console.log('📨 Novo log da atividade recebido via realtime:', payload);
          const newLog = {
            ...payload.new,
            action_type: payload.new.action_type as 'created' | 'completed' | 'updated' | 'deleted'
          } as ActivityLog;
          setLogs(prevLogs => [newLog, ...prevLogs]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activityId, user]);

  return {
    logs,
    loading,
    fetchActivityLogs,
    getActionText,
    getActionColor,
  };
};
