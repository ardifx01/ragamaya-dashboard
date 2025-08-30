import axios from 'axios';
import Cookies from "js-cookie";

// --- PENYESUAIAN PENTING: RequestAPI disempurnakan untuk handle GET request ---
const RequestAPI = async (path: string, method: "get" | "post" | "delete" | "put", body?: any, overrideToPatchMethod?: boolean) => {
    const token = Cookies.get("access_token");
    const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API;

    const isGetMethod = method.toLowerCase() === 'get';

    try {
        // Konfigurasi headers
        const headers: any = {
            Authorization: `Bearer ${token}`,
        };
        // GET request tidak butuh Content-Type atau X-HTTP-Method-Override
        if (!isGetMethod) {
            // Memberitahu server bahwa body yang dikirim adalah format JSON
            headers['Content-Type'] = 'application/json';

            // Header ini tetap bisa digunakan jika server Anda membutuhkannya
            headers['X-HTTP-Method-Override'] = overrideToPatchMethod ? 'PATCH' : method.toUpperCase();
        }

        const response = await axios({
            url: `${BASE_API_URL}${path}`,
            method: overrideToPatchMethod ? 'POST' : method,
            headers: headers,
            // Gunakan 'params' untuk GET, 'data' untuk method lainnya (POST, DELETE, etc)
            params: isGetMethod ? body : undefined,
            data: !isGetMethod ? body : undefined,
        });

        return response.data;
    } catch (error: any) {
        console.error('API Request failed:', error);
        throw error.response?.data || new Error(error.message || 'API Request failed');
    }
};

export default RequestAPI;