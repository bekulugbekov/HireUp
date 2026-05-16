import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, loading, error } = useSelector((s) => s.auth);

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isEmployer: user?.role === 'employer',
    isUser: user?.role === 'user',
    logout: () => dispatch(logout()),
  };
};
