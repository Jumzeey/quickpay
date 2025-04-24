import EmptyState from '@/components/EmptyState';
import Layout from '@/components/layout';
import WebPageTitle from '@/components/WebPageTitle';
import React from 'react';

const Chargebacks = () => {
  return (
    <Layout pageTitle='Chargebacks' icon='disbursement'>
      <WebPageTitle title='Chargebacks | Ramp Merchant Portal' />
      <EmptyState
        title='No Chargebacks Found'
        subTitle="You don't have any chargebacks yet."
        image='/images/dashboard/disbursement/disbursement-empty-state.svg'
      />
    </Layout>
  );
};

export default Chargebacks;
