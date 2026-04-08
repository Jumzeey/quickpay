import Button from '@/components/button';
import FormSelect from '@/components/FormSelect';
import Icon from '@/components/icon';
import Loader from '@/components/loader';
import Modal from '@/components/modal';
import UploadComponent from '@/components/upload-component';
import { useFormValidation } from '@/hooks/useFormValidation';
import useKyc from '@/stores/useKyc';
import { getFileIcon, getPreviewUrl, isImageFile, notifyError, notifyInfo, notifySuccess } from '@/util/utils';
import Image from "next/image";
import React, { useState, useRef, useEffect } from 'react';
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
    /** URL after upload (S3 or utility API). Used for preview so the document loads reliably. */
    uploadedUrl?: string;
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
    /** When set, preview loads from this URL (e.g. S3) instead of the file blob. Use for uploaded documents so PDF/image loads reliably. */
    documentUrl?: string | null;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, file, documentTitle, documentUrl }) => {
    const hasUrl = Boolean(documentUrl?.trim());
    const hasFile = Boolean(file);
    if (!hasFile && !hasUrl) return null;

    const displayUrl = hasUrl ? documentUrl! : (hasFile ? getPreviewUrl(file!) : null);
    const fileName = file?.name ?? documentTitle;
    const isPdf = hasFile
        ? file!.type === 'application/pdf'
        : /\.pdf(\?|$)/i.test(documentUrl ?? '') || fileName.toLowerCase().endsWith('.pdf');
    const isImage = hasFile ? isImageFile(file!.name) : /\.(jpe?g|png|gif|webp)(\?|$)/i.test(documentUrl ?? '') || /\.(jpe?g|png|gif|webp)$/i.test(fileName);

    if (!displayUrl) return null;

    const displayTitle = documentTitle || 'Document Preview';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={displayTitle}>
            <div className="w-full py-4 min-w-0">
                {isImage && (
                    <div className="flex justify-center">
                        <Image
                            src={displayUrl}
                            alt={documentTitle}
                            width={500}
                            height={500}
                            className="max-w-full h-auto object-contain"
                            style={{ maxHeight: '70vh' }}
                            unoptimized={hasUrl}
                        />
                    </div>
                )}

                {isPdf && (
                    <div className="w-full flex flex-col gap-2">
                        <a
                            href={displayUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary font-medium hover:underline"
                        >
                            Open in new tab
                        </a>
                    <div className="w-full h-[70vh]">
                        <iframe
                                src={`${displayUrl}#toolbar=0`}
                            className="w-full h-full"
                            title={documentTitle}
                        />
                        </div>
                    </div>
                )}

                {!isImage && !isPdf && (
                    <div className="text-center py-8 min-w-0 overflow-hidden">
                        <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Icon
                                name={getFileIcon(fileName)}
                                className="h-10 w-10 text-gray-500"
                            />
                        </div>
                        <p className="text-lg font-medium text-gray-800 mb-2 truncate px-4" title={fileName}>{fileName}</p>
                        <p className="text-sm text-gray-500 mb-6">
                            {hasFile && file!.size != null ? `${(file!.size / 1024 / 1024).toFixed(2)} MB • ${file!.type || 'Unknown'}` : 'Uploaded document'}
                        </p>
                        <Button
                            text="Download File"
                            ariaLabel="Download document"
                            onClick={() => {
                                const a = document.createElement('a');
                                a.href = displayUrl;
                                a.download = fileName;
                                a.target = '_blank';
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
    const [previewDocumentUrl, setPreviewDocumentUrl] = useState<string | null>(null);

    // Document type dropdown (CurrencySwitcher-style): which row's dropdown is open
    const [openDocDropdownId, setOpenDocDropdownId] = useState<string | null>(null);
    const openDropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!openDocDropdownId) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (openDropdownRef.current && !openDropdownRef.current.contains(e.target as Node)) {
                setOpenDocDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDocDropdownId]);

    // Function to open the preview modal. Prefer documentUrl when present (uploaded file) so PDF/image loads reliably.
    const handleOpenPreview = (file: File | null, title: string, documentUrl?: string | null) => {
        setPreviewFile(file ?? null);
        setPreviewTitle(title);
        setPreviewDocumentUrl(documentUrl ?? null);
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
    const previousBusinessTypeRef = useRef<BusinessType | ''>('');

    // UX: if user changes business type after uploading docs, reset docs (required docs change)
    useEffect(() => {
        const prev = previousBusinessTypeRef.current;
        if (prev && selectedBusinessType && prev !== selectedBusinessType && documents.length > 0) {
            setDocuments([]);
            notifyInfo('Business type changed. Please upload documents for the newly selected business type.');
        }
        previousBusinessTypeRef.current = selectedBusinessType || '';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBusinessType]);

    const handleDocumentTypeChange = (documentId: string, documentType: string) => {
        setDocuments(prev =>
            prev.map(doc =>
                doc.id === documentId
                    ? { ...doc, documentType }
                    : doc
            )
        );
    };

    const handleRemoveDocument = (documentId: string) => {
        setOpenDocDropdownId(prev => (prev === documentId ? null : prev));
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    };

    const getAvailableDocumentTypes = () => {
        if (!selectedBusinessType) return [];
        return DOCUMENT_TYPES[selectedBusinessType] || [];
    };

    /** Number of required document types for the selected business type (used for max uploads). */
    const requiredDocumentCount = selectedBusinessType
        ? (DOCUMENT_TYPES[selectedBusinessType]?.length ?? 0)
        : 0;

    /** True only when every required document type has at least one uploaded file with that type assigned. */
    const allRequiredDocumentsUploaded = (): boolean => {
        if (!selectedBusinessType || requiredDocumentCount === 0) return false;
        const required = DOCUMENT_TYPES[selectedBusinessType] || [];
        const submittedTypes = documents
            .filter(doc => doc.documentType)
            .map(doc => doc.documentType);
        return required.every(rt => submittedTypes.includes(rt.value));
    };

    /** Number of required types that have at least one document assigned (for progress/helper text). */
    const requiredTypesCoveredCount = ((): number => {
        if (!selectedBusinessType) return 0;
        const required = DOCUMENT_TYPES[selectedBusinessType] || [];
        const submittedTypes = documents.filter(doc => doc.documentType).map(doc => doc.documentType);
        return required.filter(rt => submittedTypes.includes(rt.value)).length;
    })();

    /** Upload is disabled when no business type, or when max documents already uploaded (never when 0 docs and room for more). */
    const atUploadLimit = requiredDocumentCount > 0 && documents.length >= requiredDocumentCount;
    const uploadDisabled = !selectedBusinessType || atUploadLimit;

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
        <div className="w-full mt-8">
            {/* Stepper */}
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-bold ${selectedBusinessType ? "bg-[#E6F4EA] text-[#22A447]" : "bg-[#005BB01A] text-[#005BB0]"}`}>
                        Step 1
                    </span>
                    <p className="text-sm font-semibold text-[#090727]">Select business type</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-bold ${selectedBusinessType ? "bg-[#005BB01A] text-[#005BB0]" : "bg-[#EFEFEF] text-[#7F7F7F]"}`}>
                        Step 2
                    </span>
                    <p className={`text-sm font-semibold ${selectedBusinessType ? "text-[#090727]" : "text-[#7F7F7F]"}`}>Upload required documents</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 justify-start w-full">
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
                    <div className="bg-white border border-[#C4C4C43D] rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-[#090727]">Required documents</h3>
                        <p className="mt-1 text-xs text-[#7F7F7F]">Upload at least one file for each required document type.</p>
                        <ul className="mt-3 list-disc list-inside space-y-2">
                            {DOCUMENT_TYPES[selectedBusinessType].map(doc => (
                                <li key={doc.value} className="text-sm text-[#7F7F7F]">
                                    {doc.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="bg-[#005BB00D] border border-[#005BB033] rounded-lg p-4">
                        <p className="text-sm font-semibold text-[#090727]">Start here</p>
                        <p className="mt-1 text-sm text-[#7F7F7F]">
                            Select a business type first to see the required documents and unlock uploads.
                        </p>
                        <div className="mt-3 bg-white border border-[#C4C4C43D] rounded-md p-3">
                            <p className="text-xs font-semibold text-[#7F7F7F]">Important</p>
                            <ul className="text-[#7F7F7F] mt-2 space-y-1 text-xs">
                                <li>• Review process may take 3-5 business days</li>
                                    <li>• Ensure all documents are clear and legible</li>
                                </ul>
                        </div>
                    </div>
                )}
            </div>

            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-[#C4C4C43D] rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-[#090727]">Upload required documents</h3>
                            <p className="mt-1 text-xs text-[#7F7F7F]">
                                {requiredDocumentCount
                                    ? `Upload ${requiredDocumentCount} document${requiredDocumentCount === 1 ? '' : 's'} (one per required type). JPG, PNG or PDF (max. 10MB each).`
                                    : 'JPG, PNG or PDF files (max. 10MB each).'}
                            </p>
                        </div>
                        {!selectedBusinessType ? (
                            <span className="inline-flex h-7 items-center rounded-full px-3 text-xs font-bold bg-[#EFEFEF] text-[#7F7F7F]">
                                Locked
                            </span>
                        ) : atUploadLimit ? (
                            <span className="inline-flex h-7 items-center rounded-full px-3 text-xs font-bold bg-[#E6F4EA] text-[#22A447]">
                                {requiredDocumentCount}/{requiredDocumentCount} uploaded
                            </span>
                        ) : null}
                    </div>

                    <div className="relative mt-4">
                <UploadComponent
                    className="h-auto"
                    name="upgrade_documents"
                            text="Upload"
                    folderName="kyc"
                    multiple
                    showPreview
                    documents={documents}
                    setDocuments={setDocuments}
                            maxFiles={requiredDocumentCount || 1}
                    useS3WhenEnabled={true}
                            disabled={uploadDisabled}
                            disabledHint={
                                !selectedBusinessType
                                    ? "Select a business type to enable uploads."
                                    : atUploadLimit
                                        ? `Maximum (${requiredDocumentCount}) documents uploaded. Assign each to a required type below.`
                                        : undefined
                            }
                        />

                        {!selectedBusinessType ? (
                            <div className="absolute inset-0 rounded-lg flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                                <div className="max-w-md px-4 text-center">
                                    <p className="text-sm font-semibold text-[#090727]">Select business type to continue</p>
                                    <p className="mt-1 text-xs text-[#7F7F7F]">
                                        You’ll see the exact list of required documents after selecting a type.
                                    </p>
                                </div>
                            </div>
                        ) : atUploadLimit ? (
                            <div className="absolute inset-0 rounded-lg flex items-center justify-center bg-white/80 backdrop-blur-[1px]">
                                <div className="max-w-md px-4 text-center">
                                    <p className="text-sm font-semibold text-[#090727]">Maximum documents uploaded</p>
                                    <p className="mt-1 text-xs text-[#7F7F7F]">
                                        Assign each document to a required type below. Submit when every required type has one document.
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Document Type Selection - Separate from Upload Component */}
                {documents.length > 0 && selectedBusinessType && (
                    <div className="mt-6 space-y-4">
                        <h4 className="text-sm font-medium text-[#7f7f7f]">
                            Required types: {requiredTypesCoveredCount}/{requiredDocumentCount} covered
                        </h4>

                        {/* Add a progress indicator */}
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-primary h-2.5 rounded-full transition-all"
                                style={{
                                    width: `${requiredDocumentCount ? (requiredTypesCoveredCount / requiredDocumentCount) * 100 : 0}%`
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

                        <div className="space-y-3 pb-6">
                            {documents.map((doc) => {
                                const previewSrc = doc.uploadedUrl || (doc.file ? getPreviewUrl(doc.file) : null);
                                const sizeLabel = doc.file?.size != null && doc.file.size > 0
                                    ? `${(doc.file.size / 1024 / 1024).toFixed(2)} MB`
                                    : (doc.uploadedUrl ? 'Uploaded' : '0.00 MB');
                                const selectedLabel = getAvailableDocumentTypes().find(t => t.value === doc.documentType)?.label;
                                return (
                                <div key={doc.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 px-3 py-3 sm:px-2 sm:py-1.5 bg-[#D9D9D90D] border border-[#C4C4C43D] rounded-lg">
                                    <div className="flex-1 flex items-center gap-3 sm:gap-4 min-w-0">
                                        <div className="flex-shrink-0">
                                            {isImageFile(doc.file?.name ?? '') && previewSrc ? (
                                                <div className="relative cursor-pointer">
                                                    <Image
                                                        src={previewSrc}
                                                        alt={doc.title}
                                                        width={36}
                                                        height={36}
                                                        className="w-9 h-9 object-cover rounded border group-hover:opacity-80 transition-opacity"
                                                        unoptimized={Boolean(doc.uploadedUrl)}
                                                        onClick={() => handleOpenPreview(doc.file ?? null, doc.title, doc.uploadedUrl)}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded">
                                                        <Icon name="eye" className="h-4 w-4 text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-9 h-9 bg-gray-100 rounded border flex items-center justify-center group-hover:bg-gray-200 transition-colors cursor-pointer"
                                                    onClick={() => handleOpenPreview(doc.file ?? null, doc.title, doc.uploadedUrl)}
                                                >
                                                    <Icon
                                                        name={getFileIcon(doc.file?.name ?? doc.title)}
                                                        className="h-5 w-5 text-gray-400 group-hover:text-gray-600"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex flex-col sm:flex-row sm:items-end sm:gap-2 gap-0.5">
                                            <p className="font-medium text-sm text-[#7F7F7F] truncate">{doc.title}</p>
                                            <p className="flex items-center gap-3 text-[10px] text-[#9F9F9F] divide-x divide-[#9F9F9F]">
                                                <span>{sizeLabel}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenPreview(doc.file ?? null, doc.title, doc.uploadedUrl)}
                                                    className="pl-3 hover:text-primary cursor-pointer transition-colors focus:outline-none"
                                                >
                                                    Preview
                                                </button>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-shrink-0 items-center">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveDocument(doc.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FFF5F5] hover:bg-[#FFEDEE] border border-[#FECACA] text-[#B91C1C] font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#FD2727]/30"
                                        aria-label="Remove document"
                                    >
                                        <Icon name="delete" className="h-4 w-4" color="#B91C1C" />
                                        <span>Remove</span>
                                    </button>
                                    </div>
                                    <div
                                        className="w-full sm:w-56 md:w-64 flex-shrink-0 relative order-last sm:order-none"
                                        ref={openDocDropdownId === doc.id ? openDropdownRef : null}
                                    >
                                        <button
                                            type="button"
                                            className="flex justify-between items-center w-full min-h-12 rounded px-4 py-2.5 bg-[#005BB01A] text-[#005BB0] font-bold text-sm text-left"
                                            onClick={() => setOpenDocDropdownId(prev => prev === doc.id ? null : doc.id)}
                                        >
                                            <span className="truncate pr-2">
                                                {selectedLabel ?? 'Select document type'}
                                            </span>
                                            <Icon name="caretDown" className="flex-shrink-0" />
                                        </button>
                                        {openDocDropdownId === doc.id && (
                                            <div className="absolute z-50 bottom-full mb-2 left-0 right-0 w-full min-w-0 max-w-[calc(100vw-1.5rem)] bg-white text-black rounded-lg border border-gray-200 shadow-lg sm:bottom-auto sm:mb-0 sm:mt-2 sm:left-auto sm:right-0 sm:w-[min(100%,320px)]">
                                                <ul className="max-h-56 overflow-y-auto py-1">
                                                    {getAvailableDocumentTypes()
                                                        .filter(type => {
                                                            const assignedToOther = documents.some(d =>
                                                    d.id !== doc.id && d.documentType === type.value
                                                );
                                                            return !assignedToOther;
                                                        })
                                                        .map(type => {
                                                const isRequired = !documents.some(d => d.documentType === type.value);
                                                            const labelSuffix = isRequired ? ' (Required)' : '';
                                                            const isSelected = doc.documentType === type.value;
                                                return (
                                                                <li
                                                        key={type.value}
                                                                    onClick={() => {
                                                                        handleDocumentTypeChange(doc.id, type.value);
                                                                        setOpenDocDropdownId(null);
                                                                    }}
                                                                    className={`px-4 py-2.5 text-sm font-medium cursor-pointer hover:bg-[#005BB01A] whitespace-normal break-words ${isSelected ? 'bg-[#005BB00D]' : ''}`}
                                                                >
                                                                    {type.label}{labelSuffix}
                                                                </li>
                                                );
                                            })}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                            })}
                        </div>
                    </div>
                )}
            </div>

            </div>

            <div className="mt-6 flex justify-end">
                <div className="w-full lg:w-[420px]">
                <Button
                        text={isSubmitting ? <Loader /> : "Submit for review"}
                    ariaLabel="Submit business account upgrade request"
                        disabled={isSubmitting || !selectedBusinessType || !allRequiredDocumentsUploaded()}
                    onClick={handleSubmit(handleSubmitUpgrade)}
                    primary
                    type="submit"
                />
                    {!selectedBusinessType ? (
                        <p className="mt-2 text-xs text-[#7F7F7F]">
                            Select a business type to enable uploads and submission.
                        </p>
                    ) : !allRequiredDocumentsUploaded() ? (
                        <p className="mt-2 text-xs text-[#7F7F7F]">
                            Assign a document to each required type ({requiredTypesCoveredCount}/{requiredDocumentCount} covered). Each type needs exactly one document.
                        </p>
                    ) : null}
                </div>
            </div>

            <PreviewModal
                isOpen={previewModalOpen}
                onClose={() => {
                    setPreviewModalOpen(false);
                    setPreviewDocumentUrl(null);
                }}
                file={previewFile}
                documentTitle={previewTitle}
                documentUrl={previewDocumentUrl}
            />
        </div>
    );
};

export default UpgradeAccountForm;