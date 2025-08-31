"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';
import { Loader2, Search, Filter, RefreshCw, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import {Button, useDisclosure} from '@heroui/react';
import RequestAPI from '@/helper/http';
import PayoutResponseModal from "@/components/withdraw/PayoutResponseModal";

// --- INTERFACES SESUAI JSON API ---
interface User {
    uuid: string;
    email: string;
    name: string;
    avatar_url: string;
}

interface TransactionReceipt {
    receipt_url?: string;
    note?: string;
}

interface PayoutGetAllItem {
    uuid: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    bank_name: string;
    bank_account: string;
    bank_account_name: string;
    created_at: string;
    transaction_receipt: TransactionReceipt;
    user: User;
}

interface DataPayoutResponse {
    payoutID: string;
    status: 'completed' | 'failed';
}

// --- FUNGSI FETCH DATA ---
const fetchAllPayouts = async (): Promise<PayoutGetAllItem[]> => {
    try {
        const response = await RequestAPI('/wallet/payout/getall', 'get');
        // Urutkan data agar yang pending muncul paling atas
        const data = response.body || [];
        data.sort((a: PayoutGetAllItem, b: PayoutGetAllItem) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        return data;
    } catch (error) {
        console.error("Failed to fetch all payouts:", error);
        return [];
    }
};

// --- DEFINISI COLUMN HELPER ---
const payoutColumnHelper = createColumnHelper<PayoutGetAllItem>();

const TablePayoutRequestsPage: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [payouts, setPayouts] = useState<PayoutGetAllItem[]>([]);
    const [filteredPayouts, setFilteredPayouts] = useState<PayoutGetAllItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    // State untuk melacak loading pada baris tertentu saat aksi diproses
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    // State uuntuk action respon
    const [dataPayoutRequest, setDataPayoutRequest] = useState<DataPayoutResponse>();

    // modal
    const modalPayoutResponse = useDisclosure()

    // --- FUNGSI PENGAMBILAN DATA ---
    const loadPayoutData = useCallback(async () => {
        setLoading(true);
        const data = await fetchAllPayouts();
        setPayouts(data);
        setLoading(false);
    }, []);

    // --- DEFINISI KOLOM TABEL ---
    const columns = useMemo(() => [
        payoutColumnHelper.accessor('user', {
            header: 'Pengguna',
            cell: info => {
                const user = info.getValue();
                return (
                    <div className="flex items-center gap-3">
                        <img src={user.avatar_url} alt={user.name} className="w-9 h-9 rounded-full object-cover bg-zinc-700" />
                        <div>
                            <div className="font-medium text-white">{user.name}</div>
                            <div className="text-xs text-zinc-400">{user.email}</div>
                        </div>
                    </div>
                );
            }
        }),
        payoutColumnHelper.accessor('amount', {
            header: 'Jumlah',
            cell: info => <div className="font-semibold text-red-400">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(info.getValue())}</div>
        }),
        payoutColumnHelper.accessor('status', {
            header: 'Status',
            cell: info => {
                const status = info.getValue();
                let style = '';
                switch(status) {
                    case 'completed': style = 'bg-green-500/10 text-green-400'; break;
                    case 'pending': style = 'bg-yellow-500/10 text-yellow-400'; break;
                    case 'failed': style = 'bg-red-500/10 text-red-400'; break;
                }
                return <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${style}`}>{status}</div>;
            }
        }),
        payoutColumnHelper.accessor(row => ({ name: row.bank_account_name, bank: row.bank_name, account: row.bank_account }), {
            id: 'bankInfo',
            header: 'Info Bank',
            cell: info => (
                <div>
                    <div className="font-medium text-white">{info.getValue().name}</div>
                    <div className="text-xs text-zinc-400 uppercase">{info.getValue().bank} - {info.getValue().account}</div>
                </div>
            )
        }),
        payoutColumnHelper.accessor('transaction_receipt', {
            header: 'Bukti Transaksi',
            cell: info => {
                const receipt = info.getValue();
                if (!receipt.receipt_url) {
                    return <span className="text-xs text-zinc-500">-</span>;
                }
                return (
                    <a href={receipt.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs">
                        Lihat Bukti <ExternalLink className="w-3 h-3"/>
                    </a>
                );
            }
        }),
        payoutColumnHelper.display({
            id: 'actions',
            header: 'Aksi',
            cell: info => {
                const payout = info.row.original;
                const isCurrentActionLoading = actionLoading === payout.uuid;

                if (payout.status !== 'pending') {
                    return <span className="text-xs text-zinc-500 italic">Tindakan selesai</span>;
                }

                return (
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            color="success"
                            variant="light"
                            onPress={() => {
                                modalPayoutResponse.onOpen()
                                setActionLoading(payout.uuid)
                                setDataPayoutRequest({
                                    payoutID: payout.uuid,
                                    status: 'completed',
                                })
                            }}
                            disabled={isCurrentActionLoading}
                            isIconOnly
                            aria-label="Terima"
                        >
                            {isCurrentActionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4" />}
                        </Button>
                        <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            onPress={() => {
                                modalPayoutResponse.onOpen()
                                setActionLoading(payout.uuid)
                                setDataPayoutRequest({
                                    payoutID: payout.uuid,
                                    status: 'failed',
                                })
                            }}
                            disabled={isCurrentActionLoading}
                            isIconOnly
                            aria-label="Tolak"
                        >
                            {isCurrentActionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <XCircle className="w-4 h-4" />}
                        </Button>
                    </div>
                );
            }
        })
    ], [actionLoading]);

    // --- DATA FETCH & FILTER LOGIC ---
    useEffect(() => {
        loadPayoutData();
    }, [loadPayoutData]);

    useEffect(() => {
        let data = [...payouts];
        if (statusFilter !== 'all') {
            data = data.filter(item => item.status === statusFilter);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            data = data.filter(item =>
                item.user.name.toLowerCase().includes(query) ||
                item.user.email.toLowerCase().includes(query) ||
                item.bank_account_name.toLowerCase().includes(query) ||
                item.bank_account.includes(query)
            );
        }
        setFilteredPayouts(data);
    }, [payouts, statusFilter, searchQuery]);

    const table = useReactTable({ data: filteredPayouts, columns, getCoreRowModel: getCoreRowModel() });

    const handleModalClose = React.useCallback(() => {
        setActionLoading(null)
    }, [setActionLoading]);

    const handleSubmitted = React.useCallback(() => {
        setActionLoading(null)
        loadPayoutData()
    }, [setActionLoading, loadPayoutData]);

    // --- RENDER ---
    return <>
        <div className="min-h-screen bg-black text-zinc-300 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Permintaan Penarikan Dana</h1>
                    <p className="text-zinc-400 mt-1">Kelola semua permintaan penarikan dana dari pengguna.</p>
                </header>

                <div className="bg-transparent rounded-lg border border-zinc-900">
                    <div className="p-4 border-b border-zinc-900 flex flex-wrap items-center gap-4">
                        <Button variant="light" size="md" onPress={loadPayoutData} disabled={loading} isIconOnly className="border-zinc-800 text-zinc-400 hover:text-white" aria-label="Muat Ulang">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full sm:w-auto bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500">
                                <option value="all">Semua Status</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari nama pengguna, email, atau rekening..." className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500"/>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead>
                            {table.getHeaderGroups().map(hg => (
                                <tr key={hg.id}>
                                    {hg.headers.map(h => (
                                        <th key={h.id} className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                            {flexRender(h.column.columnDef.header, h.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                            </thead>
                            <tbody>
                            {loading ? (
                                <tr><td colSpan={columns.length} className="text-center p-16"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></td></tr>
                            ) : table.getRowModel().rows.length === 0 ? (
                                <tr><td colSpan={columns.length} className="text-center p-16"><h3 className="text-lg font-semibold">Tidak Ada Permintaan</h3><p className="text-sm text-zinc-500">Saat ini tidak ada permintaan penarikan dana.</p></td></tr>
                            ) : (
                                table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="px-6 py-4 whitespace-nowrap align-top">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <PayoutResponseModal
            payoutID={dataPayoutRequest?.payoutID ?? ''}
            status={dataPayoutRequest?.status ?? 'failed'}
            isOpen={modalPayoutResponse.isOpen}
            onOpen={modalPayoutResponse.onOpen}
            onOpenChange={modalPayoutResponse.onOpenChange}
            onClose={modalPayoutResponse.onClose}
            onModalClose={handleModalClose}
            onSubmitSuccess={handleSubmitted}
        />
    </>;
};

export default TablePayoutRequestsPage;