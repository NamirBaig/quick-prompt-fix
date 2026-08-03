import { jsPDF } from "jspdf";
import type { AnalysisResult, TargetModel } from "./prompt-analysis";
import { XRAY_LABELS, type XRayKey } from "./prompt-analysis";

export function downloadReport(prompt: string, model: TargetModel, result: AnalysisResult) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = margin;

  const ensure = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text: string, size = 14) => {
    ensure(size + 18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(40, 40, 60);
    doc.text(text, margin, y);
    y += size + 8;
  };

  const body = (text: string, size = 10) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(60, 60, 70);
    const lines = doc.splitTextToSize(text, width) as string[];
    for (const line of lines) {
      ensure(size + 4);
      doc.text(line, margin, y);
      y += size + 4;
    }
    y += 6;
  };

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Prompt Doctor AI", margin, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Prompt health report", margin, 68);
  y = 125;

  heading("Summary", 15);
  body(
    `Health score: ${result.score}/100\nComplexity: ${result.complexity}\nTarget model: ${model}\nProjected response quality: ${result.quality}\nEstimated improvement: +${result.improvementPercent}%\nGenerated: ${new Date().toLocaleString()}`,
  );

  heading("Prompt X-Ray");
  body(
    (Object.keys(XRAY_LABELS) as XRayKey[])
      .map((k) => `${result.xray[k] ? "[x]" : "[ ]"} ${XRAY_LABELS[k]}`)
      .join("\n"),
  );

  heading("Detected weaknesses");
  body(
    result.weaknesses.length
      ? result.weaknesses.map((w, i) => `${i + 1}. ${w.title} — ${w.detail}`).join("\n")
      : "None detected. This prompt is already well structured.",
  );

  heading("Improvements applied");
  body(result.improvements.map((i, n) => `${n + 1}. ${i.title} — ${i.detail}`).join("\n"));

  heading("Original prompt");
  body(prompt);

  heading("Optimized prompt");
  body(result.optimized);

  doc.save("prompt-doctor-report.pdf");
}
