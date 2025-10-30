import Button from "@/components/button";
import CardSkeleton from "@/components/card-skeleton";
import FormInput from "@/components/FormInput";
import Loader from "@/components/loader";
import Switch from "@/components/Switch";
import { useAsyncFetch } from "@/hooks/useAsyncFetch";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useApiResponse } from "@/hooks/useApiResponse";
import {
  generateWebhookCredentials,
  updateWebhookCredentials,
} from "@/services/webhook";
import { useState } from "react";
import { Controller } from "react-hook-form";
import * as Yup from "yup";

interface FormValues {
  webhook_url: string;
  enable_webhook: boolean;
}

const validationSchema = Yup.object().shape({
  webhook_url: Yup.string()
    .required("Webhook URL is required!")
    .matches(
      /^(?!https?:\/\/).*$/,
      "Please enter URL without https:// - it will be added automatically"
    ),
  enable_webhook: Yup.boolean(),
});

const Webhook = () => {
  const { handleError, handleSuccess } = useApiResponse();
  const [isLoading, setIsLoading] = useState(false);
 
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useFormValidation<FormValues>(validationSchema, {
    defaultValues: {
      webhook_url: "",
      enable_webhook: false,
    },
    mode: "onChange",
  });

  const { data, loading: webhookLoading } = useAsyncFetch({
    key: 'webhook-credentials',
    fn: async () => {
      const response = await generateWebhookCredentials();
      return response || {};
    },
    options: {
      onSuccess: (data) => {
        const cleanUrl = data.webhook_url?.replace(/^https?:\/\//, "");
        reset({
          webhook_url: cleanUrl || "",
          enable_webhook: data.enable_webhook || false,
        });
      },
      onError: (error) => handleError(error),
    }
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const webhookUrl = values.webhook_url?.trim();
      const payload = {
        webhook_url: `https://${webhookUrl}`,
        enable_webhook: values.enable_webhook,
      };

      const response = await updateWebhookCredentials(payload);
      handleSuccess({ message: "Webhook details updated" });

      // Update form with payload
      const cleanUrl = payload.webhook_url?.replace(/^https?:\/\//, "");
      reset({
        webhook_url: cleanUrl || "",
        enable_webhook: payload.enable_webhook,
      });
    } catch (error: any) {
      handleError(error, "Enter a valid redirect URL!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-10 w-full sm:w-[45%]">
      {webhookLoading ? (
        <CardSkeleton />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <p className="text-[#7F7F7F] font-medium text-[13px]">
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
                labelLeftElement={(
                  <div className="flex items-center">
                    <Controller
                      name="enable_webhook"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="enable_webhook"
                          enabled={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      )}
                    />
                    <label htmlFor="enable_webhook" className="ml-2 text-xs text-[#7F7F7F] font-medium">
                      Enable Webhook
                    </label>
                  </div>
                )}
                {...field}
              />
            )}
          />

          <div className="pt-4">
            <Button
              type="submit"
              text={isLoading ? <Loader /> : "Save"}
              className="w-full sm:w-[28%]"
              ariaLabel="Set Webhook"
              disabled={isLoading}
              primary
            />
          </div>
        </form>
      )}
    </div>
  );
};

export default Webhook;
