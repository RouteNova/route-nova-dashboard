const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Realiza peticiones HTTP a la API de RouteNova.
 */
export const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ocurrió un error en la solicitud.');
    }

    return data;
  } catch (error) {
    console.error('Error de API:', error.message);
    throw error;
  }
};

/**
 * Servicio de Autenticación
 */
export const authService = {
  login: async (correo, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: { correo, password },
    });
    
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
