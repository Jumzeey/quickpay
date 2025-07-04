import Link from "next/link";

export function AuthFooter() {
    return (
        <div className="mt-8 text-center font-medium text-[13px] text-[#7F7F7F]">
            <div className="flex justify-center space-x-2 py-3 bg-[#F6F4F4] rounded">
                <Link href="/privacy-policy" className="hover:text-gray-700">
                    Privacy policy
                </Link>
                <span>and</span>
                <Link href="/terms-of-service" className="hover:text-gray-700">
                    Terms of service
                </Link>
            </div>
            <p className="py-3 bg-[#F6F4F4] rounded-b mx-auto w-1/2">
                Copyright © {new Date().getFullYear()} Ramp.
            </p>
        </div>
    )
}