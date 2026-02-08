/**
 * Regulatory Reporting Service
 * 
 * Features:
 * - Automated SAR/STR/FIU report generation
 * - Cross-platform coordination
 * - Secure transmission tracking
 * - Report status management
 */

import { supabase } from '@/lib/supabase';
import type {
  RegulatoryReport,
  ReportType,
  ReportStatus,
  ReportTrigger,
  PartnerExchange,
  CrossPlatformAlert,
} from '@/types';

// ============================================
// CONFIGURATION
// ============================================

const REGULATORY_CONFIG = {
  // Timeline thresholds
  SAR_DUE_DAYS_CONFIRMED: 30,
  SAR_DUE_DAYS_INTERNAL: 90,
  CROSS_PLATFORM_SLA_HOURS: 24,
  
  // Amount thresholds
  CONFIRMED_WASH_TRADE_THRESHOLD: 10000, // $10k
  
  // Jurisdictions
  SUPPORTED_JURISDICTIONS: ['US', 'EU', 'GLOBAL'],
};

// ============================================
// REGULATORY REPORTS
// ============================================

/**
 * Generate SAR report
 */
export async function generateSARReport(
  subjectUserId: string,
  triggerType: ReportTrigger,
  triggerTradeIds: string[],
  jurisdiction: 'US' | 'EU' | 'GLOBAL' = 'US'
): Promise<string | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc('generate_sar_report', {
      p_subject_user_id: subjectUserId,
      p_trigger_type: triggerType,
      p_trigger_trade_ids: triggerTradeIds,
      p_jurisdiction: jurisdiction,
    });

    if (error) {
      console.error('Generate SAR report error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Generate SAR report exception:', error);
    return null;
  }
}

/**
 * Get regulatory reports
 */
export async function getRegulatoryReports(
  status?: ReportStatus[],
  jurisdiction?: string,
  limit: number = 50
): Promise<RegulatoryReport[]> {
  if (!supabase) return [];

  let query = supabase
    .from('regulatory_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status && status.length > 0) {
    query = query.in('status', status);
  }

  if (jurisdiction) {
    query = query.eq('jurisdiction', jurisdiction);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Get regulatory reports error:', error);
    return [];
  }

  return (data || []).map(mapReportFromDB);
}

/**
 * Get pending SARs
 */
export async function getPendingSARs(): Promise<Array<RegulatoryReport & { timeRemaining: string }>> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('pending_sars')
    .select('*');

  if (error) {
    console.error('Get pending SARs error:', error);
    return [];
  }

  return (data || []).map((d: any) => ({
    ...mapReportFromDB(d),
    timeRemaining: d.time_remaining,
  }));
}

/**
 * Update report status
 */
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  reviewedBy?: string
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('regulatory_reports')
    .update({
      status,
      reviewed_by: reviewedBy,
      reviewed_at: reviewedBy ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) {
    console.error('Update report status error:', error);
    return false;
  }

  return true;
}

/**
 * Record transmission confirmation
 */
export async function recordTransmissionConfirmation(
  reportId: string,
  confirmationId: string,
  method: string
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('regulatory_reports')
    .update({
      transmission_confirmation_id: confirmationId,
      transmission_method: method,
      transmission_confirmed_at: new Date().toISOString(),
      status: 'submitted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) {
    console.error('Record transmission error:', error);
    return false;
  }

  return true;
}

// ============================================
// CROSS-PLATFORM COORDINATION
// ============================================

/**
 * Get partner exchanges
 */
export async function getPartnerExchanges(): Promise<PartnerExchange[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('partner_exchanges')
    .select('*')
    .order('name');

  if (error) {
    console.error('Get partner exchanges error:', error);
    return [];
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    name: d.name,
    jurisdiction: d.jurisdiction,
    apiEndpoint: d.api_endpoint,
    encryptionPublicKey: d.encryption_public_key,
    agreementType: d.agreement_type,
    informationSharingEnabled: d.information_sharing_enabled,
    responseTimeSla: d.response_time_sla,
    createdAt: d.created_at,
  }));
}

/**
 * Create cross-platform alert
 */
export async function createCrossPlatformAlert(
  alertType: string,
  subjectUserId: string,
  originatingExchangeId: string,
  recipientExchangeId: string,
  alertData: Record<string, any>,
  riskIndicators: string[]
): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('cross_platform_alerts')
    .insert({
      alert_type: alertType,
      subject_user_id: subjectUserId,
      originating_exchange: originatingExchangeId,
      recipient_exchange: recipientExchangeId,
      alert_data: alertData,
      risk_indicators: riskIndicators,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Create cross-platform alert error:', error);
    return null;
  }

  return data?.id;
}

