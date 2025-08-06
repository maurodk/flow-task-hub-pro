
import React from 'react';
import { MoreHorizontal, Edit, Trash2, Shield } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';

interface PostActionsProps {
  onEdit?: () => void;
  onDelete: () => void;
  onAdminDelete?: () => void;
  isOwner: boolean;
  isAdmin: boolean;
}

const PostActions: React.FC<PostActionsProps> = ({ 
  onEdit, 
  onDelete, 
  onAdminDelete, 
  isOwner, 
  isAdmin 
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {isOwner && onEdit && (
          <ContextMenuItem onClick={onEdit} className="flex items-center gap-2 cursor-pointer">
            <Edit className="h-4 w-4" />
            Editar post
          </ContextMenuItem>
        )}
        
        {isOwner && (
          <ContextMenuItem onClick={onDelete} className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400">
            <Trash2 className="h-4 w-4" />
            Excluir post
          </ContextMenuItem>
        )}
        
        {isAdmin && !isOwner && onAdminDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onAdminDelete} className="flex items-center gap-2 cursor-pointer text-orange-600 dark:text-orange-400">
              <Shield className="h-4 w-4" />
              Excluir como Admin
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default PostActions;
