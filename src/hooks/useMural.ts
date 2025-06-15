import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MuralPost {
  id: string;
  title: string;
  content: string;
  activity_ids: string[];
  sector_id?: string;
  created_at: string;
  user_id: string;
  author_name?: string;
  author_avatar_url?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  attachments?: any[];
  activities?: {
    id: string;
    title: string;
  }[];
  sector_name?: string;
}

export interface MuralComment {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name?: string;
  author_avatar_url?: string;
  attachments?: any[];
}

export const useMural = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<MuralPost[]>([]);
  const [comments, setComments] = useState<{[postId: string]: MuralComment[]}>({});
  const [userActivities, setUserActivities] = useState<{id: string; title: string}[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('geral');
  const [loading, setLoading] = useState(true);

  const uploadFile = async (file: File, folder: string = 'general'): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('mural-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('mural-media')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload do arquivo');
      return null;
    }
  };

  const fetchUserActivities = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('id, title')
        .eq('user_id', user.id)
        .order('title');

      if (error) throw error;
      setUserActivities(data || []);
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
    }
  };

  const fetchPosts = async (filter?: { sectorId?: string; chatRoomId?: string; isGeneral?: boolean }) => {
    try {
      let query = supabase
        .from('mural_posts')
        .select(`
          *,
          sector:sectors(name)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros baseado na aba ativa
      if (filter?.isGeneral) {
        // Aba Geral: posts sem setor e sem chat room específico
        query = query.is('sector_id', null).is('chat_room_id', null);
      } else if (filter?.sectorId) {
        // Aba de Setor: posts do setor específico (sem chat room)
        query = query.eq('sector_id', filter.sectorId).is('chat_room_id', null);
      } else if (filter?.chatRoomId) {
        // Aba de Chat Room: posts do chat room específico
        query = query.eq('chat_room_id', filter.chatRoomId);
      }

      const { data: postsData, error: postsError } = await query;

      if (postsError) throw postsError;

      if (postsData) {
        const postsWithMetadata = await Promise.all(
          postsData.map(async (post) => {
            const [likesResult, commentsResult, userLikeResult, profileResult] = await Promise.all([
              supabase
                .from('mural_likes')
                .select('id', { count: 'exact' })
                .eq('post_id', post.id),
              supabase
                .from('mural_comments')
                .select('id', { count: 'exact' })
                .eq('post_id', post.id),
              user ? supabase
                .from('mural_likes')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .single() : { data: null },
              supabase
                .from('profiles')
                .select('name, avatar_url')
                .eq('id', post.user_id)
                .single()
            ]);

            // Buscar atividades relacionadas se houver activity_ids
            let activities = [];
            if (post.activity_ids && post.activity_ids.length > 0) {
              const { data: activitiesData } = await supabase
                .from('activities')
                .select('id, title')
                .in('id', post.activity_ids);
              activities = activitiesData || [];
            }

            return {
              ...post,
              activity_ids: post.activity_ids || [],
              author_name: profileResult.data?.name || 'Usuário',
              author_avatar_url: profileResult.data?.avatar_url || null,
              likes_count: likesResult.count || 0,
              comments_count: commentsResult.count || 0,
              is_liked: !!userLikeResult.data,
              attachments: Array.isArray(post.attachments) ? post.attachments : [],
              activities,
              sector_name: post.sector?.name || null
            } as MuralPost;
          })
        );

        setPosts(postsWithMetadata);
      }
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      toast.error('Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data: commentsData, error } = await supabase
        .from('mural_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (commentsData) {
        const commentsWithAuthor = await Promise.all(
          commentsData.map(async (comment) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', comment.user_id)
              .single();

            return {
              ...comment,
              author_name: profileData?.name || 'Usuário',
              author_avatar_url: profileData?.avatar_url || null,
              attachments: Array.isArray(comment.attachments) ? comment.attachments : []
            } as MuralComment;
          })
        );

        setComments(prev => ({
          ...prev,
          [postId]: commentsWithAuthor
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      toast.error('Erro ao carregar comentários');
    }
  };

  const createPost = async (title: string, content: string, activityIds: string[], sectorId?: string, files?: File[]) => {
    if (!user) {
      toast.error('Você precisa estar logado para criar um post');
      return;
    }

    try {
      let attachments = [];
      
      if (files && files.length > 0) {
        const uploadPromises = files.map(file => uploadFile(file, 'posts'));
        const urls = await Promise.all(uploadPromises);
        attachments = urls.filter(url => url !== null).map((url, index) => ({
          url,
          name: files[index].name,
          type: files[index].type,
          size: files[index].size
        }));
      }

      // Determinar setor e chat room baseado na aba ativa
      let postSectorId = null;
      let postChatRoomId = null;

      if (activeTab.startsWith('sector-')) {
        postSectorId = activeTab.replace('sector-', '');
      } else if (activeTab.startsWith('room-')) {
        postChatRoomId = activeTab.replace('room-', '');
      } else if (sectorId) {
        postSectorId = sectorId;
      }

      const { error } = await supabase
        .from('mural_posts')
        .insert({
          title,
          content,
          activity_ids: activityIds,
          sector_id: postSectorId,
          chat_room_id: postChatRoomId,
          user_id: user.id,
          attachments
        });

      if (error) throw error;

      toast.success('Post criado com sucesso!');
      refreshCurrentTab();
    } catch (error) {
      console.error('Erro ao criar post:', error);
      toast.error('Erro ao criar post');
    }
  };

  const createComment = async (postId: string, content: string, files?: File[]) => {
    if (!user) {
      toast.error('Você precisa estar logado para comentar');
      return;
    }

    try {
      let attachments = [];
      
      if (files && files.length > 0) {
        const uploadPromises = files.map(file => uploadFile(file, 'comments'));
        const urls = await Promise.all(uploadPromises);
        attachments = urls.filter(url => url !== null).map((url, index) => ({
          url,
          name: files[index].name,
          type: files[index].type,
          size: files[index].size
        }));
      }

      const { error } = await supabase
        .from('mural_comments')
        .insert({
          post_id: postId,
          content,
          user_id: user.id,
          attachments
        });

      if (error) throw error;

      toast.success('Comentário adicionado!');
      fetchComments(postId);
      fetchPosts(selectedSector); // Atualizar contagem de comentários
    } catch (error) {
      console.error('Erro ao criar comentário:', error);
      toast.error('Erro ao comentar');
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para curtir');
      return;
    }

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.is_liked) {
        const { error } = await supabase
          .from('mural_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('mural_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
      }

      fetchPosts();
    } catch (error) {
      console.error('Erro ao curtir post:', error);
      toast.error('Erro ao curtir post');
    }
  };

  const editPost = async (postId: string, title: string, content: string, activityIds: string[], sectorId?: string, files?: File[]) => {
    if (!user) {
      toast.error('Você precisa estar logado para editar um post');
      return;
    }

    try {
      let attachments = [];
      
      if (files && files.length > 0) {
        const uploadPromises = files.map(file => uploadFile(file, 'posts'));
        const urls = await Promise.all(uploadPromises);
        attachments = urls.filter(url => url !== null).map((url, index) => ({
          url,
          name: files[index].name,
          type: files[index].type,
          size: files[index].size
        }));
      }

      const updateData: any = {
        title,
        content,
        activity_ids: activityIds,
        updated_at: new Date().toISOString()
      };

      // Não alterar setor/chat room ao editar - manter na aba atual
      if (files && files.length > 0) {
        updateData.attachments = attachments;
      }

      const { error } = await supabase
        .from('mural_posts')
        .update(updateData)
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Post editado com sucesso!');
      refreshCurrentTab();
    } catch (error) {
      console.error('Erro ao editar post:', error);
      toast.error('Erro ao editar post');
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para excluir um post');
      return;
    }

    try {
      // Primeiro, excluir comentários relacionados
      const { error: commentsError } = await supabase
        .from('mural_comments')
        .delete()
        .eq('post_id', postId);

      if (commentsError) throw commentsError;

      // Depois, excluir curtidas relacionadas
      const { error: likesError } = await supabase
        .from('mural_likes')
        .delete()
        .eq('post_id', postId);

      if (likesError) throw likesError;

      // Por fim, excluir o post
      const { error } = await supabase
        .from('mural_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Post excluído com sucesso!');
      refreshCurrentTab();
    } catch (error) {
      console.error('Erro ao excluir post:', error);
      toast.error('Erro ao excluir post');
    }
  };

  const refreshCurrentTab = () => {
    if (activeTab === 'geral') {
      fetchPosts({ isGeneral: true });
    } else if (activeTab.startsWith('sector-')) {
      const sectorId = activeTab.replace('sector-', '');
      fetchPosts({ sectorId });
    } else if (activeTab.startsWith('room-')) {
      const chatRoomId = activeTab.replace('room-', '');
      fetchPosts({ chatRoomId });
    }
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (newTab === 'geral') {
      fetchPosts({ isGeneral: true });
    } else if (newTab.startsWith('sector-')) {
      const sectorId = newTab.replace('sector-', '');
      fetchPosts({ sectorId });
    } else if (newTab.startsWith('room-')) {
      const chatRoomId = newTab.replace('room-', '');
      fetchPosts({ chatRoomId });
    }
  };

  useEffect(() => {
    fetchUserActivities();
    refreshCurrentTab();
  }, [user, activeTab]);

  return {
    posts,
    comments,
    userActivities,
    selectedSector,
    activeTab,
    loading,
    setSelectedSector,
    handleTabChange,
    createPost,
    createComment,
    toggleLike,
    fetchComments,
    uploadFile,
    editPost,
    deletePost,
    refreshCurrentTab
  };
};
