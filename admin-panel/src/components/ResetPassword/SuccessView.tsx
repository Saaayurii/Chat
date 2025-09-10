"use client";

import Link from "next/link";
import Button from "@/components/UI/Button";
import { Alert } from "@/components/UI/Alert";
import { CheckCircle } from "lucide-react";

var SuccessView = () => (
  <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
    <div className="flex items-center justify-center py-12">
      <div className="mx-auto grid w-[400px] gap-6">
        <div className="grid gap-2 text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Пароль изменен
          </h1>
          <p className="text-balance text-muted-foreground">
            Ваш пароль был успешно изменен. Теперь вы можете войти в систему с новым паролем.
          </p>
        </div>

        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <div className="text-green-800 dark:text-green-200">
            <p className="font-medium mb-1">Успешно!</p>
            <p className="text-sm">
              Пароль был изменен. Используйте новый пароль для входа в систему.
            </p>
          </div>
        </Alert>

        <Link href="/login">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Войти в систему
          </Button>
        </Link>
      </div>
    </div>
    <div className="hidden bg-muted lg:block">
      <div className="h-full w-full bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
        <div className="text-center text-white">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h2 className="text-4xl font-bold mb-4">Готово!</h2>
          <p className="text-xl opacity-90">Ваш пароль был успешно изменен</p>
        </div>
      </div>
    </div>
  </div>
);

export default SuccessView;