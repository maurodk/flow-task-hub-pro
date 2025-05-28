
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Bell, User, MessageSquare, LayoutDashboard, LogOut, Activity } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications] = useState(3);

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/activities', label: 'Atividades', icon: Activity },
    { path: '/mural', label: 'Mural', icon: MessageSquare },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Título */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EC</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EmpresaCorp
              </h1>
            </div>
          </div>

          {/* Menu de Navegação */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 ${
                    isActive(item.path) 
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg" 
                      : "hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          {/* Área do usuário */}
          <div className="flex items-center space-x-3">
            {/* Toggle de tema */}
            <ThemeToggle />

            {/* Notificações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative hover:bg-gray-100 dark:hover:bg-slate-800">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                    >
                      {notifications}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                <DropdownMenuLabel className="dark:text-white">Notificações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="dark:hover:bg-slate-700">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium dark:text-white">Nova atividade atribuída</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">João criou uma nova atividade</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="dark:hover:bg-slate-700">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium dark:text-white">Progresso atualizado</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Maria atualizou o progresso de uma atividade</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="dark:hover:bg-slate-700">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium dark:text-white">Atividade concluída</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Atividade "Revisar documentos" foi concluída</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menu do usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none dark:text-white">
                      {user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground dark:text-gray-400">
                      Usuário do sistema
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="dark:hover:bg-slate-700">
                  <User className="mr-2 h-4 w-4" />
                  <span className="dark:text-white">Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="dark:hover:bg-slate-700">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="dark:text-white">Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Menu mobile */}
        <div className="md:hidden pb-3">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 whitespace-nowrap ${
                    isActive(item.path) 
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" 
                      : "hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
