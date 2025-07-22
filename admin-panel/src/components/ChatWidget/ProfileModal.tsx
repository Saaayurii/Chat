"use client";

import React from "react";
import { X, LogOut } from "lucide-react";
import Button from "../UI/Button";
import { Badge } from "../UI";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userData,
  onLogout,
}) => {
  if (!isOpen || !userData) return null;

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-[10000]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Профиль</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Имя
            </label>
            <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
              {userData.fullName || userData.username || "Не указано"}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
              {userData.email}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Статус аккаунта
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Badge variant={userData.isActivated ? "default" : "secondary"}>
                {userData.isActivated ? "Активирован" : "Не активирован"}
              </Badge>
            </div>
          </div>
          {userData.role && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Роль
              </label>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                {userData.role === "VISITOR"
                  ? "Посетитель"
                  : userData.role === "OPERATOR"
                  ? "Оператор"
                  : userData.role === "ADMIN"
                  ? "Администратор"
                  : userData.role}
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Выйти из аккаунта
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
