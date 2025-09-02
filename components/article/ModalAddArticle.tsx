"use client";

import React, { useState, useRef } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {Input, Button, Textarea, Card, CardBody, addToast} from '@heroui/react';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';

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
    FilePondPluginFileValidateSize
);

// --- Types ---
interface ArticleFormData {
    title: string;
    content: string;
    category: string;
}

interface CreateArticleModalProps {
    isOpen: boolean;
    onOpen: () => void;
    onOpenChange: (isOpen: boolean) => void;
    onClose: () => void;
    onSubmitSuccess?: () => void;
}

// --- Validation Schema ---
const articleSchema = z.object({
    title: z.string().min(10, "Judul artikel minimal 10 karakter"),
    content: z.string().min(50, "Konten artikel minimal 50 karakter"),
    category: z.string().min(3, "Kategori harus diisi"),
});


// --- Main Component ---
const ModalAddCreate: React.FC<CreateArticleModalProps> = ({
   isOpen,
   onOpen,
   onClose,
   onOpenChange,
   onSubmitSuccess
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<ArticleFormData>({
        resolver: zodResolver(articleSchema),
    });

    const thumbnailPond = useRef<FilePond>(null);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

    const onSubmit = async (data: ArticleFormData) => {
        try {
            if (!thumbnailUrl) {
                addToast({
                    title: 'Validasi Gagal',
                    description: 'Harap upload thumbnail untuk artikel.',
                    color: 'warning',
                });
                return;
            }

            const articleData = {
                ...data,
                thumbnail: thumbnailUrl, // Menggunakan URL dari state
            };

            console.log("Data siap dikirim ke API:", articleData);
            const response = await RequestAPI('/article/create', 'post', articleData);

            if (response.status === 200) {
                addToast({
                    title: 'Success',
                    description: 'Berhasil Membuat Artikel Baru',
                    color: 'success',
                });
                reset();
                setThumbnailUrl(null);
                thumbnailPond.current?.removeFiles();
                onClose();
                onSubmitSuccess?.();
            } else {
                addToast({
                    title: 'Error',
                    description: response.message || 'Gagal membuat artikel',
                    color: 'danger',
                });
                throw new Error(response.message || 'Gagal membuat artikel');
            }
        } catch (error: any) {
            addToast({
                title: 'Error',
                description: 'Gagal membuat artikel',
                color: 'danger',
            });
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
                        // Sesuaikan dengan struktur response upload Anda
                        const publicUrl = res?.body?.public_url;

                        if (publicUrl) {
                            return publicUrl;
                        }

                        console.error("Gagal mendapatkan public_url dari response:", res);
                        return ''; // Return string kosong jika gagal
                    } catch (e) {
                        console.error("Gagal mem-parsing JSON dari server:", e);
                        return ''; // Return string kosong jika gagal
                    }
                },
                onerror: (response: any) => {
                    console.error('FilePond server error:', response);
                    // Anda bisa menambahkan toast error di sini jika perlu
                }
            },
            revert: null, // Tidak perlu revert jika upload langsung final
        };
    };

    const handleModalClose = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            setThumbnailUrl(null);
            thumbnailPond.current?.removeFiles();
        }
        onOpenChange(isOpen);
    };

    const inputWrapperClassNames = "bg-zinc-900/50 hover:bg-zinc-900/50 border border-zinc-800 rounded-lg data-[hover=true]:border-zinc-700 group-data-[focus=true]:border-blue-500";

    return (
        <MyModal
            onOpen={onOpen}
            size="4xl"
            title="Buat Artikel Baru"
            isOpen={isOpen}
            onOpenChange={handleModalClose}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input {...register("title")} label="Judul Artikel" placeholder="Contoh: Menelusuri Jejak Mahakarya Nusantara" isInvalid={!!errors.title} errorMessage={errors.title?.message} isDisabled={isSubmitting} fullWidth classNames={{ inputWrapper: inputWrapperClassNames }}/>
                <Input {...register("category")} label="Kategori" placeholder="Contoh: Budaya" isInvalid={!!errors.category} errorMessage={errors.category?.message} isDisabled={isSubmitting} fullWidth classNames={{ inputWrapper: inputWrapperClassNames }} />
                <Textarea {...register("content")} label="Konten Artikel" placeholder="Tulis isi artikel Anda di sini..." isInvalid={!!errors.content} errorMessage={errors.content?.message} isDisabled={isSubmitting} fullWidth minRows={10} classNames={{ inputWrapper: inputWrapperClassNames }} />

                <Card className="bg-zinc-900/50 border border-zinc-800">
                    <CardBody className="space-y-3">
                        <h4 className="text-sm font-medium text-zinc-300">Thumbnail Artikel</h4>
                        <FilePond
                            ref={thumbnailPond}
                            allowMultiple={false} // Hanya izinkan satu file
                            maxFiles={1}
                            acceptedFileTypes={['image/png', 'image/jpeg', 'image/webp']}
                            server={filePondServerConfig()}
                            name="file" // Sesuaikan dengan nama field yang diharapkan server
                            labelIdle='Seret & Letakkan gambar atau <span class="filepond--label-action">Cari</span>'
                            onprocessfile={(error, file) => {
                                if (error) {
                                    console.error('Upload thumbnail error:', error);
                                    setThumbnailUrl(null);
                                    return;
                                }
                                const serverId = file.serverId; // Ini adalah public_url
                                if (serverId) {
                                    setThumbnailUrl(serverId);
                                }
                            }}
                            onremovefile={(error, file) => {
                                // Saat file dihapus dari UI, kosongkan state URL
                                setThumbnailUrl(null);
                            }}
                            disabled={isSubmitting}
                            className="filepond-dark"
                        />
                    </CardBody>
                </Card>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                    <Button variant="bordered" onPress={() => handleModalClose(false)} isDisabled={isSubmitting}>Batal</Button>
                    <Button type="submit" color="primary" isLoading={isSubmitting}>Publikasikan Artikel</Button>
                </div>
            </form>
            <style jsx global>{`
                /* Styling untuk FilePond tetap sama */
                .filepond-dark .filepond--root {
                    background: rgba(39, 39, 42, 0.5);
                    border: 1px solid rgb(39, 39, 42);
                    border-radius: 8px;
                }
                .filepond-dark .filepond--panel-root { background: rgba(39, 39, 42, 0.3); }
                .filepond-dark .filepond--drop-label { color: rgb(161, 161, 170); }
                .filepond-dark .filepond--label-action { color: rgb(59, 130, 246); text-decoration: underline; }
                .filepond-dark .filepond--item { background: rgba(24, 24, 27, 0.8); }
                .filepond-dark .filepond--file-info-main { color: rgb(228, 228, 231); }
                .filepond-dark .filepond--file-info-sub { color: rgb(161, 161, 170); }
            `}</style>
        </MyModal>
    );
};

export default ModalAddCreate;