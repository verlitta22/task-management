const API_URL = 'http://localhost:8080/api/v1';

export async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        // Tangani Error 401: Token kedaluwarsa atau tidak valid
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
            throw new Error('Sesi telah berakhir. Silakan login kembali.');
        }

        // Tangani Error 403: Akses dilarang / role tidak diizinkan / akun nonaktif
        if (response.status === 403) {
            alert('Akses Ditolak: Anda tidak memiliki izin atau akun Anda dinonaktifkan.');
            throw new Error('Akses dilarang.');
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Terjadi kesalahan pada server');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error.message);
        throw error;
    }
}