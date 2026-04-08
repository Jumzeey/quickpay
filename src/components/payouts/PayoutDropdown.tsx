import { useState, useEffect, useRef, useMemo } from "react";
import Icon from "@/components/icon";
import { useModuleAccess } from "@/hooks/useModuleAccess";

type PayoutType = "single" | "bulk";

const PAYOUT_OPTIONS_BASE: { value: PayoutType; label: string }[] = [
  { value: "single", label: "Single Payout" },
  { value: "bulk", label: "Bulk Payout" },
];

type PayoutDropdownProps = {
  onSelectSingle: () => void;
  onSelectBulk: () => void;
  className?: string;
  contentClassName?: string;
};

export default function PayoutDropdown({
  onSelectSingle,
  onSelectBulk,
  className = "",
  contentClassName = "",
}: PayoutDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasSinglePayout = useModuleAccess("payout", "single-payout");
  const hasBulkPayout = useModuleAccess("payout", "bulk-payout");

  const payoutOptions = useMemo(() => {
    return PAYOUT_OPTIONS_BASE.filter((opt) =>
      opt.value === "single" ? hasSinglePayout : hasBulkPayout
    );
  }, [hasSinglePayout, hasBulkPayout]);

  const handleSelect = (value: PayoutType) => {
    if (value === "single") onSelectSingle();
    else onSelectBulk();
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full md:w-60 ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`flex justify-between items-center w-full h-12 rounded px-4 bg-[#005BB01A] text-[#005BB0] font-bold text-sm ${contentClassName}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Payout options"
      >
        <span>Payout</span>
        <Icon name="caretDown" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white text-black rounded-lg border border-grey-200 shadow-lg">
          <ul className="py-1">
            {payoutOptions.map((option) => (
              <li
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className="px-4 py-2 text-sm font-medium cursor-pointer hover:bg-[#005BB01A]"
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
