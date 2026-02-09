import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import DashboardScreen from '../features/dashboard/screens/DashboardScreen';
import SkillDetailScreen from '../features/skills/screens/SkillDetailScreen';
import TrainingScreen from '../features/training/screens/TrainingScreen';

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginScreen /> },
      { path: '/register', element: <RegisterScreen /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <DashboardScreen /> },
      { path: '/skills/:id', element: <SkillDetailScreen /> },
      { path: '/train/:skillId', element: <TrainingScreen /> },
      { path: '/train/:skillId/:sessionId', element: <TrainingScreen /> },
    ],
  },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
]);

export default router;
