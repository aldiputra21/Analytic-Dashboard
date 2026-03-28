// ProtectedRoute.tsx - Access control for frontend routes
// Requirements: 9.1

import React from 'react';
import { useAuth } from '../../../hooks/financial/useAuth';
import { UserRole } from '../../../types/financial/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallback,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 font-medium">Please log in to continue</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <p className="text-slate-600 font-medium">Access denied</p>
          <p className="text-sm text-slate-400 mt-1">You don't have permission to view this page</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
