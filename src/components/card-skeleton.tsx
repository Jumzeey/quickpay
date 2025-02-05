import { Fragment } from "react";
import Card from "./Card";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const CardSkeleton: React.FC<{}> = () => {
  return (
    <Fragment>
      <Card>
        <div className="flex flex-col sm:flex-row justify-between pb-5">
          <div className="w-full sm:w-[350px]">
            <Skeleton className="!rounded-lg w-full sm:w-[350px]" height={40} />
          </div>
          <div className="flex gap-3 w-full sm:w-auto mt-5 sm:mt-0">
            <Skeleton className="!rounded-lg w-full sm:w-[120px]" height={40} />
          </div>
        </div>
        <div className="pt-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-2.5 mb-7" />
          ))}
        </div>
      </Card>
    </Fragment>
  );
};

export default CardSkeleton;
