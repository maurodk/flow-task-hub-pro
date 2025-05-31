
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/activity';

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

  const initializeFirstAdmin = async () => {
    if (!user) {
      console.error('Usuário não encontrado');
      return { success: false, error: 'Usuário não encontrado' };
    }

    try {
      console.log('Tentando promover usuário para primeiro admin...');
      console.log('ID do usuário:', user.id);
      
      // Tentar inserir diretamente - as políticas RLS cuidarão da validação
      const { data: insertData, error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'admin'
        })
        .select();

      if (insertError) {
        console.error('Erro ao inserir role de admin:', insertError);
        
        // Se o erro for de violação de RLS mas com código específico, pode ser que já existe admin
        if (insertError.code === '23505') {
          return { success: false, error: 'Usuário já é administrador' };
        }
        
        if (insertError.code === '42501' || insertError.message?.includes('policy')) {
          return { success: false, error: 'Já existem administradores no sistema ou erro de permissão' };
        }
        
        throw insertError;
      }

      console.log('Usuário promovido para admin com sucesso!', insertData);
      
      // Atualizar o estado local
      await checkUserRole();
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao inicializar primeiro admin:', error);
      return { 
        success: false, 
        error: error.message || 'Erro desconhecido ao promover usuário'
      };
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
    initializeFirstAdmin,
    checkUserRole,
  };
};
