"use client";

import React, { useState, useRef } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, Textarea, Card, CardBody, addToast } from '@heroui/react'; // Menghapus 'Input' yang tidak terpakai
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import MyModal from "@/components/ui/MyModal";

// Import FilePond styles
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import RequestAPI from '@/helper/http';
import Cookies from "js-cookie";

// Register the plugins
registerPlugin(
    FilePondPluginImageExifOrientation,
    FilePondPluginImagePreview,
    FilePondPluginFileValidateType,
    FilePondPluginFileValidateSize
);

// --- Tipe Data (Diperbaiki) ---
interface PayoutResponseFormData {
    note: string;
}

interface ModalPayoutProps {
    payoutID: string;
    status: 'completed' | 'failed';
    isOpen: boolean;
    onOpen: () => void;
    onOpenChange: (isOpen: boolean) => void;
    onClose: () => void;
    onModalClose: () => void;
    onSubmitSuccess?: () => void;
}

// --- Skema Validasi (Diperbaiki) ---
const payoutResponseSchema = z.object({
    note: z.string().min(10, "Catatan minimal harus 10 karakter"),
});


// --- Komponen Utama (Diperbaiki dan Disederhanakan) ---
const PayoutResponseModal: React.FC<ModalPayoutProps> = ({
    payoutID,
    status,
    isOpen,
    onOpen,
    onClose,
    onOpenChange,
    onSubmitSuccess,
    onModalClose
}) => {
    const {
        register, // Menambahkan 'register' untuk menghubungkan input form
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<PayoutResponseFormData>({
        resolver: zodResolver(payoutResponseSchema),
        defaultValues: { note: '' } // Memberikan nilai default
    });

    const proofPond = useRef<FilePond>(null);

    // PERBAIKAN: State disederhanakan untuk menyimpan URL (string) saja, bukan objek
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

    const onSubmit = async (data: PayoutResponseFormData) => {
        // PERBAIKAN: Validasi receiptUrl yang lebih sederhana
        console.log(receiptUrl);
        if (!receiptUrl) {
            addToast({ title: 'Error', description: 'Harap unggah bukti transfer terlebih dahulu.', color: 'danger' });
            return;
        }

        try {
            // PERBAIKAN: Payload sekarang menyertakan semua field yang dibutuhkan
            const payload = {
                payout_uuid: payoutID, // Diambil dari props secara otomatis
                receipt_url: receiptUrl, // Diambil dari state setelah file diunggah
                note: data.note, // Diambil dari form input
            };

            console.log("Data yang akan dikirim ke API:", payload);
            const response = await RequestAPI(`/wallet/payout/response/${status}`, 'post', payload);

            if (response.status === 200) {
                addToast({ title: 'Success', description: 'Berhasil mengirimkan respon.', color: 'success' });
                reset();
                setReceiptUrl(null); // Reset state URL
                proofPond.current?.removeFiles();
                onClose();
                onSubmitSuccess?.();
            } else {
                throw new Error(response.message || 'Gagal mengirim respon.');
            }
        } catch (error: any) {
            addToast({ title: 'Error', description: error.message || 'Terjadi kesalahan.', color: 'danger' });
            console.error('Submit error:', error);
        }
    };

    const filePondServerConfig = {
        process: {
            url: `${process.env.NEXT_PUBLIC_BASE_API}/storage/upload`,
            headers: { Authorization: `Bearer ${Cookies.get("access_token")}` },
            onload: (response: any): string => {
                // 1. Ubah string respons menjadi objek JSON
                const res = JSON.parse(response);

                // 2. Cek apakah 'body' dan 'public_url' di dalamnya ada
                if (res.body && res.body.public_url) {
                    // 3. Jika ada, kembalikan nilainya
                    return res.body.public_url;
                }

                // 4. Jika tidak ditemukan, kembalikan string kosong
                console.error("Gagal mendapatkan public_url dari respons server:", res);
                return '';
            },
        },
        revert: null, // Kita handle revert/delete di onremovefile
    };

    const handleModalClose = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            setReceiptUrl(null); // Reset state saat modal ditutup
            proofPond.current?.removeFiles();
        }
        onOpenChange(isOpen);
        onModalClose()
    };

    const inputWrapperClassNames = "bg-zinc-900/50 hover:bg-zinc-900/50 border border-zinc-800 rounded-lg data-[hover=true]:border-zinc-700 group-data-[focus=true]:border-blue-500";

    return (
        <MyModal
            onOpen={onOpen}
            size="2xl" // Ukuran modal disesuaikan
            title={`Respon Payout: ${status.charAt(0).toUpperCase() + status.slice(1)}`} // Judul dinamis
            isOpen={isOpen}
            onOpenChange={handleModalClose}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* --- Input untuk 'note' --- */}
                <Textarea
                    label="Catatan Tambahan"
                    placeholder="Masukkan catatan atau keterangan terkait respon ini..."
                    {...register("note")}
                    isInvalid={!!errors.note}
                    errorMessage={errors.note?.message}
                    isDisabled={isSubmitting}
                    rows={4}
                    classNames={{ inputWrapper: inputWrapperClassNames }}
                />

                {/* --- FilePond untuk unggah bukti transfer --- */}
                <Card className="bg-zinc-900/50 border border-zinc-800">
                    <CardBody className="space-y-3">
                        <h4 className="text-sm font-medium text-zinc-300">Unggah Bukti Transfer</h4>
                        <FilePond
                            ref={proofPond}
                            // PERBAIKAN: Diubah untuk hanya menerima 1 file gambar
                            allowMultiple={true}
                            maxFiles={1}
                            acceptedFileTypes={['image/*']}
                            server={filePondServerConfig}
                            name="file"
                            labelIdle='Seret & lepas gambar atau <span class="filepond--label-action">Telusuri</span>'
                            onprocessfile={(error, file) => {
                                if (error) { console.error('Upload file digital error:', error); return; }
                                const serverId = file.serverId; // Ini adalah public_url
                                console.log(file)
                                console.log(serverId)
                                if (serverId) {
                                    setReceiptUrl(serverId);
                                }
                            }}
                            onremovefile={() => {
                                // PERBAIKAN: Kosongkan state saat file dihapus
                                setReceiptUrl(null);
                            }}
                            disabled={isSubmitting}
                            className="filepond-dark"
                        />
                    </CardBody>
                </Card>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                    <Button variant="bordered" onPress={() => handleModalClose(false)} isDisabled={isSubmitting}>Batal</Button>
                    <Button type="submit" color={status === 'completed' ? 'primary' : 'danger'} isLoading={isSubmitting}>Kirim Respon</Button>
                </div>
            </form>
            <style jsx global>{`
                /* Gaya CSS tidak diubah, sudah cukup baik */
                .filepond-dark .filepond--root { background: rgba(39, 39, 42, 0.5); border: 1px solid rgb(39, 39, 42); border-radius: 8px; }
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

export default PayoutResponseModal;