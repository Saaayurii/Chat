"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import * as Radix from "@radix-ui/themes";

var NotificationsSection = () => {
  var { 0: notifications, 1: setNotifications } = useState({
    email: true,
    push: true,
    desktop: false,
    newMessages: true,
    systemUpdates: false,
  });

  var handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  var renderSwitch = (
    key: string,
    title: string,
    description: string,
    checked: boolean
  ) => (
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Radix.Switch
        checked={checked}
        onCheckedChange={(checked) => handleNotificationChange(key, checked)}
      />
    </div>
  );

  return (
    <div className="bg-card rounded-lg shadow border border-border">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-medium text-foreground flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Уведомления
        </h3>
      </div>
      <div className="p-6 space-y-6">
        {renderSwitch(
          "email",
          "Email уведомления",
          "Получать уведомления на email",
          notifications.email
        )}
        {renderSwitch(
          "push",
          "Push уведомления",
          "Получать push уведомления в браузере",
          notifications.push
        )}
        {renderSwitch(
          "desktop",
          "Уведомления на рабочем столе",
          "Показывать уведомления на рабочем столе",
          notifications.desktop
        )}
        {renderSwitch(
          "newMessages",
          "Новые сообщения",
          "Уведомления о новых сообщениях",
          notifications.newMessages
        )}
        {renderSwitch(
          "systemUpdates",
          "Системные обновления",
          "Уведомления об обновлениях системы",
          notifications.systemUpdates
        )}
      </div>
    </div>
  );
};

export default NotificationsSection;