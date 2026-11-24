import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { LayoutDashboard, CheckSquare, Clock, AlertCircle, Plus, LogOut, Calendar, Edit, Trash2, ArrowUpRight, Activity } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import toast, { Toaster } from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function UserDashboard() {
    const [stats, setStats] = useState({ total: 0, todo: 0, in_progress: 0, done: 0 });
    const [tasks, setTasks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State untuk Modal & Form Tambah / Edit Task
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentTaskId, setCurrentTaskId] = useState(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [status, setStatus] = useState('TODO');
    const [categoryId, setCategoryId] = useState('');
    const [dueDate, setDueDate] = useState('');

    // State untuk Filter
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterCategory, setFilterCategory] = useState('ALL');

    const navigate = useNavigate();

    // Route Guard: Cegah ADMIN mengakses Dashboard User
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role === 'ADMIN') {
                    navigate('/login?message=unauthorized');
                    return;
                }
            } catch (e) {
                // Abaikan jika parsing gagal
            }
        }
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const dashboardRes = await apiRequest('/dashboard');
            const tasksRes = await apiRequest('/tasks');
            const categoriesRes = await apiRequest('/categories');
            
            const summary = dashboardRes.status_summary || {};
            setStats({
                total: dashboardRes.total_tasks || 0,
                todo: summary.TODO || 0,
                in_progress: summary.IN_PROGRESS || 0,
                done: summary.DONE || 0
            });

            const taskList = tasksRes.data || tasksRes.tasks || tasksRes;
            setTasks(Array.isArray(taskList) ? taskList : []);

            const catList = categoriesRes.data || categoriesRes.categories || categoriesRes;
            setCategories(Array.isArray(catList) ? catList : []);
        } catch (err) {
            toast.error(err.message || 'Gagal memuat data dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleOpenCreateModal = () => {
        setIsEditMode(false);
        setCurrentTaskId(null);
        setTitle('');
        setDescription('');
        setPriority('MEDIUM');
        setStatus('TODO');
        setCategoryId('');
        setDueDate('');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (task) => {
        setIsEditMode(true);
        setCurrentTaskId(task.id);
        setTitle(task.title || '');
        setDescription(task.description || '');
        setPriority(task.priority || 'MEDIUM');
        setStatus(task.status || 'TODO');
        setCategoryId(task.category_id ? String(task.category_id) : '');
        setDueDate(task.due_date ? task.due_date.substring(0, 10) : '');
        setIsModalOpen(true);
    };

    const handleSaveTask = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title,
                description,
                priority,
                status,
                category_id: categoryId ? parseInt(categoryId, 10) : null,
                due_date: dueDate ? dueDate : null,
            };

            if (isEditMode) {
                await apiRequest(`/tasks/${currentTaskId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                toast.success('Task berhasil diperbarui!');
            } else {
                await apiRequest('/tasks', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                toast.success('Task baru berhasil ditambahkan!');
            }

            setIsModalOpen(false);
            fetchDashboardData();
        } catch (err) {
            toast.error(err.message || 'Gagal menyimpan task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus task ini?')) return;
        try {
            await apiRequest(`/tasks/${taskId}`, {
                method: 'DELETE',
            });
            toast.success('Task berhasil dihapus');
            fetchDashboardData();
        } catch (err) {
            toast.error(err.message || 'Gagal menghapus task');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Data untuk Chart / Grafik Lingkaran
    const chartData = {
        labels: ['Todo', 'In Progress', 'Done'],
        datasets: [
            {
                data: [stats.todo, stats.in_progress, stats.done],
                backgroundColor: ['#FBBF24', '#C084FC', '#34D399'],
                borderWidth: 0,
            },
        ],
    };

    // Filtered Tasks
    const filteredTasks = tasks.filter(task => {
        const matchStatus = filterStatus === 'ALL' || task.status === filterStatus;
        const matchCategory = filterCategory === 'ALL' || String(task.category_id) === String(filterCategory);
        return matchStatus && matchCategory;
    });

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
                        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">User Portal</h1>
                        <p className="text-xs text-gray-500 font-medium">Task Management System</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="hidden md:flex items-center space-x-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-bold text-gray-700 border border-white">
                        <Activity size={14} className="text-emerald-500 animate-pulse" />
                        <span>Productivity Space</span>
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

            {/* Page Heading */}
            <div className="relative z-10 mb-8">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Pengguna</h2>
                <p className="text-sm text-gray-600 mt-0.5">Kelola tugas harian, target, dan progres pencapaian Anda dengan mudah.</p>
            </div>

            {/* Stats Bento Grid & Chart Section */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Card 1 */}
                    <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/80 hover:shadow-md transition group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3.5 bg-blue-500/10 text-blue-600 rounded-2xl"><LayoutDashboard size={20} /></div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                                Active <ArrowUpRight size={12} />
                            </span>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Task</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.total}</h3>
                        <p className="text-xs text-gray-500 mt-2 font-medium">Keseluruhan tugas Anda</p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/80 hover:shadow-md transition group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3.5 bg-amber-500/10 text-amber-600 rounded-2xl"><Clock size={20} /></div>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Todo</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.todo}</h3>
                        <p className="text-xs text-amber-600 mt-2 font-semibold">Menunggu dikerjakan</p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/80 hover:shadow-md transition group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3.5 bg-purple-500/10 text-purple-600 rounded-2xl"><AlertCircle size={20} /></div>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">In Progress</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.in_progress}</h3>
                        <p className="text-xs text-purple-600 mt-2 font-semibold">Sedang berjalan</p>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/80 hover:shadow-md transition group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3.5 bg-emerald-500/10 text-emerald-600 rounded-2xl"><CheckSquare size={20} /></div>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Done</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.done}</h3>
                        <p className="text-xs text-emerald-600 mt-2 font-semibold">Berhasil diselesaikan</p>
                    </div>
                </div>

                {/* Grafik Persentase Status Task */}
                <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/80 flex flex-col items-center justify-center">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">Statistik Penyelesaian</h3>
                    <div className="w-40 h-40">
                        <Doughnut data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                    </div>
                </div>
            </div>

            {/* Task Section */}
            <div className="relative z-10 bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/90">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-lg font-black text-gray-900">Daftar Task Saya</h3>
                        <p className="text-xs text-gray-500">Filter dan kelola progres harian Anda.</p>
                    </div>
                    
                    {/* Filter & Tombol Tambah */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <select 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-3 bg-white/75 backdrop-blur-md border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-700 focus:border-black outline-none transition shadow-inner"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="TODO">Todo</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                        </select>

                        <select 
                            value={filterCategory} 
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-3 bg-white/75 backdrop-blur-md border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-700 focus:border-black outline-none transition shadow-inner"
                        >
                            <option value="ALL">Semua Kategori</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>

                        <button 
                            onClick={handleOpenCreateModal}
                            className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-2xl font-bold text-xs hover:shadow-lg transition shadow-md whitespace-nowrap ml-auto"
                        >
                            <Plus size={15} />
                            <span>Tambah Task</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-sm text-gray-400 font-medium">Memuat data task...</div>
                ) : filteredTasks.length === 0 ? (
                    <div className="py-16 text-center text-sm text-gray-400 font-medium">Tidak ada task yang ditemukan.</div>
                ) : (
                    <div className="space-y-3">
                        {filteredTasks.map((task) => (
                            <div key={task.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-white/60 hover:bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100 transition shadow-xs gap-4">
                                <div className="space-y-1 pr-4">
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-extrabold text-gray-900 text-sm">{task.title}</h4>
                                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold tracking-wide ${
                                            task.priority === 'HIGH' ? 'bg-red-100 text-red-700 shadow-sm' :
                                            task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700 shadow-sm' : 'bg-blue-100 text-blue-700 shadow-sm'
                                        }`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium line-clamp-1">{task.description || 'Tidak ada deskripsi'}</p>
                                    
                                    <div className="flex items-center space-x-4 text-[11px] text-gray-400 font-semibold pt-1">
                                        {task.due_date && (
                                            <span className="flex items-center space-x-1">
                                                <Calendar size={13} />
                                                <span>{new Date(task.due_date).toLocaleDateString('id-ID')}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3 shrink-0">
                                    <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide ${
                                        task.status === 'DONE' ? 'bg-emerald-100 text-emerald-700 shadow-sm' :
                                        task.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'bg-amber-100 text-amber-700 shadow-sm'
                                    }`}>
                                        {task.status}
                                    </span>
                                    <button 
                                        onClick={() => handleOpenEditModal(task)}
                                        className="p-2.5 bg-white hover:bg-black hover:text-white text-gray-700 rounded-xl transition shadow-sm border border-gray-200"
                                        title="Edit Task"
                                    >
                                        <Edit size={15} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition shadow-sm border border-red-200/50"
                                        title="Hapus Task"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Tambah / Edit Task */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white/90 backdrop-blur-2xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white">
                        <h3 className="text-xl font-black text-gray-900 mb-6 tracking-tight">
                            {isEditMode ? 'Edit Task' : 'Tambah Task Baru'}
                        </h3>
                        <form onSubmit={handleSaveTask} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Judul Task</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                    placeholder="Contoh: Belajar Golang Gin" 
                                    className="w-full px-4 py-3 bg-white/70 rounded-2xl text-xs font-medium border border-gray-200/80 focus:border-black outline-none transition shadow-inner" 
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Deskripsi</label>
                                <textarea 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)} 
                                    placeholder="Detail task..." 
                                    className="w-full px-4 py-3 bg-white/70 rounded-2xl text-xs font-medium border border-gray-200/80 focus:border-black outline-none transition shadow-inner resize-none h-24" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Prioritas</label>
                                    <select 
                                        value={priority} 
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/70 rounded-2xl text-xs font-bold text-gray-700 border border-gray-200/80 focus:border-black outline-none transition shadow-inner"
                                    >
                                        <option value="LOW">LOW</option>
                                        <option value="MEDIUM">MEDIUM</option>
                                        <option value="HIGH">HIGH</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Status</label>
                                    <select 
                                        value={status} 
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/70 rounded-2xl text-xs font-bold text-gray-700 border border-gray-200/80 focus:border-black outline-none transition shadow-inner"
                                    >
                                        <option value="TODO">TODO</option>
                                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                                        <option value="DONE">DONE</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Kategori</label>
                                <select 
                                    value={categoryId} 
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/70 rounded-2xl text-xs font-bold text-gray-700 border border-gray-200/80 focus:border-black outline-none transition shadow-inner"
                                >
                                    <option value="">Pilih Kategori</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Tenggat Waktu (Due Date)</label>
                                <input 
                                    type="date" 
                                    value={dueDate} 
                                    onChange={(e) => setDueDate(e.target.value)} 
                                    className="w-full px-4 py-3 bg-white/70 rounded-2xl text-xs font-bold text-gray-700 border border-gray-200/80 focus:border-black outline-none transition shadow-inner" 
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-1/2 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-xs hover:bg-gray-200 transition border border-gray-200"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    className="w-1/2 py-3 bg-black text-white rounded-2xl font-bold text-xs hover:bg-gray-800 transition shadow-md"
                                >
                                    {isEditMode ? 'Perbarui' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}