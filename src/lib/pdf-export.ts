import jsPDF from 'jspdf';
import type { AnalysisResult } from './analysis-api';

const COLORS = {
  primary: [229, 62, 162] as [number, number, number],     // pink/magenta
  dark: [20, 20, 28] as [number, number, number],
  text: [220, 220, 230] as [number, number, number],
  muted: [140, 140, 160] as [number, number, number],
  excellent: [34, 197, 94] as [number, number, number],
  good: [234, 179, 8] as [number, number, number],
  poor: [239, 68, 68] as [number, number, number],
  cardBg: [30, 30, 42] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function getScoreColor(score: number): [number, number, number] {
  if (score >= 80) return COLORS.excellent;
  if (score >= 60) return COLORS.good;
  return COLORS.poor;
}

export function exportAnalysisPDF(result: AnalysisResult) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 0;

  function checkPage(needed: number) {
    if (y + needed > pageH - 20) {
      doc.addPage();
      // Dark background
      doc.setFillColor(...COLORS.dark);
      doc.rect(0, 0, pageW, pageH, 'F');
      y = margin;
    }
  }

  // === Page background ===
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, pageW, pageH, 'F');

  // === Header ===
  y = margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.white);
  doc.text('Hire', margin, y);
  const hireW = doc.getTextWidth('Hire');
  doc.setTextColor(...COLORS.primary);
  doc.text('Flowly', margin + hireW, y);
  const flowlyW = doc.getTextWidth('Flowly');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text('  Resume Analysis Report', margin + hireW + flowlyW + 2, y);

  // Accent line
  y += 4;
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);

  // Date
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, y);

  // === Overall Score ===
  y += 10;
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(margin, y, contentW, 28, 3, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text('OVERALL SCORE', margin + 8, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...getScoreColor(result.overallScore));
  doc.text(`${result.overallScore}`, margin + 8, y + 23);
  doc.setFontSize(12);
  doc.text('/100', margin + 8 + doc.getTextWidth(`${result.overallScore}`) + 1, y + 23);

  // Sub-scores on the right
  const subScores = [
    { label: 'MATCH', value: result.semanticMatch.score },
    { label: 'IMPACT', value: result.xyzScorer.score },
    { label: 'AUTH', value: result.buzzwordRedliner.score },
  ];
  const subStartX = pageW - margin - 90;
  subScores.forEach((s, i) => {
    const sx = subStartX + i * 30;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...getScoreColor(s.value));
    doc.text(`${s.value}`, sx, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(s.label, sx, y + 20);
  });

  y += 34;

  // === Semantic Match Section ===
  checkPage(50);
  y = drawSectionHeader(doc, 'Semantic JD Match', result.semanticMatch.score, margin, y, contentW);

  // Summary
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  const summaryLines = doc.splitTextToSize(result.semanticMatch.summary, contentW - 16);
  checkPage(summaryLines.length * 4 + 20);
  doc.text(summaryLines, margin + 8, y);
  y += summaryLines.length * 4 + 4;

  // Matched skills
  if (result.semanticMatch.matchedSkills.length > 0) {
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.excellent);
    doc.text('✓ MATCHED SKILLS', margin + 8, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.text(result.semanticMatch.matchedSkills.join('  •  '), margin + 8, y);
    y += 6;
  }

  // Missing skills
  if (result.semanticMatch.missingSkills.length > 0) {
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.poor);
    doc.text('✗ MISSING SKILLS', margin + 8, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.text(result.semanticMatch.missingSkills.join('  •  '), margin + 8, y);
    y += 6;
  }

  y += 8;

  // === X-Y-Z Impact Scorer ===
  checkPage(40);
  y = drawSectionHeader(doc, 'X-Y-Z Impact Scorer', result.xyzScorer.score, margin, y, contentW);

  result.xyzScorer.bullets.forEach((bullet) => {
    const bulletLines = doc.splitTextToSize(`"${bullet.text}"`, contentW - 30);
    checkPage(bulletLines.length * 4 + 18);
    doc.setFillColor(35, 35, 50);
    doc.roundedRect(margin + 4, y - 3, contentW - 8, bulletLines.length * 4 + 14, 2, 2, 'F');
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.text);
    doc.text(bulletLines, margin + 8, y + 2);
    y += bulletLines.length * 4 + 2;

    // Score badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const bColor = bullet.score >= 3 ? COLORS.excellent : bullet.score >= 2 ? COLORS.good : COLORS.poor;
    doc.setTextColor(...bColor);
    doc.text(`${bullet.score}/3`, margin + 8, y + 2);

    // Indicators
    const indicators = [
      { ok: bullet.hasAction, label: 'ACTION' },
      { ok: bullet.hasMetric, label: 'METRIC' },
      { ok: bullet.hasTool, label: 'TOOL' },
    ];
    let ix = margin + 25;
    indicators.forEach((ind) => {
      doc.setFontSize(7);
      doc.setTextColor(...(ind.ok ? COLORS.excellent : COLORS.poor));
      doc.text(`${ind.ok ? '✓' : '✗'} ${ind.label}`, ix, y + 2);
      ix += 22;
    });
    y += 8;

    if (bullet.suggestion && bullet.score < 3) {
      const sugLines = doc.splitTextToSize(`💡 ${bullet.suggestion}`, contentW - 24);
      checkPage(sugLines.length * 4 + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.muted);
      doc.text(sugLines, margin + 12, y);
      y += sugLines.length * 4 + 2;
    }
    y += 4;
  });

  y += 4;

  // === Authenticity ===
  checkPage(30);
  y = drawSectionHeader(doc, 'AI-Authenticity Redliner', result.buzzwordRedliner.score, margin, y, contentW);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  const authLines = doc.splitTextToSize(result.buzzwordRedliner.authenticity, contentW - 16);
  doc.text(authLines, margin + 8, y);
  y += authLines.length * 4 + 4;

  if (result.buzzwordRedliner.flaggedWords.length > 0) {
    result.buzzwordRedliner.flaggedWords.forEach((hit) => {
      checkPage(8);
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.poor);
      doc.text(`"${hit.word}" ×${hit.count}`, margin + 8, y);
      doc.setTextColor(...COLORS.muted);
      doc.text('→', margin + 55, y);
      doc.setTextColor(...COLORS.excellent);
      doc.text(hit.alternative, margin + 62, y);
      y += 6;
    });
  } else {
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.excellent);
    doc.text('✓ No major buzzword issues detected', margin + 8, y);
    y += 6;
  }

  y += 8;

  // === Probing Questions ===
  checkPage(20);
  y = drawSectionHeader(doc, 'Recruiter Probing Questions', undefined, margin, y, contentW);

  result.probingQuestions.forEach((q, i) => {
    const qLines = doc.splitTextToSize(q, contentW - 24);
    checkPage(qLines.length * 4 + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.primary);
    doc.text(`${i + 1}`, margin + 8, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.text);
    doc.text(qLines, margin + 16, y);
    y += qLines.length * 4 + 5;
  });

  // === Footer ===
  y = pageH - 12;
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text('Generated by HireFlowly — Semantic Resume Intelligence', margin, y);
  doc.text('hireflowly.lovable.app', pageW - margin - doc.getTextWidth('hireflowly.lovable.app'), y);

  doc.save('HireFlowly-Analysis-Report.pdf');
}

function drawSectionHeader(doc: jsPDF, title: string, score: number | undefined, margin: number, y: number, contentW: number): number {
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(margin, y, contentW, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  doc.text(title, margin + 8, y + 8);
  if (score !== undefined) {
    const scoreText = `${score}/100`;
    doc.setTextColor(...getScoreColor(score));
    doc.text(scoreText, margin + contentW - 8 - doc.getTextWidth(scoreText), y + 8);
  }
  return y + 18;
}
