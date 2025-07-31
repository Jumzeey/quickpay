import Link from "next/link";
import { useRouter } from 'next/router';

type ComponentProps = {
    tabs: {
        title: string;
        link: string;
    }[];
}

const TabHeader = ({ tabs }: ComponentProps) => {
    const router = useRouter()
    const { tab: urlTab } = router.query;
    const tab = urlTab || (tabs.length > 0 ? tabs[0].link.replace('?tab=', '') : '');

    return (
        <div className="h-12 w-auto flex items-center">
            {tabs.map(({ link, title }, index) => {
                const isActive = link === `?tab=${tab}`;
                return (
                    <Link key={index} href={link}>
                        <div className={`flex items-center h-12 px-6 text-xs md:text-sm font-semibold ${isActive ? "text-black border-b-2 border-[#005BB0]" : "text-[#7F7F7F] border-b border-[#C4C4C43D]"}`}>
                            {title}
                        </div>
                    </Link>
                )
            })}
        </div>
    );
};

export default TabHeader;

