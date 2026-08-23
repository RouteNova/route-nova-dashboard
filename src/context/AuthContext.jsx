import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(() => !!authService.getToken());

  useEffect(() => {
    const verifySession = async () => {
      const token = authService.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await authService.getProfile();
        setUser(profile);
      } catch (error) {
        const status = error.response?.status;
        // Solo desloguear si es un error de credenciales explícito (401 o 403)
        if (status === 401 || status === 403) {
          authService.logout();
          setUser(null);
        } else {
          console.warn('No se pudo verificar la sesión con el servidor (error temporal o límite de peticiones):', error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (correo, password) => {
    setLoading(true);
    try {
      const data = await authService.login(correo, password);
      // Validate role before setting session in state
      if (data.rol !== 'administrador') {
        authService.logout();
        throw new Error('Acceso denegado. Este panel es exclusivo para administradores.');
      }
      setUser(data);
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    toast.success('Sesión cerrada con éxito.');
  };

  const updateUser = (updatedData) => {
    setUser((prevUser) => {
      const newUser = { ...prevUser, ...updatedData };
      sessionStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
