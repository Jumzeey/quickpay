import { useState, useRef } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Card from "@/components/Card";
import useAuthentication from "@/stores/useAuthentication";
import { capitalizeFirstLetter, notifyError } from "@/util/utils";
import { updateProfileImage } from "@/services/settings";

const ProfileTab = () => {
  const { user = {}, setUser } = useAuthentication();
  const {
    business_name = "",
    firstname = "",
    email = "",
    phone = "",
    avatar: initialAvatar = "/images/dashboard/avatar.svg",
  } = user;
  const [updatingImage, setUpdatingImage] = useState(false);
  const [avatar, setAvatar] = useState(
    initialAvatar || "/images/dashboard/avatar.svg"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
        const response = await updateProfileImage(file);
        if (response?.avatar) {
          setAvatar(response.avatar);
          setUser({
            ...user,
            avatar: response.avatar,
          });
        }
      } catch (error) {
        notifyError("Error uploading image");
      } finally {
        setUpdatingImage(false);
      }
    }
  };

  return (
    <Card className="w-full md:w-[600px] !rounded-xl">
      <div className="flex flex-col space-y-4 p-4">
        <div className="relative w-[100px] h-[100px] mx-auto md:mx-0">
          <div className="relative w-24 h-24 overflow-hidden rounded-full mx-auto md:mx-0">
            <Image
              src={
                avatar
                  ? `${avatar}?t=${new Date().getTime()}`
                  : "/images/dashboard/avatar.svg"
              }
              alt="Profile Picture"
              className="absolute inset-0 w-full h-full object-cover"
              layout="fill"
              sizes="(max-width: 640px) 90px, (max-width: 768px) 90px, 90px"
              priority
            />
          </div>

          <p
            onClick={handleFileInputClick}
            className={`absolute -bottom-1 right-0 mt-1 mr-1 text-black font-bold text-xs px-2 py-1 cursor-pointer rounded ${
              updatingImage ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {updatingImage ? (
              "Updating..."
            ) : (
              <Image
                src={"/images/dashboard/update-icon.svg"}
                alt="Update Icon"
                width={45}
                height={21}
                priority
              />
            )}
          </p>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <div className="flex flex-col md:flex-row justify-between">
          <div className="w-full md:w-1/2 pr-0 md:pr-2">
            <span className="block font-medium">Contact Person</span>
            <p className="font-thin">
              {capitalizeFirstLetter(firstname) || "N/A "}
            </p>
          </div>
          <div className="w-full md:w-1/2 pl-0 md:pl-2">
            <span className="block font-medium">Business Name</span>
            <p className="font-thin">
              {capitalizeFirstLetter(business_name) || "N/A"}
            </p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between">
          <div className="w-full md:w-1/2 pr-0 md:pr-2">
            <span className="block font-medium">Phone Number</span>
            <p className="font-thin">{phone || "N/A"}</p>
          </div>
          <div className="w-full md:w-1/2 pl-0 md:pl-2">
            <span className="block font-medium">Business Email</span>
            <p className="font-thin">{email || "N/A"}</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between">
          <div className="w-full md:w-1/2 pr-0 md:pr-2">
            <span className="block font-medium">Country</span>
            <div className="flex items-center">
              <Image
                src="/images/nigeria.svg"
                width={24}
                height={14}
                alt="Nigeria Icon"
              />
              <p className="font-thin ml-2">Nigeria</p>
            </div>
          </div>
          <div className="w-full md:w-1/2 pl-0 md:pl-2">
            <span className="block font-medium">Business Id</span>
            <p className="font-thin">62f38ea6ad0e294bcdb795f6</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileTab;
