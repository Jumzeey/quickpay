import Button from '@/components/button';
import FormSelect from '@/components/FormSelect';
import Icon from '@/components/icon';
import Loader from '@/components/loader';
import UploadComponent from '@/components/upload-component';
import { useFormValidation } from '@/hooks/useFormValidation';
import { getFileIcon, getPreviewUrl, isImageFile, notifyError, notifySuccess } from '@/util/utils';
import Image from "next/image";
import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import * as Yup from 'yup';

interface UpgradeAccountFormProps {
    currentAccountType?: string;
    onSuccess?: () => void;
}

type BusinessType = 'private_limited' | 'public_limited' | 'ngo_religious';

interface DocumentWithType {
    id: string;
    file: File;
    title: string;
    documentType: string;
}

interface UpgradeFormData {
    businessType: BusinessType;
}

const BUSINESS_TYPES = [
    {
        value: 'private_limited' as BusinessType,
        label: 'Private Limited Liability Company',
        description: 'For private companies with limited liability'
    },
    {
        value: 'public_limited' as BusinessType,
        label: 'Public Limited Liability Company',
        description: 'For public companies trading shares'
    },
    {
        value: 'ngo_religious' as BusinessType,
        label: 'Non-Government Organization / Religious Organization',
        description: 'For NGOs, associations, and religious organizations'
    }
];

const DOCUMENT_TYPES = {
    private_limited: [
        { value: 'business_registration_cert', label: 'Certificate of Registration of Business Name' },
        { value: 'cac_bn1_form', label: 'Certified True Copy of Form CAC/BN/1' },
        { value: 'primary_id', label: 'Valid Primary Identification Documents' },
        { value: 'bvn_documents', label: 'BVN of Registered Sole Proprietor(s)' },
        { value: 'business_address_proof', label: 'Proof of Business Operating Address' },
        { value: 'partnership_resolution', label: 'Partnership Resolution (For Partnerships)' },
        { value: 'partnership_deed', label: 'Partnership Deed/Agreement (For Partnerships)' },
        { value: 'scuml_certificate', label: 'SCUML Certificate (Where Applicable)' },
    ],
    public_limited: [
        { value: 'incorporation_cert', label: 'Certificate of Incorporation' },
        { value: 'memorandum_articles', label: 'Memorandum and Articles of Association' },
        { value: 'cac7_form', label: 'Form CAC 7 (Particulars of Directors)' },
        { value: 'cac2_form', label: 'Form CAC 2 or CAC 1.1' },
        { value: 'business_address_proof', label: 'Proof of Business Operating Address' },
        { value: 'shareholders_id', label: 'Primary ID of Shareholders (5%+ ownership)' },
        { value: 'directors_bvn', label: 'BVN of All Registered Directors' },
        { value: 'scuml_certificate', label: 'SCUML Certificate' },
        { value: 'operating_license', label: 'Operating License (Where Applicable)' },
    ],
    ngo_religious: [
        { value: 'registration_cert', label: 'Certificate of Registration/Incorporation' },
        { value: 'cac_it1_form', label: 'Certified Copy of Form CAC/IT 1' },
        { value: 'resolution', label: 'Resolution or Minutes of Last Meeting' },
        { value: 'business_address_proof', label: 'Proof of Operating Address' },
        { value: 'trustees_bvn', label: 'BVN of All Registered Trustees' },
        { value: 'trustees_id', label: 'Valid Primary Identification of Trustees' },
        { value: 'scuml_certificate_ngo', label: 'SCUML Certificate for NGO' },
    ]
};

