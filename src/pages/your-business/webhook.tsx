import React, { useEffect, useState } from "react";
import Card from "@/components/Card";
import Layout from "@/components/layout";
import { notifyError, notifySuccess } from "@/util/utils";
import {
  updateWebhookCredentials,
  generateWebhookCredentials,
} from "@/services/webhook";
import Image from "next/image";
import { copyToClipboard } from "@/util/utils";
import Button from "@/components/button";
import WebPageTitle from "@/components/WebPageTitle";
import Loader from "@/components/loader";
import CardSkeleton from "@/components/card-skeleton";

type UpdateWebhook = {
  webhook_url: string;
  enable_webhook: boolean;
};

const Webhook = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhook, setWebhook] = useState<UpdateWebhook>({
    webhook_url: "",
    enable_webhook: false,
  });

  const removeHTTP = (url: string) => {
    return url.replace(/^https?:\/\//, "");
  };
  const newUrl = removeHTTP(webhook?.webhook_url || "");

  const handleCheckboxChange = () => {
    setWebhook((prevWebhook) => ({
      ...prevWebhook,
      enable_webhook: !prevWebhook.enable_webhook,
    }));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setWebhook((prevWebhook) => ({
      ...prevWebhook,
      webhook_url: value,
    }));
  };

  useEffect(() => {
    const fetchWebhook = async () => {
      setWebhookLoading(true);
      try {
        const response = await generateWebhookCredentials();
        updateWebhook(response);
        setWebhookLoading(false);
      } catch (error: any) {
        notifyError(error.message);
        setWebhookLoading(false);
      }
    };
    fetchWebhook();
  }, []);

  useEffect(() => {}, [webhook]);

  const handleUpdateWebhook = async () => {
    setIsLoading(true);
    const webhookUrl = webhook.webhook_url?.trim();
    const cleanWebhookUrl = webhookUrl.startsWith("https://")
      ? webhookUrl.slice(8)
      : webhookUrl;

    const payload = {
      webhook_url: `https://${cleanWebhookUrl}`,
      enable_webhook: webhook.enable_webhook,
    };
    try {
      const response = await updateWebhookCredentials(payload);
      notifySuccess("Webhook details updated");
      updateWebhook(response);
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      notifyError("Enter a valid redirect URL!");
    }
  };

  const updateWebhook = (values: any) => {
    setWebhook((prev) => ({ ...prev, ...values }));
  };

  return (
    <Layout pageTitle="Webhook" icon="webhook">
      <WebPageTitle title="Webhook | Sarepay Merchant Portal" />
      <div className="p-4 sm:p-6 lg:p-12 xl:p-36">
        {webhookLoading ? (
          <CardSkeleton />
        ) : (
          <Card>
            <div className="mt-4 sm:mt-6">
              <input
                type="checkbox"
                id="checkbox"
                checked={webhook.enable_webhook}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="checkbox"
                className="ml-2 text-gray-700 font-normal"
              >
                Enable Webhook
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-center rounded-lg mt-4 sm:mt-6">
  <span className="bg-[#D3D3D3] sarepayPrimary font-semibold px-3 py-2 w-full sm:w-auto text-center">
    URL
  </span>
  <div className="relative flex-1 bg-[#EEEEEE] text-gray-700 font-mono flex items-center">
    <span className="absolute text-base left-3 text-gray-500 top-1/2 transform -translate-y-1/2">
      Https://
    </span>
    <input
      type="text"
      className="bg-[#EEEEEE] border-none webhookInput w-full pl-24 py-3 text-base h-full rounded-lg"
      value={newUrl || ""}
      onChange={handleChange}
      placeholder="Enter webhook URL"
      style={{ lineHeight: "1.5" }}
    />
    <span
      className="bg-[#D3D3D3] p-2 cursor-pointer ml-2 flex justify-center items-center rounded-lg"
      onClick={() => copyToClipboard(webhook?.webhook_url || "")}
      aria-label="Copy URL"
    >
      <Image
        src="/images/dashboard/copy.svg"
        alt="Copy Icon"
        width={22}
        height={26}
      />
    </span>
  </div>
</div>
         

            <div className="flex justify-end mt-8 sm:mt-12">
              <Button
                text={isLoading ? <Loader /> : "Set Webhook"}
                className="w-full sm:w-[30%]"
                ariaLabel="Set Webhook"
                onClick={handleUpdateWebhook}
                disabled={isLoading}
                small
                primary
              />
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Webhook;
