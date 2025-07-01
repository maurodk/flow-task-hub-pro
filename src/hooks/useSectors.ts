
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Sector {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSector {
  id: string;
  user_id: string;
  sector_id: string;
  created_at: string;
  sector?: Sector;
}

export const useSectors = () => {
  const { user } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [userSectors, setUserSectors] = useState<UserSector[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSectors = async () => {
    try {
      console.log('🔍 Fetching all sectors...');
      // Com RLS ativo, usuários autenticados podem ver todos os setores
      const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .order('name');

      if (error) throw error;
      console.log('📋 Sectors loaded:', data?.length || 0);
      setSectors(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar setores:', error);
      toast.error('Erro ao carregar setores');
    }
  };

  const fetchUserSectors = async () => {
    if (!user) {
      console.log('👤 No user, skipping user sectors fetch');
      setUserSectors([]);
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Fetching user sectors for:', user.id);
      // Com RLS ativo, usuário só vê seus próprios setores (ou admin vê todos)
      const { data, error } = await supabase
        .from('user_sectors')
        .select(`
          *,
          sector:sectors(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      console.log('📋 User sectors loaded:', data?.length || 0, data?.map(us => us.sector?.name));
      setUserSectors(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar setores do usuário:', error);
      toast.error('Erro ao carregar setores do usuário');
    } finally {
      setLoading(false);
    }
  };

  const addUserToSector = async (userId: string, sectorId: string) => {
    try {
      console.log('➕ Adding user to sector:', { userId, sectorId });
      // Apenas admins podem adicionar usuários a setores (protegido por RLS)
      const { error } = await supabase
        .from('user_sectors')
        .insert({
          user_id: userId,
          sector_id: sectorId
        });

      if (error) throw error;
      toast.success('Usuário adicionado ao setor com sucesso!');
      
      // Refresh user sectors if it's the current user
      if (userId === user?.id) {
        await fetchUserSectors();
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao adicionar usuário ao setor:', error);
      if (error.message.includes('3 setores')) {
        toast.error('Usuário já atingiu o limite máximo de 3 setores');
      } else if (error.message.includes('row-level security')) {
        toast.error('Apenas administradores podem gerenciar setores de usuários');
      } else {
        toast.error('Erro ao adicionar usuário ao setor');
      }
      return { success: false, error };
    }
  };

  const removeUserFromSector = async (userId: string, sectorId: string) => {
    try {
      console.log('➖ Removing user from sector:', { userId, sectorId });
      // Apenas admins podem remover usuários de setores (protegido por RLS)
      const { error } = await supabase
        .from('user_sectors')
        .delete()
        .eq('user_id', userId)
        .eq('sector_id', sectorId);

      if (error) throw error;
      toast.success('Usuário removido do setor com sucesso!');
      
      // Refresh user sectors if it's the current user
      if (userId === user?.id) {
        await fetchUserSectors();
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao remover usuário do setor:', error);
      if (error.message.includes('row-level security')) {
        toast.error('Apenas administradores podem gerenciar setores de usuários');
      } else {
        toast.error('Erro ao remover usuário do setor');
      }
      return { success: false, error };
    }
  };

  const getUserSectors = (userId: string) => {
    return userSectors.filter(us => us.user_id === userId);
  };

  const getUserSectorIds = (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return [];
    
    return userSectors
      .filter(us => us.user_id === targetUserId)
      .map(us => us.sector_id);
  };

  const getUserSectorNames = (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return [];
    
    return userSectors
      .filter(us => us.user_id === targetUserId && us.sector)
      .map(us => us.sector!.name);
  };

  useEffect(() => {
    console.log('🔄 useSectors useEffect triggered, user:', user?.id);
    fetchSectors();
    fetchUserSectors();
  }, [user]);

  return {
    sectors,
    userSectors,
    loading,
    fetchSectors,
    fetchUserSectors,
    addUserToSector,
    removeUserFromSector,
    getUserSectors,
    getUserSectorIds,
    getUserSectorNames,
  };
};
