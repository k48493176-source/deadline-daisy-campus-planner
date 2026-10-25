/** Original Campus Planner mark: a calendar page with a graduation-cap check. */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect x="3" y="6" width="26" height="23" rx="5" fill="var(--color-primary)" />
      <rect x="3" y="6" width="26" height="7" rx="3" fill="var(--color-accent-foreground)" />
      <rect x="9" y="3" width="3" height="6" rx="1.5" fill="var(--color-foreground)" />
      <rect x="20" y="3" width="3" height="6" rx="1.5" fill="var(--color-foreground)" />
      <path d="M10 20.5l4 4 8-8" fill="none" stroke="var(--color-primary-foreground)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
