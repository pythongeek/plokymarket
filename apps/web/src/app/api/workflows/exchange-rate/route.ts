/**
 * Exchange Rate Update Workflow
 * Runs every 5 minutes
 * Fetches and updates USDT/BDT exchange rate from API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  verifyQStashSignature,
  createWorkflowExecution,
  updateWorkflowStatus,
  logWorkflowStep,
} from '@/lib/upstash/workflows';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Initialize Supabase admin client is managed via createServiceClient

interface ExchangeRatePayload {
  workflowType: 'exchange_rate_update';
  timestamp: string;
}

// Fallback rate if API fails
const DEFAULT_RATE = 100.0;

/**
 * Fetch exchange rate from external API
 */
async function fetchExchangeRateFromAPI(): Promise<{ rate: number; source: string } | null> {
  try {
    // Try Binance P2P API first
    const binanceResponse = await fetch(
      'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiat: 'BDT',
          tradeType: 'SELL',
          asset: 'USDT',
          page: 1,
          rows: 1,
        }),
      }
    );

    if (binanceResponse.ok) {
      const data = await binanceResponse.json();
      if (data.data && data.data.length > 0) {
        const price = parseFloat(data.data[0].adv.price);
        if (!isNaN(price) && price > 0) {
          return { rate: price, source: 'binance_p2p' };
        }
      }
    }
  } catch (error) {
    console.error('Binance API error:', error);
  }

  // Try alternative API (CoinGecko)
  try {
    const coingeckoResponse = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=bdt',
      { method: 'GET' }
    );

    if (coingeckoResponse.ok) {
      const data = await coingeckoResponse.json();
      if (data.tether && data.tether.bdt) {
        return { rate: data.tether.bdt, source: 'coingecko' };
      }
    }
  } catch (error) {
    console.error('CoinGecko API error:', error);
  }

  return null;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let executionId: string | null = null;

  try {
    // Verify QStash signature
    const signature = request.headers.get('upstash-signature') || '';
    const body = await request.text();

    if (!verifyQStashSignature(signature, body)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const data: ExchangeRatePayload = JSON.parse(body);

    // Create workflow execution record
    executionId = await createWorkflowExecution('exchange_rate_update', { timestamp: data.timestamp });
    if (executionId) {
      await updateWorkflowStatus(executionId, 'running');
    }

    const supabase = await createServiceClient();

    // Step 1: Get current config
    await logWorkflowStep(executionId!, 'fetch_config', 'started');
    const { data: config, error: configError } = await supabase
      .from('exchange_rate_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (configError) {
      await logWorkflowStep(executionId!, 'fetch_config', 'failed', {}, configError.message);
      throw configError;
    }

    // Check if auto-update is enabled
    if (!config?.auto_update_enabled) {
      await logWorkflowStep(executionId!, 'fetch_config', 'completed', { autoUpdate: false });
      await updateWorkflowStatus(executionId!, 'completed');

      return NextResponse.json({
        success: true,
        message: 'Auto-update disabled, skipping',
        executionId,
        currentRate: config?.default_usdt_to_bdt,
      });
    }

    await logWorkflowStep(executionId!, 'fetch_config', 'completed', { autoUpdate: true });

    // Step 2: Fetch rate from API
    await logWorkflowStep(executionId!, 'fetch_rate', 'started');
    const apiResult = await fetchExchangeRateFromAPI();

    if (!apiResult) {
      await logWorkflowStep(executionId!, 'fetch_rate', 'failed', {}, 'All APIs failed');
      // Don't fail the workflow, just use default
      await updateWorkflowStatus(executionId!, 'completed');

      return NextResponse.json({
        success: true,
        message: 'API fetch failed, using default rate',
        executionId,
        rate: config?.default_usdt_to_bdt || DEFAULT_RATE,
        source: 'default',
      });
    }

    await logWorkflowStep(executionId!, 'fetch_rate', 'completed', {
      rate: apiResult.rate,
      source: apiResult.source
    });

    // Step 3: Validate rate is within bounds
    await logWorkflowStep(executionId!, 'validate_rate', 'started');
    const { rate, source } = apiResult;

    if (rate < config.min_usdt_to_bdt || rate > config.max_usdt_to_bdt) {
      const errorMsg = `Rate ${rate} is outside bounds (${config.min_usdt_to_bdt}-${config.max_usdt_to_bdt})`;
      await logWorkflowStep(executionId!, 'validate_rate', 'failed', {}, errorMsg);

      // Log the out-of-bounds rate but don't update
      await supabase.from('exchange_rate_history').insert({
        usdt_to_bdt: rate,
        bdt_to_usdt: 1 / rate,
        source: `${source}_rejected`,
      });

      await updateWorkflowStatus(executionId!, 'completed');

      return NextResponse.json({
        success: true,
        message: 'Rate out of bounds, rejected',
        executionId,
        rate,
        bounds: {
          min: config.min_usdt_to_bdt,
          max: config.max_usdt_to_bdt,
        },
      });
    }

    await logWorkflowStep(executionId!, 'validate_rate', 'completed');

    // Step 4: Update exchange rate
    await logWorkflowStep(executionId!, 'update_rate', 'started');

    const { data: updatedRate, error: updateError } = await supabase.rpc('update_exchange_rate', {
      p_usdt_to_bdt: rate,
      p_source: source,
      p_source_url: source === 'binance_p2p'
        ? 'https://p2p.binance.com'
        : 'https://coingecko.com',
      p_api_response: { rate, timestamp: new Date().toISOString() },
    });

    if (updateError) {
      await logWorkflowStep(executionId!, 'update_rate', 'failed', {}, updateError.message);
      throw updateError;
    }

    await logWorkflowStep(executionId!, 'update_rate', 'completed', { rateId: updatedRate });

    // Mark workflow as completed
    const duration = Date.now() - startTime;
    if (executionId) {
      await updateWorkflowStatus(executionId, 'completed');
    }

    return NextResponse.json({
      success: true,
      message: 'Exchange rate updated successfully',
      executionId,
      duration: `${duration}ms`,
      rate: {
        usdt_to_bdt: rate,
        bdt_to_usdt: 1 / rate,
        source,
      },
      rateId: updatedRate,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Exchange rate workflow error:', error);

    if (executionId) {
      await updateWorkflowStatus(
        executionId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Workflow failed',
        executionId,
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    workflow: 'exchange_rate_update',
    schedule: '*/5 * * * * (Every 5 minutes)',
    defaultRate: DEFAULT_RATE,
    timestamp: new Date().toISOString(),
  });
}
