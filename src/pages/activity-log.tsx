import Dropdown from "@/components/Dropdown";
import EmptyState from "@/components/EmptyState";
import Filter from "@/components/Filter";
import { FilterExport } from "@/components/filter-export";
import Layout from "@/components/layout";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/pagination";
import { ReferenceSearch } from "@/components/reference-search";
import Table from "@/components/table";
import TableSkeleton from "@/components/TableSkeleton";
import WebPageTitle from "@/components/WebPageTitle";
import { usePaginatedEffect } from "@/hooks/useEffectFetch";
import useFilter from "@/stores/useFilter";
import useSetting from "@/stores/useSetting";
import debounce from "@/util/debounce";
import { downloadFile, formatDateTime2, notifyError } from "@/util/utils";
import { useCallback, useState } from "react";

interface UserLog {
  id: string;
  action: string;
  name: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface StateProps {
  isLoading: boolean;
  showFilterStatus: boolean;
  userLogHistory: {
    logs: UserLog[];
  };
}

const columns = [
  "No.",
  "action taken",
  "user",
  "IP address",
  "time stamp",
  "user agent",
];

const ActivityLog = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const [state, setState] = useState<StateProps>({
    isLoading: true,
    showFilterStatus: false,
    userLogHistory: { logs: [] },
  });
  const { showFilter, toggleFilter } = useFilter();
  const {
    logs,
    pagination,
    getUserLogLoading: isLoading,
    fetchUserLog,
  } = useSetting();

  usePaginatedEffect(
    fetchUserLog,
    {
      page: currentPage,
      search: searchInput,
      ...(filter.startDate ? {
        start_date: filter.startDate,
        end_date: filter.endDate,
      } : {})
    },
    {
      onError: (error) => {
        console.error("Failed to fetch user logs:", error);
        notifyError("Failed to fetch activity logs");
      }
    }
  );

  const handleFilterChange = async (newFilter: any) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const debouncedHandleParamsChange = useCallback(
    debounce((value: string) => {
      setSearchInput(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedHandleParamsChange(event.target.value.trim());
  };

  const handleExport = async () => {
    try {
      const response = await fetchUserLog({ export: true });
      if (response.export_link) {
        downloadFile(response.export_link);
      } else {
        throw new Error('Export link not available');
      }
    } catch (error) {
      if (error instanceof Error) {
        notifyError(error.message);
      } else {
        notifyError('Failed to export logs');
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Layout pageTitle="Audit Trail" icon="activity-log">
      <WebPageTitle title="Audit Trail | Cray Merchant Portal" />
      <PageHeader
        title="User Activities"
        description="Keep track of all user interactions in one place, making it easy to review and analyze activity."
      />
      {logs.length > 0 && (
        <>
          <div className="flex flex-col my-7 md:flex-row justify-between">
            <ReferenceSearch
              value={searchInput}
              onClear={() => setSearchInput("")}
              placeholder="Search Action Taken..."
              handleParamsChange={handleParamsChange}
            />

            <FilterExport
              handleExport={handleExport}
              toggleFilter={toggleFilter}
            />
          </div>

          <div className='relative flex justify-end mt-4 md:mt-0'>
            <Dropdown onOpen={showFilter} onClose={toggleFilter}>
              <Filter filterCallback={handleFilterChange} />
            </Dropdown>
          </div>
        </>
      )}

      <>
        {isLoading ? (
          <TableSkeleton />
        ) : logs.length > 0 ? (
          <>
            <Table columns={columns}>
              {logs.map((item: UserLog, index: number) => (
                <LogRow
                  key={item.id}
                  item={item}
                  index={index}
                />
              ))}
            </Table>
            <Pagination
              lastPage={pagination?.last_page}
              currentPage={currentPage}
              totalPages={pagination?.total}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <EmptyState
            title="No Activity Log Found"
            subTitle="We couldn't find any Activity Log for this account"
            image="/images/activity-log.svg"
          />
        )}
      </>
    </Layout>
  );
};

const LogRow = ({ item, index }: { item: UserLog; index: number }) => {
  const [date, time] = formatDateTime2(item.created_at);

  return (
    <tr className="[&>td]:border-b last:border-none [&>td]:border-[#C4C4C452] [&>td]:font-medium [&>td]:text-sm [&>td]:px-3 [&>td]:py-6">
      <td className="border-l border-[#C4C4C452] !pl-4">{index + 1}</td>
      <td>{item.action || "N/A"}</td>
      <td className="truncate">{item.name || "N/A"}</td>
      <td>{item.ip_address}</td>
      <td>
        {date} <span className="text-[#7F7F7F] text-xs">{`(${time})`}</span>
      </td>
      <td
        title={item.user_agent}
        className="truncate text-[#7F7F7F] w-[350px] max-w-[350px] border-r border-[#C4C4C452]"
      >
        {item.user_agent}
      </td>
    </tr>
  );
};

export default ActivityLog;
