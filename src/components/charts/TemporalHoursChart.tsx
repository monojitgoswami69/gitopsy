"use client";

import React, { useMemo } from "react";
import { EChartContainer } from "./EChartContainer";
import type { EChartsOption } from "echarts";

export function TemporalHoursChart({
  commitsByHour,
  commitsByWeekday,
}: {
  commitsByHour: number[];
  commitsByWeekday: number[];
}) {
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const hourOptions: EChartsOption = useMemo(() => {
    return {
      grid: { left: 45, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: "category",
        data: hours,
        axisLine: { lineStyle: { color: "#000", width: 2 } },
        axisLabel: { color: "#000", fontWeight: "bold", fontSize: 10 },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: "#000", width: 2 } },
        splitLine: { lineStyle: { color: "#E5E7EB", width: 1.5 } },
        axisLabel: { color: "#000", fontWeight: "bold" },
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
        trigger: "axis",
        formatter: (params: any) => {
          const item = params[0];
          const isNight = item.dataIndex >= 21 || item.dataIndex <= 4;
          return `
            <div style="font-weight:900;">${item.name} UTC</div>
            <div>Commits: <strong>${item.value}</strong></div>
            ${isNight ? '<div style="color:#9333ea; font-size:11px; font-weight:bold;">🌙 Night Shift Window</div>' : ""}
          `;
        },
      },
    };
  }, [commitsByHour]);

  const weekdayOptions: EChartsOption = useMemo(() => {
    return {
      grid: { left: 45, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: "category",
        data: weekdays,
        axisLine: { lineStyle: { color: "#000", width: 2 } },
        axisLabel: { color: "#000", fontWeight: "bold", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: "#000", width: 2 } },
        splitLine: { lineStyle: { color: "#E5E7EB", width: 1.5 } },
        axisLabel: { color: "#000", fontWeight: "bold" },
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
        trigger: "axis",
        formatter: (params: any) => {
          const item = params[0];
          const isWeekend = item.dataIndex === 0 || item.dataIndex === 6;
          return `
            <div style="font-weight:900;">${item.name}</div>
            <div>Commits: <strong>${item.value}</strong></div>
            ${isWeekend ? '<div style="color:#2563eb; font-size:11px; font-weight:bold;">⚡ Weekend Shipper Window</div>' : ""}
          `;
        },
      },
    };
  }, [commitsByWeekday]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      <div className="border-[3px] border-black bg-white p-4 rounded-[8px] shadow-[4px_4px_0_0_#000]">
        <h4 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>24-Hour Forensic Clock (UTC)</span>
          <span className="text-[10px] bg-[#C084FC] px-2 py-0.5 border border-black rounded">
            Purple = Night Owl
          </span>
        </h4>
        <EChartContainer options={hourOptions} height="240px" />
      </div>
      <div className="border-[3px] border-black bg-white p-4 rounded-[8px] shadow-[4px_4px_0_0_#000]">
        <h4 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Weekday Cadence Distribution</span>
          <span className="text-[10px] bg-[#4D96FF] px-2 py-0.5 border border-black rounded text-black">
            Blue = Weekend
          </span>
        </h4>
        <EChartContainer options={weekdayOptions} height="240px" />
      </div>
    </div>
  );
}
