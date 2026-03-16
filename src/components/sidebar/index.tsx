import { sidebarLinks } from "@/constants";
import { handleLogOut } from "@/util/utils";
import { useRouter } from "next/router";
import { Fragment, useRef, useState } from "react";
import ActiveLink from "../activeLink";
import Icon from "../icon";

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

  // Sidebar menu items (no module filtering; all items visible)
  // switch (true) {
    //   case router.pathname.includes("/your-business"):
    //     setState({
    //       ...state,
    //       activeSidebar: yourBusiness,
    //       subLinksTitle: "Business Information",
    //     });
    //     break;

    //   case router.pathname.includes("/e-commerce"):
    //     setState({
    //       ...state,
    //       activeSidebar: eCommerce,
    //       subLinksTitle: "E-Commerce",
    //     });
    //     break;
    //   case router.pathname.includes("/disputes"):
    //     setState({
    //       ...state,
    //       activeSidebar: disputes,
    //       subLinksTitle: "Disputes",
    //     });
    //     break;

    //   case router.pathname.includes("/e-commerce/product"):
    //     setState({
    //       ...state,
    //       activeSidebar: product,
    //       subLinksTitle: "Product",
    //     });
    //     break;

    //   // case router.pathname.includes("/payouts"):
    //   //   setState({
    //   //     ...state,
    //   //     activeSidebar: payout,
    //   //     subLinksTitle: "Pay out History",
    //   //   });
    //   //   break;

    //   case router.pathname.includes("/collections"):
    //     setState({
    //       ...state,
    //       activeSidebar: collections,
    //       subLinksTitle: "Pay Ins",
    //     });
    //     break;

    //   default:
    //     setState({
    //       ...state,
    //       activeSidebar: sidebarLinks,
    //       subLinksTitle: "",
    //     });
    //     break;
    // }

  return (
    <Fragment>
      {/* {!showSidebar && (
        <div
          className="absolute left-0 top-0 z-9 h-screen w-screen md:h-0 md:w-0"
          onClick={() => setShowSidebar(false)}
        ></div>
      )} */}
      <aside
        className={`fixed top-16 z-20 lg:flex flex-col h-full bg-white dark:bg-[#121212] border-r border-[#C4C4C452] min-h-full overflow-x-hidden w-[235px] ease-in-out duration-500 shadow-lg ${showSidebar ? "flex" : "hidden"
          }`}
        ref={bgRef}
      >
        <ul className="list-none p-0 space-y-5 pt-6 pl-4">
          {/* <li className="mb-3.5 font-semibold">
              <Link href="/dashboard">
                <Image
                  src="/images/cray-logo.svg"
                  alt="Cray Logo"
                  // className="mt-3"
                  width={130}
                  height={29}
                  priority
                />
              </Link>
            </li> */}

          {/* <li className="mt-10 mr-2">
              <div> */}
          {/* {state.activeSidebar !== sidebarLinks && (
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
                )} */}
          {/* <ul className="space-y-6"> */}
          {state.activeSidebar.map((item, idx) => {
            const { href, icon, title } = item;
            return (
              <li key={idx} className="font-medium">
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
          {/* </ul> */}
          {/* </div>
            </li> */}
        </ul>
      </aside>
    </Fragment>
  );
};

export default Sidebar;
