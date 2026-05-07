// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';


// GET /api/admin/support/messages?ticket_id=xxx - Get ticket messages
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminUser(req);


    // Check admin status
    const profileResult = await pool.query(
      'SELECT is_admin FROM user_profiles WHERE id = $1',
      [userId]
    );
    const profile = profileResult.rows[0];

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticket_id');

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });
    }

    const dataResult = await pool.query(
      `SELECT stm.*, up.full_name as sender_full_name
       FROM support_ticket_messages stm
       LEFT JOIN user_profiles up ON up.id = stm.sender_id
       WHERE stm.ticket_id = $1
       ORDER BY stm.created_at ASC`,
      [ticketId]
    );

    return NextResponse.json({ data: dataResult.rows || [] });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/admin/support/messages - Add message
export async function POST(req: NextRequest) {
  try {
        const authResult = await requireAdminUser(req);
    if ('error' in authResult) return authResult.error;
    const userId = authResult.user.id;

    // Check admin status
    const profileResult = await pool.query(
      'SELECT is_admin FROM user_profiles WHERE id = $1',
      [userId]
    );
    const profile = profileResult.rows[0];

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { ticket_id, message, is_internal_note, attachments } = body;

    if (!ticket_id || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const insertResult = await pool.query(
      `INSERT INTO support_ticket_messages 
       (ticket_id, sender_id, sender_type, message, is_internal_note, attachments)
       VALUES ($1, $2, 'admin', $3, $4, $5)
       RETURNING *`,
      [ticket_id, userId, message, is_internal_note || false, attachments || []]
    );

    const data = insertResult.rows[0];

    // Update ticket status if not internal note
    if (!is_internal_note) {
      await pool.query(
        `UPDATE support_tickets SET status = 'in_progress' WHERE id = $1`,
        [ticket_id]
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add message' },
      { status: 500 }
    );
  }
}
