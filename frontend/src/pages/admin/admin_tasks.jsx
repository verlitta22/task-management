import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import DashboardLayout from '../../components/dashboard_layout';
import { Search, Download, Trash2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [taskPage, setTaskPage] = useState(1);
    const [taskTotalPages, setTaskTotalPages] = useState(1);
    const [taskSearch, setTaskSearch] = useState('');

    // Helper Toast Modern Custom
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

    const fetchAdminTasks = async (page = 1, search = '') => {
        try {
            setLoading(true);
            const tasksRes = await apiRequest(`/admin/tasks?page=${page}&limit=5&search=${search}`);
            setTasks(tasksRes.data || []);
            setTaskTotalPages(tasksRes.total_pages || 1);
            setTaskPage(tasksRes.page || 1);
        } catch (err) {
            notify.error(err.message || 'Gagal memuat monitoring task');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminTasks(taskPage, taskSearch);
    }, [taskPage, taskSearch]);

    const handleAdminDeleteTask = async (taskId) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus task user ini?')) return;
        try {
            await apiRequest(`/admin/tasks/${taskId}`, { method: 'DELETE' });
            notify.success('Task berhasil dihapus oleh admin');
            
            // Perbarui list admin secara lokal
            fetchAdminTasks(taskPage, taskSearch);

            // [REAL-TIME FIX] Kirim sinyal broadcast ke tab/komponen user lain yang sedang aktif
            window.dispatchEvent(new CustomEvent('taskDeletedByAdmin', { detail: { taskId } }));
        } catch (err) {
            notify.error(err.message || 'Gagal menghapus task');
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
            notify.success('Laporan CSV berhasil diunduh');
        } catch (err) {
            notify.error(err.message || 'Gagal mengunduh laporan CSV');
        }
    };

    return (
        <DashboardLayout title="Task Monitoring" subtitle="Pantau seluruh aktivitas tugas pengguna dan lakukan moderasi.">
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-lg font-black text-gray-900">Daftar Task Global</h3>
                        <p className="text-xs text-gray-500">Moderasi konten dan ekspor laporan tugas ke CSV.</p>
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
                                className="w-full pl-11 pr-4 py-3 bg-white/80 rounded-2xl text-xs font-medium border border-gray-200/80 focus:border-black outline-none transition shadow-inner"
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
                    <>
                        <div className="space-y-3 mb-6">
                            {tasks.map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-4 bg-white/70 hover:bg-white rounded-2xl border border-gray-100 transition shadow-2xs">
                                    <div className="pr-4">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h4 className="font-extrabold text-gray-900 text-sm">{t.title}</h4>
                                            <span className="text-[10px] bg-gray-200/80 text-gray-700 px-2.5 py-0.5 rounded-lg font-bold">Oleh: {t.user_name}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium line-clamp-1">{t.description || 'Tidak ada deskripsi'}</p>
                                    </div>
                                    <div className="flex items-center space-x-3 shrink-0">
                                        <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide ${
                                            t.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                                            t.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {t.status}
                                        </span>
                                        <button 
                                            onClick={() => handleAdminDeleteTask(t.id)}
                                            className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition border border-red-200/50"
                                            title="Hapus Task"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

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
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}