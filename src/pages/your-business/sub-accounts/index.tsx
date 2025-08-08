import ActionButton from '@/components/action-button';
import Button from '@/components/button';
import Dropdown from '@/components/Dropdown';
import DynamicTable from '@/components/DynamicTable';
import EmptyState from '@/components/EmptyState';
import FancyFileUpload from '@/components/FancyFileUpload';
import Filter from '@/components/Filter';
import FormInput from '@/components/FormInput';
import FormSelect from '@/components/FormSelect';
import Icon from '@/components/icon';
import IconWrapper from '@/components/IconWrapper';
import Loader from '@/components/loader';
import Modal from '@/components/modal';
import Pagination from '@/components/pagination';
import TableSkeleton from '@/components/TableSkeleton';
import { usePaginatedEffect } from "@/hooks/useEffectFetch";
import { useFormValidation } from '@/hooks/useFormValidation';
import { uploadFile } from '@/services/kyc';
import {
  changeModeToLive,
  deactivateSubAccount
} from '@/services/sub-account';
import useCategories from '@/stores/useCategories';
import useFilter from '@/stores/useFilter';
import useSubaccount from '@/stores/useSubAccount';
import {
  copyToClipboard,
  formatDateTime2,
  notifyError,
  notifySuccess,
  truncateText
} from '@/util/utils';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import 'react-loading-skeleton/dist/skeleton.css';
import Select from 'react-select';
import * as Yup from 'yup';

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
    activeId: 0,
    modalType: '',
    isSubmitting: false,
    isMoreActionsOpen: false,
  });

  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [documents, setDocuments] = useState<{ title: string; file: File | null }[]>([]);

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

  useEffect(() => {
    if (modalState.isUpdateOpen && modalState.activeId) {
      const selectedSubaccount = subaccounts?.find(item => item.id === modalState.activeId);

      if (selectedSubaccount) {
        console.log({ selectedSubaccount })
        reset({
          merchant_name: selectedSubaccount.merchant_name || '',
          mode: selectedSubaccount.mode,
          contactEmail: selectedSubaccount.email || '',
          percentage: selectedSubaccount.percentage ? String(selectedSubaccount.percentage) : '',
          description: selectedSubaccount.description || '',
          siteName: selectedSubaccount.site_name || '',
          websiteUrl: selectedSubaccount.website_url || '',
          callback_url: selectedSubaccount.callback_url?.replace(/^https?:\/\//, '') || '',
          riskRating: selectedSubaccount.risk_rating || 'low',
          category: selectedSubaccount.category || '',
        });
      }
    }
  }, [modalState.isUpdateOpen, modalState.activeId, subaccounts, reset]);

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
              onClick={() => openModal(row.id, 'disable')}
            >
              <IconWrapper
                src="/images/alert.svg"
                width={14}
                height={14}
                alt="Deactivate icon"
              />
              <span className="text-[#090727] text-sm font-semibold">Deactivate</span>
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

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false, activeId: 0, modalType: '' }));
  const closeUpdateModal = () => setModalState(prev => ({ ...prev, isUpdateOpen: false, activeId: 0 }));

  const openModal = (id: number, type: string) => {
    setModalState(prev => ({ ...prev, isOpen: true, activeId: id, modalType: type }));
  };

  const openUpdateModal = (id: number) => {
    setModalState(prev => ({ ...prev, isUpdateOpen: true, activeId: id }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleModalAction = async () => {
    setModalState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const payload = { id: modalState.activeId };

      if (modalState.modalType === 'live') {
        await changeModeToLive(payload);
        notifySuccess('Website is now live');
      } else {
        await deactivateSubAccount(payload);
        notifySuccess('Subaccount deactivated successfully');
      }

      closeModal();
      fetchSubaccountHistory({ page: currentPage });
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setModalState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const onSubmit = async (values: any) => {
    setModalState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const uploadedDocuments = await Promise.all(
        documents.map(async doc => {
          if (doc.file) {
            const formData = new FormData();
            formData.append('file', doc.file);
            const uploadResponse = await uploadFile(formData);
            return { name: doc.title, url: uploadResponse.data.file };
          }
          return null;
        })
      );

      const payload = {
        merchant_name: values.merchant_name,
        email: values.contactEmail,
        mode: values.mode,
        percentage: values.percentage,
        description: values.description,
        site_name: values.siteName,
        website_url: values.websiteUrl,
        risk_rating: values.riskRating,
        category: values.category,
        id: modalState.activeId,
        documents: uploadedDocuments.filter(Boolean),
      };

      if (values.callback_url) {
        // @ts-ignore
        payload.callback_url = `https://${values.callback_url}`;
      }

      // @ts-ignore
      await updateSubAccountAmount(payload);
      notifySuccess('Subaccount updated successfully');
      closeUpdateModal();
      fetchSubaccountHistory({ page: currentPage });
      reset();
      setDocuments([]);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setModalState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  if (getSubaccountHistoryLoading) {
    return <TableSkeleton />;
  }

  if (subaccounts?.length === 0) {
    return (
      <EmptyState
        title='No Sub Account found'
        subTitle="We couldn't find any Sub Account"
        image='/images/dashboard/your-business/subaccount-empty.svg'
      >
        <ActionButton
          text='Add Subaccount'
          ariaLabel='Add Subaccount button'
          onClick={() => router.push(`/your-business/sub-accounts/create`)}
        />
      </EmptyState>
    );
  }

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
              <Link href='/your-business/sub-accounts/create'>
                <ActionButton
                  ariaLabel='Create New Subaccount'
                  text='Create New Sub Account'
                />
              </Link>
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
            <Button
              text='Add Subaccount'
              ariaLabel='Add Subaccount button'
              className='!w-[191px] !h-[48px]'
              onClick={() =>
                router.push(`/your-business/sub-accounts/create`)
              }
              primary
            />
          </EmptyState>
        )}
      </div>

      <Modal isOpen={modalState.isOpen} onClose={closeModal}>
        <div className='flex justify-center text-center'>
          <div className='flex flex-col'>
            <div className='flex justify-center'>
              <IconWrapper
                src='/images/dashboard/collections/delete.svg'
                width={94}
                height={106}
                alt='Delete Icon'
              />
            </div>
            <p className='text-3xl font-bold py-2'>Head up!</p>
            <p>Are you sure you want to continue?</p>
            <div className='flex justify-center items-center gap-3 mt-4'>
              <Button
                text='Confirm'
                ariaLabel='Confirm button'
                onClick={handleModalAction}
                disabled={modalState.isSubmitting}
                primary
                small
              />
              <Button
                text='Cancel'
                ariaLabel='Cancel button'
                onClick={closeModal}
                plain
                small
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalState.isUpdateOpen} onClose={closeUpdateModal}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <Controller
              name="siteName"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="Site Name"
                  id="siteName"
                  type="text"
                  htmlFor="siteName"
                  error={errors.siteName?.message}
                  touched={!!errors.siteName}
                  {...field}
                />
              )}
            />

            <Controller
              name="websiteUrl"
              control={control}
              render={({ field }) => (
                <FormInput
                  label='Website URL'
                  id='websiteUrl'
                  type='text'
                  htmlFor='websiteUrl'
                  error={errors.websiteUrl?.message}
                  touched={!!errors.websiteUrl}
                  {...field}
                />
              )}
            />

            <Controller
              name="merchant_name"
              control={control}
              render={({ field }) => (
                <FormInput
                  label='Merchant Name'
                  id='merchant_name'
                  type='text'
                  htmlFor='merchant_name'
                  error={errors.merchant_name?.message}
                  touched={!!errors.merchant_name}
                  {...field}
                />
              )}
            />

            <Controller
              name="percentage"
              control={control}
              render={({ field }) => (
                <FormInput
                  label='Percentage Split'
                  id='percentage'
                  type='number'
                  htmlFor='percentage'
                  error={errors.percentage?.message}
                  touched={!!errors.percentage}
                  maxLength={10}
                  {...field}
                />
              )}
            />
          </div>

          <Controller
            name="mode"
            control={control}
            render={({ field }) => (
              <FormSelect
                id="mode"
                htmlFor="mode"
                label="Select Sub Account Mode Type"
                placeholder="Select mode"
                options={[
                  { value: 'true', label: 'Live' },
                  { value: 'false', label: 'Test' },
                ]}
                error={errors.mode?.message}
                touched={!!errors.mode}
                name={field.name}
                disabled
              />
            )}
          />

          <div>
            <Controller
              name="contactEmail"
              control={control}
              render={({ field }) => (
                <FormInput
                  label='Contact Email'
                  id='contactEmail'
                  type='email'
                  htmlFor='contactEmail'
                  error={errors.contactEmail?.message}
                  touched={!!errors.contactEmail}
                  {...field}
                />
              )}
            />

            <span className="text-xs text-primary font-medium">
              If provided, this email address will get transaction notification
            </span>
          </div>


          <Controller
            name="callback_url"
            control={control}
            render={({ field }) => (
              <FormInput
                label='Callback URL (e.g yourbusiness.com)'
                id='callback_url'
                type='text'
                htmlFor='callback_url'
                error={errors.callback_url?.message}
                touched={!!errors.callback_url}
                {...field}
              />
            )}
          />

          <div>
            <label className='font-semibold'>Risk Rating</label>
            <Controller
              name="riskRating"
              control={control}
              render={({ field }) => (
                <select
                  className='h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5'
                  {...field}
                >
                  <option value='high'>High</option>
                  <option value='medium'>Medium</option>
                  <option value='low'>Low</option>
                </select>
              )}
            />
          </div>

          <div>
            <label className='font-semibold'>Category</label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  options={categories.map((category: any) => ({
                    value: category,
                    label: category,
                  }))}
                  isSearchable
                  placeholder={
                    getCategoriesLoading
                      ? 'Loading categories...'
                      : 'Search or select category'
                  }
                  isDisabled={getCategoriesLoading}
                  value={
                    field.value
                      ? { value: field.value, label: field.value }
                      : null
                  }
                  onChange={(option) => field.onChange(option?.value)}
                  styles={{
                    control: (provided, state) => ({
                      ...provided,
                      height: '60px',
                      padding: '0.5rem',
                      width: '100%',
                      borderRadius: '0.5rem',
                      borderWidth: '1px',
                      borderColor: state.isFocused ? '#6750A4' : '#CAC4D0',
                      outline: 'none',
                      fontSize: '0.875rem',
                      marginBottom: '1.25rem',
                      '&:hover': {
                        borderColor: '#6750A4',
                      },
                    }),
                  }}
                />
              )}
            />
          </div>

          <div className='mb-5'>
            <label className='font-semibold text-gray-700'>
              Upload Supporting Documents
            </label>

            <FancyFileUpload
              documents={documents}
              setDocuments={setDocuments}
            />
          </div>

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <FormInput
                label='Description'
                id='description'
                type='text'
                htmlFor='description'
                error={errors.description?.message}
                touched={!!errors.description}
                {...field}
              />
            )}
          />
          <Button
            className='text-white mt-4 text-xs sm:text-sm p-2 sm:p-3 rounded'
            text={modalState.isSubmitting ? <Loader /> : 'Submit'}
            ariaLabel='Submit Button'
            disabled={modalState.isSubmitting}
            primary
          />
        </form>
      </Modal>
    </>
  );
};

export default SubaccountHistory;
