// ============================================
// USER MANAGEMENT SERVICE
// ============================================

export interface UserSearchResult {
  user_id: string;
  email: string;
  full_name: string;
  account_status: string;
  kyc_status: string;
  verification_tier: string;
  created_at: string;
}

export interface UserFullProfile {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_sign_in_at: string;
  kyc_status: string;
  verification_tier: string;
  account_status: string;
  can_trade: boolean;
  can_deposit: boolean;
  can_withdraw: boolean;
  risk_score: number;
  total_trades: number;
  total_volume: number;
  total_realized_pnl: number;
  open_positions_count: number;
  open_positions_value: number;
}

export interface KYCProfile {
  verification_status: string;
  verification_tier: string;
  full_name: string;
  date_of_birth: string;
  nationality: string;
  id_type: string;
  id_number: string;
  address_line1: string;
  city: string;
  country: string;
  phone_number: string;
  phone_verified: boolean;
  risk_score: number;
  risk_factors: string[];
  daily_deposit_limit: number;
  daily_withdrawal_limit: number;
}

export interface UserStatus {
  account_status: string;
  can_trade: boolean;
  can_deposit: boolean;
  can_withdraw: boolean;
  trading_restricted_until: string;
  restriction_reason: string;
  restriction_notes: string;
  suspended_at: string;
  suspended_by: string;
  suspension_reason: string;
  appeal_submitted: boolean;
}

export interface InternalNote {
  id: string;
  note: string;
  note_type: string;
  created_by: { full_name: string };
  is_escalation: boolean;
  escalated_to?: string;
  escalation_reason?: string;
  created_at: string;
}

export interface PositionIntervention {
  id: string;
  intervention_type: string;
  position_value: number;
  pnl: number;
  reason: string;
  performed_by: { full_name: string };
  performed_at: string;
  notification_sent: boolean;
  user_acknowledged: boolean;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  assigned_to?: { full_name: string };
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  admin_name: string;
  action: string;
  action_category: string;
  target_user_email: string;
  previous_value: any;
  new_value: any;
  reason: string;
  requires_dual_auth: boolean;
  dual_auth_admin_id?: string;
  created_at: string;
  ip_address?: string;
  description?: string;
  details?: string;
  metadata?: Record<string, any>;
  performed_by?: string;
}

class UserManagementService {
  // ============================================
  // USER SEARCH
  // ============================================

