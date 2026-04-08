import ActionButton from "@/components/action-button";
import Icon from "@/components/icon";
import { updateProfileImage } from "@/services/settings";
import useAuthentication from "@/stores/useAuthentication";
import useCurrency from "@/stores/useCurrency";
import useKyc from "@/stores/useKyc";
import { KycStatus } from "@/types/kyc";
import { capitalizeFirstLetter, copyToClipboard, notifyError, notifySuccess } from "@/util/utils";
import { uploadFileByConfig } from "@/util/uploadFileByConfig";
import Image from "next/image";
import { useRef, useState } from "react";

const ProfileTab = () => {
  const { defaultCurrency, getCurrencyFlag } = useCurrency();
  const { user = {}, setUser } = useAuthentication();
  const { userKyc, getKyc } = useKyc();
  const [updatingImage, setUpdatingImage] = useState(false);
  const [upgradeChecking, setUpgradeChecking] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setUpdatingImage(true);
      try {
        const avatarUrl = await uploadFileByConfig(file, "business-logo");
        const response = await updateProfileImage(avatarUrl);
        if (response?.avatar) {
          setAvatar(response.avatar);
          setImageError(false);
          setUser({
            ...user,
            avatar: response.avatar,
          });
          notifySuccess("Profile picture updated successfully");
        }
      } catch (error) {
        notifyError("Error uploading image");
      } finally {
        setUpdatingImage(false);
      }
    }
  };

  console.log({ defaultCurrency });

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-[#C4C4C452] p-4">
        <div className="flex items-center gap-3">
          {avatar && !imageError ? (
            <div className="w-[65px] h-[60px] rounded-lg flex items-center justify-center overflow-hidden">
              <Image
                src={`${avatar}?t=${new Date().getTime()}`}
                alt="Profile Picture"
                width={65}
                height={60}
                className="rounded-lg object-cover"
                priority
                unoptimized={avatar.startsWith("http")}
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="w-[65px] h-[60px] border border-dashed border-[#DC143C] rounded-lg flex items-center justify-center">
              <Icon name="image" className="size-5 text-[#DC143C]" />
            </div>
          )}

          <button
            onClick={handleFileInputClick}
            className="text-[#DC143C] text-xs md:text-[13px] font-medium cursor-pointer flex items-center gap-1"
          >
            <Icon name="upload" className="size-5 text-[#DC143C]" />
            {updatingImage ? (
              <span>Updating...</span>
            ) : (
              <>
                {user?.avatar ? "Change" : "Upload"} business logo
              </>
            )}
          </button>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {user?.business_type === "starter business" && (
          <ActionButton
            ariaLabel="Upgrade to business account"
            text={upgradeChecking ? "Verifying KYC status…" : "Upgrade to business account"}
            className="!h-10 !px-4 !font-medium"
            disabled={upgradeChecking}
            onClick={async () => {
              setUpgradeChecking(true);
              try {
                // Fetch fresh KYC so we use current API status (Settings may not have loaded KYC yet)
                const { userKyc: freshKyc } = await getKyc();
                const kycStatus = (freshKyc?.status ?? userKyc?.status) as KycStatus | string;
                const isApproved =
                  kycStatus === KycStatus.APPROVED ||
                  String(kycStatus).trim().toLowerCase() === "approved";

                if (!isApproved) {
                  notifyError(
                    "Please have your account approved before you can upgrade to a business account.",
                    "Account Approval Required"
                  );
                  return;
                }

                window.location.href = "/your-business?tab=upgrade-account";
              } catch {
                notifyError(
                  "Unable to verify your account status. Please try again or go to Your Business to upgrade."
                );
              } finally {
                setUpgradeChecking(false);
              }
            }}
          />
        )}
      </div>

      <div className="p-4 grid md:grid-cols-3 gap-x-5 gap-y-4">
        <div>
          <h3 className="text-[#7F7F7F] text-xs md:text-[13px] font-medium">Business Name:</h3>
          <p className="text-[#090727] text-base md:text-lg font-extrabold mt-0.5 truncate">
            {capitalizeFirstLetter(user?.business_name) || "N/A"}
          </p>
        </div>
        <div>
          <h3 className="text-[#7F7F7F] text-xs md:text-[13px] font-medium">Business Email:</h3>
          <p className="text-[#090727] text-base md:text-lg font-extrabold mt-0.5 truncate">
            {user?.email || "N/A"}
          </p>
        </div>
        <div>
          <h3 className="text-[#7F7F7F] text-xs md:text-[13px] font-medium flex items-center justify-between">
            Business ID:

            {user?.business_id && (
              <button
                onClick={() => copyToClipboard(user?.business_id)}
                className="text-[#005BB0] cursor-pointer">Copy</button>
            )}
          </h3>
          <p className="text-[#090727] text-base md:text-lg font-extrabold mt-0.5">
            {user?.business_id || "N/A"}
          </p>
        </div>
        <div>
          <h3 className="text-[#7F7F7F] text-xs md:text-[13px] font-medium">Contact Person:</h3>
          <p className="text-[#090727] text-base md:text-lg font-extrabold mt-0.5">
            {capitalizeFirstLetter(user?.firstname) || "N/A "} {capitalizeFirstLetter(user?.lastname) || ""}
          </p>
        </div>
        <div>
          <h3 className="text-[#7F7F7F] text-xs md:text-[13px] font-medium">Phone Number:</h3>
          <p className="text-[#090727] text-base md:text-lg font-extrabold mt-0.5">
            {user?.phone || "N/A"}
          </p>
        </div>
        <div>
          <h3 className="text-[#7F7F7F] text-xs md:text-[13px] font-medium">Country:</h3>
          <p className="text-[#090727] text-base md:text-lg font-extrabold mt-0.5 flex items-center gap-2">
            {/* <Image
              src="/images/nigeria.svg"
              width={24}
              height={14}
              alt="Nigeria Icon"
            /> */}
            {getCurrencyFlag("default")}
            <span>{defaultCurrency}</span>
          </p>
        </div>
      </div>
    </div >
  );
};

export default ProfileTab;
