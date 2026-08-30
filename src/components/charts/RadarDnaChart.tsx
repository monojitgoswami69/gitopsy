"use client";

import React, { useMemo } from "react";
import { EChartContainer } from "./EChartContainer";
import type { EChartsOption } from "echarts";

export interface CodeDnaIndicator {
  name: string;
  value: number; // 0 to 100
  max?: number;
}

export function RadarDnaChart({ indicators }: { indicators: CodeDnaIndicator[] }) {
  const chartOptions: EChartsOption = useMemo(() => {
    return {
      radar: {
        indicator: indicators.map((ind) => ({
          name: ind.name,
          max: ind.max || 100,
          color: "#000000",
        })),
        shape: "polygon",
        splitNumber: 4,
        axisName: {
          fontWeight: 900,
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          color: "#000000",
        },
        splitLine: {
          lineStyle: {
            color: "#000000",
            width: 1.5,
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ["#FFFFFF", "#FFFBEB", "#FEF3C7", "#FDE68A"],
          },
        },
        axisLine: {
          lineStyle: {
            color: "#000000",
            width: 2,
          },
        },
      },
      series: [
        {
          name: "Code DNA",
          type: "radar",
          data: [
            {
              value: indicators.map((ind) => ind.value),
              name: "Subject DNA Profile",
              symbol: "rect",
              symbolSize: 8,
              lineStyle: {
                width: 3,
                color: "#FF6B6B",
              },
              areaStyle: {
                color: "rgba(255, 107, 107, 0.4)",
              },
              itemStyle: {
                color: "#FF6B6B",
                borderColor: "#000000",
                borderWidth: 2,
              },
            },
          ],
        },
      ],
    };
  }, [indicators]);

  return <EChartContainer options={chartOptions} height="320px" />;
}
