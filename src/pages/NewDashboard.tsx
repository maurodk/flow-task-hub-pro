import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useAuth';
import { useSectors } from '@/hooks/useSectors';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import { Calendar, CheckCircle, Clock, Pause, TrendingUp, Activity, Target } from 'lucide-react';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import DonutActivityTypeChart from "@/components/charts/DonutActivityTypeChart";
import ActivityTypeCardGrid from "@/components/charts/ActivityTypeCardGrid";

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
        status: (activity.status === 'on_hold' ? 'pending' : activity.status) as 'pending' | 'in_progress' | 'completed',
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

  const priorityChartConfig = {
    alta: { label: "Alta", color: "hsl(0 84.2% 60.2%)" },
    media: { label: "Média", color: "hsl(47.9 95.8% 53.1%)" },
    baixa: { label: "Baixa", color: "hsl(142.1 76.2% 36.3%)" },
    value: { label: "Quantidade" }
  } satisfies ChartConfig;
  
  const priorityData = [
    { name: 'Alta', value: activities.filter(a => a.priority === 'high').length, fill: "var(--color-alta)" },
    { name: 'Média', value: activities.filter(a => a.priority === 'medium').length, fill: "var(--color-media)" },
    { name: 'Baixa', value: activities.filter(a => a.priority === 'low').length, fill: "var(--color-baixa)" },
  ];

  // Prepare os dados para o novo donut chart
  // Garante que os types sejam sempre do tipo correto
  const donutTypeData = [
    { type: "standard" as const, value: activities.filter(a => a.activity_type === "standard").length },
    { type: "template_based" as const, value: activities.filter(a => a.activity_type === "template_based").length },
    { type: "recurring" as const, value: activities.filter(a => a.activity_type === "recurring").length }
  ];

  const typeChartConfig = {
    value: { label: "Atividades" },
    standard: { label: "Padrão", color: "hsl(var(--chart-1))" },
    template_based: { label: "Predefinida", color: "hsl(var(--chart-2))" },
    recurring: { label: "Repetitiva", color: "hsl(var(--chart-3))" },
  } satisfies ChartConfig;

  const typeData = [
    { name: 'Padrão', value: activities.filter(a => a.activity_type === 'standard').length, fill: 'var(--color-standard)' },
    { name: 'Predefinida', value: activities.filter(a => a.activity_type === 'template_based').length, fill: 'var(--color-template_based)' },
    { name: 'Repetitiva', value: activities.filter(a => a.activity_type === 'recurring').length, fill: 'var(--color-recurring)' },
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

  // --- Novo trecho: preparar dados do gráfico de escada (cumulative area chart) ---
  // Função para agrupar por dia, considerando created_at (adicionados) e completed (concluídos)
  function buildStairChartData(activities: Activity[]) {
    type DateMap = { [date: string]: { added: number; completed: number } };
    const dateMap: DateMap = {};

    // Quantos foram adicionados por dia
    for (const a of activities) {
      const created = a.created_at ? new Date(a.created_at).toISOString().slice(0, 10) : null;
      if (created) {
        if (!dateMap[created]) dateMap[created] = { added: 0, completed: 0 };
        dateMap[created].added++;
      }
      // Conta concluídas usando due_date somente se completed
      if (a.status === 'completed') {
        // Tenta usar due_date como data de conclusão (caso queira ajustar para completed_at no futuro)
        const completedDay = a.due_date
          ? new Date(a.due_date).toISOString().slice(0, 10)
          : (a.created_at ? new Date(a.created_at).toISOString().slice(0, 10) : null);
        if (completedDay) {
          if (!dateMap[completedDay]) dateMap[completedDay] = { added: 0, completed: 0 };
          dateMap[completedDay].completed++;
        }
      }
    }

    // Ordena as datas para montar a série acumulada
    const allDates = Object.keys(dateMap).sort();
    let cumulativeAdded = 0;
    let cumulativeCompleted = 0;
    const data = allDates.map(date => {
      cumulativeAdded += dateMap[date].added;
      cumulativeCompleted += dateMap[date].completed;
      return {
        date,
        Adicionadas: cumulativeAdded,
        Concluídas: cumulativeCompleted,
      };
    });
    return data;
  }

  const stairChartData = buildStairChartData(activities);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <CardDescription>Quantidade de atividades por nível de prioridade.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={priorityChartConfig} className="min-h-[200px] w-full">
                <BarChart accessibilityLayer data={priorityData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid horizontal={false} />
                    <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                    />
                    <XAxis dataKey="value" type="number" hide />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" hideLabel />}
                    />
                    <Bar dataKey="value" layout="vertical" radius={5}>
                        <LabelList
                            dataKey="value"
                            position="right"
                            offset={8}
                            className="fill-foreground"
                            fontSize={12}
                        />
                    </Bar>
                </BarChart>
              </ChartContainer>
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
              <CardTitle>
                Evolução de Atividades
              </CardTitle>
              <CardDescription>
                Visualize como as atividades estão sendo adicionadas e concluídas ao longo do tempo.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              {stairChartData.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Não há dados suficientes para exibir o gráfico.
                </p>
              ) : (
                <div className="w-full h-[340px] flex items-center">
                  <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={stairChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 13 }} />
                      <YAxis tick={{ fontSize: 13 }} allowDecimals={false} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="Adicionadas"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="rgba(59,130,246,0.25)"
                      />
                      <Area
                        type="monotone"
                        dataKey="Concluídas"
                        stackId="1"
                        stroke="#10b981"
                        fill="rgba(16,185,129,0.25)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewDashboard;
