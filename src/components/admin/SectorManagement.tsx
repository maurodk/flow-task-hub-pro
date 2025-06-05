
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSectors } from '@/hooks/useSectors';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, Users, X } from 'lucide-react';

interface User {
  id: string;
  email: string;
  profiles: {
    name: string;
  } | null;
}

const SectorManagement = () => {
  const { sectors, addUserToSector, removeUserFromSector } = useSectors();
  const [users, setUsers] = useState<User[]>([]);
  const [userSectors, setUserSectors] = useState<{[userId: string]: any[]}>({});
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, name');

      if (profilesError) throw profilesError;

      const usersData: User[] = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        profiles: {
          name: profile.name || ''
        }
      })) || [];

      setUsers(usersData);

      // Buscar setores de cada usuário
      const sectorsData: {[userId: string]: any[]} = {};
      
      for (const user of usersData) {
        const { data: userSectorData, error } = await supabase
          .from('user_sectors')
          .select(`
            *,
            sector:sectors(*)
          `)
          .eq('user_id', user.id);

        if (!error) {
          sectorsData[user.id] = userSectorData || [];
        }
      }

      setUserSectors(sectorsData);
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUserToSector = async () => {
    if (!selectedUser || !selectedSector) {
      toast.error('Selecione um usuário e um setor');
      return;
    }

    const result = await addUserToSector(selectedUser, selectedSector);
    if (result.success) {
      setSelectedUser('');
      setSelectedSector('');
      fetchUsers(); // Recarregar dados
    }
  };

  const handleRemoveUserFromSector = async (userId: string, sectorId: string) => {
    const result = await removeUserFromSector(userId, sectorId);
    if (result.success) {
      fetchUsers(); // Recarregar dados
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando setores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Gerenciar Setores dos Usuários</h3>
      </div>

      {/* Adicionar usuário a setor */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Usuário a Setor</CardTitle>
          <CardDescription>
            Adicione um usuário a um setor específico (máximo 3 setores por usuário)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Usuário</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.profiles?.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Setor</label>
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleAddUserToSector}>
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de usuários e seus setores */}
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {user.profiles?.name || 'Sem nome'}
                  </CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm text-gray-500">
                    {userSectors[user.id]?.length || 0}/3 setores
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {userSectors[user.id]?.length > 0 ? (
                  userSectors[user.id].map((userSector: any) => (
                    <Badge key={userSector.id} variant="secondary" className="flex items-center gap-2">
                      {userSector.sector?.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRemoveUserFromSector(user.id, userSector.sector_id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">Nenhum setor atribuído</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SectorManagement;
