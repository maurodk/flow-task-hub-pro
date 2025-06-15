import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Hash, Users, MessageCircle, ChevronDown, MoreHorizontal, Archive, RotateCcw, RefreshCw } from 'lucide-react';
import { useSectors } from '@/hooks/useSectors';
import { useChatRooms, ChatRoom } from '@/hooks/useChatRooms';
import ChatRoomContextMenu from './ChatRoomContextMenu';
import ArchivedChatRoomContextMenu from './ArchivedChatRoomContextMenu';
import EditChatRoomModal from './EditChatRoomModal';
import { toast } from 'sonner';

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
  const { 
    chatRooms, 
    archivedChatRooms,
    updateChatRoom, 
    archiveChatRoom,
    restoreChatRoom,
    deleteChatRoom, 
    loading,
    loadingArchived,
    fetchArchivedChatRooms,
    forceRefresh
  } = useChatRooms();
  
  // Estados para modais e confirmações
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [chatToArchive, setChatToArchive] = useState<ChatRoom | null>(null);
  const [chatToDelete, setChatToDelete] = useState<ChatRoom | null>(null);
  const [chatToRestore, setChatToRestore] = useState<ChatRoom | null>(null);

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

  // Handlers para o Context Menu dos chats ativos
  const handleEditChat = (chatRoom: ChatRoom) => {
    console.log('[ChatTabs] Editing chat room:', chatRoom);
    setSelectedChatRoom(chatRoom);
    setEditModalOpen(true);
  };

  const handleArchiveChat = (chatRoom: ChatRoom) => {
    console.log('[ChatTabs] Archiving chat room:', chatRoom);
    setChatToArchive(chatRoom);
    setArchiveDialogOpen(true);
  };

  // Handlers para o Context Menu dos chats arquivados
  const handleRestoreChat = (chatRoom: ChatRoom) => {
    console.log('[ChatTabs] Restoring chat room:', chatRoom);
    setChatToRestore(chatRoom);
    setRestoreDialogOpen(true);
  };

  const handleDeleteChatPermanently = (chatRoom: ChatRoom) => {
    console.log('[ChatTabs] Permanently deleting chat room:', chatRoom);
    setChatToDelete(chatRoom);
    setDeleteDialogOpen(true);
  };

  // Função para refresh manual
  const handleManualRefresh = () => {
    console.log('[ChatTabs] Manual refresh triggered');
    forceRefresh();
    toast.info('Atualizando chats...');
  };

  // Confirmação de arquivamento
  const confirmArchive = async () => {
    if (chatToArchive) {
      try {
        await archiveChatRoom(chatToArchive.id);
        
        if (activeTab === `room-${chatToArchive.id}`) {
          onTabChange('geral');
        }
      } catch (error) {
        console.error('[ChatTabs] Error archiving chat:', error);
      }
    }
    setArchiveDialogOpen(false);
    setChatToArchive(null);
  };

  // Confirmação de restauração
  const confirmRestore = async () => {
    if (chatToRestore) {
      try {
        await restoreChatRoom(chatToRestore.id);
      } catch (error) {
        console.error('[ChatTabs] Error restoring chat:', error);
      }
    }
    setRestoreDialogOpen(false);
    setChatToRestore(null);
  };

  // Confirmação de exclusão permanente
  const confirmDelete = async () => {
    if (chatToDelete) {
      try {
        await deleteChatRoom(chatToDelete.id);
        
        if (activeTab === `room-${chatToDelete.id}` || activeTab === `archived-${chatToDelete.id}`) {
          onTabChange('geral');
        }
      } catch (error) {
        console.error('[ChatTabs] Error deleting chat:', error);
      }
    }
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  // Handler para atualizar chat room
  const handleUpdateChatRoom = async (roomId: string, name: string, description: string, sectorIds: string[]) => {
    await updateChatRoom(roomId, name, description, sectorIds);
  };

  // Handler para carregar chats arquivados quando necessário
  const handleArchivedDropdownOpen = () => {
    if (archivedChatRooms.length === 0 && !loadingArchived) {
      fetchArchivedChatRooms();
    }
  };

  // Log para debug do estado dos chatRooms
  console.log('[ChatTabs] Current state:', {
    chatRoomsCount: chatRooms.length,
    loading,
    activeTab,
    chatRooms: chatRooms.map(r => ({ id: r.id, name: r.name }))
  });

  return (
    <div className="w-full">
      <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Discussões por Área
          </h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleManualRefresh}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              onClick={onCreateChatRoom}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Chat
            </Button>
          </div>
        </div>
        
        {/* Nova estrutura horizontal com quatro dropdowns/botões */}
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

          {/* Dropdown para Chats Customizados Ativos */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={activeTab.startsWith('room-') ? 'default' : 'outline'}
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Hash className="h-4 w-4" />
                {getSelectedChatName()}
                {chatRooms.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                    {chatRooms.length}
                  </span>
                )}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {loading ? (
                <DropdownMenuItem disabled className="text-sm text-gray-500">
                  Carregando chats...
                </DropdownMenuItem>
              ) : chatRooms.length > 0 ? (
                <>
                  {chatRooms.map((room) => (
                    <div key={room.id} className="group relative">
                      <ChatRoomContextMenu
                        chatRoom={room}
                        onEdit={handleEditChat}
                        onArchive={handleArchiveChat}
                      >
                        <DropdownMenuItem
                          onClick={() => onTabChange(`room-${room.id}`)}
                          className="flex items-center gap-2 cursor-pointer pr-8"
                        >
                          <Hash className="h-4 w-4" />
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{room.name}</div>
                            {room.description && (
                              <div className="text-xs text-gray-500 truncate">
                                {room.description}
                              </div>
                            )}
                          </div>
                          {activeTab === `room-${room.id}` && (
                            <div className="ml-auto h-2 w-2 bg-purple-500 rounded-full" />
                          )}
                        </DropdownMenuItem>
                      </ChatRoomContextMenu>
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  ))}
                  <DropdownMenuSeparator />
                </>
              ) : (
                <DropdownMenuItem disabled className="text-sm text-gray-500">
                  Nenhum chat ativo
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={onCreateChatRoom}
                className="flex items-center gap-2 cursor-pointer text-blue-600 dark:text-blue-400"
              >
                <Plus className="h-4 w-4" />
                Criar Novo Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dropdown para Chats Arquivados */}
          <DropdownMenu onOpenChange={(open) => open && handleArchivedDropdownOpen()}>
            <DropdownMenuTrigger asChild>
              <Button
                variant={activeTab.startsWith('archived-') ? 'default' : 'outline'}
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Archive className="h-4 w-4" />
                Arquivados
                {archivedChatRooms.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-500 text-white rounded-full">
                    {archivedChatRooms.length}
                  </span>
                )}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {loadingArchived ? (
                <DropdownMenuItem disabled className="text-sm text-gray-500">
                  Carregando chats arquivados...
                </DropdownMenuItem>
              ) : archivedChatRooms.length > 0 ? (
                archivedChatRooms.map((room) => (
                  <div key={room.id} className="group relative">
                    <ArchivedChatRoomContextMenu
                      chatRoom={room}
                      onRestore={handleRestoreChat}
                      onDelete={handleDeleteChatPermanently}
                    >
                      <DropdownMenuItem
                        onClick={() => onTabChange(`archived-${room.id}`)}
                        className="flex items-center gap-2 cursor-pointer pr-8 opacity-75 hover:opacity-100"
                      >
                        <Archive className="h-4 w-4 text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-gray-600 dark:text-gray-400">{room.name}</div>
                          {room.description && (
                            <div className="text-xs text-gray-500 truncate">
                              {room.description}
                            </div>
                          )}
                        </div>
                        {activeTab === `archived-${room.id}` && (
                          <div className="ml-auto h-2 w-2 bg-gray-500 rounded-full" />
                        )}
                      </DropdownMenuItem>
                    </ArchivedChatRoomContextMenu>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-3 w-3 text-gray-400" />
                    </div>
                  </div>
                ))
              ) : (
                <DropdownMenuItem disabled className="text-sm text-gray-500">
                  Nenhum chat arquivado
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Dica visual sobre o context menu e status de debug */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
          {(chatRooms.length > 0 || archivedChatRooms.length > 0) && (
            <div>💡 Dica: Clique com o botão direito nos chats para acessar opções adicionais</div>
          )}
          {/* Status de debug para desenvolvimento */}
          <div className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
            Debug: {chatRooms.length} chats ativos | Loading: {loading.toString()} | User Admin: {true}
          </div>
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

        {/* Conteúdo das abas de Chat Rooms Ativos */}
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

        {/* Conteúdo das abas de Chat Rooms Arquivados */}
        {archivedChatRooms.map((room) => (
          activeTab === `archived-${room.id}` && (
            <div key={room.id}>
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  {room.name} <span className="text-sm text-gray-500">(Arquivado)</span>
                </h3>
                {room.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {room.description}
                  </p>
                )}
                {room.sectors && room.sectors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {room.sectors.map((sector) => (
                      <span
                        key={sector.id}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md"
                      >
                        {sector.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    Este chat está arquivado. Posts são somente leitura.
                  </p>
                </div>
              </div>
              {children}
            </div>
          )
        ))}
      </div>

      {/* Modal de Edição */}
      <EditChatRoomModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedChatRoom(null);
        }}
        onSubmit={handleUpdateChatRoom}
        chatRoom={selectedChatRoom}
      />

      {/* Dialog de Confirmação de Arquivamento */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar o chat "{chatToArchive?.name}"?
              <br />
              <br />
              O chat será movido para a área de arquivados, mas pode ser restaurado a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmArchive}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Arquivar Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Confirmação de Restauração */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja restaurar o chat "{chatToRestore?.name}"?
              <br />
              <br />
              O chat será reativado e voltará para a lista de chats customizados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              className="bg-green-600 hover:bg-green-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Confirmação de Exclusão Permanente */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Chat Permanentemente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente o chat "{chatToDelete?.name}"?
              <br />
              <br />
              <strong>Esta ação não pode ser desfeita.</strong> O chat e todas as suas mensagens serão removidos para sempre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatTabs;
