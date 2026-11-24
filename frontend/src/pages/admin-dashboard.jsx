import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { Users, Shield, CheckSquare, Clock, LogOut, Search, Download, Trash2, ArrowUpRight, Activity } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ total_users: 0, active_users: 0, inactive_users: 0, admin_count: 0, total_tasks: 0, status_summary: { TODO: 0, IN_PROGRESS: 0, DONE: 0 } });
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('users');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const [taskPage, setTaskPage] = useState(1);
    const [taskTotalPages, setTaskTotalPages] = useState(1);
    const [taskSearch, setTaskSearch] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            navigate('/login?message=unauthorized');
            return;
        }
        try {
            const user = JSON.parse(userStr);
            const userRole = (user.role || '').toUpperCase();
            if (userRole !== 'ADMIN') {
                navigate('/login?message=unauthorized');
            }
        } catch (e) {
            navigate('/login?message=unauthorized');
        }
    }, [navigate]);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const dashboardRes = await apiRequest('/admin/dashboard');
            const usersRes = await apiRequest('/admin/users');
            
            setStats(dashboardRes.stats || stats);
            setUsers(usersRes.data || []);
        } catch (err) {
            toast.error(err.message || 'Gagal memuat data admin');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminTasks = async (page = 1, search = '') => {
        try {
            setLoading(true);
            const tasksRes = await apiRequest(`/admin/tasks?page=${page}&limit=5&search=${search}`);
            setTasks(tasksRes.data || []);
            setTaskTotalPages(tasksRes.total_pages || 1);
            setTaskPage(tasksRes.page || 1);
        } catch (err) {
            toast.error(err.message || 'Gagal memuat monitoring task');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    useEffect(() => {
        if (activeTab === 'tasks') {
            fetchAdminTasks(taskPage, taskSearch);
        }
    }, [activeTab, taskPage, taskSearch]);

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            await apiRequest(`/admin/users/${userId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: !currentStatus })
            });
            toast.success('Status akun berhasil diubah');
            fetchAdminData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleToggleRole = async (userId, currentRole) => {
        const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
        if (!window.confirm(`Ubah role user ini menjadi ${newRole}?`)) return;

        try {
            await apiRequest(`/admin/users/${userId}/role`, {
                method: 'PATCH',
                body: JSON.stringify({ role: newRole })
            });
            toast.success('Role user berhasil diubah');
            fetchAdminData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleAdminDeleteTask = async (taskId) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus task user ini?')) return;
        try {
            await apiRequest(`/admin/tasks/${taskId}`, {
                method: 'DELETE',
            });
            toast.success('Task berhasil dihapus oleh admin');
            fetchAdminTasks(taskPage, taskSearch);
        } catch (err) {
            toast.error(err.message || 'Gagal menghapus task');
        }
    };

    const handleExportCSV = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/v1/admin/tasks/export', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Gagal mengunduh laporan CSV');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'laporan_tasks_admin.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Laporan CSV berhasil diunduh');
        } catch (err) {
            toast.error(err.message || 'Gagal mengunduh laporan CSV');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="min-h-screen bg-gradient-to-tr from-[#d9e7ff] via-[#eef2f7] to-[#d4f8e8] p-8 font-sans antialiased text-gray-800 selection:bg-black selection:text-white relative overflow-hidden">
            <Toaster position="top-right" />

            {/* Efek Lingkaran Gradasi Latar Belakang (Aesthetic Glow) */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-300/30 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Navigation Bar / Header dengan efek Glassmorphism */}
            <header className="relative z-10 flex justify-between items-center bg-white/70 backdrop-blur-xl px-8 py-5 rounded-3xl shadow-sm mb-8 border border-white/60">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/30">
                        TF
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Admin Portal</h1>
                        <p className="text-xs text-gray-500 font-medium">Task Management System Control Center</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="hidden md:flex items-center space-x-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-bold text-gray-700 border border-white">
                        <Activity size={14} className="text-emerald-500 animate-pulse" />
                        <span>System Optimal</span>
                    </div>
                    <button 
                        onClick={handleLogout} 
                        className="flex items-center space-x-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-2xl font-bold text-xs transition shadow-sm border border-red-200/50"
                    >
                        <LogOut size={15} />
                        <span>Keluar</span>
                    </button>
                </div>
            </header>

            {/* Page Heading & Main Actions */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">System Overview</h2>
                    <p className="text-sm text-gray-600 mt-0.5">Kelola pengguna dan pantau aktivitas seluruh tugas secara real-time.</p>
                </div>
                <div className="flex space-x-3 bg-white/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-sm">
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs transition ${activeTab === 'users' ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-white/60'}`}
                    >
                        Kelola Pengguna
                    </button>
                    <button 
                        onClick={() => setActiveTab('tasks')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs transition ${activeTab === 'tasks' ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-white/60'}`}
                    >
                        Monitoring Task
                    </button>
                </div>
            </div>

            {/* Global Stats Bento Grid (Glassmorphism Cards) */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/80 hover:shadow-md transition group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3.5 bg-blue-500/10 text-blue-600 rounded-2xl"><Users size={20} /></div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                            Live <ArrowUpRight size={12} />
                        </span>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total User</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.total_users}</h3>
                    <p className="text-xs text-gray-500 mt-2 font-medium">{stats.active_users} Aktif / {stats.inactive_users} Nonaktif</p>
                </div>

                <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/80 hover:shadow-md transition group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3.5 bg-purple-500/10 text-purple-600 rounded-2xl"><Shield size={20} /></div>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Jumlah Admin</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.admin_count}</h3>
                    <p className="text-xs text-purple-600 mt-2 font-semibold">Hak akses penuh</p>
                </div>

                <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/80 hover:shadow-md transition group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3.5 bg-amber-500/10 text-amber-600 rounded-2xl"><CheckSquare size={20} /></div>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Task Sistem</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.total_tasks}</h3>
                    <p className="text-xs text-amber-600 mt-2 font-semibold">Semua modul task</p>
                </div>

                <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/80 hover:shadow-md transition group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3.5 bg-emerald-500/10 text-emerald-600 rounded-2xl"><Clock size={20} /></div>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Selesai (Done)</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.status_summary.DONE}</h3>
                    <p className="text-xs text-gray-500 mt-2 font-medium">Task terselesaikan</p>
                </div>
            </div>

            {/* Content Section: Main Glassmorphism Panel */}
            <div className="relative z-10 bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/90">
                {activeTab === 'users' ? (
                    <div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Manajemen Pengguna</h3>
                                <p className="text-xs text-gray-500">Kontrol penuh status akun dan level role pengguna.</p>
                            </div>
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-4 top-3.5 text-gray-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Cari nama atau email..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-md rounded-2xl text-xs font-medium border border-gray-200/80 focus:border-black outline-none transition shadow-inner"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-16 text-center text-sm text-gray-400 font-medium">Memuat data pengguna...</div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="py-16 text-center text-sm text-gray-400 font-medium">Tidak ada pengguna ditemukan.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200/60 text-[11px] text-gray-400 uppercase tracking-wider">
                                            <th className="pb-4 font-bold">Nama User</th>
                                            <th className="pb-4 font-bold">Email</th>
                                            <th className="pb-4 font-bold">Role</th>
                                            <th className="pb-4 font-bold">Status Akun</th>
                                            <th className="pb-4 font-bold text-right">Aksi Kontrol</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-xs">
                                        {filteredUsers.map((u) => (
                                            <tr key={u.id} className="hover:bg-white/60 transition">
                                                <td className="py-4 font-extrabold text-gray-900">{u.name}</td>
                                                <td className="py-4 text-gray-500 font-medium">{u.email}</td>
                                                <td className="py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'bg-blue-100 text-blue-700 shadow-sm'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide ${u.is_active ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'bg-red-100 text-red-700 shadow-sm'}`}>
                                                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right space-x-2">
                                                    <button 
                                                        onClick={() => handleToggleRole(u.id, u.role)}
                                                        className="px-3.5 py-1.5 bg-white hover:bg-black hover:text-white text-gray-700 rounded-xl font-bold transition shadow-sm border border-gray-200"
                                                    >
                                                        Ubah Role
                                                    </button>
                                                    <button 
                                                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                                                        className={`px-3.5 py-1.5 rounded-xl font-bold transition shadow-sm ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'}`}
                                                    >
                                                        {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Task Monitoring & Moderasi</h3>
                                <p className="text-xs text-gray-500">Tinjau seluruh tugas pengguna dan lakukan moderasi jika diperlukan.</p>
                            </div>
                            <div className="flex items-center space-x-3 w-full md:w-auto">
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-4 top-3.5 text-gray-400" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Cari task atau nama user..." 
                                        value={taskSearch}
                                        onChange={(e) => {
                                            setTaskSearch(e.target.value);
                                            setTaskPage(1);
                                        }}
                                        className="w-full pl-11 pr-4 py-3 bg-white/75 backdrop-blur-md rounded-2xl text-xs font-medium border border-gray-200/80 focus:border-black outline-none transition shadow-inner"
                                    />
                                </div>
                                <button 
                                    onClick={handleExportCSV}
                                    className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-2xl font-bold text-xs hover:shadow-lg transition shadow-md whitespace-nowrap"
                                >
                                    <Download size={15} />
                                    <span>Unduh CSV</span>
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-16 text-center text-sm text-gray-400 font-medium">Memuat monitoring task...</div>
                        ) : tasks.length === 0 ? (
                            <div className="py-16 text-center text-sm text-gray-400 font-medium">Belum ada task di dalam sistem.</div>
                        ) : (
                            <div>
                                <div className="space-y-3 mb-6">
                                    {tasks.map((t) => (
                                        <div key={t.id} className="flex items-center justify-between p-4 bg-white/60 hover:bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100 transition shadow-xs">
                                            <div className="pr-4">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h4 className="font-extrabold text-gray-900 text-sm">{t.title}</h4>
                                                    <span className="text-[10px] bg-gray-200/70 text-gray-700 px-2.5 py-0.5 rounded-lg font-bold">Oleh: {t.user_name}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium line-clamp-1">{t.description || 'Tidak ada deskripsi'}</p>
                                            </div>
                                            <div className="flex items-center space-x-3 shrink-0">
                                                <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide ${
                                                    t.status === 'DONE' ? 'bg-emerald-100 text-emerald-700 shadow-sm' :
                                                    t.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'bg-amber-100 text-amber-700 shadow-sm'
                                                }`}>
                                                    {t.status}
                                                </span>
                                                <button 
                                                    onClick={() => handleAdminDeleteTask(t.id)}
                                                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition shadow-xs border border-red-200/50"
                                                    title="Hapus Task (Moderasi Admin)"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                <div className="flex justify-between items-center pt-4 border-t border-gray-200/60">
                                    <p className="text-xs text-gray-500 font-semibold">Halaman {taskPage} dari {taskTotalPages}</p>
                                    <div className="flex space-x-2">
                                        <button 
                                            disabled={taskPage <= 1}
                                            onClick={() => setTaskPage(prev => Math.max(prev - 1, 1))}
                                            className="px-4 py-2 bg-white text-gray-700 rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-gray-100 transition border border-gray-200"
                                        >
                                            Sebelumnya
                                        </button>
                                        <button 
                                            disabled={taskPage >= taskTotalPages}
                                            onClick={() => setTaskPage(prev => prev + 1)}
                                            className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-gray-800 transition shadow-sm"
                                        >
                                            Selanjutnya
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}