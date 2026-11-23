import React from 'react';
import { LayoutDashboard, CheckSquare, Users, ShieldAlert, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function DashboardLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const isAdmin = user.role === 'ADMIN';

    return (
        <div className="bg-[#F7F5F0] font-sans antialiased flex h-screen overflow-hidden text-gray-800">
            {/* Sidebar Kiri Hitam Elegan */}
            <aside className="w-64 bg-[#141414] text-gray-300 flex flex-col justify-between p-6 shadow-xl">
                <div>
                    <div className="flex items-center space-x-2 mb-10">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-extrabold text-sm">
                            T
                        </div>
                        <h1 className="text-xl font-bold tracking-wider text-white">TaskFlow <span className="text-xs text-purple-400">v2</span></h1>
                    </div>

                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-3 px-4 font-semibold">Navigasi</p>
                    
                    <nav className="space-y-2 text-sm">
                        {!isAdmin ? (
                            <>
                                <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={location.pathname === '/dashboard'} onClick={() => navigate('/dashboard')} />
                                <SidebarItem icon={<CheckSquare size={18} />} label="My Tasks" active={location.pathname === '/tasks'} onClick={() => navigate('/tasks')} />
                            </>
                        ) : (
                            <>
                                <SidebarItem icon={<LayoutDashboard size={18} />} label="Global Dashboard" active={location.pathname === '/admin/dashboard'} onClick={() => navigate('/admin/dashboard')} />
                                <SidebarItem icon={<Users size={18} />} label="Manage Users" active={location.pathname === '/admin/users'} onClick={() => navigate('/admin/users')} />
                                <SidebarItem icon={<ShieldAlert size={18} />} label="Task Monitoring" active={location.pathname === '/admin/tasks'} onClick={() => navigate('/admin/tasks')} />
                            </>
                        )}
                    </nav>
                </div>

                <div className="border-t border-gray-800 pt-4">
                    <div className="px-4 mb-3">
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 uppercase">{user.role}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center space-x-3 py-2.5 px-4 rounded-xl text-red-400 hover:bg-red-500/10 transition text-sm font-medium">
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Konten Utama Kanan */}
            <main className="flex-1 p-10 overflow-y-auto">
                <div className="max-w-7xl mx-auto">{children}</div>
            </main>
        </div>
    );
}

function SidebarItem({ icon, label, active, onClick }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center space-x-3 py-3 px-4 rounded-2xl transition font-medium ${active ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
            {icon}
            <span>{label}</span>
        </button>
    );
}