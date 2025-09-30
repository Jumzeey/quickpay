import Button from '@/components/button';
import FormSelect from '@/components/FormSelect';
import Icon from '@/components/icon';
import Loader from '@/components/loader';
import Modal from '@/components/modal';
import UploadComponent from '@/components/upload-component';
import { useFormValidation } from '@/hooks/useFormValidation';
import useKyc from '@/stores/useKyc';
import { getFileIcon, getPreviewUrl, isImageFile, notifyError, notifySuccess } from '@/util/utils';
import Image from "next/image";
import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import * as Yup from 'yup';

interface UpgradeAccountFormProps {
    currentAccountType?: string;
    onSuccess?: () => void;
}

type BusinessType =
    | 'individual'
    | 'sole_proprietor'
    | 'private_limited'
    | 'public_limited'
    | 'ngo_religious'
    | 'government';

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
        value: 'individual' as BusinessType,
        label: 'Individual',
        description: 'For personal/individual accounts'
    },
    {
        value: 'sole_proprietor' as BusinessType,
        label: 'Sole Proprietor (Business Name Registration)',
        description: 'For registered business names with a single owner'
    },
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
    },
    {
        value: 'government' as BusinessType,
        label: 'Government (Federal / State / LGA)',
        description: 'For government entities and agencies'
    }
];

const DOCUMENT_TYPES = {
    individual: [
        { value: 'valid_id', label: 'Valid ID Card (Driver\'s License, Int\'l Passport, Permanent Voters Card)' },
        { value: 'proof_of_address', label: 'Proof of Address (Utility Bill, Bank Statement, Tenancy Agreement, Address Verification Report)' },
    ],
    sole_proprietor: [
        { value: 'business_registration_cert', label: 'Certificate of Registration of Business Name' },
        { value: 'cac_bn1_form', label: 'Certified True Copy of Form CAC/BN/1' },
        { value: 'primary_id', label: 'Valid Primary Identification Documents' },
        { value: 'bvn_documents', label: 'BVN of Registered Sole Proprietor(s)' },
        { value: 'proof_of_address', label: 'Proof of Business Operating Address' },
    ],
    private_limited: [
        { value: 'business_registration_cert', label: 'Certificate of Registration of Business Name' },
        { value: 'cac_bn1_form', label: 'Certified True Copy of Form CAC/BN/1' },
        { value: 'primary_id', label: 'Valid Primary Identification Documents' },
        { value: 'bvn_documents', label: 'BVN of Registered Sole Proprietor(s)' },
        { value: 'proof_of_address', label: 'Proof of Business Operating Address' },
        { value: 'partnership_resolution', label: 'Partnership Resolution (For Partnerships)' },
        { value: 'partnership_deed', label: 'Partnership Deed/Agreement (For Partnerships)' },
        { value: 'scuml_certificate', label: 'SCUML Certificate (Where Applicable)' },
    ],
    public_limited: [
        { value: 'incorporation_cert', label: 'Certificate of Incorporation' },
        { value: 'memorandum_articles', label: 'Memorandum and Articles of Association' },
        { value: 'cac7_form', label: 'Form CAC 7 (Particulars of Directors)' },
        { value: 'cac2_form', label: 'Form CAC 2 or CAC 1.1' },
        { value: 'proof_of_address', label: 'Proof of Business Operating Address' },
        { value: 'shareholders_id', label: 'Primary ID of Shareholders (5%+ ownership)' },
        { value: 'directors_bvn', label: 'BVN of All Registered Directors' },
        { value: 'scuml_certificate', label: 'SCUML Certificate' },
        { value: 'operating_license', label: 'Operating License (Where Applicable)' },
    ],
    ngo_religious: [
        { value: 'registration_cert', label: 'Certificate of Registration/Incorporation' },
        { value: 'cac_it1_form', label: 'Certified Copy of Form CAC/IT 1' },
        { value: 'resolution', label: 'Resolution or Minutes of Last Meeting' },
        { value: 'proof_of_address', label: 'Proof of Operating Address' },
        { value: 'trustees_bvn', label: 'BVN of All Registered Trustees' },
        { value: 'trustees_id', label: 'Valid Primary Identification of Trustees' },
        { value: 'scuml_certificate_ngo', label: 'SCUML Certificate for NGO' },
    ],
    government: [
        { value: 'mandate_letter', label: 'Mandate Letter Signed by Authorized Signatory' },
    ]
};

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: File | null;
    documentTitle: string;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, file, documentTitle }) => {
    if (!file) return null;

    const fileUrl = getPreviewUrl(file);
    const isPdf = file.type === 'application/pdf';
    const isImage = isImageFile(file.name);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={documentTitle || 'Document Preview'}>
            <div className="w-full py-4">
                {isImage && (
                    <div className="flex justify-center">
                        <Image
                            src={fileUrl}
                            alt={documentTitle}
                            width={500}
                            height={500}
                            className="max-w-full h-auto object-contain"
                            style={{ maxHeight: '70vh' }}
                        />
                    </div>
                )}

                {isPdf && (
                    <div className="w-full h-[70vh]">
                        <iframe
                            src={`${fileUrl}#toolbar=0`}
                            className="w-full h-full"
                            title={documentTitle}
                        />
                    </div>
                )}

                {!isImage && !isPdf && (
                    <div className="text-center py-8">
                        <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Icon
                                name={getFileIcon(file.name)}
                                className="h-10 w-10 text-gray-500"
                            />
                        </div>
                        <p className="text-lg font-medium text-gray-800 mb-2">{file.name}</p>
                        <p className="text-sm text-gray-500 mb-6">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown file type'}
                        </p>
                        <Button
                            text="Download File"
                            ariaLabel="Download document"
                            onClick={() => {
                                const a = document.createElement('a');
                                a.href = fileUrl;
                                a.download = file.name;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                            }}
                            primary
                        />
                    </div>
                )}
            </div>
        </Modal>
    );
};


