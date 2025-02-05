import Image from "next/image";
import { ReactNode } from "react";
import Icon from "./icon";

interface EmptyStateProps {
  title: string;
  subTitle: string;
  image?: string;
  iconName?: string;
  children?: ReactNode;
}
const EmptyState = ({ title, subTitle, image, iconName, children }: EmptyStateProps) => {
  return (
    <div className="flex flex-col justify-center items-center py-20 bg-white md:m-28 shadow-sm">
      {image ? (
        <Image src={image} width={119} height={119} alt="Empty state image" />
      ) : (
        <Icon name={iconName} size="119" />
      )}
      <p className="font-semibold pt-5">{title}</p>
      <p className="py-5 text-center text-sm">{subTitle}</p>
      {children}
    </div>
  );
};

export default EmptyState;
