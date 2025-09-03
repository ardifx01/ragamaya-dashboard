"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
// Impor ikon yang relevan
import {
    DollarSign,
    ShoppingCart,
    Package,
    Loader2,
    AlertCircle,
    Users,
    UserCheck,
    TrendingUp,
    TrendingDown,
    Landmark,
    CheckCircle2,
    XCircle,
    Award,
    BookOpen
} from 'lucide-react';
import RequestAPI from '@/helper/http';
import Sidebar from "@/components/ui/sidebar/Sidebar";

// Registrasi komponen Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

// --- INTERFACES SESUAI RESPONSE API ---
interface MonthlyOrderData {
    month: string;
    total_orders: number;
}

interface MonthlyPayoutData {
    month: string;
    total_payouts: number;
}

interface MonthlyProductData {
    month: string;
    total: number;
}

interface MonthlyUserData {
    month: string;
    total: number;
}

interface MonthlyRevenueData {
    month: string;
    amount: number;
}

interface MonthlyQuizData {
    month: string;
    total: number;
}

interface MonthlyCertificateData {
    month: string;
    total: number;
}

interface RevenueByProduct {
    product_type: string;
    revenue: number;
}

interface AnalyticOrder {
    total_order: number;
    total_order_success: number;
    total_order_failed: number;
    monthly_orders: MonthlyOrderData[];
    monthly_order_success: MonthlyOrderData[];
    monthly_order_failed: MonthlyOrderData[];
}

interface AnalyticPayout {
    total_payout: number;
    total_payout_success: number;
    total_payout_failed: number;
    monthly_payout: MonthlyPayoutData[];
    monthly_payout_success: MonthlyPayoutData[];
    monthly_payout_failed: MonthlyPayoutData[];
}

interface AnalyticProduct {
    total_active_products: number;
    total_digital_products: number;
    total_physical_products: number;
    top_selling_products: any[];
    monthly_new_products: MonthlyProductData[];
}

interface AnalyticUser {
    total_users: number;
    total_sellers: number;
    monthly_new_users: MonthlyUserData[];
    monthly_new_sellers: MonthlyUserData[];
    total_verified_users: number;
}

interface AnalyticRevenue {
    total_revenue: number;
    monthly_revenue: MonthlyRevenueData[];
    average_order_value: number;
    revenue_by_product: RevenueByProduct[];
}

interface AnalyticPlatform {
    total_quizzes: number;
    total_certificates: number;
    monthly_quiz_taken: MonthlyQuizData[];
    monthly_certificates: MonthlyCertificateData[];
    quiz_completion_rate: number;
}

// Interface utama untuk menampung semua data analitik
interface AnalyticsData {
    analytic_order: AnalyticOrder;
    analytic_payout: AnalyticPayout;
    analytic_product: AnalyticProduct;
    analytic_user: AnalyticUser;
    analytic_revenue: AnalyticRevenue;
    analytic_platform: AnalyticPlatform;
}

