import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Layout from "@/components/layout";
import Pagination from "@/components/pagination";
import Table from "@/components/table";
import TableSkeleton from "@/components/TableSkeleton";
import WebPageTitle from "@/components/WebPageTitle";
import useMids from "@/stores/useMids";
import { useEffect, useState } from "react";

const Mids = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { mids, pagination, getMidsLoading, fetchMids } = useMids();

  useEffect(() => {
    fetchMids({ page: currentPage });
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const columns = ["S/N", "Merchant ID", "Business Name", "Status"];

  return (
    <Layout pageTitle="MIDs Management" icon="mids">
      <WebPageTitle title="MIDs | Ramp Merchant Portal" />
      <div>
        <h2 className="text-xl font-semibold">Manage Merchant IDs</h2>
        <p className="text-sm pt-3 pb-5">
          View and manage Merchant IDs within your company
        </p>
      </div>
      <div>
        {getMidsLoading ? (
          <TableSkeleton />
        ) : mids.length > 0 ? (
          <Card className="mt-10">
            <Table columns={columns} className="mt-7">
              {mids.map((item: any, index: number) => (
                <tr
                  key={index}
                  className="border-b last:border-none border-grey-200"
                >
                  <td className="text-sm px-5 py-6">{index + 1}</td>
                  <td className="text-sm px-5 py-6">
                    {item.merchantId || "N/A"}
                  </td>
                  <td className="text-sm px-5 py-6">
                    {item.business_name || "N/A"}
                  </td>
                  <td className="text-sm px-5 py-6 capitalize">
                    {item.status || "N/A"}
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination
              lastPage={pagination?.last_page}
              currentPage={currentPage}
              totalPages={pagination?.last_page}
              onPageChange={handlePageChange}
            />
          </Card>
        ) : (
          <EmptyState
            title="No MIDs Found"
            subTitle="We couldn't find any Merchant IDs for this account"
            image="/images/mids.svg"
          />
        )}
      </div>
    </Layout>
  );
};

export default Mids;
