import { ReactNode } from 'react';

interface TableProps {
  columns: any[];
  children: ReactNode;
  className?: string;
  height?: boolean;
}

const Table: React.FC<TableProps> = ({
  columns,
  children,
  className,
  height = false,
}) => {
  return (
    <div className={`overflow-x-auto w-full ${!height ? 'h-auto' : ''}`}>
      <table className={`table w-full whitespace-nowrap ${className} border-separate border-spacing-0`}>
        <thead>
          <tr className="sarepayGrey text-sm capitalize">
            {columns.map((column: any, index: number) => (
              <th
                key={index}
                className={`text-left text-black font-medium py-4 px-3 bg-[#C4C4C414] 
                  border border-[#C4C4C452]
                  ${index === 0 ? 'rounded-tl-lg border-r-0 pl-4' : 'border-l-0'} 
                  ${index > 0 && index < columns.length - 1 ? 'border-r-0' : ''}
                  ${index === columns.length - 1 ? 'rounded-tr-lg' : 'border-r'}`}
              >
                <div className="truncate">{column}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
