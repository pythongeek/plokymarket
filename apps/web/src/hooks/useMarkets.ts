'use client'
// hooks/useMarkets.ts
// Fix: fetch ALL events/markets, not just active ones
// The UI should filter/show what it wants — the DB layer should not hide data

import { useEffect, useCallback } from 'react'
import { useMarketStore } from '@/store/marketStore'
import { createClient } from '@/lib/supabase/client'

interface UseMarketsOptions {
  /** Category filter — undefined = all categories */
  category?: string
  /** Max records to fetch (default 200) */
  limit?: number
  /** If true only return markets the user created */
  myMarketsOnly?: boolean
}

export function useMarkets(options: UseMarketsOptions = {}) {
  const { limit = 200, category, myMarketsOnly = false } = options

  const { events, filteredEventIds, isLoading, setEvents, subscribeToEvents } = useMarketStore()

  const fetchMarkets = useCallback(async () => {
    const supabase = createClient()

    // ── Step 1: Try the `events` table first (newer schema) ──────────────────
    let query = supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Do NOT filter by status here — show everything so admins and users can
    // see all markets. The UI (MarketCard, listing page) handles display logic.
    if (category) query = query.eq('category', category)

    const { data: eventsData, error: eventsError } = await query

    if (!eventsError && eventsData && eventsData.length > 0) {
      setEvents(eventsData)
      return
    }

    // ── Step 2: Fallback to `markets` table ──────────────────────────────────
    let mQuery = supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (category) mQuery = mQuery.eq('category', category)

    const { data: marketsData, error: marketsError } = await mQuery

    if (!marketsError && marketsData) {
      setEvents(marketsData)
    } else {
      console.error('[useMarkets] Failed to fetch markets:', marketsError)
    }
  }, [limit, category, setEvents])

  useEffect(() => {
    fetchMarkets()
    subscribeToEvents()
    return () => {
      useMarketStore.getState().unsubscribeEvents?.()
    }
  }, [fetchMarkets, subscribeToEvents])

  const filteredEvents = filteredEventIds
    .map(id => events.get(id))
    .filter(Boolean)

  return {
    events: filteredEvents,
    isLoading,
    refetch: fetchMarkets,
  }
}

// ── Admin variant: fetches truly everything including draft/cancelled ─────────
export function useAdminMarkets() {
  const { events, setEvents } = useMarketStore()

  const fetchAll = useCallback(async () => {
    const supabase = createClient()

    // Try events table
    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (eventsData && eventsData.length > 0) {
      setEvents(eventsData)
      return Array.from(new Map(eventsData.map((e: any) => [e.id, e])).values())
    }

    // Fallback markets
    const { data: marketsData } = await supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (marketsData) {
      setEvents(marketsData)
      return marketsData
    }

    return []
  }, [setEvents])

  return { fetchAll, events }
}
