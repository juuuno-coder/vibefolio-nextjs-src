"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

interface UseInfiniteScrollOptions<T> {
  initialData?: T[];
  fetchFn: (page: number) => Promise<T[]>;
  pageSize?: number;
  threshold?: number;
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => void;
  refresh: () => void;
  ref: (node?: Element | null) => void;
}

/**
 * 무한 스크롤 훅
 */
export function useInfiniteScroll<T>({
  initialData = [],
  fetchFn,
  pageSize = 20,
  threshold = 0.5,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const loadingRef = useRef(false);

  // Intersection Observer
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: false,
  });

  // 데이터 로드
  const loadData = useCallback(async (pageNum: number, append = false) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    
    try {
      if (append) {
        setIsFetchingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const newData = await fetchFn(pageNum);
      
      if (newData.length < pageSize) {
        setHasMore(false);
      }

      if (append) {
        setData((prev) => [...prev, ...newData]);
      } else {
        setData(newData);
      }
      
      setPage(pageNum);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("데이터를 불러오는데 실패했습니다."));
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      loadingRef.current = false;
    }
  }, [fetchFn, pageSize]);

  // 더 불러오기
  const loadMore = useCallback(() => {
    if (!hasMore || loadingRef.current) return;
    loadData(page + 1, true);
  }, [hasMore, page, loadData]);

  // 새로고침
  const refresh = useCallback(() => {
    setHasMore(true);
    loadData(1, false);
  }, [loadData]);

  // 뷰포트에 들어오면 자동 로드
  useEffect(() => {
    if (inView && hasMore && !loadingRef.current) {
      loadMore();
    }
  }, [inView, hasMore, loadMore]);

  // 초기 로드
  useEffect(() => {
    if (initialData.length === 0) {
      loadData(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    ref,
  };
}

/**
 * 간단한 Intersection Observer 훅
 */
export function useIntersection(
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { ref, isIntersecting, entry };
}
