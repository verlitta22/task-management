import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/register';
import UserDashboard from './pages/user/user_dashboard';
import UserTasks from './pages/user/user_tasks';
import AdminDashboard from './pages/admin/admin_dashboard';
import AdminUsers from './pages/admin/admin_users';
import AdminTasks from './pages/admin/admin_tasks';

function ProtectedRoute({ children, role }) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
        return <Navigate to="/login" replace />;
    }

    let user;
    try {
        user = JSON.parse(userStr);
    } catch (e) {
        localStorage.clear();
        return <Navigate to="/login" replace />;
    }

    const userRole = (user.role || '').toUpperCase();
    const requiredRole = (role || '').toUpperCase();
    const isUnauthorized = requiredRole && userRole !== requiredRole;

    useEffect(() => {
        if (isUnauthorized) {
            localStorage.clear();
            window.alert("Akses ditolak: Role Anda tidak diizinkan masuk ke halaman ini.");
            window.location.href = "/login";
        }
    }, [isUnauthorized]);

    if (isUnauthorized) {
        return null;
    }

    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* User Dashboard & Tasks Routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute role="USER">
                        <UserDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/tasks" element={
                    <ProtectedRoute role="USER">
                        <UserTasks />
                    </ProtectedRoute>
                } />

                {/* Admin Dashboard Routes */}
                <Route path="/admin/dashboard" element={
                    <ProtectedRoute role="ADMIN">
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                    <ProtectedRoute role="ADMIN">
                        <AdminUsers />
                    </ProtectedRoute>
                } />
                <Route path="/admin/tasks" element={
                    <ProtectedRoute role="ADMIN">
                        <AdminTasks />
                    </ProtectedRoute>
                } />

                {/* Root Redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}