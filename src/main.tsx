import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {AuthProvider} from './context/AuthContext';
import App from './App';
import './index.css';

const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
        try {
            const registration = await navigator.serviceWorker.register("/service-worker.js");
            console.log("Service Worker registered with scope:", registration.scope);
        } catch (error) {
            console.error("Service Worker registration failed:", error);
        }
    }
};

registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App/>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);