
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useUserRole = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkUserRole = async () => {
    console.log('🔍 Verificando role do usuário:', user?.id);
    
    if (!user) {
      console.log('❌ Usuário não logado');
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📊 Consultando roles no banco...');
      
      // Agora com RLS ativo, a consulta já está protegida
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      console.log('📋 Resposta da consulta:', { data, error });

      if (error) {
        console.error('❌ Erro na consulta:', error);
        throw error;
      }

      const hasAdminRole = data && data.length > 0;
      console.log('🔐 Usuário é admin?', hasAdminRole);
      
      setIsAdmin(hasAdminRole);
    } catch (error) {
      console.error('💥 Erro ao verificar role do usuário:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
      console.log('✅ Verificação de role finalizada');
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect triggered - user changed:', user?.id);
    checkUserRole();
  }, [user]);

  const makeUserAdmin = async (userId: string) => {
    try {
      console.log('🔧 Tornando usuário admin:', userId);
      
      // Apenas admins podem executar esta operação (protegido por RLS)
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });

      if (error) throw error;
      
      console.log('✅ Usuário promovido a admin com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao tornar usuário admin:', error);
      return { success: false, error };
    }
  };

  const removeAdminRole = async (userId: string) => {
    try {
      console.log('🔧 Removendo role de admin:', userId);
      
      // Apenas admins podem executar esta operação (protegido por RLS)
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) throw error;
      
      console.log('✅ Role de admin removida com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao remover role de admin:', error);
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
