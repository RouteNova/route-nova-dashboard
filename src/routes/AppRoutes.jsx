import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Usuarios from '../pages/Usuarios';
import Estudiantes from '../pages/Estudiantes';
import Padres from '../pages/Padres';
import Conductores from '../pages/Conductores';
import Autobuses from '../pages/Autobuses';
import Rutas from '../pages/Rutas';
import NotFoundPage from '../pages/NotFoundPage';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Routes (nested inside MainLayout) */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['administrador']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/estudiantes" element={<Estudiantes />} />
        <Route path="/padres" element={<Padres />} />
        <Route path="/conductores" element={<Conductores />} />
        <Route path="/autobuses" element={<Autobuses />} />
        <Route path="/rutas" element={<Rutas />} />
      </Route>

      {/* Redirects and Fallbacks */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
