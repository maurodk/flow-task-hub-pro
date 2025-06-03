
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { MuralComment } from '@/hooks/useMural';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FileUpload from './FileUpload';
import AttachmentViewer from './AttachmentViewer';

interface CommentSectionProps {
  postId: string;
  comments: MuralComment[];
  onAddComment: (postId: string, content: string, files?: File[]) => void;
  onLoadComments: (postId: string) => void;
  loading?: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments,
  onAddComment,
  onLoadComments,
  loading = false
}) => {
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    onAddComment(postId, newComment.trim(), files);
    setNewComment('');
    setFiles([]);
  };

  const toggleComments = () => {
    if (!showComments && comments.length === 0) {
      onLoadComments(postId);
    }
    setShowComments(!showComments);
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleComments}
        className="mb-3"
      >
        {showComments ? 'Ocultar comentários' : 'Ver comentários'}
      </Button>

      {showComments && (
        <div className="space-y-3">
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              placeholder="Escreva um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
            />
            <FileUpload files={files} onFilesChange={setFiles} maxFiles={3} />
            <Button 
              type="submit" 
              size="sm" 
              disabled={loading || !newComment.trim()}
            >
              {loading ? 'Comentando...' : 'Comentar'}
            </Button>
          </form>

          <div className="space-y-2">
            {comments.map((comment) => (
              <Card key={comment.id} className="p-3">
                <CardContent className="p-0">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-sm">
                      {comment.author_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                          {comment.author_name || 'Usuário'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {comment.content}
                      </p>
                      <AttachmentViewer attachments={comment.attachments || []} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
