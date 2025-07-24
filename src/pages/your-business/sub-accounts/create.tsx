import Button from '@/components/button';
import Card from '@/components/Card';
import FancyFileUpload from '@/components/FancyFileUpload';
import FormInput from '@/components/FormInput';
import Layout from '@/components/layout';
import Loader from '@/components/loader';
import { useFormValidation } from '@/hooks/useFormValidation';
import useScreenWidth from '@/hooks/useScreenWidth';
import { uploadFile } from '@/services/kyc';
import useCategories from '@/stores/useCategories';
import useSubAccount from '@/stores/useSubAccount';
import { notifyError, notifySuccess } from '@/util/utils';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import Select from 'react-select';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
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
});

interface SubAccountFormValues {
  merchant_name: string;
  mode: boolean | undefined;
  contactEmail: string;
  percentage: string;
  description: string;
  siteName: string;
  websiteUrl: string;
  callback_url: string;
  riskRating: string;
  category: string;
  documents: any[];
}

const SubAccountForm = () => {
  const router = useRouter();
  const screenWidth = useScreenWidth();
  const { postSubAccountAmount, postSubAccountAmountLoading } = useSubAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { categories, fetchCategories, getCategoriesLoading } = useCategories();
  const [documents, setDocuments] = useState<{ title: string; file: File | null }[]>([]);

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
  }, [fetchCategories, categories.length]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    getValues
  } = useFormValidation<SubAccountFormValues>(validationSchema, {
    defaultValues: {
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
    mode: 'onChange'
  });

  const onSubmit = async (values: SubAccountFormValues) => {
    setIsSubmitting(true);

    try {
      const uploadedDocuments = await Promise.all(
        documents.map(async doc => {
          if (doc.file) {
            const formData = new FormData();
            formData.append('file', doc.file);
            formData.append('folder', 'subaccount_documents');

            const uploadResponse = await uploadFile(formData);
            return { name: doc.title, url: uploadResponse.data.file };
          }
          return null;
        })
      );

      const payload = {
        site_name: values.siteName,
        merchant_name: values.merchant_name,
        mode: values.mode === true ? 1 : 0,
        email: values.contactEmail,
        percentage: values.percentage,
        website_url: values.websiteUrl,
        risk_rating: values.riskRating,
        category: values.category,
        documents: uploadedDocuments.filter(Boolean),
        message: values.description
      };

      if (values.callback_url) {
        // @ts-ignore
        payload.callback_url = `https://${values.callback_url}`;
      }

      // @ts-ignore
      const response = await postSubAccountAmount(payload);
      notifySuccess(response.message);
      router.push('/your-business?tab=sub-accounts');
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout pageTitle='Sub Account' icon='sub-accounts'>
      <div className='flex justify-between items-center p-4 sm:p-6 lg:p-12'>
        <Image
          src='/images/arrow-back.svg'
          className='cursor-pointer'
          width={36}
          height={36}
          onClick={() => router.back()}
          alt='back icon'
        />
      </div>
      <div className='flex justify-center mt-4 sm:mt-6 lg:mt-2'>
        <Card extraPadding>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div>
              <label className='font-semibold text-sm'>
                Select Sub Account Mode Type
              </label>
              <Controller
                name="mode"
                control={control}
                render={({ field }) => (
                  <select
                    className='h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5'
                    onChange={(e) => field.onChange(e.target.value === 'true')}
                    value={field.value === undefined ? '' : field.value ? 'true' : 'false'}
                  >
                    {field.value === undefined && <option value=''>--Select--</option>}
                    <option value='true'>Live</option>
                    <option value='false'>Test</option>
                  </select>
                )}
              />
              {errors.mode && (
                <p className="text-red-500 text-xs mt-1">{errors.mode.message}</p>
              )}
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6'>
              <Controller
                name="siteName"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label='Site Name'
                    id='siteName'
                    type='text'
                    htmlFor='siteName'
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
                    label='Percentage split'
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

            <Controller
              name="callback_url"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    screenWidth < 700
                      ? 'Callback URL'
                      : 'Callback URL (e.g yourbusiness.com)'
                  }
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
              <label className='font-semibold text-sm'>Risk Rating</label>
              <Controller
                name="riskRating"
                control={control}
                render={({ field }) => (
                  <select
                    className='h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5'
                    {...field}
                  >
                    <option value=''>--Select--</option>
                    <option value='high'>High</option>
                    <option value='medium'>Medium</option>
                    <option value='low'>Low</option>
                  </select>
                )}
              />
              {errors.riskRating && (
                <p className="text-red-500 text-xs mt-1">{errors.riskRating.message}</p>
              )}
            </div>

            <div>
              <label className='font-semibold text-sm'>Category</label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    options={categories.map((category: string) => ({
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
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
              )}
            </div>

            <div className='mb-5'>
              <label className='font-semibold text-sm text-gray-700'>
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
              text={isSubmitting || postSubAccountAmountLoading ? <Loader /> : 'Create Sub Account'}
              ariaLabel='Create Sub Account Button'
              disabled={isSubmitting || postSubAccountAmountLoading}
              primary
            />
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default SubAccountForm;
