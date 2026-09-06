import { buildPageList } from './emailListHelpers';

interface PaginationControlsProps {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ currentPage, pageCount, onPageChange }: PaginationControlsProps) {
  if (pageCount <= 1) return null;

  return (
    <nav className="email-list__pagination" aria-label="Email list pages">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        ‹
      </button>
      {buildPageList(currentPage, pageCount).map((token, index) =>
        token === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="email-list__page-ellipsis">
            …
          </span>
        ) : (
          <button
            key={token}
            type="button"
            className={
              token === currentPage ? 'email-list__page email-list__page--active' : 'email-list__page'
            }
            aria-current={token === currentPage ? 'page' : undefined}
            onClick={() => onPageChange(token)}
          >
            {token}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={currentPage === pageCount}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}
