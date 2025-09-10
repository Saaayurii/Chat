"use client";

import { useAuthStore } from "@/store/authStore";
import * as Radix from "@radix-ui/themes";

var AccountInfoSection = () => {
  var { user } = useAuthStore();

  return (
    <div className="bg-card rounded-lg shadow border border-border">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-medium text-foreground">
          Информация об аккаунте
        </h3>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground">
              ID пользователя
            </label>
            <p className="text-sm text-foreground font-mono">{user?.id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Дата регистрации
            </label>
            <p className="text-sm text-foreground">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "Неизвестно"}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Статус активации
            </label>
            <Radix.Badge
              color={user?.isActivated ? "green" : "orange"}
              variant="soft"
            >
              {user?.isActivated ? "Активирован" : "Не активирован"}
            </Radix.Badge>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Последнее обновление
            </label>
            <p className="text-sm text-foreground">
              {user?.updatedAt
                ? new Date(user.updatedAt).toLocaleDateString()
                : "Неизвестно"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountInfoSection;