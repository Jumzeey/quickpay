import Button from "@/components/button";
import FormInput from "@/components/FormInput";
import Switch from "@/components/Switch";
import { useFormValidation } from "@/hooks/useFormValidation";
import { CreateIPWhitelistPayload, IPWhitelistEntry, UpdateIPWhitelistPayload } from "@/services/ip-whitelist";
import useIPWhitelist from "@/stores/useIPWhitelist";
import { notifyError, notifySuccess } from "@/util/utils";
import { useState } from "react";
import { Controller } from "react-hook-form";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
    ip_address: Yup.string()
        .required("IP address is required")
        .matches(
            /^(\d{1,3}\.){3}\d{1,3}$/,
            "Enter a valid IP address"
        ),
    description: Yup.string()
        .required("Description is required")
        .max(200, "Description must be less than 200 characters"),
    is_active: Yup.boolean()
});

interface IPFormProps {
    type: "add" | "edit";
    ip?: IPWhitelistEntry | null;
    onClose: () => void;
    onSuccess: () => void;
}

const IPForm = ({ ip, type, onClose, onSuccess }: IPFormProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const isEdit = type === "edit";
    const { addIPWhitelist, updateIPWhitelist } = useIPWhitelist();

    const {
        control,
        handleSubmit,
        formState: { errors, isValid }
    } = useFormValidation(validationSchema, {
        defaultValues: {
            ip_address: ip?.ip_address || "",
            description: ip?.description || "",
            is_active: ip?.is_active !== undefined ? ip.is_active : true
        },
        mode: "onChange"
    });

    const onSubmit = async (values: any) => {
        try {
            setIsLoading(true);

            if (isEdit && ip) {
                // Update existing IP
                const updatePayload: UpdateIPWhitelistPayload = {
                    description: values.description,
                    is_active: values.is_active
                };

                const result = await updateIPWhitelist(ip.id, updatePayload);
                if (result.success) {
                    notifySuccess("IP address updated successfully");
                }
            } else {
                // Create new IP
                const createPayload: CreateIPWhitelistPayload = {
                    ip_address: values.ip_address,
                    description: values.description
                };

                const result = await addIPWhitelist(createPayload);
                if (result.success) {
                    notifySuccess("IP address added to whitelist successfully");
                }
            }

            await onSuccess();
            onClose();
        } catch (error: any) {
            notifyError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    console.log({ isLoading })

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <Controller
                name="ip_address"
                control={control}
                render={({ field }) => (
                    <FormInput
                        label="IP Address"
                        id="ip_address"
                        type="text"
                        htmlFor="ip_address"
                        error={errors.ip_address?.message}
                        touched={!!errors.ip_address}
                        disabled={isEdit}
                        {...field}
                    />
                )}
            />

            <Controller
                name="description"
                control={control}
                render={({ field }) => (
                    <FormInput
                        label="Description"
                        id="description"
                        type="text"
                        htmlFor="description"
                        error={errors.description?.message}
                        touched={!!errors.description}
                        {...field}
                    />
                )}
            />

            {isEdit && (
                <div className="flex items-center space-x-2">
                    <Controller
                        name="is_active"
                        control={control}
                        render={({ field }) => (
                            <Switch
                                id="is_active"
                                enabled={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                            />
                        )}
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-primary cursor-pointer">
                        {ip?.is_active ? 'Deactivate' : 'Activate'} IP Address
                    </label>
                </div>
            )}

            <div className="w-[24%] pt-5">
                <Button
                    text="Whitelist"
                    ariaLabel="Add IP"
                    type="submit"
                    disabled={isLoading}
                    primary
                />
            </div>
        </form>
    );
};

export default IPForm;
