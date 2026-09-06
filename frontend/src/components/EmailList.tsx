import { useMemo, useState } from 'react';
import { useMailData } from '../context/MailDataContext';
import { EmailListFilters } from './EmailListFilters';
import { EmailListItem } from './EmailListItem';
import { EmailListSkeleton } from './EmailListSkeleton';
import { PaginationControls } from './PaginationControls';

const PAGE_SIZE = 10;

interface EmailListProps {
  onSelect: (uid: number) => void;
}

export function EmailList({ onSelect }: EmailListProps) {
  const { status, messages, selectedCategoryId } = useMailData();
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);

  const inCategory = useMemo(
    () => messages.filter((message) => message.categoryId === selectedCategoryId),
    [messages, selectedCategoryId],
  );

  const filtered = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    return inCategory.filter((message) => {
      if (search && !`${message.subject} ${message.from}`.toLowerCase().includes(search)) return false;
      return true;
    });
  }, [inCategory, searchText]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (status === 'loading') {
    return <EmailListSkeleton label="Loading your inbox…" active />;
  }
  if (status === 'error') {
    return <p className="email-list__status">Something went wrong fetching your inbox.</p>;
  }

  return (
    <div className="email-list-panel">
      <EmailListFilters
        searchText={searchText}
        onSearchChange={(value) => {
          setSearchText(value);
          setPage(1);
        }}
      />

      {pageItems.length === 0 ? (
        <p className="email-list__status">No emails match these filters.</p>
      ) : (
        <ul className="email-list email-list--reveal">
          {pageItems.map((message, index) => (
            <EmailListItem key={message.uid} message={message} index={index} onSelect={onSelect} />
          ))}
        </ul>
      )}

      <PaginationControls currentPage={currentPage} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}
