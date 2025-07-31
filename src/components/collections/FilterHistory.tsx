import Button from "@/components/button";
import FormInput from "@/components/FormInput";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import { notifyError } from "@/util/utils";
import React, { useMemo, useState } from "react";
import * as Yup from 'yup';
import { useFormValidation } from "@/hooks/useFormValidation";

type FilterFormValues = {
    startDate: string;
    endDate: string;
    status: string;
}

type FilterState = {
    isLoading: boolean;
    isSubmitting: boolean;
}

type useFilterHistoryProps = {
    onSubmit: (values: FilterFormValues) => Promise<void>;
    initialValues?: Partial<FilterFormValues>;
}

type FilterHistoryProps = {
    isModalOpen: boolean;
    closeModal: () => void;
    setFilter: Function;
}

export const useFilterHistory = ({
    onSubmit,
    initialValues = {}
}: useFilterHistoryProps) => {
    const validationSchema = useMemo(() => {
        return Yup.object().shape({
            startDate: Yup.string().required('Start date is required!'),
            endDate: Yup.string().required('End date is required!'),
            status: Yup.string().optional(),
        });
    }, []);

    const defaultValues: FilterFormValues = {
        startDate: '',
        endDate: '',
        status: 'all',
        ...initialValues
    };

    return useFormValidation<FilterFormValues>(validationSchema, {
        defaultValues,
        mode: 'onChange'
    });
};

const FilterHistory: React.FC<FilterHistoryProps> = ({
    isModalOpen,
    closeModal,
    setFilter,
}) => {
    const [state, setState] = useState<FilterState>({
        isLoading: false,
        isSubmitting: false,
    });

    const handleFormSubmit = async (values: FilterFormValues) => {
        setState((prev) => ({ ...prev, isSubmitting: true }));

        try {
            // Convert empty status to 'all' if needed
            const filterValues = {
                ...values,
                status: values.status || 'all'
            };
            
            setFilter(filterValues);
            closeModal();
        } catch (error: any) {
            notifyError(error.message);
        } finally {
            setState((prev) => ({ ...prev, isSubmitting: false }));
        }
    };

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, touchedFields },
        reset,
        watch
    } = useFilterHistory({
        onSubmit: handleFormSubmit,
    });

    // Watch the status value to control radio button selection
    const statusValue = watch('status');

    const closeModalAndReset = () => {
        setState((prev) => ({
            ...prev,
            isLoading: false,
            isSubmitting: false,
        }));
        reset();
        closeModal();
    };

    return (
        <Modal
            isOpen={isModalOpen}
            className="w-[440px]"
            onClose={closeModalAndReset}
            title="Filter Collection History"
        >
            <div className="mt-5">
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    <div>
                        <h4 className="mb-1 text-black dark:text-white font-semibold text-sm">
                            Filter By Status:
                        </h4>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 text-sm font-medium text-[#7F7F7F] dark:text-gray-300 cursor-pointer">
                                <input 
                                    type="radio" 
                                    value="all"
                                    className="size-4" 
                                    {...register("status")}
                                    defaultChecked={statusValue === 'all'}
                                />
                                All Transactions
                            </label>
                            <label className="flex items-center gap-2 text-sm font-medium text-[#7F7F7F] dark:text-gray-300 cursor-pointer">
                                <input 
                                    type="radio" 
                                    value="successful"
                                    className="size-4" 
                                    {...register("status")}
                                />
                                Successful
                            </label>
                            <label className="flex items-center gap-2 text-sm font-medium text-[#7F7F7F] dark:text-gray-300 cursor-pointer">
                                <input 
                                    type="radio" 
                                    value="pending"
                                    className="size-4" 
                                    {...register("status")}
                                />
                                Pending
                            </label>
                        </div>
                    </div>

                    <FormInput
                        label="Start Date"
                        id="startDate"
                        type="date"
                        htmlFor="startDate"
                        error={errors.startDate?.message}
                        touched={touchedFields.startDate}
                        {...register("startDate")}
                    />

                    <FormInput
                        label="End Date"
                        id="endDate"
                        type="date"
                        htmlFor="endDate"
                        error={errors.endDate?.message}
                        touched={touchedFields.endDate}
                        {...register("endDate")}
                    />

                    <div className="w-[140px] pt-1">
                        <Button
                            className="openSansLight text-white mt-5 text-xs p-2 rounded w-full"
                            text={state.isSubmitting ? <Loader /> : "Apply Filter"}
                            ariaLabel="Apply filter"
                            disabled={state.isSubmitting || state.isLoading}
                            primary
                            type="submit"
                        />
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default FilterHistory;