'use client';

export function useBillingError() {
  return {
    billingError: null as null,
    handleBillingError: (_?: any) => {},
    clearBillingError: () => {},
  };
}

export default useBillingError;