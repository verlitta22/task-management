import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { LogIn, Lock, Mail, CheckCircle2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import logoImage from '../assets/logo.png'; // <-- Impor logo dari folder src/assets

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

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

            {/* Efek Lingkaran Gradasi Latar Belakang */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-300/30 rounded-full blur-3xl pointer-events-none"></div>

            {/* Main Split-Screen Container Card */}
            <div className="relative z-10 max-w-5xl w-full bg-white/70 backdrop-blur-2xl rounded-[32px] p-8 md:p-14 shadow-2xl border border-white/90 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                
                {/* Left Side: Branding & Info */}
                <div className="space-y-6">
                    {/* Logo Gambar yang Diimpor dari src/assets */}
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 overflow-hidden bg-white">
                        <img src={logoImage} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                        Simple, <br />
                        Secure &amp; <br />
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-900 bg-clip-text text-transparent">
                            Reliable.
                        </span>
                    </h1>
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed font-medium">
                        Keep Connected with Productive Workflow. Kelola task, pantau kategori, dan selesaikan pekerjaan dengan terstruktur.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-3">
                        <div className="px-4 py-2 bg-white/80 border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-700 shadow-sm flex items-center space-x-2">
                            <CheckCircle2 size={15} className="text-blue-600" />
                            <span>Role-Based Security</span>
                        </div>
                        <div className="px-4 py-2 bg-white/80 border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-700 shadow-sm flex items-center space-x-2">
                            <CheckCircle2 size={15} className="text-emerald-600" />
                            <span>High Performance API</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form Card */}
                <div className="bg-white/85 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white">
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Masuk Akun</h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">Masukkan kredensial Anda untuk melanjutkan</p>
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
                            <span>{loading ? 'Memproses...' : 'LOGIN'}</span>
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-xs text-gray-500 font-medium">
                            Belum punya akun?{' '}
                            <Link to="/register" className="text-black font-extrabold hover:underline">
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}