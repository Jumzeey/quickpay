import env from "@/config/env";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "../icon";

export default function OnboardingSidebar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { publicUrl } = env;

  const texts = [
    "<p>Join our leading-edge payment infrastructure solution designed to simplify and secure your financial transactions.</p>",
    "<p>Begin your journey in just three straightforward steps: <br/> Sign up, integrate seamlessly, and securely process payments. <br/> Join us and enjoy a seamless payment experience.</p>",
    "<p>Don't miss out! <br/> Join thousands of satisfied customers who trust Accelerex for their payment collection and payout needs. <br/> Sign up now!</p>",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <div className="w-1/2 p-4 lg:p-20 hidden md:block bg-quickpay">
      <div className="pb-20">
        <Link href={`${publicUrl}/`}>
          <Image
            src="/images/logo.png"
            alt="Accelerex Logo"
            width={127}
            height={29}
            priority
          />
        </Link>
      </div>
      <div className="pb-20 flex justify-end">
        <Image
          src="/images/dot.svg"
          alt="dot-image"
          width={50}
          height={50}
          priority
        />
      </div>
      <div className="mb-2">
        <Icon name="open-quote" color="#fff" />
      </div>
      <div className="carousel">
        <div
          className="carousel-text text-white mt-5 active leading-7 text-sm"
          dangerouslySetInnerHTML={{ __html: texts[currentIndex] }}
        />
      </div>
      <div className="pb-20 flex justify-end mt-20">
        <Image
          src="/images/curve.svg"
          alt="curve-image"
          width={30}
          height={30}
          priority
        />
      </div>
    </div>
  );
}
