import useScreenWidth from "@/hooks/useScreenWidth";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Card from "./Card";

const TableSkeleton: React.FC<{
  singleButton?: boolean;
}> = ({ singleButton }) => {
  const screenWidth = useScreenWidth();
  return (
    <Card>
      <div className="flex flex-col md:flex-row justify-between pb-5">
        <div>
          <Skeleton width={screenWidth < 700 ? 200 : 350} className="!rounded-lg" height={40} />
        </div>

        <div className="flex gap-3 mt-3 md:mt-3">
          <Skeleton width={120} className="!rounded-lg" height={40} />
          {!singleButton && (
            <Skeleton width={120} className="!rounded-lg" height={40} />
          )}
        </div>
      </div>

      <div className="pt-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton key={index} className="h-2.5 mb-7" />
        ))}
      </div>
    </Card>
  );
};

export default TableSkeleton;
