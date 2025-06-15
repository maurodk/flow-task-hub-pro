
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Edit, Archive } from 'lucide-react';
import { ChatRoom } from '@/types/chatRoom';

interface ChatRoomContextMenuProps {
  chatRoom: ChatRoom;
  onEdit: (chatRoom: ChatRoom) => void;
  onArchive: (chatRoom: ChatRoom) => void;
  children: React.ReactNode;
}

const ChatRoomContextMenu: React.FC<ChatRoomContextMenuProps> = ({
  chatRoom,
  onEdit,
  onArchive,
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
          <Edit className="h-4 w-4" />
          Editar Chat
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem
          onClick={() => onArchive(chatRoom)}
          className="flex items-center gap-2 cursor-pointer text-orange-600 dark:text-orange-400"
        >
          <Archive className="h-4 w-4" />
          Arquivar Chat
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default ChatRoomContextMenu;
