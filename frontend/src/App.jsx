import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import PrivateRoute from './routes/PrivateRoute';

import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/user/DashboardPage';
import ProfilePage from './pages/user/ProfilePage';
import PostJobPage from './pages/employer/PostJobPage';
import MyJobsPage from './pages/employer/MyJobsPage';
import AdminPage from './pages/admin/AdminPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route
          path="dashboard"
          element={
            <PrivateRoute roles={['user']}>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="profile"
          element={
            <PrivateRoute roles={['user', 'employer', 'admin']}>
              <ProfilePage />
            </PrivateRoute>
          }
        />

        <Route
          path="employer/post-job"
          element={
            <PrivateRoute roles={['employer']}>
              <PostJobPage />
            </PrivateRoute>
          }
        />
        <Route
          path="employer/edit-job/:id"
          element={
            <PrivateRoute roles={['employer', 'admin']}>
              <PostJobPage />
            </PrivateRoute>
          }
        />
        <Route
          path="employer/jobs"
          element={
            <PrivateRoute roles={['employer']}>
              <MyJobsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="admin"
          element={
            <PrivateRoute roles={['admin']}>
              <AdminPage />
            </PrivateRoute>
          }
        />

        <Route path="*" element={
          <div className="text-center py-20">
            <div className="text-6xl mb-4">404</div>
            <p className="text-gray-500 dark:text-gray-400">Sahifa topilmadi</p>
          </div>
        } />
      </Route>
    </Routes>
  );
}
