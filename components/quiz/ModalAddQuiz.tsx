"use client";

import React, { useState, useRef } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {Input, Button, Textarea, Card, CardBody, addToast, Select, SelectItem} from '@heroui/react';
import RequestAPI from '@/helper/http';
import MyModal from "@/components/ui/MyModal";
import {IconPlus, IconTrash} from "@tabler/icons-react";

// Tipe dan antarmuka tetap sama
interface QuizQuestion {
    question: string;
    options: string[];
    answer_index: number;
}

interface QuizFormData {
    title: string;
    desc: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    estimate: number;
    minimum_score: number;
    questions: QuizQuestion[];
}

interface CreateQuizModalProps {
    isOpen: boolean;
    onOpen: () => void;
    onOpenChange: (isOpen: boolean) => void;
    onClose: () => void;
    onSubmitSuccess?: () => void;
}

// --- PERUBAHAN 1: Skema Validasi Disesuaikan ---
// Kita pastikan ada pesan error jika tidak ada jawaban yang dipilih
const questionSchema = z.object({
    question: z.string().min(10, "Pertanyaan minimal 10 karakter"),
    options: z.array(z.string().min(1, "Opsi tidak boleh kosong")).length(4, "Harus ada 4 opsi"),
    answer_index: z.number({ message: "Anda harus memilih satu jawaban yang benar" }).int().min(0).max(3),
});

const quizSchema = z.object({
    title: z.string().min(10, "Judul kuis minimal 10 karakter"),
    desc: z.string().min(20, "Deskripsi kuis minimal 20 karakter"),
    level: z.enum(['beginner', 'intermediate', 'advanced'], {
        message: "Level harus dipilih"
    }),
    category: z.string().min(3, "Kategori harus diisi"),
    estimate: z.number().min(1, "Estimasi waktu minimal 1 menit"),
    minimum_score: z.number().min(1).max(100, "Skor minimum harus 1-100"),
    questions: z.array(questionSchema).min(3, "Minimal 3 pertanyaan").max(20, "Maksimal 20 pertanyaan"),
});

const levelOptions = [
    { key: 'beginner', label: 'Beginner' },
    { key: 'intermediate', label: 'Intermediate' },
    { key: 'advanced', label: 'Advanced' },
];

