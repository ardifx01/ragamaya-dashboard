// app/page.tsx

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { z, ZodError } from "zod";
import Cookies from 'js-cookie';
import { Button, Input } from "@heroui/react";
import RequestAPI from "@/helper/http";
// Pastikan path ini benar sesuai struktur proyek Anda

// Skema Zod (tidak berubah)
const LoginSchema = z.object({
    username: z.string().min(3, { message: "Username minimal harus 3 karakter" }),
    password: z.string().min(6, { message: "Password minimal harus 6 karakter" }),
});

type LoginFormInputs = z.infer<typeof LoginSchema>;
type FormErrors = { [key in keyof LoginFormInputs]?: string; };

export default function LoginPage() {
    const router = useRouter();

    const [formData, setFormData] = useState<LoginFormInputs>({ username: "", password: "" });
    const [zodErrors, setZodErrors] = useState<FormErrors>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setZodErrors({});
        setApiError(null);
        setIsLoading(true);

        try {
            LoginSchema.parse(formData);

            const response = await RequestAPI('/auth/login', 'post', formData);

            console.log("Login berhasil!", response);

            // Sesuaikan dengan struktur respons API Anda
            const token = response.token || response.body;
            if (token) {
                Cookies.set('access_token', token, { expires: 7, secure: process.env.NODE_ENV === 'production' });
                router.push('/');
            } else {
                throw new Error("Token tidak ditemukan pada respons API.");
            }

        } catch (error) {
            // Perbaikan ada di blok ini
            if (error instanceof ZodError) {
                // Menggunakan .issues dan .reduce untuk memformat error, ini lebih type-safe
                const formattedErrors = error.issues.reduce((acc, currentIssue) => {
                    const fieldName = currentIssue.path[0] as keyof LoginFormInputs;
                    if (fieldName) {
                        acc[fieldName] = currentIssue.message;
                    }
                    return acc;
                }, {} as FormErrors);

                setZodErrors(formattedErrors);
            } else if (error instanceof Error) {
                setApiError(error.message);
            } else {
                setApiError("Terjadi kesalahan yang tidak diketahui.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Menggunakan tema gelap yang konsisten dengan dashboard
        <div className="w-full min-h-screen bg-black text-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full mx-auto rounded-xl p-8 shadow-lg bg-zinc-900/50 border border-gray-700">
                <h2 className="font-bold text-2xl text-white text-center">
                    Welcome Back
                </h2>
                <p className="text-gray-400 text-sm max-w-sm mt-2 text-center">
                    Login to your dashboard to continue.
                </p>

                <form className="my-8" onSubmit={handleSubmit}>
                    {apiError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-4">
                            {apiError}
                        </div>
                    )}

                    <div className="flex flex-col space-y-4">
                        {/* Input Username */}
                        <div>
                            <Input
                                autoFocus
                                id="username"
                                name="username"
                                placeholder="Username"
                                type="text"
                                value={formData.username}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                            {zodErrors.username && <p className="text-red-400 text-xs mt-1">{zodErrors.username}</p>}
                        </div>

                        {/* Input Password */}
                        <div>
                            <Input
                                id="password"
                                name="password"
                                placeholder="Password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                            {zodErrors.password && <p className="text-red-400 text-xs mt-1">{zodErrors.password}</p>}
                        </div>
                    </div>

                    <Button
                        variant="solid"
                        color="primary"
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-8 h-10 font-semibold"
                    >
                        {isLoading ? "Logging in..." : "Login"}
                    </Button>
                </form>
            </div>
        </div>
    );
}