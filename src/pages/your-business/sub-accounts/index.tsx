import Button from '@/components/button';
import Card from '@/components/Card';
import Dropdown from '@/components/Dropdown';
import EmptyState from '@/components/EmptyState';
import FancyFileUpload from '@/components/FancyFileUpload';
import Filter from '@/components/Filter';
import FloatingLabelInput from '@/components/floating-input';
import IconWrapper from '@/components/IconWrapper';
import Layout from '@/components/layout';
import Loader from '@/components/loader';
import Modal from '@/components/modal';
import Pagination from '@/components/pagination';
import Table from '@/components/table';
import TableSkeleton from '@/components/TableSkeleton';
import WebPageTitle from '@/components/WebPageTitle';
import useScreenWidth from '@/hooks/useScreenWidth';
import { uploadFile } from '@/services/kyc';
import {
  changeModeToLive,
  deactivateSubAccount
} from '@/services/sub-account';
import useCategories from '@/stores/useCategories';
import useClickEvent from '@/stores/useClickEvent';
import useFilter from '@/stores/useFilter';
import useSubaccount from '@/stores/useSubAccount';
import debounce from '@/util/debounce';
import {
  copyToClipboard,
  notifyError,
  notifySuccess,
  truncateText,
} from '@/util/utils';
import { useFormik } from 'formik';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useState
} from 'react';
import 'react-loading-skeleton/dist/skeleton.css';
import Select from 'react-select';
import * as Yup from 'yup';

import { usePaginatedEffect } from "@/hooks/useEffectFetch";

interface SubaccountsProps {
  subaccountsHistory: any[];
  isLoading: boolean;
  showSubaccounts: boolean;
  dropdownIndex: null | number;
  showFilter: boolean;
  // selectedOption: string;
  //   banks: [];
  // accountNumber: string;
  mode: string | undefined;
}

const columns = [
  's/n',
  'merchant name',
  'merchant key',
  'notification email',
  'mode',
  'message',
  'created at',
  'action',
];

