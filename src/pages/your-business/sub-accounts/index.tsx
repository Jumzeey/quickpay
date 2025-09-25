import ActionButton from '@/components/action-button';
import Button from '@/components/button';
import Dropdown from '@/components/Dropdown';
import DynamicTable from '@/components/DynamicTable';
import EmptyState from '@/components/EmptyState';
import Filter from '@/components/Filter';
import Icon from '@/components/icon';
import IconWrapper from '@/components/IconWrapper';
import Pagination from '@/components/pagination';
import TableSkeleton from '@/components/TableSkeleton';
import { usePaginatedEffect } from "@/hooks/useEffectFetch";
import { useFormValidation } from '@/hooks/useFormValidation';
import {
  deactivateSubAccount
} from '@/services/sub-account';
import useCategories from '@/stores/useCategories';
import useFilter from '@/stores/useFilter';
import useSubaccount from '@/stores/useSubAccount';
import {
  copyToClipboard,
  formatDateTime2,
  truncateText
} from '@/util/utils';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import 'react-loading-skeleton/dist/skeleton.css';
import * as Yup from 'yup';
import DeleteSubAccountModal from './delete';
import UpdateSubAccountModal from './update';
import CreateSubAccountModal from '@/pages/your-business/sub-accounts/create';

const validationSchema = Yup.object().shape({
  merchant_name: Yup.string().required('Merchant name is required!'),
  mode: Yup.string()
    .oneOf(['test', 'live'], 'Mode must be either test or live')
    .required('Mode is required!'),
  contactEmail: Yup.string()
    .email('Invalid email format')
    .required('Contact email is required!'),
  percentage: Yup.number().required('Percentage split is required!'),
  siteName: Yup.string().required('Site name is required!'),
  websiteUrl: Yup.string()
    .url('Invalid URL format')
    .required('Website URL is required!'),
  riskRating: Yup.string().required('Risk rating is required!'),
  category: Yup.string().required('Category is required!'),
  documents: Yup.array().of(Yup.mixed()).notRequired(),
  description: Yup.string().notRequired(),
  callback_url: Yup.string()
    .notRequired()
    .matches(
      /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
      'Enter a valid callback URL!'
    ),
});

interface ModalState {
  isOpen: boolean;
  isUpdateOpen: boolean;
  isDeactivateOpen: boolean;
  isCreateOpen: boolean;
  activeId: number;
  modalType: string;
  isSubmitting: boolean;
  isMoreActionsOpen: boolean;
}

