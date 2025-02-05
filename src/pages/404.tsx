import Footer from "@/components/Footer";
import Header from "@/components/Header";
import WebPageTitle from "@/components/WebPageTitle";
import Image from "next/image";
import Link from "next/link";

const Page404 = () => {
    return (
        <>
            <WebPageTitle title="Page Not Found | Sarepay Merchant Portal" />
            <div className="Poppins-Regular">
                <Header />
                <section className="mx-20 mt-60 mb-40 flex justify-center">
                    <div>
                        <div>
                            <Image
                                src="/images/404.svg"
                                alt="404 Images"
                                width={800}
                                height={800}
                                priority
                            />
                        </div>
                        <div className="text-center mt-20">
                        <h1 className="font-bold text-xl md:text-6xl">404 - Page Not Found</h1>
                        <p className="pt-5">Sorry, the page you are looking for does not exist.</p>
                        </div>
                        <div className="flex justify-center mt-5 underline cursor">
                            <Image
                                src="/images/back-arrow.svg"
                                alt="404 Images"
                                width={20}
                                height={20}
                                priority
                            />
                            <Link href="/">Go Home</Link>
                        </div>
                    </div>
                </section>
                <Footer />
            </div>
        </>
    );
};

export default Page404;
