import React from "react";
import Layout from "@/components/layout";
import ComingSoon from "@/components/coming-soon";
import WebPageTitle from "@/components/WebPageTitle";

const Invoice = () => {
  return (
    <Layout pageTitle="Invoice" icon="invoice">
      <WebPageTitle title="Invoice | Sarepay Merchant Portal" />
      <ComingSoon />
    </Layout>
  );
};

export default Invoice;
