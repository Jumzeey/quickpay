interface CollectionProps {
  key1: string;
  value1: string;
  key2: string;
  value2: string;
  key3: string;
  value3: string;
  key4?: string;
  value4?: string;
  key5?: string;
  value5?: string;
}
const CollectionDetails = ({
  key1,
  value1,
  key2,
  value2,
  key3,
  value3,
  key4,
  value4,
  key5,
  value5,
}: CollectionProps) => {
  return (
    <div>
      <div className="flex flex-col gap-y-2 pb-7">
        <span className="text-xs text-grey-300 font-semibold">{key1}</span>
        <span className="text-sm font-medium">{value1}</span>
      </div>

      <div className="flex flex-col gap-y-2 pb-7">
        <span className="text-xs text-grey-300 font-semibold">{key2}</span>
        <span className="text-sm font-medium">{value2}</span>
      </div>

      <div className="flex flex-col gap-y-2 pb-7">
        <span className="text-xs text-grey-300 font-semibold">{key3}</span>
        <span className="text-sm font-medium">{value3}</span>
      </div>

      <div className="flex flex-col gap-y-2 pb-7">
        <span className="text-xs text-grey-300 font-semibold">{key4}</span>
        <span className="text-sm font-medium">{value4}</span>
      </div>

      <div className="flex flex-col gap-y-2">
        <span className="text-xs text-grey-300 font-semibold">{key5}</span>
        <span className="text-sm font-medium">{value5}</span>
      </div>
    </div>
  );
};

export default CollectionDetails;
