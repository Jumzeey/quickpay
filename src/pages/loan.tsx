import React from "react";
import Layout from "@/components/layout";
import ComingSoon from "@/components/coming-soon";
import WebPageTitle from "@/components/WebPageTitle";


const Loan = () => {
  return (
    <Layout pageTitle="Loans" icon="loans">
      <WebPageTitle title="Loans | Sarepay Merchant Portal" />
      <ComingSoon/>
    </Layout>
  );
};

export default Loan;
