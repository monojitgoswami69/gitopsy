"use client";

import React, { useMemo } from "react";
import { EChartContainer } from "./EChartContainer";
import type { EChartsOption } from "echarts";

export interface LanguageByteEntry {
  name: string;
  bytes: number;
  percentage: number;
  repoCount?: number;
}

export function LanguagesSunburst({ languages }: { languages: LanguageByteEntry[] }) {
  const chartOptions: EChartsOption = useMemo(() => {
    const palette = ["#FF6B6B", "#4D96FF", "#6BCB77", "#FFDC58", "#C084FC", "#FD9745", "#2DD4BF", "#F43F5E"];

    const data = languages.slice(0, 8).map((l, idx) => ({
      value: l.bytes,
      name: `${l.name} (${l.percentage}%)`,
      itemStyle: {
        color: palette[idx % palette.length],
        borderColor: "#000",
        borderWidth: 2,
      },
    }));

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => `
          <div style="font-weight:900;">${params.name}</div>
          <div>${((params.value || 0) / 1024).toFixed(1)} KB analyzed</div>
        `,
      },
      legend: {
        orient: "horizontal",
        bottom: 0,
        textStyle: { fontWeight: "bold", color: "#000", fontSize: 10 },
      },
      series: [
        {
          name: "Languages",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: "#000",
            borderWidth: 3,
          },
          label: {
            show: false,
            position: "center",
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: "bold",
              formatter: "{b}",
            },
          },
          data,
        },
      ],
    };
  }, [languages]);

  return <EChartContainer options={chartOptions} height="280px" />;
}
