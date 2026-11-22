/** The Apex mark: an "A" whose crossbar is a cricket ball. Single source of truth is /logo.svg. */
export function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.svg" width={size} height={size} alt="" aria-hidden="true" decoding="async" className={`shrink-0 select-none ${className}`} draggable={false} />;
}
