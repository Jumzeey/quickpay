import Link from "next/link";
import Image from "next/image";
import Icon from "./icon";
const Footer = () => {
  return (
    <footer className="bg-[url('/images/features-bg.svg')] bg-cover bg-no-repeat text-white">
      <div className="flex flex-wrap justify-start xl:justify-around py-16 gap-10 xl:gap-5 px-10 xl:px-[161px]">
        <div>
          <Link href="/dashboard">
            <Image
              src="/images/quickpay-logo.svg"
              alt="QuickPayLogo"
              className="mt-3"
              width={127}
              height={29}
              placeholder="blur"
              blurDataURL={"/images/quickpay-logo.svg"}
            />
          </Link>
          <p className="text-sm md:w-[339px] font-medium leading-6 mt-5">
            QuickPay redefines your business by enabling you to make and accept
            fast, seamless payments. Experience efficient and secure
            transactions that elevate your business operations. 
            <Link className="underline" href="/onboarding/join-us">
              Sign up now!
            </Link>
          </p>
        </div>
        <div>
          <ul className="text-sm list-none leading-10 p-0 m-0">
            <li className="Poppins-Semibold pb-2">Developers</li>
            <Link href="#">
              <li>Overview</li>
            </Link>
            <Link href="#">
              <li>Documentation</li>
            </Link>

            <Link href="/developers">
              <li>Integrations</li>
            </Link>
          </ul>
        </div>
        <div>
          <ul className="text-sm list-none leading-10 p-0 m-0">
            <li className="Poppins-Semibold pb-2">Support</li>
            <Link href="/faq">
              <li>FAQ</li>
            </Link>
            <Link href="/contact">
              <li>Contact Us</li>
            </Link>
          </ul>
        </div>
        <div>
          <ul className="text-white text-sm list-none leading-10 p-0 m-0">
            <li className="Poppins-Semibold pb-2">Information</li>
            <Link href="/about">
              <li>About</li>
            </Link>

            <Link href="/careers">
              <li>Careers</li>
            </Link>
          </ul>
        </div>
        <div>
          <ul className="text-white text-sm list-none leading-10 p-0 m-0">
            <li className="Poppins-Semibold pb-2">Legal</li>
            <Link href="/privacy-policy">
              <li>Privacy Policy</li>
            </Link>

            <Link href="/terms-and-conditions">
              <li>Terms & Conditions</li>
            </Link>
          </ul>
        </div>
      </div>
      <div className="px-10 py-6">
        <div className="flex justify-between border-t-2 border-white pt-6">
          <p className="text-sm text-white font-medium">
            &copy; {new Date().getFullYear()} QuickPay. All Rights Reserved
          </p>
          <div>
            <Link href="#top">
              <div className="flex items-center gap-2">
                <Icon name="caret-top" className="flex" />
                <p className="text-sm text-white font-medium">Back to Top</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
