import Button from "@/components/button";
import { walletCurrencies } from "@/components/CurrencySwitcher";
import FormInput from "@/components/FormInput";
import FormSelect from "@/components/FormSelect";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import { useFormValidation } from "@/hooks/useFormValidation";
import useScreenWidth from "@/hooks/useScreenWidth";
import { addPaymentLink, PaymentLinkPayload } from "@/services/collections";
import { getSubaccountHistory } from "@/services/sub-account";
import useAuthentication from "@/stores/useAuthentication";
import useClickEvent from "@/stores/useClickEvent";
import {
  notifyError,
  notifySuccess,
  numberWithCommas,
  removeCommasFromValue,
} from "@/util/utils";
import { useEffect, useState } from "react";
import PinInput from "react-pin-input";
import * as Yup from "yup";

const TOTP_LENGTH = 6;
const RECOVERY_CODE_LENGTH = 10;

interface AddPaymentLinkProps {
  createLink?: boolean;
  fetchPaymentLinks?: () => void;
  closeModal?: () => void;
}

interface PaymentLinkState {
  subAccounts: any[];
}

type FormValues = {
  title: string;
  currency: string;
  amount: string;
  description: string;
  redirectUrl: string;
  accountType: string;
  selectedSubAccount: string;
};

const AddPaymentLink: React.FC<AddPaymentLinkProps> = ({
  createLink,
  fetchPaymentLinks,
  closeModal,
}) => {
  const { selectedItem } = useClickEvent();
  const screenWidth = useScreenWidth();
  const { totp_enabled } = useAuthentication();

  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<PaymentLinkState>({
    subAccounts: [],
  });
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<PaymentLinkPayload | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryCodeValue, setRecoveryCodeValue] = useState("");
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);

  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Payment link name is required!"),
    currency: Yup.string().required("Currency is required!"),
    amount: Yup.string().required("Amount is required!"),
    description: Yup.string().required("Description is required!"),
    redirectUrl: Yup.string()
      .notRequired()
      .test(
        "valid-url",
        "Enter a valid redirect URL!",
        (value) =>
          !value || value.trim() === "" ||
          /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/.test(value)
      ),
    accountType: Yup.string()
      .when('currency', {
        is: (currency: string) => currency?.toLowerCase() === 'usd',
        then: (schema) => schema.oneOf(['subaccount'], "USD payments require a subaccount")
          .required("Account type is required for USD payments"),
        otherwise: (schema) => schema.notRequired()
      }),
    selectedSubAccount: Yup.string()
      .when(['currency', 'accountType'], {
        is: (currency: string, accountType: string) =>
          currency?.toLowerCase() === 'usd' && accountType === 'subaccount',
        then: (schema) => schema.required("Sub-account is required for USD payments"),
        otherwise: (schema) => schema.notRequired()
      })
  });

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    watch,
    setValue,
  } = useFormValidation<FormValues>(validationSchema, {
    defaultValues: {
      title: "",
      currency: "NGN",
      amount: "",
      description: "",
      redirectUrl: "",
      accountType: "",
      selectedSubAccount: "",
    },
    mode: 'onChange',
  });

  // Initialize form values when editing existing payment link
  useEffect(() => {
    if (!createLink && selectedItem) {
      setValue("title", selectedItem.title || "");
      setValue("currency", selectedItem.currency || "NGN");
      setValue("amount", numberWithCommas(selectedItem.amount) || "");
      setValue("description", selectedItem.meta?.description || "");
      setValue("redirectUrl", selectedItem.meta?.redirect_url?.replace("https://", "") || "");
      setValue("accountType", selectedItem.account_type || "main");
      if (selectedItem.account_type === "subaccount") {
        setValue("selectedSubAccount", selectedItem.subaccount_id || "");
      }
    }
  }, [createLink, selectedItem, setValue]);

  const buildPayload = (formValues: FormValues): { payload: PaymentLinkPayload; updateStatus: boolean; id: number } => {
    const { title, currency, amount, description, redirectUrl, accountType, selectedSubAccount } = formValues;
    const payload: PaymentLinkPayload = {
      title,
      currency,
      amount: removeCommasFromValue(amount),
      description,
      account_type: accountType,
    };
    if (selectedSubAccount) payload["subaccount_id"] = selectedSubAccount;
    if (redirectUrl) payload["redirect_url"] = `https://${redirectUrl}`;
    const updateStatus = !createLink;
    const id = createLink ? 0 : Number(selectedItem?.id) || 0;
    return { payload, updateStatus, id };
  };

  const createAndUpdatePaymentLink = async (formValues: FormValues) => {
    const { payload, updateStatus, id } = buildPayload(formValues);
    if (totp_enabled) {
      setPendingPayload(payload);
      setOtpValue("");
      setRecoveryCodeValue("");
      setUseRecoveryCode(false);
      setOtpModalOpen(true);
      return;
    }
    setIsLoading(true);
    try {
      const response = await addPaymentLink(payload, updateStatus, id);
      // @ts-ignore
      notifySuccess(response.message);
      fetchPaymentLinks && (await fetchPaymentLinks());
      closeModal && closeModal();
    } catch (error: any) {
      notifyError(error?.message ?? "Failed to save payment link");
    } finally {
      setIsLoading(false);
    }
  };

  const getOtpCode = (): string => {
    return useRecoveryCode ? recoveryCodeValue.trim().toUpperCase() : otpValue;
  };

  const submitWithOtp = async () => {
    if (!pendingPayload) return;
    const code = getOtpCode();
    if (!code) return;
    const updateStatus = !createLink;
    const id = createLink ? 0 : Number(selectedItem?.id) || 0;
    setIsOtpSubmitting(true);
    try {
      const response = await addPaymentLink({ ...pendingPayload, otp: code }, updateStatus, id);
      // @ts-ignore
      notifySuccess(response.message);
      setOtpModalOpen(false);
      setPendingPayload(null);
      fetchPaymentLinks && (await fetchPaymentLinks());
      closeModal && closeModal();
    } catch (error: any) {
      notifyError(error?.message ?? "Failed to save payment link");
    } finally {
      setIsOtpSubmitting(false);
    }
  };

  const closeOtpModal = () => {
    setOtpModalOpen(false);
    setPendingPayload(null);
    setOtpValue("");
    setRecoveryCodeValue("");
    setUseRecoveryCode(false);
  };

  const formCurrency = watch("currency");
  const accountType = watch("accountType");

  useEffect(() => {
    if (accountType === "subaccount") {
      fetchSubAccounts();
    }
  }, [accountType]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setState(prev => ({ ...prev, [name]: value }));
  };

  const fetchSubAccounts = async () => {
    try {
      const response = await getSubaccountHistory();
      setState(prev => ({ ...prev, subAccounts: response.subaccounts }));
    } catch (error) {
      console.error("Failed to fetch sub-accounts:", error);
    }
  };

  const accountTypeOptions = [
    { value: "", label: "Select account type" },
    { value: "main", label: "Main" },
    { value: "subaccount", label: "Sub-account" },
  ];

  const subAccountOptions = [
    { value: "", label: "Select sub-account" },
    ...(state?.subAccounts?.map((option: any) => ({
      value: option.id,
      label: option.merchant_name,
    })) || [])
  ];

  return (
    <>
      <form onSubmit={handleSubmit(createAndUpdatePaymentLink)} className="space-y-6 mt-6 w-full">
        <FormInput
          label="Payment link name"
          id="title"
          type="text"
          htmlFor="title"
          error={errors.title?.message}
          touched={touchedFields.title}
          {...register("title")}
        />

        <FormSelect
          id="currency"
          htmlFor="currency"
          label="Select Currency"
          placeholder="Select Currency"
          options={walletCurrencies}
          error={errors.currency?.message}
          touched={touchedFields.currency}
          value={formCurrency}
          {...register("currency")}
        />

        <FormInput
          label="Amount"
          id="amount"
          type="text"
          htmlFor="amount"
          numberOnly
          error={errors.amount?.message}
          touched={touchedFields.amount}
          {...register("amount")}
        />

        <div className="description">
          <FormInput
            label="Description"
            id="description"
            type="text"
            htmlFor="description"
            error={errors.description?.message}
            touched={touchedFields.description}
            {...register("description")}
          />
        </div>

        <div className="relative">
          <FormInput
            label={
              screenWidth < 700
                ? "Redirect URL (optional)"
                : "Redirect URL (optional, e.g yourbusiness.com)"
            }
            id="redirectUrl"
            htmlFor="redirectUrl"
            error={errors.redirectUrl?.message}
            touched={touchedFields.redirectUrl}
            {...register("redirectUrl")}
          />
        </div>

        <FormSelect
          id="accountType"
          htmlFor="accountType"
          label="Account Type"
          options={accountTypeOptions}
          error={errors.accountType?.message}
          touched={touchedFields.accountType}
          value={accountType}
          {...register("accountType")}
        />

        {accountType === "subaccount" && (
          <FormSelect
            id="selectedSubAccount"
            htmlFor="selectedSubAccount"
            label="Sub-account"
            options={subAccountOptions}
            error={errors.selectedSubAccount?.message}
            touched={touchedFields.selectedSubAccount}
            value={watch("selectedSubAccount")}
            {...register("selectedSubAccount")}
          />
        )}

        <div className="flex justify-center mt-5 w-36">
          <Button
            text={isLoading ? <Loader /> : (createLink ? "Save Link" : "Update Link")}
            ariaLabel={createLink ? "Create payment link" : "Update payment link"}
            primary
            type="submit"
            disabled={isLoading}
          />
        </div>
      </form>

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
                : "Enter the 6-digit code from your authenticator app to save this payment link."}
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
                <label htmlFor="payment-link-recovery-code" className="text-sm font-medium text-[#111827] mb-1">
                  Recovery code
                </label>
                <input
                  id="payment-link-recovery-code"
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
                text={isOtpSubmitting ? <Loader /> : (createLink ? "Save Link" : "Update Link")}
                ariaLabel={createLink ? "Save payment link" : "Update payment link"}
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

export default AddPaymentLink;