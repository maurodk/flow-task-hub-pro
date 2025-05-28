
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { User, Mail, Save } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: user?.email || '',
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          name: data.name || '',
          email: data.email || user.email || '',
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar perfil:', error);
      toast.error('Erro ao carregar perfil');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: profile.name,
          email: profile.email,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = () => {
    if (profile.name) {
      return profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (profile.email) {
      return profile.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas informações pessoais e configurações de conta.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar e informações básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Foto do Perfil</CardTitle>
              <CardDescription>
                Sua foto de perfil será exibida em todo o sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" disabled>
                Alterar Foto (Em breve)
              </Button>
            </CardContent>
          </Card>

          {/* Formulário de perfil */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais aqui.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Digite seu email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="pl-10"
                      disabled
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    O email não pode ser alterado por questões de segurança.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Informações da conta */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>
              Detalhes sobre sua conta no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-500">ID do Usuário</Label>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                  {user?.id}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Data de Cadastro</Label>
                <p className="text-sm mt-1">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
