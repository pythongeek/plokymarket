"use client";

import { AdvancedPerformanceCharts } from './AdvancedPerformanceCharts';

interface PerformanceChartsProps {
  userId?: string;
}

export function PerformanceCharts({ userId }: PerformanceChartsProps) {
  return <AdvancedPerformanceCharts userId={userId} />;
}

export default PerformanceCharts;
