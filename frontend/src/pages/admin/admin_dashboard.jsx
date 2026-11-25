import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import DashboardLayout from '../../components/dashboard_layout';
import { Users, Shield, CheckSquare, Clock, ArrowUpRight } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import toast, { Toaster } from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function AdminDashboard() {
    const [stats, setStats] = useState({ total_users: 0, active_users: 0, inactive_users: 0, admin_count: 0, total_tasks: 0, status_summary: { TODO: 0, IN_PROGRESS: 0, DONE: 0 } });
    const [allTasks, setAllTasks] = useState([]);
    const [timeframe, setTimeframe] = useState('daily'); // 'daily' atau 'weekly'

    useEffect(() => {
        const loadOverview = async () => {
            try {
                const dashboardRes = await apiRequest('/admin/dashboard');
                setStats(dashboardRes.stats || stats);

                // Ambil data task untuk kalkulasi tren grafik harian/mingguan
                const tasksRes = await apiRequest('/admin/tasks?page=1&limit=100');
                setAllTasks(tasksRes.data || []);
            } catch (err) {
                toast.error(err.message || 'Gagal memuat statistik sistem');
            }
        };
        loadOverview();
    }, []);

    // Menyusun data grafik berdasarkan hari atau minggu
    const buildChartData = () => {
        const labels = [];
        const todoData = [];
        const inProgressData = [];
        const doneData = [];

        if (timeframe === 'daily') {
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().substring(0, 10);
                labels.push(d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));

                const dayTasks = allTasks.filter(t => (t.created_at || t.due_date || '').startsWith(dateStr));
                todoData.push(dayTasks.filter(t => t.status === 'TODO').length);
                inProgressData.push(dayTasks.filter(t => t.status === 'IN_PROGRESS').length);
                doneData.push(dayTasks.filter(t => t.status === 'DONE').length);
            }
        } else {
            // 4 Minggu terakhir
            for (let w = 3; w >= 0; w--) {
                const end = new Date();
                end.setDate(end.getDate() - w * 7);
                const start = new Date();
                start.setDate(start.getDate() - (w + 1) * 7);
                labels.push(`Minggu ${4 - w}`);

                const weekTasks = allTasks.filter(t => {
                    const rawDate = t.created_at || t.due_date;
                    if (!rawDate) return false;
                    const dt = new Date(rawDate);
                    return dt >= start && dt <= end;
                });
                todoData.push(weekTasks.filter(t => t.status === 'TODO').length);
                inProgressData.push(weekTasks.filter(t => t.status === 'IN_PROGRESS').length);
                doneData.push(weekTasks.filter(t => t.status === 'DONE').length);
            }
        }

        return {
            labels,
            datasets: [
                {
                    label: 'Todo',
                    data: todoData,
                    fill: true,
                    borderColor: '#FACC15',
                    backgroundColor: 'rgba(250, 204, 21, 0.25)',
                    pointBackgroundColor: '#FEF08A',
                    pointBorderColor: '#EAB308',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    tension: 0.35,
                },
                {
                    label: 'In Progress',
                    data: inProgressData,
                    fill: true,
                    borderColor: '#38BDF8',
                    backgroundColor: 'rgba(56, 189, 248, 0.25)',
                    pointBackgroundColor: '#BAE6FD',
                    pointBorderColor: '#0284C7',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    tension: 0.35,
                },
                {
                    label: 'Done',
                    data: doneData,
                    fill: true,
                    borderColor: '#F43F5E',
                    backgroundColor: 'rgba(244, 63, 94, 0.22)',
                    pointBackgroundColor: '#FECDD3',
                    pointBorderColor: '#E11D48',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    tension: 0.35,
                },
            ],
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                position: 'bottom',
                labels: { usePointStyle: true, padding: 20, font: { size: 12, weight: 'bold' } },
            },
            tooltip: {
                backgroundColor: '#141414',
                titleFont: { size: 12, weight: 'bold' },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 12,
            },
        },
        scales: {
            x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } },
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { stepSize: 1, font: { size: 11 } } },
        },
    };

    return (
        <DashboardLayout>
            <Toaster position="top-right" />

            {/* Header Judul Halaman */}
            <div className="mb-7">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">System Overview</h2>
                <p className="text-sm text-gray-600 mt-0.5">Ringkasan performa sistem dan analisis progres tugas global secara real-time.</p>
            </div>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
                <div className="bg-white/75 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl"><Users size={20} /></div>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                            Live <ArrowUpRight size={12} />
                        </span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total User</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.total_users}</h3>
                    <p className="text-xs text-gray-500 mt-1.5 font-medium">{stats.active_users} Aktif / {stats.inactive_users} Nonaktif</p>
                </div>

                <div className="bg-white/75 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-purple-500/10 text-purple-600 rounded-2xl"><Shield size={20} /></div>
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Jumlah Admin</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.admin_count}</h3>
                    <p className="text-xs text-purple-600 mt-1.5 font-semibold">Hak akses penuh</p>
                </div>

                <div className="bg-white/75 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl"><CheckSquare size={20} /></div>
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Task Sistem</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.total_tasks}</h3>
                    <p className="text-xs text-amber-600 mt-1.5 font-semibold">Seluruh workspace</p>
                </div>

                <div className="bg-white/75 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl"><Clock size={20} /></div>
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Selesai (Done)</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.status_summary?.DONE || 0}</h3>
                    <p className="text-xs text-emerald-600 mt-1.5 font-semibold">Task terselesaikan</p>
                </div>
            </div>

            {/* Area Chart Tren Aktivitas Task */}
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-lg font-black text-gray-900">Analisis Aktivitas Task</h3>
                        <p className="text-xs text-gray-500">Perbandingan volume Todo, In Progress, dan Done secara berkala.</p>
                    </div>
                    <div className="flex bg-gray-100/80 p-1 rounded-2xl border border-gray-200/60">
                        <button
                            onClick={() => setTimeframe('daily')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${timeframe === 'daily' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
                        >
                            Harian (7 Hari)
                        </button>
                        <button
                            onClick={() => setTimeframe('weekly')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${timeframe === 'weekly' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
                        >
                            Mingguan (4 Minggu)
                        </button>
                    </div>
                </div>

                <div className="h-80 w-full">
                    <Line data={buildChartData()} options={chartOptions} />
                </div>
            </div>
        </DashboardLayout>
    );
}