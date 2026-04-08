import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import Icon from "./icon";
import { useState } from "react";

const links = [
  {
    id: 1,
    title: "Home",
    href: "/",
  },
  {
    id: 2,
    title: "About Us",
    href: "/about",
  },
  {
    id: 3,
    title: "Developers",
    href: "/developers",
  },
  {
    id: 4,
    title: "Security",
    href: "/security",
  },
  {
    id: 5,
    title: "FAQ",
    href: "/faq",
  },
  {
    id: 6,
    title: "Contact Us",
    href: "/contact",
  },
];

const Header = () => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <header
      className={`fixed left-0 right-0 top-0 bg-white z-10 lg:flex items-center gap-3 lg:gap-6 justify-between lg:justify-around py-3 pt-5 px-4 lg:px-0 shadow-sm ${
        isOpen ? "h-screen" : "h-auto"
      }`}
    >
      <div className="flex justify-between items-center">
        <Link href="/">
          <Image
            src="/images/logo.png"
            width={169}
            height={42}
            alt="Logo"
            priority
          />
        </Link>

        <Icon
          name={isOpen ? "close-menu" : "hamburger"}
          className="cursor-pointer lg:hidden"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      <ul
        className={`lg:flex justify-center gap-10 ${
          isOpen ? "flex flex-col items-center pt-14" : "hidden"
        }`}
      >
        {links.map(link => (
          <li
            key={link.id}
            className={`text-sm font-semibold text-[#1C192D] hover:text-primary ${
              router.pathname === link.href
                ? "text-primary underline-animation"
                : "landing-page-hover"
            }`}
          >
            <Link href={link.href}>{link.title}</Link>
          </li>
        ))}
      </ul>

      <div
        className={`flex justify-center items-center gap-3 ${
          isOpen ? "pt-10" : "hidden lg:flex"
        }`}
      >
        <Link
          href={`${process.env.NEXT_PUBLIC_APP_URL}/onboarding/sign-in`}
          target="_blank"
        >
          <button className="border border-primary h-[40px] text-primary hover:bg-primary hover:text-white rounded-lg text-sm cursor-pointer px-7">
            Login
          </button>
        </Link>

        <Link
          href={`${process.env.NEXT_PUBLIC_APP_URL}/onboarding/join-us`}
          target="_blank"
        >
          <button className="bg-primary h-[40px] text-white rounded-lg text-sm cursor-pointer px-7">
            Sign Up
          </button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
