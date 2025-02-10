import { Fragment, useEffect, useState } from "react";
import Layout from "@/components/layout";
import WebPageTitle from "@/components/WebPageTitle";
import Card from "@/components/Card";
import Table from "@/components/table";
import Pagination from "@/components/pagination";
import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/TableSkeleton";
import {  formatDate, formatDateTime } from "@/util/utils";
import useSetting from "@/stores/useSetting";
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

  const columns = ["s/n","name","action taken", "ip_address", "created_at","user_agent"];
  return (
    <Layout pageTitle="Activity Log" icon="activity-log">
      <WebPageTitle title="Activity Log | Sarepay Merchant Portal" />
      <div>
        <h2 className="text-xl font-semibold">Manage User Log</h2>
        <p className="text-sm pt-3 pb-5">
          Manage user logs within your company
        </p>
      </div>
      <div>
        {getUserLogLoading ? (
          <Fragment>
            <TableSkeleton />
          </Fragment>
        ) : logs.length !== 0 ? (
          <Fragment>
            <Card className="mt-10">
              <Table columns={columns} className="mt-7">
                {logs.map((item: any, index: number) => (
                  <tr
                    key={index}
                    className="border-b last:border-none border-grey-200"
                  >
                    <td className="text-sm px-5 py-6">{index + 1}</td>
                    <td className="text-sm px-5 py-6">{item.name || "N/A"}</td>
                    <td className="text-sm px-5 py-6">{item.action || "N/A"}</td>
                    <td className="text-sm px-5 py-6">{item.ip_address}</td>
                    <td className="text-sm px-5 py-6">{formatDateTime(item.created_at)}</td>
                    <td className="text-sm px-5 py-6">{item.user_agent}</td>
                  </tr>
                ))}
              </Table>
              <Pagination
                lastPage={lastPage}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </Card>
          </Fragment>
        ) : (
          <EmptyState
            title="No Activity Log Found"
            subTitle="We couldn't find any Activity Log for this account"
            image="/images/activity-log.svg"
          />
        )}
      </div>
    </Layout>
  );
};

export default ActivityLog;
