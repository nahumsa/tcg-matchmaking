import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRole, UserRole } from '../context/RoleContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: UserRole;
  redirectTo: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole, redirectTo }) => {
  const { role } = useRole();

  if (role === null) {
    return <Navigate to="/" replace />;
  }

  if (role !== allowedRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
