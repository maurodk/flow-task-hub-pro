import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AdminActionLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  target_title?: string;
  target_user_id?: string;
  target_user_name?: string;
  details: any;
  created_at: string;
}

export const useAdminLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar se usuário é admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        setIsAdmin(!!data);
      } catch (error) {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Buscar logs administrativos
  const fetchAdminLogs = async () => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admin_action_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao buscar logs administrativos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminLogs();
    }
  }, [isAdmin, user]);

  return {
    logs,
    loading,
    isAdmin,
    fetchAdminLogs
  };
};