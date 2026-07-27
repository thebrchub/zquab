import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export default function PaginationLoader({ onLoadMore, hasMore, isLoading }: Props) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [onLoadMore, hasMore, isLoading]);

  if (!hasMore) return null;

  return (
    <div ref={observerTarget} className="w-full py-6 flex justify-center items-center">
      {isLoading && <Loader2 className="w-6 h-6 text-[#3B82F6] animate-spin" />}
    </div>
  );
}