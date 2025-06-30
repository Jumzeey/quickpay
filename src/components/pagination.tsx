import Icon from '@/components/icon';
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, lastPage }) => {
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex items-center gap-4 mt-6 text-[#7F7F7F] text-sm">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center justify-center size-8 bg-[#D9D9D91A] border border-[#C4C4C452] rounded ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} transition-colors duration-150`}
      >
        <Icon name="arrowLeft" className="text-black size-5" />
      </button>

      <div className="font-semibold tracking-wider">
        Page {currentPage} of {totalPages}
      </div>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center justify-center size-8 bg-[#D9D9D91A] border border-[#C4C4C452] rounded ${currentPage === totalPages ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} transition-colors duration-150`}
      >
        <Icon name="arrowLeft" className="text-black size-5 -rotate-180" />
      </button>
    </div>
  );
};

export default Pagination;
