"use client";

import { useMemo } from "react";
import { EChartContainer } from "./EChartContainer";
import type { EChartsOption } from "echarts";

export function TemporalHoursChart({
  commitsByHour,
  commitsByWeekday,
  timezoneAbbr,
}: {
  commitsByHour: number[];
  commitsByWeekday: number[];
  timezoneAbbr?: string;
}) {
  const tzLabel = timezoneAbbr || "Local";
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const totalHourCommits = useMemo(() => commitsByHour.reduce((a, b) => a + b, 0), [commitsByHour]);
  const totalWeekdayCommits = useMemo(() => commitsByWeekday.reduce((a, b) => a + b, 0), [commitsByWeekday]);
  const weekdayFullNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const hourOptions: EChartsOption = useMemo(() => {
    return {
      grid: { left: 10, right: 15, top: 25, bottom: 10, containLabel: true },
      xAxis: {
        type: "category",
        data: hours,
        axisLine: { lineStyle: { color: "#000", width: 2 } },
        axisLabel: { color: "#000", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: "#000", width: 2 } },
        splitLine: { lineStyle: { color: "#E5E7EB", width: 1.5 } },
        axisLabel: { color: "#000", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5 },
      },
      series: [
        {
          data: commitsByHour,
          type: "bar",
          itemStyle: {
            color: (params: any) => {
              const hour = params.dataIndex;
              // 9 PM - 4 AM highlight
              return hour >= 21 || hour <= 4 ? "#C084FC" : "#FFDC58";
            },
            borderColor: "#000",
            borderWidth: 2,
            borderRadius: [3, 3, 0, 0],
          },
        },
      ],
      tooltip: {
        show: true,
        trigger: "axis",
        backgroundColor: "transparent",
        borderColor: "transparent",
        borderWidth: 0,
        extraCssText: "background: transparent !important; border: none !important; padding: 0 !important; box-shadow: none !important; pointer-events: none;",
        textStyle: {
          color: "#000000",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
        },
        axisPointer: {
          type: "shadow",
          shadowStyle: {
            color: "rgba(0, 0, 0, 0.05)",
          },
        },
        formatter: (params: any) => {
          const item = params[0];
          if (!item) return "";
          const commits = Number(item.value) || 0;

          return `
            <div style="background:#FFFFFF; border:1.5px solid #000000; border-radius:6px; padding:6px 10px; font-family:monospace; box-shadow:2.5px 2.5px 0 0 rgba(0,0,0,0.15);">
              <div style="font-weight:900; font-size:12px; color:#000;">${item.name} ${tzLabel}</div>
              <div style="font-size:11px; font-weight:700; color:#374151; margin-top:2px;">Commits: <strong style="color:#000; font-weight:900;">${commits}</strong></div>
            </div>
          `;
        },
      },
    };
  }, [commitsByHour, tzLabel, hours]);

  const weekdayOptions: EChartsOption = useMemo(() => {
    return {
      grid: { left: 10, right: 15, top: 25, bottom: 10, containLabel: true },
      xAxis: {
        type: "category",
        data: weekdays,
        axisLine: { lineStyle: { color: "#000", width: 2 } },
        axisLabel: { color: "#000", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: "#000", width: 2 } },
        splitLine: { lineStyle: { color: "#E5E7EB", width: 1.5 } },
        axisLabel: { color: "#000", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5 },
      },
      series: [
        {
          data: commitsByWeekday,
          type: "bar",
          itemStyle: {
            color: (params: any) => {
              const day = params.dataIndex;
              return day === 0 || day === 6 ? "#4D96FF" : "#6BCB77";
            },
            borderColor: "#000",
            borderWidth: 2,
            borderRadius: [3, 3, 0, 0],
          },
        },
      ],
      tooltip: {
        show: true,
        trigger: "axis",
        backgroundColor: "transparent",
        borderColor: "transparent",
        borderWidth: 0,
        extraCssText: "background: transparent !important; border: none !important; padding: 0 !important; box-shadow: none !important; pointer-events: none;",
        textStyle: {
          color: "#000000",
          fontFamily: "monospace",
          fontSize: 11,
        },
        axisPointer: {
          type: "shadow",
          shadowStyle: {
            color: "rgba(0, 0, 0, 0.05)",
          },
        },
        formatter: (params: any) => {
          const item = params[0];
          if (!item) return "";
          const dayIdx = item.dataIndex;
          const dayFull = weekdayFullNames[dayIdx] || item.name;
          const commits = Number(item.value) || 0;

          return `
            <div style="background:#FFFFFF; border:1.5px solid #000000; border-radius:6px; padding:6px 10px; font-family:monospace; box-shadow:2.5px 2.5px 0 0 rgba(0,0,0,0.15);">
              <div style="font-weight:900; font-size:12px; color:#000;">${dayFull}</div>
              <div style="font-size:11px; font-weight:700; color:#374151; margin-top:2px;">Commits: <strong style="color:#000; font-weight:900;">${commits}</strong></div>
            </div>
          `;
        },
      },
    };
  }, [commitsByWeekday, weekdays, weekdayFullNames]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 w-full">
      <div className="border-[2px] border-black bg-white p-3.5 rounded-[8px]">
        <h4 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>24-Hour Forensic Clock ({tzLabel})</span>
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono font-bold bg-white px-2 py-0.5 border border-black rounded text-black">
            <span className="size-2 rounded-full bg-[#C084FC] border border-black shrink-0" />
            Night Owl
          </span>
        </h4>
        <EChartContainer options={hourOptions} height="240px" />
      </div>
      <div className="border-[2px] border-black bg-white p-3.5 rounded-[8px]">
        <h4 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Weekday Cadence Distribution</span>
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono font-bold bg-white px-2 py-0.5 border border-black rounded text-black">
            <span className="size-2 rounded-full bg-[#4D96FF] border border-black shrink-0" />
            Weekend
          </span>
        </h4>
        <EChartContainer options={weekdayOptions} height="240px" />
      </div>
    </div>
  );
}
