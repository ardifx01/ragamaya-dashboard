"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';
import { Loader2, Search, Filter, RefreshCw, Edit, Trash2, Eye, Plus, HelpCircle, Clock } from 'lucide-react';
import {addToast, Button, useDisclosure} from '@heroui/react';
import RequestAPI from '@/helper/http';
import MyModal from "@/components/ui/MyModal";
import { IconCancel, IconTrash } from "@tabler/icons-react";
import ModalAddQuiz from "@/components/quiz/ModalAddQuiz";
import ModalEditQuiz from "@/components/quiz/ModalEditQuiz";
// Impor modal untuk kuis, misalnya:
// import ModalAddQuiz from "@/components/quiz/ModalAddQuiz";

// --- INTERFACE SESUAI JSON API DARI /quiz/search ---
interface Category {
    uuid: string;
    name: string;
}

interface QuizItem {
    uuid: string;
    slug: string;
    title: string;
    level: 'beginner' | 'intermediate' | 'advanced'; // Asumsi level memiliki tipe ini
    estimate: number;
    minimum_score: number;
    total_questions: number;
    category: Category;
}

// --- FUNGSI FETCH DATA ---
const fetchAllQuizzes = async (): Promise<QuizItem[]> => {
    try {
        const response = await RequestAPI('/quiz/search', 'get');
        return response.body || [];
    } catch (error) {
        console.error("Failed to fetch all quizzes:", error);
        addToast({
            title: 'Error',
            description: 'Gagal memuat data kuis.',
            color: 'danger',
        });
        return [];
    }
};

// --- DEFINISI COLUMN HELPER ---
const quizColumnHelper = createColumnHelper<QuizItem>();

