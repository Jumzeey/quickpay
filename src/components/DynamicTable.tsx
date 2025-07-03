import useClickEvent from '@/stores/useClickEvent';
import { copyToClipboard, getStatusColor } from '@/util/utils';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import React, { Fragment, useState } from 'react';

type Column = {
  key: string;
  title: string;
  render?: any;
};

type BaseTableProps = {
  pageCount?: number;
  data: Record<string, any>[];
  columns: Column[];
  primaryBtnContent?: (row: any, rowIndex: number) =>React.ReactNode;
  secondaryBtnContent?: (row: any, rowIndex: number) => React.ReactNode;
  copyId?: boolean;
  copyField?: string;
  maxColumns?: number;
  onTransactionClick?: (linkId: string) => void;
  onEditClick?: (linkId: string) => void;
  onAccept?: (linkId: string) => void;
  onReject?: (linkId: string) => void;
};

const DynamicTable: React.FC<BaseTableProps> = ({
  pageCount = 0,
  columns,
  data,
  primaryBtnContent,
  secondaryBtnContent,
  copyId,
  copyField,
  maxColumns = 5,
  onTransactionClick,
  onEditClick,
  onAccept,
  onReject,
}) => {
  const hasHiddenColumns = columns.length > maxColumns;
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [dropdownIndex, setDropdownIndex] = useState<number | null>(null);
  const { handleClick } = useClickEvent();

  const [statuses, setStatuses] = useState<Record<number, string>>(() =>
    data.reduce((acc, row, index) => {
      acc[index] = row.status ?? 'inactive';
      return acc;
    }, {} as Record<number, string>)
  );

  const toggleStatus = (rowIndex: number) => {
    setStatuses(prev => ({
      ...prev,
      [rowIndex]: prev[rowIndex] === 'active' ? 'inactive' : 'active',
    }));
  };

  const handleDropdownToggle = (index: number | null, selectedItem: string) => {
    setDropdownIndex(dropdownIndex === index ? null : index);
    handleClick(selectedItem, true);
  };

  const closeDropdown = () => {
    setDropdownIndex(null);
  };

  const renderCell = (
    row: any,
    column: {
      key: string, render?: (value: any, row: any) => React.ReactNode
    }
  ) => {
    const value = row[column.key];

    if (column.render) {
      return column.render(value, row);
    }

    return value ?? 'N/A';
  };

  return (
    <div className='overflow-x-auto bg-white dark:bg-dark border border-[#C4C4C429] rounded-lg text-sm text-dark-blue dark:text-light-blue'>
      <table className='w-full border-collapse'>
        <thead>
          <tr className='bg-[#C4C4C414] dark:bg-[#C4C4C405] border border-[#C4C4C452]'>
            <th className='py-[18px] px-6 pr-2 text-left font-semibold'>No.</th>
            {columns.slice(0, maxColumns).map(column => (
              <th
                key={column.key}
                className='py-[18px] px-8 pl-0 text-left font-semibold'
              >
                {['options', 'options2', 'status2'].includes(column.key)
                  ? ' '
                  : column.title}
              </th>
            ))}
            {hasHiddenColumns && <th className='py-[18px] px-8'></th>}
          </tr>
        </thead>

        <tbody>
          {data.map((row, rowIndex) => (
            <Fragment key={rowIndex}>
              <tr
                className={`border-b border-[#C4C4C452] transition-colors duration-300 
                  ${expandedRow === rowIndex ? 'bg-[#EFF7FE] dark:bg-[#005BB01A]' : ''}`}
              >
                <td className='py-[18px] px-6 pr-2 font-medium'>
                  {(rowIndex + 1) + pageCount}.
                </td>

                {columns.slice(0, maxColumns).map((column, index) => (
                  <td
                    key={column.key}
                    className={`py-[18px] px-8 pl-0 font-medium ${copyId && copyField === column.key ? 'flex items-center gap-2' : ''
                      }`}
                    style={{
                      color:
                        column.key.includes('status') || column.key.includes('Status')
                          ? getStatusColor(row[column.key])
                          : 'inherit',
                    }}
                  >
                    {renderCell(row, column)}

                    {copyId && copyField === column.key && (
                      <button onClick={() => copyToClipboard(row[column.key])}>
                        <Image
                          src='/images/copy-alt.svg'
                          alt='copy'
                          width={18}
                          height={18}
                          className='cursor-pointer transition-transform duration-200 hover:scale-110'
                        />
                      </button>
                    )}
                  </td>
                ))}

                {hasHiddenColumns && (
                  <td className='py-[18px] px-8 pl-0'>
                    <button
                      onClick={() => setExpandedRow(expandedRow === rowIndex ? null : rowIndex)}
                      className='flex items-center cursor-pointer'
                    >
                      <Image
                        src={`/images/arrow-${expandedRow === rowIndex ? 'up' : 'down'}-circle.svg`}
                        alt='Toggle Details'
                        width={20}
                        height={20}
                      />
                    </button>
                  </td>
                )}
              </tr>

              <AnimatePresence>
                {expandedRow === rowIndex && (
                  <>
                    <motion.tr
                      key={`expand-${rowIndex}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <td className='py-[18px] px-6 pr-2 bg-white dark:bg-dark'></td>

                      <td
                        colSpan={maxColumns}
                        className='py-[18px] px-8 pl-0 bg-white dark:bg-dark'
                      >
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className='grid grid-cols-4 gap-4 overflow-hidden'
                        >
                          {columns.slice(maxColumns).map(column => (
                            <div key={column.key} className='flex flex-col'>
                              <span className='font-semibold text-xs text-[#737373]'>
                                {column.title}:
                              </span>
                              <span className='font-medium text-sm'>
                                {renderCell(row, column)}
                              </span>
                            </div>
                          ))}
                        </motion.div>
                      </td>
                    </motion.tr>

                    <motion.tr
                      key={`buttons-${rowIndex}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <td className='py-[18px] px-6 pr-2 bg-white dark:bg-dark'></td>

                      <td
                        colSpan={columns.length + 2}
                        className='py-[18px] px-8 pl-0 text-center bg-white dark:bg-dark'
                      >
                        <div className='flex gap-4 items-center'>
                          {primaryBtnContent && primaryBtnContent(row, rowIndex)}
                          {secondaryBtnContent && secondaryBtnContent(row, rowIndex)}
                        </div>
                      </td>
                    </motion.tr>
                  </>
                )}
              </AnimatePresence>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DynamicTable;
