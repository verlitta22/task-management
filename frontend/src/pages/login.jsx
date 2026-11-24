import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { LogIn, Lock, Mail } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Menangkap pesan error dari URL (misal: akses ditolak karena salah role)
    useEffect(() => {
        const message = searchParams.get('message') || searchParams.get('error');
        if (message) {
            if (message === 'unauthorized') {
                toast.error('Akses ditolak: Anda tidak memiliki izin untuk mengakses halaman tersebut.');
            } else {
                toast.error(decodeURIComponent(message));
            }
        }
    }, [searchParams]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            toast.success('Login berhasil!');

            if (data.user.role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            toast.error(err.message || 'Email atau password salah');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6 font-sans">
            <Toaster position="top-right" />
            <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-black text-white rounded-2xl mx-auto flex items-center justify-center font-extrabold text-xl mb-4 shadow-md">
                        T
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900">Task Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Masuk ke akun personal atau admin Anda</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Email Address</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400"><Mail size={18} /></span>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" className="w-full pl-11 pr-4 py-3 bg-[#F7F5F0] border border-transparent rounded-2xl focus:bg-white focus:border-gray-900 focus:outline-none transition text-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Password</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400"><Lock size={18} /></span>
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-11 pr-4 py-3 bg-[#F7F5F0] border border-transparent rounded-2xl focus:bg-white focus:border-gray-900 focus:outline-none transition text-sm" />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-3.5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition shadow-md flex items-center justify-center space-x-2 text-sm mt-4">
                        <LogIn size={18} />
                        <span>{loading ? 'Memproses...' : 'Masuk Sekarang'}</span>
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-500">
                        Belum punya akun?{' '}
                        <Link to="/register" className="text-black font-bold hover:underline">
                            Daftar di sini
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}