const TableQuiz: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
    const [filteredQuizzes, setFilteredQuizzes] = useState<QuizItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // QuizDelete
    const [editQuizID, setEditQuizID] = useState<string | null>(null);
    const [deleteQuizID, setDeleteQuizID] = useState<string | null>(null);

    // Modal
    // Ganti dengan modal untuk menambah kuis
    const modalAddQuiz = useDisclosure();
    const modalEditQuiz = useDisclosure();
    const modalDeleteQuiz = useDisclosure();

    // --- FUNGSI PENGAMBILAN DATA ---
    const loadQuizData = useCallback(async () => {
        setLoading(true);
        const data = await fetchAllQuizzes();
        setQuizzes(data);
        setLoading(false);
    }, []);

    // --- GET UNIQUE CATEGORIES ---
    const categories = useMemo(() => {
        const uniqueCategories = Array.from(
            new Set(quizzes.map(quiz => quiz.category.uuid))
        ).map(uuid => {
            return quizzes.find(quiz => quiz.category.uuid === uuid)?.category;
        }).filter(Boolean) as Category[];

        return uniqueCategories;
    }, [quizzes]);

    // --- DEFINISI KOLOM TABEL ---
    const columns = useMemo(() => [
        quizColumnHelper.accessor('title', {
            header: 'Judul Kuis',
            cell: info => {
                const title = info.getValue();
                const slug = info.row.original.slug;
                return (
                    <div>
                        <div className="font-medium text-white line-clamp-2" title={title}>
                            {title}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">
                            Slug: {slug}
                        </div>
                    </div>
                );
            }
        }),
        quizColumnHelper.accessor('category', {
            header: 'Kategori',
            cell: info => (
                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                    {info.getValue().name}
                </div>
            )
        }),
        quizColumnHelper.accessor('level', {
            header: 'Level',
            cell: info => {
                const level = info.getValue();
                const levelColors = {
                    beginner: 'bg-green-500/10 text-green-400',
                    intermediate: 'bg-yellow-500/10 text-yellow-400',
                    advanced: 'bg-red-500/10 text-red-400',
                };
                return (
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${levelColors[level] || 'bg-zinc-500/10 text-zinc-400'}`}>
                        {level}
                    </div>
                );
            }
        }),
        quizColumnHelper.accessor(row => ({ questions: row.total_questions, estimate: row.estimate }), {
            id: 'quiz_info',
            header: 'Info Kuis',
            cell: info => {
                const { questions, estimate } = info.getValue();
                return (
                    <div className="flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center gap-2 text-zinc-300">
                            <HelpCircle className="w-4 h-4 text-zinc-500" />
                            <span>{questions} Pertanyaan</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300">
                            <Clock className="w-4 h-4 text-zinc-500" />
                            <span>Estimasi {estimate} Menit</span>
                        </div>
                    </div>
                );
            }
        }),
        quizColumnHelper.display({
            id: 'actions',
            header: 'Aksi',
            cell: info => {
                const quiz = info.row.original;
                const isCurrentActionLoading = actionLoading === quiz.uuid;

                return (
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            color="primary"
                            variant="light"
                            onPress={() => {
                                // Arahkan ke halaman detail kuis
                                window.open(`/education/quiz/${quiz.slug}`, '_blank');
                            }}
                            isIconOnly
                            aria-label="Lihat Kuis"
                        >
                            <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            color="warning"
                            variant="light"
                            onPress={() => {
                                modalEditQuiz.onOpen()
                                setActionLoading(quiz.uuid)
                                setEditQuizID(quiz.uuid)
                            }}
                            disabled={isCurrentActionLoading}
                            isIconOnly
                            aria-label="Edit Kuis"
                        >
                            {isCurrentActionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Edit className="w-4 h-4" />}
                        </Button>
                        <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            onPress={() => {
                                modalDeleteQuiz.onOpen();
                                setDeleteQuizID(quiz.uuid);
                            }}
                            disabled={isCurrentActionLoading}
                            isIconOnly
                            aria-label="Hapus Kuis"
                        >
                            {isCurrentActionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                        </Button>
                    </div>
                );
            }
        })
    ], [actionLoading]);

    // --- DATA FETCH & FILTER LOGIC ---
    useEffect(() => {
        loadQuizData();
    }, [loadQuizData]);

    useEffect(() => {
        let data = [...quizzes];

        if (categoryFilter !== 'all') {
            data = data.filter(item => item.category.uuid === categoryFilter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            data = data.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.slug.toLowerCase().includes(query) ||
                item.category.name.toLowerCase().includes(query)
            );
        }

        setFilteredQuizzes(data);
    }, [quizzes, categoryFilter, searchQuery]);

    const table = useReactTable({
        data: filteredQuizzes,
        columns,
        getCoreRowModel: getCoreRowModel()
    });

    const handleDeleteQuiz = async () => {
        if (!deleteQuizID) return;
        setLoading(true);
        try {
            // Sesuaikan endpoint delete jika berbeda
            const response = await RequestAPI(`/quiz/delete/${deleteQuizID}`, 'delete');

            if (response.status === 200) {
                addToast({
                    title: 'Sukses',
                    description: 'Berhasil Menghapus Kuis',
                    color: 'success',
                });
                modalDeleteQuiz.onClose();
                await loadQuizData();
            } else {
                throw new Error(response.message || 'Gagal menghapus kuis');
            }
        } catch (error: any) {
            addToast({
                title: 'Error',
                description: error.message,
                color: 'danger',
            });
            console.error('Delete error:', error);
        } finally {
            setLoading(false);
            setDeleteQuizID(null);
        }
    }

    const handleEditModalOnClose = () => {
        setActionLoading(null)
        modalEditQuiz.onClose();
    }

    const handleSuccessAction = async () => {
        await loadQuizData();
    }

    // --- RENDER ---
    return <>
        <div className="min-h-screen bg-black text-zinc-300 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Manajemen Kuis</h1>
                        <p className="text-zinc-400 mt-1">Kelola dan cari semua kuis yang tersedia.</p>
                    </div>
                    <Button
                        color="primary"
                        variant="solid"
                        size="md"
                        onPress={modalAddQuiz.onOpen} // Buka modal tambah kuis
                        startContent={<Plus className="w-4 h-4" />}
                        className="self-start sm:self-auto"
                    >
                        Tambah Kuis
                    </Button>
                </header>

                <div className="bg-transparent rounded-lg border border-zinc-900">
                    <div className="p-4 border-b border-zinc-900 flex flex-wrap items-center gap-4">
                        <Button
                            variant="light"
                            size="md"
                            onPress={loadQuizData}
                            disabled={loading}
                            isIconOnly
                            className="border-zinc-800 text-zinc-400 hover:text-white"
                            aria-label="Muat Ulang"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>

                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className="w-full sm:w-auto bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Semua Kategori</option>
                                {categories.map(category => (
                                    <option key={category.uuid} value={category.uuid}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Cari judul kuis, slug, atau kategori..."
                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                            />
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
                                <tr>
                                    <td colSpan={columns.length} className="text-center p-16">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="text-center p-16">
                                        <h3 className="text-lg font-semibold">Tidak Ada Kuis</h3>
                                        <p className="text-sm text-zinc-500">Saat ini tidak ada kuis yang ditemukan.</p>
                                    </td>
                                </tr>
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

        <ModalAddQuiz
            isOpen={modalAddQuiz.isOpen}
            onOpen={modalAddQuiz.onOpen}
            onOpenChange={modalAddQuiz.onOpenChange}
            onClose={modalAddQuiz.onClose}
            onSubmitSuccess={() => window.location.reload()}
        />

        <ModalEditQuiz
            uuid={editQuizID ?? ''}
            isOpen={modalEditQuiz.isOpen}
            onOpen={modalEditQuiz.onOpen}
            onOpenChange={modalEditQuiz.onOpenChange}
            onClose={handleEditModalOnClose}
            onSubmitSuccess={handleSuccessAction}
        />

        <MyModal title="Hapus Kuis" isOpen={modalDeleteQuiz.isOpen} onOpen={modalDeleteQuiz.onOpen} onOpenChange={modalDeleteQuiz.onOpenChange}>
            <p className="text-zinc-400 mb-4">Apakah Anda yakin ingin menghapus kuis ini secara permanen?</p>
            <div className="flex gap-2">
                <Button
                    onPress={() => modalDeleteQuiz.onClose()}
                    isLoading={loading}
                    color="default" className="w-6/12" variant="ghost"
                >
                    <IconCancel /> Batal
                </Button>
                <Button
                    onPress={handleDeleteQuiz}
                    isLoading={loading}
                    color="danger" className="w-6/12" variant="solid"
                >
                    <IconTrash /> Hapus
                </Button>
            </div>
        </MyModal>
    </>;
};

export default TableQuiz;