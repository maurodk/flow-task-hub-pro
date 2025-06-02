
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MuralPost {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  user_id: string;
  author_name?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export interface MuralComment {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name?: string;
}

export const useMural = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<MuralPost[]>([]);
  const [comments, setComments] = useState<{[postId: string]: MuralComment[]}>({});
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('mural_posts')
        .select(`
          *,
          profiles!mural_posts_user_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (postsData) {
        const postsWithMetadata = await Promise.all(
          postsData.map(async (post) => {
            const [likesResult, commentsResult, userLikeResult] = await Promise.all([
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
                .single() : { data: null }
            ]);

            return {
              ...post,
              author_name: post.profiles?.name || 'Usuário',
              likes_count: likesResult.count || 0,
              comments_count: commentsResult.count || 0,
              is_liked: !!userLikeResult.data
            };
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
      const { data, error } = await supabase
        .from('mural_comments')
        .select(`
          *,
          profiles!mural_comments_user_id_fkey(name)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const commentsWithAuthor = data.map(comment => ({
          ...comment,
          author_name: comment.profiles?.name || 'Usuário'
        }));

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

  const createPost = async (title: string, content: string, tags: string[]) => {
    if (!user) {
      toast.error('Você precisa estar logado para criar um post');
      return;
    }

    try {
      const { error } = await supabase
        .from('mural_posts')
        .insert({
          title,
          content,
          tags,
          user_id: user.id
        });

      if (error) throw error;

      toast.success('Post criado com sucesso!');
      fetchPosts();
    } catch (error) {
      console.error('Erro ao criar post:', error);
      toast.error('Erro ao criar post');
    }
  };

  const createComment = async (postId: string, content: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para comentar');
      return;
    }

    try {
      const { error } = await supabase
        .from('mural_comments')
        .insert({
          post_id: postId,
          content,
          user_id: user.id
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
  }, [user]);

  return {
    posts,
    comments,
    loading,
    createPost,
    createComment,
    toggleLike,
    fetchComments
  };
};
