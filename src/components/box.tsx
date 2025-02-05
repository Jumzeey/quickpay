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
  onClick
}) => {
  interface ListItemWithDotProps {
    text: string;
  }

  const ListItemWithDot: React.FC<ListItemWithDotProps> = ({ text }) => (
    <li className="flex items-center mb-1">
      <Image
        src="/images/black-dot.svg"
        alt="Dot"
        width={5}
        height={5}
        priority
      />
      <p className="ml-2 font-thin text-sm">{text}</p>
    </li>
  );

  return (
    <div onClick={onClick} className="box-container flex justify-around items-center mt-3 cursor-pointer">
      <div className="w-1/12 mt-2">
        <Image
          src={imageUrl1}
          alt={headerText}
          width={120}
          height={120}
          priority
        />
      </div>
      <div className="w-3/5">
        <h6 className="font-semibold mb-1">{headerText}</h6>
        <p className="font-light text-sm mb-3">{descriptionText}</p>
        <ul>
          <ListItemWithDot text={firstItem} />
          <ListItemWithDot text={secondItem} />
          {thirdItem && <ListItemWithDot text={thirdItem} />}
          {fourthItem && <ListItemWithDot text={fourthItem} />}
        </ul>
      </div>
      <div className="w-1/12 mt-2">
        <Image
          src={imageUrl2}
          alt={headerText}
          width={14}
          height={14}
          priority
        />
      </div>
    </div>
  );
};

export default BoxComponent;
