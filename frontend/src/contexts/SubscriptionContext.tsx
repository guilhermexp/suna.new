'use client';

import React, { createContext, useContext } from 'react';

type SubscriptionData = {
  status: 'no_subscription' | 'active' | 'trialing' | string;
  current_usage?: number;
  cost_limit?: number;
  credits?: { balance?: number; lifetime_used?: number; can_purchase?: boolean };
  subscription_id?: string | null;
  price_id?: string | null;
  has_schedule?: boolean;
  scheduled_price_id?: string | null;
  subscription?: { status?: string } | null;
  plan_name?: string | null;
};

const defaultValue: { data: SubscriptionData | null } = {
  data: {
    status: 'no_subscription',
    current_usage: 0,
    cost_limit: 0,
    credits: { balance: Number.POSITIVE_INFINITY, lifetime_used: 0, can_purchase: false },
    subscription_id: null,
    price_id: null,
    subscription: null,
    plan_name: null,
  },
};

const SubscriptionContext = createContext<{ data: SubscriptionData | null }>(defaultValue);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SubscriptionContext.Provider value={defaultValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionData = () => useContext(SubscriptionContext);
export const useSharedSubscription = () => useContext(SubscriptionContext);