
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronDown, Users, Building2, MessageSquare, Archive } from 'lucide-react';
import { useSectors } from '@/hooks/useSectors';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useUserRole } from '@/hooks/useAuth';

interface ChatTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreateChatRoom: () => void;
  children: React.ReactNode;
}

const ChatTabs: React.FC<ChatTabsProps> = ({
  activeTab,
  onTabChange,
  onCreateChatRoom,
  children
}) => {
  const { sectors, userSectors } = useSectors();
  const { chatRooms, archivedChatRooms } = useChatRooms();
  const { isAdmin } = useUserRole();
  const [showArchivedDropdown, setShowArchivedDropdown] = useState(false);

  // Filtrar setores baseado no usuário
  const availableSectors = isAdmin 
    ? sectors 
    : sectors.filter(sector => 
        userSectors.some(us => us.sector_id === sector.id)
      );

  const getTabLabel = () => {
    if (activeTab === 'geral') return 'Geral';
    if (activeTab.startsWith('sector-')) {
      const sectorId = activeTab.replace('sector-', '');
      const sector = sectors.find(s => s.id === sectorId);
      return sector ? sector.name : 'Setor';
    }
    if (activeTab.startsWith('room-')) {
      const roomId = activeTab.replace('room-', '');
      const room = [...chatRooms, ...archivedChatRooms].find(r => r.id === roomId);
      return room ? room.name : 'Chat';
    }
    return 'Geral';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <TabsList className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <TabsTrigger value="geral" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Geral
              </TabsTrigger>
              
              {/* Dropdown de Setores */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={activeTab.startsWith('sector-') ? 'default' : 'ghost'} 
                    className="flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    {activeTab.startsWith('sector-') ? getTabLabel() : 'Setores'}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {availableSectors.length > 0 ? (
                    availableSectors.map((sector) => (
                      <DropdownMenuItem
                        key={sector.id}
                        onClick={() => onTabChange(`sector-${sector.id}`)}
                        className="flex items-center gap-2"
                      >
                        <Building2 className="h-4 w-4" />
                        {sector.name}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>
                      <span className="text-gray-500">Nenhum setor disponível</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dropdown de Chats Customizados */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={activeTab.startsWith('room-') && !archivedChatRooms.some(r => activeTab === `room-${r.id}`) ? 'default' : 'ghost'} 
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {activeTab.startsWith('room-') && !archivedChatRooms.some(r => activeTab === `room-${r.id}`) ? getTabLabel() : 'Chats'}
                    <ChevronDown className="h-3 w-3" />
                    {chatRooms.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                        {chatRooms.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {chatRooms.length > 0 ? (
                    chatRooms.map((room) => (
                      <DropdownMenuItem
                        key={room.id}
                        onClick={() => onTabChange(`room-${room.id}`)}
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{room.name}</div>
                          {room.sectors && room.sectors.length > 0 && (
                            <div className="text-xs text-gray-500 truncate">
                              {room.sectors.map(s => s.name).join(', ')}
                            </div>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>
                      <span className="text-gray-500">Nenhum chat disponível</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dropdown de Chats Arquivados */}
              <DropdownMenu open={showArchivedDropdown} onOpenChange={setShowArchivedDropdown}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={activeTab.startsWith('room-') && archivedChatRooms.some(r => activeTab === `room-${r.id}`) ? 'default' : 'ghost'} 
                    className="flex items-center gap-2"
                  >
                    <Archive className="h-4 w-4" />
                    {activeTab.startsWith('room-') && archivedChatRooms.some(r => activeTab === `room-${r.id}`) ? getTabLabel() : 'Arquivados'}
                    <ChevronDown className="h-3 w-3" />
                    {archivedChatRooms.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                        {archivedChatRooms.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {archivedChatRooms.length > 0 ? (
                    archivedChatRooms.map((room) => (
                      <DropdownMenuItem
                        key={room.id}
                        onClick={() => onTabChange(`room-${room.id}`)}
                        className="flex items-center gap-2"
                      >
                        <Archive className="h-4 w-4" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{room.name}</div>
                          {room.sectors && room.sectors.length > 0 && (
                            <div className="text-xs text-gray-500 truncate">
                              {room.sectors.map(s => s.name).join(', ')}
                            </div>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>
                      <span className="text-gray-500">Nenhum chat arquivado</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TabsList>
          </Tabs>
        </div>

        <Button onClick={onCreateChatRoom} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Chat
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsContent value={activeTab} className="mt-0">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatTabs;
