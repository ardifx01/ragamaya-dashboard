"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';
import { Loader2, Search, Filter, RefreshCw, Edit, Trash2, Eye, Plus } from 'lucide-react';
import {Button, useDisclosure} from '@heroui/react';
import RequestAPI from '@/helper/http';

// --- INTERFACES SESUAI JSON API ---
interface Category {
    uuid: string;
    name: string;
}

interface ArticleItem {
    uuid: string;
    slug: string;
    title: string;
    thumbnail: string;
    created_at: string;
    category: Category;
}

// --- FUNGSI FETCH DATA ---
const fetchAllArticles = async (): Promise<ArticleItem[]> => {
    try {
        const response = await RequestAPI('/article/search', 'get');
        // Urutkan data berdasarkan tanggal terbaru
        const data = response.body || [];
        data.sort((a: ArticleItem, b: ArticleItem) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        return data;
    } catch (error) {
        console.error("Failed to fetch all articles:", error);
        return [];
    }
};

// --- DEFINISI COLUMN HELPER ---
const articleColumnHelper = createColumnHelper<ArticleItem>();

const TableArticle: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [articles, setArticles] = useState<ArticleItem[]>([]);
    const [filteredArticles, setFilteredArticles] = useState<ArticleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    // State untuk melacak loading pada baris tertentu saat aksi diproses
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // --- FUNGSI PENGAMBILAN DATA ---
    const loadArticleData = useCallback(async () => {
        setLoading(true);
        const data = await fetchAllArticles();
        setArticles(data);
        setLoading(false);
    }, []);

    // --- GET UNIQUE CATEGORIES ---
    const categories = useMemo(() => {
        const uniqueCategories = Array.from(
            new Set(articles.map(article => article.category.uuid))
        ).map(uuid => {
            return articles.find(article => article.category.uuid === uuid)?.category;
        }).filter(Boolean) as Category[];

        return uniqueCategories;
    }, [articles]);

    // --- DEFINISI KOLOM TABEL ---
    const columns = useMemo(() => [
        articleColumnHelper.accessor('thumbnail', {
            header: 'Thumbnail',
            cell: info => {
                const thumbnailUrl = info.getValue();
                return (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-700">
                        <img
                            src={thumbnailUrl}
                            alt="Article thumbnail"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.src = '/placeholder-image.jpg'; // fallback image
                            }}
                        />
                    </div>
                );
            }
        }),
        articleColumnHelper.accessor('title', {
            header: 'Judul Artikel',
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
        articleColumnHelper.accessor('category', {
            header: 'Kategori',
            cell: info => {
                const category = info.getValue();
                return (
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                        {category.name}
                    </div>
                );
            }
        }),
        articleColumnHelper.accessor('created_at', {
            header: 'Tanggal Dibuat',
            cell: info => {
                const date = new Date(info.getValue());
                return (
                    <div>
                        <div className="text-white font-medium">
                            {date.toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </div>
                        <div className="text-xs text-zinc-400">
                            {date.toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                );
            }
        }),
        articleColumnHelper.display({
            id: 'actions',
            header: 'Aksi',
            cell: info => {
                const article = info.row.original;
                const isCurrentActionLoading = actionLoading === article.uuid;

                return (
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            color="primary"
                            variant="light"
                            onPress={() => {
                                // Navigate to article detail or open in new tab
                                window.open(`/article/${article.slug}`, '_blank');
                            }}
                            isIconOnly
                            aria-label="Lihat Artikel"
                        >
                            <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            color="warning"
                            variant="light"
                            onPress={() => handleUpdateArticle(article.uuid)}
                            disabled={isCurrentActionLoading}
                            isIconOnly
                            aria-label="Edit Artikel"
                        >
                            {isCurrentActionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Edit className="w-4 h-4" />}
                        </Button>
                        <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            onPress={() => handleDeleteArticle(article.uuid)}
                            disabled={isCurrentActionLoading}
                            isIconOnly
                            aria-label="Hapus Artikel"
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
        loadArticleData();
    }, [loadArticleData]);

    useEffect(() => {
        let data = [...articles];

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

        setFilteredArticles(data);
    }, [articles, categoryFilter, searchQuery]);

    const table = useReactTable({
        data: filteredArticles,
        columns,
        getCoreRowModel: getCoreRowModel()
    });

    // --- HANDLER FUNCTIONS ---
    const handleAddArticle = () => {
        // Redirect ke halaman tambah artikel atau buka modal tambah
        // window.location.href = '/admin/articles/create';
        // atau
        // openCreateModal();

        console.log('Add new article');
    };

    const handleUpdateArticle = async (articleUuid: string) => {
        setActionLoading(articleUuid);

        try {
            // Implementasi update artikel - sesuaikan dengan API endpoint Anda
            // const response = await RequestAPI(`/article/${articleUuid}`, 'put', updateData);

            // Untuk sementara, simulasi API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Redirect ke halaman edit atau buka modal edit
            // window.location.href = `/admin/articles/edit/${articleUuid}`;
            // atau
            // openEditModal(articleUuid);

            console.log('Update article:', articleUuid);

        } catch (error) {
            console.error('Failed to update article:', error);
            // Handle error (show toast, etc.)
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteArticle = async (articleUuid: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus artikel ini? Tindakan ini tidak dapat dibatalkan.')) {
            return;
        }

        setActionLoading(articleUuid);

        try {
            // Implementasi delete artikel - sesuaikan dengan API endpoint Anda
            // const response = await RequestAPI(`/article/${articleUuid}`, 'delete');

            // Untuk sementara, simulasi API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Refresh data setelah berhasil delete
            await loadArticleData();

            console.log('Delete article:', articleUuid);

        } catch (error) {
            console.error('Failed to delete article:', error);
            // Handle error (show toast, etc.)
        } finally {
            setActionLoading(null);
        }
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-black text-zinc-300 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Pencarian Artikel</h1>
                        <p className="text-zinc-400 mt-1">Kelola dan cari semua artikel yang tersedia.</p>
                    </div>
                    <Button
                        color="primary"
                        variant="solid"
                        size="md"
                        onPress={handleAddArticle}
                        startContent={<Plus className="w-4 h-4" />}
                        className="self-start sm:self-auto"
                    >
                        Tambah Artikel
                    </Button>
                </header>

                <div className="bg-transparent rounded-lg border border-zinc-900">
                    <div className="p-4 border-b border-zinc-900 flex flex-wrap items-center gap-4">
                        <Button
                            variant="light"
                            size="md"
                            onPress={loadArticleData}
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
                                placeholder="Cari judul artikel, slug, atau kategori..."
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
                                        <h3 className="text-lg font-semibold">Tidak Ada Artikel</h3>
                                        <p className="text-sm text-zinc-500">Saat ini tidak ada artikel yang ditemukan.</p>
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
    );
};

export default TableArticle;