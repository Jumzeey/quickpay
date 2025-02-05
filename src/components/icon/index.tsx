import { MouseEvent } from "react";

interface iconProps {
  name:
    | string
    | {
        [key: number]: string;
      }
    | undefined;
  className?: string;
  color?: string;
  size?: string;
  width?: string;
  height?: string;
  style?: any;
  onClick?: (
    e?: MouseEvent<HTMLSpanElement>
  ) => void | Promise<void> | undefined;
}

const Icon = ({
  name,
  className,
  color,
  size,
  width,
  height,
  onClick,
  style,
  ...restProps
}: iconProps) => {
  if (name === "" || color === "") {
    return null;
  }

  try {
    const Image = require(`./stock/${name}`).default;
    if (Image) {
      return (
        <span className={className} style={style} onClick={onClick}>
          <Image
            aria-label={name}
            color={color}
            size={size}
            width={width}
            height={height}
            {...restProps}
          />
        </span>
      );
    }
    return null;
  } catch (error) {
    return null;
  }
};

export default Icon;