const UpgradeAccountForm: React.FC<UpgradeAccountFormProps> = ({
    currentAccountType = 'starter',
    onSuccess
}) => {
    const { createKyc } = useKyc();
    const [documents, setDocuments] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // preview modal state
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [previewTitle, setPreviewTitle] = useState('');

    // Function to open the preview modal
    const handleOpenPreview = (file: File, title: string) => {
        setPreviewFile(file);
        setPreviewTitle(title);
        setPreviewModalOpen(true);
    };

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

    const validateRequiredDocuments = () => {
        // Get required document types for the selected business type
        const requiredDocTypes = DOCUMENT_TYPES[selectedBusinessType] || [];

        // Create a map of submitted document types
        const submittedDocTypes = documents
            .filter(doc => doc.documentType)
            .map(doc => doc.documentType);

        // Check if each required document type has at least one submission
        const missingDocTypes = requiredDocTypes.filter(docType =>
            !submittedDocTypes.includes(docType.value)
        );

        if (missingDocTypes.length > 0) {
            const missingDocs = missingDocTypes.map(doc => doc.label).join(', ');
            notifyError(`Missing required documents: ${missingDocs}`);
            return false;
        }

        return true;
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

        return validateRequiredDocuments();
    };

    const handleSubmitUpgrade = async (data: UpgradeFormData) => {
        if (!validateSubmission()) return;

        setIsSubmitting(true);

        try {
            // get proof_of_address document if exists
            const proofOfAddressDoc = documents.find(doc => doc.documentType === 'proof_of_address');

            const payload = {
                business_type: data.businessType,
                current_account_type: currentAccountType,
                // include proof_of_address_url if exists
                ...(proofOfAddressDoc ? { proof_of_address: proofOfAddressDoc.uploadedUrl } : {}),
                documents: documents.map(doc => ({
                    url: doc.uploadedUrl,
                    type: doc.documentType
                }))
            };

            await createKyc(payload);
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
                    <div>
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
                    <div className="bg-[#D9D9D90D] border border-[#C4C4C43D] rounded-lg p-4">
                        <div className="flex items-start">
                            <div className="text-sm">
                                <p className="font-semibold text-[#7F7F7F]">Important Information</p>
                                <ul className="text-[#7F7F7F] mt-2 space-y-1">
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
                    folderName="kyc"
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
                            Document ({documents.filter(doc => doc.documentType).length}/{documents.length} completed)
                            {/* Documents ({documents.length}) */}
                        </h4>

                        {/* Add a progress indicator */}
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-primary h-2.5 rounded-full"
                                style={{
                                    width: `${(documents.filter(doc => doc.documentType).length / documents.length) * 100}%`
                                }}
                            />
                        </div>

                        {/* Document Type Requirements Status */}
                        <div className="space-y-2 mb-4">
                            <h5 className="text-sm font-medium text-[#7f7f7f]">Required Documents Status:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {DOCUMENT_TYPES[selectedBusinessType].map(docType => {
                                    const isUploaded = documents.some(doc => doc.documentType === docType.value);
                                    return (
                                        <div key={docType.value} className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${isUploaded ? 'bg-success' : 'bg-danger'}`}></div>
                                            <span className={`text-xs ${isUploaded ? 'text-green-700' : 'text-red-700'}`}>
                                                {docType.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-4 px-2 py-1.5 bg-[#D9D9D90D] border border-[#C4C4C43D] rounded-lg">
                                    <div className="flex-1 flex items-center gap-4">
                                        <div>
                                            {isImageFile(doc.file.name) ? (
                                                <div className="relative">
                                                    <Image
                                                        src={getPreviewUrl(doc.file)}
                                                        alt={doc.title}
                                                        width={36}
                                                        height={36}
                                                        className="w-9 h-9 object-cover rounded border group-hover:opacity-80 transition-opacity"
                                                        onClick={() => handleOpenPreview(doc.file, doc.title)}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded">
                                                        <Icon name="eye" className="h-4 w-4 text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-9 h-9 bg-gray-100 rounded border flex items-center justify-center group-hover:bg-gray-200 transition-colors"
                                                    onClick={() => handleOpenPreview(doc.file, doc.title)}
                                                >
                                                    <Icon
                                                        name={getFileIcon(doc.file.name)}
                                                        className="h-5 w-5 text-gray-400 group-hover:text-gray-600"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <p className="font-medium text-sm text-[#7F7F7F]">{doc.title}</p>
                                            <p className="flex items-center gap-3 text-[10px] text-[#9F9F9F] divide-x divide-[#9F9F9F]">
                                                <span>
                                                    {(doc.file?.size / 1024 / 1024).toFixed(2)} MB
                                                </span>
                                                <button
                                                    onClick={() => handleOpenPreview(doc.file, doc.title)}
                                                    className="pl-3 hover:text-primary cursor-pointer transition-colors focus:outline-none"
                                                >
                                                    Preview
                                                </button>
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
                                            {getAvailableDocumentTypes().map(type => {
                                                const isAlreadyUploaded = documents.some(d =>
                                                    d.id !== doc.id && d.documentType === type.value
                                                );
                                                const isRequired = !documents.some(d => d.documentType === type.value);

                                                return (
                                                    <option
                                                        key={type.value}
                                                        value={type.value}
                                                        className={isRequired ? 'font-bold' : ''}
                                                    >
                                                        {type.label} {isRequired ? '(Required)' : isAlreadyUploaded ? '(Already uploaded)' : ''}
                                                    </option>
                                                );
                                            })}
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

            <PreviewModal
                isOpen={previewModalOpen}
                onClose={() => setPreviewModalOpen(false)}
                file={previewFile}
                documentTitle={previewTitle}
            />
        </div>
    );
};

export default UpgradeAccountForm;