import Icon from "./icon";

type ReferenceSearchProps = {
    placeholder?: string;
    value?: string;
    handleParamsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClear?: () => void;
};
export function ReferenceSearch({ placeholder, value, handleParamsChange, onClear }: ReferenceSearchProps) {
    return (
        <div className="relative w-full md:w-min">
            <input
                type="text"
                id="searchInput"
                name="searchInput"
                value={value}
                placeholder={placeholder || "Search Reference Number..."}
                onChange={handleParamsChange}
                className="h-[60px] w-full md:w-[376px] outline-none bg-[#D9D9D90D] font-medium border border-[#C4C4C43D] text-[#7F7F7F] text-sm px-3 rounded-md"
            />
            {value && onClear ? (
                <Icon
                    name="close-menu"
                    onClick={onClear}
                    className="absolute top-[35%] right-4 size-4 text-[#7F7F7F] cursor-pointer"
                />
            ) : (
                <Icon name="search" className="absolute top-[35%] right-4 size-5 text-[#7F7F7F]" />
            )}
        </div>
    )
}