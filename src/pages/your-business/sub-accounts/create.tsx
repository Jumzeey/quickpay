import Button from '@/components/button';
import FancyFileUpload from '@/components/FancyFileUpload';
import Loader from '@/components/loader';
import Modal from '@/components/modal';
import { useFormValidation } from '@/hooks/useFormValidation';
import useSubAccount from '@/stores/useSubAccount';
import { notifyError, notifySuccess } from '@/util/utils';
import { uploadFileByConfig } from '@/util/uploadFileByConfig';
import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import Select from 'react-select';
import * as Yup from 'yup';

interface CreateSubAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  getCategoriesLoading: boolean;
  onSuccess: () => void;
}

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
}

const CreateSubAccountModal: React.FC<CreateSubAccountModalProps> = ({
  isOpen,
  onClose,
  categories,
  getCategoriesLoading,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState<{ title: string; file: File | null }[]>([]);
  const { postSubAccountAmount, postSubAccountAmountLoading } = useSubAccount();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
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
    },
    mode: 'onChange'
  });

  const onSubmit = async (values: SubAccountFormValues) => {
    setIsSubmitting(true);

    try {
      const uploadedDocuments = await Promise.all(
        documents.map(async doc => {
          if (doc.file) {
            const url = await uploadFileByConfig(doc.file, 'subaccount_documents');
            return { name: doc.title, url };
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
      notifySuccess(response.message || 'Sub account created successfully');
      onClose();
      onSuccess();
      reset();
      setDocuments([]);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Sub Account">
      <div className="mt-5">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-6">
              {/* Site Name */}
              <div>
                <label className="text-sm text-black mb-1 font-medium">Site Name</label>
                <div className="w-full border border-[#C4C4C43D] rounded p-2">
                  <Controller
                    name="siteName"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="text"
                        className="w-full h-12 active:border-none focus-visible:outline-none"
                        {...field}
                      />
                    )}
                  />
                </div>
                {errors.siteName && (
                  <p className="text-red-500 text-xs mt-1">{errors.siteName.message}</p>
                )}
              </div>

              {/* Website URL */}
              <div>
                <label className="text-sm text-black mb-1 font-medium">Website URL</label>
                <div className="w-full border border-[#C4C4C43D] rounded p-2">
                  <Controller
                    name="websiteUrl"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="text"
                        className="w-full h-12 active:border-none focus-visible:outline-none"
                        {...field}
                      />
                    )}
                  />
                </div>
                {errors.websiteUrl && (
                  <p className="text-red-500 text-xs mt-1">{errors.websiteUrl.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Merchant Name */}
              <div>
                <label className="text-sm text-black mb-1 font-medium">Merchant Name</label>
                <div className="w-full border border-[#C4C4C43D] rounded p-2">
                  <Controller
                    name="merchant_name"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="text"
                        className="w-full h-12 active:border-none focus-visible:outline-none"
                        {...field}
                      />
                    )}
                  />
                </div>
                {errors.merchant_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.merchant_name.message}</p>
                )}
              </div>

              {/* Percentage Split */}
              <div>
                <label className="text-sm text-black mb-1 font-medium">Percentage Split</label>
                <div className="w-full border border-[#C4C4C43D] rounded p-2">
                  <Controller
                    name="percentage"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        className="w-full h-12 active:border-none focus-visible:outline-none"
                        {...field}
                      />
                    )}
                  />
                </div>
                {errors.percentage && (
                  <p className="text-red-500 text-xs mt-1">{errors.percentage.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Sub Account Mode */}
              <div>
                <label className="text-sm text-black mb-1 font-medium">
                  Select Sub Account Mode Type
                </label>
                <div className="w-full border border-[#C4C4C43D] rounded p-2">
                  <Controller
                    name="mode"
                    control={control}
                    render={({ field }) => (
                      <select
                        className="w-full h-12 appearance-none bg-transparent focus-visible:outline-none"
                        onChange={(e) => field.onChange(e.target.value === 'true')}
                        value={field.value === undefined ? '' : field.value ? 'true' : 'false'}
                      >
                        {field.value === undefined && <option value="">--Select--</option>}
                        <option value="true">Live</option>
                        <option value="false">Test</option>
                      </select>
                    )}
                  />
                </div>
                {errors.mode && (
                  <p className="text-red-500 text-xs mt-1">{errors.mode.message}</p>
                )}
              </div>

              {/* Risk Rating */}
              <div>
                <label className="text-sm text-black mb-1 font-medium">Risk Rating</label>
                <div className="w-full border border-[#C4C4C43D] rounded p-2">
                  <Controller
                    name="riskRating"
                    control={control}
                    render={({ field }) => (
                      <select
                        className="w-full h-12 appearance-none bg-transparent focus-visible:outline-none"
                        {...field}
                      >
                        <option value="">--Select--</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    )}
                  />
                </div>
                {errors.riskRating && (
                  <p className="text-red-500 text-xs mt-1">{errors.riskRating.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Contact Email */}
              <div>
                <label className="text-sm text-black mb-1 font-medium">Contact Email</label>
                <div className="w-full border border-[#C4C4C43D] rounded p-2">
                  <Controller
                    name="contactEmail"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="email"
                        className="w-full h-12 active:border-none focus-visible:outline-none"
                        {...field}
                      />
                    )}
                  />
                </div>
                {errors.contactEmail && (
                  <p className="text-red-500 text-xs mt-1">{errors.contactEmail.message}</p>
                )}
                <span className="text-xs text-[#DC143C] font-medium">
                  If provided, this email address will get transaction notification
                </span>
              </div>
            </div>

            {/* Callback URL */}
            <div>
              <label className="text-sm text-black mb-1 font-medium">Callback URL (e.g yourbusiness.com)</label>
              <div className="w-full border border-[#C4C4C43D] rounded p-2">
                <Controller
                  name="callback_url"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      className="w-full h-12 active:border-none focus-visible:outline-none"
                      {...field}
                    />
                  )}
                />
              </div>
              {errors.callback_url && (
                <p className="text-red-500 text-xs mt-1">{errors.callback_url.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="text-sm text-black mb-1 font-medium">Category</label>
              <div className="w-full border border-[#C4C4C43D] rounded">
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
                        control: (provided) => ({
                          ...provided,
                          height: '48px',
                          padding: '0.25rem',
                          border: 'none',
                          boxShadow: 'none',
                          '&:hover': {
                            border: 'none',
                          },
                        }),
                        placeholder: (provided) => ({
                          ...provided,
                          fontSize: '0.875rem',
                        }),
                        input: (provided) => ({
                          ...provided,
                          fontSize: '0.875rem',
                        }),
                        option: (provided) => ({
                          ...provided,
                          fontSize: '0.875rem',
                        }),
                      }}
                    />
                  )}
                />
              </div>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
              )}
            </div>

            {/* Supporting Documents */}
            <div>
              <label className="text-sm text-black mb-1 font-medium">
                Upload Supporting Documents
              </label>
              <FancyFileUpload
                documents={documents}
                setDocuments={setDocuments}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm text-black mb-1 font-medium">Description</label>
              <div className="w-full border border-[#C4C4C43D] rounded p-2">
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      className="w-full h-12 active:border-none focus-visible:outline-none"
                      {...field}
                    />
                  )}
                />
              </div>
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="w-[113px]">
              <Button
                className="font-medium text-white mt-5 text-xs p-2 rounded w-full"
                text={isSubmitting ? <Loader /> : "Create"}
                ariaLabel="Create Sub Account"
                disabled={isSubmitting}
                primary
                type="submit"
              />
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateSubAccountModal;