import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configuración de la instancia de Axios
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Solicitud (Request): Inserta el token de autenticación si está disponible
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Respuesta (Response): Gestiona errores de forma centralizada (ej. 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Si el servidor responde con 401 (Token inválido o expirado)
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirigir a login para resetear el estado de la aplicación
        window.location.href = '/login';
      }
      
      const serverMessage = error.response.data?.error || 'Ocurrió un error en la solicitud.';
      return Promise.reject(new Error(serverMessage));
    }
    
    return Promise.reject(new Error(error.message || 'Error de conexión con el servidor.'));
  }
);

export default api;

/**
 * Servicio de Autenticación
 */
export const authService = {
  login: async (correo, password) => {
    const data = await api.post('/auth/login', { correo, password });
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: data._id,
        nombre: data.nombre,
        correo: data.correo,
        rol: data.rol
      }));
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};
