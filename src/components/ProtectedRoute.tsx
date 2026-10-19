import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAdminRole } from '../types/auth';
import { useAuth } from '../context/AuthContext';
import { isWhiteLabelSite } from '../whitelabel/whiteLabel';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * - 'superAdmin': sólo el Superadmin.
   * - 'admin':      Superadmin o Administrador (de un White Label).
   */
  requiredRole?: 'superAdmin' | 'admin';
  /** La página no existe en los sitios White Label (Empresas, VMICA). */
  hideOnWhiteLabel?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, hideOnWhiteLabel }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (hideOnWhiteLabel && isWhiteLabelSite()) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'superAdmin' && user.role !== 'superAdmin') {
    return <Navigate to="/dashboard" replace />;
  }
  if (requiredRole === 'admin' && !isAdminRole(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
