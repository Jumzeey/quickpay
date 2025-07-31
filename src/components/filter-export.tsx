import Icon from "@/components/icon";
import { MouseEventHandler } from "react";

type FilterExportProps = {
    showFilter?: boolean;
    showExport?: boolean;
    filterIconPosition?: "left" | "right";
    exportIconPosition?: "left" | "right";
    exportText?: string;
    exportIconName?: string;
    toggleFilter?: MouseEventHandler<HTMLButtonElement>;
    handleExport?: MouseEventHandler<HTMLButtonElement>;
}

export function FilterExport(params: FilterExportProps) {
    const {
        showFilter = true,
        showExport = true,
        filterIconPosition = "right",
        exportIconPosition = "right",
        exportText,
        exportIconName,
        toggleFilter,
        handleExport
    } = params;

    const filterIcon = <Icon name="filter" className="size-4 text-[#7F7F7F]" />;
    const exportIcon = <Icon name={exportIconName || "export"} className="size-4 text-[#7F7F7F]" />;

    return (
        <div className="flex flex-row md:items-center justify-between gap-4 mt-5 md:mt-0">
            {showFilter && (
                <button
                    onClick={toggleFilter}
                    aria-label="Filter by date"
                    className="flex items-center justify-center gap-3.5 bg-[#D9D9D91A] border border-[#C4C4C452] rounded-md text-xs md:text-sm font-medium text-[#7F7F7F] py-2 w-1/2 md:w-auto min-w-[112px] px-5 h-[60px] md:h-full"
                >
                    {filterIconPosition === "left" && filterIcon}
                    Filter By Date
                    {filterIconPosition === "right" && filterIcon}
                </button>
            )}
            {showExport && (
                <button
                    onClick={handleExport}
                    className="flex items-center justify-center gap-3.5 bg-[#D9D9D91A] border border-[#C4C4C452] rounded-md text-xs md:text-sm font-medium text-[#7F7F7F] py-2 w-1/2 md:w-auto min-w-[112px] px-5 h-[60px] md:h-full"
                >
                    {exportIconPosition === "left" && exportIcon}
                    {exportText || "Export"}
                    {exportIconPosition === "right" && exportIcon}
                </button>
            )}
        </div>
    )
}