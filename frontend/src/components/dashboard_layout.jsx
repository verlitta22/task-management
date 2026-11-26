import React from 'react';
import { LayoutDashboard, CheckSquare, Users, ShieldAlert, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImage from '../assets/logo.png';

export default function DashboardLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const userRole = (user.role || '').toUpperCase();
    const isAdmin = userRole === 'ADMIN';

    return (
        <div className="min-h-screen bg-gradient-to-tr from-[#d9e7ff] via-[#eef2f7] to-[#d4f8e8] font-sans antialiased flex h-screen overflow-hidden text-gray-800 relative">
            {/* Efek Cahaya Aurora Latar Belakang (Tetap seperti Gambar Pertama) */}
            <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-300/30 rounded-full blur-3xl pointer-events-none"></div>

            {/* Side Navigation Bar (Ramping dengan Efek Hover Expand seperti Gambar Kedua) */}
            <aside 
                className="relative z-20 w-20 hover:w-64 transition-all duration-300 ease-in-out bg-[#141414]/95 backdrop-blur-xl text-gray-300 flex flex-col justify-between p-4 shadow-2xl border-r border-white/10 shrink-0 group overflow-hidden"
            >
                <div>
                    {/* Tombol Kontrol Jendela (Windows-like Dots) */}
                    <div className="flex items-center space-x-1.5 mb-8 px-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/80 cursor-pointer"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80 cursor-pointer"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80 cursor-pointer"></div>
                    </div>

                    {/* Logo & Judul Aplikasi */}
                    <div className="flex items-center space-x-3 mb-8 px-1">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 overflow-hidden bg-white shrink-0 border border-white/10">
                            <img src={logoImage} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
                            <h1 className="text-sm font-black tracking-tight text-white leading-none">
                                TaskFlow
                            </h1>
                            <span className="text-[10px] text-gray-400 font-medium">Workspace</span>
                        </div>
                    </div>

                    <p className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] uppercase tracking-widest text-gray-500 mb-3 px-3 font-bold whitespace-nowrap">
                        Menu Navigasi
                    </p>
                    
                    {/* Menu Navigasi */}
                    <nav className="space-y-1.5 text-xs">
                        {!isAdmin ? (
                            <>
                                <SidebarItem 
                                    icon={<LayoutDashboard size={20} />} 
                                    label="Dashboard" 
                                    active={location.pathname === '/dashboard'} 
                                    onClick={() => navigate('/dashboard')} 
                                />
                                <SidebarItem 
                                    icon={<CheckSquare size={20} />} 
                                    label="My Tasks" 
                                    active={location.pathname === '/tasks'} 
                                    onClick={() => navigate('/tasks')} 
                                />
                            </>
                        ) : (
                            <>
                                <SidebarItem 
                                    icon={<LayoutDashboard size={20} />} 
                                    label="System Overview" 
                                    active={location.pathname === '/admin/dashboard'} 
                                    onClick={() => navigate('/admin/dashboard')} 
                                />
                                <SidebarItem 
                                    icon={<Users size={20} />} 
                                    label="Kelola Pengguna" 
                                    active={location.pathname === '/admin/users'} 
                                    onClick={() => navigate('/admin/users')} 
                                />
                                <SidebarItem 
                                    icon={<ShieldAlert size={20} />} 
                                    label="Task Monitoring" 
                                    active={location.pathname === '/admin/tasks'} 
                                    onClick={() => navigate('/admin/tasks')} 
                                />
                            </>
                        )}
                    </nav>
                </div>

                {/* Bagian Bawah: Profil Pengguna & Keluar Sesi */}
                <div className="border-t border-gray-800/80 pt-4 space-y-2">
                    <div className="flex items-center space-x-3 p-2 rounded-2xl bg-white/5 border border-white/5 overflow-hidden">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                            {(user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden whitespace-nowrap flex-1">
                            <p className="text-xs font-bold text-white truncate">{user.name || 'User'}</p>
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{user.role || 'GUEST'}</p>
                        </div>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-gray-500 shrink-0" />
                    </div>

                    <button 
                        onClick={handleLogout} 
                        className="w-full flex items-center space-x-3 py-3 px-3 rounded-2xl text-red-400 hover:bg-red-500/15 transition text-xs font-bold whitespace-nowrap overflow-hidden"
                        title="Keluar Sesi"
                    >
                        <LogOut size={20} className="shrink-0" />
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Log out</span>
                    </button>
                </div>
            </aside>

            {/* Konten Utama Kanan */}
            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

function SidebarItem({ icon, label, active, onClick }) {
    return (
        <button 
            onClick={onClick} 
            className={`w-full flex items-center space-x-4 py-3 px-3 rounded-2xl transition font-bold whitespace-nowrap overflow-hidden ${
                active 
                ? 'bg-white text-black shadow-lg shadow-white/10' 
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
            title={label}
        >
            <span className="shrink-0">{icon}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs">{label}</span>
        </button>
    );
}