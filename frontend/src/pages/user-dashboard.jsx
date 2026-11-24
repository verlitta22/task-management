import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { LayoutDashboard, CheckSquare, Clock, AlertCircle, Plus, LogOut, Calendar, Edit, Trash2 } from 'lucide-react';
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
                backgroundColor: ['#FBBF24', '#C084FC', '#4ADE80'],
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
        <div className="min-h-screen bg-[#F7F5F0] p-6 font-sans">
            <Toaster position="top-right" />

            {/* Header */}
            <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm mb-6 border border-gray-100">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Dashboard Pengguna</h1>
                    <p className="text-sm text-gray-500">Kelola tugas harian dan target Anda dengan mudah.</p>
                </div>
                <button onClick={handleLogout} className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-100 transition">
                    <LogOut size={16} />
                    <span>Keluar</span>
                </button>
            </header>

            {/* Stats Bento Grid & Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><LayoutDashboard size={24} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Total Task</p>
                            <h3 className="text-2xl font-extrabold text-gray-900">{stats.total}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                        <div className="p-4 bg-yellow-50 text-yellow-600 rounded-2xl"><Clock size={24} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Todo</p>
                            <h3 className="text-2xl font-extrabold text-gray-900">{stats.todo}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><AlertCircle size={24} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">In Progress</p>
                            <h3 className="text-2xl font-extrabold text-gray-900">{stats.in_progress}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                        <div className="p-4 bg-green-50 text-green-600 rounded-2xl"><CheckSquare size={24} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Done</p>
                            <h3 className="text-2xl font-extrabold text-gray-900">{stats.done}</h3>
                        </div>
                    </div>
                </div>

                {/* Grafik Persentase Status Task */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">Statistik Penyelesaian</h3>
                    <div className="w-40 h-40">
                        <Doughnut data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                    </div>
                </div>
            </div>

            {/* Task Section */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-lg font-extrabold text-gray-900">Daftar Task Saya</h3>
                    
                    {/* Filter & Tombol Tambah */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <select 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2.5 bg-[#F7F5F0] border border-transparent rounded-2xl text-sm font-bold text-gray-700 focus:outline-none"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="TODO">Todo</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                        </select>

                        <select 
                            value={filterCategory} 
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2.5 bg-[#F7F5F0] border border-transparent rounded-2xl text-sm font-bold text-gray-700 focus:outline-none"
                        >
                            <option value="ALL">Semua Kategori</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>

                        <button 
                            onClick={handleOpenCreateModal}
                            className="flex items-center space-x-2 px-4 py-2.5 bg-black text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition shadow-md ml-auto"
                        >
                            <Plus size={16} />
                            <span>Tambah Task</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p className="text-sm text-gray-400 text-center py-8">Memuat data task...</p>
                ) : filteredTasks.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Tidak ada task yang ditemukan.</p>
                ) : (
                    <div className="space-y-4">
                        {filteredTasks.map((task) => (
                            <div key={task.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-[#F7F5F0] rounded-2xl border border-transparent hover:border-gray-200 transition gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-bold text-gray-900 text-base">{task.title}</h4>
                                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${
                                            task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                            task.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">{task.description || 'Tidak ada deskripsi'}</p>
                                    
                                    <div className="flex items-center space-x-4 text-xs text-gray-400 pt-1">
                                        {task.due_date && (
                                            <span className="flex items-center space-x-1">
                                                <Calendar size={13} />
                                                <span>{new Date(task.due_date).toLocaleDateString('id-ID')}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <span className={`px-3.5 py-1 rounded-full text-xs font-bold ${
                                        task.status === 'DONE' ? 'bg-green-100 text-green-700' :
                                        task.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {task.status}
                                    </span>
                                    <button 
                                        onClick={() => handleOpenEditModal(task)}
                                        className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition"
                                        title="Edit Task"
                                    >
                                        <Edit size={15} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition"
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-gray-100">
                        <h3 className="text-xl font-extrabold text-gray-900 mb-6">
                            {isEditMode ? 'Edit Task' : 'Tambah Task Baru'}
                        </h3>
                        <form onSubmit={handleSaveTask} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Judul Task</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                    placeholder="Contoh: Belajar Golang Gin" 
                                    className="w-full px-4 py-3 bg-[#F7F5F0] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Deskripsi</label>
                                <textarea 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)} 
                                    placeholder="Detail task..." 
                                    className="w-full px-4 py-3 bg-[#F7F5F0] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none h-24" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Prioritas</label>
                                    <select 
                                        value={priority} 
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#F7F5F0] rounded-2xl text-sm font-bold text-gray-700 focus:outline-none"
                                    >
                                        <option value="LOW">LOW</option>
                                        <option value="MEDIUM">MEDIUM</option>
                                        <option value="HIGH">HIGH</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Status</label>
                                    <select 
                                        value={status} 
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#F7F5F0] rounded-2xl text-sm font-bold text-gray-700 focus:outline-none"
                                    >
                                        <option value="TODO">TODO</option>
                                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                                        <option value="DONE">DONE</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Kategori</label>
                                <select 
                                    value={categoryId} 
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#F7F5F0] rounded-2xl text-sm font-bold text-gray-700 focus:outline-none"
                                >
                                    <option value="">Pilih Kategori</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Tenggat Waktu (Due Date)</label>
                                <input 
                                    type="date" 
                                    value={dueDate} 
                                    onChange={(e) => setDueDate(e.target.value)} 
                                    className="w-full px-4 py-3 bg-[#F7F5F0] rounded-2xl text-sm font-bold text-gray-700 focus:outline-none" 
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-1/2 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    className="w-1/2 py-3 bg-black text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition shadow-md"
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