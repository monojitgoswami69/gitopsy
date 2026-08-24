"use client";

import React, { useMemo } from "react";
import { EChartContainer } from "./EChartContainer";
import type { EChartsOption } from "echarts";

export function ChurnAreaChart({
  monthlyData,
}: {
  monthlyData: { month: string; additions: number; deletions: number; count: number }[];
}) {
  const chartOptions: EChartsOption = useMemo(() => {
    const months = monthlyData.map((d) => d.month);
    const additions = monthlyData.map((d) => d.additions);
    const deletions = monthlyData.map((d) => -d.deletions); // Negative for symmetric bi-directional timeline

    return {
      grid: { left: 60, right: 30, top: 40, bottom: 40 },
      legend: {
        data: ["Additions (+)", "Deletions (-)"],
        textStyle: { fontWeight: "bold", color: "#000" },
        top: 0,
      },
      xAxis: {
        type: "category",
        data: months,
        axisLine: { lineStyle: { color: "#000", width: 2 } },
        axisLabel: { color: "#000", fontWeight: "bold", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: "#000", width: 2 } },
        splitLine: { lineStyle: { color: "#E5E7EB", width: 1.5 } },
        axisLabel: {
          color: "#000",
          fontWeight: "bold",
          formatter: (v: number) => `${Math.abs(v).toLocaleString()}`,
        },
      },
      series: [
        {
          name: "Additions (+)",
          type: "bar",
          stack: "Total",
          data: additions,
          itemStyle: {
            color: "#6BCB77",
            borderColor: "#000",
            borderWidth: 2,
          },
        },
        {
          name: "Deletions (-)",
          type: "bar",
          stack: "Total",
          data: deletions,
          itemStyle: {
            color: "#FF6B6B",
            borderColor: "#000",
            borderWidth: 2,
          },
        },
      ],
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const month = params[0]?.name;
          const add = params[0]?.value || 0;
          const del = Math.abs(params[1]?.value || 0);
          const net = add - del;
          return `
            <div style="font-weight:900; margin-bottom:4px;">${month}</div>
            <div style="color:#16a34a;">+${add.toLocaleString()} lines added</div>
            <div style="color:#dc2626;">-${del.toLocaleString()} lines deleted</div>
            <div style="font-weight:bold; border-top:1px solid #000; margin-top:4px; padding-top:2px;">
              Net: ${net >= 0 ? "+" : ""}${net.toLocaleString()} lines
            </div>
          `;
        },
      },
    };
  }, [monthlyData]);

  return <EChartContainer options={chartOptions} height="280px" />;
}
