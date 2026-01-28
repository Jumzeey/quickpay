import Button from "@/components/button";
import CardSkeleton from "@/components/card-skeleton";
import FormInput from "@/components/FormInput";
import Loader from "@/components/loader";
import { Switch } from "@/components/ui/switch";
import { useAsyncFetch } from "@/hooks/useAsyncFetch";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useApiResponse } from "@/hooks/useApiResponse";
import {
  generateWebhookCredentials,
  updateWebhookCredentials,
} from "@/services/webhook";
import { useState, useMemo } from "react";
import { Controller, useWatch } from "react-hook-form";
import * as Yup from "yup";

interface FormValues {
  webhook_url: string;
  enable_webhook: boolean;
}

const Webhook = () => {
  const { handleError, handleSuccess } = useApiResponse();
  const [isLoading, setIsLoading] = useState(false);

  // Create validation schema that conditionally requires URL only when toggle is on
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
    formState: { errors, isValid },
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
      // If toggle is off, send empty string for webhook_url
      // If toggle is on, send the URL with https:// prefix
      const webhookUrl = values.enable_webhook && values.webhook_url?.trim() 
        ? `https://${values.webhook_url.trim()}` 
        : "";
      
      const payload = {
        webhook_url: webhookUrl,
        enable_webhook: values.enable_webhook,
      };

      const response = await updateWebhookCredentials(payload);
      handleSuccess({ message: "Webhook details updated" });

      // Update form with response data
      const cleanUrl = response.webhook_url?.replace(/^https?:\/\//, "") || "";
      reset({
        webhook_url: cleanUrl,
        enable_webhook: response.enable_webhook || false,
      });
    } catch (error: any) {
      handleError(error, "Failed to update webhook details!");
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
                            field.onChange(checked);
                            // Clear URL when toggle is turned off
                            if (!checked) {
                              setValue("webhook_url", "");
                            }
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
