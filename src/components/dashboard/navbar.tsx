import { useState } from "react";
import Image from "next/image";
import useAuthentication from "@/stores/useAuthentication";
import { capitalizeFirstLetter } from "@/util/utils";
import Icon from "../icon";
import Link from "next/link";
import Dropdown from "../Dropdown";
import { handleLogOut } from "@/util/utils";
import Button from "../button";
import Modal from "../modal";
import env from "@/config/env";

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
  const { business_name, firstname, avatar } = useAuthentication().user || {};
  const { oldUrl } = env;
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
      <header className="fixed md:right-0 lg:left-[250px] z-10 bg-white w-full lg:w-auto">
        <div className="h-auto flex px-6 py-4 md:py-3 items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name={icon} color="#164988" size="20" />
            <div className="text-lg text-primary font-semibold">
              {pageTitle}
            </div>
          </div>

          <div> 
            <p onClick={openModal} className="underline text-sm sarepayPrimary lg:text-base cursor-pointer">
              Switch To The Old Dashboard
            </p>
          </div>

          <div className="flex items-center cursor-pointer">
            <div className="flex gap-5 items-center">
              <Link href="/settings" className="hidden md:block">
                <div className="relative w-11 h-11 overflow-hidden rounded-[50%]">
                  <Image
                    src={avatar ? avatar : "/images/dashboard/avatar.svg"}
                    alt="Profile Picture"
                    layout="fill"
                    className="absolute inset-0 w-full h-full object-cover"
                    sizes="(max-width: 640px) 50px, (max-width: 768px) 60px, 80px"
                  />
                </div>
              </Link>

              <Icon
                name={showSidebar ? "close-menu" : "hamburger"}
                className="lg:hidden"
                onClick={() => setShowSidebar(!showSidebar)}
              />

              <div
                className="hidden lg:flex items-center gap-5"
                onClick={() =>
                  setState({
                    ...state,
                    showProfileMenu: !state.showProfileMenu,
                  })
                }
              >
                <div className="flex flex-col">
                  <span className="text-base font-semibold">
                    {capitalizeFirstLetter(business_name)}
                  </span>
                  <span className="text-sm">
                    Welcome back,&nbsp;
                    <span className="text-primary font-semibold">
                      {capitalizeFirstLetter(firstname)}
                    </span>
                  </span>
                </div>
                <Icon name="caret-down" className="flex" />
              </div>
            </div>

            <div className="hidden md:block">
              {
                <Dropdown
                  onOpen={state.showProfileMenu}
                  onClose={closeDropdown}
                  className="shadow-lg w-[230px] fixed z-10 right-5 top-[63px]"
                >
                  <ul className="list-none p-0">
                    <li
                      className="flex items-center gap-3 text-xs font-medium cursor-pointer hover:text-primary"
                      onClick={handleLogOut}
                    >
                      <Icon name="logout" className="flex" color="#164988" />
                      <span>Log Out</span>
                    </li>
                  </ul>
                </Dropdown>
              }
            </div>
          </div>
        </div>
      </header>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div>
          <h6 className="font-bold text-2xl sarepayPrimary">
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
