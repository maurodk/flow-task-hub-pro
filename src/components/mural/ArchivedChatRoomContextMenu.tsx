
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { RotateCcw, Trash2 } from 'lucide-react';
import { ChatRoom } from '@/types/chatRoom';

interface ArchivedChatRoomContextMenuProps {
  chatRoom: ChatRoom;
  onRestore: (chatRoom: ChatRoom) => void;
  onDelete: (chatRoom: ChatRoom) => void;
  children: React.ReactNode;
}

const ArchivedChatRoomContextMenu: React.FC<ArchivedChatRoomContextMenuProps> = ({
  chatRoom,
  onRestore,
  onDelete,
  children
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem
          onClick={() => onRestore(chatRoom)}
          className="flex items-center gap-2 cursor-pointer text-green-600 dark:text-green-400"
        >
          <RotateCcw className="h-4 w-4" />
          Restaurar Chat
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem
          onClick={() => onDelete(chatRoom)}
          className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
          Excluir Permanentemente
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default ArchivedChatRoomContextMenu;
