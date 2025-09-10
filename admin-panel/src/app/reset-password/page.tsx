"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import InvalidTokenView from "@/components/ResetPassword/InvalidTokenView";
import SuccessView from "@/components/ResetPassword/SuccessView";
import ResetPasswordForm from "@/components/ResetPassword/ResetPasswordForm";

var ResetPasswordContent = () => {
  var searchParams = useSearchParams();
  var { 0: isSuccess, 1: setIsSuccess } = useState(false);
  var { 0: token, 1: setToken } = useState<string | null>(null);

  useEffect(() => {
    var tokenFromUrl = searchParams.get("token");
    setToken(tokenFromUrl);
  }, [searchParams]);

  return !token ? (
    <InvalidTokenView />
  ) : isSuccess ? (
    <SuccessView />
  ) : (
    <ResetPasswordForm token={token} onSuccess={() => setIsSuccess(true)} />
  );
};

var ResetPasswordPage = () => (
  <Suspense
    fallback={
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    }
  >
    <ResetPasswordContent />
  </Suspense>
);

export default ResetPasswordPage;