const SubaccountHistory = () => {
  const router = useRouter();
  const screenWidth = useScreenWidth();
  const { selectedItem, handleClick } = useClickEvent();
  const [searchInput, setSearchInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeId, setActiveId] = useState(0);
  const [modalType, setModalType] = useState('');
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const closeUpdateModal = () => setIsUpdateOpen(false);
  const closeModal = () => setIsModalOpen(false);
  const { updateSubAccountAmount } = useSubaccount();
  const [currentPage, setCurrentPage] = useState(1);

  const {
    fetchSubaccountHistory,
    subaccounts,
    pagination,
    getSubaccountHistoryLoading,
  } = useSubaccount();

  const { showFilter, toggleFilter } = useFilter();
  const { categories, fetchCategories, getCategoriesLoading } = useCategories();
  const [documents, setDocuments] = useState<
    { title: string; file: File | null }[]
  >([]);

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
  }, [fetchCategories, categories]);

  const formik = useFormik({
    initialValues: {
      // accountNumber: "",
      // accountName: "",
      merchant_name: '',
      mode: undefined,
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
    validationSchema: Yup.object().shape({
      merchant_name: Yup.string().required('Merchant name is required!'),
      mode: Yup.boolean().required('Mode is required!'),
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
    }),
    validateOnMount: true,
    onSubmit: async (values, { resetForm }) => {
      updateSubaccount(resetForm);
    },
  });

  const [state, setState] = useState<SubaccountsProps>({
    subaccountsHistory: [],
    isLoading: false,
    showSubaccounts: false,
    dropdownIndex: null,
    showFilter: false,
    //     banks: [],
    // selectedOption: "",
    // accountNumber: "",
    mode: undefined,
  });
  // const accountNumber = formik.values.accountNumber;

  //   const fetchBanks = async () => {
  //     const banks = await getBanks();
  //     setState({ ...state, banks });
  //   };

  const handleModalChange = async () => {
    const payload = {
      id: activeId,
    };
    try {
      if (modalType === 'live') {
        setIsModalOpen(false);
        const response = await changeModeToLive(payload);
        notifySuccess('Website is now live');
        fetchSubaccountHistory();
      } else {
        const response = await deactivateSubAccount(payload);
        setIsModalOpen(false);
        fetchSubaccountHistory();
      }
    } catch (error: any) {
      notifyError(error.message);
      setIsModalOpen(false);
    }
  };

  const updateSubaccount = async (resetForm: () => void) => {
    setIsLoading(true);

    const modeValue =
      formik.values.mode === true || formik.values.mode === 'true' ? 1 : 0;

    try {
      const uploadedDocuments = await Promise.all(
        documents.map(async doc => {
          if (doc.file) {
            const formData = new FormData();
            formData.append('file', doc.file);

            // Upload file using the existing uploadFile function
            const uploadResponse = await uploadFile(formData);

            // Extract file URL from API response
            return { name: doc.title, url: uploadResponse.data.file };
          }
          return null;
        })
      );

      const payload = {
        merchant_name: formik.values.merchant_name,
        email: formik.values.contactEmail,
        mode: formik.values.mode,
        percentage: formik.values.percentage,
        description: formik.values.description,
        site_name: formik.values.siteName,
        category: formik.values.category,
        id: activeId,
        website_url: formik.values.websiteUrl,
        risk_rating: formik.values.riskRating,
        documents: uploadedDocuments.filter(Boolean),
        callback_url: formik.values.callback_url,
      };
      if (formik.values.callback_url) {
        payload['callback_url'] = `https://${formik.values.callback_url}`;
      }

      const response = await updateSubAccountAmount(payload);
      notifySuccess(response.message);
      setIsLoading(false);
      setIsUpdateOpen(false);
      fetchSubaccountHistory();
      resetForm();
    } catch (error: any) {
      notifyError(error.message);
      setIsLoading(false);
      setIsUpdateOpen(false);
      fetchSubaccountHistory();
      resetForm();
    }
  };

  const changeModal = async (id: any, type: string) => {
    setModalType(type);
    setActiveId(id);
    setIsModalOpen(true);
  };

  const updateModal = async (id: any) => {
    setActiveId(id);
    //     fetchBanks();
    setIsUpdateOpen(true);
  };

  //   useEffect(() => {
  //     fetchBankDetails();
  //   }, []);

  const handleDropdownToggle = (index: number | null, selectedItem: any) => {
    setState({
      ...state,
      dropdownIndex: state.dropdownIndex === index ? null : index,
    });
    handleClick(selectedItem, true);
  };

  const closeDropdown = () => {
    setState({
      ...state,
      dropdownIndex: null,
      showFilter: false,
    });
  };

  //   const fetchBankDetails = async () => {
  //     const bankDetails = await getBankDetails();
  //     setState(prevState => ({
  //       ...prevState,
  //       bankDetails,
  //       isLoading: false,
  //     }));
  //   };

  const debouncedHandleParamsChange = useCallback(
    debounce((value: string) => {
      setSearchInput(value);
    }, 300),
    []
  );

  const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedHandleParamsChange(event.target.value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = pagination?.last_page;
  const lastPage = pagination?.last_page;

  // Replace problematic useEffect with optimized hook
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

  // useEffect(() => {
  //   if (accountNumber.length === 10) {
  //     nameCheck();
  //   }
  // }, [accountNumber]);

  return (
    <>
      <Layout pageTitle='Sub Accounts' icon='sub-accounts'>
        <WebPageTitle title='Sub Accounts| Ramp Merchant Portal' />
        {/* <div>
          <h2 className="text-xl font-semibold">Manage Subaccounts</h2>
          <p className="text-sm pt-3 pb-5">
            Manage Subaccounts Within Your Company
          </p>
        </div> */}
        <div>
          {getSubaccountHistoryLoading ? (
            <Fragment>
              <TableSkeleton />
            </Fragment>
          ) : subaccounts?.length !== 0 ? (
            <Fragment>
              <Card className='mt-10'>
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
                    <Button
                      ariaLabel='Create New Subaccount'
                      text='Create New Sub Account'
                      primary
                      medium
                    />
                  </Link>
                </div>
                <div className='relative flex justify-end -mt-4'>
                  <Dropdown onOpen={showFilter} onClose={toggleFilter}>
                    <Filter filterCallback={fetchSubaccountHistory} />
                  </Dropdown>
                </div>
                <Table columns={columns} className='mt-7'>
                  {subaccounts?.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className='border-b last:border-none border-grey-200'
                    >
                      <td className='text-sm px-5 py-6'>{index + 1}</td>
                      <td className='text-sm px-5 py-6 capitalize'>
                        {item.merchant_name || 'N/A'}
                      </td>
                      <td className='text-sm px-5 py-6 flex'>
                        <span className='mr-1 sarepayPrimary text-sm'>
                          {item.merchant_key || 'N/A'}
                        </span>
                        <Image
                          src='/images/dashboard/copy.svg'
                          className='cursor-pointer'
                          onClick={() => copyToClipboard(item.merchant_key)}
                          alt='Copy Icon'
                          width={15}
                          height={15}
                        />
                      </td>
                      <td className='text-sm px-5 py-6'>
                        {item.email || 'N/A'}
                      </td>
                      <td className='text-xs px-5 py-6'>
                        <div
                          className={`text-center rounded-lg py-1 px-3 ${item.mode === 'Live'
                              ? 'text-[green] bg-[#E9F7EF]'
                              : 'text-danger bg-[#e0440326]'
                            }`}
                        >
                          {item.mode}
                        </div>
                      </td>
                      <td className='text-sm px-5 py-6'>
                        {truncateText(item.message, 25) || 'N/A'}
                      </td>
                      <td className='text-sm px-5 py-6'>
                        {item.created_at || 'N/A'}
                      </td>
                      <td
                        className='text-sm px-5 py-6'
                        onClick={() => handleDropdownToggle(index, item)}
                      >
                        <Image
                          src='/images/dashboard/collections/more.svg'
                          className='cursor-pointer'
                          alt='More Icon'
                          width={4}
                          height={16}
                        />
                        <div className='flex justify-end relative'>
                          <Dropdown
                            onOpen={state.dropdownIndex === index}
                            onClose={closeDropdown}
                          >
                            <ul className='list-none p-0'>
                              {/* <li
                                className="flex items-center pb-2 gap-2 hover:text-primary"
                                onClick={() => changeModal(item.id, "live")}
                              >
                                <IconWrapper
                                  src="/images/dashboard/collections/edit.svg"
                                  width={14}
                                  height={14}
                                  alt="Live icon"
                                />
                                <span>Live</span>
                              </li> */}
                              <li
                                className='flex items-center pb-2 gap-2 hover:text-primary'
                                onClick={() => updateModal(item.id)}
                              >
                                <IconWrapper
                                  src='/images/dashboard/collections/transaction.svg'
                                  width={14}
                                  height={14}
                                  alt='Transaction icon'
                                />
                                <span>Update</span>
                              </li>
                              <li
                                className='flex items-center gap-2 hover:text-primary'
                                onClick={() => changeModal(item.id, 'disable')}
                              >
                                <IconWrapper
                                  src='/images/dashboard/collections/disable.svg'
                                  width={14}
                                  height={14}
                                  alt='Deactivate icon'
                                />
                                <span>Deactivate</span>
                              </li>
                              <li
                                className='mt-2 flex items-center pb-2 gap-2 hover:text-primary'
                                onClick={() =>
                                  router.push(
                                    `sub-accounts/transactions/${item.id}`
                                  )
                                }
                              >
                                <IconWrapper
                                  src='/images/dashboard/collections/edit.svg'
                                  width={14}
                                  height={14}
                                  alt='Live icon'
                                />
                                <span>Transactions</span>
                              </li>
                            </ul>
                          </Dropdown>
                        </div>
                      </td>
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
      </Layout>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
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
            <p className=''>Are you sure you want to continue?</p>
            <div className='flex justify-center items-center gap-3 mt-4'>
              <Button
                text='Confirm'
                ariaLabel='Confirm button'
                onClick={() => handleModalChange()}
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

      <Modal isOpen={isUpdateOpen} onClose={closeUpdateModal}>
        <form onSubmit={formik.handleSubmit}>
          <div className='grid grid-cols-2 gap-5'>
            <FloatingLabelInput
              label='Site Name'
              id='siteName'
              type='text'
              htmlFor='siteName'
              formik={formik}
              {...formik.getFieldProps('siteName')}
            />

            <FloatingLabelInput
              label='Website URL'
              id='websiteUrl'
              type='text'
              htmlFor='websiteUrl'
              formik={formik}
              {...formik.getFieldProps('websiteUrl')}
            />
            <FloatingLabelInput
              label='Merchant Name'
              id='merchant_name'
              type='text'
              htmlFor='merchant_name'
              formik={formik}
              {...formik.getFieldProps('merchant_name')}
            />
            <FloatingLabelInput
              label='Percentage Split'
              id='percentage'
              type='number'
              htmlFor='percentage'
              formik={formik}
              maxLength={10}
              {...formik.getFieldProps('percentage')}
            />
          </div>
          <div>
            <label className='font-semibold'>
              Select Sub Account Mode Type
            </label>
            <select
              className='h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5'
              onChange={e => {
                formik.setFieldValue('mode', e.target.value === 'true');
              }}
              name='mode'
              value={
                formik.values.mode === undefined
                  ? ''
                  : formik.values.mode
                    ? 'true'
                    : 'false'
              }
            >
              {formik.values.mode === undefined && (
                <option value=''>--Select--</option>
              )}
              <option value='true'>Live</option>
              <option value='false'>Test</option>
            </select>
          </div>
          <FloatingLabelInput
            label='Contact Email'
            id='email'
            type='email'
            htmlFor='email'
            formik={formik}
            {...formik.getFieldProps('email')}
          />
          <p>
            If provided, this email address will get transaction notification
          </p>

          <div className='relative'>
            <FloatingLabelInput
              label={
                screenWidth < 700
                  ? 'Callback URL'
                  : 'Callback URL (e.g yourbusiness.com)'
              }
              id='callback_url'
              type='text'
              htmlFor='callback_url'
              formik={formik}
              {...formik.getFieldProps('callback_url')}
              hasLink
            />
            <span className='absolute text-sm top-5 left-3'>https://</span>
          </div>

          <div>
            <label className='font-semibold'>Risk Rating</label>
            <select
              className='h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5'
              {...formik.getFieldProps('riskRating')}
            >
              <option value='high'>High</option>
              <option value='medium'>Medium</option>
              <option value='low'>Low</option>
            </select>
          </div>

          <div>
            <label className='font-semibold'>Category</label>
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
                categories.find((opt: any) => opt === formik.values.category)
                  ? {
                    value: formik.values.category,
                    label: formik.values.category,
                  }
                  : null
              }
              onChange={selectedOption =>
                formik.setFieldValue('category', selectedOption?.value)
              }
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

          <FloatingLabelInput
            label='Description'
            id='description'
            type='text'
            htmlFor='message'
            formik={formik}
            {...formik.getFieldProps('description')}
          />
          <Button
            className='text-white mt-4 text-xs sm:text-sm p-2 sm:p-3 rounded'
            text={isLoading ? <Loader /> : 'Submit'}
            ariaLabel='Submit Button'
            disabled={!formik.isValid || isLoading}
            primary
          />
        </form>
      </Modal>
    </>
  );
};

export default SubaccountHistory;