const UpgradeAccountForm: React.FC<UpgradeAccountFormProps> = ({
    currentAccountType = 'starter',
    onSuccess
}) => {
    const [documents, setDocuments] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    console.log({ documents });

    const validationSchema = Yup.object().shape({
        businessType: Yup.string().required('Please select a business type'),
    });

    const { control, handleSubmit, formState: { errors }, watch, reset } = useFormValidation(
        validationSchema,
        {
            defaultValues: {
                businessType: '' as BusinessType,
            }
        }
    );

    const selectedBusinessType = watch('businessType') as BusinessType;

    // const handleDocumentTypeChange = (documentIndex: number, documentType: string) => {
    //     setDocuments(prev =>
    //         prev.map((doc, index) =>
    //             index === documentIndex
    //                 ? { ...doc, documentType }
    //                 : doc
    //         )
    //     );
    // };
    const handleDocumentTypeChange = (documentId: string, documentType: string) => {
        setDocuments(prev =>
            prev.map(doc =>
                doc.id === documentId
                    ? { ...doc, documentType }
                    : doc
            )
        );
    };

    const getAvailableDocumentTypes = () => {
        if (!selectedBusinessType) return [];
        return DOCUMENT_TYPES[selectedBusinessType] || [];
    };

    const validateSubmission = () => {
        if (!selectedBusinessType) {
            notifyError('Please select a business type');
            return false;
        }

        if (documents.length === 0) {
            notifyError('Please upload at least one document');
            return false;
        }

        const documentsWithoutType = documents.filter(doc => !doc.documentType);
        if (documentsWithoutType.length > 0) {
            notifyError('Please select document type for all uploaded files');
            return false;
        }

        return true;
    };

    const handleSubmitUpgrade = async (data: UpgradeFormData) => {
        if (!validateSubmission()) return;

        // setIsSubmitting(true);

        try {
            // const formData = new FormData();
            // formData.append('business_type', data.businessType);
            // formData.append('current_account_type', currentAccountType);

            // // Group documents by type
            // const documentsByType: { [key: string]: any[] } = {};
            // documents.forEach(doc => {
            //     if (!documentsByType[doc.documentType]) {
            //         documentsByType[doc.documentType] = [];
            //     }
            //     documentsByType[doc.documentType].push(doc);
            // });

            // // Append files grouped by type
            // Object.entries(documentsByType).forEach(([documentType, docs]) => {
            //     docs.forEach((doc, index) => {
            //         formData.append(`documents[${documentType}][]`, doc.file);
            //         formData.append(`document_titles[${documentType}][]`, doc.title);
            //     });
            // });

            // Prepare payload
            const payload = {
                business_type: data.businessType,
                current_account_type: currentAccountType,
                documents: documents.map(doc => ({
                    url: doc.uploadedUrl,
                    // title: doc.title,
                    type: doc.documentType
                }))
            };

            console.log({ data, payload });
            return;

            // Replace with your actual API call
            // await upgradeBusinessAccount(formData);

            notifySuccess('Account upgrade request submitted successfully! We will review your documents and get back to you.');

            setDocuments([]);
            reset();
            onSuccess?.();

        } catch (error: any) {
            notifyError(error.message || 'Failed to submit upgrade request');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 justify-start mt-10 w-full">
            <div className="space-y-6">
                <Controller
                    name="businessType"
                    control={control}
                    render={({ field }) => (
                        <FormSelect
                            label="Business Type"
                            id="businessType"
                            htmlFor="businessType"
                            error={errors.businessType?.message}
                            touched={!!errors.businessType}
                            options={BUSINESS_TYPES.map(type => ({
                                value: type.value,
                                label: type.label
                            }))}
                            placeholder="Select business type"
                            {...field}
                        />
                    )}
                />

                {selectedBusinessType ? (
                    <div className="">
                        <h3 className="text-lg font-semibold mb-4 text-[#7F7F7F]">Required Documents</h3>
                        <ul className="list-disc list-inside space-y-2">
                            {DOCUMENT_TYPES[selectedBusinessType].map(doc => (
                                <li key={doc.value} className="text-sm text-[#7F7F7F]">
                                    {doc.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <div className="text-sm">
                                <p className="font-medium text-blue-800">Important Information</p>
                                <ul className="text-blue-700 mt-2 space-y-1">
                                    <li>• Your account upgrade request will be reviewed by our compliance team</li>
                                    <li>• The review process may take 3-5 business days</li>
                                    <li>• We will notify you once the review is complete</li>
                                    <li>• Ensure all documents are clear and legible</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="lg:col-span-2">
                <UploadComponent
                    className="h-auto"
                    name="upgrade_documents"
                    text="Upload Required Documents"
                    folderName="business-upgrade"
                    multiple
                    showPreview
                    documents={documents}
                    setDocuments={setDocuments}
                    maxFiles={15}
                />

                {/* Document Type Selection - Separate from Upload Component */}
                {documents.length > 0 && selectedBusinessType && (
                    <div className="mt-6 space-y-4">
                        <h4 className="text-sm font-medium text-[#7f7f7f]">
                            {/* Document ({documents.filter(doc => doc.documentType).length}/{documents.length} completed) */}
                            Documents ({documents.length})
                        </h4>

                        <div className="space-y-3">
                            {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-4 px-2 py-1.5 bg-[#D9D9D90D] border border-[#C4C4C43D] rounded-lg">
                                    <div className="flex-1 flex items-center gap-4">
                                        <div className="">
                                            {isImageFile(doc.file.name) ? (
                                                <div className="relative">
                                                    <Image
                                                        src={getPreviewUrl(doc.file)}
                                                        alt={doc.title}
                                                        width={36}
                                                        height={36}
                                                        className="w-9 h-9 object-cover rounded border group-hover:opacity-80 transition-opacity"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded">
                                                        <Icon name="eye" className="h-4 w-4 text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-9 h-9 bg-gray-100 rounded border flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                                    <Icon
                                                        name={getFileIcon(doc.file.name)}
                                                        className="h-5 w-5 text-gray-400 group-hover:text-gray-600"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="">
                                            <p className="font-medium text-sm text-[#7F7F7F]">{doc.title}</p>
                                            <p className="text-[10px] text-[#9F9F9F]">
                                                {doc.file?.name} | {(doc.file?.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 w-64">
                                        <select
                                            value={doc.documentType || ''}
                                            onChange={(e) => handleDocumentTypeChange(doc.id, e.target.value)}
                                            className="w-full px-3 py-2 text-[#7F7F7F] border border-[#C4C4C43D] rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
                                        >
                                            <option value="">Select document type</option>
                                            {getAvailableDocumentTypes().map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-center mt-4 w-[28%] border-danger">
                <Button
                    text={isSubmitting ? <Loader /> : "Submit"}
                    ariaLabel="Submit business account upgrade request"
                    disabled={isSubmitting || !selectedBusinessType || documents.length === 0}
                    onClick={handleSubmit(handleSubmitUpgrade)}
                    primary
                    type="submit"
                />
            </div>
        </div>
    );
};

export default UpgradeAccountForm;