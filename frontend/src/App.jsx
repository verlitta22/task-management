import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/register';
import UserDashboard from './pages/user-dashboard';
import AdminDashboard from './pages/admin-dashboard';

// Komponen ProtectedRoute menggunakan useEffect agar alert pasti muncul
function ProtectedRoute({ children, role }) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    // Jika tidak ada token atau data user, arahkan kembali ke login
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

    // Pengecekan role menggunakan useEffect
    const isUnauthorized = role && user.role !== role;

    useEffect(() => {
        if (isUnauthorized) {
            localStorage.clear();
            window.alert("Akses ditolak: Role Anda tidak diizinkan masuk ke halaman ini.");
            window.location.href = "/login";
        }
    }, [isUnauthorized]);

    if (isUnauthorized) {
        return null; // Tampilkan kosong sejenak saat alert diproses
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
                
                {/* User Dashboard Route */}
                <Route path="/dashboard" element={
                    <ProtectedRoute role="USER">
                        <UserDashboard />
                    </ProtectedRoute>
                } />

                {/* Admin Dashboard Route */}
                <Route path="/admin/dashboard" element={
                    <ProtectedRoute role="ADMIN">
                        <AdminDashboard />
                    </ProtectedRoute>
                } />

                {/* Root Redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Catch-all Wildcard Route */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}