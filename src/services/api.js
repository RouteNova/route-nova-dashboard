import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configuración de la instancia de Axios
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Tiempo límite de 10 segundos
});

// Interceptor de Solicitud (Request): Inserta el token de autenticación si está disponible
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Respuesta (Response): Gestiona errores de forma centralizada con Toastify
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const serverMessage = error.response.data?.error || 'Ocurrió un error en la solicitud.';

      if (status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        toast.error('Sesión expirada o no autorizada. Redirigiendo...');
        
        // Retrasar redirección levemente para que el usuario alcance a leer el Toast
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else if (status === 403) {
        toast.error('Acceso denegado: No tienes permisos para esta acción.');
      } else if (status === 404) {
        toast.error(`No encontrado: ${serverMessage}`);
      } else if (status >= 500) {
        toast.error('Error interno del servidor backend. Inténtalo de nuevo más tarde.');
      } else {
        toast.error(serverMessage);
      }
      
      return Promise.reject(new Error(serverMessage));
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Tiempo de espera de conexión agotado (Timeout) con el servidor.');
      return Promise.reject(new Error('Límite de tiempo agotado en la solicitud.'));
    }
    
    toast.error('Error de red: No se pudo conectar con el servidor de la API.');
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
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify({
        _id: data._id,
        nombre: data.nombre,
        correo: data.correo,
        rol: data.rol
      }));
    }
    return data;
  },

  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => {
    return sessionStorage.getItem('token');
  },

  isAuthenticated: () => {
    return !!sessionStorage.getItem('token');
  },

  getProfile: () => {
    return api.get('/auth/profile');
  }
};

/**
 * Servicio de Gestión de Usuarios (CRUD)
 */
export const userService = {
  getUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

/**
 * Servicio de Gestión de Estudiantes (CRUD)
 */
export const studentService = {
  getStudents: (params) => api.get('/students', { params }),
  getStudentById: (id) => api.get(`/students/${id}`),
  createStudent: (studentData) => api.post('/students', studentData),
  updateStudent: (id, studentData) => api.put(`/students/${id}`, studentData),
  deleteStudent: (id) => api.delete(`/students/${id}`),
  getStudentEvents: (id) => api.get(`/students/${id}/events`),
};

/**
 * Servicio de Gestión de Rutas
 */
export const routeService = {
  getRoutes: (params) => api.get('/routes', { params }),
  getRouteById: (id) => api.get(`/routes/${id}`),
  createRoute: (routeData) => api.post('/routes', routeData),
  updateRoute: (id, routeData) => api.put(`/routes/${id}`, routeData),
  deleteRoute: (id) => api.delete(`/routes/${id}`),
};

/**
 * Servicio de Gestión de Padres (CRUD)
 */
export const padreService = {
  getPadres: (params) => api.get('/padres', { params }),
  getPadreById: (id) => api.get(`/padres/${id}`),
  createPadre: (padreData) => api.post('/padres', padreData),
  updatePadre: (id, padreData) => api.put(`/padres/${id}`, padreData),
  deletePadre: (id) => api.delete(`/padres/${id}`),
  getPadreEstudiantes: (id) => api.get(`/padres/${id}/estudiantes`),
  associateEstudiantes: (id, studentIds) => api.post(`/padres/${id}/estudiantes`, { studentIds }),
};

/**
 * Servicio de Gestión de Conductores (CRUD)
 */
export const conductorService = {
  getConductors: (params) => api.get('/conductors', { params }),
  getConductorById: (id) => api.get(`/conductors/${id}`),
  createConductor: (conductorData) => api.post('/conductors', conductorData),
  updateConductor: (id, conductorData) => api.put(`/conductors/${id}`, conductorData),
  deleteConductor: (id) => api.delete(`/conductors/${id}`),
};

/**
 * Servicio de Gestión de Autobuses (CRUD)
 */
export const autobusService = {
  getAutobuses: (params) => api.get('/autobuses', { params }),
  getAutobusById: (id) => api.get(`/autobuses/${id}`),
  createAutobus: (autobusData) => api.post('/autobuses', autobusData),
  updateAutobus: (id, autobusData) => api.put(`/autobuses/${id}`, autobusData),
  deleteAutobus: (id) => api.delete(`/autobuses/${id}`),
};

