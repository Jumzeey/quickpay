export enum KycStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  RE_SUBMITTED = "Re-Submitted",
  UNVERIFIED = "Unverified",
}

export interface Field {
  key: string;
  value: string;
}

export interface UserKyc {
  created_at: string;
  status: KycStatus | string;
  comment?: string;
  fields: Field[];
}
