import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/register';
import UserDashboard from './pages/user-dashboard';
import AdminDashboard from './pages/admin-dashboard';

// Komponen ProtectedRoute yang lebih aman dan presisi
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
        // Jika data user korup, bersihkan storage dan ke login
        localStorage.clear();
        return <Navigate to="/login" replace />;
    }

    // Jika rute membutuhkan role tertentu dan role user tidak sesuai
    if (role && user.role !== role) {
        if (user.role === 'ADMIN') {
            return <Navigate to="/admin/dashboard" replace />;
        } else {
            return <Navigate to="/dashboard" replace />;
        }
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