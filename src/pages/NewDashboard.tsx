
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useAuth';
import { useSectors } from '@/hooks/useSectors';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, CheckCircle, Clock, Pause, TrendingUp, Activity, Target } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  created_at: string;
  due_date: string | null;
  activity_type: 'standard' | 'template_based' | 'recurring';
  user_id: string;
}

const NewDashboard = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { userSectors, loading: sectorsLoading } = useSectors();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Só buscar atividades quando todas as dependências estiverem carregadas
    if (!roleLoading && !sectorsLoading) {
      fetchActivities();
    }
  }, [roleLoading, sectorsLoading, isAdmin, userSectors]);

  const fetchActivities = async () => {
    if (!user || roleLoading || sectorsLoading) return;

    try {
      console.log('🔍 NewDashboard: Buscando atividades para usuário:', user.id);
      console.log('👤 É admin?', isAdmin);
      console.log('🏢 Setores do usuário:', userSectors.map(us => us.sector_id));

      let query = supabase
        .from('activities')
        .select('*');

      // Aplicar lógica de visualização baseada no role
      if (isAdmin) {
        console.log('🔓 Admin: buscando todas as atividades');
        // Admins veem todas as atividades, sem filtro de usuário
      } else {
        console.log('🔒 Usuário comum: aplicando filtros');
        // Usuários comuns veem atividades dos seus setores + atividades que criaram
        const userSectorIds = userSectors.map(us => us.sector_id);
        
        if (userSectorIds.length > 0) {
          // Filtrar por: (atividades dos setores do usuário) OU (atividades criadas pelo usuário)
          query = query.or(`sector_id.in.(${userSectorIds.join(',')}),user_id.eq.${user.id}`);
        } else {
          // Se não tem setores, só vê as próprias atividades
          query = query.eq('user_id', user.id);
        }
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      // Type the data properly to match our Activity interface
      const typedActivities: Activity[] = (data || []).map(activity => ({
        id: activity.id,
        title: activity.title,
        status: activity.status as 'pending' | 'in_progress' | 'completed' | 'on_hold',
        priority: activity.priority as 'low' | 'medium' | 'high',
        progress: activity.progress || 0,
        created_at: activity.created_at,
        due_date: activity.due_date,
        activity_type: activity.activity_type as 'standard' | 'template_based' | 'recurring',
        user_id: activity.user_id,
      }));
      
      console.log('📋 NewDashboard: Atividades encontradas:', typedActivities.length);
      setActivities(typedActivities);
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas das atividades
  const totalActivities = activities.length;
  const pendingActivities = activities.filter(a => a.status === 'pending').length;
  const inProgressActivities = activities.filter(a => a.status === 'in_progress').length;
  const completedActivities = activities.filter(a => a.status === 'completed').length;
  const onHoldActivities = activities.filter(a => a.status === 'on_hold').length;

  const statusData = [
    { name: 'Pendentes', value: pendingActivities, color: '#94a3b8' },
    { name: 'Em Progresso', value: inProgressActivities, color: '#3b82f6' },
    { name: 'Concluídas', value: completedActivities, color: '#10b981' },
    { name: 'Em Espera', value: onHoldActivities, color: '#f59e0b' },
  ];

  const priorityData = [
    { name: 'Alta', value: activities.filter(a => a.priority === 'high').length },
    { name: 'Média', value: activities.filter(a => a.priority === 'medium').length },
    { name: 'Baixa', value: activities.filter(a => a.priority === 'low').length },
  ];

  const typeData = [
    { name: 'Padrão', value: activities.filter(a => a.activity_type === 'standard').length },
    { name: 'Predefinida', value: activities.filter(a => a.activity_type === 'template_based').length },
    { name: 'Repetitiva', value: activities.filter(a => a.activity_type === 'recurring').length },
  ];

  const averageProgress = activities.length > 0 
    ? activities.reduce((sum, activity) => sum + (activity.progress || 0), 0) / activities.length 
    : 0;

  const recentActivities = activities.slice(0, 5);

  const upcomingActivities = activities
    .filter(a => a.due_date && a.status !== 'completed')
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'in_progress':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'on_hold':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Calendar className="h-4 w-4" />;
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
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Visão geral das suas atividades e progresso
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalActivities}</div>
              <p className="text-xs text-muted-foreground">atividades</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingActivities}</div>
              <p className="text-xs text-muted-foreground">aguardando</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressActivities}</div>
              <p className="text-xs text-muted-foreground">em andamento</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedActivities}</div>
              <p className="text-xs text-muted-foreground">finalizadas</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Espera</CardTitle>
              <Pause className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{onHoldActivities}</div>
              <p className="text-xs text-muted-foreground">pausadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Progresso Geral */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progresso Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold">{averageProgress.toFixed(1)}%</div>
                <Progress value={averageProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Progresso médio de todas as atividades
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Status das Atividades</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Distribuição por Prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
              <CardDescription>Últimas atividades criadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma atividade encontrada
                  </p>
                ) : (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(activity.status)}
                        <div>
                          <p className="font-medium truncate max-w-[200px]">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {getStatusLabel(activity.status)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(activity.priority)}>
                          {activity.priority}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm font-medium">{activity.progress}%</p>
                          <Progress value={activity.progress} className="w-16 h-2" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Próximas do Vencimento</CardTitle>
              <CardDescription>Atividades que vencem em breve</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingActivities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma atividade com vencimento próximo
                  </p>
                ) : (
                  upcomingActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="font-medium truncate max-w-[200px]">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Vence em: {new Date(activity.due_date!).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{activity.progress}%</p>
                        <Progress value={activity.progress} className="w-16 h-2" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Tipos de Atividades</CardTitle>
              <CardDescription>Distribuição por tipo de atividade</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewDashboard;
