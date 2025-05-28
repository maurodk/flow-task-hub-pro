
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MessageSquare, Plus, Clock, User, TrendingUp } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'update' | 'achievement';
  user_id: string;
  created_at: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
}

const Mural = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'announcement' as 'announcement' | 'update' | 'achievement',
  });

  useEffect(() => {
    fetchPosts();
    fetchProfiles();
  }, []);

  const fetchPosts = async () => {
    try {
      // Simulando posts já que não temos tabela no banco ainda
      const mockPosts: Post[] = [
        {
          id: '1',
          title: 'Nova versão do sistema lançada!',
          content: 'Estamos felizes em anunciar que a nova versão do sistema de atividades foi lançada com melhorias na interface e novas funcionalidades.',
          type: 'announcement',
          user_id: user?.id || '',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Projeto Alpha concluído com sucesso',
          content: 'A equipe conseguiu finalizar o Projeto Alpha antes do prazo! Parabéns a todos os envolvidos.',
          type: 'achievement',
          user_id: user?.id || '',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          title: 'Atualização nos procedimentos de segurança',
          content: 'Foram implementadas novas medidas de segurança no sistema. Todos os usuários devem revisar as diretrizes atualizadas.',
          type: 'update',
          user_id: user?.id || '',
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ];
      setPosts(mockPosts);
    } catch (error: any) {
      console.error('Erro ao buscar posts:', error);
      toast.error('Erro ao carregar posts');
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar perfis:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulando criação de post
      const newPost: Post = {
        id: Date.now().toString(),
        title: formData.title,
        content: formData.content,
        type: formData.type,
        user_id: user?.id || '',
        created_at: new Date().toISOString(),
      };

      setPosts(prev => [newPost, ...prev]);
      toast.success('Post criado com sucesso!');
      resetForm();
    } catch (error: any) {
      console.error('Erro ao criar post:', error);
      toast.error('Erro ao criar post');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'announcement',
    });
    setShowForm(false);
  };

  const getUserName = (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    return profile?.name || profile?.email || 'Usuário';
  };

  const getUserInitials = (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    const name = profile?.name || profile?.email || 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const getTypeConfig = (type: string) => {
    const configs = {
      announcement: {
        label: 'Comunicado',
        icon: MessageSquare,
        color: 'bg-blue-100 text-blue-800',
      },
      update: {
        label: 'Atualização',
        icon: TrendingUp,
        color: 'bg-green-100 text-green-800',
      },
      achievement: {
        label: 'Conquista',
        icon: TrendingUp,
        color: 'bg-yellow-100 text-yellow-800',
      },
    };

    return configs[type as keyof typeof configs] || configs.announcement;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mural de Comunicados</h1>
            <p className="text-gray-600 mt-2">
              Acompanhe as últimas novidades e atualizações do sistema.
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Publicação
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Nova Publicação</CardTitle>
              <CardDescription>
                Compartilhe comunicados, atualizações ou conquistas com a equipe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Digite o título da publicação"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Digite o conteúdo da publicação"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Publicação</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="announcement">Comunicado</option>
                    <option value="update">Atualização</option>
                    <option value="achievement">Conquista</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Publicando...' : 'Publicar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg mb-4">
                  Nenhuma publicação encontrada
                </p>
                <Button onClick={() => setShowForm(true)}>
                  Criar primeira publicação
                </Button>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => {
              const typeConfig = getTypeConfig(post.type);
              const TypeIcon = typeConfig.icon;

              return (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {getUserInitials(post.user_id)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {getUserName(post.user_id)}
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(post.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className={typeConfig.color}>
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {typeConfig.label}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{post.content}</p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Mural;
