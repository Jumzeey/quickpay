import ActionButton from "@/components/action-button";
import Button from "@/components/button";
import DynamicTable from "@/components/DynamicTable";
import Icon from "@/components/icon";
import Modal from "@/components/modal";
import Pagination from "@/components/pagination";
import TableSkeleton from "@/components/TableSkeleton";
import useIPWhitelist from "@/stores/useIPWhitelist";
import { notifyError, notifySuccess } from "@/util/utils";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import IPForm from "./IPForm";

interface IPWhitelistEntry {
  id: number;
  ip_address: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const IPWhiteListing = () => {
  const [isModalOpen, setIsModalOpen] = useState<null | "add" | "edit" | "delete">(null);
  const [selectedIP, setSelectedIP] = useState<IPWhitelistEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const {
    entries,
    isLoading,
    pagination,
    fetchIPWhitelist,
    setPagination,
    removeIPWhitelist
  } = useIPWhitelist();

  useEffect(() => {
    fetchIPWhitelist();
  }, []);

  // usePaginatedEffect(
  //   fetchIPWhitelist,
  //   {
  //     page: currentPage,
  //     search: searchInput,
  //     status: statusFilter,
  //     startDate: filter.startDate,
  //     endDate: filter.endDate
  //   },
  //   {
  //     onError: (error) => {
  //       console.error("Failed to fetch collection history:", error);
  //     }
  //   }
  // );
  // useEffect(() => {
  //   // setIsLoading(true);
  //   fetchIpWhitelist().finally(() => {
  //     setIsLoading(false);
  //   });
  // }, [fetchIpWhitelist]);

  // const { data, loading: isLoading } = useAsyncFetch({
  //   key: 'ipWhitelist',
  //   fn: fetchIpWhitelist,
  //   options: {
  //     staleTime: 0, 
  //     cacheTime: 0  
  //   }
  // });

  // console.log({ entries, isLoading, error });

  const columns = [
    { key: 'ip_address', title: 'IP Address' },
    {
      key: 'created_at',
      title: 'Last Update',
      render: (value: any, row: any) => (
        <span>
          {format(new Date(row.created_at), 'MMM dd, yyyy')}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: any, row: any) => (
        <span className={row.is_active ? 'text-success' : 'text-danger'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'description',
      title: 'Description',
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, row: any) => (
        <div className="flex items-center gap-10">
          <button
            onClick={() => handleEdit(row)}
            className="cursor-pointer text-primary hover:text-primary-dark flex items-center gap-2 text-sm"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path opacity="0.4" d="M11.417 16.5817H16.7312" stroke="#005BB0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path fillRule="evenodd" clipRule="evenodd" d="M10.7126 4.12975C11.3268 3.34725 12.3193 3.38809 13.1026 4.00225L14.2609 4.91059C15.0443 5.52475 15.3218 6.47725 14.7076 7.26142L7.80009 16.0739C7.56926 16.3689 7.21676 16.5431 6.84176 16.5473L4.17759 16.5814L3.57426 13.9856C3.48926 13.6214 3.57426 13.2381 3.80509 12.9423L10.7126 4.12975Z" stroke="#005BB0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path opacity="0.4" d="M9.41895 5.78003L13.4139 8.9117" stroke="#005BB0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <span>Edit</span>
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="cursor-pointer text-danger hover:text-danger-dark flex items-center gap-2 text-sm"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path opacity="0.4" d="M15.8717 8.24165C15.8717 8.29833 15.4275 13.9168 15.1737 16.2813C15.0149 17.7324 14.0794 18.6125 12.6762 18.6375C11.5981 18.6617 10.5427 18.67 9.50426 18.67C8.40181 18.67 7.32368 18.6617 6.27717 18.6375C4.921 18.605 3.98473 17.7074 3.83395 16.2813C3.57293 13.9084 3.13682 8.29833 3.12871 8.24165C3.1206 8.07079 3.17573 7.90826 3.28759 7.77658C3.39784 7.65489 3.55672 7.58154 3.72371 7.58154H15.2848C15.451 7.58154 15.6018 7.65489 15.7209 7.77658C15.832 7.90826 15.8879 8.07079 15.8717 8.24165Z" fill="#FD2727" />
              <path d="M17.003 5.31471C17.003 4.97216 16.7331 4.70378 16.4088 4.70378H13.9786C13.4841 4.70378 13.0545 4.35205 12.9442 3.85614L12.808 3.24854C12.6175 2.51425 11.9601 2 11.2225 2H7.78136C7.03559 2 6.38466 2.51425 6.18687 3.28855L6.0596 3.85697C5.94854 4.35205 5.51891 4.70378 5.02524 4.70378H2.595C2.26994 4.70378 2 4.97216 2 5.31471V5.63143C2 5.96565 2.26994 6.24237 2.595 6.24237H16.4088C16.7331 6.24237 17.003 5.96565 17.003 5.63143V5.31471Z" fill="#FD2727" />
            </svg>

            <span>Delete</span>
          </button>
        </div>
      )
    },
  ];

  const handleCloseModal = () => {
    setIsModalOpen(null);
    setSelectedIP(null);
  };

  const handleAdd = () => setIsModalOpen("add");

  const handleEdit = (ip: IPWhitelistEntry) => {
    setSelectedIP(ip);
    setIsModalOpen("edit");
  };

  const handleDelete = (ip: IPWhitelistEntry) => {
    setSelectedIP(ip);
    setIsModalOpen("delete");
  };

  const handleConfirmDelete = async () => {
    if (!selectedIP) return;

    setIsSubmitting(true);
    try {
      const result = await removeIPWhitelist(selectedIP.id);
      if (result.success) {
        notifySuccess("IP address deleted successfully");
      }
      handleCloseModal();
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(page);
  };

  if (isLoading && !entries.length) return <TableSkeleton />;

  return (
    <>
      {!entries?.length ? (
        <div className="p-8 text-center flex flex-col items-center space-y-4">
          <p className="text-gray-500 text-sm dark:text-gray-400">
            No IP whitelist entries available.
            Add an IP address to get started.
          </p>

          <ActionButton
            text="Add IP Address"
            ariaLabel="Add IP address button"
            onClick={handleAdd}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <DynamicTable
            columns={columns}
            data={entries || []}
            maxColumns={3}
          />

          <div className="mt-4 flex items-center justify-between">
            <div className="-mt-6">
              <Pagination
                lastPage={pagination.last_page}
                currentPage={pagination.current_page}
                totalPages={pagination.last_page}
                onPageChange={handlePageChange}
              />
            </div>

            <ActionButton
              text="Add IP to whitelist"
              ariaLabel="Add IP address button"
              onClick={handleAdd}
              iconName="user-add"
            />
          </div>
        </div>
      )}

      {/* Add IP Modal */}
      <Modal
        isOpen={isModalOpen === "add"}
        onClose={handleCloseModal}
        title="Whitelist IP Address"
      >
        <IPForm
          type="add"
          onClose={handleCloseModal}
          // onSuccess={fetchIpWhitelist}
          onSuccess={() => { }}
        />
      </Modal>

      {/* Edit IP Modal */}
      <Modal
        isOpen={isModalOpen === "edit"}
        onClose={handleCloseModal}
        title="Manage IP Address"
      >
        <IPForm
          type="edit"
          ip={selectedIP}
          onClose={handleCloseModal}
          // onSuccess={fetchIpWhitelist}
          onSuccess={() => { }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isModalOpen === "delete"}
        onClose={handleCloseModal}
      >
        <div className="flex justify-center text-center">
          <div className="flex flex-col items-center">
            <Icon name="warning" />
            <div className="mt-3">
              <p className="text-3xl font-semibold py-2">Head up!</p>
              <p>
                Are you sure you want to delete this IP address?{" "}
                <span className="font-semibold">
                  ({selectedIP?.ip_address})
                </span>
              </p>
            </div>

            <div className="flex justify-center items-center gap-3 mt-7">
              <Button
                text="Confirm"
                ariaLabel="Confirm delete"
                onClick={handleConfirmDelete}
                disabled={isLoading}
                primary
                small
              />
              <Button
                text="Cancel"
                ariaLabel="Cancel delete"
                onClick={handleCloseModal}
                plain
                small
              />
            </div>
          </div>
        </div>
      </Modal>
    </>

  );
};

export default IPWhiteListing;