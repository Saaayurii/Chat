'use client';

import Link from 'next/link';
import { Home, ArrowLeft, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-8xl md:text-9xl font-bold text-blue-100 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-blue-500 text-white p-4 rounded-full animate-bounce">
              <MessageCircle size={48} />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4 mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Страница не найдена
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            К сожалению, страница, которую вы ищете, не существует или была перемещена.
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="flex justify-center mb-12">
          <div className="grid grid-cols-3 gap-4">
            <div className="w-3 h-3 bg-blue-300 rounded-full animate-pulse delay-0"></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-150"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-300"></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Вернуться назад
          </button>
          
          <Link
            href="/"
            className="flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <Home className="w-5 h-5 mr-2" />
            На главную
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Не можете найти то, что ищете?
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link 
              href="/chat" 
              className="text-blue-500 hover:text-blue-600 hover:underline"
            >
              Чат с поддержкой
            </Link>
            <Link 
              href="/profile" 
              className="text-blue-500 hover:text-blue-600 hover:underline"
            >
              Профиль
            </Link>
            <Link 
              href="/settings" 
              className="text-blue-500 hover:text-blue-600 hover:underline"
            >
              Настройки
            </Link>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100 rounded-full opacity-10 animate-spin-slow"></div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
}