
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MuralPost {
  id: string;
  title: string;
  content: string;
  activity_ids: string[];
  created_at: string;
  user_id: string;
  author_name?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  attachments?: any[];
  activities?: {
    id: string;
    title: string;
  }[];
}

export interface MuralComment {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name?: string;
  attachments?: any[];
}

export const useMural = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<MuralPost[]>([]);
  const [comments, setComments] = useState<{[postId: string]: MuralComment[]}>({});
  const [userActivities, setUserActivities] = useState<{id: string; title: string}[]>([]);
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

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('mural_posts')
        .select('*')
        .order('created_at', { ascending: false });

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
                .select('name')
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
              likes_count: likesResult.count || 0,
              comments_count: commentsResult.count || 0,
              is_liked: !!userLikeResult.data,
              attachments: Array.isArray(post.attachments) ? post.attachments : [],
              activities
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
              .select('name')
              .eq('id', comment.user_id)
              .single();

            return {
              ...comment,
              author_name: profileData?.name || 'Usuário',
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

  const createPost = async (title: string, content: string, activityIds: string[], files?: File[]) => {
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

      const { error } = await supabase
        .from('mural_posts')
        .insert({
          title,
          content,
          activity_ids: activityIds,
          user_id: user.id,
          attachments
        });

      if (error) throw error;

      toast.success('Post criado com sucesso!');
      fetchPosts();
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
      fetchPosts(); // Atualizar contagem de comentários
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

  useEffect(() => {
    fetchPosts();
    fetchUserActivities();
  }, [user]);

  return {
    posts,
    comments,
    userActivities,
    loading,
    createPost,
    createComment,
    toggleLike,
    fetchComments,
    uploadFile
  };
};
