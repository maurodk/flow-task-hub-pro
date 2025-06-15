
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Hash, Users, MessageCircle } from 'lucide-react';
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

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
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
          
          <TabsList className="grid grid-cols-auto gap-1 bg-transparent h-auto p-0">
            {/* Aba Geral */}
            <TabsTrigger 
              value="geral" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300"
            >
              <MessageCircle className="h-4 w-4" />
              Geral
            </TabsTrigger>

            {/* Abas por Setor */}
            {sectors.map((sector) => (
              <TabsTrigger 
                key={sector.id}
                value={`sector-${sector.id}`}
                className="flex items-center gap-2 data-[state=active]:bg-green-100 dark:data-[state=active]:bg-green-900 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-300"
              >
                <Users className="h-4 w-4" />
                {sector.name}
              </TabsTrigger>
            ))}

            {/* Abas de Chat Rooms Customizados */}
            {chatRooms.map((room) => (
              <TabsTrigger 
                key={room.id}
                value={`room-${room.id}`}
                className="flex items-center gap-2 data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300"
              >
                <Hash className="h-4 w-4" />
                {room.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Conteúdo das abas */}
        <TabsContent value="geral" className="mt-0">
          {children}
        </TabsContent>

        {sectors.map((sector) => (
          <TabsContent key={sector.id} value={`sector-${sector.id}`} className="mt-0">
            {children}
          </TabsContent>
        ))}

        {chatRooms.map((room) => (
          <TabsContent key={room.id} value={`room-${room.id}`} className="mt-0">
            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="font-medium text-purple-900 dark:text-purple-100">
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ChatTabs;
