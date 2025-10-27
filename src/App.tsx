import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes Wrapper */}
            <Route element={<ProtectedRoute />}>
                {/* All routes inside here are protected */}
                <Route path="/dashboard" element={<DashboardPage />} />
                {/* Add other protected routes here, e.g., /devices, /settings */}
            </Route>

            {/* Redirect root to the dashboard (if logged in) or login (if not) */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;