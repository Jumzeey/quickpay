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
        className={`flex items-center gap-3 px-2.5 py-2.5 ${
          isActive
            ? "bg-primary text-white w-[89%] rounded-lg"
            : "text-[#696969] w-full hover:bg-[#8db6ec] hover:bg-opacity-10 hover:rounded-lg hover:w-[89%]"
        }`}
      >
        <Icon
          name={icon}
          color={isActive ? "#164988" : "#a4b0c3"}
          className="flex items-center"
        />
        <span className="mt-0.5 font-semi-bold text-sm">{title}</span>
      </Link>
      {/* {isActive && <div className="w-[6px] h-10 bg-primary rounded-[40px]"></div>} */}
    </div>
  );
};

export default withRouter(ActiveLink);
