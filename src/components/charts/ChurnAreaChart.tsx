"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { EChartContainer } from "./EChartContainer";
import type { EChartsOption } from "echarts";
import type * as echarts from "echarts";

export interface ChurnItem {
  key: string;
  label: string;
  additions: number;
  deletions: number;
  count: number;
}

export function ChurnAreaChart({
  data,
  granularity = "WEEKLY",
}: {
  data: ChurnItem[];
  granularity?: "WEEKLY" | "MONTHLY";
}) {
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);
  const lockedIndexRef = useRef<number | null>(null);
  lockedIndexRef.current = lockedIndex;

  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isLockingJustNowRef = useRef(false);
  const lastClickPosRef = useRef<[number, number] | null>(null);

  // After React re-renders chartOptions (which resets the tooltip DOM),
  // re-show the tooltip at the cursor's pixel position that was captured on click.
  useEffect(() => {
    const instance = chartInstanceRef.current;
    if (!instance || instance.isDisposed()) return;

    if (lockedIndex !== null && lastClickPosRef.current) {
      const [x, y] = lastClickPosRef.current;
      requestAnimationFrame(() => {
        if (!instance || instance.isDisposed()) return;
        instance.dispatchAction({ type: "showTip", x, y });
      });
    } else if (lockedIndex === null) {
      instance.dispatchAction({ type: "hideTip" });
      instance.dispatchAction({ type: "updateAxisPointer", currTrigger: "leave" });
      lastClickPosRef.current = null;
    }
  }, [lockedIndex]);

  // Release locking when clicking anywhere outside
  useEffect(() => {
    if (lockedIndex === null) return;

    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setLockedIndex(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [lockedIndex]);

  const chartOptions: EChartsOption = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        title: { text: "No churn data recorded", left: "center" },
      };
    }

    const labels = data.map((d) => d.label);

    const additions = data.map((d, i) => {
      if (d.additions <= 0) return null;
      const isSelected = lockedIndex === i;
      const isDimmed = lockedIndex !== null && !isSelected;
      return {
        value: d.additions,
        itemStyle: {
          color: isSelected ? "#22C55E" : isDimmed ? "rgba(74, 222, 128, 0.22)" : "#4ADE80",
          borderColor: isDimmed ? "rgba(0, 0, 0, 0.15)" : "#000000",
          borderWidth: isSelected ? 2 : 1.5,
          borderRadius: [4, 4, 0, 0] as [number, number, number, number],
        },
      };
    });

    const deletions = data.map((d, i) => {
      if (d.deletions <= 0) return null;
      const isSelected = lockedIndex === i;
      const isDimmed = lockedIndex !== null && !isSelected;
      return {
        value: -Math.abs(d.deletions),
        itemStyle: {
          color: isSelected ? "#EF4444" : isDimmed ? "rgba(248, 113, 113, 0.22)" : "#F87171",
          borderColor: isDimmed ? "rgba(0, 0, 0, 0.15)" : "#000000",
          borderWidth: isSelected ? 2 : 1.5,
          borderRadius: [0, 0, 4, 4] as [number, number, number, number],
        },
      };
    });

    return {
      animationDurationUpdate: 0,
      grid: {
        left: 55,
        right: 25,
        top: 28,
        bottom: 36,
      },
      legend: {
        show: false,
      },
      tooltip: {
        show: true,
        trigger: "axis",
        triggerOn: lockedIndex !== null ? "none" : "mousemove",
        alwaysShowContent: lockedIndex !== null,
        transitionDuration: 0,
        axisPointer: {
          type: "shadow",
          animation: false,
          shadowStyle: {
            color: "rgba(0, 0, 0, 0.06)",
          },
        },
        backgroundColor: "#FFFFFF",
        borderColor: "#000000",
        borderWidth: 1.5,
        extraCssText: "border-radius: 6px; padding: 7px 11px; pointer-events: none;",
        textStyle: {
          color: "#000000",
          fontFamily: "monospace",
          fontSize: 11,
        },
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex ?? 0;
          const item = data[idx];
          if (!item) return "";

          const adds = item.additions || 0;
          const dels = item.deletions || 0;
          const net = adds - dels;
          const totalVolume = adds + dels;

          return `
            <div style="display:flex; flex-direction:column; gap:5px; min-width:210px;">
              <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1.5px solid #000; padding-bottom:3px; gap:8px;">
                <span style="font-weight:900; font-size:12px; color:#000;">${item.key}</span>
                <span style="font-size:10px; font-weight:800; color:#4B5563; font-family:monospace;">${item.count} ${item.count === 1 ? "commit" : "commits"}</span>
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; font-size:11px;">
                <span style="color:#4B5563; font-weight:700;">Net Growth:</span>
                <strong style="color:${net >= 0 ? "#16A34A" : "#DC2626"}; font-family:monospace;">
                  ${net >= 0 ? "+" : ""}${net.toLocaleString()} lines
                </strong>
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; font-size:10.5px; font-family:monospace; background:#F8FAFC; padding:2px 6px; border-radius:4px; border:1px solid #E2E8F0;">
                <span style="color:#059669; font-weight:800;">+${adds.toLocaleString()} added</span>
                <span style="color:#DC2626; font-weight:800;">-${dels.toLocaleString()} deleted</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:9.5px; color:#64748B; font-family:monospace; padding-top:1px;">
                <span>Total Volume:</span>
                <span>${totalVolume.toLocaleString()} lines</span>
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLine: {
          onZero: true,
          lineStyle: { color: "#000000", width: 1.5 },
        },
        axisTick: {
          alignWithLabel: true,
          lineStyle: { color: "#000000" },
        },
        axisLabel: {
          color: "#000000",
          fontWeight: "bold",
          fontSize: 10,
          interval: 0,
          hideOverlap: true,
        },
      },
      yAxis: {
        type: "value",
        axisLine: {
          show: true,
          lineStyle: { color: "#000000", width: 1.5 },
        },
        splitLine: {
          lineStyle: { color: "#E2E8F0", width: 1.5, type: "dashed" },
        },
        axisLabel: {
          color: "#000000",
          fontWeight: "bold",
          fontSize: 10,
          formatter: (v: number) => {
            const abs = Math.abs(v);
            if (abs === 0) return "0";
            if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
            if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
            return `${v}`;
          },
        },
      },
      series: [
        {
          name: "Additions (+)",
          type: "bar",
          data: additions,
          barGap: "-100%",
          barMaxWidth: granularity === "WEEKLY" ? 16 : 28,
          barMinHeight: 6,
          cursor: "pointer",
          emphasis: {
            focus: "none",
            itemStyle: {
              color: "#22C55E",
              borderColor: "#000000",
              borderWidth: 2,
            },
          },
        },
        {
          name: "Deletions (-)",
          type: "bar",
          data: deletions,
          barGap: "-100%",
          barMaxWidth: granularity === "WEEKLY" ? 16 : 28,
          barMinHeight: 6,
          cursor: "pointer",
          emphasis: {
            focus: "none",
            itemStyle: {
              color: "#EF4444",
              borderColor: "#000000",
              borderWidth: 2,
            },
          },
        },
      ],
    };
  }, [data, granularity, lockedIndex]);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      <div className="flex items-center justify-center gap-5 text-xs font-bold text-black mb-1">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] border-[1.5px] border-black bg-[#4ADE80] shrink-0" />
          <span>Additions (+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] border-[1.5px] border-black bg-[#F87171] shrink-0" />
          <span>Deletions (-)</span>
        </div>
      </div>

      <EChartContainer
        options={chartOptions}
        height="280px"
        onChartReady={(instance) => {
          chartInstanceRef.current = instance;

          instance.getZr().on("click", (event) => {
            // If a card is already persisted, any click unpersists
            if (lockedIndexRef.current !== null) {
              setLockedIndex(null);
              isLockingJustNowRef.current = true;
              setTimeout(() => {
                isLockingJustNowRef.current = false;
              }, 0);
              return;
            }

            // Capture cursor position for tooltip re-show after React re-render
            lastClickPosRef.current = [event.offsetX, event.offsetY];

            // If no card is persisted, lock onto the bar column the user clicked in
            const pointInPixel = [event.offsetX, event.offsetY];
            if (instance.containPixel({ gridIndex: 0 }, pointInPixel)) {
              try {
                const converted = instance.convertFromPixel({ gridIndex: 0 }, pointInPixel);
                if (Array.isArray(converted) && typeof converted[0] === "number") {
                  const dataIndex = Math.round(converted[0]);
                  if (dataIndex >= 0 && dataIndex < data.length) {
                    setLockedIndex(dataIndex);
                    return;
                  }
                }
              } catch {
                // Ignore conversion errors
              }
            }
            setLockedIndex(null);
          });

          instance.on("click", (params: any) => {
            if (isLockingJustNowRef.current) return;
            if (typeof params.dataIndex === "number") {
              setLockedIndex(params.dataIndex);
            }
          });
        }}
      />
    </div>
  );
}
