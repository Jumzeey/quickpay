type ComponentProps = {
    title: string;
    description?: string;
}

const PageHeader = ({ title, description }: ComponentProps) => {
    return (
        <>
            <h2 className="text-lg font-extrabold">{title}</h2>
            {description && (
                <p className="text-[13px] tracking-wide font-medium mt-1 mb-8 text-[#7F7F7F]">
                    {description}
                </p>
            )}
        </>
    );
};

export default PageHeader;
