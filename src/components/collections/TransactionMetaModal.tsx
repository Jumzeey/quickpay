import { CollectionGatewayMetaResponse } from '@/components/collections/types';
import Modal from '@/components/modal';
import JsonView from '@uiw/react-json-view';
import { lightTheme } from '@uiw/react-json-view/light';
import React from 'react';

interface TransactionMetaModalProps {
    isOpen: boolean;
    onClose: () => void;
    metadata: CollectionGatewayMetaResponse | null;
}

const TransactionMetaModal: React.FC<TransactionMetaModalProps> = ({
    isOpen,
    onClose,
    metadata
}) => {
    if (!metadata) {
        return null;
    }
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Transaction Metadata"
        >
            <div className="max-h-[70vh] overflow-y-auto p-4">
                <JsonView value={metadata} style={lightTheme} />
            </div>
        </Modal>
    );
};

export default TransactionMetaModal;