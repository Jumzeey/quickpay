import { useFormik } from 'formik';
import { useMemo } from 'react';
import * as Yup from 'yup';
import { TransferFormValues, TransferType } from './types';

interface UseTransferFormProps {
    currentStep: number;
    selectedOptionName: TransferType | '';
    onSubmit: (values: TransferFormValues) => Promise<void>;
    initialValues?: Partial<TransferFormValues>;
}

export const useTransferForm = ({
    currentStep,
    selectedOptionName,
    onSubmit,
    initialValues = {}
}: UseTransferFormProps) => {
    const validationSchema = useMemo(() => {
        return Yup.object().shape({
            amount: Yup.string().required('Amount is required!'),
            targetAccountName: Yup.string().when([], {
                is: () => selectedOptionName === 'Cross Currency Transfer' && currentStep === 2,
                then: (schema) => schema.required('Target account name is required!'),
                otherwise: (schema) => schema.notRequired(),
            }),
            targetAccountNumber: Yup.string().when([], {
                is: () => selectedOptionName === 'Cross Currency Transfer' && currentStep === 2,
                then: (schema) => schema.required('Target account number is required!'),
                otherwise: (schema) => schema.notRequired(),
            }),
            walletId: Yup.string().when([], {
                is: () => selectedOptionName === 'Ramp Balance Transfer',
                then: (schema) => schema.required('Wallet ID is required!'),
                otherwise: (schema) => schema.notRequired(),
            }),
        });
    }, [currentStep, selectedOptionName]);

    const defaultValues: TransferFormValues = {
        bank: '',
        accountNumber: '',
        accountName: '',
        amount: '',
        walletId: '',
        targetAccountName: '',
        targetAccountNumber: '',
        ...initialValues
    };

    const formik = useFormik({
        initialValues: defaultValues,
        validationSchema,
        validateOnMount: true,
        onSubmit,
    });

    return formik;
};
