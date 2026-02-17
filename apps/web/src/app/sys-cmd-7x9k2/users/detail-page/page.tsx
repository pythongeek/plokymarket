'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Shield,
  TrendingUp,
  Headphones,
  History,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { userManagementService } from '@/lib/user-management/service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Import views
import { UserOverviewView } from './components/UserOverviewView';
import { UserKYCView } from './components/UserKYCView';
import { UserTradingView } from './components/UserTradingView';
import { UserSupportView } from './components/UserSupportView';
import { UserAuditView } from './components/UserAuditView';

function UserDetailContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  const initialTab = searchParams.get('tab') || 'overview';

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const data = await userManagementService.getUserDetail(userId!);
      setUserData(data);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500',
      suspended: 'bg-red-500',
      banned: 'bg-red-700',
      dormant: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  if (!userId) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">No User ID Provided</h2>
        <Button onClick={() => router.push('/admin/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
        <Button onClick={() => router.push('/admin/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>
    );
  }

  const { profile } = userData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{profile.full_name || 'Unnamed User'}</h1>
              <Badge className={getStatusColor(profile.account_status)}>
                {profile.account_status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{profile.email}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">ID: {profile.user_id}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">KYC Status</p>
            <Badge className={cn(
              profile.kyc_status === 'verified' ? 'bg-green-500' :
              profile.kyc_status === 'pending' ? 'bg-blue-500' :
              'bg-yellow-500'
            )}>
              {profile.kyc_status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Risk Score</p>
            <p className={cn(
              "text-2xl font-bold",
              profile.risk_score >= 80 ? 'text-red-500' :
              profile.risk_score >= 60 ? 'text-orange-500' :
              profile.risk_score >= 40 ? 'text-yellow-500' :
              'text-green-500'
            )}>
              {profile.risk_score}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Trades</p>
            <p className="text-2xl font-bold">{profile.total_trades}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Open Positions</p>
            <p className="text-2xl font-bold">{profile.open_positions_count}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="kyc">
            <Shield className="h-4 w-4 mr-2" />
            KYC
          </TabsTrigger>
          <TabsTrigger value="trading">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trading
          </TabsTrigger>
          <TabsTrigger value="support">
            <Headphones className="h-4 w-4 mr-2" />
            Support
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="h-4 w-4 mr-2" />
            Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <UserOverviewView userId={userId} userData={userData} onUpdate={loadUserData} />
        </TabsContent>

        <TabsContent value="kyc">
          <UserKYCView userId={userId} kyc={userData.kyc} />
        </TabsContent>

        <TabsContent value="trading">
          <UserTradingView userId={userId} profile={profile} />
        </TabsContent>

        <TabsContent value="support">
          <UserSupportView userId={userId} tickets={userData.tickets} />
        </TabsContent>

        <TabsContent value="audit">
          <UserAuditView userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function UserDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <UserDetailContent />
    </Suspense>
  );
}
