import React, { useState } from 'react';
import { Bell, BellOff, Volume2, VolumeX, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Label } from '../UI/Label';
import Button from '../UI/Button';

interface PresenceSettingsProps {
  enableNotifications: boolean;
  playNotificationSounds: boolean;
  showBrowserNotifications: boolean;
  onSettingsChange: (settings: {
    enableNotifications: boolean;
    playNotificationSounds: boolean;
    showBrowserNotifications: boolean;
  }) => void;
  className?: string;
}

const PresenceSettings: React.FC<PresenceSettingsProps> = ({
  enableNotifications,
  playNotificationSounds,
  showBrowserNotifications,
  onSettingsChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (setting: string, value: boolean) => {
    const newSettings = {
      enableNotifications,
      playNotificationSounds,
      showBrowserNotifications,
      [setting]: value
    };
    
    // Если отключаем общие уведомления, отключаем и остальные
    if (setting === 'enableNotifications' && !value) {
      newSettings.playNotificationSounds = false;
      newSettings.showBrowserNotifications = false;
    }
    
    onSettingsChange(newSettings);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        handleToggle('showBrowserNotifications', true);
      }
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`${className} p-2`}
        title="Настройки уведомлений"
      >
        <Settings className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Настройки присутствия
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="p-1"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Общие уведомления */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {enableNotifications ? (
              <Bell className="w-4 h-4 text-green-500" />
            ) : (
              <BellOff className="w-4 h-4 text-gray-400" />
            )}
            <Label className="text-sm font-medium">
              Уведомления о статусе
            </Label>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enableNotifications}
              onChange={(e) => handleToggle('enableNotifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Звуковые уведомления */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {playNotificationSounds ? (
              <Volume2 className="w-4 h-4 text-blue-500" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400" />
            )}
            <Label className="text-sm font-medium">
              Звуковые уведомления
            </Label>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={playNotificationSounds}
              disabled={!enableNotifications}
              onChange={(e) => handleToggle('playNotificationSounds', e.target.checked)}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${!enableNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
          </label>
        </div>

        {/* Браузерные уведомления */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className={`w-4 h-4 ${showBrowserNotifications ? 'text-purple-500' : 'text-gray-400'}`} />
            <Label className="text-sm font-medium">
              Браузерные уведомления
            </Label>
          </div>
          
          {showBrowserNotifications ? (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showBrowserNotifications}
                disabled={!enableNotifications}
                onChange={(e) => handleToggle('showBrowserNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${!enableNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
            </label>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={requestNotificationPermission}
              disabled={!enableNotifications}
              className="text-xs"
            >
              Разрешить
            </Button>
          )}
        </div>

        {/* Информация */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          <p>• Уведомления показываются при подключении/отключении пользователей</p>
          <p>• Звуки проигрываются только для важных событий</p>
          <p>• Браузерные уведомления требуют разрешения</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PresenceSettings;