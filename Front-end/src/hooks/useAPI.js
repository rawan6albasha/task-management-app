import { useState, useCallback } from "react";
import api from "../lib/axios";

/**
 * Hook قابل لإعادة الاستخدام لعمليات API
 * يتعامل مع Loading, Error, Success
 */
export function useAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // GET Request
  const fetchData = useCallback(async (url) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(url);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "حدث خطأ";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // POST Request
  const postData = useCallback(async (url, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(url, data);
      setSuccess(response.data?.message || "تم العملية بنجاح");
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "فشلت العملية";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // PUT Request
  const putData = useCallback(async (url, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(url, data);
      setSuccess(response.data?.message || "تم التحديث بنجاح");
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "فشل التحديث";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // DELETE Request
  const deleteData = useCallback(async (url) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.delete(url);
      setSuccess(response.data?.message || "تم الحذف بنجاح");
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "فشل الحذف";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    loading,
    error,
    success,
    fetchData,
    postData,
    putData,
    deleteData,
    clearMessages,
  };
}
