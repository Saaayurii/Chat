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

  

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl border border-gray-200/50 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200/50 backdrop-blur-sm bg-gradient-to-r from-blue-50/50 to-purple-50/50">
          <h2 className="text-xl font-semibold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">👤 Профиль</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 bg-gradient-to-br from-white to-gray-50/50">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Имя
            </label>
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl text-gray-900 font-medium shadow-sm border border-gray-200/30">
              {userData.profile?.fullName || userData.fullName || userData.username || "Не указано"}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl text-gray-900 font-medium shadow-sm border border-blue-200/30">
              {userData.email || "Не указано"}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Статус аккаунта
            </label>
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl shadow-sm border border-gray-200/30">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
                userData.isActivated ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
              }`}>
                {userData.isActivated ? "✅ Активирован" : "⏳ Не активирован"}
              </span>
            </div>
          </div>
          <div className="pt-5 border-t border-gray-200/50 backdrop-blur-sm bg-gradient-to-r from-red-50/30 to-pink-50/30">
            <Button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
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