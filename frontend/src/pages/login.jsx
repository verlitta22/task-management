import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { LogIn, Lock, Mail, Activity } from 'lucide-react';
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
        <div className="min-h-screen bg-gradient-to-tr from-[#d9e7ff] via-[#eef2f7] to-[#d4f8e8] flex items-center justify-center p-6 font-sans antialiased text-gray-800 relative overflow-hidden">
            <Toaster position="top-right" />

            {/* Efek Lingkaran Gradasi Latar Belakang (Aesthetic Glow) */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-300/30 rounded-full blur-3xl pointer-events-none"></div>

            {/* Kartu Login dengan Efek Glassmorphism */}
            <div className="relative z-10 max-w-md w-full bg-white/80 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/90">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-xl mb-4 shadow-lg shadow-blue-500/30">
                        TF
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Task Management</h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Masuk ke akun personal atau admin Anda</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Email Address</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400"><Mail size={18} /></span>
                            <input 
                                type="email" 
                                required 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder="nama@email.com" 
                                className="w-full pl-11 pr-4 py-3 bg-white/70 border border-gray-200/80 rounded-2xl focus:bg-white focus:border-black focus:outline-none transition text-xs font-medium shadow-inner" 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Password</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400"><Lock size={18} /></span>
                            <input 
                                type="password" 
                                required 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder="••••••••" 
                                className="w-full pl-11 pr-4 py-3 bg-white/70 border border-gray-200/80 rounded-2xl focus:bg-white focus:border-black focus:outline-none transition text-xs font-medium shadow-inner" 
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full py-3.5 bg-gradient-to-r from-gray-900 to-black text-white rounded-2xl font-bold hover:shadow-lg transition shadow-md flex items-center justify-center space-x-2 text-xs mt-4 disabled:opacity-50"
                    >
                        <LogIn size={16} />
                        <span>{loading ? 'Memproses...' : 'Masuk Sekarang'}</span>
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-xs text-gray-500 font-medium">
                        Belum punya akun?{' '}
                        <Link to="/register" className="text-black font-extrabold hover:underline">
                            Daftar di sini
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}