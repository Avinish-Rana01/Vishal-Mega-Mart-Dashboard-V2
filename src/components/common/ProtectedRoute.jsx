import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MandatoryPasswordChange from '../auth/MandatoryPasswordChange';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, requirePasswordChange, loggedInUser } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Intercept and force new users to change password before accessing dashboard/pages
  if (requirePasswordChange) {
    return <MandatoryPasswordChange userName={loggedInUser} />;
  }

  return children;
}
