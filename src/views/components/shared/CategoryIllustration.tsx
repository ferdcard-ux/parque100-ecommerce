interface CategoryIllustrationProps {
  icon: string;
  className?: string;
}

export function CategoryIllustration({ icon, className = 'h-8 w-8' }: CategoryIllustrationProps) {
  const common = {
    className,
    viewBox: '0 0 48 48',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  switch (icon) {
    case 'vegetables':
      return <svg {...common}><path d="M24 39V18" /><path d="M24 22C11 22 9 12 10 8c8 0 14 4 14 14Z" /><path d="M24 26c13 0 15-10 14-14-8 0-14 4-14 14Z" /><path d="M18 40h12" /><path d="m18 17 6 5m12-5-12 9" /></svg>;
    case 'fruit':
      return <svg {...common}><path d="M24 17c-2-5-7-6-10-3-7 6-6 20 1 27 4 4 8 1 9 1s5 3 9-1c7-7 8-21 1-27-3-3-8-2-10 3Z" /><path d="M24 16c0-7 5-11 12-11-1 6-5 10-12 11Z" /><path d="M23 26c1 3 1 7 0 10" /></svg>;
    case 'meat':
      return <svg {...common}><path d="M17 17c6-7 16-8 21-3 4 4 2 10-3 15l-9 9c-4 4-10 5-14 1-5-5-3-12 2-17l3-5Z" /><path d="m15 17-5-5a4 4 0 0 0-6 6l5 5m8-6 4 4" /><circle cx="30" cy="20" r="2" /><path d="M20 29c3 2 6 2 9 0" /></svg>;
    case 'grains':
      return <svg {...common}><path d="M24 42V9" /><path d="M24 17c-8 0-11-5-11-9 7 0 11 3 11 9Zm0 8c-8 0-11-5-11-9 7 0 11 3 11 9Zm0 8c-8 0-11-5-11-9 7 0 11 3 11 9Zm0-16c8 0 11-5 11-9-7 0-11 3-11 9Zm0 8c8 0 11-5 11-9-7 0-11 3-11 9Zm0 8c8 0 11-5 11-9-7 0-11 3-11 9Z" /><path d="M19 42h10" /></svg>;
    case 'dairy':
      return <svg {...common}><path d="M18 7h12v6l4 5v22H14V18l4-5V7Z" /><path d="M18 13h12m-16 7h20M14 32h20" /><path d="M21 25h6" /></svg>;
    case 'bakery':
      return <svg {...common}><path d="M8 31c0-10 7-18 16-18s16 8 16 18v8H8v-8Z" /><path d="M17 22c-2 3-3 6-3 9m13-9c2 3 3 6 3 9" /><path d="M8 34h32" /></svg>;
    case 'drink':
      return <svg {...common}><path d="M19 7h10v7l5 6v18H14V20l5-6V7Z" /><path d="M19 14h10m-15 9h20m-20 9h20" /><path d="M22 4h4v3h-4z" /></svg>;
    case 'cleaning':
      return <svg {...common}><path d="M21 8h13l-2 6v25H16V16l5-8Z" /><path d="M21 8V5h10v3m-15 10h17m-12 7h7" /><path d="M36 11h4m-2-4v4m-5-7 3-3" /></svg>;
    default:
      return <svg {...common}><path d="M7 18h34v23H7z" /><path d="m7 18 5-11h24l5 11M7 25h34" /><path d="M17 25v16m14-16v16" /></svg>;
  }
}
