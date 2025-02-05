import Head from "next/head";

interface ComponentProps {
  title: string;
}
const WebPageTitle = ({ title }: ComponentProps) => {
  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content="Manage your business, create virtual accounts and payment links" key="title" />
      </Head>
    </div>
  );
};
export default WebPageTitle;
