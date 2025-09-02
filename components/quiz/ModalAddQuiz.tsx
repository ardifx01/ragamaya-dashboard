"use client";

import React, { useState, useRef } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {Input, Button, Textarea, Card, CardBody, addToast, Select, SelectItem} from '@heroui/react';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import RequestAPI from '@/helper/http';
import MyModal from "@/components/ui/MyModal";
import {IconPlus, IconTrash} from "@tabler/icons-react";

// Register the plugins
registerPlugin(
    FilePondPluginImageExifOrientation,
    FilePondPluginImagePreview,
    FilePondPluginFileValidateType,
    FilePondPluginFileValidateSize
);

// --- Types ---
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

// --- Validation Schema ---
const questionSchema = z.object({
    question: z.string().min(10, "Pertanyaan minimal 10 karakter"),
    options: z.array(z.string().min(1, "Opsi tidak boleh kosong")).length(4, "Harus ada 4 opsi"),
    answer_index: z.number().int().min(0).max(3, "Pilih salah satu jawaban yang benar"),
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

// --- Main Component ---
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
        defaultValues: {
            title: '',
            desc: '',
            level: 'beginner',
            category: '',
            estimate: 5,
            minimum_score: 70,
            questions: [
                { question: '', options: ['', '', '', ''], answer_index: 0 },
                { question: '', options: ['', '', '', ''], answer_index: 0 },
                { question: '', options: ['', '', '', ''], answer_index: 0 },
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "questions"
    });

    const thumbnailPond = useRef<FilePond>(null);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

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

    const onSubmit = async (data: QuizFormData) => {
        try {
            const quizData = {
                title: data.title,
                desc: data.desc,
                level: data.level,
                category: data.category,
                estimate: data.estimate,
                minimum_score: data.minimum_score,
                questions: data.questions,
                ...(thumbnailUrl && { thumbnail: thumbnailUrl })
            };

            console.log("Data siap dikirim ke API:", quizData);
            const response = await RequestAPI('/quiz/create', 'post', quizData);

            if (response.status === 200) {
                addToast({
                    title: 'Success',
                    description: 'Berhasil Membuat Kuis Baru',
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
                    description: response.message || 'Gagal membuat kuis',
                    color: 'danger',
                });
                throw new Error(response.message || 'Gagal membuat kuis');
            }
        } catch (error: any) {
            addToast({
                title: 'Error',
                description: 'Gagal membuat kuis',
                color: 'danger',
            });
            console.error('Submit error:', error);
        }
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
            size="5xl"
            title="Buat Kuis Baru"
            isOpen={isOpen}
            onOpenChange={handleModalClose}
        >
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
                        {...register("level")}
                        label="Level Kesulitan"
                        placeholder="Pilih level"
                        defaultSelectedKeys={["beginner"]}
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
                                            <p className="text-sm text-zinc-400">Pilihan Jawaban:</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {[0, 1, 2, 3].map((optionIndex) => (
                                                    <div key={optionIndex} className="flex items-center space-x-2">
                                                        <input
                                                            type="radio"
                                                            name={`questions.${questionIndex}.answer_index`}
                                                            value={optionIndex}
                                                            onChange={() => setValue(`questions.${questionIndex}.answer_index`, optionIndex)}
                                                            checked={watch(`questions.${questionIndex}.answer_index`) === optionIndex}
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
                        onPress={() => handleModalClose(false)}
                        isDisabled={isSubmitting}
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        color="primary"
                        isLoading={isSubmitting}
                    >
                        Buat Kuis
                    </Button>
                </div>
            </form>

            <style jsx global>{`
                .filepond-dark .filepond--root {
                    background: rgba(39, 39, 42, 0.5);
                    border: 1px solid rgb(39, 39, 42);
                    border-radius: 8px;
                }
                .filepond-dark .filepond--panel-root {
                    background: rgba(39, 39, 42, 0.3);
                }
                .filepond-dark .filepond--drop-label {
                    color: rgb(161, 161, 170);
                }
                .filepond-dark .filepond--label-action {
                    color: rgb(59, 130, 246);
                    text-decoration: underline;
                }
                .filepond-dark .filepond--item {
                    background: rgba(24, 24, 27, 0.8);
                }
                .filepond-dark .filepond--file-info-main {
                    color: rgb(228, 228, 231);
                }
                .filepond-dark .filepond--file-info-sub {
                    color: rgb(161, 161, 170);
                }
            `}</style>
        </MyModal>
    );
};

export default ModalCreateQuiz;