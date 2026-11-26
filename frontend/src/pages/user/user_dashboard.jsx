import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import DashboardLayout from '../../components/dashboard_layout';
import { LayoutDashboard, CheckSquare, Clock, AlertCircle, Plus, Calendar, Edit, Trash2, ArrowUpRight, FolderPlus, X } from 'lucide-react';
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

    // State untuk Opsi Tambah Kategori secara Inline (di dalam modal task yang sama)
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [savingCategory, setSavingCategory] = useState(false);

    // State untuk Filter & Pagination Task User
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const tasksPerPage = 5;

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

    // Fungsi Tambah Kategori Baru secara Inline di dalam Modal
    const handleInlineCreateCategory = async () => {
        if (!newCategoryName.trim()) return;

        try {
            setSavingCategory(true);
            const res = await apiRequest('/categories', {
                method: 'POST',
                body: JSON.stringify({ name: newCategoryName.trim() }),
            });
            toast.success('Kategori baru berhasil ditambahkan!');
            
            await fetchDashboardData();
            const created = res.data || res.category || res;
            if (created && created.id) {
                setCategoryId(String(created.id));
            }
            
            setNewCategoryName('');
            setShowNewCategoryInput(false);
        } catch (err) {
            toast.error(err.message || 'Gagal menambahkan kategori');
        } finally {
            setSavingCategory(false);
        }
    };

    const handleOpenCreateModal = () => {
        setIsEditMode(false);
        setCurrentTaskId(null);
        setTitle('');
        setDescription('');
        setPriority('MEDIUM');
        setStatus('TODO');
        setCategoryId('');
        setDueDate('');
        setShowNewCategoryInput(false);
        setNewCategoryName('');
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
        setShowNewCategoryInput(false);
        setNewCategoryName('');
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
            await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
            toast.success('Task berhasil dihapus');
            fetchDashboardData();
        } catch (err) {
            toast.error(err.message || 'Gagal menghapus task');
        }
    };

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

    // Filtered & Paginated Tasks
    const filteredTasks = tasks.filter(task => {
        const matchStatus = filterStatus === 'ALL' || task.status === filterStatus;
        const matchCategory = filterCategory === 'ALL' || String(task.category_id) === String(filterCategory);
        return matchStatus && matchCategory;
    });

    const totalPages = Math.max(1, Math.ceil(filteredTasks.length / tasksPerPage));
    const paginatedTasks = filteredTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage);

    return (
        <DashboardLayout>
            <Toaster position="top-right" />

            {/* Header Judul Halaman */}
            <div className="mb-7">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Pengguna</h2>
                <p className="text-sm text-gray-600 mt-0.5">Kelola tugas harian, target, dan progres pencapaian Anda dengan mudah.</p>
            </div>

            {/* Stats Bento Grid & Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-7">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="bg-white/75 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl"><LayoutDashboard size={20} /></div>
                            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                                Active <ArrowUpRight size={12} />
                            </span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Task</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.total}</h3>
                    </div>

                    <div className="bg-white/75 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl"><Clock size={20} /></div>
                        </div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Todo</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.todo}</h3>
                    </div>

                    <div className="bg-white/75 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-2xl"><AlertCircle size={20} /></div>
                        </div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">In Progress</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.in_progress}</h3>
                    </div>

                    <div className="bg-white/75 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl"><CheckSquare size={20} /></div>
                        </div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Done</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.done}</h3>
                    </div>
                </div>

                {/* Grafik Persentase Status Task */}
                <div className="bg-white/75 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white flex flex-col items-center justify-center">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase mb-4 tracking-wider">Statistik Penyelesaian</h3>
                    <div className="w-40 h-40">
                        <Doughnut data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                    </div>
                </div>
            </div>

            {/* Task Section */}
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-lg font-black text-gray-900">Daftar Task Saya ({filteredTasks.length})</h3>
                        <p className="text-xs text-gray-500">Filter berdasarkan status atau kategori pribadi Anda.</p>
                    </div>
                    
                    {/* Filter & Tombol Aksi */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                        <select 
                            value={filterStatus} 
                            onChange={(e) => {
                                setFilterStatus(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2.5 bg-white/80 border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-700 focus:border-black outline-none transition shadow-inner"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="TODO">Todo</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                        </select>

                        <select 
                            value={filterCategory} 
                            onChange={(e) => {
                                setFilterCategory(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2.5 bg-white/80 border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-700 focus:border-black outline-none transition shadow-inner"
                        >
                            <option value="ALL">Semua Kategori</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>

                        <button 
                            onClick={handleOpenCreateModal}
                            className="flex items-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-gray-900 to-black text-white rounded-2xl font-bold text-xs hover:shadow-lg transition shadow-md cursor-pointer"
                        >
                            <Plus size={15} />
                            <span>Tambah Task</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-sm text-gray-400 font-medium">Memuat data task...</div>
                ) : paginatedTasks.length === 0 ? (
                    <div className="py-16 text-center text-sm text-gray-400 font-medium">Tidak ada task yang ditemukan.</div>
                ) : (
                    <>
                        <div className="space-y-3 mb-6">
                            {paginatedTasks.map((task) => {
                                const catObj = categories.find(c => String(c.id) === String(task.category_id));
                                return (
                                    <div key={task.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-white/70 hover:bg-white rounded-2xl border border-gray-100 transition shadow-2xs gap-4">
                                        <div className="space-y-1 pr-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="font-extrabold text-gray-900 text-sm">{task.title}</h4>
                                                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold tracking-wide ${
                                                    task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                                    task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {task.priority}
                                                </span>
                                                {catObj && (
                                                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200/80">
                                                        {catObj.name}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium line-clamp-1">{task.description || 'Tidak ada deskripsi'}</p>
                                            
                                            {task.due_date && (
                                                <div className="flex items-center space-x-1 text-[11px] text-gray-400 font-semibold pt-1">
                                                    <Calendar size={13} />
                                                    <span>{new Date(task.due_date).toLocaleDateString('id-ID')}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-3 shrink-0">
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide ${
                                                task.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                                                task.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {task.status}
                                            </span>
                                            <button 
                                                onClick={() => handleOpenEditModal(task)}
                                                className="p-2.5 bg-white hover:bg-black hover:text-white text-gray-700 rounded-xl transition shadow-xs border border-gray-200 cursor-pointer"
                                                title="Edit Task"
                                            >
                                                <Edit size={15} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition border border-red-200/50 cursor-pointer"
                                                title="Hapus Task"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200/60">
                            <p className="text-xs text-gray-500 font-semibold">Halaman {currentPage} dari {totalPages}</p>
                            <div className="flex space-x-2">
                                <button 
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="px-4 py-2 bg-white text-gray-700 rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-gray-100 transition border border-gray-200 cursor-pointer"
                                >
                                    Sebelumnya
                                </button>
                                <button 
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-gray-800 transition shadow-sm cursor-pointer"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modal Tambah / Edit Task (Dengan Opsi Tambah Kategori Inline) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white max-h-[90vh] overflow-y-auto">
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
                                    className="w-full px-4 py-3 bg-white rounded-2xl text-xs font-medium border border-gray-200 focus:border-black outline-none transition shadow-inner" 
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Deskripsi</label>
                                <textarea 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)} 
                                    placeholder="Detail task..." 
                                    className="w-full px-4 py-3 bg-white rounded-2xl text-xs font-medium border border-gray-200 focus:border-black outline-none transition shadow-inner resize-none h-24" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Prioritas</label>
                                    <select 
                                        value={priority} 
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full px-4 py-3 bg-white rounded-2xl text-xs font-bold text-gray-700 border border-gray-200 focus:border-black outline-none transition"
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
                                        className="w-full px-4 py-3 bg-white rounded-2xl text-xs font-bold text-gray-700 border border-gray-200 focus:border-black outline-none transition"
                                    >
                                        <option value="TODO">TODO</option>
                                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                                        <option value="DONE">DONE</option>
                                    </select>
                                </div>
                            </div>

                            {/* KATEGORI SECTION DENGAN EXPAND INLINE */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Kategori</label>
                                    {!showNewCategoryInput && (
                                        <button 
                                            type="button" 
                                            onClick={() => setShowNewCategoryInput(true)} 
                                            className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                                        >
                                            + Buat Kategori Baru
                                        </button>
                                    )}
                                </div>

                                {!showNewCategoryInput ? (
                                    <select 
                                        value={categoryId} 
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        className="w-full px-4 py-3 bg-white rounded-2xl text-xs font-bold text-gray-700 border border-gray-200 focus:border-black outline-none transition"
                                    >
                                        <option value="">Tanpa Kategori</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2 animate-in fade-in duration-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-extrabold text-blue-900">Nama Kategori Baru</span>
                                            <button 
                                                type="button" 
                                                onClick={() => setShowNewCategoryInput(false)}
                                                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                                                title="Tutup"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="flex space-x-2">
                                            <input 
                                                type="text" 
                                                value={newCategoryName} 
                                                onChange={(e) => setNewCategoryName(e.target.value)} 
                                                placeholder="Contoh: Kuliah, Pribadi" 
                                                className="flex-1 px-3 py-2 bg-white rounded-xl text-xs font-medium border border-blue-200 focus:border-black outline-none shadow-inner"
                                            />
                                            <button 
                                                type="button"
                                                disabled={savingCategory}
                                                onClick={handleInlineCreateCategory}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
                                            >
                                                {savingCategory ? '...' : 'Tambah'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Tenggat Waktu (Due Date)</label>
                                <input 
                                    type="date" 
                                    value={dueDate} 
                                    onChange={(e) => setDueDate(e.target.value)} 
                                    className="w-full px-4 py-3 bg-white rounded-2xl text-xs font-bold text-gray-700 border border-gray-200 focus:border-black outline-none transition" 
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-1/2 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-xs hover:bg-gray-200 transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    className="w-1/2 py-3 bg-black text-white rounded-2xl font-bold text-xs hover:bg-gray-800 transition shadow-md cursor-pointer"
                                >
                                    {isEditMode ? 'Perbarui' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}