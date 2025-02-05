import { ReactNode } from "react";

interface TableProps {
  columns: any[];
  children: ReactNode;
  className?: string;
}

const Table: React.FC<TableProps> = ({
  columns,
  children,
  className,
}) => {

  return (
    <div className="overflow-x-scroll h-screen">
      <table className={`table w-full whitespace-nowrap ${className}`}>
        <thead>
          <tr className="text-white sarepayGrey text-sm uppercase">
            {columns.map((column: any, index: number) => (
              <th key={index} className="text-left font-semibold p-4 bg-[#f5f8fa] first:rounded-s-lg last:rounded-e-lg">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

export default Table;
