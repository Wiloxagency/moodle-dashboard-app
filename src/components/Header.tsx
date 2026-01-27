import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, Sheet, LogOut, User, Home, Users, Building2, Waypoints, UserCircle2 } from 'lucide-react';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const isSuperAdmin = user?.role === 'superAdmin';

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          {/* EDUTECNO Logo */}
          <img 
            src={logo} 
            alt="EDUTECNO" 
            className="h-[50px] w-auto"
          />
          
          {/* Navigation Links */}
          <nav className="flex space-x-4">
            <Link 
              to="/dashboard" 
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/dashboard') 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/inscripciones" 
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/inscripciones') 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Inscripciones</span>
            </Link>
            {isSuperAdmin && (
              <>
                <Link 
                  to="/empresas" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/empresas') 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Empresas</span>
                </Link>
                <Link 
                  to="/usuarios" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/usuarios') 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <UserCircle2 className="w-4 h-4" />
                  <span>Usuarios</span>
                </Link>
                <Link 
                  to="/sence" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/sence') 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Sheet className="w-4 h-4" />
                  <span>Sence</span>
                </Link>
              </>
            )}
            <Link 
              to="/modalidad" 
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/modalidad') 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Waypoints className="w-4 h-4" />
              <span>Modalidad</span>
            </Link>
            <Link 
              to="/ejecutivos" 
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/ejecutivos') 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <UserCircle2 className="w-4 h-4" />
              <span>Ejecutivos</span>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Exportar PDF Button */}
          <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Exportar PDF</span>
          </button>
          
          {/* Exportar Excel Button */}
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm">
            <Sheet className="w-4 h-4" />
            <span className="text-sm font-medium">Exportar Excel</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {/* User Name */}
          <div className="flex items-center space-x-2 text-gray-700">
            <User className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium">{user?.username ?? 'Invitado'}</span>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
