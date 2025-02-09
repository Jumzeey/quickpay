import React from "react";
import Layout from "@/components/layout";
import ComingSoon from "@/components/coming-soon";
import WebPageTitle from "@/components/WebPageTitle";

const Ecommerce = () => {
  return (
    <Layout pageTitle="E-commerce" icon="ecommerce">
      <WebPageTitle title="E-commerce | Ramp Merchant Portal" />
      <ComingSoon />
    </Layout>
  );
};

export default Ecommerce;
