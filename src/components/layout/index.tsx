import React, { ReactNode, useState } from "react";
import Navbar from "../dashboard/navbar";
import NoSSR from "../noSSR";
import Sidebar from "../sidebar";

interface DashboardLayoutProps {
  pageTitle: string;
  icon: string;
  children: ReactNode;
}

const Layout: React.FC<DashboardLayoutProps> = ({
  pageTitle,
  icon,
  children,
}) => {
  const [showSidebar, setShowSidebar] = useState(false);
  return (
    <NoSSR>
      <div className="min-h-screen">
        <Navbar
          pageTitle={pageTitle}
          icon={icon}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
        />

        <div className="flex">
          <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
          <div className="overflow-y-scroll w-full pt-8 pb-10 mt-16 md:ml-[235px] px-5 md:px-7 bg-white dark:bg-[#121212] min-h-screen">
            {children}
          </div>
        </div>
      </div>
    </NoSSR>
  );
};

export default Layout;
