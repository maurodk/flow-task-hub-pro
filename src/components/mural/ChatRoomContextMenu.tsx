
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { edit, archive, trash-2 } from 'lucide-react';
import { ChatRoom } from '@/hooks/useChatRooms';

interface ChatRoomContextMenuProps {
  chatRoom: ChatRoom;
  onEdit: (chatRoom: ChatRoom) => void;
  onArchive: (chatRoom: ChatRoom) => void;
  onDelete: (chatRoom: ChatRoom) => void;
  children: React.ReactNode;
}

const ChatRoomContextMenu: React.FC<ChatRoomContextMenuProps> = ({
  chatRoom,
  onEdit,
  onArchive,
  onDelete,
  children
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={() => onEdit(chatRoom)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <edit className="h-4 w-4" />
          Editar Chat
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem
          onClick={() => onArchive(chatRoom)}
          className="flex items-center gap-2 cursor-pointer text-orange-600 dark:text-orange-400"
        >
          <archive className="h-4 w-4" />
          Arquivar Chat
        </ContextMenuItem>
        
        <ContextMenuItem
          onClick={() => onDelete(chatRoom)}
          className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400"
        >
          <trash-2 className="h-4 w-4" />
          Excluir Chat
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default ChatRoomContextMenu;
