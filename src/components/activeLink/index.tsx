import { withRouter } from "next/router";
import Link from "next/link";
import Icon from "../icon";
import useAuthentication from "@/stores/useAuthentication";

interface ActiveLinkProps {
  router: any;
  href: string;
  icon: string | undefined;
  title: string;
}

const ActiveLink = ({ router, href, icon, title }: ActiveLinkProps) => {
  const isActive = router.pathname === href;

  return (
    <div className="flex items-center justify-between pr-0.5">
      <Link
        href={href}
        className={`flex items-center gap-3 px-2.5 py-2.5 w-full ${
          isActive
            ? "text-[#DC143C] dark:text-white"
            : "text-[#090727] dark:text-[#EFF7FE] hover:text-[#DC143C]"
        }`}
      >
        <Icon
          name={icon}
          color={isActive ? "#DC143C" : "#090727"}
          className="flex items-center"
        />
        <span className="mt-0.5 font-semi-bold text-sm">{title}</span>
      </Link>
      {/* {isActive && <div className="w-[6px] h-10 bg-primary rounded-[40px]"></div>} */}
    </div>
  );
};

export default withRouter(ActiveLink);
