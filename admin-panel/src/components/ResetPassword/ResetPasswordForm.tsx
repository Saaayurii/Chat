"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import { authAPI, ResetPasswordData } from "@/core/api";

import Button from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { Label } from "@/components/UI/Label";
import { Alert } from "@/components/UI/Alert";

var resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Пароль должен содержать минимум 8 символов")
      .regex(/[A-Z]/, "Пароль должен содержать хотя бы одну заглавную букву")
      .regex(/[a-z]/, "Пароль должен содержать хотя бы одну строчную букву")
      .regex(/\d/, "Пароль должен содержать хотя бы одну цифру")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Пароль должен содержать хотя бы один специальный символ"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
  onSuccess: () => void;
}

var ResetPasswordForm = ({ token, onSuccess }: ResetPasswordFormProps) => {
  var { 0: showPassword, 1: setShowPassword } = useState(false);
  var { 0: showConfirmPassword, 1: setShowConfirmPassword } = useState(false);

  var {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  var resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordFormData) => {
      var resetData: ResetPasswordData = {
        token,
        newPassword: data.newPassword,
      };
      return authAPI.resetPassword(resetData).then((response) => response.data);
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      var message =
        error.response?.data?.message ||
        error.message ||
        "Произошла ошибка при сбросе пароля. Попробуйте снова.";
      setError("root", { message });
    },
  });

  var onSubmit = (data: ResetPasswordFormData) => {
    resetPasswordMutation.mutate(data);
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Новый пароль
            </h1>
            <p className="text-balance text-muted-foreground">
              Введите новый пароль для вашего аккаунта
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4"
            suppressHydrationWarning={true}
          >
            <div className="grid gap-2">
              <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">
                Новый пароль
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  {...register("newPassword")}
                  className="bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-700 text-gray-900 dark:text-white pr-10"
                  suppressHydrationWarning={true}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
                Подтвердите пароль
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  className="bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-700 text-gray-900 dark:text-white pr-10"
                  suppressHydrationWarning={true}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-300"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p className="font-medium">Требования к паролю:</p>
              <ul className="space-y-1 text-xs">
                <li>• Минимум 8 символов</li>
                <li>• Хотя бы одна заглавная буква</li>
                <li>• Хотя бы одна строчная буква</li>
                <li>• Хотя бы одна цифра</li>
                <li>• Хотя бы один специальный символ</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Изменение..." : "Изменить пароль"}
            </Button>

            {errors.root && (
              <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <div className="text-red-800 dark:text-red-200">
                  <p className="font-medium">Ошибка</p>
                  <p className="text-sm">{errors.root.message}</p>
                </div>
              </Alert>
            )}
          </form>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Вернуться к входу
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <div className="h-full w-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Новый пароль</h2>
            <p className="text-xl opacity-90">
              Создайте надежный пароль для защиты вашего аккаунта
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;