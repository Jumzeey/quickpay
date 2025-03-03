import React, { useEffect, useState } from "react";
import Card from "@/components/Card";
import { notifyError } from "@/util/utils";
import {
  getAPICredentials,
  generateAccessKey,
  generateEncrytionKey,
} from "@/services/settings";
import KeyDisplay from "../key-display";
import Loader from "../loader";
import Button from "../button";
import EmptyState from "../EmptyState";

const ApiKeysTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);
  const [encryptionLoading, setEncryptionLoading] = useState(false);
  const [hasError, setHasError] = useState(false); // Track if there's an error
  const [apiCredentials, setApiCredentials] = useState({
    public_key: "",
    secret_key: "",
    encryption_key: "",
    encryption_iv: "",
  });

  useEffect(() => {
    const fetchAPICredentials = async () => {
      try {
        const response = await getAPICredentials();
        setApiCredentials(response);
        setIsLoading(true);
      } catch (error: any) {
        notifyError(error.message);
        setHasError(true); // Set error state when API call fails
      }
    };
    fetchAPICredentials();
  }, []);

  const updateApiCredentials = (values: any) => {
    setApiCredentials((prev) => ({ ...prev, ...values }));
  };

  const handleGenerateNewKeys = async () => {
    setKeyLoading(true);
    try {
      const response = await generateAccessKey();
      updateApiCredentials(response);
      setKeyLoading(false);
    } catch (error: any) {
      notifyError(error.message);
      setKeyLoading(false);
    }
  };

  const handleGenerateNewEncryptionKey = async () => {
    setEncryptionLoading(true);
    try {
      const response = await generateEncrytionKey();
      updateApiCredentials(response);
      setEncryptionLoading(false);
    } catch (error: any) {
      notifyError(error.message);
      setEncryptionLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <h2 className='font-bold text-2xl mt-2'>API Keys</h2>
        <div>
          {hasError ? (
            <EmptyState
              title='User does not have the right permissions.'
              subTitle='User does not have the right permissions.'
              image='/images/history.svg'
            ></EmptyState>
          ) : isLoading ? (
            <>
              <div>
                <KeyDisplay
                  label='PUBLIC KEY'
                  value={apiCredentials?.public_key}
                  keyValue={apiCredentials?.public_key}
                />
                <KeyDisplay
                  label='SECRET KEY'
                  value={apiCredentials?.secret_key}
                  keyValue={apiCredentials?.secret_key}
                />
                <div className='flex justify-end mt-5'>
                  <Button
                    text={keyLoading ? <Loader /> : 'Generate New Keys'}
                    className='w-full sm:w-[30%]'
                    ariaLabel='Generate New Keys button'
                    onClick={handleGenerateNewKeys}
                    disabled={keyLoading}
                    primary
                    medium
                  />
                </div>
              </div>
              <div className='mt-10'>
                <KeyDisplay
                  label='ENCRYPTION KEY'
                  value={apiCredentials?.encryption_key}
                  keyValue={apiCredentials?.encryption_key}
                />
                <KeyDisplay
                  label='IV'
                  value={apiCredentials?.encryption_iv}
                  keyValue={apiCredentials?.encryption_iv}
                />
                <div className='flex justify-end mt-5'>
                  <Button
                    text={
                      encryptionLoading ? (
                        <Loader />
                      ) : (
                        'Generate New Encryption Keys'
                      )
                    }
                    ariaLabel='Generate New Encryption Keys button'
                    className='w-full sm:w-[30%]'
                    onClick={handleGenerateNewEncryptionKey}
                    disabled={encryptionLoading}
                    primary
                    medium
                  />
                </div>
              </div>
            </>
          ) : (
            <div className='flex justify-center items-center'>
              <div className='flex flex-col items-center'>
                <svg
                  className={`animate-spin w-20 text-[#164988]`}
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  />
                </svg>
                <p className='text-primary font-medium mt-5'>
                  Fetching API Keys...
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ApiKeysTab;
