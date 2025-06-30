type ComponentProps = {
    tabs: {
        title: string;
        value: string
        isActive: boolean;
    }[];
    onTabClick: (value: string) => void;
    className?: string;
}

const TabButton = ({ tabs, onTabClick, className }: ComponentProps) => {
    return (
        <div className={`flex items-center border border-[#C4C4C429] p-1 rounded w-max ${className || ''}`}>
            {tabs.map((tab, index) => (
                <button
                    key={index}
                    onClick={() => onTabClick(tab.value)}
                    className={`h-10 px-5 rounded font-medium flex items-center text-center text-[13px] cursor-pointer ${tab.isActive ? 'bg-[#EFF7FE] text-primary' : 'bg-transparent text-[#090727] '}`}
                >
                    {tab.title}
                </button>
            ))}
        </div>
    );
};

export default TabButton;


