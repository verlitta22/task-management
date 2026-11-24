import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { Users, Shield, CheckSquare, Clock, LogOut, Search, Download, Trash2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ total_users: 0, active_users: 0, inactive_users: 0, admin_count: 0, total_tasks: 0, status_summary: { TODO: 0, IN_PROGRESS: 0, DONE: 0 } });
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('users'); // 'users' atau 'tasks'
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // State tambahan untuk Pagination & Search Task di Admin
    const [taskPage, setTaskPage] = useState(1);
    const [taskTotalPages, setTaskTotalPages] = useState(1);
    const [taskSearch, setTaskSearch] = useState('');

    const navigate = useNavigate();

    // Route Guard: Cegah non-admin mengakses Dashboard Admin secara case-insensitive
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
        if (!window.confirm('Apakah Anda yakin ingin menghapus task user ini karena melanggar aturan?')) return;
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
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Gagal mengunduh laporan CSV');
            }

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
        <div className="min-h-screen bg-[#F7F5F0] p-6 font-sans">
            <Toaster position="top-right" />

            {/* Header */}
            <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm mb-6 border border-gray-100">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Dashboard Administrator</h1>
                    <p className="text-sm text-gray-500">Pusat kendali dan monitoring sistem Task Management v2.</p>
                </div>
                <button onClick={handleLogout} className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-100 transition">
                    <LogOut size={16} />
                    <span>Keluar</span>
                </button>
            </header>

            {/* Global Stats Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Users size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Total User</p>
                        <h3 className="text-2xl font-extrabold text-gray-900">{stats.total_users}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{stats.active_users} Aktif / {stats.inactive_users} Nonaktif</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><Shield size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Jumlah Admin</p>
                        <h3 className="text-2xl font-extrabold text-gray-900">{stats.admin_count}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-yellow-50 text-yellow-600 rounded-2xl"><CheckSquare size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Total Task Sistem</p>
                        <h3 className="text-2xl font-extrabold text-gray-900">{stats.total_tasks}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-green-50 text-green-600 rounded-2xl"><Clock size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Selesai (Done)</p>
                        <h3 className="text-2xl font-extrabold text-gray-900">{stats.status_summary.DONE}</h3>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-4 mb-6">
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-3 rounded-2xl font-bold text-sm transition shadow-sm ${activeTab === 'users' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                    Kelola Pengguna
                </button>
                <button 
                    onClick={() => setActiveTab('tasks')}
                    className={`px-6 py-3 rounded-2xl font-bold text-sm transition shadow-sm ${activeTab === 'tasks' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                    Monitoring Semua Task
                </button>
            </div>

            {/* Content Section */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                {activeTab === 'users' ? (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-extrabold text-gray-900">Daftar Pengguna Terdaftar</h3>
                            <div className="relative w-72">
                                <Search className="absolute left-4 top-3 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Cari nama atau email..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-[#F7F5F0] rounded-2xl text-sm border-none focus:ring-2 focus:ring-black outline-none"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <p className="text-sm text-gray-400 text-center py-8">Memuat data pengguna...</p>
                        ) : filteredUsers.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Tidak ada pengguna ditemukan.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                                            <th className="pb-4 font-bold">Nama</th>
                                            <th className="pb-4 font-bold">Email</th>
                                            <th className="pb-4 font-bold">Role</th>
                                            <th className="pb-4 font-bold">Status</th>
                                            <th className="pb-4 font-bold text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-sm">
                                        {filteredUsers.map((u) => (
                                            <tr key={u.id} className="hover:bg-[#F7F5F0]/50 transition">
                                                <td className="py-4 font-bold text-gray-900">{u.name}</td>
                                                <td className="py-4 text-gray-500">{u.email}</td>
                                                <td className="py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right space-x-2">
                                                    <button 
                                                        onClick={() => handleToggleRole(u.id, u.role)}
                                                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                                                    >
                                                        Ubah Role
                                                    </button>
                                                    <button 
                                                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
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
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                            <h3 className="text-lg font-extrabold text-gray-900">Monitoring Seluruh Task (Read-Only)</h3>
                            <div className="flex items-center space-x-3 w-full md:w-auto">
                                <div className="relative w-72">
                                    <Search className="absolute left-4 top-3 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Cari task atau nama user..." 
                                        value={taskSearch}
                                        onChange={(e) => {
                                            setTaskSearch(e.target.value);
                                            setTaskPage(1);
                                        }}
                                        className="w-full pl-11 pr-4 py-2.5 bg-[#F7F5F0] rounded-2xl text-sm border-none focus:ring-2 focus:ring-black outline-none"
                                    />
                                </div>
                                <button 
                                    onClick={handleExportCSV}
                                    className="flex items-center space-x-2 px-4 py-2.5 bg-black text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition shadow-md"
                                >
                                    <Download size={16} />
                                    <span>Unduh CSV</span>
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <p className="text-sm text-gray-400 text-center py-8">Memuat monitoring task...</p>
                        ) : tasks.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Belum ada task di dalam sistem.</p>
                        ) : (
                            <div>
                                <div className="space-y-4 mb-6">
                                    {tasks.map((t) => (
                                        <div key={t.id} className="flex items-center justify-between p-4 bg-[#F7F5F0] rounded-2xl border border-transparent">
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h4 className="font-bold text-gray-900 text-sm">{t.title}</h4>
                                                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md font-medium">Oleh: {t.user_name}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{t.description || 'Tidak ada deskripsi'}</p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    t.status === 'DONE' ? 'bg-green-100 text-green-700' :
                                                    t.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {t.status}
                                                </span>
                                                <button 
                                                    onClick={() => handleAdminDeleteTask(t.id)}
                                                    className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition"
                                                    title="Hapus Task (Moderasi Admin)"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 font-medium">Halaman {taskPage} dari {taskTotalPages}</p>
                                    <div className="flex space-x-2">
                                        <button 
                                            disabled={taskPage <= 1}
                                            onClick={() => setTaskPage(prev => Math.max(prev - 1, 1))}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-gray-200 transition"
                                        >
                                            Sebelumnya
                                        </button>
                                        <button 
                                            disabled={taskPage >= taskTotalPages}
                                            onClick={() => setTaskPage(prev => prev + 1)}
                                            className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-gray-800 transition"
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