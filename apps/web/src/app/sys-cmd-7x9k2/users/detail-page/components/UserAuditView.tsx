'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  User,
  Shield,
  TrendingUp,
  Headphones,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { userManagementService } from '@/lib/user-management/service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UserAuditViewProps {
  userId: string;
}

const ACTION_ICONS: Record<string, any> = {
  kyc: Shield,
  status: User,
  position: TrendingUp,
  support: Headphones,
  default: History,
};

export function UserAuditView({ userId }: UserAuditViewProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, [userId]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const result = await userManagementService.getAuditLog({
        user_id: userId,
        limit: 50
      });
      setLogs(result.data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatActionName = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
        <h3 className="text-lg font-medium mb-2">No Audit History</h3>
        <p className="text-sm text-muted-foreground">
          No admin actions have been recorded for this user.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Admin Action History</h3>
        <Button variant="outline" size="sm" onClick={loadAuditLogs}>
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {logs.map((log, index) => {
          const Icon = ACTION_ICONS[log.action_category] || ACTION_ICONS.default;
          
          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={cn(
                "border-l-4",
                log.action_category === 'status' ? 'border-l-blue-500' :
                log.action_category === 'kyc' ? 'border-l-green-500' :
                log.action_category === 'position' ? 'border-l-red-500' :
                'border-l-gray-500'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      log.action_category === 'status' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      log.action_category === 'kyc' ? 'bg-green-100 dark:bg-green-900/30' :
                      log.action_category === 'position' ? 'bg-red-100 dark:bg-red-900/30' :
                      'bg-gray-100 dark:bg-gray-800'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{formatActionName(log.action)}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.action_category}
                        </Badge>
                        {log.requires_dual_auth && (
                          <Badge 
                            variant={log.dual_auth_admin_id ? "default" : "secondary"}
                            className={cn(
                              "text-xs",
                              log.dual_auth_admin_id ? "bg-green-500" : ""
                            )}
                          >
                            {log.dual_auth_admin_id ? (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Dual Auth</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1" /> Pending Dual Auth</>
                            )}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        by {log.admin_name} • {new Date(log.created_at).toLocaleString()}
                      </p>
                      {log.reason && (
                        <p className="text-sm mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          Reason: {log.reason}
                        </p>
                      )}
                      {log.previous_value && log.new_value && (
                        <div className="mt-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="line-through">{JSON.stringify(log.previous_value).slice(0, 100)}</span>
                            <span>→</span>
                            <span className="text-foreground">{JSON.stringify(log.new_value).slice(0, 100)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
