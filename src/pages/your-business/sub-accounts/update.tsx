import Button from '@/components/button';
import FancyFileUpload from '@/components/FancyFileUpload';
import Loader from '@/components/loader';
import Modal from '@/components/modal';
import { useFormValidation } from '@/hooks/useFormValidation';
import { notifyError, notifySuccess } from '@/util/utils';
import { uploadFileByConfig } from '@/util/uploadFileByConfig';
import React, { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import Select from 'react-select';
import * as Yup from 'yup';

interface UpdateSubAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeSubAccount: any;
    categories: string[];
    getCategoriesLoading: boolean;
    onSuccess: () => void;
    updateSubAccountAmount: (payload: any) => Promise<any>;
}

const validationSchema = Yup.object().shape({
    merchant_name: Yup.string().required('Merchant name is required!'),
    mode: Yup.string()
        .oneOf(['Test', 'Live'], 'Mode must be either Test or Live')
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
    message: Yup.string().notRequired(),
    callback_url: Yup.string()
        .notRequired()
        .matches(
            /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
            'Enter a valid callback URL!'
        ),
});

const UpdateSubAccountModal: React.FC<UpdateSubAccountModalProps> = ({
    isOpen,
    onClose,
    activeSubAccount,
    categories,
    getCategoriesLoading,
    onSuccess,
    updateSubAccountAmount,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [documents, setDocuments] = useState<{ title: string; file: File | null }[]>([]);

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset
    } = useFormValidation(validationSchema, {
        defaultValues: {
            merchant_name: '',
            mode: '',
            contactEmail: '',
            percentage: undefined,
            message: '',
            siteName: '',
            websiteUrl: '',
            callback_url: '',
            riskRating: '',
            category: '',
        },
        mode: 'onChange'
    });

    console.log({ errors })

    useEffect(() => {
        if (isOpen && activeSubAccount) {
            reset({
                merchant_name: activeSubAccount.merchant_name || '',
                mode: activeSubAccount.mode || '',
                contactEmail: activeSubAccount.email || '',
                percentage: activeSubAccount.percentage,
                message: activeSubAccount.message || '',
                siteName: activeSubAccount.site_name || '',
                websiteUrl: activeSubAccount.website_url || '',
                callback_url: activeSubAccount.callback_url?.replace(/^https?:\/\//, '') || '',
                riskRating: activeSubAccount.risk_rating || 'low',
                category: activeSubAccount.category || '',
            });
        }
    }, [isOpen, activeSubAccount, reset]);

    const onSubmit = async (values: any) => {
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
                merchant_name: values.merchant_name,
                email: values.contactEmail,
                mode: values.mode === "Live" ? 1 : 0,
                percentage: values.percentage,
                message: values.message,
                site_name: values.siteName,
                website_url: values.websiteUrl,
                risk_rating: values.riskRating,
                category: values.category,
                id: activeSubAccount.id,
                documents: uploadedDocuments.filter(Boolean),
            };

            if (values.callback_url) {
                // @ts-ignore
                payload.callback_url = `https://${values.callback_url}`;
            }

            // @ts-ignore
            await updateSubAccountAmount(payload);
            notifySuccess('Subaccount updated successfully');
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
        <Modal isOpen={isOpen} onClose={onClose} title="Update Sub Account">
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
                                <label className="text-sm text-black mb-1 font-medium">Sub Account Mode Type</label>
                                <div className="w-full border border-[#C4C4C43D] rounded p-2">
                                    <Controller
                                        name="mode"
                                        control={control}
                                        render={({ field }) => (
                                            <select
                                                className="w-full h-12 appearance-none bg-transparent focus-visible:outline-none"
                                                disabled
                                                {...field}
                                            >
                                                <option value="">Select mode</option>
                                                <option>Live</option>
                                                <option>Test</option>
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
                                                <option value="high">High</option>
                                                <option value="medium">Medium</option>
                                                <option value="low">Low</option>
                                            </select>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

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
                            <span className="text-xs text-[#005BB0] font-medium">
                                If provided, this email address will get transaction notification
                            </span>
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
                                    name="message"
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
                            {errors.message && (
                                <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="w-[113px]">
                            <Button
                                className="font-medium text-white mt-5 text-xs p-2 rounded w-full"
                                text={isSubmitting ? <Loader /> : "Submit"}
                                ariaLabel="Submit"
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

export default UpdateSubAccountModal;