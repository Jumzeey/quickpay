import EmptyState from "@/components/EmptyState";
import Layout from "@/components/layout";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/pagination";
import Table from "@/components/table";
import TableSkeleton from "@/components/TableSkeleton";
import WebPageTitle from "@/components/WebPageTitle";
import useSetting from "@/stores/useSetting";
import { formatDateTime2 } from "@/util/utils";
import { Fragment, useEffect, useState } from "react";
interface UserLog {
  action: string;
  ip_address: string;
  uuser_agent: string;
  created_at: string;
  id: string;
}

interface StateProps {
  isLoading: boolean;
  showFilterStatus: boolean;
  userLogHistory: {
    logs: UserLog[];
  };
}

const ActivityLog = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [state, setState] = useState<StateProps>({
    isLoading: true,
    showFilterStatus: false,
    userLogHistory: { logs: [] },
  });
  const { logs, pagination, getUserLogLoading, fetchUserLog } = useSetting();

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = pagination?.last_page;
  const lastPage = pagination?.last_page;

  useEffect(() => {
    fetchUserLog({
      page: currentPage,
    });
  }, [currentPage]);

  console.log({ logs, pagination })

  const columns = [
    "No.",
    "action taken",
    "user",
    "IP address",
    "time stamp",
    "user agent",
  ];
  return (
    <Layout pageTitle="Audit Trail" icon="activity-log">
      <WebPageTitle title="Audit Trail | Ramp Merchant Portal" />
      <PageHeader
        title="User Activities"
        description="Keep track of all user interactions in one place, making it easy to review and analyze activity."
      />
      <>
        {getUserLogLoading ? (
          <Fragment>
            <TableSkeleton  />
          </Fragment>
        ) : logs.length !== 0 ? (
          <>
            <Table columns={columns} className="mt-7">
              {logs.map((item: any, index: number) => {
                const [date, time] = formatDateTime2(item.created_at);

                return (
                  <tr
                    key={index}
                    className="[&>td]:border-b last:border-none [&>td]:border-[#C4C4C452] [&>td]:font-medium [&>td]:text-sm [&>td]:px-3 [&>td]:py-6"
                  >
                    <td className="border-l border-[#C4C4C452] !pl-4">{index + 1}</td>
                    <td>{item.action || "N/A"}</td>
                    <td className="truncate">{item.name || "N/A"}</td>
                    <td>{item.ip_address}</td>
                    <td>{date} <span className="text-[#7F7F7F] text-xs">{`(${time})`}</span></td>
                    <td
                      title={item.user_agent}
                      className="truncate text-[#7F7F7F] w-[350px] max-w-[350px] border-r border-[#C4C4C452]"
                    >
                      {item.user_agent}
                    </td>
                  </tr>
                )
              })}
            </Table>
            <Pagination
              lastPage={lastPage}
              currentPage={currentPage}
              totalPages={totalPages}
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

export default ActivityLog;
