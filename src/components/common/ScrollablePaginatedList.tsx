import React, { useRef } from 'react';
import { Pagination } from './Pagination';

interface ScrollablePaginatedListProps {
  children: React.ReactNode;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Tailwind class(es) applied to the inner scrollable list (e.g. layout/spacing) */
  listClassName?: string;
  /**
   * Fixed height of the scrollable card area — deliberately a fixed height, not
   * a max-height. A max-height still lets the box shrink to fit a shorter page
   * (e.g. the last page with fewer items), which moves the pagination bar
   * below it right back into the "jumping around" problem this exists to fix.
   */
  heightClass?: string;
}

/**
 * A card list with a fixed-height, internally scrollable body and a pagination
 * bar that always sits in the same place right below it — the footer never
 * moves as different pages render different amounts of content, and only the
 * card area itself scrolls.
 */
export const ScrollablePaginatedList: React.FC<ScrollablePaginatedListProps> = ({
  children,
  currentPage,
  totalPages,
  onPageChange,
  listClassName = 'space-y-4',
  heightClass = 'h-[min(70vh,640px)]',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handlePageChange = (page: number) => {
    onPageChange(page);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <div ref={scrollRef} className={`overflow-y-auto pr-1 -mr-1 ${heightClass}`}>
        <div className={listClassName}>{children}</div>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
};
