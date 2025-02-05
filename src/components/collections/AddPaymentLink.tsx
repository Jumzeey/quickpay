import { ChangeEvent } from "react";
import Card from "@/components/Card";
import FloatingLabelInput from "@/components/floating-input";
import Button from "@/components/button";
import { useRouter } from "next/router";
import { useFormik } from "formik";
import * as Yup from "yup";
import { addPaymentLink } from "@/services/collections";
import { useState, useEffect } from "react";
import useClickEvent from "@/stores/useClickEvent";
import {
  notifyError,
  notifySuccess,
  removeCommasFromValue,
} from "@/util/utils";
import Loader from "../loader";
import { getSubaccountHistory } from "@/services/sub-account";
import { PaymentLinkPayload } from "@/services/collections";
import useScreenWidth from "@/hooks/useScreenWidth";
import { numberWithCommas } from "@/util/utils";

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

  const formik = useFormik({
    initialValues: {
      title: "",
      amount: "",
      description: "",
      redirectUrl: "",
    },
    validationSchema: Yup.object().shape({
      title: Yup.string().required("Payment link name is required!"),
      amount: Yup.string().required("Amount is required!"),
      description: Yup.string().required("Description is required!"),
      redirectUrl: Yup.string()
        .notRequired()
        .matches(
          /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
          "Enter a valid redirect URL!"
        ),
    }),

    validateOnMount: true,

    onSubmit: async () => {
      createAndUpdatePaymentLink();
    },
  });

  useEffect(() => {
    if (!createLink) {
      formik.setValues({
        title: selectedItem.title,
        amount: numberWithCommas(selectedItem.amount)!,
        description: selectedItem.meta.description,
        redirectUrl: selectedItem.meta?.redirect_url?.replace("https://", ""),
      });
    }
  }, []);

  const createAndUpdatePaymentLink = async () => {
    setIsLoading(true);
    let updateStatus;
    let id;

    const { title, amount, description, redirectUrl } = formik.values;

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
      closeModal && closeModal();

      setTimeout(() => {
        createLink ? router.back() : fetchPaymentLinks && fetchPaymentLinks();
      }, 900);
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

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setState({ ...state, [e.target.name]: value });
  };

  const fetchSubAccounts = async () => {
    const response = await getSubaccountHistory();
    setState({ ...state, subAccounts: response.subaccounts });
  };

  const buttonText = createLink ? "Create payment link" : "Update Payment Link";

  return (
    <div className="flex justify-center">
      <Card
        className={`mt-5 md:w-[648px] border-[#e2dfdf] ${
          !createLink ? "p-8" : "py-20 md:px-24"
        }`}
      >
        <form onSubmit={formik.handleSubmit}>
          <FloatingLabelInput
            label="Payment link name"
            id="paymentLinkName"
            type="text"
            htmlFor="paymentLinkName"
            formik={formik}
            {...formik.getFieldProps("title")}
          />

          <FloatingLabelInput
            label="Amount"
            id="amount"
            type="text"
            htmlFor="amount"
            formik={formik}
            {...formik.getFieldProps("amount")}
          />

          <div className="description">
            <FloatingLabelInput
              label="Description"
              id="description"
              type="text"
              htmlFor="description"
              formik={formik}
              {...formik.getFieldProps("description")}
            />
          </div>

          <div className="relative">
            <FloatingLabelInput
              label={
                screenWidth < 700
                  ? "Redirect URL"
                  : "Redirect URL (e.g yourbusiness.com)"
              }
              id="redirectUrl"
              type="text"
              htmlFor="redirectUrl"
              tooltip="Where to redirect your users after payment"
              formik={formik}
              {...formik.getFieldProps("redirectUrl")}
              hasLink
            />
            <span className="absolute text-sm top-5 left-3">https://</span>
          </div>

          <select
            className="h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
            onChange={handleChange}
            name="accountType"
            value={state?.accountType}
          >
            <option value="">--Select account type--</option>

            <option value="main">Main</option>
            <option value="subaccount">Sub-account</option>
          </select>

          {state?.accountType === "subaccount" && (
            <select
              className="h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
              onChange={handleChange}
              name="selectedSubAccount"
              value={state.selectedSubAccount}
            >
              <option value="">--Select sub-account--</option>

              {state?.subAccounts?.map((option: any) => (
                <option key={option.id} value={option.id}>
                  {option.merchant_name}
                </option>
              ))}
            </select>
          )}

          <div className="flex justify-center mt-5">
            <Button
              text={isLoading ? <Loader /> : buttonText}
              className="w-[400px]"
              ariaLabel="Create payment link"
              disabled={!formik.isValid || isLoading || !state?.accountType}
              primary
            />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddPaymentLink;
