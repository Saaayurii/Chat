"use client";

import Link from "next/link";
import Button from "@/components/UI/Button";
import { Alert } from "@/components/UI/Alert";
import { AlertCircle, ArrowLeft } from "lucide-react";

var InvalidTokenView = () => (
  <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
    <div className="flex items-center justify-center py-12">
      <div className="mx-auto grid w-[400px] gap-6">
        <div className="grid gap-2 text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Недействительная ссылка
          </h1>
          <p className="text-balance text-muted-foreground">
            Ссылка для сброса пароля недействительна или устарела
          </p>
        </div>

        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <div className="text-red-800 dark:text-red-200">
            <p className="font-medium mb-1">Ссылка недействительна</p>
            <p className="text-sm">
              Возможно, ссылка устарела или была использована ранее.
              Запросите новую ссылку для сброса пароля.
            </p>
          </div>
        </Alert>

        <div className="space-y-3">
          <Link href="/reset">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Запросить новую ссылку
            </Button>
          </Link>

          <Link href="/login">
            <Button
              variant="outline"
              className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться к входу
            </Button>
          </Link>
        </div>
      </div>
    </div>
    <div className="hidden bg-muted lg:block">
      <div className="h-full w-full bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h2 className="text-4xl font-bold mb-4">Ссылка недействительна</h2>
          <p className="text-xl opacity-90">
            Запросите новую ссылку для сброса пароля
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default InvalidTokenView;