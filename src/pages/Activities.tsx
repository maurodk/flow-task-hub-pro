
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, TrendingUp, Clock, User, Repeat, CheckSquare, Calendar } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  created_at: string;
  progress: number;
  user_id: string;
  updated_at: string;
  is_recurring: boolean;
  recurrence_type: 'daily' | 'weekly' | 'monthly' | 'biannual' | 'annual' | null;
  recurrence_time: string | null;
  last_completed_at: string | null;
  next_due_at: string | null;
  activity_type: 'standard' | 'template_based' | 'recurring';
  template_id: string | null;
}

interface ActivityTemplate {
  id: string;
  name: string;
  description: string;
}

interface TemplateSubtask {
  id: string;
  template_id: string;
  title: string;
  description: string;
  order_index: number;
}

interface ActivitySubtask {
  id: string;
  activity_id: string;
  title: string;
  description: string;
  is_completed: boolean;
  order_index: number;
  completed_at: string | null;
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

const Activities = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSubtasksModal, setShowSubtasksModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activitySubtasks, setActivitySubtasks] = useState<ActivitySubtask[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('standard');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'on_hold',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: '',
    activity_type: 'standard' as 'standard' | 'template_based' | 'recurring',
    template_id: '',
    is_recurring: false,
    recurrence_type: 'daily' as 'daily' | 'weekly' | 'monthly' | 'biannual' | 'annual',
    recurrence_time: '09:00',
  });

  const [progressFormData, setProgressFormData] = useState({
    new_progress: 0,
    comment: '',
  });

  useEffect(() => {
    fetchActivities();
    fetchProfiles();
    fetchTemplates();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedActivities: Activity[] = (data || []).map(activity => ({
        ...activity,
        status: activity.status as 'pending' | 'in_progress' | 'completed' | 'on_hold',
        priority: activity.priority as 'low' | 'medium' | 'high',
        activity_type: activity.activity_type as 'standard' | 'template_based' | 'recurring',
        recurrence_type: activity.recurrence_type as 'daily' | 'weekly' | 'monthly' | 'biannual' | 'annual' | null,
      }));
      
      setActivities(typedActivities);
    } catch (error: any) {
      console.error('Erro ao buscar atividades:', error);
      toast.error('Erro ao carregar atividades');
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar templates:', error);
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

  const fetchActivitySubtasks = async (activityId: string) => {
    try {
      const { data, error } = await supabase
        .from('activity_subtasks')
        .select('*')
        .eq('activity_id', activityId)
        .order('order_index');

      if (error) throw error;
      setActivitySubtasks(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar subtarefas:', error);
    }
  };

  const fetchProgressLogs = async (activityId: string) => {
    try {
      const { data, error } = await supabase
        .from('activity_progress_logs')
        .select('*')
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProgressLogs(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar logs de progresso:', error);
      toast.error('Erro ao carregar histórico de progresso');
    }
  };

  const createActivityFromTemplate = async (templateId: string, title: string) => {
    try {
      // Buscar subtarefas do template
      const { data: templateSubtasks, error: subtasksError } = await supabase
        .from('activity_template_subtasks')
        .select('*')
        .eq('template_id', templateId)
        .order('order_index');

      if (subtasksError) throw subtasksError;

      // Criar a atividade
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .insert({
          title,
          description: formData.description,
          activity_type: 'template_based',
          template_id: templateId,
          user_id: user?.id,
          status: 'pending',
          priority: formData.priority,
          due_date: formData.due_date || null,
          progress: 0,
        })
        .select()
        .single();

      if (activityError) throw activityError;

      // Criar as subtarefas
      if (templateSubtasks && templateSubtasks.length > 0) {
        const subtasksToInsert = templateSubtasks.map(subtask => ({
          activity_id: activity.id,
          title: subtask.title,
          description: subtask.description,
          order_index: subtask.order_index,
          is_completed: false,
        }));

        const { error: insertError } = await supabase
          .from('activity_subtasks')
          .insert(subtasksToInsert);

        if (insertError) throw insertError;
      }

      return activity;
    } catch (error) {
      console.error('Erro ao criar atividade do template:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingActivity) {
        const { error } = await supabase
          .from('activities')
          .update({
            title: formData.title,
            description: formData.description,
            status: formData.status,
            priority: formData.priority,
            due_date: formData.due_date || null,
            is_recurring: formData.is_recurring,
            recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
            recurrence_time: formData.is_recurring ? formData.recurrence_time : null,
            activity_type: formData.activity_type,
          })
          .eq('id', editingActivity.id);

        if (error) throw error;
        toast.success('Atividade atualizada com sucesso!');
      } else {
        if (formData.activity_type === 'template_based' && formData.template_id) {
          await createActivityFromTemplate(formData.template_id, formData.title);
        } else {
          const { error } = await supabase
            .from('activities')
            .insert({
              title: formData.title,
              description: formData.description,
              status: formData.status,
              priority: formData.priority,
              due_date: formData.due_date || null,
              user_id: user?.id,
              activity_type: formData.activity_type,
              is_recurring: formData.is_recurring,
              recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
              recurrence_time: formData.is_recurring ? formData.recurrence_time : null,
            });

          if (error) throw error;
        }
        toast.success('Atividade criada com sucesso!');
      }

      resetForm();
      fetchActivities();
    } catch (error: any) {
      console.error('Erro ao salvar atividade:', error);
      toast.error('Erro ao salvar atividade');
    } finally {
      setLoading(false);
    }
  };

  const handleSubtaskToggle = async (subtaskId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('activity_subtasks')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', subtaskId);

      if (error) throw error;

      // Atualizar lista local
      setActivitySubtasks(prev => 
        prev.map(subtask => 
          subtask.id === subtaskId 
            ? { ...subtask, is_completed: isCompleted, completed_at: isCompleted ? new Date().toISOString() : null }
            : subtask
        )
      );

      toast.success('Subtarefa atualizada!');
    } catch (error: any) {
      console.error('Erro ao atualizar subtarefa:', error);
      toast.error('Erro ao atualizar subtarefa');
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
      toast.error('Erro ao registrar progresso');
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
      activity_type: 'standard',
      template_id: '',
      is_recurring: false,
      recurrence_type: 'daily',
      recurrence_time: '09:00',
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
      activity_type: activity.activity_type,
      template_id: activity.template_id || '',
      is_recurring: activity.is_recurring || false,
      recurrence_type: activity.recurrence_type || 'daily',
      recurrence_time: activity.recurrence_time || '09:00',
    });
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta atividade?')) return;

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Atividade excluída com sucesso!');
      fetchActivities();
    } catch (error: any) {
      console.error('Erro ao excluir atividade:', error);
      toast.error('Erro ao excluir atividade');
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

  const handleViewSubtasks = (activity: Activity) => {
    setSelectedActivity(activity);
    fetchActivitySubtasks(activity.id);
    setShowSubtasksModal(true);
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
      on_hold: 'outline',
    } as const;

    const labels = {
      pending: 'Pendente',
      in_progress: 'Em Progresso',
      completed: 'Concluída',
      on_hold: 'Em Espera',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
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

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'recurring':
        return <Repeat className="h-4 w-4 text-blue-500" />;
      case 'template_based':
        return <CheckSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRecurrenceLabel = (type: string | null) => {
    const labels = {
      daily: 'Diária',
      weekly: 'Semanal',
      monthly: 'Mensal',
      biannual: 'Semestral',
      annual: 'Anual',
    };
    return type ? labels[type as keyof typeof labels] : '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Atividades</h1>
            <p className="text-gray-600 dark:text-gray-300">Gerencie suas atividades e acompanhe o progresso</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Nova Atividade
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
            <CardHeader>
              <CardTitle>
                {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="standard" onClick={() => setFormData({...formData, activity_type: 'standard'})}>
                      Padrão
                    </TabsTrigger>
                    <TabsTrigger value="recurring" onClick={() => setFormData({...formData, activity_type: 'recurring'})}>
                      Repetitiva
                    </TabsTrigger>
                    <TabsTrigger value="template_based" onClick={() => setFormData({...formData, activity_type: 'template_based'})}>
                      Predefinida
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="standard" className="space-y-4">
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
                  </TabsContent>

                  <TabsContent value="recurring" className="space-y-4">
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
                        <Label>Frequência</Label>
                        <Select
                          value={formData.recurrence_type}
                          onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'biannual' | 'annual') => 
                            setFormData({ ...formData, recurrence_type: value, is_recurring: true })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Diária</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                            <SelectItem value="biannual">Semestral</SelectItem>
                            <SelectItem value="annual">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recurrence_time">Horário Limite</Label>
                      <Input
                        id="recurrence_time"
                        type="time"
                        value={formData.recurrence_time}
                        onChange={(e) => setFormData({ ...formData, recurrence_time: e.target.value })}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="template_based" className="space-y-4">
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
                        <Label>Template</Label>
                        <Select
                          value={formData.template_id}
                          onValueChange={(value) => setFormData({ ...formData, template_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

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
                      onValueChange={(value: 'pending' | 'in_progress' | 'completed' | 'on_hold') => 
                        setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                        <SelectItem value="on_hold">Em Espera</SelectItem>
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
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">
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
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium dark:text-white">Progresso Atual</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{selectedActivity.progress}%</span>
                  </div>
                  <Progress value={selectedActivity.progress} className="w-full" />
                </div>

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
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{log.comment}</p>
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

        {/* Modal de Subtarefas */}
        {showSubtasksModal && selectedActivity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">
                  Subtarefas: {selectedActivity.title}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setShowSubtasksModal(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                {activitySubtasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Nenhuma subtarefa encontrada
                  </p>
                ) : (
                  activitySubtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={subtask.is_completed}
                        onCheckedChange={(checked) => handleSubtaskToggle(subtask.id, !!checked)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className={`font-medium ${subtask.is_completed ? 'line-through text-gray-500' : 'dark:text-white'}`}>
                          {subtask.title}
                        </h4>
                        {subtask.description && (
                          <p className={`text-sm ${subtask.is_completed ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                            {subtask.description}
                          </p>
                        )}
                        {subtask.completed_at && (
                          <p className="text-xs text-green-600 mt-1">
                            Concluída em: {new Date(subtask.completed_at).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getActivityTypeIcon(activity.activity_type)}
                    <CardTitle className="text-lg dark:text-white">{activity.title}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    {activity.activity_type === 'template_based' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewSubtasks(activity)}
                        title="Ver subtarefas"
                      >
                        <CheckSquare className="h-4 w-4" />
                      </Button>
                    )}
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
                <div className="flex gap-2 flex-wrap">
                  {getStatusBadge(activity.status)}
                  {getPriorityBadge(activity.priority)}
                  {activity.is_recurring && (
                    <Badge variant="outline" className="text-xs">
                      {getRecurrenceLabel(activity.recurrence_type)}
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-300">Progresso</span>
                    <span className="dark:text-gray-300">{activity.progress || 0}%</span>
                  </div>
                  <Progress value={activity.progress || 0} className="w-full" />
                </div>
              </CardHeader>
              <CardContent>
                {activity.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {activity.description}
                  </p>
                )}
                {activity.due_date && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Vencimento: {new Date(activity.due_date).toLocaleDateString('pt-BR')}
                  </p>
                )}
                {activity.is_recurring && activity.recurrence_time && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Horário limite: {activity.recurrence_time}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Criado por: {getUserName(activity.user_id)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Criado em: {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
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

export default Activities;
