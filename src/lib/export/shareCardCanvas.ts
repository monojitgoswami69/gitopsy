/**
 * GITOPSY DEVELOPER CARD CANVAS 2D RENDERER
 * Canonical 4:5 Portrait Developer Identity Artifact
 * Output Resolution: 1080x1350 (Rendered internally at 2160x2700 @ 2x Retina)
 * 100% in-browser, zero dependencies, zero cloud API calls.
 */

import { DeveloperCardData } from "@/lib/analytics/developerCard";

/**
 * Wraps text into multiple lines within a maximum pixel width.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Draws the ONE canonical Gitopsy Developer Card.
 */
export function drawDeveloperCard(
  ctx: CanvasRenderingContext2D,
  data: DeveloperCardData,
  avatarImage?: HTMLImageElement | null
) {
  const W = 2160;
  const H = 2700;

  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // 1. Paper Background Fill (warm cream tone)
  ctx.fillStyle = "#F7F3EB";
  ctx.fillRect(0, 0, W, H);

  // 2. Subtle Archival Dot Grid Texture
  ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
  for (let x = 60; x < W; x += 60) {
    for (let y = 60; y < H; y += 60) {
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
  }

  // 3. Card Outer Frame & Solid Hard Drop Shadow
  const pad = 100;
  const cardW = W - pad * 2; // 1960px
  const cardH = H - pad * 2; // 2500px

  // Solid offset shadow
  ctx.fillStyle = "#000000";
  ctx.fillRect(pad + 20, pad + 20, cardW, cardH);

  // Main Card Body (Off-White Paper)
  ctx.fillStyle = "#FFFDF9";
  ctx.fillRect(pad, pad, cardW, cardH);
  ctx.lineWidth = 14;
  ctx.strokeStyle = "#000000";
  ctx.strokeRect(pad, pad, cardW, cardH);

  const innerX = pad + 90;
  const innerW = cardW - 180; // 1780px

  // =========================================================================
  // SECTION 1: FORENSIC DOCUMENT HEADER
  // =========================================================================
  const headerY = pad + 90;

  // Brandmark
  ctx.fillStyle = "#000000";
  ctx.font = "900 62px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("GITOPSY", innerX, headerY);

  // Badge tag
  ctx.fillStyle = "#FFDC58";
  ctx.fillRect(innerX + 340, headerY - 30, 420, 60);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#000000";
  ctx.strokeRect(innerX + 340, headerY - 30, 420, 60);

  ctx.fillStyle = "#000000";
  ctx.font = "800 26px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("DEVELOPER EXAMINATION", innerX + 340 + 210, headerY);

  // File Number Stamp
  ctx.textAlign = "right";
  ctx.fillStyle = "#000000";
  ctx.font = "900 36px 'JetBrains Mono', monospace";
  ctx.fillText(data.fileNo, innerX + innerW, headerY);

  // Divider Line below header
  const div1Y = headerY + 65;
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(innerX, div1Y);
  ctx.lineTo(innerX + innerW, div1Y);
  ctx.stroke();

  // =========================================================================
  // SECTION 2: DEVELOPER IDENTITY STRIP
  // =========================================================================
  const idY = div1Y + 50;
  const avatarSize = 220;

  // Avatar shadow & frame
  ctx.fillStyle = "#000000";
  ctx.fillRect(innerX + 10, idY + 10, avatarSize, avatarSize);

  ctx.fillStyle = data.accentColor || "#FFDC58";
  ctx.fillRect(innerX, idY, avatarSize, avatarSize);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#000000";
  ctx.strokeRect(innerX, idY, avatarSize, avatarSize);

  if (avatarImage && avatarImage.complete && avatarImage.naturalWidth > 0) {
    try {
      ctx.drawImage(avatarImage, innerX, idY, avatarSize, avatarSize);
      ctx.strokeRect(innerX, idY, avatarSize, avatarSize);
    } catch {
      // Fallback
    }
  }

  // Developer Info
  const textX = innerX + avatarSize + 55;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  ctx.fillStyle = "#6B7280";
  ctx.font = "800 24px 'JetBrains Mono', monospace";
  ctx.fillText("SUBJECT PROFILE", textX, idY + 10);

  ctx.fillStyle = "#000000";
  ctx.font = "900 74px 'JetBrains Mono', monospace";
  ctx.fillText(`@${data.username}`, textX, idY + 46);

  if (data.displayName) {
    ctx.font = "700 40px sans-serif";
    ctx.fillStyle = "#374151";
    ctx.fillText(data.displayName, textX, idY + 138);
  }

  if (data.memberSinceYear) {
    const tenureY = idY + 188;
    ctx.fillStyle = "#F3F4F6";
    ctx.fillRect(textX, tenureY, 260, 40);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#000000";
    ctx.strokeRect(textX, tenureY, 260, 40);

    ctx.fillStyle = "#1F2937";
    ctx.font = "800 20px 'JetBrains Mono', monospace";
    ctx.fillText(`MEMBER SINCE ${data.memberSinceYear}`, textX + 16, tenureY + 10);
  }

  // Divider Line below identity
  const div2Y = idY + avatarSize + 50;
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(innerX, div2Y);
  ctx.lineTo(innerX + innerW, div2Y);
  ctx.stroke();

  // =========================================================================
  // SECTION 3: PRIMARY FINDING (HERO VISUAL CENTERPIECE)
  // =========================================================================
  const heroStartY = div2Y + 45;

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#6B7280";
  ctx.font = "900 26px 'JetBrains Mono', monospace";
  ctx.fillText("THE RECORD SUGGESTS", innerX, heroStartY);

  // Showcase Box for the Finding
  const boxY = heroStartY + 45;
  const boxH = 600;

  // Box Shadow
  ctx.fillStyle = "#000000";
  ctx.fillRect(innerX + 12, boxY + 12, innerW, boxH);

  // Box Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(innerX, boxY, innerW, boxH);
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#000000";
  ctx.strokeRect(innerX, boxY, innerW, boxH);

  // Dynamic Accent Top Border inside box
  ctx.fillStyle = data.accentColor || "#FFDC58";
  ctx.fillRect(innerX, boxY, innerW, 18);
  ctx.fillStyle = "#000000";
  ctx.fillRect(innerX, boxY + 18, innerW, 4);

  // Big Bold Primary Classification Title
  ctx.fillStyle = "#000000";
  ctx.font = "900 130px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(data.primaryClassification.toUpperCase(), W / 2, boxY + 175);

  // Metric Ribbon / Pill
  const ribW = 860;
  const ribH = 88;
  const ribX = W / 2 - ribW / 2;
  const ribY = boxY + 270;

  ctx.fillStyle = "#000000";
  ctx.fillRect(ribX + 6, ribY + 6, ribW, ribH);

  ctx.fillStyle = data.accentColor || "#FFDC58";
  ctx.fillRect(ribX, ribY, ribW, ribH);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#000000";
  ctx.strokeRect(ribX, ribY, ribW, ribH);

  ctx.fillStyle = "#000000";
  ctx.font = "900 44px 'JetBrains Mono', monospace";
  ctx.fillText(data.classificationMetric.toUpperCase(), W / 2, ribY + ribH / 2);

  // Curated Forensic Quote
  ctx.fillStyle = "#374151";
  ctx.font = "600 italic 44px sans-serif";
  const quoteLines = wrapText(ctx, `“${data.caseNote}”`, innerW - 140);
  quoteLines.forEach((line, idx) => {
    ctx.fillText(line, W / 2, ribY + ribH + 90 + idx * 56);
  });

  // Divider Line below primary finding
  const div3Y = boxY + boxH + 45;
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(innerX, div3Y);
  ctx.lineTo(innerX + innerW, div3Y);
  ctx.stroke();

  // =========================================================================
  // SECTION 4: DEVELOPER RECORD (UNIVERSAL ACTIVITY HIGHLIGHTS)
  // =========================================================================
  const recordStartY = div3Y + 40;

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#6B7280";
  ctx.font = "900 24px 'JetBrains Mono', monospace";
  ctx.fillText("ACTIVITY RECORD", innerX, recordStartY);

  // 4 Universal Stat Cards
  const statsList = [
    {
      label: "TOTAL COMMITS",
      val: data.totalCommits.toLocaleString(),
      sub: "ON RECORD",
    },
    {
      label: "ACTIVE DAYS",
      val: `${data.activeDays}`,
      sub: "ENGAGED",
    },
    {
      label: "MAX STREAK",
      val: `${data.longestStreak}D`,
      sub: "UNBROKEN",
    },
    {
      label: "PEAK CADENCE",
      val: `${data.busiestHour.toString().padStart(2, "0")}:00`,
      sub: data.timezoneAbbr || "LOCAL",
    },
  ];

  const statCardGap = 24;
  const statCardW = (innerW - statCardGap * 3) / 4;
  const statCardH = 190;
  const statCardY = recordStartY + 42;

  statsList.forEach((stat, i) => {
    const scX = innerX + i * (statCardW + statCardGap);

    ctx.fillStyle = "#000000";
    ctx.fillRect(scX + 6, statCardY + 6, statCardW, statCardH);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(scX, statCardY, statCardW, statCardH);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000000";
    ctx.strokeRect(scX, statCardY, statCardW, statCardH);

    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Label
    ctx.fillStyle = "#6B7280";
    ctx.font = "800 20px 'JetBrains Mono', monospace";
    ctx.fillText(stat.label, scX + 20, statCardY + 20);

    // Value
    ctx.fillStyle = "#000000";
    ctx.font = "900 46px 'JetBrains Mono', monospace";
    ctx.fillText(stat.val, scX + 20, statCardY + 68);

    // Sub
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "700 18px 'JetBrains Mono', monospace";
    ctx.fillText(stat.sub, scX + 20, statCardY + 135);
  });

  // Divider Line below activity record
  const div4Y = statCardY + statCardH + 45;
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(innerX, div4Y);
  ctx.lineTo(innerX + innerW, div4Y);
  ctx.stroke();

  // =========================================================================
  // SECTION 5: CODE DNA / DIALECTS
  // =========================================================================
  const dnaStartY = div4Y + 40;

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#6B7280";
  ctx.font = "900 24px 'JetBrains Mono', monospace";
  ctx.fillText("CODE DNA · PROGRAMMING DIALECTS", innerX, dnaStartY);

  // Horizontal Segmented Dialect Bar
  const barY = dnaStartY + 42;
  const barH = 46;

  // Bar shadow
  ctx.fillStyle = "#000000";
  ctx.fillRect(innerX + 6, barY + 6, innerW, barH);

  // Bar container frame
  ctx.fillStyle = "#E5E7EB";
  ctx.fillRect(innerX, barY, innerW, barH);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#000000";
  ctx.strokeRect(innerX, barY, innerW, barH);

  // Segment fills
  let currBarX = innerX;
  const totalPercent = data.codeDna.reduce((acc, item) => acc + item.percentage, 0) || 100;

  data.codeDna.forEach((dna, idx) => {
    const segW = Math.max(12, Math.round((dna.percentage / totalPercent) * innerW));
    const drawW = Math.min(segW, innerX + innerW - currBarX);
    if (drawW <= 0) return;

    ctx.fillStyle = dna.color || "#3178C6";
    ctx.fillRect(currBarX, barY, drawW, barH);

    // Segment divider
    if (idx > 0) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(currBarX, barY, 3, barH);
    }
    currBarX += drawW;
  });
  ctx.strokeRect(innerX, barY, innerW, barH);

  // Dialect Breakdown Legend Pills
  const legendY = barY + barH + 32;
  ctx.textBaseline = "middle";

  let legendX = innerX;
  data.codeDna.forEach((dna) => {
    const text = `${dna.name} ${dna.percentage}%`;
    ctx.font = "900 26px 'JetBrains Mono', monospace";
    const textWidth = ctx.measureText(text).width;
    const pillWidth = textWidth + 60;

    // Pill background
    ctx.fillStyle = "#F3F4F6";
    ctx.fillRect(legendX, legendY - 20, pillWidth, 40);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#000000";
    ctx.strokeRect(legendX, legendY - 20, pillWidth, 40);

    // Color dot
    ctx.fillStyle = dna.color || "#3178C6";
    ctx.beginPath();
    ctx.arc(legendX + 22, legendY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";
    ctx.stroke();

    // Text
    ctx.fillStyle = "#111827";
    ctx.textAlign = "left";
    ctx.fillText(text, legendX + 42, legendY);

    legendX += pillWidth + 24;
  });

  // Divider Line above footer
  const div5Y = legendY + 55;
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(innerX, div5Y);
  ctx.lineTo(innerX + innerW, div5Y);
  ctx.stroke();

  // =========================================================================
  // SECTION 6: SMALL FORENSIC FOOTER
  // =========================================================================
  const footerY = pad + cardH - 65;

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#6B7280";
  ctx.font = "800 28px 'JetBrains Mono', monospace";
  ctx.fillText("GITOPSY DEVELOPER RECORD", innerX, footerY);

  ctx.textAlign = "right";
  ctx.fillStyle = "#000000";
  ctx.font = "900 38px 'JetBrains Mono', monospace";
  ctx.fillText("gitopsy.app", innerX + innerW, footerY);

  ctx.restore();
}

/**
 * Loads avatar image asynchronously for Canvas rendering.
 */
function loadAvatarImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Generates PNG Blob for the Developer Card at 2160x2700 Retina resolution.
 */
export async function generateDeveloperCardBlob(
  data: DeveloperCardData
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = 2160;
  canvas.height = 2700;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const avatarImg = await loadAvatarImage(data.avatarUrl);
  drawDeveloperCard(ctx, data, avatarImg);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
}

export async function downloadDeveloperCard(data: DeveloperCardData): Promise<void> {
  const blob = await generateDeveloperCardBlob(data);
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gitopsy-${data.username.toLowerCase()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyDeveloperCardToClipboard(data: DeveloperCardData): Promise<boolean> {
  try {
    const blob = await generateDeveloperCardBlob(data);
    if (!blob) return false;

    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function shareNativeDeveloperCard(data: DeveloperCardData): Promise<boolean> {
  try {
    const blob = await generateDeveloperCardBlob(data);
    if (!blob) return false;

    const file = new File([blob], `gitopsy-${data.username}.png`, {
      type: "image/png",
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Gitopsy Developer Card: @${data.username}`,
        text: `My Gitopsy Developer Card: ${data.primaryClassification} — ${data.classificationMetric}`,
        files: [file],
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
