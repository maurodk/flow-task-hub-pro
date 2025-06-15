
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Plus, Hash, Users, MessageCircle, ChevronDown } from 'lucide-react';
import { useSectors } from '@/hooks/useSectors';
import { useChatRooms, ChatRoom } from '@/hooks/useChatRooms';

interface ChatTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  onCreateChatRoom: () => void;
  children: React.ReactNode;
}

const ChatTabs: React.FC<ChatTabsProps> = ({
  activeTab,
  onTabChange,
  onCreateChatRoom,
  children
}) => {
  const { sectors } = useSectors();
  const { chatRooms } = useChatRooms();

  // Função para obter o nome do setor selecionado
  const getSelectedSectorName = () => {
    if (activeTab.startsWith('sector-')) {
      const sectorId = activeTab.replace('sector-', '');
      const sector = sectors.find(s => s.id === sectorId);
      return sector?.name || 'Setor';
    }
    return 'Setores';
  };

  // Função para obter o nome do chat customizado selecionado
  const getSelectedChatName = () => {
    if (activeTab.startsWith('room-')) {
      const roomId = activeTab.replace('room-', '');
      const room = chatRooms.find(r => r.id === roomId);
      return room?.name || 'Chat';
    }
    return 'Chats Customizados';
  };

  return (
    <div className="w-full">
      <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Discussões por Área
          </h2>
          <Button
            onClick={onCreateChatRoom}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Criar Chat
          </Button>
        </div>
        
        {/* Nova estrutura horizontal com três dropdowns/botões */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {/* Aba Geral */}
          <Button
            variant={activeTab === 'geral' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTabChange('geral')}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <MessageCircle className="h-4 w-4" />
            Geral
          </Button>

          {/* Dropdown para Setores */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={activeTab.startsWith('sector-') ? 'default' : 'outline'}
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Users className="h-4 w-4" />
                {getSelectedSectorName()}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {sectors.map((sector) => (
                <DropdownMenuItem
                  key={sector.id}
                  onClick={() => onTabChange(`sector-${sector.id}`)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Users className="h-4 w-4" />
                  {sector.name}
                  {activeTab === `sector-${sector.id}` && (
                    <div className="ml-auto h-2 w-2 bg-blue-500 rounded-full" />
                  )}
                </DropdownMenuItem>
              ))}
              {sectors.length === 0 && (
                <DropdownMenuItem disabled>
                  Nenhum setor disponível
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dropdown para Chats Customizados */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={activeTab.startsWith('room-') ? 'default' : 'outline'}
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Hash className="h-4 w-4" />
                {getSelectedChatName()}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {chatRooms.map((room) => (
                <DropdownMenuItem
                  key={room.id}
                  onClick={() => onTabChange(`room-${room.id}`)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Hash className="h-4 w-4" />
                  {room.name}
                  {activeTab === `room-${room.id}` && (
                    <div className="ml-auto h-2 w-2 bg-purple-500 rounded-full" />
                  )}
                </DropdownMenuItem>
              ))}
              {chatRooms.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={onCreateChatRoom}
                className="flex items-center gap-2 cursor-pointer text-blue-600 dark:text-blue-400"
              >
                <Plus className="h-4 w-4" />
                Criar Novo Chat
              </DropdownMenuItem>
              {chatRooms.length === 0 && (
                <DropdownMenuItem disabled className="text-sm text-gray-500">
                  Nenhum chat personalizado
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Conteúdo das abas - mantém a mesma estrutura */}
      <div className="mt-0">
        {/* Conteúdo da aba Geral */}
        {activeTab === 'geral' && children}

        {/* Conteúdo das abas de Setores */}
        {sectors.map((sector) => (
          activeTab === `sector-${sector.id}` && (
            <div key={sector.id}>
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {sector.name}
                </h3>
                {sector.description && (
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {sector.description}
                  </p>
                )}
              </div>
              {children}
            </div>
          )
        ))}

        {/* Conteúdo das abas de Chat Rooms */}
        {chatRooms.map((room) => (
          activeTab === `room-${room.id}` && (
            <div key={room.id}>
              <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="font-medium text-purple-900 dark:text-purple-100 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  {room.name}
                </h3>
                {room.description && (
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                    {room.description}
                  </p>
                )}
                {room.sectors && room.sectors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {room.sectors.map((sector) => (
                      <span
                        key={sector.id}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-md"
                      >
                        {sector.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {children}
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default ChatTabs;
