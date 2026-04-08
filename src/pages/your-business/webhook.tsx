import Button from "@/components/button";
import CardSkeleton from "@/components/card-skeleton";
import FormInput from "@/components/FormInput";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import { Switch } from "@/components/ui/switch";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useApiResponse } from "@/hooks/useApiResponse";
import {
  generateWebhookCredentials,
  updateWebhookCredentials,
} from "@/services/webhook";
import useAuthentication from "@/stores/useAuthentication";
import { useEffect, useRef, useState, useMemo } from "react";
import { Controller, useWatch } from "react-hook-form";
import PinInput from "react-pin-input";
import * as Yup from "yup";

const TOTP_LENGTH = 6;
const RECOVERY_CODE_LENGTH = 10;

interface FormValues {
  webhook_url: string;
  enable_webhook: boolean;
}

const Webhook = () => {
  const { handleError, handleSuccess } = useApiResponse();
  const [isLoading, setIsLoading] = useState(false);
  const { totp_enabled } = useAuthentication();
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [recoveryCodeValue, setRecoveryCodeValue] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [otpModalLoading, setOtpModalLoading] = useState(false);

  // OTP is collected in the modal, not in the form — do not add otp to schema or Submit would never run
  const validationSchema = useMemo(() => {
    return Yup.object().shape({
      webhook_url: Yup.string()
        .when("enable_webhook", {
          is: true,
          then: (schema) =>
            schema
              .required("Webhook URL is required!")
              .matches(
                /^(?!https?:\/\/).*$/,
                "Please enter URL without https:// - it will be added automatically"
              ),
          otherwise: (schema) => schema.notRequired(),
        }),
      enable_webhook: Yup.boolean(),
    });
  }, []);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useFormValidation<FormValues>(validationSchema, {
    defaultValues: {
      webhook_url: "",
      enable_webhook: false,
    },
    mode: "onChange",
  });

  // Watch the enable_webhook value to control input disabled state
  const enableWebhook = useWatch({
    control,
    name: "enable_webhook",
  });

  // Watch the webhook_url value to determine if input should be disabled
  const webhookUrl = useWatch({
    control,
    name: "webhook_url",
  });

  // Determine if input should be disabled: 
  // - Disabled when toggle is off (user can't type until toggle is on)
  // - Enabled when toggle is on (user can type when toggle is on)
  const isInputDisabled = !enableWebhook;

  const saveButtonLabel = webhookUrl?.trim() ? "Update" : "Save";

  const [webhookLoading, setWebhookLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  // Single fetch when the tab is visited (Your Business or Settings); ref prevents duplicate calls
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    setWebhookLoading(true);
    generateWebhookCredentials()
      .then((data) => {
        const cleanUrl = data.webhook_url?.replace(/^https?:\/\//, "") ?? "";
        reset({
          webhook_url: cleanUrl,
          enable_webhook: data.enable_webhook ?? false,
        });
      })
      .catch((error) => handleError(error))
      .finally(() => setWebhookLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch once on mount only
  }, []);

  const submitWithPayload = async (values: FormValues, otp?: string) => {
    const webhookUrl = values.webhook_url?.trim()
      ? `https://${values.webhook_url.trim()}`
      : "";
    const payload: { webhook_url: string; enable_webhook: boolean; otp?: string } = {
      webhook_url: webhookUrl,
      enable_webhook: values.enable_webhook,
    };
    if (otp?.trim()) payload.otp = otp.trim();
    const response = await updateWebhookCredentials(payload);
    handleSuccess({ message: "Webhook details updated" });
    const cleanUrl = response.webhook_url?.replace(/^https?:\/\//, "") || "";
    reset({
      webhook_url: cleanUrl,
      enable_webhook: response.enable_webhook || false,
    });
    return response;
  };

  const onSubmit = async (values: FormValues) => {
    if (totp_enabled) {
      setPendingValues(values);
      setOtpValue("");
      setRecoveryCodeValue("");
      setUseRecoveryCode(false);
      setOtpModalOpen(true);
      return;
    }
    setIsLoading(true);
    try {
      await submitWithPayload(values);
    } catch (error: any) {
      handleError(error, "Failed to update webhook details!");
    } finally {
      setIsLoading(false);
    }
  };

  const getOtpCodeForSubmit = (): string | null => {
    if (useRecoveryCode) {
      const trimmed = recoveryCodeValue.trim().toUpperCase();
      return trimmed.length === RECOVERY_CODE_LENGTH && /^[A-Z0-9]+$/.test(trimmed) ? trimmed : null;
    }
    return otpValue.length === TOTP_LENGTH ? otpValue : null;
  };

  const onOtpModalConfirm = async () => {
    const code = getOtpCodeForSubmit();
    if (!pendingValues || !code) return;
    setOtpModalLoading(true);
    try {
      await submitWithPayload(pendingValues, code);
      setOtpModalOpen(false);
      setPendingValues(null);
      setOtpValue("");
      setRecoveryCodeValue("");
      setUseRecoveryCode(false);
    } catch (error: any) {
      handleError(error, "Failed to update webhook details!");
    } finally {
      setOtpModalLoading(false);
    }
  };

  const closeOtpModal = () => {
    setOtpModalOpen(false);
    setPendingValues(null);
    setOtpValue("");
    setRecoveryCodeValue("");
    setUseRecoveryCode(false);
  };

  return (
    <div className="mt-10 w-full sm:w-[45%]">
      {webhookLoading ? (
        <CardSkeleton />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <p className="text-[#7F7F7F] font-medium text-sm mb-4">
            Setup your custom Webhook URL
          </p>

          <Controller
            name="webhook_url"
            control={control}
            render={({ field }) => (
              <FormInput
                label="Webhook URL"
                id="webhook_url"
                type="text"
                htmlFor="webhook_url"
                error={errors.webhook_url?.message}
                touched={!!errors.webhook_url}
                disabled={isInputDisabled}
                placeholder={isInputDisabled ? "Enable webhook to enter URL" : "example.com/webhook"}
                labelLeftElement={(
                  <div className="flex items-center gap-2">
                    <Controller
                      name="enable_webhook"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            // Enabling flow (when currently disabled): if URL is already set, require OTP and persist immediately.
                            if (!field.value && checked) {
                              // If user hasn't entered a URL yet, just enable editing (do not call API).
                              if (!webhookUrl?.trim()) {
                                field.onChange(true);
                                return;
                              }

                              const values = {
                                webhook_url: webhookUrl || "",
                                enable_webhook: true,
                              };

                              if (totp_enabled) {
                                setPendingValues(values);
                                setOtpValue("");
                                setRecoveryCodeValue("");
                                setUseRecoveryCode(false);
                                setOtpModalOpen(true);
                                return;
                              }

                              setIsLoading(true);
                              submitWithPayload(values)
                                .catch((error: any) => handleError(error, "Failed to update webhook details!"))
                                .finally(() => setIsLoading(false));
                              return;
                            }

                            // Enabling/disabling requires OTP when 2FA is enabled.
                            if (field.value && !checked) {
                              const values = {
                                webhook_url: webhookUrl || "",
                                enable_webhook: false,
                              };
                              if (totp_enabled) {
                                setPendingValues(values);
                                setOtpValue("");
                                setRecoveryCodeValue("");
                                setUseRecoveryCode(false);
                                setOtpModalOpen(true);
                                return;
                              }
                              // Non-2FA flow: disable immediately via API
                              setIsLoading(true);
                              submitWithPayload(values)
                                .catch((error: any) => handleError(error, "Failed to update webhook details!"))
                                .finally(() => setIsLoading(false));
                              return;
                            }

                            field.onChange(checked);
                          }}
                        />
                      )}
                    />
                    <label htmlFor="enable_webhook" className="text-xs text-[#7F7F7F] font-medium cursor-pointer select-none">
                      Enable Webhook
                    </label>
                  </div>
                )}
                {...field}
              />
            )}
          />

          <div className="pt-2">
            <Button
              type="submit"
              text={isLoading ? <Loader /> : saveButtonLabel}
              className="w-full sm:w-[28%]"
              ariaLabel={saveButtonLabel === "Update" ? "Update webhook" : "Set webhook"}
              disabled={isLoading || !enableWebhook || !isDirty || (enableWebhook && !webhookUrl?.trim())}
              primary
            />
          </div>
        </form>
      )}

      {totp_enabled && (
        <Modal
          isOpen={otpModalOpen}
          title={useRecoveryCode ? "Enter recovery code" : "Enter authenticator code"}
          onClose={closeOtpModal}
        >
          <div className="space-y-4 px-4 pb-4">
            <p className="text-sm text-[#7F7F7F]">
              {useRecoveryCode
                ? "Enter one of the 10-character recovery codes you saved when you set up 2FA."
                : "Enter the 6-digit code from your authenticator app to save webhook settings."}
            </p>
            <div className="mb-2">
              <button
                type="button"
                onClick={() => {
                  setUseRecoveryCode((prev) => !prev);
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
                <label htmlFor="webhook-recovery-code" className="text-sm font-medium text-[#111827] mb-1">
                  Recovery code
                </label>
                <input
                  id="webhook-recovery-code"
                  type="text"
                  inputMode="text"
                  autoComplete="one-time-code"
                  maxLength={RECOVERY_CODE_LENGTH}
                  value={recoveryCodeValue}
                  onChange={(e) =>
                    setRecoveryCodeValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                  }
                  onKeyDown={(e) => e.key === "Enter" && onOtpModalConfirm()}
                  placeholder="e.g. WO1EBITAQJ"
                  className="w-full h-11 px-3 border border-[#C4C4C43D] rounded-lg text-center font-mono text-base tracking-widest text-[#111827] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            ) : (
              <div className="flex flex-col">
                <label className="text-sm font-medium text-[#111827] mb-2 block">
                  Authenticator code
                </label>
                <div className="flex justify-center">
                  <PinInput
                    length={TOTP_LENGTH}
                    initialValue=""
                    type="numeric"
                    inputMode="number"
                    focus
                    onChange={(value) => setOtpValue(value)}
                    onComplete={(value) => setOtpValue(value)}
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                    inputStyle={{
                      width: "44px",
                      height: "50px",
                      border: "1.5px solid #C4C4C43D",
                      borderRadius: "5px",
                      fontSize: "16px",
                      color: "#111827",
                    }}
                    inputFocusStyle={{
                      border: "2px solid #2563EB",
                      outline: "none",
                    }}
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
                text={otpModalLoading ? <Loader /> : (pendingValues?.webhook_url?.trim() ? "Update" : "Save")}
                ariaLabel={pendingValues?.webhook_url?.trim() ? "Update webhook" : "Save webhook"}
                primary
                disabled={otpModalLoading || !getOtpCodeForSubmit()}
                onClick={onOtpModalConfirm}
                className="min-w-[100px]"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Webhook;
