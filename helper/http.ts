import axios from 'axios';
import Cookies from "js-cookie";

// --- PENYESUAIAN PENTING: RequestAPI disempurnakan untuk handle GET request ---

export const RequestAPI = async (path: string, method: "get" | "post" | "delete" | "put", body?: any, overrideToPatchMethod?: boolean) => {
    // Ambil token setiap kali fungsi dipanggil, untuk kasus login, token ini akan undefined
    const token = Cookies.get("access_token");
    const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API;

    if (!BASE_API_URL) {
        throw new Error("NEXT_PUBLIC_BASE_API is not defined in your environment variables.");
    }

    const isGetMethod = method.toLowerCase() === 'get';

    try {
        const headers: any = {};

        // Hanya tambahkan header Authorization jika token ada
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (!isGetMethod) {
            headers['Content-Type'] = 'application/json';
            headers['X-HTTP-Method-Override'] = overrideToPatchMethod ? 'PATCH' : method.toUpperCase();
        }

        const response = await axios({
            url: `${BASE_API_URL}${path}`,
            method: overrideToPatchMethod ? 'POST' : method,
            headers: headers,
            params: isGetMethod ? body : undefined,
            data: !isGetMethod ? body : undefined,
        });

        return response.data;
    } catch (error: any) {
        console.error('API Request failed:', error.response?.data || error.message);
        // Lemparkan pesan error dari server jika ada, jika tidak, lemparkan pesan error umum
        throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
};

export default RequestAPI;