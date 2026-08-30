"use client";

import React, { useMemo, useState } from "react";
import { EChartContainer } from "./EChartContainer";
import type { EChartsOption } from "echarts";

export interface LanguageByteEntry {
  name: string;
  bytes: number;
  percentage: number;
  repoCount?: number;
  isFunctional?: boolean;
}

export const LANGUAGE_PALETTE = [
  "#FF6B6B",
  "#4D96FF",
  "#6BCB77",
  "#FFDC58",
  "#C084FC",
  "#FD9745",
  "#2DD4BF",
  "#F43F5E",
];

export function groupLanguagesWithOthers(languages: LanguageByteEntry[]): LanguageByteEntry[] {
  if (!languages || languages.length === 0) return [];

  const mainLanguages: LanguageByteEntry[] = [];
  const otherLanguages: LanguageByteEntry[] = [];

  for (const lang of languages) {
    if (lang.percentage >= 5) {
      mainLanguages.push(lang);
    } else {
      otherLanguages.push(lang);
    }
  }

  if (otherLanguages.length === 0) {
    return mainLanguages;
  }

  const otherBytes = otherLanguages.reduce((acc, l) => acc + l.bytes, 0);
  const totalBytes = languages.reduce((acc, l) => acc + l.bytes, 0);
  const otherPct = totalBytes > 0 ? Math.round((otherBytes / totalBytes) * 100) : 0;

  mainLanguages.push({
    name: "Others",
    bytes: otherBytes,
    percentage: otherPct,
    repoCount: otherLanguages.reduce((acc, l) => acc + (l.repoCount || 0), 0),
    isFunctional: true,
  });

  return mainLanguages;
}

export function LanguagesSunburst({ languages }: { languages: LanguageByteEntry[] }) {
  const palette = LANGUAGE_PALETTE;
  const grouped = useMemo(() => groupLanguagesWithOthers(languages), [languages]);

  const chartOptions: EChartsOption = useMemo(() => {
    const data = grouped.map((l, idx) => {
      const pctLabel = l.percentage > 0 ? `${l.percentage}%` : l.bytes > 0 ? "<1%" : "0%";
      const estLines = Math.round(l.bytes / 35);
      return {
        value: l.bytes,
        name: `${l.name} (${pctLabel})`,
        langName: l.name,
        percentageLabel: pctLabel,
        bytes: l.bytes,
        repoCount: l.repoCount || 0,
        estLines,
        isFunctional: l.isFunctional,
        itemStyle: {
          color: l.name === "Others" ? "#94A3B8" : palette[idx % palette.length],
          borderColor: "#000",
          borderWidth: 2.5,
        },
      };
    });

    return {
      tooltip: {
        trigger: "item",
        backgroundColor: "#FFFFFF",
        borderColor: "#000000",
        borderWidth: 1.5,
        extraCssText: "border-radius: 6px; padding: 8px 12px;",
        textStyle: {
          color: "#000000",
          fontFamily: "monospace",
          fontSize: 11,
        },
        formatter: (params: any) => {
          const d = params.data || {};
          const kb = ((d.bytes || params.value || 0) / 1024).toFixed(1);
          const mb = ((d.bytes || params.value || 0) / (1024 * 1024)).toFixed(2);
          const loc = (d.estLines || Math.round((d.bytes || 0) / 35)).toLocaleString();
          const repos = d.repoCount || 0;
          const colorDot = params.color || "#000";

          return `
            <div style="display:flex; flex-direction:column; gap:6px; min-width:180px;">
              <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1.5px solid #000; padding-bottom:5px; gap:8px;">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${colorDot}; border:1px solid #000;"></span>
                  <strong style="font-size:13px; font-weight:900; text-transform:uppercase; color:#000;">${d.langName || params.name}</strong>
                </div>
                <span style="color:#000; font-weight:900; font-size:12px;">${d.percentageLabel || ""}</span>
              </div>
              <div style="display:flex; flex-direction:column; gap:3px; font-size:11px; color:#374151;">
                <div style="display:flex; justify-content:space-between; gap:10px;">
                  <span style="font-weight:700; color:#4B5563;">Code Volume:</span>
                  <strong style="color:#000;">${kb} KB (${mb} MB)</strong>
                </div>
                <div style="display:flex; justify-content:space-between; gap:10px;">
                  <span style="font-weight:700; color:#4B5563;">Est. Lines:</span>
                  <strong style="color:#000;">~${loc} LOC</strong>
                </div>
                <div style="display:flex; justify-content:space-between; gap:10px;">
                  <span style="font-weight:700; color:#4B5563;">Repositories:</span>
                  <strong style="color:#000;">${repos} ${repos === 1 ? "repo" : "repos"}</strong>
                </div>
              </div>
            </div>
          `;
        },
      },
      legend: {
        show: false,
      },
      series: [
        {
          name: "Languages",
          type: "pie",
          center: ["50%", "50%"],
          radius: ["42%", "82%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 0,
            borderColor: "#000",
            borderWidth: 2.5,
          },
          label: {
            show: false,
            position: "center",
          },
          emphasis: {
            scale: true,
            scaleSize: 5,
            itemStyle: {
              shadowBlur: 8,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.35)",
              borderColor: "#000",
              borderWidth: 3,
            },
          },
          data,
        },
      ],
    };
  }, [grouped, palette]);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <EChartContainer options={chartOptions} height="180px" />
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-2 px-2 max-w-[360px] mx-auto text-center select-none">
        {grouped.map((l, idx) => {
          const pctLabel = l.percentage > 0 ? `${l.percentage}%` : l.bytes > 0 ? "<1%" : "0%";
          const dotColor = l.name === "Others" ? "#94A3B8" : palette[idx % palette.length];
          return (
            <div
              key={l.name}
              className="flex items-center gap-1.5 shrink-0"
            >
              <span
                className="size-2.5 rounded-[3px] border-[1.5px] border-black shrink-0"
                style={{ backgroundColor: dotColor }}
              />
              <span className="text-[11px] font-bold text-black whitespace-nowrap">
                {l.name} ({pctLabel})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
