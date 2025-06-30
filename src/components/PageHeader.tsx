type ComponentProps = {
    title: string;
    description?: string;
    className?: string;
}

const PageHeader = ({ title, description, className }: ComponentProps) => {
    return (
        <>
            <h2 className="text-lg font-extrabold">{title}</h2>
            {description && (
                <p className={"text-[13px] tracking-wide font-medium mt-1 mb-8 text-[#7F7F7F]" + (className ? ` ${className}` : "")}>
                    {description}
                </p>
            )}
        </>
    );
};

export default PageHeader;
