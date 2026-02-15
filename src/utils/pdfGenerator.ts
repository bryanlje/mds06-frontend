import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ModelResult, PlayerStats } from "../types";
import { SHOT_TYPES } from "../constants";

interface GeneratePDFParams {
  modelResult: ModelResult;
  playerIds: number[];
  playerStats: PlayerStats;
  chartElement: HTMLElement | null; // The DOM node for the chart
  timeUnit: "frames" | "seconds";
  fps: number;
}

/**
 * Generates a professional PDF report including AI summaries,
 * charts, event logs, and statistical tables.
 */
export const generateMatchReport = async ({
  modelResult,
  playerIds,
  playerStats,
  chartElement,
  timeUnit,
  fps,
}: GeneratePDFParams) => {
  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 40;
  const pdfWidth = pageWidth - margin * 2;

  let yOffset = margin;

  // --- Helper: Label Formatter ---
  const formatLabel = (label: string) => {
    const normalize = (l: string) => l.toLowerCase().replace(/_/g, " ").trim();
    const match = SHOT_TYPES.find((s) => normalize(s) === normalize(label));
    return match || label.replace(/_/g, " ");
  };

  // --- Section 1: AI Summary ---
  if (modelResult?.aiSummary) {
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(18);

    const title = "Match Analysis";
    pdf.text(title, (pageWidth - pdf.getTextWidth(title)) / 2, yOffset);
    yOffset += 30;

    // Process markdown-style bolding (**text**) locally for PDF
    const plainText = modelResult.aiSummary
      .replace(/<\/?[^>]+(>|$)/g, "")
      .trim();
    const lines = plainText.split("\n").filter((l) => l.trim() !== "");

    lines.forEach((line) => {
      // Simple splitting by bold markers
      const parts = line.split(/(\*\*.*?\*\*)/g);
      parts.forEach((part) => {
        if (!part) return;
        if (/\*\*(.*?)\*\*/.test(part)) {
          pdf.setFont(undefined, "bold");
          pdf.setFontSize(12);
          const text = part.replace(/\*\*/g, "");
          const splitText = pdf.splitTextToSize(text, pdfWidth);
          pdf.text(splitText, margin, yOffset);
          yOffset += splitText.length * 14;
        } else {
          pdf.setFont(undefined, "normal");
          pdf.setFontSize(10);
          const splitText = pdf.splitTextToSize(part, pdfWidth);
          pdf.text(splitText, margin, yOffset);
          yOffset += splitText.length * 12;
        }
      });
      yOffset += 10;
    });
    yOffset += 30;
  }

  // --- Section 2: Chart Image ---
  if (chartElement) {
    const chartTitle = "Shot Distribution Between Players";
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(16);
    pdf.text(
      chartTitle,
      (pageWidth - pdf.getTextWidth(chartTitle)) / 2,
      yOffset,
    );
    yOffset += 15;

    const chartCanvas = await html2canvas(chartElement, { scale: 2 });
    const chartImg = chartCanvas.toDataURL("image/png");
    const chartMaxWidth = pageWidth - margin * 2;
    const chartHeight = 300;

    // Center chart
    const xOffset = (pageWidth - chartMaxWidth) / 2 + 30;
    pdf.addImage(
      chartImg,
      "PNG",
      xOffset,
      yOffset,
      chartMaxWidth - 60,
      chartHeight,
    );

    yOffset += chartHeight + 40;
  }

  // --- Page Break for Data Logs ---
  pdf.addPage();
  yOffset = margin;

  // --- Section 3: Event Logs ---
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(16);
  const logsTitle = "Event Logs";
  pdf.text(logsTitle, (pageWidth - pdf.getTextWidth(logsTitle)) / 2, yOffset);
  yOffset += 25;

  if (modelResult.events && modelResult.events.length > 0) {
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(9);

    modelResult.events.forEach((event) => {
      const eventTime = timeUnit === "frames" ? event.t0 / fps : event.t0;
      const line = `[${eventTime.toFixed(1)}s] ${formatLabel(event.label)} by Player ${event.track_id}`;
      const splitText = pdf.splitTextToSize(line, pdfWidth);

      pdf.text(splitText, margin, yOffset);
      yOffset += splitText.length * 12;

      if (yOffset > pageHeight - margin) {
        pdf.addPage();
        yOffset = margin;
      }
    });
    yOffset += 20;
  }

  // --- Section 4: Summary Table ---
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(16);
  const tableTitle = "Shot Summary Table";

  const rowHeight = 18;
  const tableHeight = rowHeight * (SHOT_TYPES.length + 1);

  // Check if table fits, else new page
  if (yOffset + tableHeight + margin > pageHeight) {
    pdf.addPage();
    yOffset = margin;
  }

  pdf.text(tableTitle, (pageWidth - pdf.getTextWidth(tableTitle)) / 2, yOffset);
  yOffset += 20;

  // Render Table
  const cellPadding = 4;
  const cols = playerIds.length + 1;
  const colWidth = pdfWidth / cols;

  // Header
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(10);
  pdf.text("Shot Type", margin + cellPadding, yOffset + 12);
  playerIds.forEach((id, idx) => {
    const x = margin + colWidth * (idx + 1) + cellPadding;
    pdf.text(`Player ${id}`, x, yOffset + 12);
  });

  // Header Grid
  for (let c = 0; c < cols; c++) {
    pdf.rect(margin + colWidth * c, yOffset, colWidth, rowHeight);
  }
  yOffset += rowHeight;

  // Rows
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(9);
  SHOT_TYPES.forEach((shot) => {
    if (yOffset + rowHeight + margin > pageHeight) {
      pdf.addPage();
      yOffset = margin;
    }

    // Grid
    for (let c = 0; c < cols; c++) {
      pdf.rect(margin + colWidth * c, yOffset, colWidth, rowHeight);
    }

    // Data
    pdf.text(shot, margin + cellPadding, yOffset + 12);
    playerIds.forEach((_, idx) => {
      const x = margin + colWidth * (idx + 1) + cellPadding;
      pdf.text((playerStats[shot]?.[idx] || 0).toString(), x, yOffset + 12);
    });
    yOffset += rowHeight;
  });

  pdf.save("match_report.pdf");
};
