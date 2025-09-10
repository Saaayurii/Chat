"use client";

import PasswordSection from "@/components/Settings/PasswordSection";
import NotificationsSection from "@/components/Settings/NotificationsSection";
import PrivacySection from "@/components/Settings/PrivacySection";
import AccountInfoSection from "@/components/Settings/AccountInfoSection";

var SettingsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Настройки</h1>
          <p className="text-muted-foreground">
            Управляйте настройками вашего аккаунта
          </p>
        </div>

        <div className="space-y-8">
          <PasswordSection />
          <NotificationsSection />
          <PrivacySection />
          <AccountInfoSection />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;