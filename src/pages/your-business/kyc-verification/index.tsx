import React, { Fragment, useEffect, useState } from "react";
import Layout from "@/components/layout";
import Button from "@/components/button";
import Link from "next/link";
import useKyc from "@/stores/useKyc";
import useAuthentication from "@/stores/useAuthentication";
import { useRouter } from "next/router";
import EmptyState from "@/components/EmptyState";
import Image from "next/image";
import moment from "moment";
import WebPageTitle from "@/components/WebPageTitle";
import Card from "@/components/Card";
import CardSkeleton from "@/components/card-skeleton";
import env from "@/config/env";
import { capitalizeFirstLetter, formatDate } from "@/util/utils";

interface BusinessProps {
  title: string;
}

interface Field {
  key: string;
  value: string;
}

interface UserKyc {
  created_at: string;
  status: string;
  fields: Field[];
}

const Business: React.FC<BusinessProps> = ({ title }) => {
  useAuthentication();
  const { getKyc, userKyc, getKycLoading } = useKyc();
  const [show, setShow] = useState(false);
  const router = useRouter();
  const getField = (key: any) =>
    userKyc?.fields?.find((field: Field) => field.key.trim() === key)?.value ||
    "N/A";
  const directorsDocument = getField("Directors Document");
  const cacDocument = getField("CAC Document");
  const statusOfCompany = getField("Status of Company");
  const beneficiaryDocument = getField("Beneficiary Document");
  const beneficiaryId = getField("Beneficiary ID");
  const proofOfBusinessAddress = getField("Proof of Business Address");
  const idFile = getField('ID File');
  const proofOfAddress = getField("Proof of Address");
  const { imageUrl } = env;

  const toggleShow = () => {
    setShow(!show);
  };

  const isStarterBusiness = () => {
    const businessType = getField("Business Type").toLowerCase();
    return businessType === "starter business";
  };

  useEffect(() => {
    getKyc();
  }, [getKyc]);

  return (
    <Layout pageTitle='Business KYC Verification' icon='kyc'>
      <WebPageTitle title='Business KYC | Ramp Merchant Portal' />
      <div className='p-4'>
        {getKycLoading ? (
          <Fragment>
            <CardSkeleton />
          </Fragment>
        ) : userKyc && userKyc.fields.length !== 0 ? (
          <Card>
            <div className='flex flex-col sm:flex-row justify-center items-center sm:justify-between p-5'>
              <h6
                className={`text-center font-bold py-3 px-3 ${
                  userKyc.status === 'Approved'
                    ? 'sarepayPrimary'
                    : 'text-danger'
                }`}
              >
                KYC Status: {userKyc.status}
              </h6>
              <Link href='/your-business/kyc-verification/kyc-form'>
                <Button
                  text='Submit New Document'
                  ariaLabel='Submit New Document'
                  disabled={
                    !(userKyc.status === 'Approved' && isStarterBusiness()) &&
                    !(userKyc.status === 'Rejected')
                  }
                  primary
                  medium
                />
              </Link>
            </div>
            <div className='p-4 bg-[#F5F8FA]'>
              <div className='flex flex-col sm:grid sm:grid-cols-5 gap-4'>
                <div className='flex flex-col space-y-1 sm:space-y-0'>
                  <h3 className='text-[#6E6893] font-semibold text-sm'> </h3>
                  <Image
                    src='/images/dashboard/your-business/kyc-dropdown.svg'
                    onClick={toggleShow}
                    width={20}
                    height={20}
                    alt='KYC Dropdown'
                  />
                </div>
                <div className='flex flex-col space-y-1 sm:space-y-0'>
                  <h3 className='text-[#6E6893] font-bold text-sm'>
                    BUSINESS TYPE
                  </h3>
                  <p> {capitalizeFirstLetter(userKyc.fields[0].value)}</p>
                </div>
                <div className='flex flex-col space-y-1 sm:space-y-0'>
                  <h3 className='text-[#6E6893] font-bold text-sm'>STATUS</h3>
                  <p
                    className={`font-bold ${
                      userKyc.status === 'Approved'
                        ? 'sarepayPrimary'
                        : 'text-danger'
                    }`}
                  >
                    {userKyc.status}
                  </p>
                </div>
                <div className='flex flex-col space-y-1 sm:space-y-0'>
                  <h3 className='text-[#6E6893] font-bold text-sm'>
                    COMPLIANCE COMMENT
                  </h3>
                  <p>{userKyc.comment || 'N/A'}</p>
                </div>
                <div className='flex flex-col space-y-1 sm:space-y-0'>
                  <h3 className='text-[#6E6893] font-bold text-sm'>
                    SUBMITTED DATE
                  </h3>
                  <p>{formatDate(userKyc.created_at)}</p>
                </div>
              </div>
            </div>

            {show && (
              <div>
                {isStarterBusiness() ? (
                  <div>
                    <div className='p-4 bg-[#D9D5EC]'>
                      <div className='flex flex-col sm:grid sm:grid-cols-5 gap-4'>
                        <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            ID Number
                          </h3>
                          <p>{getField('ID Number')}</p>
                        </div>
                        <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            Document Type
                          </h3>
                          <p>{getField('ID Type')}</p>
                        </div>
                        <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            Document
                          </h3>
                          <p>
                            {idFile !== 'N/A' ? (
                              <Link
                                href={`${imageUrl}/${idFile}`}
                                passHref
                                legacyBehavior
                              >
                                <a
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='sarepayPrimary underline font-bold text-sm'
                                >
                                  View Document
                                </a>
                              </Link>
                            ) : (
                              'N/A'
                            )}
                          </p>
                        </div>
                        {/* <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            BVN
                          </h3>
                          <p>{getField('BVN')}</p>
                        </div>
                        <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            NIN
                          </h3>
                          <p>{getField('NIN')}</p>
                        </div> */}
                      </div>
                    </div>

                    <div className='flex flex-col sm:grid sm:grid-cols-5 gap-4'>
                      <div className='flex flex-col space-y-1 sm:space-y-0'>
                        <h3 className='text-[#6E6893] font-semibold text-sm'>
                          Date Of Birth
                        </h3>
                        <p>{getField('Date Of Birth')}</p>
                      </div>
                      <div className='flex flex-col space-y-1 sm:space-y-0'>
                        <h3 className='text-[#6E6893] font-semibold text-sm'>
                          Proof of Address
                        </h3>
                        <p>
                          {proofOfAddress !== 'N/A' ? (
                            <Link
                              href={`${imageUrl}/${proofOfAddress}`}
                              passHref
                              legacyBehavior
                            >
                              <a
                                target='_blank'
                                rel='noopener noreferrer'
                                className='sarepayPrimary underline font-bold text-sm'
                              >
                                View Document
                              </a>
                            </Link>
                          ) : (
                            'N/A'
                          )}
                        </p>
                      </div>
                      <div className='flex flex-col space-y-1 sm:space-y-0'>
                        <h3 className='text-[#6E6893] font-semibold text-sm'>
                          Note
                        </h3>
                        <p>{getField('Note')}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className='p-4 bg-[#D9D5EC]'>
                      <div className='flex flex-col sm:grid sm:grid-cols-5 gap-4'>
                        {/* <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            Directors BVN
                          </h3>
                          <p>
                            <p>{getField('Directors BVN')}</p>
                          </p>
                        </div>
                        <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            Directors NIN
                          </h3>
                          <p>{getField('Directors NIN')}</p>
                        </div> */}
                        <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            Directors ID
                          </h3>
                          <p>{getField('Directors ID')}</p>
                        </div>
                        <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            Directors Document
                          </h3>
                          <p>
                            {directorsDocument !== 'N/A' ? (
                              <Link
                                href={`${imageUrl}/${directorsDocument}`}
                                passHref
                                legacyBehavior
                              >
                                <a
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='sarepayPrimary underline font-bold text-sm'
                                >
                                  View Document
                                </a>
                              </Link>
                            ) : (
                              'N/A'
                            )}
                          </p>
                        </div>

                        <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            Beneficiary ID
                          </h3>
                          <p>
                            {beneficiaryId !== 'N/A' ? (
                              <Link
                                href={`${imageUrl}/${beneficiaryId}`}
                                passHref
                                legacyBehavior
                              >
                                <a
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='sarepayPrimary underline font-bold text-sm'
                                >
                                  View Document
                                </a>
                              </Link>
                            ) : (
                              'N/A'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='p-4 bg-[#D9D5EC]'>
                      <div className='flex flex-col sm:grid sm:grid-cols-5 gap-4'>
                        <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            Beneficiary Document
                          </h3>
                          <p>
                            {beneficiaryDocument !== 'N/A' ? (
                              <Link
                                href={`${imageUrl}/${beneficiaryDocument}`}
                                passHref
                                legacyBehavior
                              >
                                <a
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='sarepayPrimary underline font-bold text-sm'
                                >
                                  View Document
                                </a>
                              </Link>
                            ) : (
                              'N/A'
                            )}
                          </p>
                        </div>
                        <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            Tax Identification Number
                          </h3>
                          <p>{getField('Tax Identification Number')}</p>
                        </div>
                        <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            Proof Of Business Address
                          </h3>
                          <p>
                            {proofOfBusinessAddress !== 'N/A' ? (
                              <Link
                                href={`${imageUrl}/${proofOfBusinessAddress}`}
                                passHref
                                legacyBehavior
                              >
                                <a
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='sarepayPrimary underline font-bold text-sm'
                                >
                                  View Document
                                </a>
                              </Link>
                            ) : (
                              'N/A'
                            )}
                          </p>
                        </div>
                        <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            CAC Registration Certificate
                          </h3>
                          <p>
                            {cacDocument !== 'N/A' ? (
                              <Link
                                href={`${imageUrl}/${cacDocument}`}
                                passHref
                                legacyBehavior
                              >
                                <a
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='sarepayPrimary underline font-bold text-sm'
                                >
                                  View Document
                                </a>
                              </Link>
                            ) : (
                              'N/A'
                            )}
                          </p>
                        </div>

                        <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            MEMART or its equivalent
                          </h3>
                          <p>
                            {statusOfCompany !== 'N/A' ? (
                              <Link
                                href={`${imageUrl}/${statusOfCompany}`}
                                passHref
                                legacyBehavior
                              >
                                <a
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='sarepayPrimary underline font-bold text-sm'
                                >
                                  View Document
                                </a>
                              </Link>
                            ) : (
                              'N/A'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='p-4 bg-[#D9D5EC]'>
                      <div className='flex flex-col sm:grid sm:grid-cols-5 gap-4'>
                        <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            Business Description
                          </h3>
                          <p>
                            {userKyc.fields.find(
                              (field: Field) =>
                                field.key.trim() === 'Business Description'
                            )?.value || 'N/A'}
                          </p>
                        </div>
                        <div className='flex flex-col space-y-1 sm:space-y-0'>
                          <h3 className='text-[#6E6893] font-semibold text-sm'>
                            Note
                          </h3>
                          <p>
                            {userKyc.fields.find(
                              (field: Field) => field.key.trim() === 'Note'
                            )?.value || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        ) : (
          <EmptyState
            title='No Business KYC found'
            subTitle="We couldn't find any KYC"
            image='/images/dashboard/your-business/kyc-emptystate.svg'
          >
            <Button
              text='Submit KYC'
              ariaLabel='Add KYC button'
              className='!w-[191px] !h-[48px]'
              onClick={() =>
                router.push(`/your-business/kyc-verification/kyc-form`)
              }
              primary
            />
          </EmptyState>
        )}
      </div>
    </Layout>
  );
};

export default Business;
