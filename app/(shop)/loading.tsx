import { ProductCardSkeleton } from '@/components/ui/misc';

export default function Loading() {
  return (
    <div className="container-x py-8">
      <div className="skeleton h-6 w-40 rounded-full" />
      <div className="mt-3 skeleton h-3.5 w-72 rounded-full" />
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
