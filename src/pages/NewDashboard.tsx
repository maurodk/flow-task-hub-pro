
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Clock, CheckCircle, Pause, TrendingUp, Calendar, Users } from 'lucide-react';

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
}

interface DashboardStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  on_hold: number;
}

const NewDashboard = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    on_hold: 0,
  });

  useEffect(() => {
    fetchActivities();
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
      }));
      
      setActivities(typedActivities);
      
      // Calcular estatísticas
      const newStats = {
        total: typedActivities.length,
        pending: typedActivities.filter(a => a.status === 'pending').length,
        in_progress: typedActivities.filter(a => a.status === 'in_progress').length,
        completed: typedActivities.filter(a => a.status === 'completed').length,
        on_hold: typedActivities.filter(a => a.status === 'on_hold').length,
      };
      
      setStats(newStats);
    } catch (error: any) {
      console.error('Erro ao buscar atividades:', error);
    }
  };

  const chartData = [
    {
      name: 'Pendentes',
      value: stats.pending,
      color: '#f59e0b',
    },
    {
      name: 'Em Progresso',
      value: stats.in_progress,
      color: '#3b82f6',
    },
    {
      name: 'Concluídas',
      value: stats.completed,
      color: '#10b981',
    },
    {
      name: 'Em Espera',
      value: stats.on_hold,
      color: '#6b7280',
    },
  ];

  const barChartData = [
    { month: 'Jan', atividades: 12 },
    { month: 'Fev', atividades: 19 },
    { month: 'Mar', atividades: 15 },
    { month: 'Abr', atividades: 25 },
    { month: 'Mai', atividades: 22 },
    { month: 'Jun', atividades: 30 },
  ];

  const recentActivities = activities.slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'in_progress': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'on_hold': return <Pause className="h-4 w-4 text-gray-500" />;
      default: return <Activity className="h-4 w-4" />;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Visão geral das suas atividades e progresso
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Atividades</CardTitle>
              <Activity className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-blue-100">
                Total de atividades criadas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-amber-100">
                Aguardando início
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-green-100">
                Finalizadas com sucesso
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Espera</CardTitle>
              <Pause className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.on_hold}</div>
              <p className="text-xs text-gray-100">
                Pausadas temporariamente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Distribuição por Status
              </CardTitle>
              <CardDescription>
                Visão geral do status das atividades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  pending: { label: 'Pendentes', color: '#f59e0b' },
                  in_progress: { label: 'Em Progresso', color: '#3b82f6' },
                  completed: { label: 'Concluídas', color: '#10b981' },
                  on_hold: { label: 'Em Espera', color: '#6b7280' },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Atividades por Mês
              </CardTitle>
              <CardDescription>
                Progresso mensal de atividades criadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  atividades: { label: 'Atividades', color: '#3b82f6' },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="atividades" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Atividades Recentes */}
        <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>
              Últimas 5 atividades criadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Nenhuma atividade encontrada
                </p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(activity.status)}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {getStatusLabel(activity.status)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.progress}%
                        </div>
                        <Progress value={activity.progress} className="w-20" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NewDashboard;
