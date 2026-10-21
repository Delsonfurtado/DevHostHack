import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './Auth.jsx';

export default function RouteGuard({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="page-loader" role="status">
        Preparing secure workspace…
      </div>
    );
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role))
    return <Navigate to={user.role === 'client' ? '/app/home' : '/admin'} replace />;
  if (user.force_password_change && location.pathname !== '/change-password')
    return <Navigate to="/change-password" replace />;
  return children;
}
