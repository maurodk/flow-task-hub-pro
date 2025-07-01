import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useAuth';
import { useSectors } from '@/hooks/useSectors';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, TrendingUp, Clock, User } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  created_at: string;
  progress: number;
  user_id: string;
  updated_at: string;
}

interface ProgressLog {
  id: string;
  activity_id: string;
  user_id: string;
  previous_progress: number;
  new_progress: number;
  comment: string;
  created_at: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { userSectors, loading: sectorsLoading } = useSectors();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending' as 'pending' | 'in_progress' | 'completed',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: '',
  });

  const [progressFormData, setProgressFormData] = useState({
    new_progress: 0,
    comment: '',
  });

  useEffect(() => {
    // Só buscar dados quando todas as dependências estiverem carregadas
    if (!roleLoading && !sectorsLoading) {
      fetchActivities();
      fetchProfiles();
    }
  }, [roleLoading, sectorsLoading, isAdmin, userSectors]);

  const fetchActivities = async () => {
    if (!user || roleLoading || sectorsLoading) return;

    try {
      console.log('🔍 Dashboard: Buscando atividades para usuário:', user.id);
      console.log('👤 É admin?', isAdmin);
      console.log('🏢 Setores do usuário:', userSectors.map(us => us.sector_id));

      // Com RLS ativo, a consulta já está protegida automaticamente
      // Usuários só verão atividades próprias ou de setores onde pertencem
      // Admins verão todas as atividades
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Garantir que os dados estão tipados corretamente
      const typedActivities: Activity[] = (data || []).map(activity => ({
        ...activity,
        status: activity.status as 'pending' | 'in_progress' | 'completed',
        priority: activity.priority as 'low' | 'medium' | 'high',
      }));
      
      console.log('📋 Dashboard: Atividades encontradas (protegidas por RLS):', typedActivities.length);
      setActivities(typedActivities);
    } catch (error: any) {
      console.error('Erro ao buscar atividades:', error);
      if (error.message.includes('row-level security')) {
        toast.error('Erro de permissão ao carregar atividades');
      } else {
        toast.error('Erro ao carregar atividades');
      }
    }
  };

  const fetchProfiles = async () => {
    try {
      // Com RLS ativo, usuários só veem o próprio perfil (ou admin vê todos)
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar perfis:', error);
      if (error.message.includes('row-level security')) {
        console.log('RLS ativo: usuário só vê próprio perfil');
      }
    }
  };

  const fetchProgressLogs = async (activityId: string) => {
    try {
      // Com RLS ativo, usuário só vê logs de atividades que tem acesso
      const { data, error } = await supabase
        .from('activity_progress_logs')
        .select('*')
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProgressLogs(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar logs de progresso:', error);
      if (error.message.includes('row-level security')) {
        toast.error('Você não tem permissão para ver o histórico desta atividade');
      } else {
        toast.error('Erro ao carregar histórico de progresso');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingActivity) {
        // Com RLS ativo, apenas o proprietário ou admin pode atualizar
        const { error } = await supabase
          .from('activities')
          .update(formData)
          .eq('id', editingActivity.id);

        if (error) throw error;
        toast.success('Atividade atualizada com sucesso!');
      } else {
        // Com RLS ativo, user_id deve ser o do usuário autenticado
        const { error } = await supabase
          .from('activities')
          .insert({
            ...formData,
            user_id: user?.id,
          });

        if (error) throw error;
        toast.success('Atividade criada com sucesso!');
      }

      resetForm();
      fetchActivities();
    } catch (error: any) {
      console.error('Erro ao salvar atividade:', error);
      if (error.message.includes('row-level security')) {
        toast.error('Você não tem permissão para esta operação');
      } else {
        toast.error('Erro ao salvar atividade');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    
    if (progressFormData.comment.trim() === '') {
      toast.error('Comentário é obrigatório para registrar progresso');
      return;
    }

    setLoading(true);

    try {
      // Com RLS ativo, apenas usuários autorizados podem criar logs de progresso
      const { error } = await supabase
        .from('activity_progress_logs')
        .insert({
          activity_id: selectedActivity.id,
          user_id: user?.id,
          previous_progress: selectedActivity.progress || 0,
          new_progress: progressFormData.new_progress,
          comment: progressFormData.comment,
        });

      if (error) throw error;
      
      toast.success('Progresso registrado com sucesso!');
      setShowProgressModal(false);
      setProgressFormData({ new_progress: 0, comment: '' });
      fetchActivities();
      if (selectedActivity) {
        fetchProgressLogs(selectedActivity.id);
      }
    } catch (error: any) {
      console.error('Erro ao registrar progresso:', error);
      if (error.message.includes('row-level security')) {
        toast.error('Você não tem permissão para registrar progresso nesta atividade');
      } else {
        toast.error('Erro ao registrar progresso');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      due_date: '',
    });
    setShowForm(false);
    setEditingActivity(null);
  };

  const handleEdit = (activity: Activity) => {
    setFormData({
      title: activity.title,
      description: activity.description,
      status: activity.status,
      priority: activity.priority,
      due_date: activity.due_date || '',
    });
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta atividade?')) return;

    try {
      // Com RLS ativo, apenas o proprietário ou admin pode excluir
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Atividade excluída com sucesso!');
      fetchActivities();
    } catch (error: any) {
      console.error('Erro ao excluir atividade:', error);
      if (error.message.includes('row-level security')) {
        toast.error('Você não tem permissão para excluir esta atividade');
      } else {
        toast.error('Erro ao excluir atividade');
      }
    }
  };

  const handleViewProgress = (activity: Activity) => {
    setSelectedActivity(activity);
    setProgressFormData({ 
      new_progress: activity.progress || 0, 
      comment: '' 
    });
    fetchProgressLogs(activity.id);
    setShowProgressModal(true);
  };

  const getUserName = (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    return profile?.name || profile?.email || 'Usuário desconhecido';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      in_progress: 'secondary',
      completed: 'destructive',
    } as const;

    const labels = {
      pending: 'Pendente',
      in_progress: 'Em Progresso',
      completed: 'Concluída',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };

    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority as keyof typeof colors]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Botão para nova atividade */}
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Atividades</h1>
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Atividade
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due_date">Data de Vencimento</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'pending' | 'in_progress' | 'completed') => 
                        setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: 'low' | 'medium' | 'high') => 
                        setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Modal de Progresso */}
        {showProgressModal && selectedActivity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Progresso: {selectedActivity.title}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setShowProgressModal(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                {/* Progresso Atual */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Progresso Atual</span>
                    <span className="text-sm text-gray-600">{selectedActivity.progress}%</span>
                  </div>
                  <Progress value={selectedActivity.progress} className="w-full" />
                </div>

                {/* Formulário de Novo Progresso */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Registrar Novo Progresso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProgressSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new_progress">Novo Progresso (%)</Label>
                        <Input
                          id="new_progress"
                          type="number"
                          min="0"
                          max="100"
                          value={progressFormData.new_progress}
                          onChange={(e) => setProgressFormData({
                            ...progressFormData,
                            new_progress: parseInt(e.target.value) || 0
                          })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="comment">Comentário (obrigatório)</Label>
                        <Textarea
                          id="comment"
                          value={progressFormData.comment}
                          onChange={(e) => setProgressFormData({
                            ...progressFormData,
                            comment: e.target.value
                          })}
                          placeholder="Descreva o que foi realizado..."
                          required
                          rows={3}
                        />
                      </div>

                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Registrando...' : 'Registrar Progresso'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Histórico de Progresso */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Histórico de Progresso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {progressLogs.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          Nenhum registro de progresso encontrado
                        </p>
                      ) : (
                        progressLogs.map((log) => (
                          <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">
                                {log.previous_progress}% → {log.new_progress}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{log.comment}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {getUserName(log.user_id)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(log.created_at).toLocaleString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{activity.title}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewProgress(activity)}
                      title="Ver progresso"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(activity)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(activity.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(activity.status)}
                  {getPriorityBadge(activity.priority)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{activity.progress || 0}%</span>
                  </div>
                  <Progress value={activity.progress || 0} className="w-full" />
                </div>
              </CardHeader>
              <CardContent>
                {activity.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {activity.description}
                  </p>
                )}
                {activity.due_date && (
                  <p className="text-xs text-gray-500">
                    Vencimento: {new Date(activity.due_date).toLocaleDateString('pt-BR')}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Criado por: {getUserName(activity.user_id)}
                </p>
                <p className="text-xs text-gray-400">
                  Criado em: {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">
              Nenhuma atividade encontrada
            </p>
            <Button onClick={() => setShowForm(true)}>
              Criar sua primeira atividade
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
