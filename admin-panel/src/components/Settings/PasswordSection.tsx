"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Save, Lock, Eye, EyeOff } from "lucide-react";

var passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: z
      .string()
      .min(8, "Минимум 8 символов")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Пароль должен содержать заглавную букву, строчную букву, цифру и спецсимвол"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

var PasswordSection = () => {
  var { 0: showCurrentPassword, 1: setShowCurrentPassword } = useState(false);
  var { 0: showNewPassword, 1: setShowNewPassword } = useState(false);
  var { 0: showConfirmPassword, 1: setShowConfirmPassword } = useState(false);

  var {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  var changePasswordMutation = useMutation({
    mutationFn: (data: PasswordFormData) => {
      return new Promise((resolve) => setTimeout(resolve, 1000))
        .then(() => ({ success: true }));
    },
    onSuccess: () => {
      reset();
    },
  });

  var onSubmitPassword = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  var renderPasswordInput = (
    label: string,
    name: keyof PasswordFormData,
    showPassword: boolean,
    setShowPassword: (show: boolean) => void
  ) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          {...register(name)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {errors[name] && (
        <p className="text-destructive text-sm mt-1">
          {errors[name]?.message}
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-card rounded-lg shadow border border-border">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-medium text-foreground flex items-center">
          <Lock className="w-5 h-5 mr-2" />
          Безопасность
        </h3>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-6">
          {renderPasswordInput(
            "Текущий пароль",
            "currentPassword",
            showCurrentPassword,
            setShowCurrentPassword
          )}
          {renderPasswordInput(
            "Новый пароль",
            "newPassword",
            showNewPassword,
            setShowNewPassword
          )}
          {renderPasswordInput(
            "Подтвердите новый пароль",
            "confirmPassword",
            showConfirmPassword,
            setShowConfirmPassword
          )}

          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {changePasswordMutation.isPending ? "Сохранение..." : "Изменить пароль"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordSection;