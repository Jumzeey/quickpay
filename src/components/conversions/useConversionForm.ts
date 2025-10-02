import { useFormik } from 'formik';
import { useMemo } from 'react';
import * as Yup from 'yup';
import { ConversionFormValues, ConversionType } from './types';

interface UseConversionFormProps {
    currentStep: number;
    selectedOptionName: ConversionType | '';
    onSubmit: (values: ConversionFormValues) => Promise<void>;
    initialValues?: Partial<ConversionFormValues>;
}

export const useConversionForm = ({
    currentStep,
    selectedOptionName,
    onSubmit,
    initialValues = {}
}: UseConversionFormProps) => {
    const validationSchema = useMemo(() => {
        return Yup.object().shape({
            amount: Yup.string().required('Amount is required!'),
            targetAccountName: Yup.string().when([], {
                is: () => selectedOptionName === 'Cross Currency Conversion' && currentStep === 2,
                then: (schema) => schema.required('Target account name is required!'),
                otherwise: (schema) => schema.notRequired(),
            }),
            targetAccountNumber: Yup.string().when([], {
                is: () => selectedOptionName === 'Cross Currency Conversion' && currentStep === 2,
                then: (schema) => schema.required('Target account number is required!'),
                otherwise: (schema) => schema.notRequired(),
            }),
            walletId: Yup.string().when([], {
                is: () => selectedOptionName === 'Cray Balance Conversion',
                then: (schema) => schema.required('Wallet ID is required!'),
                otherwise: (schema) => schema.notRequired(),
            }),
        });
    }, [currentStep, selectedOptionName]);

    const defaultValues: ConversionFormValues = {
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
