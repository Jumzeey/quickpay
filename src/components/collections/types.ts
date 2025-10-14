
interface CardExpiry {
  year: string;
  month: string;
}

interface Card {
  brand: string;
  expiry: CardExpiry;
  issuer: string;
  number: string;
  scheme: string;
  fundingMethod: string;
}

interface SourceOfFunds {
  type: string;
  provided: {
    card: Card;
  };
}

interface ThreeDSCustomizedHtml {
  cReq: string;
  acsUrl: string;
}

interface AuthenticationRedirect {
  html: string;
  domainName: string;
  customizedHtml: {
    '3ds2': ThreeDSCustomizedHtml;
  };
}

interface ThreeDS {
  transactionId: string;
}

interface ThreeDS2 {
  requestorId: string;
  acsReference: string;
  requestorName: string;
  dsTransactionId: string;
  methodSupported: string;
  protocolVersion: string;
  acsTransactionId: string;
  directoryServerId: string;
  transactionStatus: string;
  '3dsServerTransactionId': string;
}

interface Authentication {
  '3ds': ThreeDS;
  '3ds2': ThreeDS2;
  time: string;
  amount: number;
  method: string;
  version: string;
  redirect: AuthenticationRedirect;
  payerInteraction: string;
}

interface ValueTransfer {
  accountType: string;
}

interface Order {
  id: string;
  amount: number;
  status: string;
  currency: string;
  creationTime: string;
  valueTransfer: ValueTransfer;
  lastUpdatedTime: string;
  totalCapturedAmount: number;
  totalRefundedAmount: number;
  authenticationStatus: string;
  merchantCategoryCode: string;
  totalAuthorizedAmount: number;
}

interface Device {
  browser: string;
  ipAddress: string;
}

interface AcquirerInfo {
  merchantId: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  acquirer: AcquirerInfo;
  currency: string;
  authenticationStatus: string;
}

interface GatewayResponse {
  gatewayCode: string;
  gatewayRecommendation: string;
}

interface CollectionGatewayMetaResponse {
  order: Order;
  device: Device;
  result: string;
  version: string;
  merchant: string;
  response: GatewayResponse;
  transaction: Transaction;
  timeOfRecord: string;
  sourceOfFunds: SourceOfFunds;
  authentication: Authentication;
  timeOfLastUpdate: string;
}

interface CollectionsPaginationTypes {
  count: number
  total: number
  per_page: number
  current_page: number
  last_page: number
  next_page_url: string
  previous_page_url?: string
}

interface CollectionsTypes {
  id: number;
  reference: string;
  customer_reference: string;
  amount: string;
  processing_fee: string;
  net_amount: string;
  converted_amount: string;
  rate: string;
  status: string;
  created_at: string;
  value_date: string;
  sender: {
    sender_name: string | null;
    sender_bank_code: string | null;
    sender_account_number: string | null;
  };
  callback_url: string;
  card_scheme: string;
  mid: string;
  subaccount: string;
  payment_reason: string | null;
  channel: string;
  refunded: number;
  currency: string;
  fraud_check: {
    reference: string | null;
    response: string | null;
    status: string | null;
  } | null;
}

interface CollectionHistoryExport {
  export_link?: string;
}

interface CollectionHistoryResponse {
  collections: CollectionsTypes[];
  pagination: CollectionsPaginationTypes;
  export_link?: string;
}

export type {
  Authentication,
  Card,
  CollectionGatewayMetaResponse,
  CollectionHistoryExport,
  CollectionHistoryResponse,
  CollectionsPaginationTypes,
  CollectionsTypes,
  Order,
  SourceOfFunds,
  Transaction
};


