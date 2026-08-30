"use client";

import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

export interface EChartContainerProps {
  options: echarts.EChartsOption;
  height?: string | number;
  className?: string;
  onEvents?: Record<string, (params: unknown) => void>;
  onChartReady?: (instance: echarts.ECharts) => void;
}

export function EChartContainer({
  options,
  height = "320px",
  className = "",
  onEvents,
  onChartReady,
}: EChartContainerProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);
  const onEventsRef = useRef(onEvents);
  onEventsRef.current = onEvents;

  useEffect(() => {
    if (!chartRef.current) return;

    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current, undefined, {
        renderer: "canvas",
      });

      onChartReady?.(instanceRef.current);

      if (onEvents) {
        Object.keys(onEvents).forEach((eventName) => {
          instanceRef.current?.on(eventName, (params: unknown) => {
            onEventsRef.current?.[eventName]?.(params);
          });
        });
      }
    }

    // Merge default Neobrutalism chart styles
    const brutalistOptions: echarts.EChartsOption = {
      textStyle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: "bold",
        color: "#000",
      },
      tooltip: {
        backgroundColor: "#FFFFFF",
        borderColor: "#000000",
        borderWidth: 3,
        padding: [10, 14],
        textStyle: {
          color: "#000000",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          fontSize: 12,
        },
        extraCssText: "border-radius: 6px;",
      },
      ...options,
    };

    instanceRef.current.setOption(brutalistOptions, true);

    const handleResize = () => {
      instanceRef.current?.resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [options, onEvents]);

  useEffect(() => {
    return () => {
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, []);

  return (
    <div
      ref={chartRef}
      style={{ height, width: "100%" }}
      className={`w-full ${className}`}
    />
  );
}