// --- Komponen Utama ---
const ModalCreateQuiz: React.FC<CreateQuizModalProps> = ({
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
        reset,
        control,
        watch,
        setValue
    } = useForm<QuizFormData>({
        resolver: zodResolver(quizSchema),
        // --- PERUBAHAN 2: Nilai Default Disesuaikan ---
        // Kita set answer_index ke -1 agar user dipaksa memilih
        defaultValues: {
            title: '',
            desc: '',
            level: 'beginner',
            category: '',
            estimate: 5,
            minimum_score: 70,
            questions: [
                { question: '', options: ['', '', '', ''], answer_index: -1 },
                { question: '', options: ['', '', '', ''], answer_index: -1 },
                { question: '', options: ['', '', '', ''], answer_index: -1 },
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "questions"
    });

    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

    // --- PERUBAHAN 3: Fungsi addQuestion Disesuaikan ---
    const addQuestion = () => {
        if (fields.length < 20) {
            append({ question: '', options: ['', '', '', ''], answer_index: -1 });
        }
    };

    const removeQuestion = (index: number) => {
        if (fields.length > 3) {
            remove(index);
        }
    };

    const onSubmit = async (data: QuizFormData) => {
        try {
            const quizData = { ...data, ...(thumbnailUrl && { thumbnail: thumbnailUrl }) };
            const response = await RequestAPI('/quiz/create', 'post', quizData);

            if (response.status === 200) {
                addToast({ title: 'Success', description: 'Berhasil Membuat Kuis Baru', color: 'success' });
                reset();
                setThumbnailUrl(null);
                onClose();
                onSubmitSuccess?.();
            } else {
                throw new Error(response.message || 'Gagal membuat kuis');
            }
        } catch (error: any) {
            addToast({ title: 'Error', description: error.message || 'Terjadi kesalahan', color: 'danger' });
            console.error('Submit error:', error);
        }
    };

    const handleModalClose = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            setThumbnailUrl(null);
        }
        onOpenChange(isOpen);
    };

    const inputWrapperClassNames = "bg-zinc-900/50 hover:bg-zinc-900/50 border border-zinc-800 rounded-lg data-[hover=true]:border-zinc-700 group-data-[focus=true]:border-blue-500";

    return (
        <MyModal
            onOpen={onOpen}
            size="5xl"
            title="Buat Kuis Baru"
            isOpen={isOpen}
            onOpenChange={handleModalClose}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Bagian Info Kuis (Tidak berubah) */}
                <div className="space-y-4">
                    <Input {...register("title")} label="Judul Kuis" placeholder="Contoh: Mengenal Batik Nusantara" isInvalid={!!errors.title} errorMessage={errors.title?.message} isDisabled={isSubmitting} fullWidth classNames={{ inputWrapper: inputWrapperClassNames }} />
                    <Textarea {...register("desc")} label="Deskripsi Kuis" placeholder="Jelaskan tentang kuis ini..." isInvalid={!!errors.desc} errorMessage={errors.desc?.message} isDisabled={isSubmitting} fullWidth minRows={3} classNames={{ inputWrapper: inputWrapperClassNames }} />
                    <Input {...register("category")} label="Kategori" placeholder="Contoh: Budaya" isInvalid={!!errors.category} errorMessage={errors.category?.message} isDisabled={isSubmitting} fullWidth classNames={{ inputWrapper: inputWrapperClassNames }} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select {...register("level")} label="Level Kesulitan" placeholder="Pilih level" defaultSelectedKeys={["beginner"]} isInvalid={!!errors.level} errorMessage={errors.level?.message} isDisabled={isSubmitting} classNames={{ trigger: inputWrapperClassNames }}>
                        {levelOptions.map((level) => (<SelectItem key={level.key}>{level.label}</SelectItem>))}
                    </Select>
                    <Input {...register("estimate", { valueAsNumber: true })} label="Estimasi Waktu (menit)" type="number" placeholder="5" isInvalid={!!errors.estimate} errorMessage={errors.estimate?.message} isDisabled={isSubmitting} classNames={{ inputWrapper: inputWrapperClassNames }} />
                    <Input {...register("minimum_score", { valueAsNumber: true })} label="Skor Minimum (%)" type="number" placeholder="70" isInvalid={!!errors.minimum_score} errorMessage={errors.minimum_score?.message} isDisabled={isSubmitting} classNames={{ inputWrapper: inputWrapperClassNames }} />
                </div>

                {/* Bagian Pertanyaan */}
                <Card className="bg-zinc-900/50 border border-zinc-800">
                    <CardBody className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-medium text-zinc-300">Pertanyaan Kuis ({fields.length})</h4>
                            <Button type="button" color="primary" variant="bordered" size="sm" onPress={addQuestion} isDisabled={fields.length >= 20 || isSubmitting} startContent={<IconPlus className="w-4 h-4" />}>Tambah Pertanyaan</Button>
                        </div>
                        <div className="space-y-6">
                            {fields.map((field, questionIndex) => (
                                <Card key={field.id} className="bg-zinc-800/50 border border-zinc-700">
                                    <CardBody className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h5 className="font-medium text-zinc-200">Pertanyaan {questionIndex + 1}</h5>
                                            {fields.length > 3 && (<Button type="button" color="danger" variant="light" size="sm" onPress={() => removeQuestion(questionIndex)} isDisabled={isSubmitting} startContent={<IconTrash className="w-4 h-4" />} >Hapus</Button>)}
                                        </div>
                                        <Textarea {...register(`questions.${questionIndex}.question`)} label="Pertanyaan" placeholder="Tulis pertanyaan di sini..." isInvalid={!!errors.questions?.[questionIndex]?.question} errorMessage={errors.questions?.[questionIndex]?.question?.message} isDisabled={isSubmitting} minRows={2} classNames={{ inputWrapper: inputWrapperClassNames }} />

                                        {/* --- PERUBAHAN 4: MENGGUNAKAN KOMPONEN PILIHAN JAWABAN KUSTOM --- */}
                                        <div className="space-y-3">
                                            <p className="text-sm text-zinc-400">Pilihan Jawaban (Klik pada opsi yang benar):</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {[0, 1, 2, 3].map((optionIndex) => {
                                                    const currentAnswerIndex = watch(`questions.${questionIndex}.answer_index`);
                                                    const isActive = currentAnswerIndex === optionIndex;

                                                    return (
                                                        <div
                                                            key={optionIndex}
                                                            onClick={() => setValue(`questions.${questionIndex}.answer_index`, optionIndex, { shouldValidate: true })}
                                                            className={`flex items-center space-x-3 p-2 border-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'border-blue-500 bg-blue-900/30' : 'border-zinc-700 hover:border-zinc-500'}`}
                                                        >
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isActive ? 'border-blue-400 bg-blue-500' : 'border-zinc-500'}`}>
                                                                {isActive && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                                            </div>
                                                            <Input
                                                                {...register(`questions.${questionIndex}.options.${optionIndex}`)}
                                                                placeholder={`Opsi ${String.fromCharCode(65 + optionIndex)}`}
                                                                isInvalid={!!errors.questions?.[questionIndex]?.options?.[optionIndex]}
                                                                errorMessage={errors.questions?.[questionIndex]?.options?.[optionIndex]?.message}
                                                                isDisabled={isSubmitting}
                                                                size="sm"
                                                                classNames={{ inputWrapper: "bg-transparent border-0 shadow-none p-0 px-2" }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {errors.questions?.[questionIndex]?.answer_index && (
                                                <p className="text-red-500 text-xs mt-1">{errors.questions[questionIndex]?.answer_index?.message}</p>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                        {errors.questions?.root && (<p className="text-red-500 text-sm">{errors.questions.root.message}</p>)}
                    </CardBody>
                </Card>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                    <Button variant="bordered" onPress={() => handleModalClose(false)} isDisabled={isSubmitting}>Batal</Button>

                    <Button type="submit" color="primary" isLoading={isSubmitting}>Buat Kuis</Button>
                </div>
            </form>
        </MyModal>
    );
};

export default ModalCreateQuiz;