  async searchUsers(params: {
    query?: string;
    status?: string;
    kyc?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: UserSearchResult[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.set('q', params.query);
    if (params.status) searchParams.set('status', params.status);
    if (params.kyc) searchParams.set('kyc', params.kyc);
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());

    const res = await fetch(`/api/admin/users?${searchParams}`);
    if (!res.ok) throw new Error('Failed to search users');
    return res.json();
  }

  // ============================================
  // USER DETAILS
  // ============================================

  async getUserDetail(userId: string): Promise<{
    profile: UserFullProfile;
    kyc: KYCProfile;
    status: UserStatus;
    notes: InternalNote[];
    interventions: PositionIntervention[];
    tickets: SupportTicket[];
  }> {
    const res = await fetch(`/api/admin/users/detail?id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user details');
    return res.json();
  }

  // ============================================
  // STATUS MODIFICATION
  // ============================================

  async updateUserStatus(
    userId: string,
    statusChanges: Partial<UserStatus>,
    reason: string,
    dualAuthAdminId?: string
  ): Promise<{ success: boolean; requires_dual_auth?: boolean }> {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        status_changes: statusChanges,
        reason,
        dual_auth_admin_id: dualAuthAdminId
      })
    });

    if (res.status === 403) {
      const err = await res.json();
      if (err.requires_dual_auth) {
        return { success: false, requires_dual_auth: true };
      }
    }

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update status');
    }

    return { success: true };
  }

  // ============================================
  // POSITION INTERVENTIONS
  // ============================================

  async performIntervention(params: {
    user_id: string;
    position_id?: string;
    intervention_type: 'liquidation' | 'forced_closure' | 'margin_call';
    reason: string;
    position_value?: number;
    pnl?: number;
    send_notification?: boolean;
  }): Promise<{ intervention_id: string }> {
    const res = await fetch('/api/admin/users/interventions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to perform intervention');
    }

    return res.json();
  }

  async getInterventions(userId?: string): Promise<PositionIntervention[]> {
    const params = new URLSearchParams();
    if (userId) params.set('user_id', userId);

    const res = await fetch(`/api/admin/users/interventions?${params}`);
    if (!res.ok) throw new Error('Failed to fetch interventions');
    const { data } = await res.json();
    return data;
  }

  // ============================================
  // INTERNAL NOTES
  // ============================================

  async addInternalNote(userId: string, params: {
    content: string;
    is_escalation?: boolean;
    category?: string;
  }): Promise<InternalNote> {
    const res = await fetch('/api/admin/users/detail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        note: params.content,
        note_type: params.category,
        is_escalation: params.is_escalation,
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add note');
    }

    const { data } = await res.json();
    return data;
  }

  // ============================================
  // AUDIT LOG
  // ============================================

  async getAuditLog(params: {
    user_id?: string;
    category?: string;
    action?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: AuditLogEntry[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params.user_id) searchParams.set('user_id', params.user_id);
    if (params.category) searchParams.set('category', params.category);
    if (params.action) searchParams.set('action', params.action);
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());

    const res = await fetch(`/api/admin/users/audit-log?${searchParams}`);
    if (!res.ok) throw new Error('Failed to fetch audit log');
    return res.json();
  }

  async getAuditLogs(userId: string, filter?: string): Promise<AuditLogEntry[]> {
    const params = new URLSearchParams();
    params.set('user_id', userId);
    if (filter) params.set('action', filter);

    const res = await fetch(`/api/admin/users/audit-log?${params}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    const { data } = await res.json();
    return data || [];
  }

  async approveDualAuth(logId: string, action: 'approve' | 'reject'): Promise<{ success: boolean; action: string }> {
    const res = await fetch('/api/admin/users/audit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log_id: logId, action })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to process dual auth');
    }

    return res.json();
  }

  // ============================================
  // SUPPORT TICKETS
  // ============================================

  async getSupportTickets(params: {
    status?: string;
    priority?: string;
    assigned?: 'me' | 'unassigned';
  } = {}): Promise<{ data: SupportTicket[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.priority) searchParams.set('priority', params.priority);
    if (params.assigned) searchParams.set('assigned', params.assigned);

    const res = await fetch(`/api/admin/support?${searchParams}`);
    if (!res.ok) throw new Error('Failed to fetch tickets');
    return res.json();
  }

  async updateTicket(
    ticketId: string,
    updates: Partial<SupportTicket>
  ): Promise<SupportTicket> {
    const res = await fetch('/api/admin/support', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: ticketId, ...updates })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update ticket');
    }

    const { data } = await res.json();
    return data;
  }

  async escalateTicket(ticketId: string): Promise<SupportTicket> {
    return this.updateTicket(ticketId, { status: 'escalated' } as any);
  }

  async getTicketMessages(ticketId: string): Promise<any[]> {
    const res = await fetch(`/api/admin/support/messages?ticket_id=${ticketId}`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    const { data } = await res.json();
    return data;
  }

  async addTicketMessage(
    ticketId: string,
    message: string,
    isInternalNote: boolean = false
  ): Promise<any> {
    const res = await fetch('/api/admin/support/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: ticketId,
        message,
        is_internal_note: isInternalNote
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add message');
    }

    const { data } = await res.json();
    return data;
  }

  // ============================================
  // HELPERS
  // ============================================

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'active': 'green',
      'suspended': 'red',
      'banned': 'red',
      'dormant': 'gray',
      'verified': 'green',
      'unverified': 'yellow',
      'pending': 'blue',
      'rejected': 'red'
    };
    return colors[status] || 'gray';
  }

  getRiskLevel(score: number): { level: string; color: string } {
    if (score >= 80) return { level: 'Critical', color: 'red' };
    if (score >= 60) return { level: 'High', color: 'orange' };
    if (score >= 40) return { level: 'Medium', color: 'yellow' };
    return { level: 'Low', color: 'green' };
  }

  formatActionName(action: string): string {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

export const userManagementService = new UserManagementService();
