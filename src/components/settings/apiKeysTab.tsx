import ActionButton from "@/components/action-button";
import Icon from "@/components/icon";
import Table from "@/components/table";
import { useEffectFetch } from "@/hooks/useEffectFetch";
import { useApiResponse } from "@/hooks/useApiResponse";
import {
  generateAccessKey,
  generateEncrytionKey,
  getAPICredentials,
} from "@/services/settings";
import { capitalizeFirstLetterOfEachWord, copyToClipboard } from "@/util/utils";
import { useState } from "react";
import EmptyState from "../EmptyState";

const columns = ["No.", "Key Type", "Key Value"];

interface APICredentials {
  public_key: string;
  secret_key: string;
  encryption_key: string;
  encryption_iv: string;
}

const MASKED_KEY_VALUE = "xxxxxxxxxxxxxxxx";

const ApiKeysTab = () => {
  const { handleError, handleSuccess } = useApiResponse();
  const [keyLoading, setKeyLoading] = useState(false);
  const [encryptionLoading, setEncryptionLoading] = useState(false);
  const [apiCredentials, setApiCredentials] = useState<APICredentials>({
    public_key: "",
    secret_key: "",
    encryption_key: "",
    encryption_iv: "",
  });

  const {
    data,
    loading: isLoading,
    error,
    refetch
  } = useEffectFetch<APICredentials>(
    getAPICredentials,
    [],
    {
      onSuccess: (response) => {
        setApiCredentials(response);
      },
      onError: (error) => {
        handleError(error);
      }
    }
  );

  const updateApiCredentials = (values: Partial<APICredentials>) => {
    setApiCredentials((prev) => ({ ...prev, ...values }));
  };

  const handleGenerateNewKeys = async () => {
    try {
      setKeyLoading(true);
      const response = await generateAccessKey();
      updateApiCredentials(response);
      handleSuccess({ message: "New access keys generated successfully!" });
    } catch (error: any) {
      handleError(error);
    } finally {
      setKeyLoading(false);
    }
  };

  const handleGenerateNewEncryptionKey = async () => {
    try {
      setEncryptionLoading(true);
      const response = await generateEncrytionKey();
      updateApiCredentials(response);
      handleSuccess({ message: "New encryption keys generated successfully!" });
    } catch (error: any) {
      handleError(error);
    } finally {
      setEncryptionLoading(false);
    }
  };

  // Determine if there's a permissions error
  const hasPermissionError = error && error.includes('permission');

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-[#C4C4C452] dark:border-gray-700 p-4">
        <div className="text-left">
          <h3 className="text-lg font-semibold text-black dark:text-white">API Keys</h3>
        </div>

        <div className="flex items-center gap-4">
          <ActionButton
            ariaLabel="Generate New Keys button"
            text="Generate New Keys"
            iconName={keyLoading ? "loading" : undefined}
            onClick={handleGenerateNewKeys}
            disabled={keyLoading || isLoading}
            className="!h-10 !px-4 !font-medium"
          />
          <ActionButton
            ariaLabel="Generate New Encryption Keys button"
            iconName={encryptionLoading ? "loading" : undefined}
            onClick={handleGenerateNewEncryptionKey}
            disabled={encryptionLoading || isLoading}
            text="Generate New Encryption Keys"
            className="!h-10 !px-4 !font-medium"
          />
        </div>
      </div>

      <div className="p-4">
        {hasPermissionError ? (
          <EmptyState
            title="User does not have the right permissions."
            subTitle="Contact your administrator to get access to API keys."
            image="/images/history.svg"
          />
        ) : isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center">
              <svg
                className="animate-spin w-12 h-12 text-[#164988]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-[#164988] dark:text-blue-400 font-medium mt-4">
                Fetching API Keys...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-20">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">⚠️</div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                Failed to Load API Keys
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error}
              </p>
              <ActionButton
                text="Retry"
                onClick={refetch}
                className="!h-10 !px-6"
                ariaLabel="Retry loading API keys"
              />
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-[#C4C4C452] border-t-0 dark:border-gray-700">
            <Table columns={columns} className="border-collapse w-full">
              {Object.entries(apiCredentials).map(([key, value], index) => (
                <tr
                  key={key}
                  className={`${index !== Object.entries(apiCredentials).length - 1
                    ? "[&>td]:border-b [&>td]:border-[#C4C4C452] dark:border-gray-700"
                    : ""
                    } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                >
                  <td className="text-sm px-5 py-6 text-gray-900 dark:text-gray-100">
                    {index + 1}.
                  </td>
                  <td className="text-sm pl-3 pr-5 py-6 font-medium text-gray-900 dark:text-gray-100">
                    {capitalizeFirstLetterOfEachWord(key.replace("_", " "))}
                  </td>
                  <td className="text-sm pl-3 pr-5 py-6">
                    <div className="flex items-center gap-3">
                      {value !== MASKED_KEY_VALUE && (
                        <span
                          className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 max-w-md truncate text-gray-900 dark:text-gray-100"
                          title={value || 'N/A'}
                        >
                          {value || "N/A"}
                        </span>
                      )}

                      {value && value !== MASKED_KEY_VALUE && (
                        <Icon
                          name="copy3"
                          size="15"
                          className="cursor-pointer text-[#7F7F7F] hover:text-[#164988] dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                          onClick={() => copyToClipboard(value)}
                        />
                      )}

                      {value === MASKED_KEY_VALUE && (
                        <button onClick={handleGenerateNewKeys} title="Regenerate Secrete Key" className="text-xs text-blue-500 cursor-pointer bg-success text-white font-medium rounded-3xl px-2 pt-0.5 pb-1 ml-4">regenerate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>

            {/* Show message if no keys are available */}
            {Object.values(apiCredentials).every(value => !value) && (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No API keys available. Generate new keys to get started.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiKeysTab;