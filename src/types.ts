// matches how a resource is defined in stacks-m2m-v2
export type ResourceData = {
  createdAt: number;
  description: string;
  enabled: boolean;
  name: string;
  price: number;
  totalSpent: number;
  totalUsed: number;
};

// matches how a user is defined in stacks-m2m-v2
export type UserData = {
  address: string;
  totalSpent: number;
  totalUsed: number;
};

// matches how an invoice is defined in stacks-m2m-v2
export type InvoiceData = {
  amount: number;
  createdAt: number;
  resourceIndex: number;
  resourceName: string;
  userIndex: number;
};
