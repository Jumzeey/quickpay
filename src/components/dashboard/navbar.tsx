import Switch from "@/components/Switch";
import env from "@/config/env";
import { useTheme } from "@/context/ThemeContext";
import useAuthentication from "@/stores/useAuthentication";
import useMode from "@/stores/useMode";
import { capitalizeFirstLetterOfEachWord, handleLogOut } from "@/util/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Button from "../button";
import Dropdown from "../Dropdown";
import Icon from "../icon";
import Modal from "../modal";

interface ComponentProps {
  pageTitle: string;
  icon: string;
  showSidebar: boolean;
  setShowSidebar: (visibility: boolean) => void;
}

const Navbar = ({
  pageTitle,
  icon,
  showSidebar,
  setShowSidebar,
}: ComponentProps) => {
  const { business_name, firstname, lastname, avatar } = useAuthentication().user || {};
  const { oldUrl } = env;
  const { theme, toggleTheme } = useTheme();
  const { isLiveMode, toggleMode } = useMode();

  const [state, setState] = useState({
    showProfileMenu: false,
  });

  const closeDropdown = () => {
    setState({
      ...state,
      showProfileMenu: false,
    });
  };

  const switchToOldWebsite = () => {
    const url = `${oldUrl}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <header className="fixed left-0 md:right-0 z-20 dark:bg-[#121212] bg-white dark:bg-gray-900 w-full lg:w-auto border-b border-[#C4C4C452] dark:border-gray-700">
        <div className="h-auto flex flex-row px-3 md:px-6 py-4 md:py-3 items-center justify-between">
          <Link href="/dashboard">
            <Image
              src="/images/logo.png"
              alt="Logo"
              className="h-7 w-auto"
              width={83}
              height={32}
            // priority
            />
          </Link>

          {/* <div className="flex items-center gap-3">
            <Icon name={icon} color="#164988" size="20" />
            <div className="text-lg text-primary font-semibold">
              {pageTitle}
            </div>
          </div> */}

          {/* <div> 
            <p onClick={openModal} className="underline text-sm quickpayPrimary lg:text-base cursor-pointer">
              Switch To The Old Dashboard
            </p>
          </div> */}

          <div className="flex items-center gap-6">
            <div className="text-black dark:text-[#EFF7FE] font-medium text-sm gap-6 hidden md:flex items-center">
              <Link href="https://docs.connectramp.com" target="_blank" className="hover:text-primary dark:hover:text-red-400">
                API Documentation
              </Link>
              <Link href="#" className="hover:text-primary dark:hover:text-red-400">
                Integration Support
              </Link>

              <div className="flex items-center gap-2 leading-[40px] border-x border-[#C4C4C452] dark:border-gray-600 px-6">
                {isLiveMode ? 'Live Mode' : 'Test Mode'}
                <Switch
                  id="live-mode-switch"
                  enabled={isLiveMode}
                  onChange={toggleMode}
                  containerClassName={isLiveMode ? "bg-[#2BD325]" : "bg-[#FFA500]"}
                  contentClassName="size-1.5 ml-0.5"
                />
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <Link href="/settings" className="block">
                <div className="relative w-[50px] h-[40px] overflow-hidden bg-[#DC143C1A] rounded">
                  <Image
                    src={avatar ? avatar : "/images/dashboard/avatar2.svg"}
                    alt="Profile Picture"
                    width={50}
                    height={40}
                    className="absolute inset-0 w-full h-full object-cover"
                    sizes="(max-width: 640px) 50px"
                  />
                </div>
              </Link>

              <Icon
                name={showSidebar ? "close-menu" : "hamburger"}
                className="lg:hidden"
                onClick={() => setShowSidebar(!showSidebar)}
              />

              <div
                className="hidden lg:flex items-center gap-1 cursor-pointer"
                onClick={() =>
                  setState({
                    ...state,
                    showProfileMenu: !state.showProfileMenu,
                  })
                }
              >
                <div className="flex flex-col text-[#DC143C]">
                  {/* <span className="text-base font-semibold">
                    {capitalizeFirstLetter(business_name)}
                  </span> */}
                  <span className="text-xs font-bold">
                    {capitalizeFirstLetterOfEachWord(firstname + " " + lastname)}
                  </span>
                </div>
                <Icon name="caretDown" className="text-[#DC143C]" />
              </div>
            </div>

            <div className="hidden md:block">
              <Dropdown
                onOpen={state.showProfileMenu}
                onClose={closeDropdown}
                className="shadow-lg w-[230px] fixed z-10 right-8 top-[63px] dark:bg-[#121212] bg-white dark:border-gray-700 dark:text-[#EFF7FE]"
              >
                <ul className="list-none space-y-6">
                  <li className="cursor-pointer">
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 text-xs font-medium cursor-pointer hover:text-primary"
                    >
                      <Icon name="settings2" className="flex" color="#DC143C" />
                      <span>Account Settings</span>
                    </Link>
                  </li>
                  <li className="cursor-pointer">
                    <Link
                      href="/activity-log"
                      className="flex items-center gap-3 text-xs font-medium cursor-pointer hover:text-primary"
                    >
                      <Icon name="activityLog" className="flex" color="#DC143C" />
                      <span>Activity Log</span>
                    </Link>
                  </li>
                  <li
                    className="flex items-center gap-3 text-xs font-medium cursor-pointer hover:text-primary"
                    onClick={handleLogOut}
                  >
                    <Icon name="signout" className="flex text-[#FD2727]" />
                    <span>Sign out</span>
                  </li>
                </ul>
              </Dropdown>
            </div>

            {/* <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {theme === "dark" ? (
                <Icon name="sun" className="size-6 text-[#EFF7FE]" />
              ) : (
                <Icon name="moon" className="size-6 text-[#DC143C]" />
              )}
            </button> */}
          </div>
        </div>
      </header>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div>
          <h6 className="font-bold text-2xl quickpayPrimary">
            Return To Old Website
          </h6>
          {/* <p className="font-thin mt-10">
            Would you like to give a feedback of your experience on our
            Beta-testing SuperApp.
          </p> */}
          <Button
            text="Switch To The Old Website"
            ariaLabel="Switch To The Old Website"
            className="mt-10"
            onClick={switchToOldWebsite}
            primary
          />
          {/* <Button
            text="Leave A Feedback"
            ariaLabel="Leave A Feedback"
            className="mt-5"
            onClick={switchToOldWebsite}
            primary
          /> */}
        </div>
      </Modal>
    </>
  );
};

export default Navbar;