/**
 * Get cross-platform alerts
 */
export async function getCrossPlatformAlerts(
  status?: string
): Promise<CrossPlatformAlert[]> {
  if (!supabase) return [];

  let query = supabase
    .from('cross_platform_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Get cross-platform alerts error:', error);
    return [];
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    alertType: d.alert_type,
    subjectIdentifier: d.subject_identifier,
    subjectUserId: d.subject_user_id,
    originatingExchange: d.originating_exchange,
    recipientExchange: d.recipient_exchange,
    alertData: d.alert_data,
    riskIndicators: d.risk_indicators,
    sharedAt: d.shared_at,
    acknowledgedAt: d.acknowledged_at,
    responseReceivedAt: d.response_received_at,
    status: d.status,
    createdAt: d.created_at,
  }));
}

/**
 * Update cross-platform alert status
 */
export async function updateCrossPlatformAlertStatus(
  alertId: string,
  status: 'shared' | 'acknowledged' | 'responded' | 'closed'
): Promise<boolean> {
  if (!supabase) return false;

  const updates: Record<string, any> = { status };

  if (status === 'shared') {
    updates.shared_at = new Date().toISOString();
  } else if (status === 'acknowledged') {
    updates.acknowledged_at = new Date().toISOString();
  } else if (status === 'responded') {
    updates.response_received_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('cross_platform_alerts')
    .update(updates)
    .eq('id', alertId);

  if (error) {
    console.error('Update cross-platform alert error:', error);
    return false;
  }

  return true;
}

// ============================================
// COMPLIANCE DASHBOARD
// ============================================

export interface ComplianceStats {
  totalReports: number;
  pendingSubmission: number;
  overdue: number;
  submittedThisMonth: number;
  crossPlatformAlertsPending: number;
}

/**
 * Get compliance stats
 */
export async function getComplianceStats(): Promise<ComplianceStats> {
  if (!supabase) {
    return {
      totalReports: 0,
      pendingSubmission: 0,
      overdue: 0,
      submittedThisMonth: 0,
      crossPlatformAlertsPending: 0,
    };
  }

  try {
    const { data: reports, error: reportsError } = await supabase
      .from('regulatory_reports')
      .select('status, report_due_date, submitted_at');

    if (reportsError) throw reportsError;

    const { data: alerts, error: alertsError } = await supabase
      .from('cross_platform_alerts')
      .select('status')
      .eq('status', 'pending');

    if (alertsError) throw alertsError;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      totalReports: reports?.length || 0,
      pendingSubmission: reports?.filter((r: any) => r.status === 'draft' || r.status === 'pending_review').length || 0,
      overdue: reports?.filter((r: any) => 
        (r.status === 'draft' || r.status === 'pending_review') && 
        new Date(r.report_due_date) < now
      ).length || 0,
      submittedThisMonth: reports?.filter((r: any) => 
        r.status === 'submitted' && 
        r.submitted_at && 
        new Date(r.submitted_at) >= monthStart
      ).length || 0,
      crossPlatformAlertsPending: alerts?.length || 0,
    };
  } catch (error) {
    console.error('Get compliance stats error:', error);
    return {
      totalReports: 0,
      pendingSubmission: 0,
      overdue: 0,
      submittedThisMonth: 0,
      crossPlatformAlertsPending: 0,
    };
  }
}

// ============================================
// UTILITIES
// ============================================

function mapReportFromDB(data: any): RegulatoryReport {
  return {
    id: data.id,
    reportType: data.report_type,
    reportNumber: data.report_number,
    triggerType: data.trigger_type,
    triggerTradeIds: data.trigger_trade_ids || [],
    triggerAmount: parseFloat(data.trigger_amount || 0),
    subjectUserId: data.subject_user_id,
    subjectAccountIds: data.subject_account_ids || [],
    beneficialOwnerId: data.beneficial_owner_id,
    reportContent: data.report_content || {},
    tradeHistory: data.trade_history,
    accountRelationships: data.account_relationships,
    detectionMethodology: data.detection_methodology,
    riskScore: data.risk_score,
    detectedAt: data.detected_at,
    reportDueDate: data.report_due_date,
    submittedAt: data.submitted_at,
    status: data.status,
    reviewedBy: data.reviewed_by,
    reviewedAt: data.reviewed_at,
    transmissionMethod: data.transmission_method,
    transmissionConfirmationId: data.transmission_confirmation_id,
    transmissionConfirmedAt: data.transmission_confirmed_at,
    jurisdiction: data.jurisdiction,
    filingInstitution: data.filing_institution,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// ============================================
// EXPORTS
// ============================================

export { REGULATORY_CONFIG };
