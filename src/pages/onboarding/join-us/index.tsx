import React, { useState } from "react";
import Sidebar from "@/components/onboarding/sidebar";
import Image from "next/image";
import BoxComponent from "@/components/box";
import { useRouter } from "next/router";
import Link from "next/link";
import Button from "@/components/button";
import Modal from "@/components/modal";
import NoSSR from "@/components/noSSR";
import WebPageTitle from "@/components/WebPageTitle";
import { MultiStepAnimation } from "@/animations";
import { motion } from "framer-motion";

const JoinUsPage: React.FC = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNINModalOpen, setIsNINModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openNINModal = () => setIsNINModalOpen(true);
  const closeNINModal = () => setIsNINModalOpen(false);

  const navigateBack = () => {
    router.back();
  };

  return (
    <NoSSR>
      <WebPageTitle title="Join Us | Sarepay Merchant Portal" />
      <div className="flex w-full">
        <Sidebar />
        <div className="w-full lg:w-1/2 md:w-1/2 p-4 lg:p-20 lg:py-10">
          <div className="flex w-full justify-between">
            <div className="flex cursor-pointer" onClick={navigateBack}>
              <Image
                src="/images/black-back-arrow.svg"
                width={15}
                height={5}
                onClick={() => router.back()}
                alt="Back Icon"
              />
              <span className="ml-1 font-light">Back</span>
            </div>
            <h6 className="font-light text-sm">
              Already have an account?
              <Link
                href="/onboarding/sign-in"
                className="ml-1 font-medium sarepayPrimary underline-animation"
              >
                Sign In
              </Link>
            </h6>
          </div>
          <motion.div
            className="mt-10"
            variants={MultiStepAnimation}
            initial="hidden"
            animate="visible"
          >
          <div>
            <h1 className="font-semibold text-2xl">Join Us!</h1>
            <p className="font-light mt-1 text-sm">
              Choose the best account type for you
            </p>
            <div className="mt-10">
              <BoxComponent
                imageUrl1="/images/starter.svg"
                headerText="Starter Business"
                descriptionText="For Started Business:"
                firstItem="A government-issued ID"
                secondItem="Bank Verification Number (BVN)"
                imageUrl2="/images/next-icon.svg"
                businessType="starter"
                onClick={() => router.push("/onboarding/join-us/starter")}
              />
            <BoxComponent
                imageUrl1="/images/registered.svg"
                headerText="Registered business account"
                descriptionText="For registered businesses with corporate account information:"
                firstItem="A government-issued ID"
                secondItem="Bank Verification Number (BVN)"
                thirdItem="Business Registration Number"
                imageUrl2="/images/next-icon.svg"
                businessType="registered"
                onClick={() => router.push("/onboarding/join-us/registered")}
              />

              <BoxComponent
                imageUrl1="/images/non-profit.svg"
                headerText="Non-profit Entites"
                descriptionText="For charity organisations, NGOs, Churches, Mosques and others:"
                firstItem="A government-issued ID"
                secondItem="Bank Verification Number (BVN)"
                thirdItem="CAC Registration Certificate"
                fourthItem="Constitution/Memorandum of Guidance. "
                imageUrl2="/images/next-icon.svg"
                businessType="non-profit"
                onClick={() => router.push("/onboarding/join-us/non-profit")}
              />
            </div>
          </div>
          </motion.div>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="flex">
          <div className="w-3/12">
            <Image
              src="/images/cac.svg"
              alt="CAC Registration Certificate Image"
              width="100"
              height="100"
              priority
            />
          </div>
          <div>
            <h3 className="openSansBold text-lg">
              Enter Business Registration Number
            </h3>
            <p className="text-sm openSansRegular mt-3">
              Get the latest Lorem Ipsum is simply dummy text of the printing
              and typesetting industry.
            </p>

            <div className="relative mt-2 rounded-md shadow-sm">
              <input
                type="text"
                name="nin"
                id="nin"
                className="block w-full text-gray-900 placeholder:text-gray-400 rounded-md bg-[#F4F6F9] p-[0.3rem]"
                placeholder=""
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <Button
                  text="Continue"
                  ariaLabel="Continue"
                  onClick={openModal}
                  primary
                />
              </div>
            </div>
            <div className="mt-5">
              {/* <UploadComponent onFileChange={handleFileChange} /> */}
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isNINModalOpen} onClose={closeNINModal}>
        <div className="flex">
          <div className="w-3/12">
            <div className="w-full">
              <Image
                src="/images/nimc.svg"
                alt="CAC Registration Certificate Image"
                width="100"
                height="100"
                priority
              />
            </div>
          </div>
          <div className="w-3/4">
            <h3 className="text-lg">Enter Your NIN</h3>
            <p className="text-sm mt-2">Enter the BVN of the Business Owner.</p>
            <div className="mt-5">
              <div className="relative mt-2 rounded-md shadow-sm">
                <input
                  type="text"
                  name="nin"
                  id="nin"
                  className="block w-full text-gray-900 placeholder:text-gray-400 rounded-md bg-[#F4F6F9] p-[0.3rem]"
                  placeholder=""
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <Button
                    text="Continue"
                    ariaLabel="Continue"
                    primary
                    onClick={() => router.push("/onboarding/sign-in")}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </NoSSR>
  );
};

export default JoinUsPage;
