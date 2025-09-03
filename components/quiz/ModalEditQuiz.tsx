"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Input,
    Button,
    Textarea,
    Card,
    CardBody,
    addToast,
    Select,
    SelectItem,
    Spinner // Import Spinner untuk loading state
} from '@heroui/react';
import RequestAPI from '@/helper/http';
import MyModal from "@/components/ui/MyModal";
import {IconPlus, IconTrash} from "@tabler/icons-react";

// --- Types ---
interface QuizQuestion {
    question: string;
    options: string[];
    // Catatan: Asumsi answer_index akan ditambahkan saat mengedit, karena tidak ada di response detail
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

interface EditQuizModalProps {
    slug: string; // Prop untuk mengambil detail kuis
    uuid: string; // Prop untuk endpoint update
    isOpen: boolean;
    onOpen: () => void;
    onOpenChange: (isOpen: boolean) => void;
    onClose: () => void;
    onSubmitSuccess?: () => void;
}

// --- Validation Schema (Sama seperti sebelumnya) ---
const questionSchema = z.object({
    question: z.string().min(10, "Pertanyaan minimal 10 karakter"),
    options: z.array(z.string().min(1, "Opsi tidak boleh kosong")).length(4, "Harus ada 4 opsi"),
    answer_index: z.number().int().min(0).max(3, "Pilih salah satu jawaban yang benar"),
});

const quizSchema = z.object({
    title: z.string().min(10, "Judul kuis minimal 10 karakter"),
    desc: z.string().min(20, "Deskripsi kuis minimal 20 karakter"),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
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

// --- Main Component ---
const ModalEditQuiz: React.FC<EditQuizModalProps> = ({
    slug,
    uuid,
    isOpen,
    onClose,
    onOpen,
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
        defaultValues: { // Default values akan ditimpa oleh data dari API
            title: '',
            desc: '',
            level: 'beginner',
            category: '',
            estimate: 0,
            minimum_score: 0,
            questions: []
        }
    });

    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: "questions"
    });

    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Fetch Data saat modal terbuka ---
    useEffect(() => {
        if (isOpen && slug) {
            const fetchQuizData = async () => {
                setIsLoadingData(true);
                setError(null);
                try {
                    const response = await RequestAPI(`/quiz/${slug}`, 'get');
                    if (response.status === 200) {
                        const quiz = response.body;

                        // Mengisi form dengan data dari API
                        reset({
                            title: quiz.title,
                            desc: quiz.desc,
                            level: quiz.level,
                            category: quiz.category.name, // Ambil nama kategori dari objek
                            estimate: quiz.estimate,
                            minimum_score: quiz.minimum_score,
                            // Map questions, tambahkan answer_index default
                            questions: quiz.questions.map((q: any) => ({
                                question: q.question,
                                options: q.options,
                                answer_index: 0, // Default. User harus memilih ulang jawaban yang benar
                            })),
                        });

                    } else {
                        throw new Error(response.message || 'Gagal memuat data kuis.');
                    }
                } catch (err: any) {
                    setError(err.message || 'Terjadi kesalahan saat mengambil data kuis.');
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchQuizData();
        }
    }, [isOpen, slug, reset]);


    const addQuestion = () => {
        if (fields.length < 20) {
            append({ question: '', options: ['', '', '', ''], answer_index: 0 });
        }
    };

    const removeQuestion = (index: number) => {
        if (fields.length > 3) {
            remove(index);
        }
    };

    // --- Submit Handler untuk Update ---
    const onSubmit = async (data: QuizFormData) => {
        try {
            // Data yang dikirim sudah lengkap sesuai state form saat ini
            const quizData = {
                title: data.title,
                desc: data.desc,
                level: data.level,
                category: data.category,
                estimate: data.estimate,
                minimum_score: data.minimum_score,
                questions: data.questions,
            };

            console.log("Data siap dikirim untuk update:", quizData);
            const response = await RequestAPI(`/quiz/update/${uuid}`, 'post', quizData);

            if (response.status === 200) {
                addToast({
                    title: 'Success',
                    description: 'Berhasil memperbarui kuis',
                    color: 'success',
                });
                onClose();
                onSubmitSuccess?.();
            } else {
                throw new Error(response.message || 'Gagal memperbarui kuis');
            }
        } catch (error: any) {
            addToast({
                title: 'Error',
                description: error.message || 'Gagal memperbarui kuis',
                color: 'danger',
            });
            console.error('Submit error:', error);
        }
    };

    const handleModalClose = () => {
        onClose()
    };

    const inputWrapperClassNames = "bg-zinc-900/50 hover:bg-zinc-900/50 border border-zinc-800 rounded-lg data-[hover=true]:border-zinc-700 group-data-[focus=true]:border-blue-500";

    const renderContent = () => {
        if (isLoadingData) {
            return (
                <div className="flex justify-center items-center h-96">
                    <Spinner label="Memuat data kuis..." />
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center text-red-500 h-96 flex items-center justify-center">
                    <p>{error}</p>
                </div>
            );
        }

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Quiz Info */}
                <div className="space-y-4">
                    <Input
                        {...register("title")}
                        label="Judul Kuis"
                        placeholder="Contoh: Mengenal Batik Nusantara"
                        isInvalid={!!errors.title}
                        errorMessage={errors.title?.message}
                        isDisabled={isSubmitting}
                        fullWidth
                        classNames={{ inputWrapper: inputWrapperClassNames }}
                    />
                    {/* ... sisa form sama seperti sebelumnya ... */}
                    <Textarea
                        {...register("desc")}
                        label="Deskripsi Kuis"
                        placeholder="Jelaskan tentang kuis ini, apa yang akan dipelajari peserta..."
                        isInvalid={!!errors.desc}
                        errorMessage={errors.desc?.message}
                        isDisabled={isSubmitting}
                        fullWidth
                        minRows={3}
                        classNames={{ inputWrapper: inputWrapperClassNames }}
                    />

                    <Input
                        {...register("category")}
                        label="Kategori"
                        placeholder="Contoh: Budaya"
                        isInvalid={!!errors.category}
                        errorMessage={errors.category?.message}
                        isDisabled={isSubmitting}
                        fullWidth
                        classNames={{ inputWrapper: inputWrapperClassNames }}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                        label="Level Kesulitan"
                        placeholder="Pilih level"
                        selectedKeys={[watch('level')]} // Gunakan watch untuk mengontrol nilai
                        onChange={(e) => setValue('level', e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                        isInvalid={!!errors.level}
                        errorMessage={errors.level?.message}
                        isDisabled={isSubmitting}
                        classNames={{ trigger: inputWrapperClassNames }}
                    >
                        {levelOptions.map((level) => (
                            <SelectItem key={level.key}>
                                {level.label}
                            </SelectItem>
                        ))}
                    </Select>
                    <Input
                        {...register("estimate", { valueAsNumber: true })}
                        label="Estimasi Waktu (menit)"
                        type="number"
                        placeholder="5"
                        isInvalid={!!errors.estimate}
                        errorMessage={errors.estimate?.message}
                        isDisabled={isSubmitting}
                        classNames={{ inputWrapper: inputWrapperClassNames }}
                    />
                    <Input
                        {...register("minimum_score", { valueAsNumber: true })}
                        label="Skor Minimum (%)"
                        type="number"
                        placeholder="70"
                        isInvalid={!!errors.minimum_score}
                        errorMessage={errors.minimum_score?.message}
                        isDisabled={isSubmitting}
                        classNames={{ inputWrapper: inputWrapperClassNames }}
                    />
                </div>
                {/* Questions Section */}
                <Card className="bg-zinc-900/50 border border-zinc-800">
                    <CardBody className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-medium text-zinc-300">
                                Pertanyaan Kuis ({fields.length})
                            </h4>
                            <Button
                                type="button"
                                color="primary"
                                variant="bordered"
                                size="sm"
                                onPress={addQuestion}
                                isDisabled={fields.length >= 20 || isSubmitting}
                                startContent={<IconPlus className="w-4 h-4" />}
                            >
                                Tambah Pertanyaan
                            </Button>
                        </div>
                        <div className="space-y-6">
                            {fields.map((field, questionIndex) => (
                                <Card key={field.id} className="bg-zinc-800/50 border border-zinc-700">
                                    <CardBody className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h5 className="font-medium text-zinc-200">
                                                Pertanyaan {questionIndex + 1}
                                            </h5>
                                            {fields.length > 3 && (
                                                <Button
                                                    type="button"
                                                    color="danger"
                                                    variant="light"
                                                    size="sm"
                                                    onPress={() => removeQuestion(questionIndex)}
                                                    isDisabled={isSubmitting}
                                                    startContent={<IconTrash className="w-4 h-4" />}
                                                >
                                                    Hapus
                                                </Button>
                                            )}
                                        </div>

                                        <Textarea
                                            {...register(`questions.${questionIndex}.question`)}
                                            label="Pertanyaan"
                                            placeholder="Tulis pertanyaan di sini..."
                                            isInvalid={!!errors.questions?.[questionIndex]?.question}
                                            errorMessage={errors.questions?.[questionIndex]?.question?.message}
                                            isDisabled={isSubmitting}
                                            minRows={2}
                                            classNames={{ inputWrapper: inputWrapperClassNames }}
                                        />

                                        <div className="space-y-3">
                                            <p className="text-sm text-zinc-400">Pilihan Jawaban (Pilih jawaban yang benar):</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {[0, 1, 2, 3].map((optionIndex) => (
                                                    <div key={optionIndex} className="flex items-center space-x-2">
                                                        <input
                                                            type="radio"
                                                            {...register(`questions.${questionIndex}.answer_index`, { valueAsNumber: true })}
                                                            value={optionIndex}
                                                            className="text-blue-500 w-4 h-4"
                                                            disabled={isSubmitting}
                                                        />
                                                        <Input
                                                            {...register(`questions.${questionIndex}.options.${optionIndex}`)}
                                                            placeholder={`Opsi ${String.fromCharCode(65 + optionIndex)}`}
                                                            isInvalid={!!errors.questions?.[questionIndex]?.options?.[optionIndex]}
                                                            errorMessage={errors.questions?.[questionIndex]?.options?.[optionIndex]?.message}
                                                            isDisabled={isSubmitting}
                                                            size="sm"
                                                            classNames={{ inputWrapper: inputWrapperClassNames }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            {errors.questions?.[questionIndex]?.answer_index && (
                                                <p className="text-red-500 text-xs">
                                                    {errors.questions[questionIndex]?.answer_index?.message}
                                                </p>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                        {errors.questions?.root && (
                            <p className="text-red-500 text-sm">{errors.questions.root.message}</p>
                        )}
                    </CardBody>
                </Card>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                    <Button
                        variant="bordered"
                        onPress={handleModalClose}
                        isDisabled={isSubmitting}
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        color="primary"
                        isLoading={isSubmitting}
                    >
                        Simpan Perubahan
                    </Button>
                </div>
            </form>
        )
    }

    return (
        <MyModal
            size="5xl"
            title="Edit Kuis"
            isOpen={isOpen}
            onOpen={onOpen}
            onOpenChange={handleModalClose}
        >
            {renderContent()}
        </MyModal>
    );
};

export default ModalEditQuiz;