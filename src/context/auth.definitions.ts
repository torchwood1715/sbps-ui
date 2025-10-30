import { createContext } from 'react';

export interface AuthResponse {
    token: string;
}

export interface AuthCredentials {
    email: string;
    password: string;
    username?: string;
}

export interface DecodedToken {
    sub: string;
    username: string;
    exp: number;
}

export interface UserInfo {
    username: string;
}

export interface AuthContextType {
    token: string | null;
    user: UserInfo | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (credentials: AuthCredentials) => Promise<void>;
    register: (credentials: AuthCredentials) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);