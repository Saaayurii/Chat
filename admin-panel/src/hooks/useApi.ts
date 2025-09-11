import { useState } from 'react';

type ApiState<T> = {
  0: T | null;
  1: boolean;
  2: string | null;
  3: (promise: Promise<any>) => Promise<T>;
  4: () => void;
};

export var useApi = <T = any>(): ApiState<T> => {
  var [data, setData] = useState<T | null>(null);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState<string | null>(null);

  var execute = (promise: Promise<any>): Promise<T> => {
    setLoading(true);
    setError(null);
    
    return promise
      .then((response) => {
        var result = response.data || response;
        setData(result);
        setLoading(false);
        return result;
      })
      .catch((err) => {
        var errorMessage = err?.response?.data?.message || err?.message || 'Произошла ошибка';
        setError(errorMessage);
        setLoading(false);
        throw err;
      });
  };

  var reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  return { 0: data, 1: loading, 2: error, 3: execute, 4: reset };
};