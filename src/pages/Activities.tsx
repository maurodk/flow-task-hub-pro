import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Calendar, CheckCircle, Clock, Pause, Activity, FileTemplate } from 'lucide-react';
import ActivityTemplateManager from '@/components/ActivityTemplateManager';

interface ActivityData {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  progress: number;
  activity_type: 'standard' | 'template_based' | 'recurring';
  is_recurring: boolean;
  recurrence_type: string | null;
  recurrence_time: string | null;
  created_at: string;
  template_id: string | null;
  subtasks?: SubtaskData[];
}

interface SubtaskData {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  order_index: number;
}

interface UserTemplate {
  id: string;
  name: string;
  description: string | null;
  subtasks: UserTemplateSubtask[];
}

interface UserTemplateSubtask {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
}

const Activities = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityData | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  const [activityForm, setActivityForm] = useState({
    title: '',
    description: '',
    status: 'pending' as const,
    priority: 'medium' as const,
    due_date: '',
    activity_type: 'standard' as const,
    is_recurring: false,
    recurrence_type: '',
    recurrence_time: '',
    template_id: '',
  });

  const [subtasks, setSubtasks] = useState<Omit<SubtaskData, 'id'>[]>([]);

  useEffect(() => {
    fetchActivities();
    fetchUserTemplates();
  }, []);

  const fetchActivities = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          activity_subtasks (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedActivities = data?.map(activity => ({
        ...activity,
        subtasks: activity.activity_subtasks?.sort((a: any, b: any) => a.order_index - b.order_index) || []
      })) || [];

      setActivities(formattedActivities);
    } catch (error: any) {
      console.error('Erro ao buscar atividades:', error);
      toast.error('Erro ao carregar atividades');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTemplates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_activity_templates')
        .select(`
          *,
          user_template_subtasks (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formattedTemplates = data?.map(template => ({
        ...template,
        subtasks: template.user_template_subtasks.sort((a, b) => a.order_index - b.order_index)
      })) || [];

      setUserTemplates(formattedTemplates);
    } catch (error: any) {
      console.error('Erro ao buscar templates:', error);
    }
  };

  const handleSaveActivity = async () => {
    if (!user || !activityForm.title.trim()) {
      toast.error('Título da atividade é obrigatório');
      return;
    }

    try {
      let activityId: string;

      const activityData = {
        user_id: user.id,
        title: activityForm.title,
        description: activityForm.description || null,
        status: activityForm.status,
        priority: activityForm.priority,
        due_date: activityForm.due_date || null,
        activity_type: activityForm.activity_type,
        is_recurring: activityForm.is_recurring,
        recurrence_type: activityForm.is_recurring ? activityForm.recurrence_type || null : null,
        recurrence_time: activityForm.is_recurring ? activityForm.recurrence_time || null : null,
        template_id: activityForm.activity_type === 'template_based' ? activityForm.template_id || null : null,
        progress: 0,
      };

      if (editingActivity) {
        const { error } = await supabase
          .from('activities')
          .update({
            ...activityData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingActivity.id);

        if (error) throw error;
        activityId = editingActivity.id;

        await supabase
          .from('activity_subtasks')
          .delete()
          .eq('activity_id', activityId);
      } else {
        const { data, error } = await supabase
          .from('activities')
          .insert(activityData)
          .select()
          .single();

        if (error) throw error;
        activityId = data.id;
      }

      if (subtasks.length > 0) {
        const subtasksToInsert = subtasks.map((subtask, index) => ({
          activity_id: activityId,
          title: subtask.title,
          description: subtask.description,
          order_index: index,
          is_completed: subtask.is_completed,
        }));

        const { error: subtasksError } = await supabase
          .from('activity_subtasks')
          .insert(subtasksToInsert);

        if (subtasksError) throw subtasksError;
      }

      toast.success(editingActivity ? 'Atividade atualizada!' : 'Atividade criada!');
      setIsDialogOpen(false);
      resetForm();
      fetchActivities();
    } catch (error: any) {
      console.error('Erro ao salvar atividade:', error);
      toast.error('Erro ao salvar atividade');
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = userTemplates.find(t => t.id === templateId);
    if (!template) return;

    setActivityForm(prev => ({ ...prev, template_id: templateId }));
    setSubtasks(template.subtasks.map(st => ({
      title: st.title,
      description: st.description,
      is_completed: false,
      order_index: st.order_index,
    })));
  };

  const toggleSubtask = async (activityId: string, subtaskId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('activity_subtasks')
        .update({ 
          is_completed: !isCompleted,
          completed_at: !isCompleted ? new Date().toISOString() : null
        })
        .eq('id', subtaskId);

      if (error) throw error;

      fetchActivities();
    } catch (error: any) {
      console.error('Erro ao atualizar subtask:', error);
      toast.error('Erro ao atualizar subtarefa');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      toast.success('Atividade excluída!');
      fetchActivities();
    } catch (error: any) {
      console.error('Erro ao excluir atividade:', error);
      toast.error('Erro ao excluir atividade');
    }
  };

  const handleEditActivity = (activity: ActivityData) => {
    setEditingActivity(activity);
    setActivityForm({
      title: activity.title,
      description: activity.description || '',
      status: activity.status,
      priority: activity.priority,
      due_date: activity.due_date || '',
      activity_type: activity.activity_type,
      is_recurring: activity.is_recurring || false,
      recurrence_type: activity.recurrence_type || '',
      recurrence_time: activity.recurrence_time || '',
      template_id: activity.template_id || '',
    });
    setSubtasks(activity.subtasks?.map(st => ({
      title: st.title,
      description: st.description,
      is_completed: st.is_completed,
      order_index: st.order_index,
    })) || []);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setActivityForm({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      due_date: '',
      activity_type: 'standard',
      is_recurring: false,
      recurrence_type: '',
      recurrence_time: '',
      template_id: '',
    });
    setSubtasks([]);
    setEditingActivity(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'in_progress': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'on_hold': return <Pause className="h-4 w-4 text-yellow-500" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendente',
      in_progress: 'Em Progresso',
      completed: 'Concluída',
      on_hold: 'Em Espera',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando atividades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Atividades</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Gerencie suas atividades, templates e acompanhe o progresso.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 dark:bg-slate-800">
            <TabsTrigger value="list" className="dark:data-[state=active]:bg-slate-700">
              Lista de Atividades
            </TabsTrigger>
            <TabsTrigger value="templates" className="dark:data-[state=active]:bg-slate-700">
              <FileTemplate className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Minhas Atividades ({activities.length})
                </h2>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Atividade
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">
                      {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-300">
                      {editingActivity ? 'Edite os detalhes da atividade.' : 'Crie uma nova atividade ou use um template.'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                    <div>
                      <Label htmlFor="title" className="text-gray-700 dark:text-gray-200">Título</Label>
                      <Input
                        id="title"
                        value={activityForm.title}
                        onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                        placeholder="Ex: Lançamento do produto"
                        className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-gray-700 dark:text-gray-200">Descrição</Label>
                      <Textarea
                        id="description"
                        value={activityForm.description}
                        onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                        placeholder="Descreva a atividade..."
                        className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status" className="text-gray-700 dark:text-gray-200">Status</Label>
                        <Select value={activityForm.status} onValueChange={(value) => setActivityForm({ ...activityForm, status: value as any })}>
                          <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="in_progress">Em Progresso</SelectItem>
                            <SelectItem value="completed">Concluída</SelectItem>
                            <SelectItem value="on_hold">Em Espera</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="priority" className="text-gray-700 dark:text-gray-200">Prioridade</Label>
                        <Select value={activityForm.priority} onValueChange={(value) => setActivityForm({ ...activityForm, priority: value as any })}>
                          <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="due_date" className="text-gray-700 dark:text-gray-200">Data de Vencimento</Label>
                      <Input
                        type="date"
                        id="due_date"
                        value={activityForm.due_date}
                        onChange={(e) => setActivityForm({ ...activityForm, due_date: e.target.value })}
                        className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="activity_type" className="text-gray-700 dark:text-gray-200">Tipo de Atividade</Label>
                      <Select value={activityForm.activity_type} onValueChange={(value) => {
                        setActivityForm({ ...activityForm, activity_type: value as any });
                        if (value === 'template_based') {
                          setSubtasks([]);
                        }
                      }}>
                        <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                          <SelectItem value="standard">Padrão</SelectItem>
                          <SelectItem value="template_based">Baseada em Template</SelectItem>
                          <SelectItem value="recurring">Repetitiva</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {activityForm.activity_type === 'template_based' && (
                      <div>
                        <Label htmlFor="template_id" className="text-gray-700 dark:text-gray-200">Template</Label>
                        <Select value={activityForm.template_id} onValueChange={handleTemplateSelect}>
                          <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                            <SelectValue placeholder="Selecione um template" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                            {userTemplates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {activityForm.activity_type === 'recurring' && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_recurring"
                            checked={activityForm.is_recurring}
                            onCheckedChange={(checked) => setActivityForm({ ...activityForm, is_recurring: checked || false })}
                          />
                          <Label htmlFor="is_recurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-200">
                            Atividade Repetitiva
                          </Label>
                        </div>

                        {activityForm.is_recurring && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="recurrence_type" className="text-gray-700 dark:text-gray-200">Tipo de Recorrência</Label>
                              <Select value={activityForm.recurrence_type} onValueChange={(value) => setActivityForm({ ...activityForm, recurrence_type: value as any })}>
                                <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                  <SelectItem value="daily">Diária</SelectItem>
                                  <SelectItem value="weekly">Semanal</SelectItem>
                                  <SelectItem value="monthly">Mensal</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="recurrence_time" className="text-gray-700 dark:text-gray-200">Frequência</Label>
                              <Input
                                type="number"
                                id="recurrence_time"
                                value={activityForm.recurrence_time}
                                onChange={(e) => setActivityForm({ ...activityForm, recurrence_time: e.target.value })}
                                placeholder="Ex: 1 (a cada dia/semana/mês)"
                                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <Label className="text-gray-700 dark:text-gray-200">Subtarefas</Label>
                      {subtasks.map((subtask, index) => (
                        <div key={index} className="flex items-center space-x-2 py-2 border-b border-gray-200 dark:border-slate-700">
                          <Input
                            type="text"
                            value={subtask.title}
                            onChange={(e) => {
                              const newSubtasks = [...subtasks];
                              newSubtasks[index].title = e.target.value;
                              setSubtasks(newSubtasks);
                            }}
                            placeholder={`Subtarefa ${index + 1}`}
                            className="flex-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                          />
                        </div>
                      ))}
                    </div>

                    <Button type="button" variant="outline" onClick={() => setSubtasks([...subtasks, { title: '', description: '', is_completed: false, order_index: subtasks.length }])} className="w-full dark:border-slate-600 dark:text-slate-200">
                      Adicionar Subtarefa
                    </Button>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveActivity}>
                        {editingActivity ? 'Atualizar Atividade' : 'Criar Atividade'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Lista de atividades com tema escuro corrigido */}
            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Nenhuma atividade encontrada.
                  </p>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetForm}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeira Atividade
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              ) : (
                activities.map((activity) => (
                  <Card key={activity.id} className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(activity.status)}
                            <CardTitle className="text-gray-900 dark:text-white">{activity.title}</CardTitle>
                            <Badge className={getPriorityColor(activity.priority)}>
                              {activity.priority}
                            </Badge>
                          </div>
                          {activity.description && (
                            <CardDescription className="text-gray-600 dark:text-gray-300">
                              {activity.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditActivity(activity)}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Status: {getStatusLabel(activity.status)}
                          </span>
                          {activity.due_date && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Vence em: {new Date(activity.due_date).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>

                        {activity.subtasks && activity.subtasks.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Subtarefas ({activity.subtasks.filter(st => st.is_completed).length}/{activity.subtasks.length})
                            </p>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {activity.subtasks.map((subtask) => (
                                <div key={subtask.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={subtask.is_completed}
                                    onCheckedChange={() => toggleSubtask(activity.id, subtask.id, subtask.is_completed)}
                                  />
                                  <span className={`text-sm ${subtask.is_completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {subtask.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Progresso</span>
                            <span className="text-gray-900 dark:text-white font-medium">{activity.progress}%</span>
                          </div>
                          <Progress value={activity.progress} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <ActivityTemplateManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Activities;
