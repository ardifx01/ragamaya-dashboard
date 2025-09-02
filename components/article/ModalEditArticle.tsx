"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {Input, Button, Textarea, Card, CardBody, addToast, Spinner} from '@heroui/react';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginImageTransform from 'filepond-plugin-image-transform';
import FilePondPluginFileEncode from 'filepond-plugin-file-encode';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import RequestAPI from '@/helper/http';
import Cookies from "js-cookie";
import MyModal from "@/components/ui/MyModal";

// Register the plugins
registerPlugin(
    FilePondPluginImageExifOrientation,
    FilePondPluginImagePreview,
    FilePondPluginFileValidateType,
    FilePondPluginFileValidateSize,
    FilePondPluginImageTransform,
    FilePondPluginFileEncode
);

// --- Types ---
interface ArticleDetail {
    uuid: string;
    slug: string;
    title: string;
    thumbnail: string;
    content: string;
    created_at: string;
    category: {
        uuid: string;
        name: string;
    };
}

interface ArticleFormData {
    title: string;
    content: string;
    category: string;
}

// Tipe untuk file yang ditampilkan di FilePond
interface FilePondInitialFile {
    source: string;
    options: {
        type: 'local' | 'limbo';
    };
}

interface EditArticleModalProps {
    isOpen: boolean;
    onOpen: () => void;
    onOpenChange: (isOpen: boolean) => void;
    onClose: () => void;
    onSubmitSuccess?: () => void;
    slug: string | null; // Slug untuk fetch data
    uuid: string | null; // UUID untuk update
}

// --- Validation Schema ---
const articleSchema = z.object({
    title: z.string().min(10, "Judul artikel minimal 10 karakter"),
    content: z.string().min(50, "Konten artikel minimal 50 karakter"),
    category: z.string().min(3, "Kategori harus diisi"),
});