const SubaccountHistory = () => {
  const router = useRouter();
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    isUpdateOpen: false,
    isDeactivateOpen: false,
    isCreateOpen: false,
    activeId: 0,
    modalType: '',
    isSubmitting: false,
    isMoreActionsOpen: false,
  });

  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // const [documents, setDocuments] = useState<{ title: string; file: File | null }[]>([]);

  const { showFilter, toggleFilter } = useFilter();
  const { categories, fetchCategories, getCategoriesLoading } = useCategories();
  const {
    fetchSubaccountHistory,
    subaccounts,
    pagination,
    getSubaccountHistoryLoading,
    updateSubAccountAmount
  } = useSubaccount();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useFormValidation(validationSchema, {
    defaultValues: {
      merchant_name: '',
      mode: '',
      contactEmail: '',
      percentage: '',
      description: '',
      siteName: '',
      websiteUrl: '',
      callback_url: '',
      riskRating: '',
      category: '',
      documents: [],
    },
    mode: 'onChange'
  });

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
  }, [fetchCategories, categories.length]);

  usePaginatedEffect(
    fetchSubaccountHistory,
    {
      page: currentPage,
      search: searchInput
    },
    {
      onError: (error) => {
        console.error("Failed to fetch subaccount history:", error);
      }
    }
  );

  const closeDeactivateModal = () => setModalState(prev => ({ ...prev, isDeactivateOpen: false, activeId: 0 }));
  const openDeactivateModal = (id: number) => {
    setModalState(prev => ({ ...prev, isDeactivateOpen: true, activeId: id }));
  };


  const openCreateModal = () => setModalState(prev => ({ ...prev, isCreateOpen: true }));
  const closeCreateModal = () => setModalState(prev => ({ ...prev, isCreateOpen: false }));

  // useEffect(() => {
  //   if (modalState.isUpdateOpen && modalState.activeId) {
  //     const selectedSubaccount = subaccounts?.find(item => item.id === modalState.activeId);

  //     if (selectedSubaccount) {
  //       console.log({ selectedSubaccount })
  //       reset({
  //         merchant_name: selectedSubaccount.merchant_name || '',
  //         mode: selectedSubaccount.mode,
  //         contactEmail: selectedSubaccount.email || '',
  //         percentage: selectedSubaccount.percentage ? String(selectedSubaccount.percentage) : '',
  //         description: selectedSubaccount.description || '',
  //         siteName: selectedSubaccount.site_name || '',
  //         websiteUrl: selectedSubaccount.website_url || '',
  //         callback_url: selectedSubaccount.callback_url?.replace(/^https?:\/\//, '') || '',
  //         riskRating: selectedSubaccount.risk_rating || 'low',
  //         category: selectedSubaccount.category || '',
  //       });
  //     }
  //   }
  // }, [modalState.isUpdateOpen, modalState.activeId, subaccounts, reset]);

  const columns = [
    { key: 'id', title: 'Merchant ID' },
    { key: 'merchant_name', title: 'Merchant Name' },
    { key: 'email', title: 'Notification Email' },
    {
      key: 'mode',
      title: 'Mode',
      render: (value: string, row: any) => value
    },
    {
      key: 'created_at',
      title: 'Created At',
      render: (value: any, row: any) => {
        if (!row?.created_at) return 'N/A';
        const [date, time] = formatDateTime2(row.created_at);

        return (
          <p className="text-[#090727] text-sm font-medium">
            {date}

            <span className="ml-1 text-[#7F7F7F] text-xs">({time})</span>
          </p>
        )
      },
    },
    {
      key: 'message',
      title: 'Message',
      render: (value: string) => truncateText(value, 25) || 'N/A'
    },
    {
      key: 'merchant_key',
      title: 'Merchant Key',
      render: (value: string, row: any) => (
        <p className="flex items-center font-bold text-primary ">
          <span className="mr-1.5">{truncateText(value) || 'N/A'}</span>

          <Icon
            name="copy3"
            className="cursor-pointer"
            onClick={() => copyToClipboard(value)}
          />
        </p>
      )
    },
    {
      key: 'actions',
      title: 'Action',
      render: (value: any, row: any) => (
        <ul className="list-none w-96 flex items-center justify-between">
          <li>
            <button
              className="flex items-center w-full gap-2 hover:bg-gray-50"
              onClick={() => openUpdateModal(row.id)}
            >
              <IconWrapper
                src="/images/refresh-alt.svg"
                width={14}
                height={14}
                alt="Update icon"
              />
              <span className="text-[#090727] text-sm font-semibold">Update</span>
            </button>
          </li>

          <li className="flex items-center w-1/3 hover:bg-gray-50">
            <Link
              href={`/your-business/sub-accounts/transactions/${row.id}`}
              className="flex cursor-pointer items-center gap-2 hover:text-primary"
            >
              <Icon name="edit2" className="text-[#005BB0]" />

              <span className="text-[#090727] text-sm font-semibold">Transactions</span>
            </Link>
          </li>

          <li>
            <button
              className="flex items-center w-full gap-2 hover:bg-gray-50"
              onClick={() => openDeactivateModal(row.id)}
            >
              <IconWrapper
                src="/images/alert.svg"
                width={14}
                height={14}
                alt="Deactivate icon"
              />
              <span className="text-[#090727] text-sm font-semibold">Delete</span>
            </button>
          </li>
        </ul>
      )
    },
  ];

  const transformedData = subaccounts?.map((item, index) => ({
    no: index + 1,
    index: index,
    id: item.id,
    merchant_name: item.merchant_name || 'N/A',
    merchant_key: item.merchant_key || 'N/A',
    email: item.email || 'N/A',
    mode: item.mode || 'N/A',
    message: item.message || 'N/A',
    created_at: item.created_at || 'N/A',
    expandedContent: (
      <div className="p-4 bg-[#F5F8FA]">
        <p className="text-sm text-[#7F7F7F]">
          <span className="font-medium">Description:</span> {item.description || 'No description available'}
        </p>
        {item.category && (
          <p className="text-sm text-[#7F7F7F] mt-2">
            <span className="font-medium">Category:</span> {item.category}
          </p>
        )}
        {item.website_url && (
          <p className="text-sm text-[#7F7F7F] mt-2">
            <span className="font-medium">Website:</span> {item.website_url}
          </p>
        )}
      </div>
    ),
  })) || [];

  const closeUpdateModal = () => setModalState(prev => ({ ...prev, isUpdateOpen: false, activeId: 0 }));

  const openUpdateModal = (id: number) => {
    setModalState(prev => ({ ...prev, isUpdateOpen: true, activeId: id }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const activeSubAccount = subaccounts?.find(item => item.id === modalState.activeId);

  return (
    <>
      <div>
        {getSubaccountHistoryLoading ? (
          <TableSkeleton />
        ) : subaccounts?.length !== 0 ? (
          <>
            <div className='flex justify-end pb-5'>
              {/* <div className="flex gap-3">
                  <Button
                    ariaLabel="Filter button"
                    text="Filter"
                    onClick={() => toggleFilter()}
                    className="!w-24 !h-10"
                    plain
                  />
                  <Button
                    ariaLabel="Export button"
                    text="Export"
                    className="!w-24 !h-10"
                    plain
                  />
                </div>

                <div className="relative">
                  <input
                    type="text"
                    id="searchInput"
                    name="searchInput"
                    placeholder="Search by reference"
                    onChange={handleParamsChange}
                    className="border-0 h-[40px] w-[392px] outline-none bg-[#F5F8FA] text-sm px-12 rounded-md"
                  />
                  <Image
                    src="/images/search.svg"
                    width={20}
                    height={20}
                    alt="Search Icon"
                    className="absolute top-[10px] left-3"
                  />
                </div> */}
              <ActionButton
                ariaLabel='Create New Subaccount'
                text='Create New Sub Account'
                onClick={openCreateModal}
              />
            </div>
            <div className='relative flex justify-end -mt-4 mb-7'>
              <Dropdown onOpen={showFilter} onClose={toggleFilter}>
                <Filter filterCallback={fetchSubaccountHistory} />
              </Dropdown>
            </div>

            <DynamicTable
              columns={columns}
              data={transformedData}
              maxColumns={5}
            />

            <Pagination
              lastPage={pagination.last_page}
              currentPage={currentPage}
              totalPages={pagination.total}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <EmptyState
            title='No Sub Account found'
            subTitle="We couldn't find any Sub Account"
            image='/images/dashboard/your-business/subaccount-empty.svg'
          >
            {/* <Button
              text='Add Subaccount'
              ariaLabel='Add Subaccount button'
              className='!w-[191px] !h-[48px]'
              onClick={() =>
                router.push(`/your-business/sub-accounts/create`)
              }
              primary
            /> */}
            <Button
              text='Add Subaccount'
              ariaLabel='Add Subaccount button'
              className='!w-[191px] !h-[48px]'
              onClick={openCreateModal}
              primary
            />
          </EmptyState>
        )}
      </div>

      <DeleteSubAccountModal
        isOpen={modalState.isDeactivateOpen}
        onClose={closeDeactivateModal}
        activeSubAccount={activeSubAccount}
        onSuccess={() => fetchSubaccountHistory({ page: currentPage })}
        deactivateSubAccount={deactivateSubAccount}
      />

      <UpdateSubAccountModal
        isOpen={modalState.isUpdateOpen}
        onClose={closeUpdateModal}
        activeSubAccount={activeSubAccount}
        categories={categories}
        getCategoriesLoading={getCategoriesLoading}
        onSuccess={() => fetchSubaccountHistory({ page: currentPage })}
        updateSubAccountAmount={updateSubAccountAmount}
      />

      <CreateSubAccountModal
        isOpen={modalState.isCreateOpen}
        onClose={closeCreateModal}
        categories={categories}
        getCategoriesLoading={getCategoriesLoading}
        onSuccess={() => fetchSubaccountHistory({ page: currentPage })}
        // postSubAccountAmount={postSubAccountAmount}
      />
    </>
  );
};

export default SubaccountHistory;
