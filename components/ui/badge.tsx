import { cn } from '@/lib/utils';

type Tone = 'sage' | 'blush' | 'ink' | 'cream' | 'outline';

const tones: Record<Tone, string> = {
  sage: 'bg-sage-100 text-sage-700',
  blush: 'bg-blush-100 text-blush-500',
  ink: 'bg-ink-900/90 text-cream-50 backdrop-blur-sm',
  cream: 'bg-cream-200/95 text-ink-700 backdrop-blur-sm',
  outline: 'border border-line text-ink-500',
};

export function Badge({
  children,
  tone = 'sage',
  className,
  dot,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium leading-none',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export function StockBadge({ stock, className }: { stock: number; className?: string }) {
  if (stock <= 0)
    return (
      <Badge tone="cream" className={className} dot>
        ناموجود
      </Badge>
    );
  if (stock <= 5)
    return (
      <Badge tone="blush" className={className} dot>
        تنها {new Intl.NumberFormat('fa-IR').format(stock)} عدد
      </Badge>
    );
  return null;
}
