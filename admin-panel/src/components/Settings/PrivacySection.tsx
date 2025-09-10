"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import * as Radix from "@radix-ui/themes";

var PrivacySection = () => {
  var { 0: privacy, 1: setPrivacy } = useState({
    showOnlineStatus: true,
    allowDirectMessages: true,
    showLastSeen: false,
  });

  var handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy((prev) => ({ ...prev, [key]: value }));
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
        onCheckedChange={(checked) => handlePrivacyChange(key, checked)}
      />
    </div>
  );

  return (
    <div className="bg-card rounded-lg shadow border border-border">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-medium text-foreground flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Приватность
        </h3>
      </div>
      <div className="p-6 space-y-6">
        {renderSwitch(
          "showOnlineStatus",
          "Показывать статус онлайн",
          "Другие пользователи смогут видеть, что вы онлайн",
          privacy.showOnlineStatus
        )}
        {renderSwitch(
          "allowDirectMessages",
          "Разрешить личные сообщения",
          "Позволить другим пользователям писать вам напрямую",
          privacy.allowDirectMessages
        )}
        {renderSwitch(
          "showLastSeen",
          "Показывать время последнего посещения",
          "Другие увидят, когда вы были онлайн в последний раз",
          privacy.showLastSeen
        )}
      </div>
    </div>
  );
};

export default PrivacySection;