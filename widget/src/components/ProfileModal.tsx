import React from "react";
import { X, LogOut } from "lucide-react";
import Button from "./UI/Button";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  onLogout: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
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

  const getRoleName = (role: string) => {
    switch (role) {
      case "VISITOR": return "Посетитель";
      case "OPERATOR": return "Оператор";
      case "ADMIN": return "Администратор";
      default: return role;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
              {userData.profile?.fullName || userData.fullName || userData.username || "Не указано"}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
              {userData.email || "Не указано"}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Статус аккаунта
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                userData.isActivated ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {userData.isActivated ? "Активирован" : "Не активирован"}
              </span>
            </div>
          </div>
          
          {userData.role && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Роль
              </label>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                {getRoleName(userData.role)}
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