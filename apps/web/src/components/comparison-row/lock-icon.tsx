/**
 * Same body lucide's Lock/LockOpen share; the shackle is its own path so it
 * can swing open on its left hinge instead of crossfading between icons.
 * A CSS transition keeps it interruptible and off the main thread.
 */
export function AnimatedLockIcon({
  className,
  locked,
}: {
  className?: string;
  locked: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
      <path
        className="origin-bottom-left transition-transform duration-[180ms] ease-(--ease-out) [transform-box:fill-box] motion-reduce:transition-none"
        d="M7 11V7a5 5 0 0 1 10 0v4"
        style={{ transform: locked ? "rotate(0deg)" : "rotate(-28deg)" }}
      />
    </svg>
  );
}
