import Layout from "@/components/layout";
import Image from "next/image";
import { useRouter } from "next/router";
import AddPaymentLink from "@/components/collections/AddPaymentLink";
import WebPageTitle from "@/components/WebPageTitle";
const CreatePaymentLink = () => {
  const router = useRouter();

  return (
    <Layout pageTitle="Create Payment Link" icon="link">
      <WebPageTitle title="Create Payment Link | Cray Merchant Portal" />
      <Image
        src="/images/arrow-back.svg"
        className="cursor-pointer"
        width={36}
        height={36}
        onClick={() => router.back()}
        alt="back icon"
      />
      <AddPaymentLink createLink />
    </Layout>
  );
};

export default CreatePaymentLink;
