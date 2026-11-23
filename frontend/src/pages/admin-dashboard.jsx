import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { apiRequest } from '../services/api';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, Shield, CheckSquare } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        users: { total: 0, active: 0, inactive: 0, admins: 0 },
        tasks: { total: 0, status_counts: { TODO: 0, IN_PROGRESS: 0, DONE: 0 } }
    });
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        async function fetchAdminStats() {
            try {
                const res = await apiRequest('/admin/dashboard');
                setStats(res);
            } catch (err) {
                console.error(err);
            }
        }
        fetchAdminStats();
    }, []);

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className="mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Global Dashboard 🛡️</h2>
                    <p className="text-gray-500 mt-1">Halo {user.name}, berikut adalah statistik global dan monitoring sistem.</p>
                </div>

                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Statistik Pengguna Sistem</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total User</span>
                            <div className="p-2 bg-gray-100 rounded-2xl text-gray-700"><Users size={20} /></div>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-4xl font-extrabold text-gray-900">{stats.users.total}</h3>
                            <p className="text-xs text-gray-400 mt-1">Akun terdaftar</p>
                        </div>
                    </div>

                    <div className="bg-[#D1F7C4] p-6 rounded-3xl shadow-sm border border-green-200/50 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold uppercase tracking-wider text-green-800">User Aktif</span>
                            <div className="p-2 bg-white/60 rounded-2xl text-green-800"><UserCheck size={20} /></div>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-4xl font-extrabold text-gray-900">{stats.users.active}</h3>
                            <p className="text-xs text-green-900/70 mt-1">Dapat mengakses aplikasi</p>
                        </div>
                    </div>

                    <div className="bg-[#FBE2F3] p-6 rounded-3xl shadow-sm border border-pink-200/50 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold uppercase tracking-wider text-pink-800">User Nonaktif</span>
                            <div className="p-2 bg-white/60 rounded-2xl text-pink-800"><UserX size={20} /></div>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-4xl font-extrabold text-gray-900">{stats.users.inactive}</h3>
                            <p className="text-xs text-pink-900/70 mt-1">Akun dinonaktifkan</p>
                        </div>
                    </div>

                    <div className="bg-[#D8E7FE] p-6 rounded-3xl shadow-sm border border-blue-200/50 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Total Admin</span>
                            <div className="p-2 bg-white/60 rounded-2xl text-blue-800"><Shield size={20} /></div>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-4xl font-extrabold text-gray-900">{stats.users.admins}</h3>
                            <p className="text-xs text-blue-900/70 mt-1">Pengelola sistem</p>
                        </div>
                    </div>
                </div>

                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Statistik Global Task Lintas User</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-[#141414] text-white p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Sistem Task</span>
                            <div className="p-2 bg-gray-800 rounded-2xl text-white"><CheckSquare size={20} /></div>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-4xl font-extrabold text-white">{stats.tasks.total}</h3>
                            <p className="text-xs text-gray-400 mt-1">Keseluruhan task</p>
                        </div>
                    </div>

                    <div className="bg-[#FDF2B3] p-6 rounded-3xl shadow-sm border border-yellow-200/50 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold uppercase tracking-wider text-yellow-800">Global TODO</span>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-4xl font-extrabold text-gray-900">{stats.tasks.status_counts.TODO || 0}</h3>
                            <p className="text-xs text-yellow-900/70 mt-1">Status TODO</p>
                        </div>
                    </div>

                    <div className="bg-[#D8E7FE] p-6 rounded-3xl shadow-sm border border-blue-200/50 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Global In Progress</span>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-4xl font-extrabold text-gray-900">{stats.tasks.status_counts.IN_PROGRESS || 0}</h3>
                            <p className="text-xs text-blue-900/70 mt-1">Status In Progress</p>
                        </div>
                    </div>

                    <div className="bg-[#D1F7C4] p-6 rounded-3xl shadow-sm border border-green-200/50 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold uppercase tracking-wider text-green-800">Global Done</span>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-4xl font-extrabold text-gray-900">{stats.tasks.status_counts.DONE || 0}</h3>
                            <p className="text-xs text-green-900/70 mt-1">Status Done</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
}