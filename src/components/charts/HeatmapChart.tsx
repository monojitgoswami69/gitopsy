"use client";

import React, { useMemo } from "react";
import { EChartContainer } from "./EChartContainer";
import type { EChartsOption } from "echarts";

export interface HeatmapDataPoint {
  date: string;
  count: number;
  commits?: number;
  additions?: number;
  deletions?: number;
}

export function HeatmapChart({
  data,
  metricLabel = "Commits",
}: {
  data: HeatmapDataPoint[];
  metricLabel?: string;
}) {
  const dataMap = useMemo(() => {
    const map = new Map<string, HeatmapDataPoint>();
    for (const d of data) {
      map.set(d.date, d);
    }
    return map;
  }, [data]);

  const chartOptions: EChartsOption = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        title: { text: "No evidence recorded for heatmap", left: "center" },
      };
    }

    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);

    // Scan for earliest historical activity in dataset to display extended timeline
    const activeDates = data
      .filter((d) => d.count > 0 && d.date)
      .map((d) => d.date)
      .sort();

    let startDateIso: string;
    if (activeDates.length > 0) {
      const earliestDate = new Date(activeDates[0]);
      const maxTwoYearsAgo = new Date(today);
      maxTwoYearsAgo.setDate(maxTwoYearsAgo.getDate() - 728); // ~2 years (104 weeks)

      // Use earliest commit date capped at 2 years, or at least 18 months to span full width
      const minSpanDate = new Date(today);
      minSpanDate.setDate(minSpanDate.getDate() - 546); // ~18 months (78 weeks)

      const effectiveStart = earliestDate < minSpanDate ? (earliestDate < maxTwoYearsAgo ? maxTwoYearsAgo : earliestDate) : minSpanDate;
      startDateIso = effectiveStart.toISOString().slice(0, 10);
    } else {
      const defaultStart = new Date(today);
      defaultStart.setDate(defaultStart.getDate() - 546); // 18 months default
      startDateIso = defaultStart.toISOString().slice(0, 10);
    }

    const formattedData = data.map((d) => [d.date, Math.max(0, d.count)]);
    const counts = data.map((d) => d.count).filter((c) => c > 0);
    const maxVal = counts.length > 0 ? Math.max(...counts) : 5;

    // Calculate gap-free contiguous quartile thresholds
    const q1 = Math.max(2, Math.round(maxVal * 0.25));
    const q2 = Math.max(q1 + 1, Math.round(maxVal * 0.50));
    const q3 = Math.max(q2 + 1, Math.round(maxVal * 0.75));

    return {
      visualMap: {
        show: true,
        type: "piecewise",
        dimension: 1, // Explicitly map numeric count (index 1 in [date, count])
        orient: "horizontal",
        left: "center",
        bottom: 2,
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 14,
        textGap: 4,
        selectedMode: "multiple",
        pieces: [
          { gte: 1, lt: q1, label: "Low", color: "#FFF275" },
          { gte: q1, lt: q2, label: "Med", color: "#FD9745" },
          { gte: q2, lt: q3, label: "High", color: "#FF6B6B" },
          { gte: q3, label: "Frenzy", color: "#C084FC" },
        ],
        outOfRange: {
          color: "#FFFFFF", // Strictly for count < 1 (zero activity)
        },
        textStyle: {
          color: "#000",
          fontWeight: "bold",
          fontSize: 11,
        },
      },
      calendar: {
        top: 26,
        left: 36,
        right: 16,
        cellSize: ["auto", 12.5],
        range: [startDateIso, todayIso],
        itemStyle: {
          borderWidth: 1.5,
          borderColor: "#000000",
        },
        yearLabel: { show: false },
        dayLabel: {
          firstDay: 1,
          nameMap: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          color: "#000",
          fontWeight: "bold",
          fontSize: 9.5,
        },
        monthLabel: {
          color: "#000",
          fontWeight: "bold",
          fontSize: 10.5,
        },
      },
      series: [
        {
          type: "heatmap",
          coordinateSystem: "calendar",
          data: formattedData,
        },
      ],
      tooltip: {
        backgroundColor: "#FFFFFF",
        borderColor: "#000000",
        borderWidth: 1.5,
        extraCssText: "border-radius: 6px; padding: 7px 11px;",
        textStyle: {
          color: "#000000",
          fontFamily: "monospace",
          fontSize: 11,
        },
        formatter: (params: any) => {
          const [date, count] = params.value;
          const entry = dataMap.get(date);
          const commits = entry?.commits ?? (metricLabel === "COMMITS" ? count : 0);
          const adds = entry?.additions ?? 0;
          const dels = entry?.deletions ?? 0;
          const totalChurn = adds + dels;

          return `
            <div style="display:flex; flex-direction:column; gap:5px; min-width:210px;">
              <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1.5px solid #000; padding-bottom:3px; gap:8px;">
                <span style="font-weight:900; font-size:12px; color:#000;">${date}</span>
                <span style="font-size:10px; font-weight:800; color:#4B5563; font-family:monospace;">${commits} ${commits === 1 ? "commit" : "commits"}</span>
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; font-size:11px;">
                <span style="color:#4B5563; font-weight:700;">Gross Churn:</span>
                <strong style="color:#000;">${totalChurn.toLocaleString()} lines</strong>
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; font-size:10.5px; font-family:monospace; background:#F8FAFC; padding:2px 6px; border-radius:4px; border:1px solid #E2E8F0;">
                <span style="color:#059669; font-weight:800;">+${adds.toLocaleString()} added</span>
                <span style="color:#DC2626; font-weight:800;">-${dels.toLocaleString()} deleted</span>
              </div>
            </div>
          `;
        },
      },
    };
  }, [data, dataMap, metricLabel]);

  return <EChartContainer options={chartOptions} height="156px" />;
}
