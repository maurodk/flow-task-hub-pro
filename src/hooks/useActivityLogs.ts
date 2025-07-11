
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSectors } from '@/hooks/useSectors';

export interface ActivityLog {
  id: string;
  activity_id: string | null;
  user_id: string;
  action_type: 'created' | 'completed' | 'updated' | 'deleted';
  sector_id: string | null;
  created_at: string;
  user_name: string | null;
  activity_title: string;
  details?: string | null;
  subtask_title?: string | null;
}

export const useActivityLogs = () => {
  const { user } = useAuth();
  const { userSectors } = useSectors();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (limit = 5): Promise<ActivityLog[]> => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return [];
    }

    try {
      console.log('🔍 Buscando logs de atividades...');
      
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      console.log('📋 Logs encontrados:', data?.length || 0);
      const typedLogs = (data || []).map(log => ({
        ...log,
        action_type: log.action_type as 'created' | 'completed' | 'updated' | 'deleted'
      }));
      
      setLogs(typedLogs);
      return typedLogs;
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      setLogs([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getActionText = (log: ActivityLog) => {
    // Priorizar detalhes específicos com contexto completo
    if (log.details && log.subtask_title) {
      return `${log.details} "${log.subtask_title}" na atividade "${log.activity_title}"`;
    }
    
    // Se tem detalhes específicos mas não é de subtarefa, usar os detalhes
    if (log.details) {
      return `${log.details} "${log.activity_title}"`;
    }
    
    // Caso contrário, usar os textos padrão com o título da atividade
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
    fetchLogs();

    // Configurar realtime para logs
    const channel = supabase
      .channel('activity-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs'
        },
        (payload) => {
          console.log('📨 Novo log recebido via realtime:', payload);
          const newLog = {
            ...payload.new,
            action_type: payload.new.action_type as 'created' | 'completed' | 'updated' | 'deleted'
          } as ActivityLog;
          setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 4)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    logs,
    loading,
    fetchLogs,
    getActionText,
    getActionColor,
  };
};
