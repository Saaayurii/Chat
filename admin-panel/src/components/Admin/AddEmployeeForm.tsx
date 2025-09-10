"use client";

import { Plus, Mail, Phone, User, Lock, UserPlus } from "lucide-react";
import Button from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import { Input } from "@/components/UI/Input";
import { Label } from "@/components/UI/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/UI/Select";
import { Loading } from "@/components/UI";
import { UserRole } from "@/types";

interface FormData {
  email: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  bio: string;
  role: UserRole;
}

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  fullName?: string;
  phone?: string;
  bio?: string;
  role?: string;
}

interface AddEmployeeFormProps {
  formData: FormData;
  errors: FormErrors;
  onInputChange: (field: keyof FormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

var validateForm = (formData: FormData) => {
  var newErrors: FormErrors = {};

  formData.email
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      ? null
      : (newErrors.email = "Некорректный email адрес")
    : (newErrors.email = "Email обязателен");

  formData.username
    ? formData.username.length >= 3
      ? null
      : (newErrors.username = "Логин должен содержать минимум 3 символа")
    : (newErrors.username = "Логин обязателен");

  formData.password
    ? formData.password.length >= 6
      ? null
      : (newErrors.password = "Пароль должен содержать минимум 6 символов")
    : (newErrors.password = "Пароль обязателен");

  formData.fullName || (newErrors.fullName = "ФИО обязательно");

  formData.phone && !/^\+7\d{10}$/.test(formData.phone)
    ? (newErrors.phone =
        "Введите корректный номер телефона в формате +7XXXXXXXXXX")
    : null;

  return {
    isValid: Object.keys(newErrors).length === 0,
    errors: newErrors,
  };
};

export var AddEmployeeForm = ({
  formData,
  errors,
  onInputChange,
  onSubmit,
  isPending,
}: AddEmployeeFormProps) => (
  <Card className="p-6 sticky top-8">
    <div className="flex items-center space-x-2 mb-6">
      <UserPlus className="w-5 h-5 text-primary" />
      <h2 className="text-lg font-semibold">Добавить сотрудника</h2>
    </div>

    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange("email", e.target.value)}
            className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
            placeholder="user@example.com"
          />
        </div>
        {errors.email ? (
          <p className="text-destructive text-sm">{errors.email}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Логин *</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => onInputChange("username", e.target.value)}
            className={`pl-10 ${errors.username ? "border-destructive" : ""}`}
            placeholder="john_doe"
          />
        </div>
        {errors.username ? (
          <p className="text-destructive text-sm">{errors.username}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Пароль *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => onInputChange("password", e.target.value)}
            className={`pl-10 ${errors.password ? "border-destructive" : ""}`}
            placeholder="Минимум 6 символов"
          />
        </div>
        {errors.password ? (
          <p className="text-destructive text-sm">{errors.password}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Фамилия Имя Отчество *</Label>
        <Input
          id="fullName"
          type="text"
          value={formData.fullName}
          onChange={(e) => onInputChange("fullName", e.target.value)}
          className={errors.fullName ? "border-destructive" : ""}
          placeholder="Иванов Иван Иванович"
        />
        {errors.fullName ? (
          <p className="text-destructive text-sm">{errors.fullName}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Телефон</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => onInputChange("phone", e.target.value)}
            className={`pl-10 ${errors.phone ? "border-destructive" : ""}`}
            placeholder="+79001234567"
          />
        </div>
        {errors.phone ? (
          <p className="text-destructive text-sm">{errors.phone}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Роль *</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => onInputChange("role", value as UserRole)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите роль" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UserRole.OPERATOR}>Оператор</SelectItem>
            <SelectItem value={UserRole.ADMIN}>Администратор</SelectItem>
            <SelectItem value={UserRole.VISITOR}>Посетитель</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loading className="mr-2" />
              Сохранение...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Сохранить
            </>
          )}
        </Button>
      </div>
    </form>
  </Card>
);
