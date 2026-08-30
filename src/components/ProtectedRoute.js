import React from "react";
import { Navigate } from "react-router-dom";

const roleHomeMap = {
  citizen: '/',
  university: '/university',
  industry: '/industry',
  admin: '/',
};

function ProtectedRoute({ user, userRole, allowedRoles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    const redirectTo = roleHomeMap[userRole] || '/login';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

export default ProtectedRoute;