"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { EChartContainer } from "./EChartContainer";
import type { EChartsOption } from "echarts";
import type * as echarts from "echarts";

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
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);
  const lockedIndexRef = useRef<number | null>(null);
  lockedIndexRef.current = lockedIndex;

  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isLockingJustNowRef = useRef(false);

  // Surgically toggle tooltip tracking and focus-dimming on the live instance.
  // This does NOT rebuild chart options — the tooltip stays exactly where it is.
  const freezeTooltip = useCallback((index: number) => {
    const instance = chartInstanceRef.current;
    if (!instance || instance.isDisposed()) return;
    instance.setOption({
      tooltip: { triggerOn: "none", alwaysShowContent: true },
      series: [
        {
          emphasis: {
            focus: "self",
            itemStyle: {
              borderColor: "#000000",
              borderWidth: 2,
              opacity: 1,
            },
          },
        },
      ],
    });
    instance.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: index });
    instance.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: index });
  }, []);

  const unfreezeTooltip = useCallback(() => {
    const instance = chartInstanceRef.current;
    if (!instance || instance.isDisposed()) return;
    instance.setOption({
      tooltip: { triggerOn: "mousemove", alwaysShowContent: false },
      series: [
        {
          emphasis: {
            focus: "none",
            itemStyle: {
              borderColor: "#000000",
              borderWidth: 1.5,
              opacity: 0.85,
            },
          },
        },
      ],
    });
    instance.dispatchAction({ type: "downplay" });
    instance.dispatchAction({ type: "hideTip" });
    instance.dispatchAction({ type: "updateAxisPointer", currTrigger: "leave" });

    // Safety RAF to guarantee tooltip DOM element is dismissed immediately on outside clicks
    requestAnimationFrame(() => {
      if (!instance || instance.isDisposed()) return;
      instance.dispatchAction({ type: "hideTip" });
      instance.dispatchAction({ type: "downplay" });
    });
  }, []);

  // When lockedIndex changes, freeze or unfreeze — nothing else
  useEffect(() => {
    if (lockedIndex !== null) {
      freezeTooltip(lockedIndex);
    } else {
      unfreezeTooltip();
    }
  }, [lockedIndex, freezeTooltip, unfreezeTooltip]);

  // Release locking when clicking anywhere outside the chart container
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

  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();

    const ro = new ResizeObserver(() => {
      updateWidth();
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const dataMap = useMemo(() => {
    const map = new Map<string, HeatmapDataPoint>();
    for (const d of data) {
      map.set(d.date, d);
    }
    return map;
  }, [data]);

  // Chart options are ONLY rebuilt when data, dataMap, metricLabel or containerWidth change
  const chartOptions: EChartsOption = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        title: { text: "No evidence recorded for heatmap", left: "center" },
      };
    }

    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);

    // Compute exactly how many weeks fit into current screen width so cells remain crisp squares with zero text collision
    const width = containerWidth || (typeof window !== "undefined" ? window.innerWidth - 48 : 800);
    const availableWidth = Math.max(180, width - 52); // account for left day labels (36px) and right padding (16px)
    const maxWeeks = Math.max(12, Math.floor(availableWidth / 13.5));
    const maxDays = maxWeeks * 7;

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - maxDays);
    const startDateIso = startDate.toISOString().slice(0, 10);

    const formattedData = data.map((d) => [d.date, Math.max(0, d.count)]);
    const counts = data.map((d) => d.count).filter((c) => c > 0);
    const maxVal = counts.length > 0 ? Math.max(...counts) : 5;

    // Calculate gap-free contiguous quartile thresholds
    const q1 = Math.max(2, Math.round(maxVal * 0.25));
    const q2 = Math.max(q1 + 1, Math.round(maxVal * 0.50));
    const q3 = Math.max(q2 + 1, Math.round(maxVal * 0.75));

    return {
      animationDurationUpdate: 0,
      visualMap: {
        show: true,
        type: "piecewise",
        dimension: 1, // Explicitly map numeric count (index 1 in [date, count])
        orient: "horizontal",
        left: "center",
        bottom: 2,
        padding: 0,
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
        top: 22,
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
          fontWeight: 900,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
        },
        monthLabel: {
          color: "#000",
          fontWeight: 900,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
        },
      },
      series: [
        {
          type: "heatmap",
          coordinateSystem: "calendar",
          data: formattedData,
          cursor: "pointer",
          emphasis: {
            focus: "none",
            itemStyle: {
              borderColor: "#000000",
              borderWidth: 1.5,
              opacity: 0.85,
            },
          },
          blur: {
            itemStyle: {
              opacity: 0.58,
            },
          },
        },
      ],
      tooltip: {
        show: true,
        trigger: "item",
        triggerOn: "mousemove",
        alwaysShowContent: false,
        confine: false,
        appendTo: "body",
        transitionDuration: 0,
        position: (point: any, params: any, el: any, rect: any, size: any) => {
          const contentW = size?.contentSize?.[0] || 230;
          const contentH = size?.contentSize?.[1] || 110;
          const viewW = size?.viewSize?.[0] || 800;

          const targetX = rect && typeof rect.x === "number" ? rect.x : point[0];
          const targetW = rect && typeof rect.width === "number" ? rect.width : 12.5;
          const targetY = rect && typeof rect.y === "number" ? rect.y : point[1];
          const targetH = rect && typeof rect.height === "number" ? rect.height : 12.5;

          // 10.5px gap from cell to card edge gives a clear 2.5-3px gap to the arrow tip
          let x = targetX + targetW + 10.5;

          // If placing to the right would overflow, place to the left instead
          if (x + contentW > viewW - 4) {
            x = targetX - contentW - 10.5;
          }

          x = Math.max(4, Math.min(viewW - contentW - 4, x));

          // Align vertically with the center of the cell
          const y = targetY + targetH / 2 - contentH / 2;

          return [x, y];
        },
        backgroundColor: "transparent",
        borderColor: "transparent",
        borderWidth: 0,
        extraCssText: "background: transparent !important; border: none !important; padding: 0 !important; box-shadow: none !important; pointer-events: none;",
        textStyle: {
          color: "#000000",
          fontFamily: "monospace",
          fontSize: 11,
        },
        formatter: (params: any) => {
          const [date, count] = params.value || [];
          if (!date) return "";
          const entry = dataMap.get(date);
          const commits = entry?.commits ?? (metricLabel === "COMMITS" ? count : 0);
          const adds = entry?.additions ?? 0;
          const dels = entry?.deletions ?? 0;
          const net = adds - dels;
          const totalVolume = adds + dels;

          const dateObj = new Date(date + "T00:00:00");
          const humanDate = !isNaN(dateObj.getTime())
            ? dateObj.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : date;

          const isLeft = (typeof params.dataIndex === "number" && data.length > 0)
            ? params.dataIndex >= data.length * 0.72
            : false;

          return `
            <div style="position:relative; background:#FFFFFF; border:1.5px solid #000000; border-radius:6px; padding:7px 11px; font-family:monospace; min-width:210px; box-shadow:3px 3px 0 0 rgba(0,0,0,0.15);">
              ${isLeft ? `
                <div style="position:absolute; right:-6px; top:50%; width:10px; height:10px; background:#FFFFFF; border-top:1.5px solid #000000; border-right:1.5px solid #000000; transform:translateY(-50%) rotate(45deg); z-index:10; box-sizing:border-box;"></div>
              ` : `
                <div style="position:absolute; left:-6px; top:50%; width:10px; height:10px; background:#FFFFFF; border-left:1.5px solid #000000; border-bottom:1.5px solid #000000; transform:translateY(-50%) rotate(45deg); z-index:10; box-sizing:border-box;"></div>
              `}
              <div style="display:flex; flex-direction:column; gap:5px; position:relative; z-index:1;">
                <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1.5px solid #000; padding-bottom:3px; gap:8px;">
                  <span style="font-weight:900; font-size:12px; color:#000;">${humanDate}</span>
                  <span style="font-size:10px; font-weight:800; color:#4B5563; font-family:monospace;">${commits} ${commits === 1 ? "commit" : "commits"}</span>
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
                  <span>Gross Volume:</span>
                  <span>${totalVolume.toLocaleString()} lines</span>
                </div>
              </div>
            </div>
          `;
        },
      },
    };
  }, [data, dataMap, metricLabel, containerWidth]);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      <EChartContainer
        options={chartOptions}
        height="136px"
        onChartReady={(instance) => {
          chartInstanceRef.current = instance;

          instance.getZr().on("click", () => {
            // If a day card is already persisted, any click strictly unpersists
            if (lockedIndexRef.current !== null) {
              setLockedIndex(null);
              isLockingJustNowRef.current = true;
              setTimeout(() => {
                isLockingJustNowRef.current = false;
              }, 0);
            }
          });

          instance.on("click", (params: any) => {
            if (isLockingJustNowRef.current) return;
            if (params.componentType === "series" && typeof params.dataIndex === "number") {
              setLockedIndex(params.dataIndex);
            }
          });

          // Hold highlight and background dimming while a day is locked
          instance.getZr().on("mousemove", () => {
            if (lockedIndexRef.current !== null) {
              instance.dispatchAction({
                type: "highlight",
                seriesIndex: 0,
                dataIndex: lockedIndexRef.current,
              });
            }
          });

          instance.getZr().on("globalout", () => {
            if (lockedIndexRef.current !== null) {
              instance.dispatchAction({
                type: "highlight",
                seriesIndex: 0,
                dataIndex: lockedIndexRef.current,
              });
            }
          });
        }}
      />
    </div>
  );
}
