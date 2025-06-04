
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useUserRole = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkUserRole = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setIsAdmin(!!data);
    } catch (error) {
      console.error('Erro ao verificar role do usuário:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserRole();
  }, [user]);

  const makeUserAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao tornar usuário admin:', error);
      return { success: false, error };
    }
  };

  const removeAdminRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao remover role de admin:', error);
      return { success: false, error };
    }
  };

  return {
    isAdmin,
    loading,
    makeUserAdmin,
    removeAdminRole,
    checkUserRole,
  };
};
