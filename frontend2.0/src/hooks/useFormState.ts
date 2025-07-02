'use client';

import { useState, useCallback } from 'react';

export function useFormState<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setFieldError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const setFieldTouched = useCallback(<K extends keyof T>(field: K, touched: boolean = true) => {
    setTouched(prev => ({ ...prev, [field]: touched }));
  }, []);

  const setAllErrors = useCallback((newErrors: Partial<Record<keyof T, string>>) => {
    setErrors(newErrors);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const handleChange = useCallback(<K extends keyof T>(field: K) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setValue(field, e.target.value as T[K]);
    };
  }, [setValue]);

  const handleBlur = useCallback(<K extends keyof T>(field: K) => {
    return () => {
      setFieldTouched(field);
    };
  }, [setFieldTouched]);

  const isFieldInvalid = useCallback(<K extends keyof T>(field: K) => {
    return Boolean(touched[field] && errors[field]);
  }, [touched, errors]);

  const isFormValid = useCallback(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldError,
    setFieldTouched,
    setAllErrors,
    clearErrors,
    reset,
    handleChange,
    handleBlur,
    isFieldInvalid,
    isFormValid
  };
}