'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Activity, TrendingUp } from 'lucide-react';
import { useUsageHistory } from '@/hooks/react-query/use-billing-v2';
import { cn } from '@/lib/utils';

export default function TokenUsageHistory() {
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useUsageHistory(days);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTokens = (tokens: number) => {
    return tokens.toLocaleString();
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Token Usage History</CardTitle>
            <CardDescription>Loading your usage data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Usage History</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message || 'Failed to load usage history'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const dailyUsage = data?.daily_usage || {};
  const sortedDates = Object.keys(dailyUsage).sort().reverse();
  const totalTokens = data?.total_period_tokens || 0;
  const totalCost = data?.total_period_cost || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Token Usage Summary</CardTitle>
              <CardDescription>
                Total usage for the last {days} days
              </CardDescription>
            </div>
            <Select
              value={days.toString()}
              onValueChange={(value) => setDays(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold">
                  {formatTokens(totalTokens)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Total Tokens</p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">
                  {formatCost(totalCost)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Estimated Cost</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="p-0 px-0 bg-transparent shadow-none border-none">
        <CardHeader className="px-0">
          <CardTitle>Daily Breakdown</CardTitle>
          <CardDescription>
            Token usage and cost per day
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {sortedDates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No usage data found for the selected period.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Input Tokens</TableHead>
                    <TableHead className="text-right">Output Tokens</TableHead>
                    <TableHead className="text-right">Total Tokens</TableHead>
                    <TableHead className="text-right">Est. Cost</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDates.map((date) => {
                    const usage = dailyUsage[date];
                    return (
                      <TableRow key={date}>
                        <TableCell className="font-medium">
                          {formatDate(date)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatTokens(usage.prompt_tokens || 0)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatTokens(usage.completion_tokens || 0)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatTokens(usage.total_tokens || 0)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                          {formatCost(usage.cost || 0)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {usage.count}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
