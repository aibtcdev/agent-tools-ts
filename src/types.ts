// matches how a resource is defined in the contract
export type ResourceData = {
  createdAt: number;
  description: string;
  enabled: boolean;
  name: string;
  price: number;
  totalSpent: number;
  totalUsed: number;
};

// matches how a resource is defined in the contract
export type UserData = {
  address: string;
  totalSpent: number;
  totalUsed: number;
};

// matches how a resource is defined in the contract
export type InvoiceData = {
  amount: number;
  createdAt: number;
  resourceIndex: number;
  resourceName: string;
  userIndex: number;
};
