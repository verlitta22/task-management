import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { UserPlus, Lock, Mail, User } from 'lucide-react';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('USER'); // Default role: USER
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Sesuaikan endpoint register dengan backend Golang Anda (misal: /auth/register atau /users)
            await apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password, role }),
            });

            alert('Registrasi berhasil! Silakan login.');
            navigate('/login');
        } catch (err) {
            setError(err.message || 'Gagal melakukan registrasi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-black text-white rounded-2xl mx-auto flex items-center justify-center font-extrabold text-xl mb-4 shadow-md">
                        T
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900">Buat Akun Baru</h2>
                    <p className="text-sm text-gray-500 mt-1">Daftar untuk mulai mengelola task Anda</p>
                </div>

                {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium">{error}</div>}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Nama Lengkap</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400"><User size={18} /></span>
                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" className="w-full pl-11 pr-4 py-3 bg-[#F7F5F0] border border-transparent rounded-2xl focus:bg-white focus:border-gray-900 focus:outline-none transition text-sm" />
                        </div>
                    </div>

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

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Role Akun</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-3 bg-[#F7F5F0] border border-transparent rounded-2xl focus:bg-white focus:border-gray-900 focus:outline-none transition text-sm text-gray-700 font-medium">
                            <option value="USER">USER (Pengguna Biasa)</option>
                            <option value="ADMIN">ADMIN (Pengelola Sistem)</option>
                        </select>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-3.5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition shadow-md flex items-center justify-center space-x-2 text-sm mt-2">
                        <UserPlus size={18} />
                        <span>{loading ? 'Memproses...' : 'Daftar Sekarang'}</span>
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-500">
                        Sudah punya akun?{' '}
                        <Link to="/login" className="text-black font-bold hover:underline">
                            Masuk di sini
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}