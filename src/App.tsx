import {Navigate, Route, Routes} from 'react-router-dom';
import {LoginPage} from './pages/LoginPage';
import {RegisterPage} from './pages/RegisterPage';
import {DashboardPage} from './pages/DashboardPage';
import {ProtectedRoute} from './components/ProtectedRoute';
import {DeviceSettingsPage} from './pages/DeviceSettingsPage';
import {CreateDevicePage} from './pages/CreateDevicePage';
import {SettingsPage} from "./pages/SettingsPage.tsx";

function App() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/register" element={<RegisterPage/>}/>

            {/* Protected Routes Wrapper */}
            <Route element={<ProtectedRoute/>}>
                {/* All routes inside here are protected */}
                <Route path="/dashboard" element={<DashboardPage/>}/>
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/device/create" element={<CreateDevicePage/>}/>
                <Route path="/device/:deviceId/settings" element={<DeviceSettingsPage/>}/>
            </Route>

            {/* Redirect root to the dashboard (if logged in) or login (if not) */}
            <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
        </Routes>
    );
}

export default App;