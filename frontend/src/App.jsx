import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import UserDashboard from './pages/user-dashboard';
import AdminDashboard from './pages/admin-dashboard';

function ProtectedRoute({ children, role }) {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) return <Navigate to="/login" replace />;
    if (role && user.role !== role) return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} replace />;

    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route path="/dashboard" element={
                    <ProtectedRoute role="USER">
                        <UserDashboard />
                    </ProtectedRoute>
                } />

                <Route path="/admin/dashboard" element={
                    <ProtectedRoute role="ADMIN">
                        <AdminDashboard />
                    </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}