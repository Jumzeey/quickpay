import ActionButton from '@/components/action-button';
import Icon from '@/components/icon';
import Loader from '@/components/loader';
import Modal from '@/components/modal';
import { notifySuccess } from '@/util/utils';
import React, { useState } from 'react';

interface DeleteSubAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeSubAccount: any;
    onSuccess: () => void;
    deactivateSubAccount: (payload: { id: number }) => Promise<any>;
}

const DeleteSubAccountModal: React.FC<DeleteSubAccountModalProps> = ({
    isOpen,
    onClose,
    activeSubAccount,
    onSuccess,
    deactivateSubAccount,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDelete = async () => {
        if (!activeSubAccount?.id) return;

        setIsSubmitting(true);
        try {
            const payload = { id: activeSubAccount.id };
            await deactivateSubAccount(payload);
            notifySuccess('Subaccount deleted successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error deactivating subaccount:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete Sub Account">
            <div className="mt-5">
                <div className="space-y-5">
                    <div className="flex justify-center">
                        <Icon name="delete" color="#EB5757" width="94" height="106" />
                    </div>

                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Are you sure?</h2>
                        <p className="text-sm text-gray-600">
                            You`re about to deactivate the sub account <span className="font-medium text-[#005BB0]">{activeSubAccount?.merchant_name}</span>.
                            This action cannot be undone.
                        </p>
                    </div>

                    <div className="border-t border-[#C4C4C43D] pt-5">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-black font-semibold">Merchant ID</p>
                            <p className="text-sm text-gray-700">{activeSubAccount?.id || 'N/A'}</p>
                        </div>

                        <div className="flex justify-between items-center mt-3">
                            <p className="text-sm text-black font-semibold">Merchant Name</p>
                            <p className="text-sm text-gray-700">{activeSubAccount?.merchant_name || 'N/A'}</p>
                        </div>

                        <div className="flex justify-between items-center mt-3">
                            <p className="text-sm text-black font-semibold">Email</p>
                            <p className="text-sm text-gray-700">{activeSubAccount?.email || 'N/A'}</p>
                        </div>

                        <div className="flex justify-between items-center mt-3">
                            <p className="text-sm text-black font-semibold">Current Status</p>
                            <p className={`text-sm ${activeSubAccount?.mode === 'live' ? 'text-green-600' : 'text-yellow-600'}`}>
                                {activeSubAccount?.mode === 'live' ? 'Live' : 'Test'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 justify-center pt-3">
                        <ActionButton
                            className="font-medium justify-center bg-white border border-[#C4C4C43D] text-gray-700 mt-5 text-xs p-2 rounded w-1/2"
                            text="Cancel"
                            ariaLabel="Cancel"
                            onClick={onClose}
                            type="button"
                        />
                        <ActionButton
                            className="font-medium justify-center text-white bg-danger mt-5 text-xs p-2 rounded w-1/2"
                            text={isSubmitting ? <Loader /> : "Delete"}
                            ariaLabel="Delete Sub Account"
                            disabled={isSubmitting}
                            type="button"
                            onClick={handleDelete}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteSubAccountModal;