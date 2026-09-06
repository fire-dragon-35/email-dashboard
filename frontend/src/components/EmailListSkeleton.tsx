const SKELETON_ROWS = 6;

interface EmailListSkeletonProps {
  label: string;
  active?: boolean;
}

export function EmailListSkeleton({ label, active = false }: EmailListSkeletonProps) {
  return (
    <div className={active ? 'email-skeleton' : 'email-skeleton email-skeleton--idle'}>
      <p className="email-skeleton__label">{label}</p>
      <ul className="email-list" aria-hidden="true">
        {Array.from({ length: SKELETON_ROWS }, (_, i) => (
          <li
            key={i}
            className={active ? 'email-item email-item--shimmer' : 'email-item'}
          >
            <div className="skeleton-bar skeleton-bar--meta" />
            <div className="skeleton-bar skeleton-bar--subject" />
          </li>
        ))}
      </ul>
    </div>
  );
}
