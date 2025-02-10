import React, { useState, ReactNode } from "react";
import Navbar from "../dashboard/navbar";
import Sidebar from "../sidebar";
import NoSSR from "../noSSR";

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
        <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
        <div className="lg:ml-[250px] h-screen overflow-y-scroll pt-24 pb-10 px-5 md:px-7 bg-[#F2F3F5]">
          {children}
        </div>
      </div>
    </NoSSR>
  );
};

export default Layout;
