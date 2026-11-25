const API_BASE_URL = 'http://localhost:8080/api/v1';

export async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });
    } catch (networkError) {
        throw new Error('Gagal terhubung ke server. Periksa koneksi Anda.');
    }

    // Tangani status Unauthorized (401) secara spesifik
    if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Sesi telah berakhir. Silakan login kembali.');
    }

    let data;
    try {
        data = await response.json();
    } catch (jsonError) {
        data = {};
    }

    if (!response.ok) {
        throw new Error(data.error || data.message || 'Terjadi kesalahan pada server');
    }

    return data;
}