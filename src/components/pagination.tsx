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
    <div className="flex justify-end items-center gap-2 mt-4">
      <div className='sarepayPrimary font-bold ml-2'>
       <span className='mr-2'> {currentPage} - {lastPage}</span>
        OF {totalPages} Pages
      </div>
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-1 text-[#164988] ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}  transition-colors duration-150`}
      >
        &lt;
      </button>
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-1 text-[#164988] ${currentPage === totalPages ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} transition-colors duration-150`}
      >
        &gt;
      </button>
    </div>
  );
};

export default Pagination;
