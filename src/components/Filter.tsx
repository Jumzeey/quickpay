import { DateRangePicker } from "react-date-range";
import Button from "./button";
import useFilter from "@/stores/useFilter";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface FilterProps {
  filterCallback: Function;
}

const Filter: React.FC<FilterProps> = ({ filterCallback}) => {
  const { handleDateChange, selectionRange, toggleFilter, handleReset } =
    useFilter();

  const handleFilter = async () => {
    toggleFilter();
    await filterCallback(selectionRange);
  };

  const resetFilter = () => {
    handleReset();
    filterCallback({});
  };

  return (
    <div className="">
      <DateRangePicker
        onChange={handleDateChange}
        moveRangeOnFirstSelection={false}
        months={1}
        ranges={[selectionRange]}
        direction="horizontal"
        color="#000"
        rangeColors={["#164988"]}
      />

      <div className="flex justify-end items-center gap-5">
        <Button
          text="Reset"
          ariaLabel="Reset"
          onClick={resetFilter}
          small
          primary
        />
        <Button
          text="Filter"
          ariaLabel="Filter"
          onClick={handleFilter}
          small
          primary
        />
      </div>
    </div>
  );
};

export default Filter;
