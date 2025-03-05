import React, { useState, useEffect, ChangeEvent } from 'react';
import Select from 'react-select';
import Button from '@/components/button';
import Layout from '@/components/layout';
import FloatingLabelInput from '@/components/floating-input';
// import { getBanks, performNameCheck } from "@/services/bank";
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/router';
import {
  notifyError,
  notifySuccess,
  // removeCommasFromValue,
} from '@/util/utils';
import useSubAccount from '@/stores/useSubAccount';
import useCategories from '@/stores/useCategories';
import Loader from '@/components/loader';
import Card from '@/components/Card';
import Image from 'next/image';
import FancyFileUpload from '@/components/FancyFileUpload';
import { uploadFile } from '@/services/kyc';

const SubAccountForm: React.FC = () => {
  const router = useRouter();
  const { postSubAccountAmount } = useSubAccount();
  const [isLoading, setIsLoading] = useState(false);
  const { categories, fetchCategories, getCategoriesLoading } = useCategories();
  const [documents, setDocuments] = useState<
    { title: string; file: File | null }[]
  >([]);

  useEffect(() => {
  if (categories.length === 0) fetchCategories();
}, [fetchCategories, categories]);

  const formik = useFormik({
    initialValues: {
      merchant_name: '',
      mode: undefined,
      contactEmail: '',
      percentage: '',
      description: '',
      siteName: '',
      websiteUrl: '',
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
    }),
    validateOnMount: true,
    onSubmit: async () => {
      postDisbursement();
    },
  });

  const postDisbursement = async () => {
    setIsLoading(true);

    const modeValue =
      formik.values.mode === true || formik.values.mode === 'true' ? 1 : 0;

    try {
      const uploadedDocuments = await Promise.all(
        documents.map(async doc => {
          if (doc.file) {
            const formData = new FormData();
            formData.append('file', doc.file);
            formData.append('folder', 'subaccount_documents');

            // Upload file using the existing uploadFile function
            const uploadResponse = await uploadFile(formData);

            // Extract file URL from API response
            return { name: doc.title, url: uploadResponse.data.file };
          }
          return null;
        })
      );

      const payload = {
        site_name: formik.values.siteName,
        merchant_name: formik.values.merchant_name,
        mode: modeValue,
        email: formik.values.contactEmail,
        percentage: formik.values.percentage,
        website_url: formik.values.websiteUrl,
        risk_rating: formik.values.riskRating,
        category: formik.values.category,
        documents: uploadedDocuments.filter(Boolean),
        message: formik.values.description,
      };

      console.log('Sending Payload:', payload);

      const response = await postSubAccountAmount(payload);

      notifySuccess(response.message);
      setIsLoading(false);
      router.push({
        pathname: '/your-business/sub-accounts',
      });
    } catch (error: any) {
      notifyError(error.message);
      setIsLoading(false);
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
          <form onSubmit={formik.handleSubmit} className='space-y-4'>
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

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6'>
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
                label='Percentage split'
                id='percentage'
                type='number'
                htmlFor='percentage'
                formik={formik}
                maxLength={10}
                {...formik.getFieldProps('percentage')}
              />
            </div>
            <FloatingLabelInput
              label='Contact Email'
              id='contactEmail'
              type='text'
              htmlFor='contactEmail'
              formik={formik}
              {...formik.getFieldProps('contactEmail')}
            />
            <div>
              <label className='font-semibold'>Risk Rating</label>
              <select
                className='h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5'
                {...formik.getFieldProps('riskRating')}
              >
                <option value=''>--Select--</option>
                <option value='high'>High</option>
                <option value='medium'>Medium</option>
                <option value='low'>Low</option>
              </select>
            </div>

            <div>
              <label className='font-semibold'>Category</label>
              <Select
  options={categories.map((category) => ({
    value: category,
    label: category,
  }))}
  isSearchable
  placeholder={getCategoriesLoading ? "Loading categories..." : "Search or select category"}
  isDisabled={getCategoriesLoading}
  value={
    categories.find((opt) => opt === formik.values.category)
      ? {
          value: formik.values.category,
          label: formik.values.category,
        }
      : null
  }
  onChange={(selectedOption) =>
    formik.setFieldValue("category", selectedOption?.value)
  }
  styles={{
    control: (provided, state) => ({
      ...provided,
      height: "60px",
      padding: "0.5rem",
      width: "100%",
      borderRadius: "0.5rem",
      borderWidth: "1px",
      borderColor: state.isFocused ? "#6750A4" : "#CAC4D0",
      outline: "none",
      fontSize: "0.875rem",
      marginBottom: "1.25rem",
      "&:hover": {
        borderColor: "#6750A4",
      },
    }),
  }}
/>
            </div>

            <div>
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
              text={isLoading ? <Loader /> : 'Create Sub Account'}
              ariaLabel='Create Sub Account Button'
              disabled={!formik.isValid || isLoading}
              primary
            />
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default SubAccountForm;