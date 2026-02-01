import Button from "@/components/button";
import FormInput from "@/components/FormInput";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import { useFormValidation } from "@/hooks/useFormValidation";
import useAuthentication from "@/stores/useAuthentication";
import {
  get2faStatus as get2faStatusApi,
  setup2fa as setup2faApi,
  confirm2fa as confirm2faApi,
  regenerateRecoveryCodes as regenerateRecoveryCodesApi,
  disable2fa as disable2faApi,
} from "@/services/authentication";
import { notifyError, notifySuccess, passwordValidation } from "@/util/utils";
import { useCallback, useEffect, useState } from "react";
import * as Yup from "yup";
import PinInput from "react-pin-input";

type FormValues = {
  password: string;
  password_confirmation: string;
};

type TwoFaStatus = {
  email_otp_enabled: boolean;
  totp_enabled: boolean;
  has_recovery_codes: boolean;
  confirmed_at: string | null;
};

type TwoFaSetupData = {
  secret: string;
  qr_code_inline: string;
  qr_code_url: string;
};

const validationSchema = Yup.object().shape({
  password: passwordValidation,
  password_confirmation: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
});

const SecurityTab = () => {
  const { user, newPassword } = useAuthentication();
  const [isLoading, setIsLoading] = useState(false);

  const [twoFaStatus, setTwoFaStatus] = useState<TwoFaStatus | null>(null);
  const [twoFaStatusLoading, setTwoFaStatusLoading] = useState(true);
  const [twoFaStep, setTwoFaStep] = useState<null | "setup" | "confirm" | "recovery">(null);
  const [twoFaSetupData, setTwoFaSetupData] = useState<TwoFaSetupData | null>(null);
  const [twoFaTotp, setTwoFaTotp] = useState("");
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const [totpModalOpen, setTotpModalOpen] = useState(false);
  const [totpModalAction, setTotpModalAction] = useState<"disable" | "regenerate" | null>(null);
  const [totpModalCode, setTotpModalCode] = useState("");
  const [totpModalLoading, setTotpModalLoading] = useState(false);

  const fetch2faStatus = useCallback(async () => {
    try {
      setTwoFaStatusLoading(true);
      const response = await get2faStatusApi();
      setTwoFaStatus(response.data as TwoFaStatus);
    } catch {
      setTwoFaStatus(null);
    } finally {
      setTwoFaStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch2faStatus();
  }, [fetch2faStatus]);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    reset,
  } = useFormValidation(validationSchema, {
    defaultValues: {
      password: "",
      password_confirmation: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      const payload = {
        email: user?.email,
        password: values.password,
        password_confirmation: values.password_confirmation,
      };
      const response = await newPassword(payload);
      notifySuccess(response.message);
      reset();
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup2fa = async () => {
    try {
      setTwoFaLoading(true);
      const response = await setup2faApi();
      const { secret, qr_code_inline, qr_code_url } = response.data;
      setTwoFaSetupData({ secret, qr_code_inline, qr_code_url });
      setTwoFaStep("setup");
      setTwoFaTotp("");
      notifySuccess((response as { message?: string }).message ?? "Setup initiated");
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleConfirm2fa = async () => {
    if (!twoFaTotp || twoFaTotp.length !== 6) {
      notifyError("Please enter the 6-digit code from your authenticator app.");
      return;
    }
    try {
      setTwoFaLoading(true);
      const response = await confirm2faApi({ totp: twoFaTotp });
      setRecoveryCodes(response.data.recovery_codes || []);
      setTwoFaStep("recovery");
      notifySuccess((response as { message?: string }).message ?? "Two-factor authentication enabled");
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setTwoFaLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    const text = recoveryCodes.join("\n");
    navigator.clipboard.writeText(text).then(
      () => notifySuccess("Recovery codes copied to clipboard"),
      () => notifyError("Failed to copy")
    );
  };

  const reset2faFlow = () => {
    setTwoFaStep(null);
    setTwoFaSetupData(null);
    setTwoFaTotp("");
    setRecoveryCodes([]);
    fetch2faStatus();
  };

  const openTotpModal = (action: "disable" | "regenerate") => {
    setTotpModalAction(action);
    setTotpModalCode("");
    setTotpModalOpen(true);
  };

  const closeTotpModal = () => {
    setTotpModalOpen(false);
    setTotpModalAction(null);
    setTotpModalCode("");
    setTotpModalLoading(false);
  };

  const handleTotpModalConfirm = async () => {
    if (!totpModalCode || totpModalCode.length !== 6) {
      notifyError("Please enter the 6-digit code from your authenticator app.");
      return;
    }
    if (!totpModalAction) return;
    try {
      setTotpModalLoading(true);
      if (totpModalAction === "disable") {
        const response = await disable2faApi({ totp: totpModalCode });
        notifySuccess((response as { message?: string }).message ?? "Two-factor authentication disabled");
        closeTotpModal();
        await fetch2faStatus();
      } else {
        const response = await regenerateRecoveryCodesApi({ totp: totpModalCode });
        setRecoveryCodes((response as { data?: { recovery_codes?: string[] } }).data?.recovery_codes || []);
        setTwoFaStep("recovery");
        notifySuccess((response as { message?: string }).message ?? "Recovery codes regenerated");
        closeTotpModal();
      }
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setTotpModalLoading(false);
    }
  };

  const handleDisable2fa = () => openTotpModal("disable");
  const handleRegenerateRecoveryCodes = () => openTotpModal("regenerate");

  return (
    <div>
      <div className="flex flex-col space-y-4">
        {/* Change Password */}
      <div className="flex items-center border-b border-[#C4C4C452] p-4">
        <div className="text-left gap-2">
          <h3 className="text-base md:text-lg font-semibold text-[#090727]">Change Password</h3>
          <p className="text-[13px] text-[#7F7F7F] font-medium">
            We&apos;ll send a confirmation to your email address <em className="font-semibold">{user?.email}</em>
          </p>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 my-4">
            <div className="w-full md:w-1/2">
              <FormInput
                label="New Password"
                id="password"
                type="password"
                htmlFor="password"
                error={errors.password?.message}
                touched={touchedFields.password}
                {...register("password")}
              />
            </div>

            <div className="w-full md:w-1/2">
              <FormInput
                label="Confirm Password"
                id="password_confirmation"
                type="password"
                htmlFor="password_confirmation"
                error={errors.password_confirmation?.message}
                touched={touchedFields.password_confirmation}
                {...register("password_confirmation")}
              />
            </div>
          </div>

          <div className="w-[183px] mt-14">
            <Button
              className="w-full"
              text={isLoading ? <Loader /> : "Update Password"}
              ariaLabel="Update Password Button"
              disabled={isLoading}
              primary
              type="submit"
            />
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="border-t border-[#C4C4C452]">
        <div className="flex items-center border-b border-[#C4C4C452] p-4">
          <div className="text-left">
            <h3 className="text-base md:text-lg font-semibold text-[#090727]">Two-Factor Authentication</h3>
            <p className="text-[13px] text-[#7F7F7F] font-medium mt-1">
              Add an extra layer of security by using an authenticator app. You can scan the QR code or enter the secret manually.
            </p>
          </div>
        </div>

        <div className="p-4">
          {twoFaStep === null && (
            <div className="flex flex-col gap-3">
              {twoFaStatusLoading ? (
                <div className="h-10 w-[183px] rounded bg-[#E5E7EB] animate-pulse" aria-hidden />
              ) : twoFaStatus?.totp_enabled ? (
                <div className="flex flex-col items-start max-w-md">
                  <div className="flex justify-start mb-6">
                    <div className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28">
                      <svg
                        className="w-12 h-12 sm:w-14 sm:h-14"
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden
                      >
                        <path
                          d="M32 8L12 18v10c0 12.15 7.93 23.35 20 27 12.07-3.65 20-14.85 20-27V18L32 8z"
                          fill="#005BB0"
                          fillOpacity="0.2"
                          stroke="#005BB0"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M24 32l8 8 16-16"
                          stroke="#005BB0"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-[#090727] text-left mb-1.5">
                    You’re protected
                  </h4>
                  <p className="text-sm text-[#7F7F7F] font-medium text-left mb-8 max-w-[280px] leading-relaxed">
                    Authenticator app (TOTP) is enabled for your account.
                  </p>
                  <div className="flex flex-row flex-nowrap gap-3 justify-start items-center w-full">
                    <Button
                      className="!w-auto min-w-[130px] sm:min-w-[140px] h-10 px-5 rounded-lg bg-[#E5E7EB] text-[#374151] hover:bg-[#D1D5DB] transition-colors font-medium"
                      text="Disable 2FA"
                      ariaLabel="Disable 2FA"
                      onClick={handleDisable2fa}
                    />
                    {twoFaStatus.has_recovery_codes && (
                      <Button
                        className="!w-auto min-w-[130px] sm:min-w-[180px] h-10 px-5 rounded-lg font-medium"
                        text="Regenerate recovery codes"
                        ariaLabel="Regenerate recovery codes"
                        primary
                        onClick={handleRegenerateRecoveryCodes}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-[183px]">
                  <Button
                    className="w-full"
                    text={twoFaLoading ? <Loader /> : "Set up 2FA"}
                    ariaLabel="Set up 2FA"
                    disabled={twoFaLoading}
                    primary
                    onClick={handleSetup2fa}
                  />
                </div>
              )}
            </div>
          )}

          {twoFaStep === "setup" && twoFaSetupData && (
            <div className="space-y-6 max-w-md">
              <p className="text-sm text-[#7F7F7F] font-medium">
                Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) or enter the secret key manually.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-shrink-0 bg-white border border-[#C4C4C452] rounded-lg p-3">
                  {twoFaSetupData.qr_code_inline ? (
                    <img
                      src={twoFaSetupData.qr_code_inline}
                      alt="QR code for 2FA"
                      className="w-40 h-40"
                    />
                  ) : (
                    <img
                      src={twoFaSetupData.qr_code_url}
                      alt="QR code for 2FA"
                      className="w-40 h-40"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#090727] mb-1">Secret key</p>
                  <code className="block text-sm font-mono bg-[#F9FAFB] border border-[#C4C4C452] rounded px-3 py-2 text-[#090727] break-all">
                    {twoFaSetupData.secret}
                  </code>
                  <p className="text-[13px] text-[#7F7F7F] font-medium mt-4 mb-2">
                    Enter the 6-digit code from your app to confirm setup.
                  </p>
                  <div className="w-full min-w-0 [&>div]:!flex [&>div]:!flex-nowrap [&>div]:!gap-1 sm:[&>div]:!gap-2 [&>div]:!w-full [&_input]:!min-w-0 [&_input]:!flex-1 [&_input]:!max-w-[44px]">
                    <PinInput
                      key={twoFaSetupData.secret}
                      length={6}
                      initialValue=""
                      type="numeric"
                      inputMode="number"
                      onChange={(value) => setTwoFaTotp(value)}
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "nowrap",
                        width: "100%",
                      }}
                      inputStyle={{
                        width: "100%",
                        minWidth: 0,
                        height: "48px",
                        border: "1.5px solid #C4C4C43D",
                        borderRadius: "5px",
                        fontSize: "clamp(14px, 4vw, 16px)",
                        color: "#111827",
                      }}
                      inputFocusStyle={{
                        border: "2px solid #005BB0",
                        outline: "none",
                      }}
                      regexCriteria={/^[0-9]*$/}
                    />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button
                      text={twoFaLoading ? <Loader /> : "Confirm"}
                      ariaLabel="Confirm 2FA"
                      disabled={twoFaLoading || twoFaTotp.length !== 6}
                      primary
                      onClick={handleConfirm2fa}
                    />
                    <Button
                      text="Cancel"
                      ariaLabel="Cancel 2FA setup"
                      onClick={reset2faFlow}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {twoFaStep === "recovery" && recoveryCodes.length > 0 && (
            <div className="space-y-4 max-w-md">
              <p className="text-sm text-[#7F7F7F] font-medium">
                Save these recovery codes in a secure place. Each code can only be used once if you lose access to your authenticator app.
              </p>
              <div className="bg-[#F9FAFB] border border-[#C4C4C452] rounded-lg p-4">
                <ul className="grid grid-cols-2 gap-2 font-mono text-sm text-[#090727]">
                  {recoveryCodes.map((code, i) => (
                    <li key={i}>{code}</li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-3">
                <Button
                  text="Copy codes"
                  ariaLabel="Copy recovery codes"
                  primary
                  onClick={copyRecoveryCodes}
                />
                <Button
                  className="bg-[#E5E7EB] text-[#374151] hover:bg-[#D1D5DB]"
                  text="Done"
                  ariaLabel="Done"
                  onClick={reset2faFlow}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* TOTP confirmation modal - outside space-y-4 to avoid extra top margin */}
      <Modal
        isOpen={totpModalOpen}
        title="Enter your authenticator code"
        onClose={closeTotpModal}
      >
        <div className="space-y-6 pt-2">
          <p className="text-sm text-[#7F7F7F] font-medium">
            Enter the 6-digit code from your authenticator app to continue.
          </p>
          <div className="w-full min-w-[280px] [&>div]:!flex [&>div]:!flex-nowrap [&>div]:!gap-2 [&_input]:!w-[44px] [&_input]:!min-w-[44px] [&_input]:!flex-none">
            <PinInput
              key={totpModalOpen ? "open" : "closed"}
              length={6}
              initialValue=""
              type="numeric"
              inputMode="number"
              onChange={(value) => setTotpModalCode(value)}
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "nowrap",
                width: "100%",
              }}
              inputStyle={{
                width: "44px",
                minWidth: "44px",
                height: "48px",
                border: "1.5px solid #C4C4C43D",
                borderRadius: "5px",
                fontSize: "16px",
                color: "#111827",
              }}
              inputFocusStyle={{
                border: "2px solid #005BB0",
                outline: "none",
              }}
              regexCriteria={/^[0-9]*$/}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              className="!w-auto min-w-[100px] h-10 px-5 py-2.5 rounded-lg bg-[#E5E7EB] text-[#374151] hover:bg-[#D1D5DB]"
              text="Cancel"
              ariaLabel="Cancel"
              onClick={closeTotpModal}
            />
            <Button
              className="!w-auto min-w-[100px] h-10 px-5 py-2.5 rounded-lg"
              text={totpModalLoading ? <Loader /> : "Confirm"}
              ariaLabel="Confirm"
              primary
              disabled={totpModalLoading || totpModalCode.length !== 6}
              onClick={handleTotpModalConfirm}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SecurityTab;