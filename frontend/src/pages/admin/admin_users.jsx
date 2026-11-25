import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import DashboardLayout from '../../components/dashboard_layout';
import { Search } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // State Pagination Pengguna
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const usersRes = await apiRequest('/admin/users');
            setUsers(usersRes.data || []);
        } catch (err) {
            toast.error(err.message || 'Gagal memuat daftar pengguna');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            await apiRequest(`/admin/users/${userId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: !currentStatus })
            });
            toast.success('Status akun berhasil diubah');
            fetchUsers();
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
            fetchUsers();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <DashboardLayout title="Kelola Pengguna" subtitle="Kontrol hak akses, role, dan status keaktifan seluruh akun.">
            <Toaster position="top-right" />

            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-lg font-black text-gray-900">Daftar Pengguna ({filteredUsers.length})</h3>
                        <p className="text-xs text-gray-500">Menampilkan maksimal {itemsPerPage} pengguna per halaman.</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-3.5 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Cari nama atau email..." 
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-11 pr-4 py-3 bg-white/80 rounded-2xl text-xs font-medium border border-gray-200/80 focus:border-black outline-none transition shadow-inner"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-sm text-gray-400 font-medium">Memuat data pengguna...</div>
                ) : paginatedUsers.length === 0 ? (
                    <div className="py-16 text-center text-sm text-gray-400 font-medium">Tidak ada pengguna ditemukan.</div>
                ) : (
                    <>
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
                                    {paginatedUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-white/70 transition">
                                            <td className="py-4 font-extrabold text-gray-900">{u.name}</td>
                                            <td className="py-4 text-gray-500 font-medium">{u.email}</td>
                                            <td className="py-4">
                                                <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {u.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right space-x-2">
                                                <button 
                                                    onClick={() => handleToggleRole(u.id, u.role)}
                                                    className="px-3.5 py-1.5 bg-white hover:bg-black hover:text-white text-gray-700 rounded-xl font-bold transition shadow-xs border border-gray-200"
                                                >
                                                    Ubah Role
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleStatus(u.id, u.is_active)}
                                                    className={`px-3.5 py-1.5 rounded-xl font-bold transition shadow-xs ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'}`}
                                                >
                                                    {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex justify-between items-center pt-5 mt-4 border-t border-gray-200/60">
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
        </DashboardLayout>
    );
}