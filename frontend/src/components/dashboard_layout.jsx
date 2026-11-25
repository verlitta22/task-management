import React from 'react';
import { LayoutDashboard, CheckSquare, Users, ShieldAlert, LogOut, Activity } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

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
            {/* Efek Cahaya Aurora Latar Belakang */}
            <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-300/30 rounded-full blur-3xl pointer-events-none"></div>

            {/* Sidebar Kiri Hitam Elegan */}
            <aside className="relative z-20 w-64 bg-[#141414]/95 backdrop-blur-xl text-gray-300 flex flex-col justify-between p-6 shadow-2xl border-r border-white/10 shrink-0">
                <div>
                    <div className="flex items-center space-x-3 mb-10 px-2">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/30">
                            TF
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight text-white leading-none">
                                TaskFlow <span className="text-[10px] text-emerald-400 font-bold"></span>
                            </h1>
                            <span className="text-[10px] text-gray-500 font-medium">Workspace</span>
                        </div>
                    </div>

                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 px-4 font-bold">Menu Navigasi</p>
                    
                    <nav className="space-y-1.5 text-xs">
                        {!isAdmin ? (
                            <>
                                <SidebarItem 
                                    icon={<LayoutDashboard size={17} />} 
                                    label="Dashboard" 
                                    active={location.pathname === '/dashboard'} 
                                    onClick={() => navigate('/dashboard')} 
                                />
                                <SidebarItem 
                                    icon={<CheckSquare size={17} />} 
                                    label="My Tasks" 
                                    active={location.pathname === '/tasks'} 
                                    onClick={() => navigate('/tasks')} 
                                />
                            </>
                        ) : (
                            <>
                                <SidebarItem 
                                    icon={<LayoutDashboard size={17} />} 
                                    label="System Overview" 
                                    active={location.pathname === '/admin/dashboard'} 
                                    onClick={() => navigate('/admin/dashboard')} 
                                />
                                <SidebarItem 
                                    icon={<Users size={17} />} 
                                    label="Kelola Pengguna" 
                                    active={location.pathname === '/admin/users'} 
                                    onClick={() => navigate('/admin/users')} 
                                />
                                <SidebarItem 
                                    icon={<ShieldAlert size={17} />} 
                                    label="Task Monitoring" 
                                    active={location.pathname === '/admin/tasks'} 
                                    onClick={() => navigate('/admin/tasks')} 
                                />
                            </>
                        )}
                    </nav>
                </div>

                <div className="border-t border-gray-800/80 pt-4">
                    <div className="px-4 mb-4 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {(user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{user.name || 'User'}</p>
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{user.role || 'GUEST'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout} 
                        className="w-full flex items-center space-x-3 py-2.5 px-4 rounded-2xl text-red-400 hover:bg-red-500/15 transition text-xs font-bold"
                    >
                        <LogOut size={16} />
                        <span>Keluar Sesi</span>
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
            className={`w-full flex items-center space-x-3 py-3 px-4 rounded-2xl transition font-bold ${
                active 
                ? 'bg-white text-black shadow-lg shadow-white/10' 
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}