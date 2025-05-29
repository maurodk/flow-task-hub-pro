
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Home, 
  Calendar, 
  User, 
  LogOut, 
  MessageSquare,
  Building2 
} from 'lucide-react';

const Navbar = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              EmpresaCorp
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/dashboard">
              <Button 
                variant={isActive('/dashboard') ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            
            <Link to="/activities">
              <Button 
                variant={isActive('/activities') ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Atividades
              </Button>
            </Link>

            <Link to="/mural">
              <Button 
                variant={isActive('/mural') ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Mural
              </Button>
            </Link>

            <Link to="/profile">
              <Button 
                variant={isActive('/profile') ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Perfil
              </Button>
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3">
          <div className="flex space-x-1 overflow-x-auto">
            <Link to="/dashboard">
              <Button 
                variant={isActive('/dashboard') ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            
            <Link to="/activities">
              <Button 
                variant={isActive('/activities') ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Calendar className="h-4 w-4" />
                Atividades
              </Button>
            </Link>

            <Link to="/mural">
              <Button 
                variant={isActive('/mural') ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <MessageSquare className="h-4 w-4" />
                Mural
              </Button>
            </Link>

            <Link to="/profile">
              <Button 
                variant={isActive('/profile') ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <User className="h-4 w-4" />
                Perfil
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
