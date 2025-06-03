
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Heart, Share2, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useMural } from '@/hooks/useMural';
import CreatePostForm from '@/components/mural/CreatePostForm';
import CommentSection from '@/components/mural/CommentSection';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const Mural = () => {
  const navigate = useNavigate();
  const {
    posts,
    comments,
    userActivities,
    loading,
    createPost,
    createComment,
    toggleLike,
    fetchComments
  } = useMural();

  const handleShare = () => {
    toast.info('Funcionalidade de compartilhamento em desenvolvimento');
  };

  const handleActivityClick = (activityId: string) => {
    navigate(`/activities?highlight=${activityId}`);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Carregando posts...</p>
          </div>
        </div>
      </div>
    );
  }

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
            <CreatePostForm onSubmit={createPost} userActivities={userActivities} />

            {posts.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhum post encontrado. Seja o primeiro a publicar!
                  </p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                  <CardHeader>
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold">
                        {post.author_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {post.author_name || 'Usuário'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(post.created_at), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </p>
                          </div>
                        </div>
                        <CardTitle className="mt-2 text-gray-900 dark:text-white">
                          {post.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>
                    
                    {post.activities && post.activities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.activities.map((activity) => (
                          <Badge 
                            key={activity.id} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 dark:bg-slate-700 dark:text-slate-200"
                            onClick={() => handleActivityClick(activity.id)}
                          >
                            📋 {activity.title}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                      <div className="flex items-center space-x-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`flex items-center gap-2 ${
                            post.is_liked 
                              ? 'text-red-500 dark:text-red-400' 
                              : 'text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400'
                          }`}
                          onClick={() => toggleLike(post.id)}
                        >
                          <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
                          {post.likes_count}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
                          onClick={() => fetchComments(post.id)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          {post.comments_count}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-green-500 dark:hover:text-green-400"
                          onClick={handleShare}
                        >
                          <Share2 className="h-4 w-4" />
                          Compartilhar
                        </Button>
                      </div>
                    </div>

                    <CommentSection
                      postId={post.id}
                      comments={comments[post.id] || []}
                      onAddComment={createComment}
                      onLoadComments={fetchComments}
                    />
                  </CardContent>
                </Card>
              ))
            )}
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
