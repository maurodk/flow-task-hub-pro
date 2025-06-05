
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
      const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .order('name');

      if (error) throw error;
      setSectors(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar setores:', error);
      toast.error('Erro ao carregar setores');
    }
  };

  const fetchUserSectors = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_sectors')
        .select(`
          *,
          sector:sectors(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
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
      const { error } = await supabase
        .from('user_sectors')
        .insert({
          user_id: userId,
          sector_id: sectorId
        });

      if (error) throw error;
      toast.success('Usuário adicionado ao setor com sucesso!');
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao adicionar usuário ao setor:', error);
      if (error.message.includes('3 setores')) {
        toast.error('Usuário já atingiu o limite máximo de 3 setores');
      } else {
        toast.error('Erro ao adicionar usuário ao setor');
      }
      return { success: false, error };
    }
  };

  const removeUserFromSector = async (userId: string, sectorId: string) => {
    try {
      const { error } = await supabase
        .from('user_sectors')
        .delete()
        .eq('user_id', userId)
        .eq('sector_id', sectorId);

      if (error) throw error;
      toast.success('Usuário removido do setor com sucesso!');
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao remover usuário do setor:', error);
      toast.error('Erro ao remover usuário do setor');
      return { success: false, error };
    }
  };

  const getUserSectors = (userId: string) => {
    return userSectors.filter(us => us.user_id === userId);
  };

  useEffect(() => {
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
  };
};
