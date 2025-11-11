// frontend/src/hooks/useApi.js - UPDATED với better error handling
import { useState, useCallback } from 'react';

const API = 'http://localhost:5000/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Wrapper function cho tất cả requests
   * - Set loading state
   * - Catch errors
   * - Format error message cho user
   */
  const executeAsync = useCallback(async (asyncFn, errorMessage = 'Có lỗi xảy ra') => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      
      // Check if response was successful
      if (result && typeof result === 'object') {
        if (result.error) {
          throw new Error(result.error);
        }
        return result;
      }
      
      throw new Error('Invalid response format');
    } catch (err) {
      const message = err.message || errorMessage;
      setError(message);
      console.error('❌ API Error:', message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ Upload APIs ============
  const upload = useCallback(async (file) => {
    return executeAsync(async () => {
      const form = new FormData();
      form.append('file', file);
      
      const res = await fetch(`${API}/upload`, {
        method: 'POST',
        body: form
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }
      return data;
    }, 'Upload thất bại');
  }, [executeAsync]);

  const download = useCallback(async () => {
    return executeAsync(async () => {
      const res = await fetch(`${API}/download`);
      
      if (!res.ok) {
        throw new Error(`Download failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'export.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    }, 'Tải xuống thất bại');
  }, [executeAsync]);

  // ============ Doanh số APIs ============
  const fetchDoanhsoData = useCallback(async () => {
    return executeAsync(async () => {
      const res = await fetch(`${API}/data/doanhso`);
      
      if (!res.ok) {
        throw new Error(`Fetch failed (${res.status})`);
      }

      return res.json();
    }, 'Không thể tải dữ liệu Doanh số');
  }, [executeAsync]);

  const filterDoanhso = useCallback(async (custcode = '', classification = '') => {
    return executeAsync(async () => {
      const url = new URL(`${API}/filter/doanhso`);
      if (custcode) url.searchParams.set('custcode', custcode);
      if (classification && classification !== 'all') {
        url.searchParams.set('classification', classification);
      }

      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Filter failed (${res.status})`);
      }

      return res.json();
    }, 'Lọc dữ liệu thất bại');
  }, [executeAsync]);

  const fetchDoanhsoAnalytics = useCallback(async () => {
    return executeAsync(async () => {
      const res = await fetch(`${API}/analytics/doanhso`);
      
      if (!res.ok) {
        throw new Error(`Analytics failed (${res.status})`);
      }

      return res.json();
    }, 'Không thể tải phân tích');
  }, [executeAsync]);

  // ============ DSKH APIs ============
  const fetchDskhData = useCallback(async () => {
    return executeAsync(async () => {
      const res = await fetch(`${API}/data/dskh`);
      
      if (!res.ok) {
        throw new Error(`Fetch failed (${res.status})`);
      }

      return res.json();
    }, 'Không thể tải dữ liệu DSKH');
  }, [executeAsync]);

  const filterDskh = useCallback(async (filters) => {
    return executeAsync(async () => {
      const url = new URL(`${API}/filter/dskh`);
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'all') {
          url.searchParams.set(k, v);
        }
      });

      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Filter failed (${res.status})`);
      }

      return res.json();
    }, 'Lọc dữ liệu DSKH thất bại');
  }, [executeAsync]);

  const fetchDskhAnalytics = useCallback(async () => {
    return executeAsync(async () => {
      const res = await fetch(`${API}/analytics/dskh`);
      
      if (!res.ok) {
        throw new Error(`Analytics failed (${res.status})`);
      }

      return res.json();
    }, 'Không thể tải phân tích DSKH');
  }, [executeAsync]);

  // ============ Tuyen APIs ============
  const fetchTuyenData = useCallback(async () => {
    return executeAsync(async () => {
      const res = await fetch(`${API}/data/tuyen`);
      
      if (!res.ok) {
        throw new Error(`Fetch failed (${res.status})`);
      }

      return res.json();
    }, 'Không thể tải dữ liệu Tuyến');
  }, [executeAsync]);

  const filterTuyen = useCallback(async (filters) => {
    return executeAsync(async () => {
      const url = new URL(`${API}/filter/tuyen`);
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'all') {
          url.searchParams.set(k, v);
        }
      });

      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Filter failed (${res.status})`);
      }

      return res.json();
    }, 'Lọc dữ liệu Tuyến thất bại');
  }, [executeAsync]);

   // ============ Chi tiết tuyến APIs ============
  const fetchChiTietData = useCallback(async () => {
    return executeAsync(async () => {
      const res = await fetch(`${API}/data/chitiet`);
      
      if (!res.ok) {
        throw new Error(`Fetch failed (${res.status})`);
      }

      return res.json();
    }, 'Không thể tải dữ liệu Chi tiết tuyến');
  }, [executeAsync]);

  const filterChiTiet = useCallback(async (filters) => {
    return executeAsync(async () => {
      const url = new URL(`${API}/filter/chitiet`);
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'all') {
          url.searchParams.set(k, v);
        }
      });

      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Filter failed (${res.status})`);
      }

      return res.json();
    }, 'Lọc dữ liệu Chi tiết tuyến thất bại');
  }, [executeAsync]);

  const fetchChiTietAnalytics = useCallback(async () => {
    return executeAsync(async () => {
      const res = await fetch(`${API}/analytics/chitiet`);
      
      if (!res.ok) {
        throw new Error(`Analytics failed (${res.status})`);
      }

      return res.json();
    }, 'Không thể tải phân tích Chi tiết tuyến');
  }, [executeAsync]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);
  

  return {
    loading,
    error,
    clearError,
    
    // Upload
    upload,
    download,
    
    // Doanh số
    fetchDoanhsoData,
    filterDoanhso,
    fetchDoanhsoAnalytics,
    
    // DSKH
    fetchDskhData,
    filterDskh,
    fetchDskhAnalytics,
    
    // Tuyen
    fetchTuyenData,
    filterTuyen,
    
    // Chi tiết tuyến
    fetchChiTietData,
    filterChiTiet,
    fetchChiTietAnalytics,
  };
};