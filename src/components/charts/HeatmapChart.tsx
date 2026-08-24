"use client";

import React, { useMemo } from "react";
import { EChartContainer } from "./EChartContainer";
import type { EChartsOption } from "echarts";

export interface HeatmapDataPoint {
  date: string;
  count: number;
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

    const formattedData = data.map((d) => [d.date, d.count]);
    const maxVal = Math.max(...data.map((d) => d.count), 5);

    return {
      visualMap: {
        min: 0,
        max: maxVal,
        type: "piecewise",
        orient: "horizontal",
        left: "center",
        bottom: "0%",
        pieces: [
          { min: 0, max: 0, label: "0", color: "#FFFFFF" },
          { min: 1, max: Math.ceil(maxVal * 0.25), label: "Low", color: "#FFF275" },
          { min: Math.ceil(maxVal * 0.25) + 1, max: Math.ceil(maxVal * 0.5), label: "Med", color: "#FD9745" },
          { min: Math.ceil(maxVal * 0.5) + 1, max: Math.ceil(maxVal * 0.75), label: "High", color: "#FF6B6B" },
          { min: Math.ceil(maxVal * 0.75) + 1, label: "Frenzy", color: "#C084FC" },
        ],
        textStyle: {
          color: "#000",
          fontWeight: "bold",
        },
      },
      calendar: {
        top: 30,
        left: 40,
        right: 30,
        cellSize: ["auto", 14],
        range: [startDateIso, todayIso],
        itemStyle: {
          borderWidth: 2,
          borderColor: "#000000",
        },
        yearLabel: { show: false },
        dayLabel: {
          firstDay: 1,
          nameMap: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          color: "#000",
          fontWeight: "bold",
          fontSize: 10,
        },
        monthLabel: {
          color: "#000",
          fontWeight: "bold",
          fontSize: 11,
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
        formatter: (params: any) => {
          const [date, count] = params.value;
          return `
            <div style="font-weight:900; text-transform:uppercase; margin-bottom:4px;">${date}</div>
            <div>${metricLabel}: <strong>${count}</strong></div>
          `;
        },
      },
    };
  }, [data, metricLabel]);

  return <EChartContainer options={chartOptions} height="190px" />;
}