// --- Main Component ---
const ModalEditArticle: React.FC<EditArticleModalProps> = ({
   isOpen,
   onClose,
   onOpen,
   onOpenChange,
   onSubmitSuccess,
   slug,
   uuid
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isDirty },
        reset
    } = useForm<ArticleFormData>({
        resolver: zodResolver(articleSchema),
    });

    const thumbnailPond = useRef<FilePond>(null);
    const newThumbnailUrlRef = useRef<string | null>(null);
    const [initialData, setInitialData] = useState<ArticleDetail | null>(null);
    const [files, setFiles] = useState<FilePondInitialFile[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Fetch article data when modal opens and slug is available
    useEffect(() => {
        const fetchArticle = async () => {
            if (slug) {
                setIsLoadingData(true);
                try {
                    const response = await RequestAPI(`/article/${slug}`, 'get');
                    if (response.status === 200 && response.body) {
                        const article: ArticleDetail = response.body;
                        reset({
                            title: article.title,
                            content: article.content,
                            category: article.category.name,
                        });
                        setInitialData(article);
                        if (article.thumbnail) {
                            setFiles([{
                                source: article.thumbnail,
                                options: { type: 'local' }
                            }]);
                        }
                    } else {
                        addToast({ title: 'Error', description: 'Gagal memuat data artikel.', color: 'danger' });
                        onClose();
                    }
                } catch (error) {
                    console.error('Fetch error:', error);
                    addToast({ title: 'Error', description: 'Terjadi kesalahan saat memuat artikel.', color: 'danger' });
                    onClose();
                } finally {
                    setIsLoadingData(false);
                }
            }
        };

        if (isOpen) {
            fetchArticle();
        }
    }, [isOpen, slug, reset, onClose]);

    const onSubmit = async (data: ArticleFormData) => {
        if (!uuid || !initialData) return;

        const newThumbnail = newThumbnailUrlRef.current;

        try {
            // --- LOGIKA BARU & LEBIH ANDAL ---
            // Kondisi 1: `isDirty` akan `true` jika ada perubahan pada field input teks.
            // Kondisi 2: `newThumbnail` akan berisi URL jika ada thumbnail baru.
            // Jika KEDUA kondisi ini false, berarti tidak ada perubahan sama sekali.
            if (!isDirty && !newThumbnail) {
                addToast({ title: 'Info', description: 'Tidak ada perubahan untuk disimpan.', color: 'primary' });
                return;
            }

            // Pembuatan payload tetap sama, karena sudah benar.
            const payload = {
                title: data.title,
                content: data.content,
                category: data.category,
                thumbnail: newThumbnail ? newThumbnail : initialData.thumbnail,
            };

            const response = await RequestAPI(`/article/update/${uuid}`, 'put', payload);

            // ... sisa kode tidak berubah ...
            if (response.status === 200) {
                addToast({ title: 'Success', description: 'Berhasil memperbarui artikel.', color: 'success' });
                handleModalClose(false);
                onSubmitSuccess?.();
            } else {
                addToast({ title: 'Error', description: response.message || 'Gagal memperbarui artikel.', color: 'danger' });
            }
        } catch (error: any) {
            addToast({ title: 'Error', description: 'Terjadi kesalahan saat memperbarui artikel.', color: 'danger' });
            console.error('Submit error:', error);
        }
    };

    const filePondServerConfig = () => {
        const url = `${process.env.NEXT_PUBLIC_BASE_API}/storage/upload`;
        return {
            process: {
                url: url,
                headers: { Authorization: `Bearer ${Cookies.get("access_token")}` },
                onload: (response: any): string => {
                    try {
                        const res = JSON.parse(response);
                        return res?.body?.public_url || '';
                    } catch (e) {
                        return '';
                    }
                },
            },
            revert: null,
        };
    };

    const handleModalClose = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            setInitialData(null);
            newThumbnailUrlRef.current = null; // RESET REF DI SINI JUGA
            setFiles([]);
            thumbnailPond.current?.removeFiles();
        }
        onOpenChange(isOpen);
    };

    const inputWrapperClassNames = "bg-zinc-900/50 hover:bg-zinc-900/50 border border-zinc-800 rounded-lg data-[hover=true]:border-zinc-700 group-data-[focus=true]:border-blue-500";

    return (
        <MyModal
            size="4xl"
            title="Edit Artikel"
            isOpen={isOpen}
            onOpen={onOpen}
            onOpenChange={handleModalClose}
        >
            {isLoadingData ? (
                <div className="flex justify-center items-center h-96">
                    <Spinner size="lg" />
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Input {...register("title")} label="Judul Artikel" isInvalid={!!errors.title} errorMessage={errors.title?.message} isDisabled={isSubmitting} fullWidth classNames={{ inputWrapper: inputWrapperClassNames }}/>
                    <Input {...register("category")} label="Kategori" isInvalid={!!errors.category} errorMessage={errors.category?.message} isDisabled={isSubmitting} fullWidth classNames={{ inputWrapper: inputWrapperClassNames }} />
                    <Textarea {...register("content")} label="Konten Artikel" isInvalid={!!errors.content} errorMessage={errors.content?.message} isDisabled={isSubmitting} fullWidth minRows={10} classNames={{ inputWrapper: inputWrapperClassNames }} />

                    <Card className="bg-zinc-900/50 border border-zinc-800">
                        <CardBody className="space-y-3">
                            <h4 className="text-sm font-medium text-zinc-300">Thumbnail Artikel</h4>
                            <FilePond
                                ref={thumbnailPond}
                                files={files}
                                allowMultiple={false}
                                maxFiles={1}
                                acceptedFileTypes={['image/png', 'image/jpeg', 'image/webp']}
                                server={filePondServerConfig()}
                                name="file"
                                labelIdle='Seret & Letakkan gambar baru atau <span class="filepond--label-action">Cari</span> untuk mengganti'
                                onprocessfile={(error, file) => {
                                    if (!error && file.serverId) {
                                        newThumbnailUrlRef.current = file.serverId;
                                    }
                                }}
                                onremovefile={() => {
                                    newThumbnailUrlRef.current = null;
                                    setFiles([]);
                                }}
                                disabled={isSubmitting}
                                className="filepond-dark"
                            />
                        </CardBody>
                    </Card>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                        <Button variant="bordered" onPress={() => handleModalClose(false)} isDisabled={isSubmitting}>Batal</Button>
                        <Button type="submit" color="primary" isLoading={isSubmitting}>Simpan Perubahan</Button>
                    </div>
                </form>
            )}

            <style jsx global>{`
                /* CSS styles remain the same */
                .filepond-dark .filepond--root { background: rgba(39, 39, 42, 0.5); border: 1px solid rgb(39, 39, 42); border-radius: 8px; }
                .filepond-dark .filepond--panel-root { background: rgba(39, 39, 42, 0.3); }
                .filepond-dark .filepond--drop-label { color: rgb(161, 161, 170); }
                .filepond-dark .filepond--label-action { color: rgb(59, 130, 246); text-decoration: underline; }
                .filepond-dark .filepond--item { background: rgba(24, 24, 27, 0.8); }
                .filepond-dark .filepond--file-info-main { color: rgb(228, 228, 231); }
                .filepond-dark .filepond--file-info-sub { color: rgb(161, 161, 170); }
                .filepond--file-wrapper { overflow: hidden; border-radius: 8px; }
            `}</style>
        </MyModal>
    );
};

export default ModalEditArticle;