"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserRole } from "@/types";
import { AddEmployeeForm } from "@/components/Admin/AddEmployeeForm";
import { UsersFilters } from "@/components/Admin/UsersFilters";
import { UsersList } from "@/components/Admin/UsersList";

import { useAuthStore } from "@/store/authStore";
import { usersAPI, CreateUserData } from "@/core/api";
import { useNotifications } from "@/hooks/useNotifications";

interface FormData {
  email: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  bio: string;
  role: typeof UserRole[keyof typeof UserRole];
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

export default function AdminUsersPage() {
  var queryClient = useQueryClient();
  var { success: showSuccess, error: showError } = useNotifications();

  var { 0: searchQuery, 1: setSearchQuery } = useState("");
  var { 0: debouncedSearchQuery, 1: setDebouncedSearchQuery } = useState("");
  var { 0: selectedRole, 1: setSelectedRole } = useState<typeof UserRole[keyof typeof UserRole] | "">("");
  var { 0: page, 1: setPage } = useState(1);

  var { 0: formData, 1: setFormData } = useState<FormData>({
    email: "",
    username: "",
    password: "",
    fullName: "",
    phone: "",
    bio: "",
    role: UserRole.OPERATOR,
  });
  var { 0: errors, 1: setErrors } = useState<FormErrors>({});

  useEffect(() => {
    var timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  var { data: usersData, isLoading } = useQuery({
    queryKey: ["users", page, selectedRole, debouncedSearchQuery],
    queryFn: () => Promise.resolve(usersAPI.getUsers({
      page,
      limit: 10,
      role: selectedRole || undefined,
      search: debouncedSearchQuery || undefined,
    }).then(response => response.data)),
  });

  var createUserMutation = useMutation({
    mutationFn: (data: CreateUserData) => usersAPI.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("Сотрудник успешно добавлен");
      resetForm();
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      var errorMessage = error.response?.data?.message || "Ошибка при создании сотрудника";
      showError(errorMessage);
    },
  });

  var blockUserMutation = useMutation({
    mutationFn: (userId: string) => usersAPI.toggleUserBlock(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("Статус блокировки изменен");
    },
  });

  var deleteUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      usersAPI.deleteUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("Сотрудник удален");
    },
  });

  var activateUserMutation = useMutation({
    mutationFn: (userId: string) => usersAPI.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("Пользователь активирован");
    },
  });

  var validateForm = () => {
    var newErrors: FormErrors = {};

    !formData.email ? 
      (newErrors.email = "Email обязателен") :
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 
        null : (newErrors.email = "Некорректный email адрес");

    !formData.username ?
      (newErrors.username = "Логин обязателен") :
      formData.username.length >= 3 ?
        null : (newErrors.username = "Логин должен содержать минимум 3 символа");

    !formData.password ?
      (newErrors.password = "Пароль обязателен") :
      formData.password.length >= 6 ?
        null : (newErrors.password = "Пароль должен содержать минимум 6 символов");

    !formData.fullName && (newErrors.fullName = "ФИО обязательно");

    formData.phone && !/^\+7\d{10}$/.test(formData.phone) ?
      (newErrors.phone = "Введите корректный номер телефона в формате +7XXXXXXXXXX") :
      null;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  var resetForm = () => {
    setFormData({
      email: "",
      username: "",
      password: "",
      fullName: "",
      phone: "",
      bio: "",
      role: UserRole.OPERATOR,
    });
    setErrors({});
  };

  var handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    validateForm() ? createUserMutation.mutate({
      email: formData.email,
      username: formData.username,
      password: formData.password,
      fullName: formData.fullName || undefined,
      phone: formData.phone || undefined,
      bio: formData.bio || undefined,
      role: formData.role,
    }) : null;
  };

  var handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    errors[field] ? setErrors((prev) => ({ ...prev, [field]: undefined })) : null;
  };

  var handleBlockUser = (userId: string) => {
    window.confirm("Вы уверены, что хотите изменить статус блокировки пользователя?") ?
      blockUserMutation.mutate(userId) : null;
  };

  var handleDeleteUser = (userId: string) => {
    var reason = window.prompt("Укажите причину удаления:");
    reason ? deleteUserMutation.mutate({ userId, reason }) : null;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col xl:flex-row gap-8">
          <aside className="w-full xl:w-80">
            <AddEmployeeForm
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              isPending={createUserMutation.isPending}
            />
          </aside>

          <main className="flex-1">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Сотрудники</h1>
                <p className="text-muted-foreground mt-1">
                  Управление сотрудниками системы
                </p>
              </div>

              <UsersFilters
                searchQuery={searchQuery}
                selectedRole={selectedRole}
                onSearchChange={setSearchQuery}
                onRoleChange={setSelectedRole}
                onReset={() => {
                  setSearchQuery("");
                  setSelectedRole("");
                  setPage(1);
                }}
              />

              <UsersList
                usersData={usersData}
                isLoading={isLoading}
                page={page}
                onPageChange={setPage}
                onBlockUser={handleBlockUser}
                onDeleteUser={handleDeleteUser}
                onActivateUser={(userId) => activateUserMutation.mutate(userId)}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
