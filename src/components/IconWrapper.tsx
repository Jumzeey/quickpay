import Image from "next/image";

interface IconWrapperProps {
  src: string;
  alt: string;
  width: number | `${number}` | undefined;
  height: number | `${number}` | undefined;
  className?: string;
}
const IconWrapper: React.FC<IconWrapperProps> = ({
  src,
  alt,
  width,
  height,
  className
}) => {
  return (
    <Image
      src={src}
      className={`cursor-pointer ${className}`}
      alt={alt}
      width={width}
      height={height}
    />
  );
};

export default IconWrapper;
