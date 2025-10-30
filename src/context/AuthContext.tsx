import {type ReactNode, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import apiClient from '../api/apiClient';
import {isAxiosError} from 'axios';
import {jwtDecode} from 'jwt-decode';
import {
    AuthContext,
    type AuthContextType,
    type AuthCredentials,
    type AuthResponse,
    type DecodedToken,
    type UserInfo
} from './auth.definitions';

export const AuthProvider = ({children}: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decoded = jwtDecode<DecodedToken>(storedToken);
                if (Date.now() < decoded.exp * 1000) {
                    setToken(storedToken);
                    setUser({username: decoded.sub});
                } else {
                    localStorage.removeItem('token');
                }
            } catch (e) {
                console.error("Invalid token", e);
                localStorage.removeItem('token');
            }
        }
    }, []);

    const handleAuthSuccess = (token: string) => {
        try {
            const decoded = jwtDecode<DecodedToken>(token);
            setToken(token);
            setUser({username: decoded.sub});
            localStorage.setItem('token', token);
            setError(null);
            navigate('/dashboard');
        } catch (e) {
            console.error("Failed to decode token", e);
            handleAuthError(new Error("Received invalid token from server."));
        }
    };

    const handleAuthError = (err: unknown) => {
        let errorMessage = 'An unknown error occurred.';
        if (isAxiosError(err)) {
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
        if (!credentials.username) {
            setError("Username is required for registration.");
            return;
        }
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
        setUser(null);
        localStorage.removeItem('token');
        navigate('/login');
    };

    const value: AuthContextType = {
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        error,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};