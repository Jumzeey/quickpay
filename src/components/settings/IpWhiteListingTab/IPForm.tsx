import Button from "@/components/button";
import FormInput from "@/components/FormInput";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import Switch from "@/components/Switch";
import { useFormValidation } from "@/hooks/useFormValidation";
import { CreateIPWhitelistPayload, IPWhitelistEntry, UpdateIPWhitelistPayload } from "@/services/ip-whitelist";
import useIPWhitelist from "@/stores/useIPWhitelist";
import { notifyError, notifySuccess } from "@/util/utils";
import { useState } from "react";
import { Controller } from "react-hook-form";
import PinInput from "react-pin-input";
import * as Yup from "yup";

const TOTP_LENGTH = 6;
const RECOVERY_CODE_LENGTH = 10;

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
    is_active: Yup.boolean(),
});

interface IPFormProps {
    type: "add" | "edit";
    ip?: IPWhitelistEntry | null;
    onClose: () => void;
    onSuccess: () => void;
    totpRequired?: boolean;
}

type PendingAction =
    | { type: "create"; payload: CreateIPWhitelistPayload }
    | { type: "edit"; id: number; payload: UpdateIPWhitelistPayload };

const IPForm = ({ ip, type, onClose, onSuccess, totpRequired = false }: IPFormProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [otpValue, setOtpValue] = useState("");
    const [useRecoveryCode, setUseRecoveryCode] = useState(false);
    const [recoveryCodeValue, setRecoveryCodeValue] = useState("");
    const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
    const isEdit = type === "edit";
    const { addIPWhitelist, updateIPWhitelist } = useIPWhitelist();

    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useFormValidation(validationSchema, {
        defaultValues: {
            ip_address: ip?.ip_address || "",
            description: ip?.description || "",
            is_active: ip?.is_active !== undefined ? ip.is_active : true,
        },
        mode: "onChange"
    });

    const getOtpCode = (): string =>
        useRecoveryCode ? recoveryCodeValue.trim().toUpperCase() : otpValue;

    const submitWithOtp = async () => {
        if (!pendingAction || !getOtpCode()) return;
        setIsOtpSubmitting(true);
        try {
            const otp = getOtpCode();
            let result;
            if (pendingAction.type === "edit") {
                result = await updateIPWhitelist(pendingAction.id, { ...pendingAction.payload, otp });
                if (result.success) notifySuccess("IP address updated successfully");
            } else {
                result = await addIPWhitelist({ ...pendingAction.payload, otp });
                if (result.success) notifySuccess("IP address added to whitelist successfully");
            }
            if (result.success) {
                setOtpModalOpen(false);
                setPendingAction(null);
                await onSuccess();
                onClose();
            } else {
                notifyError(result.message ?? "Request failed");
            }
        } catch (error: any) {
            notifyError(error?.message ?? "Request failed");
        } finally {
            setIsOtpSubmitting(false);
        }
    };

    const closeOtpModal = () => {
        setOtpModalOpen(false);
        setPendingAction(null);
        setOtpValue("");
        setRecoveryCodeValue("");
        setUseRecoveryCode(false);
    };

    const onSubmit = async (values: any) => {
        if (isEdit && ip) {
            const updatePayload: UpdateIPWhitelistPayload = {
                description: values.description,
                is_active: values.is_active
            };
            if (totpRequired) {
                setPendingAction({ type: "edit", id: ip.id, payload: updatePayload });
                setOtpValue("");
                setRecoveryCodeValue("");
                setUseRecoveryCode(false);
                setOtpModalOpen(true);
                return;
            }
            try {
                setIsLoading(true);
                const result = await updateIPWhitelist(ip.id, updatePayload);
                if (result.success) notifySuccess("IP address updated successfully");
                await onSuccess();
                onClose();
            } catch (error: any) {
                notifyError(error?.message);
            } finally {
                setIsLoading(false);
            }
        } else {
            const createPayload: CreateIPWhitelistPayload = {
                ip_address: values.ip_address,
                description: values.description
            };
            if (totpRequired) {
                setPendingAction({ type: "create", payload: createPayload });
                setOtpValue("");
                setRecoveryCodeValue("");
                setUseRecoveryCode(false);
                setOtpModalOpen(true);
                return;
            }
            try {
                setIsLoading(true);
                const result = await addIPWhitelist(createPayload);
                if (result.success) notifySuccess("IP address added to whitelist successfully");
                await onSuccess();
                onClose();
            } catch (error: any) {
                notifyError(error?.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <>
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
                        text={isLoading ? <Loader /> : (isEdit ? "Continue" : "Whitelist")}
                        ariaLabel="Add IP"
                        type="submit"
                        disabled={isLoading}
                        primary
                    />
                </div>
            </form>

            {totpRequired && (
                <Modal
                    isOpen={otpModalOpen}
                    title={useRecoveryCode ? "Enter recovery code" : "Enter authenticator code"}
                    onClose={closeOtpModal}
                >
                    <div className="space-y-4 px-4 pb-4">
                        <p className="text-sm text-[#7F7F7F]">
                            {useRecoveryCode
                                ? "Enter one of the 10-character recovery codes you saved when you set up 2FA."
                                : "Enter the 6-digit code from your authenticator app to confirm."}
                        </p>
                        <div className="mb-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setUseRecoveryCode((prev: boolean) => !prev);
                                    setOtpValue("");
                                    setRecoveryCodeValue("");
                                }}
                                className="text-sm font-medium text-primary hover:text-blue-700"
                            >
                                {useRecoveryCode ? "Use authenticator code" : "Use a backup code"}
                            </button>
                        </div>
                        {useRecoveryCode ? (
                            <div className="flex flex-col">
                                <label htmlFor="ip-whitelist-recovery-code" className="text-sm font-medium text-[#111827] mb-1">
                                    Recovery code
                                </label>
                                <input
                                    id="ip-whitelist-recovery-code"
                                    type="text"
                                    inputMode="text"
                                    autoComplete="one-time-code"
                                    maxLength={RECOVERY_CODE_LENGTH}
                                    value={recoveryCodeValue}
                                    onChange={(e) =>
                                        setRecoveryCodeValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                                    }
                                    onKeyDown={(e) => e.key === "Enter" && submitWithOtp()}
                                    placeholder="e.g. WO1EBITAQJ"
                                    className="w-full h-11 px-3 border border-[#C4C4C43D] rounded-lg text-center font-mono text-base tracking-widest text-[#111827] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-[#111827] mb-2 block">Authenticator code</label>
                                <div className="flex justify-center">
                                    <PinInput
                                        length={TOTP_LENGTH}
                                        initialValue=""
                                        type="numeric"
                                        inputMode="number"
                                        focus
                                        onChange={(value) => setOtpValue(value)}
                                        onComplete={(value) => setOtpValue(value)}
                                        style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}
                                        inputStyle={{
                                            width: "44px",
                                            height: "50px",
                                            border: "1.5px solid #C4C4C43D",
                                            borderRadius: "5px",
                                            fontSize: "16px",
                                            color: "#111827",
                                        }}
                                        inputFocusStyle={{ border: "2px solid #2563EB", outline: "none" }}
                                        autoSelect
                                        regexCriteria={/^[0-9]*$/}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3 justify-end pt-4">
                            <Button
                                type="button"
                                text="Cancel"
                                ariaLabel="Cancel"
                                onClick={closeOtpModal}
                                className="min-w-[100px]"
                                plain
                            />
                            <Button
                                type="button"
                                text={isOtpSubmitting ? <Loader /> : (isEdit ? "Continue" : "Whitelist")}
                                ariaLabel={isEdit ? "Continue" : "Whitelist"}
                                primary
                                disabled={isOtpSubmitting || !getOtpCode()}
                                onClick={submitWithOtp}
                                className="min-w-[100px]"
                            />
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default IPForm;