const AnalyticsDashboard = () => {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await RequestAPI('/analytic/getall', 'get');

                if (response && response.body) {
                    setAnalyticsData(response.body);
                } else {
                    throw new Error("Data analitik tidak ditemukan atau format respons salah");
                }

            } catch (err: any) {
                console.error("Gagal mengambil data:", err);
                setError("Tidak dapat memuat data. Silakan coba lagi nanti.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // --- Chart Data & Options ---
    const revenueChartData = useMemo(() => {
        if (!analyticsData) return { labels: [], datasets: [] };

        const monthlyData = analyticsData.analytic_revenue.monthly_revenue.slice().reverse();
        const labels = monthlyData.map(item => new Date(item.month).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }));
        const data = monthlyData.map(item => item.amount || 0);

        return {
            labels,
            datasets: [{
                label: 'Pendapatan (IDR)',
                data,
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
    }, [analyticsData]);

    const ordersChartData = useMemo(() => {
        if (!analyticsData) return { labels: [], datasets: [] };

        const monthlyOrders = analyticsData.analytic_order.monthly_orders.slice().reverse();
        const monthlySuccess = analyticsData.analytic_order.monthly_order_success.slice().reverse();
        const monthlyFailed = analyticsData.analytic_order.monthly_order_failed.slice().reverse();

        const labels = monthlyOrders.map(item => new Date(item.month).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }));

        return {
            labels,
            datasets: [
                {
                    label: 'Total Pesanan',
                    data: monthlyOrders.map(item => item.total_orders || 0),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Pesanan Berhasil',
                    data: monthlySuccess.map(item => item.total_orders || 0),
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Pesanan Gagal',
                    data: monthlyFailed.map(item => item.total_orders || 0),
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: false,
                    tension: 0.4
                }
            ]
        };
    }, [analyticsData]);

    const userGrowthChartData = useMemo(() => {
        if (!analyticsData) return { labels: [], datasets: [] };

        const monthlyUsers = analyticsData.analytic_user.monthly_new_users.slice().reverse();
        const monthlySellers = analyticsData.analytic_user.monthly_new_sellers.slice().reverse();

        const labels = monthlyUsers.map(item => new Date(item.month).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }));

        return {
            labels,
            datasets: [
                {
                    label: 'Pengguna Baru',
                    data: monthlyUsers.map(item => item.total || 0),
                    borderColor: 'rgb(168, 85, 247)',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Penjual Baru',
                    data: monthlySellers.map(item => item.total || 0),
                    borderColor: 'rgb(245, 158, 11)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: false,
                    tension: 0.4
                }
            ]
        };
    }, [analyticsData]);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: '#e5e7eb' }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        }
    };

    // Fungsi untuk format mata uang
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Hitung success rate
    const orderSuccessRate = useMemo(() => {
        if (!analyticsData) return 0;
        const { total_order, total_order_success } = analyticsData.analytic_order;
        return total_order > 0 ? (total_order_success / total_order) * 100 : 0;
    }, [analyticsData]);

    const payoutSuccessRate = useMemo(() => {
        if (!analyticsData) return 0;
        const { total_payout, total_payout_success } = analyticsData.analytic_payout;
        return total_payout > 0 ? (total_payout_success / total_payout) * 100 : 0;
    }, [analyticsData]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-black text-zinc-300">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-black text-white">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Terjadi Kesalahan</h2>
                <p className="text-gray-400">{error}</p>
            </div>
        );
    }

    return (
        <div>
            <Sidebar activeLink="Dashboard">
                <div className="bg-black text-zinc-300 p-4 sm:p-8">
                    <div className="max-w-7xl mx-auto">
                        <header className="mb-8">
                            <h1 className="text-3xl font-bold">Dashboard Analitik</h1>
                            <p className="text-gray-400 mt-1">Ringkasan performa platform Anda secara keseluruhan.</p>
                        </header>

                        {/* Kartu Statistik Utama */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {/* Total Pendapatan */}
                            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex items-start gap-4">
                                <div className="bg-green-500/10 p-3 rounded-lg">
                                    <DollarSign className="w-6 h-6 text-green-400"/>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Total Pendapatan</p>
                                    <p className="text-2xl font-bold">
                                        {formatCurrency(analyticsData?.analytic_revenue.total_revenue || 0)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        AOV: {formatCurrency(analyticsData?.analytic_revenue.average_order_value || 0)}
                                    </p>
                                </div>
                            </div>

                            {/* Total Pesanan */}
                            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex items-start gap-4">
                                <div className="bg-blue-500/10 p-3 rounded-lg">
                                    <ShoppingCart className="w-6 h-6 text-blue-400"/>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Total Pesanan</p>
                                    <p className="text-2xl font-bold">{analyticsData?.analytic_order.total_order.toLocaleString('id-ID')}</p>
                                    <p className="text-xs text-green-400 mt-1">
                                        {orderSuccessRate.toFixed(1)}% berhasil
                                    </p>
                                </div>
                            </div>

                            {/* Total Pengguna */}
                            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex items-start gap-4">
                                <div className="bg-purple-500/10 p-3 rounded-lg">
                                    <Users className="w-6 h-6 text-purple-400"/>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Total Pengguna</p>
                                    <p className="text-2xl font-bold">{analyticsData?.analytic_user.total_users.toLocaleString('id-ID')}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {analyticsData?.analytic_user.total_verified_users} terverifikasi
                                    </p>
                                </div>
                            </div>

                            {/* Total Produk */}
                            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex items-start gap-4">
                                <div className="bg-yellow-500/10 p-3 rounded-lg">
                                    <Package className="w-6 h-6 text-yellow-400"/>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Total Produk</p>
                                    <p className="text-2xl font-bold">{analyticsData?.analytic_product.total_active_products.toLocaleString('id-ID')}</p>
                                    <p className="text-xs text-blue-400 mt-1">
                                        {analyticsData?.analytic_product.total_digital_products} digital
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Kartu Statistik Sekunder */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                            {/* Pesanan Berhasil */}
                            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-400"/>
                                <div>
                                    <p className="text-xs text-gray-400">Pesanan Berhasil</p>
                                    <p className="text-lg font-bold">{analyticsData?.analytic_order.total_order_success}</p>
                                </div>
                            </div>

                            {/* Pesanan Gagal */}
                            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-3">
                                <XCircle className="w-5 h-5 text-red-400"/>
                                <div>
                                    <p className="text-xs text-gray-400">Pesanan Gagal</p>
                                    <p className="text-lg font-bold">{analyticsData?.analytic_order.total_order_failed}</p>
                                </div>
                            </div>

                            {/* Total Payout */}
                            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-3">
                                <Landmark className="w-5 h-5 text-indigo-400"/>
                                <div>
                                    <p className="text-xs text-gray-400">Total Payout</p>
                                    <p className="text-lg font-bold">{analyticsData?.analytic_payout.total_payout}</p>
                                </div>
                            </div>

                            {/* Total Penjual */}
                            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-3">
                                <UserCheck className="w-5 h-5 text-orange-400"/>
                                <div>
                                    <p className="text-xs text-gray-400">Total Penjual</p>
                                    <p className="text-lg font-bold">{analyticsData?.analytic_user.total_sellers}</p>
                                </div>
                            </div>

                            {/* Total Kuis */}
                            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-3">
                                <BookOpen className="w-5 h-5 text-cyan-400"/>
                                <div>
                                    <p className="text-xs text-gray-400">Total Kuis</p>
                                    <p className="text-lg font-bold">{analyticsData?.analytic_platform.total_quizzes}</p>
                                </div>
                            </div>

                            {/* Total Sertifikat */}
                            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-3">
                                <Award className="w-5 h-5 text-yellow-400"/>
                                <div>
                                    <p className="text-xs text-gray-400">Sertifikat</p>
                                    <p className="text-lg font-bold">{analyticsData?.analytic_platform.total_certificates}</p>
                                </div>
                            </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl text-center">
                                <div className="flex justify-center mb-2">
                                    {orderSuccessRate >= 50 ?
                                        <TrendingUp className="w-6 h-6 text-green-400"/> :
                                        <TrendingDown className="w-6 h-6 text-red-400"/>
                                    }
                                </div>
                                <p className="text-gray-400 text-sm">Tingkat Keberhasilan Pesanan</p>
                                <p className="text-2xl font-bold">{orderSuccessRate.toFixed(1)}%</p>
                            </div>

                            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl text-center">
                                <div className="flex justify-center mb-2">
                                    {payoutSuccessRate >= 50 ?
                                        <TrendingUp className="w-6 h-6 text-green-400"/> :
                                        <TrendingDown className="w-6 h-6 text-red-400"/>
                                    }
                                </div>
                                <p className="text-gray-400 text-sm">Tingkat Keberhasilan Payout</p>
                                <p className="text-2xl font-bold">{payoutSuccessRate.toFixed(1)}%</p>
                            </div>

                            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl text-center">
                                <div className="flex justify-center mb-2">
                                    <BookOpen className="w-6 h-6 text-blue-400"/>
                                </div>
                                <p className="text-gray-400 text-sm">Tingkat Penyelesaian Kuis</p>
                                <p className="text-2xl font-bold">{analyticsData?.analytic_platform.quiz_completion_rate.toFixed(1)}%</p>
                            </div>
                        </div>

                        {/* Grafik Chart */}
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
                                    <h2 className="text-xl font-semibold mb-4 text-zinc-200">Grafik Pendapatan Bulanan</h2>
                                    <Line options={chartOptions} data={revenueChartData}/>
                                </div>
                                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
                                    <h2 className="text-xl font-semibold mb-4 text-zinc-200">Grafik Pesanan Bulanan</h2>
                                    <Line options={chartOptions} data={ordersChartData}/>
                                </div>
                            </div>

                            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
                                <h2 className="text-xl font-semibold mb-4 text-zinc-200">Pertumbuhan Pengguna & Penjual</h2>
                                <Line options={chartOptions} data={userGrowthChartData}/>
                            </div>
                        </div>
                    </div>
                </div>
            </Sidebar>
        </div>
    );
};

export default AnalyticsDashboard;