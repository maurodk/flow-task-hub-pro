
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Heart, Share2, Calendar, Users } from 'lucide-react';

const Mural = () => {
  const posts = [
    {
      id: 1,
      author: 'João Silva',
      avatar: 'JS',
      title: 'Nova versão do sistema lançada!',
      content: 'Estamos felizes em anunciar que a nova versão do nosso sistema de gestão está disponível. Confira as novas funcionalidades.',
      timestamp: '2 horas atrás',
      likes: 12,
      comments: 5,
      tags: ['Atualização', 'Sistema'],
    },
    {
      id: 2,
      author: 'Maria Santos',
      avatar: 'MS',
      title: 'Reunião de equipe agendada',
      content: 'Lembrando a todos sobre a reunião de alinhamento da equipe que acontecerá na próxima quinta-feira às 14h.',
      timestamp: '5 horas atrás',
      likes: 8,
      comments: 3,
      tags: ['Reunião', 'Equipe'],
    },
    {
      id: 3,
      author: 'Carlos Oliveira',
      avatar: 'CO',
      title: 'Dicas de produtividade',
      content: 'Compartilhando algumas técnicas que têm me ajudado a ser mais produtivo no trabalho. Vale a pena conferir!',
      timestamp: '1 dia atrás',
      likes: 25,
      comments: 12,
      tags: ['Produtividade', 'Dicas'],
    },
  ];

  const events = [
    {
      id: 1,
      title: 'Workshop de React',
      date: '15 de Fevereiro',
      time: '14:00',
      attendees: 23,
    },
    {
      id: 2,
      title: 'Apresentação de Resultados',
      date: '18 de Fevereiro',
      time: '10:00',
      attendees: 45,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mural</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Fique por dentro das novidades e eventos da empresa.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Posts principais */}
          <div className="lg:col-span-3 space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold">
                      {post.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{post.author}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{post.timestamp}</p>
                        </div>
                      </div>
                      <CardTitle className="mt-2 text-gray-900 dark:text-white">{post.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="dark:bg-slate-700 dark:text-slate-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex items-center space-x-4">
                      <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400">
                        <Heart className="h-4 w-4" />
                        {post.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">
                        <MessageSquare className="h-4 w-4" />
                        {post.comments}
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-green-500 dark:hover:text-green-400">
                        <Share2 className="h-4 w-4" />
                        Compartilhar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Próximos eventos */}
            <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Calendar className="h-5 w-5" />
                  Próximos Eventos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{event.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{event.date} às {event.time}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3" />
                      {event.attendees} participantes
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Atividade recente */}
            <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="text-gray-900 dark:text-white font-medium">Ana Costa</p>
                  <p className="text-gray-600 dark:text-gray-300">Completou projeto "Website Redesign"</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">30 min atrás</p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-900 dark:text-white font-medium">Pedro Lima</p>
                  <p className="text-gray-600 dark:text-gray-300">Adicionou nova atividade</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">1h atrás</p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-900 dark:text-white font-medium">Lucia Ferreira</p>
                  <p className="text-gray-600 dark:text-gray-300">Comentou em "Reunião de Planejamento"</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">2h atrás</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mural;
