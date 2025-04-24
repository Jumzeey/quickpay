import React, { useLayoutEffect, useRef, Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import ActiveLink from "../activeLink";
import { disputes, sidebarLinks } from "@/constants";
import Icon from "../icon";
import { useRouter } from "next/router";
import {
  yourBusiness,
  disbursement,
  collections,
  eCommerce,
  product,
} from "@/constants";
import { useState } from "react";
import { handleLogOut } from "@/util/utils";

interface ComponentProps {
  showSidebar: boolean;
  setShowSidebar: (visibility: boolean) => void;
}

interface StateProps {
  activeSidebar: any[];
  subLinksTitle: string;
}

const Sidebar = ({ showSidebar, setShowSidebar }: ComponentProps) => {
  const [state, setState] = useState<StateProps>({
    activeSidebar: sidebarLinks,
    subLinksTitle: "",
  });
  const router = useRouter();
  const bgRef = useRef<HTMLDivElement>(null);

  const renderSidebarMenu = () => {
    switch (true) {
      case router.pathname.includes("/your-business"):
        setState({
          ...state,
          activeSidebar: yourBusiness,
          subLinksTitle: "Business Information",
        });
        break;

      case router.pathname.includes("/e-commerce"):
        setState({
          ...state,
          activeSidebar: eCommerce,
          subLinksTitle: "E-Commerce",
        });
        break;
      case router.pathname.includes("/disputes"):
        setState({
          ...state,
          activeSidebar: disputes,
          subLinksTitle: "Disputes",
        });
        break;

      case router.pathname.includes("/e-commerce/product"):
        setState({
          ...state,
          activeSidebar: product,
          subLinksTitle: "Product",
        });
        break;

      case router.pathname.includes("/disbursements"):
        setState({
          ...state,
          activeSidebar: disbursement,
          subLinksTitle: "Disbursement History",
        });
        break;

      case router.pathname.includes("/collections"):
        setState({
          ...state,
          activeSidebar: collections,
          subLinksTitle: "Pay Ins",
        });
        break;

      default:
        setState({
          ...state,
          activeSidebar: sidebarLinks,
          subLinksTitle: "",
        });
        break;
    }
  };

  useLayoutEffect(() => {
    renderSidebarMenu();
  }, []);

  return (
    <Fragment>
      {!showSidebar && (
        <div
          className="absolute left-0 top-0 z-9 h-screen w-screen md:h-0 md:w-0"
          onClick={() => setShowSidebar(false)}
        ></div>
      )}
      <aside
        className={`lg:flex flex-col fixed h-screen bg-[#fff] min-h-screen overflow-x-hidden pl-3 pt-2 w-[250px] ease-in-out duration-500 top-0 z-10 shadow-lg ${
          showSidebar ? "flex" : "hidden"
        }`}
        ref={bgRef}
      >
        {
          <ul className="flex flex-col list-none px-0">
            <li className="mb-3.5 font-semibold">
              <Link href="/dashboard">
                <Image
                  src="/images/ramp-logo.svg"
                  alt="RampLogo"
                  className="mt-3"
                  width={130}
                  height={29}
                  priority
                />
              </Link>
            </li>

            <li className="mt-10 mr-2">
              <div>
                {state.activeSidebar !== sidebarLinks && (
                  <>
                    <div
                      className="flex items-center gap-3 pt-5 pb-10 cursor-pointer"
                      onClick={() => router.push("/dashboard")}
                    >
                      <Icon name="grey-arrow" />
                      <span className="text-[#a4b0c3] text-sm">Main Menu</span>
                    </div>

                    <p className="text-base text-primary pb-7 font-semibold">
                      {state.subLinksTitle}
                    </p>
                  </>
                )}
                <ul>
                  {state.activeSidebar.map((item, idx) => {
                    const { href, icon, title } = item;
                    return (
                      <li key={idx} className="mb-7 font-medium">
                        <ActiveLink href={href} icon={icon} title={title} />
                      </li>
                    );
                  })}
                  <div className="pr-0.5 md:hidden" onClick={handleLogOut}>
                    <li className="flex gap-3 mb-7 font-medium px-2.5 py-2.5">
                      <Icon name="logout" color="#a4b0c3" />
                      <span className="mt-0.5 font-semi-bold text-sm text-[#a4b0c3]">
                        Log Out
                      </span>
                    </li>
                  </div>
                </ul>
              </div>
            </li>
          </ul>
        }
      </aside>
    </Fragment>
  );
};

export default Sidebar;
