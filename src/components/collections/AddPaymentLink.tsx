import Button from "@/components/button";
import FormInput from "@/components/FormInput";
import FormSelect from "@/components/FormSelect";
import { useFormValidation } from "@/hooks/useFormValidation";
import useScreenWidth from "@/hooks/useScreenWidth";
import { addPaymentLink, PaymentLinkPayload } from "@/services/collections";
import { getSubaccountHistory } from "@/services/sub-account";
import useClickEvent from "@/stores/useClickEvent";
import {
  notifyError,
  notifySuccess,
  numberWithCommas,
  removeCommasFromValue,
} from "@/util/utils";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import Loader from "../loader";

interface AddPaymentLinkProps {
  createLink?: boolean;
  fetchPaymentLinks?: () => void;
  closeModal?: () => void;
}

interface PaymentLinkState {
  accountType: string;
  selectedSubAccount: string;
  subAccounts: any[];
}

type FormValues = {
  title: string;
  amount: string;
  description: string;
  redirectUrl: string;
};

const AddPaymentLink: React.FC<AddPaymentLinkProps> = ({
  createLink,
  fetchPaymentLinks,
  closeModal,
}) => {
  const router = useRouter();
  const { selectedItem } = useClickEvent();
  const screenWidth = useScreenWidth();

  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<PaymentLinkState>({
    accountType: "",
    selectedSubAccount: "",
    subAccounts: [],
  });

  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Payment link name is required!"),
    amount: Yup.string().required("Amount is required!"),
    description: Yup.string().required("Description is required!"),
    redirectUrl: Yup.string()
      .notRequired()
      .matches(
        /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
        "Enter a valid redirect URL!"
      ),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    reset,
    setValue,
    watch
  } = useFormValidation<FormValues>(validationSchema, {
    defaultValues: {
      title: "",
      amount: "",
      description: "",
      redirectUrl: "",
    },
  });

  // Initialize form values when editing existing payment link
  useEffect(() => {
    if (!createLink && selectedItem) {
      setValue("title", selectedItem.title || "");
      setValue("amount", numberWithCommas(selectedItem.amount) || "");
      setValue("description", selectedItem.meta?.description || "");
      setValue("redirectUrl", selectedItem.meta?.redirect_url?.replace("https://", "") || "");
    }
  }, [createLink, selectedItem, setValue]);

  const createAndUpdatePaymentLink = async (formValues: FormValues) => {
    setIsLoading(true);
    let updateStatus;
    let id;

    const { title, amount, description, redirectUrl } = formValues;

    const payload: PaymentLinkPayload = {
      title,
      amount: removeCommasFromValue(amount),
      description,
      account_type: state.accountType,
    };

    if (state.selectedSubAccount) {
      payload["subaccount_id"] = state.selectedSubAccount;
    }
    if (redirectUrl) {
      payload["redirect_url"] = `https://${redirectUrl}`;
    }
    if (createLink) {
      updateStatus = false;
      id = "";
    } else {
      updateStatus = true;
      id = selectedItem.id;
    }

    try {
      const response = await addPaymentLink(payload, updateStatus, id);
      // @ts-ignore
      notifySuccess(response.message);
      fetchPaymentLinks && await fetchPaymentLinks();
      closeModal && closeModal();
    } catch (error: any) {
      closeModal && closeModal();
      notifyError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (state.accountType === "subaccount") {
      fetchSubAccounts();
    }
  }, [state.accountType]);

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
                ? "Redirect URL"
                : "Redirect URL (e.g yourbusiness.com)"
            }
            id="redirectUrl"
            htmlFor="redirectUrl"
            error={errors.redirectUrl?.message}
            touched={touchedFields.redirectUrl}
            {...register("redirectUrl")}
          />
        </div>

        <FormSelect
          onChange={handleSelectChange}
          name="accountType"
          id="accountType"
          htmlFor="accountType"
          value={state?.accountType}
          label="Account Type"
          options={accountTypeOptions}
        />

        {state?.accountType === "subaccount" && (
          <FormSelect
            onChange={handleSelectChange}
            name="selectedSubAccount"
            id="selectedSubAccount"
            htmlFor="selectedSubAccount"
            value={state.selectedSubAccount}
            label="Sub-account"
            options={subAccountOptions}
          />
        )}

        <div className="flex justify-center mt-5 w-36">
          <Button
            text={isLoading ? <Loader /> : createLink ? "Save Link" : "Update Link"}
            ariaLabel="Create payment link"
            disabled={isLoading || !state?.accountType}
            primary
            type="submit"
          />
        </div>
      </form>
    </>
  );
};

export default AddPaymentLink;