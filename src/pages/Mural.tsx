import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Heart, Share2, Plus, PenTool, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { useMural } from '@/hooks/useMural';
import { useChatRooms } from '@/hooks/useChatRooms';
import CreatePostModal from '@/components/mural/CreatePostModal';
import CreateChatRoomModal from '@/components/mural/CreateChatRoomModal';
import CommentSection from '@/components/mural/CommentSection';
import AttachmentViewer from '@/components/mural/AttachmentViewer';
import PostActions from '@/components/mural/PostActions';
import EditPostModal from '@/components/mural/EditPostModal';
import DeletePostModal from '@/components/mural/DeletePostModal';
import EventsSection from '@/components/mural/EventsSection';
import ChatTabs from '@/components/mural/ChatTabs';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Mural = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    posts,
    comments,
    userActivities,
    loading,
    activeTab,
    handleTabChange,
    createPost,
    createComment,
    toggleLike,
    fetchComments,
    editPost,
    deletePost
  } = useMural();

  const { createChatRoom } = useChatRooms();

  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createChatRoomOpen, setCreateChatRoomOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [deletingPost, setDeletingPost] = useState<any>(null);

  const handleShare = () => {
    toast.info('Funcionalidade de compartilhamento em desenvolvimento');
  };

  const handleActivityClick = (activityId: string) => {
    navigate(`/activities?highlight=${activityId}`);
  };

  const handleEditPost = (post: any) => {
    setEditingPost(post);
  };

  const handleDeletePost = (post: any) => {
    setDeletingPost(post);
  };

  const handleSaveEdit = (title: string, content: string, activityIds: string[], sectorId?: string, files?: File[]) => {
    if (editingPost) {
      editPost(editingPost.id, title, content, activityIds, sectorId, files);
      setEditingPost(null);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingPost) {
      deletePost(deletingPost.id);
      setDeletingPost(null);
    }
  };

  const handleCreateChatRoom = async (name: string, description: string, sectorIds: string[]) => {
    await createChatRoom(name, description, sectorIds);
  };

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

  // Função para obter o nome do usuário de forma segura
  const getUserDisplayName = () => {
    if (!user) return 'U';
    return user.user_metadata?.name || user.email?.charAt(0).toUpperCase() || 'U';
  };

  // Função para obter o avatar do usuário de forma segura
  const getUserAvatarUrl = () => {
    if (!user) return null;
    return user.user_metadata?.avatar_url || null;
  };

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
          {/* Posts principais com sistema de abas */}
          <div className="lg:col-span-3">
            <ChatTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onCreateChatRoom={() => setCreateChatRoomOpen(true)}
            >
              <div className="space-y-6">
                {/* Botão minimalista para criar post */}
                <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getUserAvatarUrl() || undefined} />
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold">
                          {getUserDisplayName().charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        variant="outline"
                        className="flex-1 justify-start text-gray-500 dark:text-gray-400 h-12"
                        onClick={() => setCreatePostOpen(true)}
                      >
                        <PenTool className="h-4 w-4 mr-2" />
                        O que você gostaria de compartilhar?
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCreatePostOpen(true)}
                          className="text-gray-500 dark:text-gray-400"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCreatePostOpen(true)}
                          className="text-gray-500 dark:text-gray-400"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {posts.length === 0 ? (
                  <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Nenhum post encontrado nesta área. Seja o primeiro a publicar!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  posts.map((post) => (
                    <Card key={post.id} className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                      <CardHeader>
                        <div className="flex items-start space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={post.author_avatar_url || undefined} />
                            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold">
                              {post.author_name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {post.author_name || 'Usuário'}
                                  </h3>
                                  {post.activities && post.activities.length > 0 && (
                                    <>
                                      <span className="text-gray-500 dark:text-gray-400">sobre</span>
                                      <button
                                        onClick={() => handleActivityClick(post.activities[0].id)}
                                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                      >
                                        {post.activities[0].title}
                                      </button>
                                    </>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatDistanceToNow(new Date(post.created_at), {
                                    addSuffix: true,
                                    locale: ptBR
                                  })}
                                </p>
                              </div>
                              {user && user.id === post.user_id && (
                                <PostActions 
                                  onEdit={() => handleEditPost(post)}
                                  onDelete={() => handleDeletePost(post)}
                                />
                              )}
                            </div>
                            <CardTitle className="mt-2 text-gray-900 dark:text-white">
                              {post.title}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>
                        
                        <AttachmentViewer attachments={post.attachments || []} />
                        
                        {post.activities && post.activities.length > 1 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.activities.slice(1).map((activity) => (
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
            </ChatTabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Próximos eventos interativos */}
            <EventsSection />

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

      {/* Modais */}
      <CreatePostModal
        isOpen={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onSubmit={createPost}
        userActivities={userActivities}
      />

      <CreateChatRoomModal
        isOpen={createChatRoomOpen}
        onClose={() => setCreateChatRoomOpen(false)}
        onSubmit={handleCreateChatRoom}
      />

      <EditPostModal
        post={editingPost}
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        onSave={handleSaveEdit}
        userActivities={userActivities}
      />

      <DeletePostModal
        isOpen={!!deletingPost}
        onClose={() => setDeletingPost(null)}
        onConfirm={handleConfirmDelete}
        postTitle={deletingPost?.title || ''}
      />
    </div>
  );
};

export default Mural;
