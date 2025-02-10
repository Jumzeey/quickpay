import React from "react";
import Image from "next/image";

interface BoxProps {
  imageUrl1: string;
  imageUrl2: string;
  headerText: string;
  descriptionText: string;
  firstItem: string;
  secondItem: string;
  thirdItem?: string;
  fourthItem?: string;
  businessType?: string;
  onClick?: () => void;
}

const BoxComponent: React.FC<BoxProps> = ({
  imageUrl1,
  imageUrl2,
  headerText,
  descriptionText,
  firstItem,
  secondItem,
  thirdItem,
  fourthItem,
  onClick,
}) => {
  interface ListItemWithDotProps {
    text: string;
  }

  const ListItemWithDot: React.FC<ListItemWithDotProps> = ({ text }) => (
    <li className="flex items-center space-x-2">
      <Image
        src="/images/black-dot.svg"
        alt="Dot"
        width={6}
        height={6}
        priority
      />
      <p className="text-gray-200 text-sm">{text}</p>
    </li>
  );

  return (
    <div
      onClick={onClick}
      className="relative flex items-center justify-between p-5 bg-[#141414]/70 rounded-lg shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
    >
      {/* Left Image */}
      <div className="flex-shrink-0 w-16 h-16">
        <Image
          src={imageUrl1}
          alt={headerText}
          width={64}
          height={64}
          className="rounded-full"
          priority
        />
      </div>

      {/* Content */}
      <div className="flex-1 px-5">
        <h6 className="text-lg font-semibold text-white">{headerText}</h6>
        <p className="text-gray-300 text-sm mb-3">{descriptionText}</p>
        <ul className="space-y-1">
          <ListItemWithDot text={firstItem} />
          <ListItemWithDot text={secondItem} />
          {thirdItem && <ListItemWithDot text={thirdItem} />}
          {fourthItem && <ListItemWithDot text={fourthItem} />}
        </ul>
      </div>

      {/* Right Icon */}
      <div className="flex-shrink-0 w-6 h-6">
        <Image
          src={imageUrl2}
          alt={headerText}
          width={24}
          height={24}
          priority
        />
      </div>
    </div>
  );
};

export default BoxComponent;
