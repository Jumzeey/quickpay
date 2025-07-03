import { useRouter } from "next/router";
import Image from "next/image";
import useClickEvent from "@/stores/useClickEvent";

interface TableProps {
  numbering: number;
  item: any;
  hasAction?: boolean;
}

const TableRow: React.FC<TableProps> = ({ numbering, item, hasAction }) => {
  const router = useRouter();
  const { handleClick } = useClickEvent();

  const successKeyIndicators = ["status", "approval_status"];
  const successValueIndicators = ["Successful", "Active", "Approved"];

  return (
    <tr className="border-b last:border-none border-grey-200">
      <td className="text-sm px-5 py-6">{numbering + 1}</td>
      {Object.entries(item).map(([key, value]: any) => {
        if (successKeyIndicators.includes(key)) {
          const statusClassName = successValueIndicators.includes(value)
            ? "text-success bg-[#E9F7EF]"
            : "text-danger bg-[#e0440326]";
          return (
            <td key={key} className="text-xs px-5 py-6">
              <div
                className={`text-center rounded-lg py-1 px-3 ${statusClassName}`}
              >
                {value}
              </div>
            </td>
          );
        } else {
          return (
            <td key={key} className="text-sm px-5 py-6">
              {value}
            </td>
          );
        }
      })}

      {hasAction && (
        <td
          className="text-sm px-5 py-6"
          onClick={() => {
            handleClick(item);
            router.push(`/settlements/${item.id}`);
          }}
        >
          <Image
            src="/images/eye-on-dark.svg"
            className="cursor-pointer"
            alt="Eye Icon"
            width={24}
            height={24}
            priority
          />
        </td>
      )}
    </tr>
  );
};

export default TableRow;
