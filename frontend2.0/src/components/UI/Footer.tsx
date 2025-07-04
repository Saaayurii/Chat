'use client';

import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Logo and description */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">C</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Chat System</h3>
              <p className="text-xs text-muted-foreground">Система онлайн поддержки</p>
            </div>
          </div>

          {/* Navigation links */}
          <div className="flex items-center space-x-6">
            <a 
              href="/about" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              О нас
            </a>
            <a 
              href="/privacy" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Конфиденциальность
            </a>
            <a 
              href="/terms" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Условия использования
            </a>
            <a 
              href="/support" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Поддержка
            </a>
          </div>

          {/* Copyright */}
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} Создано с</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>для пользователей</span>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-6 pt-4 border-t border-border text-center">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <p className="text-xs text-muted-foreground">
              Версия 2.0 | Последнее обновление: {new Date().toLocaleDateString()}
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Система работает</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Время отклика: &lt;100мс
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}