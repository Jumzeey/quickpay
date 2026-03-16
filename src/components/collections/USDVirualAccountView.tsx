import React, { useMemo, useState } from 'react';
import Icon from '@/components/icon';
import Button from '@/components/button';
import FormInput from '@/components/FormInput';
import FormSelect from '@/components/FormSelect';
import Loader from '@/components/loader';
import { Controller } from 'react-hook-form';
import { useFormValidation } from '@/hooks/useFormValidation';
import * as Yup from 'yup';
import { uuid } from '@/util/utils';
import { createVirtualAccount } from '@/services/collections';
import USDVirtualAccountDocuments from './USDVirtualAccountDocuments';
import { useApiResponse } from '@/hooks/useApiResponse';

interface Props {
  onBack: () => void;
  virtualAccountType: string;
}

interface USDFormValues {
  account_name: string;
  customer_email: string;
  phone_number: string;
  date_of_birth: string;
  address: string;
  rc_number?: string;
  id_number: string;
  tax_id: string;
  business_url: string;
  beneficial_owner: string;
  business_name: string;
  business_description?: string;
  first_name: string;
  last_name: string;
  type: string;
}

const USDVirtualAccountView: React.FC<Props> = ({
  onBack,
  virtualAccountType,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState('individual');
  const [uploadedDocuments, setUploadedDocuments] = useState<
    { type: string; url: string; label?: string }[]
  >([]);
  const { handleError, handleSuccess } = useApiResponse();

  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        account_name: Yup.string().required('Account name is required'),
        customer_email: Yup.string()
          .email('Invalid email')
          .required('Email is required'),
        phone_number: Yup.string()
          .required('Phone number is required')
          .matches(/^[0-9]{10,15}$/, 'Enter a valid phone number'),
        first_name: Yup.string().required('First name is required'),
        last_name: Yup.string().required('Last name is required'),
        id_number: Yup.string().required('Identification number is required'),
        date_of_birth: Yup.string().required('Date of birth is required'),
        address: Yup.string().required('Address is required'),
        tax_id: Yup.string().required('Tax ID is required'),
        business_url: Yup.string()
          .url('Invalid URL')
          .required('Business URL is required'),
        beneficial_owner: Yup.string().required('Beneficial owner is required'),
        business_name: Yup.string().required('Business name is required'),
        business_description: Yup.string().required('Business description is required'),
        type: Yup.string().required('Account type is required'),
        ...(accountType === 'corporate' && {
          rc_number: Yup.string().required('RC Number is required'),
        }),
      }),
    [accountType]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useFormValidation<USDFormValues>(validationSchema, {
    defaultValues: {
      account_name: '',
      customer_email: '',
      phone_number: '',
      date_of_birth: '',
      address: '',
      rc_number: '',
      id_number: '',
      tax_id: '',
      business_url: '',
      beneficial_owner: '',
      business_name: '',
      business_description: '',
      first_name: '',
      last_name: '',
      type: 'individual',
    },
    mode: 'onChange',
  });

  const onSubmit = async (values: USDFormValues) => {
    setIsLoading(true);
    try {
      const formData = new FormData();

      const reference = uuid();
      formData.append('reference', reference);
      formData.append('currency', 'USD');
      formData.append('virtual_account_type', virtualAccountType);

      // Append all text fields
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value as any);
        }
      });

      // ✅ Append uploaded document URLs (new contract)
      console.log('Uploaded documents to append:', uploadedDocuments.length);
      uploadedDocuments.forEach(doc => {
        if (doc.type && doc.url) {
          console.log(`Appending document URL - Field: ${doc.type}, URL: ${doc.url}`);
          formData.append(doc.type, doc.url);
        }
      });

      const response = await createVirtualAccount(formData);
      handleSuccess(response, 'USD Virtual Account created successfully');

      reset();
      onBack();
    } catch (error: any) {
      handleError(error, 'Failed to create USD Virtual Account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='w-full'>
      {/* Back Button */}
      <button
        className='cursor-pointer text-primary text-left text-[13px] font-semibold flex items-center gap-1 mt-6'
        onClick={onBack}
      >
        <Icon name='arrowLeft2' />
        <span>Back to Virtual Accounts</span>
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className='mt-10'>
        {/* 1. Personal Information */}
        <h3 className='text-primary text-[13px] font-bold flex items-center gap-1 mb-4'>
          <span>1. Personal Information</span>
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-10'>
          <Controller
            name='account_name'
            control={control}
            render={({ field }) => (
              <FormInput
                label='Account Name'
                id='account_name'
                type='text'
                htmlFor='account_name'
                error={errors.account_name?.message}
                touched={!!errors.account_name}
                {...field}
              />
            )}
          />

          <Controller
            name='customer_email'
            control={control}
            render={({ field }) => (
              <FormInput
                label='Email Address'
                id='customer_email'
                type='email'
                htmlFor='customer_email'
                error={errors.customer_email?.message}
                touched={!!errors.customer_email}
                {...field}
              />
            )}
          />

          <Controller
            name='phone_number'
            control={control}
            render={({ field }) => (
              <FormInput
                label='Phone Number'
                id='phone_number'
                type='text'
                htmlFor='phone_number'
                error={errors.phone_number?.message}
                touched={!!errors.phone_number}
                numberOnly
                {...field}
              />
            )}
          />

          <Controller
            name='id_number'
            control={control}
            render={({ field }) => (
              <FormInput
                label='Identification Number'
                id='id_number'
                type='text'
                htmlFor='id_number'
                error={errors.id_number?.message}
                touched={!!errors.id_number}
                {...field}
              />
            )}
          />

          <Controller
            name='date_of_birth'
            control={control}
            render={({ field }) => (
              <FormInput
                label='Date of Birth'
                id='date_of_birth'
                type='date'
                htmlFor='date_of_birth'
                error={errors.date_of_birth?.message}
                touched={!!errors.date_of_birth}
                max={
                  new Date(
                    new Date().setFullYear(new Date().getFullYear() - 16)
                  )
                    .toISOString()
                    .split('T')[0]
                }
                {...field}
              />
            )}
          />

          <Controller
            name='first_name'
            control={control}
            render={({ field }) => (
              <FormInput
                label='First Name'
                id='first_name'
                type='text'
                htmlFor='first_name'
                error={errors.first_name?.message}
                touched={!!errors.first_name}
                {...field}
              />
            )}
          />

          <Controller
            name='last_name'
            control={control}
            render={({ field }) => (
              <FormInput
                label='Last Name'
                id='last_name'
                type='text'
                htmlFor='last_name'
                error={errors.last_name?.message}
                touched={!!errors.last_name}
                {...field}
              />
            )}
          />
        </div>

        {/* 2. Business Information */}
        <h3 className='text-primary text-[13px] font-bold flex items-center gap-1 mb-4'>
          <span>2. Business Information</span>
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-10'>
          <Controller
            name='type'
            control={control}
            render={({ field }) => (
              <FormSelect
                label='Account Type'
                id='type'
                htmlFor='type'
                error={errors.type?.message}
                touched={!!errors.type}
                options={[
                  { value: 'individual', label: 'Individual' },
                  { value: 'corporate', label: 'Corporate' },
                ]}
                {...field}
                onChange={e => {
                  field.onChange(e);
                  setAccountType(e.target.value);
                }}
              />
            )}
          />

          <Controller
            name='business_name'
            control={control}
            render={({ field }) => (
              <FormInput
                label='Business Name'
                id='business_name'
                type='text'
                htmlFor='business_name'
                error={errors.business_name?.message}
                touched={!!errors.business_name}
                {...field}
              />
            )}
          />

          <Controller
            name='address'
            control={control}
            render={({ field }) => (
              <FormInput
                label='Physical Address'
                id='address'
                type='text'
                htmlFor='address'
                error={errors.address?.message}
                touched={!!errors.address}
                {...field}
              />
            )}
          />

          <Controller
            name='rc_number'
            control={control}
            render={({ field }) => (
              <FormInput
                label='RC Number'
                id='rc_number'
                type='text'
                htmlFor='rc_number'
                error={errors.rc_number?.message}
                touched={!!errors.rc_number}
                {...field}
              />
            )}
          />

          <Controller
            name='tax_id'
            control={control}
            render={({ field }) => (
              <FormInput
                label='Tax ID'
                id='tax_id'
                type='text'
                htmlFor='tax_id'
                error={errors.tax_id?.message}
                touched={!!errors.tax_id}
                {...field}
              />
            )}
          />

          <Controller
            name='business_url'
            control={control}
            render={({ field }) => (
              <FormInput
                label='Business URL'
                id='business_url'
                type='text'
                htmlFor='business_url'
                error={errors.business_url?.message}
                touched={!!errors.business_url}
                {...field}
              />
            )}
          />

          <Controller
            name='beneficial_owner'
            control={control}
            render={({ field }) => (
              <FormInput
                label='Beneficial Owner'
                id='beneficial_owner'
                type='text'
                htmlFor='beneficial_owner'
                error={errors.beneficial_owner?.message}
                touched={!!errors.beneficial_owner}
                {...field}
              />
            )}
          />

          <Controller
            name='business_description'
            control={control}
            render={({ field }) => (
              <FormInput
                label='Business Description'
                id='business_description'
                type='text'
                htmlFor='business_description'
                error={errors.business_description?.message}
                touched={!!errors.business_description}
                {...field}
              />
            )}
          />
        </div>

        {/* 3. Supporting documents */}
        <h3 className='text-primary text-[13px] font-bold flex items-center gap-1 mb-4'>
          <span>3. Supporting Documents</span>
        </h3>

        <USDVirtualAccountDocuments
          type={accountType}
          onDocumentsUploaded={setUploadedDocuments}
        />

        <div className='w-1/3 mt-8'>
          <Button
            className='text-white mt-4 text-sm p-2 rounded'
            text={
              isLoading ? <Loader /> : 'Submit documents and request Account'
            }
            ariaLabel='Submit'
            disabled={isLoading}
            primary
            type='submit'
          />
        </div>
      </form>
    </div>
  );
};

export default USDVirtualAccountView;
