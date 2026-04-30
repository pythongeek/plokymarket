// @ts-nocheck
'use client'
// hooks/useMarkets.ts
// Fetches events using the eventsService (which uses the events table)
// The events table is the primary trading entity

import { useEffect, useCallback } from 'react'
import { useMarketStore } from '@/store/marketStore'
import * as eventsService from '@/services/events'

interface UseMarketsOptions {
  /** Category filter — undefined = all categories */
  category?: string
  /** Status filter */
  status?: string
  /** Max records to fetch (default 200) */
  limit?: number
  /** If true only return markets the user created */
  myMarketsOnly?: boolean
}

export function useMarkets(options: UseMarketsOptions = {}) {
  const { limit = 200, category, status } = options

  const { events, filteredEventIds, isLoading, setEvents, subscribeToEvents } = useMarketStore()

  const fetchMarkets = useCallback(async () => {
    const { data, error } = await eventsService.fetchEvents({
      category,
      status,
      limit,
    })

    if (!error && data) {
      setEvents(data)
    } else if (error) {
      console.error('[useMarkets] Failed to fetch events:', error)
    }
  }, [limit, category, status, setEvents])

  useEffect(() => {
    fetchMarkets()
    const unsubscribe = subscribeToEvents()
    return () => unsubscribe()
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
  const { events, setEvents, fetchEvents } = useMarketStore()

  const fetchAll = useCallback(async () => {
    const { data, error } = await eventsService.fetchEvents({
      limit: 500,
    })

    if (!error && data) {
      setEvents(data)
      return data
    }

    return []
  }, [setEvents])

  return { fetchAll, events }
}
