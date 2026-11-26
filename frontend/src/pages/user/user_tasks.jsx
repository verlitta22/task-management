import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import DashboardLayout from '../../components/dashboard_layout';
import { CheckSquare, Plus, Calendar, Edit, Trash2, FolderPlus, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function UserTasks() {
    const [tasks, setTasks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State Modal Task
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentTaskId, setCurrentTaskId] = useState(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [status, setStatus] = useState('TODO');
    const [categoryId, setCategoryId] = useState('');
    const [dueDate, setDueDate] = useState('');

    // State untuk Opsi Tambah Kategori di dalam Modal yang Sama (Inline Expand)
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [savingCategory, setSavingCategory] = useState(false);

    // Filter & Pagination
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const tasksPerPage = 5;

    const notify = {
        success: (msg) => toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl pointer-events-none flex ring-1 ring-black/5 p-4 items-center space-x-3 border border-emerald-100`}>
                <div className="shrink-0 bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                    <CheckCircle2 size={18} />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-black text-gray-900">Berhasil</p>
                    <p className="text-xs text-gray-500 font-medium">{msg}</p>
                </div>
            </div>
        )),
        error: (msg) => toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl pointer-events-none flex ring-1 ring-black/5 p-4 items-center space-x-3 border border-red-100`}>
                <div className="shrink-0 bg-red-100 text-red-600 p-2 rounded-xl">
                    <AlertCircle size={18} />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-black text-gray-900">Perhatian</p>
                    <p className="text-xs text-gray-500 font-medium">{msg}</p>
                </div>
            </div>
        )),
        info: (msg) => toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl pointer-events-none flex ring-1 ring-black/5 p-4 items-center space-x-3 border border-blue-100`}>
                <div className="shrink-0 bg-blue-100 text-blue-600 p-2 rounded-xl">
                    <Info size={18} />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-black text-gray-900">Informasi</p>
                    <p className="text-xs text-gray-500 font-medium">{msg}</p>
                </div>
            </div>
        ))
    };

    const fetchTasksData = async () => {
        try {
            setLoading(true);
            const tasksRes = await apiRequest('/tasks');
            const categoriesRes = await apiRequest('/categories');

            const taskList = tasksRes.data || tasksRes.tasks || tasksRes;
            setTasks(Array.isArray(taskList) ? taskList : []);

            const catList = categoriesRes.data || categoriesRes.categories || categoriesRes;
            setCategories(Array.isArray(catList) ? catList : []);
        } catch (err) {
            notify.error(err.message || 'Gagal memuat data task');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasksData();

        const handleTaskDeletedByAdmin = (e) => {
            const deletedId = e.detail.taskId;
            setTasks(prevTasks => prevTasks.filter(task => task.id !== deletedId));
            notify.info('Sebuah task telah dihapus oleh Admin.');
        };

        window.addEventListener('taskDeletedByAdmin', handleTaskDeletedByAdmin);
        return () => {
            window.removeEventListener('taskDeletedByAdmin', handleTaskDeletedByAdmin);
        };
    }, []);

    // Fungsi Submit Kategori Baru secara Inline di dalam Modal
    const handleInlineCreateCategory = async () => {
        if (!newCategoryName.trim()) return;

        try {
            setSavingCategory(true);
            const res = await apiRequest('/categories', {
                method: 'POST',
                body: JSON.stringify({ name: newCategoryName.trim() }),
            });
            notify.success('Kategori baru berhasil ditambahkan!');
            
            await fetchTasksData();
            const created = res.data || res.category || res;
            if (created && created.id) {
                setCategoryId(String(created.id));
            }
            
            setNewCategoryName('');
            setShowNewCategoryInput(false); // Sembunyikan input kembali dan kembali ke dropdown
        } catch (err) {
            notify.error(err.message || 'Gagal menambahkan kategori');
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
                notify.success('Task berhasil diperbarui!');
            } else {
                await apiRequest('/tasks', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                notify.success('Task baru berhasil ditambahkan!');
            }

            setIsModalOpen(false);
            fetchTasksData();
        } catch (err) {
            notify.error(err.message || 'Gagal menyimpan task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus task ini?')) return;
        try {
            await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
            notify.success('Task berhasil dihapus');
            fetchTasksData();
        } catch (err) {
            notify.error(err.message || 'Gagal menghapus task');
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchStatus = filterStatus === 'ALL' || task.status === filterStatus;
        const matchCategory = filterCategory === 'ALL' || String(task.category_id) === String(filterCategory);
        return matchStatus && matchCategory;
    });

    const totalPages = Math.max(1, Math.ceil(filteredTasks.length / tasksPerPage));
    const paginatedTasks = filteredTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage);

    return (
        <DashboardLayout>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

            <div className="mb-7">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">My Tasks</h2>
                <p className="text-sm text-gray-600 mt-0.5">Kelola, pantau, dan selesaikan daftar tugas personal Anda.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-lg font-black text-gray-900">Daftar Task Saya ({filteredTasks.length})</h3>
                        <p className="text-xs text-gray-500">Filter berdasarkan status atau kategori pribadi.</p>
                    </div>
                    
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
                            className="flex items-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-gray-900 to-black text-white rounded-2xl font-bold text-xs hover:shadow-lg transition shadow-md"
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
                                                className="p-2.5 bg-white hover:bg-black hover:text-white text-gray-700 rounded-xl transition shadow-xs border border-gray-200"
                                                title="Edit Task"
                                            >
                                                <Edit size={15} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition border border-red-200/50"
                                                title="Hapus Task"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-200/60">
                            <p className="text-xs text-gray-500 font-semibold">Halaman {currentPage} dari {totalPages}</p>
                            <div className="flex space-x-2">
                                <button 
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="px-4 py-2 bg-white text-gray-700 rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-gray-100 transition border border-gray-200"
                                >
                                    Sebelumnya
                                </button>
                                <button 
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-gray-800 transition shadow-sm"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* MODAL UTAMA TAMBAH / EDIT TASK (DENGAN OPSI KATEGORI INLINE) */}
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
                                    className="w-full px-4 py-3 bg-white rounded-2xl text-xs font-medium border border-gray-200 focus:border-black outline-none transition shadow-inner resize-none h-20" 
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