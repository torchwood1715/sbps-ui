import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { AxiosError } from 'axios';

interface AuthResponse {
    token: string;
}

interface AuthCredentials {
    email: string;
    password: string;
}

interface AuthContextType {
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (credentials: AuthCredentials) => Promise<void>;
    register: (credentials: AuthCredentials) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
        }
    }, []);

    const handleAuthSuccess = (token: string) => {
        setToken(token);
        localStorage.setItem('token', token);
        setError(null);
        navigate('/dashboard');
    };

    const handleAuthError = (err: unknown) => {
        let errorMessage = 'An unknown error occurred.';
        if (err instanceof AxiosError) {
            if (err.response?.status === 400 || err.response?.status === 401) {
                errorMessage = 'Invalid email or password.';
            } else if (err.response?.status === 409) {
                errorMessage = 'User with this email already exists.';
            } else {
                errorMessage = err.message;
            }
        }
        setError(errorMessage);
        console.error(err);
    };

    const login = async (credentials: AuthCredentials) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
            handleAuthSuccess(response.data.token);
        } catch (err) {
            handleAuthError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (credentials: AuthCredentials) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiClient.post<AuthResponse>('/api/auth/register', credentials);
            handleAuthSuccess(response.data.token);
        } catch (err) {
            handleAuthError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        localStorage.removeItem('token');
        navigate('/login');
    };

    const value = {
        token,
        isAuthenticated: !!token,
        isLoading,
        error,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};