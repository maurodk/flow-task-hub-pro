
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Users, Key, Mail } from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  profiles: {
    name: string;
  } | null;
  user_roles: {
    role: string;
  }[];
}

const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          name,
          created_at,
          user_roles!inner(role)
        `);

      if (error) throw error;

      // Buscar informações completas dos usuários
      const userPromises = data?.map(async (profile) => {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
        return {
          id: profile.id,
          email: profile.email || authUser.user?.email || '',
          created_at: profile.created_at,
          profiles: {
            name: profile.name || ''
          },
          user_roles: profile.user_roles || []
        };
      }) || [];

      const usersData = await Promise.all(userPromises);
      setUsers(usersData);
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      if (isCurrentlyAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;
        toast.success('Permissão de administrador removida');
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin'
          });

        if (error) throw error;
        toast.success('Usuário promovido a administrador');
      }

      fetchUsers();
    } catch (error: any) {
      console.error('Erro ao alterar role:', error);
      toast.error('Erro ao alterar permissões');
    }
  };

  const updateUserPassword = async () => {
    if (!selectedUser || !newPassword) return;

    try {
      const { error } = await supabase.auth.admin.updateUserById(selectedUser.id, {
        password: newPassword
      });

      if (error) throw error;

      toast.success('Senha atualizada com sucesso');
      setNewPassword('');
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      toast.error('Erro ao atualizar senha');
    }
  };

  const updateUserEmail = async () => {
    if (!selectedUser || !newEmail) return;

    try {
      const { error } = await supabase.auth.admin.updateUserById(selectedUser.id, {
        email: newEmail
      });

      if (error) throw error;

      toast.success('Email atualizado com sucesso');
      setNewEmail('');
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Erro ao atualizar email:', error);
      toast.error('Erro ao atualizar email');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const isAdmin = (user: User) => {
    return user.user_roles.some(role => role.role === 'admin');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Gerenciar Acessos</h2>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
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
                      {isAdmin(user) && (
                        <Badge variant="secondary">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant={isAdmin(user) ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleAdminRole(user.id, isAdmin(user))}
                    >
                      {isAdmin(user) ? 'Remover Admin' : 'Tornar Admin'}
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewPassword('');
                          }}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Alterar Senha
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Alterar Senha</DialogTitle>
                          <DialogDescription>
                            Alterar senha para {user.profiles?.name || user.email}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="new-password">Nova Senha</Label>
                            <Input
                              id="new-password"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Digite a nova senha"
                            />
                          </div>
                          <Button onClick={updateUserPassword} disabled={!newPassword}>
                            Atualizar Senha
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewEmail(user.email);
                          }}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Alterar Email
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Alterar Email</DialogTitle>
                          <DialogDescription>
                            Alterar email para {user.profiles?.name || user.email}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="new-email">Novo Email</Label>
                            <Input
                              id="new-email"
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="Digite o novo email"
                            />
                          </div>
                          <Button onClick={updateUserEmail} disabled={!newEmail}>
                            Atualizar Email
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
