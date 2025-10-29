'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Subscription } from '@/lib/types/finance';
import { useFinanceAccounts } from '@/hooks/react-query/finance';

const subscriptionSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('BRL'),
  billingDay: z.number().min(1).max(31),
  category: z.enum([
    'entertainment',
    'productivity',
    'development',
    'shopping',
    'other',
  ]),
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']).default('ACTIVE'),
  startDate: z.date(),
  accountId: z.string().min(1, 'Account is required'),
  icon: z.string().optional(),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription | null;
  onSubmit?: (data: SubscriptionFormData) => Promise<void> | void;
}

const POPULAR_SERVICES = [
  { name: 'Spotify', category: 'entertainment' },
  { name: 'Netflix', category: 'entertainment' },
  { name: 'Amazon Prime', category: 'shopping' },
  { name: 'LinkedIn', category: 'productivity' },
  { name: 'GitHub', category: 'development' },
  { name: 'ChatGPT', category: 'productivity' },
  { name: 'YouTube Premium', category: 'entertainment' },
  { name: 'Notion', category: 'productivity' },
  { name: 'Figma', category: 'development' },
  { name: 'Other', category: 'other' },
];

const CATEGORIES = [
  { value: 'entertainment', label: 'Entertainment', color: 'bg-purple-500' },
  { value: 'productivity', label: 'Productivity', color: 'bg-blue-500' },
  { value: 'development', label: 'Development', color: 'bg-emerald-500' },
  { value: 'shopping', label: 'Shopping', color: 'bg-orange-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' },
];

const getServiceInitials = (serviceName: string): string => {
  return serviceName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const getCategoryColor = (category: string) => {
  const cat = CATEGORIES.find((c) => c.value === category);
  return cat?.color || 'bg-gray-500';
};

export function SubscriptionModal({
  open,
  onOpenChange,
  subscription,
  onSubmit,
}: SubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const { data: accounts, isLoading: accountsLoading } = useFinanceAccounts();

  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      serviceName: '',
      amount: 0,
      currency: 'BRL',
      billingDay: 1,
      category: 'other',
      status: 'ACTIVE',
      startDate: new Date(),
      accountId: '',
      icon: '',
    },
  });

  // Reset form when modal opens/closes or subscription changes
  useEffect(() => {
    if (open) {
      if (subscription) {
        form.reset({
          serviceName: subscription.serviceName,
          amount: subscription.amount,
          currency: subscription.currency,
          billingDay: subscription.billingDay,
          category: subscription.category as any,
          status: subscription.status,
          startDate: new Date(subscription.startDate),
          accountId: subscription.accountId,
          icon: subscription.icon || '',
        });
        setSelectedService(subscription.serviceName);
      } else {
        form.reset({
          serviceName: '',
          amount: 0,
          currency: 'BRL',
          billingDay: 1,
          category: 'other',
          status: 'ACTIVE',
          startDate: new Date(),
          accountId: '',
          icon: '',
        });
        setSelectedService('');
      }
    }
  }, [open, subscription, form]);

  useEffect(() => {
    if (accounts?.length && open) {
      const current = form.getValues('accountId');
      if (!current) {
        form.setValue('accountId', accounts[0].id);
      }
    }
  }, [accounts, form, open]);

  const handleServiceSelect = (serviceName: string) => {
    setSelectedService(serviceName);
    const service = POPULAR_SERVICES.find((s) => s.name === serviceName);
    if (service) {
      form.setValue('serviceName', serviceName);
      form.setValue('category', service.category as any);
    }
  };

  const handleSubmit = async (data: SubscriptionFormData) => {
    setIsLoading(true);
    try {
      if (!data.accountId) {
        throw new Error('Selecione uma conta para registrar a assinatura.');
      }
      await onSubmit?.(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {subscription ? 'Edit Subscription' : 'Add New Subscription'}
          </DialogTitle>
          <DialogDescription>
            {subscription
              ? 'Update your subscription details'
              : 'Add a new subscription to track your recurring payments'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Popular Services Quick Select */}
            {!subscription && (
              <div className="space-y-2">
                <FormLabel>Popular Services</FormLabel>
                <div className="grid grid-cols-5 gap-2">
                  {POPULAR_SERVICES.map((service) => {
                    const isSelected = selectedService === service.name;
                    const initials = getServiceInitials(service.name);
                    const color = getCategoryColor(service.category);

                    return (
                      <button
                        key={service.name}
                        type="button"
                        onClick={() => handleServiceSelect(service.name)}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-center transition-all hover:bg-muted',
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border',
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded text-xs font-bold text-white',
                            color,
                          )}
                        >
                          {initials}
                        </div>
                        <span className="text-[10px] font-medium leading-tight">
                          {service.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Service Name */}
              <FormField
                control={form.control}
                name="serviceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Netflix, Spotify, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="9.99"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Account */}
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={accountsLoading || !accounts?.length || isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  'h-3 w-3 rounded-full',
                                  category.color,
                                )}
                              />
                              {category.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Billing Day */}
              <FormField
                control={form.control}
                name="billingDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Day</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>Day of month (1-31)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-[10px]">
                              ACTIVE
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="PAUSED">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              PAUSED
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="CANCELLED">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="destructive"
                              className="text-[10px]"
                            >
                              CANCELLED
                            </Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || accountsLoading || !accounts?.length}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {subscription ? 'Update' : 'Add'} Subscription
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
