import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { apiRequest } from '../services/api';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle, ListTodo, Calendar } from 'lucide-react';

export default function UserDashboard() {
    const [summary, setSummary] = useState({ 
        total_tasks: 0, 
        status_summary: { TODO: 0, IN_PROGRESS: 0, DONE: 0 } 
    });
    const [tasks, setTasks] = useState([]);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        async function fetchData() {
            try {
                const dashRes = await apiRequest('/dashboard');
                setSummary(dashRes);
                const tasksRes = await apiRequest('/tasks?limit=5');
                setTasks(tasksRes.data || []);
            } catch (err) {
                console.error(err);
            }
        }
        fetchData();
    }, []);

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className="mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Halo, {user.name} 👋</h2>
                    <p className="text-gray-500 mt-1">Berikut adalah ringkasan tugas pribadi dan progres harian Anda.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="bg-[#FBE2F3] p-6 rounded-3xl shadow-sm border border-pink-200/50 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold uppercase tracking-wider text-pink-700">Total Tasks</span>
                            <div className="p-2 bg-white/60 rounded-2xl text-pink-700"><ListTodo size={20} /></div>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-4xl font-extrabold text-gray-900">{summary.total_tasks}</h3>
                            <p className="text-xs text-pink-800/70 mt-1">Semua task Anda</p>
                        </div>
                    </div>

                    <div className="bg-[#FDF2B3] p-6 rounded-3xl shadow-sm border border-yellow-200/50 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold uppercase tracking-wider text-yellow-800">TODO</span>
                            <div className="p-2 bg-white/60 rounded-2xl text-yellow-800"><AlertCircle size={20} /></div>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-4xl font-extrabold text-gray-900">{summary.status_summary.TODO}</h3>
                            <p className="text-xs text-yellow-900/70 mt-1">Belum dikerjakan</p>
                        </div>
                    </div>

                    <div className="bg-[#D8E7FE] p-6 rounded-3xl shadow-sm border border-blue-200/50 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">In Progress</span>
                            <div className="p-2 bg-white/60 rounded-2xl text-blue-800"><Clock size={20} /></div>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-4xl font-extrabold text-gray-900">{summary.status_summary.IN_PROGRESS}</h3>
                            <p className="text-xs text-blue-900/70 mt-1">Sedang dikerjakan</p>
                        </div>
                    </div>

                    <div className="bg-[#D1F7C4] p-6 rounded-3xl shadow-sm border border-green-200/50 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold uppercase tracking-wider text-green-800">Done</span>
                            <div className="p-2 bg-white/60 rounded-2xl text-green-800"><CheckCircle2 size={20} /></div>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-4xl font-extrabold text-gray-900">{summary.status_summary.DONE}</h3>
                            <p className="text-xs text-green-900/70 mt-1">Tugas selesai</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                        <Calendar size={20} className="text-gray-500" />
                        <span>Task Terbaru & Mendekati Deadline</span>
                    </h3>
                    {tasks.length === 0 ? (
                        <p className="text-sm text-gray-400 py-4">Belum ada task yang dibuat.</p>
                    ) : (
                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between p-4 bg-[#F7F5F0] rounded-2xl">
                                    <div>
                                        <h4 className="font-semibold text-gray-800 text-sm">{task.title}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">Deadline: {task.due_date || 'Tidak ada deadline'}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        task.status === 'DONE' ? 'bg-green-100 text-green-700' :
                                        task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {task.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </DashboardLayout>
    );
}