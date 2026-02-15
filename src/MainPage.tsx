import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const DEFAULT_FPS = 30;

const shotTypes = [
  "Smash", "Jump Smash", "Block", "Drop", "Clear", "Lift", "Drive",
  "Straight Net", "Cross Net", "Serve", "Push", "Tap"
];

const colors = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7f50",
  "#a4de6c", "#d0ed57", "#8dd1e1", "#ffbb28",
  "#ff8042", "#d88884", "#a28dd1", "#ca82d1", "#84d888"
];

export default function MainPage(): JSX.Element {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [modelResult, setModelResult] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState<{ [key: string]: number[] }>({});
  const [playerIds, setPlayerIds] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [logFilter, setLogFilter] = useState<string>("All");
  const [selectedLogIndex, setSelectedLogIndex] = useState<number | null>(null);


  const logContainerRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const aiAnalysisRef = useRef<HTMLDivElement>(null);
  const summaryContainerRef = useRef<HTMLDivElement>(null);

  const normalizeLabel = (label: string) => label.toLowerCase().replace(/_/g, " ").trim();
  const formatLabel = (label: string) => {
    const match = shotTypes.find(s => normalizeLabel(s) === normalizeLabel(label));
    return match || label
      .split("_")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  // ✅ Load from localStorage (no API calls)
  useEffect(() => {
    const stored = localStorage.getItem("modelResult");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.events) {
      parsed.events = parsed.events.filter(
        (e: any) => e.label?.toLowerCase() !== "negative"
      );
    }
      setModelResult(parsed);
      const gcsUri =
        parsed?.outputs?.overlay_mp4?.gcs_uri ||
        parsed?.outputs?.overlay_video; // direct string fallback
      if (gcsUri) {
        setSelectedVideo(gcsUri.replace("gs://", "https://storage.googleapis.com/"));
      }
    }
  }, []);


  const detectFrameUnit = (events: any[]) => {
  if (!events?.length) return "frames"; // assume frames if unknown
    const avg = events.slice(0, 5).map(e => e.t1 || e.t0 || 0).reduce((a, b) => a + b, 0) / 5;
    return avg > 100 ? "frames" : "seconds";
  };

  const timeUnit = detectFrameUnit(modelResult?.events || []);
  const fps = DEFAULT_FPS; // always use 30 fps


  // Compute stats
  useEffect(() => {
    if (!modelResult?.events) return;
    const events = modelResult.events;
    const uniqueIds = Array.from(new Set(events.map((e: any) => e.track_id)));
    setPlayerIds(uniqueIds);

    const stats: { [key: string]: number[] } = {};
    shotTypes.forEach(type => stats[type] = Array(uniqueIds.length).fill(0));
    events.forEach((e: any) => {
      const key = shotTypes.find(t => normalizeLabel(t) === normalizeLabel(e.label));
      const idx = uniqueIds.indexOf(e.track_id);
      if (key && idx !== -1) stats[key][idx] += 1;
    });
    setPlayerStats(stats);
  }, [modelResult]);

  // Track video time
  useEffect(() => {
    const vid = document.getElementById("video-player") as HTMLVideoElement;
    if (!vid) return;
    const updateTime = () => setCurrentTime(vid.currentTime);
    vid.addEventListener("timeupdate", updateTime);
    return () => vid.removeEventListener("timeupdate", updateTime);
  }, [selectedVideo]);

  // Highlight event log
  useEffect(() => {
    if (!modelResult?.events) return;
    const idx = modelResult.events
      .map((e: any) => timeUnit === "frames" ? e.t0 / fps : e.t0)
      .reduce((acc, t, i) => t <= currentTime ? i : acc, -1);
    setCurrentEventIndex(idx === -1 ? 0 : idx);
  }, [currentTime, modelResult, timeUnit]);

  // Auto scroll active log
  useEffect(() => {
    const container = logContainerRef.current;
    if (!container) return;

    const active = container.querySelector(".active-event") as HTMLDivElement | null;
    if (!active) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const offset = activeRect.top - containerRect.top + container.scrollTop;

    const scrollTarget = Math.max(
      0,
      offset - container.clientHeight / 2 + active.offsetHeight / 2
    );

    container.scrollTo({
      top: scrollTarget,
      behavior: "smooth",
    });
  }, [currentEventIndex, modelResult?.events]);

  const cleanAnalysisText = (text: string) =>
    text.replace(/^### (.*)$/gm, "<h4 class='font-semibold'>$1</h4>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

  const downloadCSV = (data: any[], filename: string) => {
    if (!data?.length) return;
    const csv = [Object.keys(data[0]).join(","), ...data.map(r => Object.values(r).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const generatePDF = async () => {
    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = 595, pageHeight = 842, margin = 40, pdfWidth = pageWidth - margin * 2;
    let yOffset = margin;
    const chartHeight = 400

      // ----------------- AI Analysis Title ----------------------------
    if (modelResult?.aiSummary) {
        pdf.setFont(undefined, "bold");
        pdf.setFontSize(18);
        const title = "Match Analysis";
        const titleWidth = pdf.getTextWidth(title);
        pdf.text(title, (pageWidth - titleWidth) / 2, yOffset); // center title
        yOffset += 30; // space after title
        const plainText = modelResult.aiSummary.replace(/<\/?[^>]+(>|$)/g, "").trim();
        const lines = plainText.split("\n").filter(l => l.trim() !== "");
        lines.forEach(line => {
            const parts = line.split(/(\*\*.*?\*\*)/g);
            parts.forEach(part => {
                if (!part) return;
                if (/\*\*(.*?)\*\*/.test(part)) {
                    const text = part.replace(/\*\*/g, "");
                    pdf.setFont(undefined, "bold");
                    pdf.setFontSize(12);
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
            yOffset += 10; // gap between lines
        });
        yOffset += 30; // extra space between AI text and chart
    }

    // ---------------------------- Fixed Bar Chart ----------------------------
    const chartTitle = "Shot Distribution Between Players";
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(16);
    const titleWidth = pdf.getTextWidth(chartTitle);
    pdf.text(chartTitle, (pageWidth - titleWidth) / 2, yOffset);
    yOffset += 15; // space after title

    if (barChartRef.current) {
      const chartCanvas = await html2canvas(barChartRef.current, { scale: 2 });
      const chartImg = chartCanvas.toDataURL("image/png");

      // ✅ Adjust dimensions for better layout balance
      const chartMaxWidth = pageWidth - margin * 2;   // leaves side margins
      const chartHeight = 300;                        // smaller, balanced height

      // Center horizontally and position nicely
      let xOffset = (pageWidth - chartMaxWidth) / 2;
      xOffset += 70;
      pdf.addImage(chartImg, "PNG", xOffset, yOffset, chartMaxWidth-150, chartHeight);

      // Adjust vertical spacing for next content
      yOffset += chartHeight + 40;
    }
    // ---------------------------- PAGE 2 ----------------------------
    pdf.addPage();
    yOffset = margin;

    // --- Title for Logs ---
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(16);
    const logsTitle = "Event Logs";
    const logsTitleWidth = pdf.getTextWidth(logsTitle);
    pdf.text(logsTitle, (pageWidth - logsTitleWidth) / 2, yOffset);
    yOffset += 25;

    // --- Logs in text ---
    if (modelResult?.events?.length > 0) {
        pdf.setFont(undefined, "normal");
        pdf.setFontSize(9);
        modelResult.events.forEach((event: any, idx: number) => {
            const eventTime = timeUnit === "frames" ? event.t0 / fps : event.t0;
            const line = `[${eventTime.toFixed(1)}s] ${formatLabel(event.label)} by Player ${event.track_id}`;
            const splitText = pdf.splitTextToSize(line, pdfWidth);
            pdf.text(splitText, margin, yOffset);
            yOffset += splitText.length * 12;
            // Page break if needed
            if (yOffset > pageHeight - margin) {
                pdf.addPage();
                yOffset = margin;
            }
        });
        yOffset += 20;
    }

    // --- Title for Shot Summary Table ---
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(16);
    const tableTitle = "Shot Summary Table";
    const tableTitleWidth = pdf.getTextWidth(tableTitle);
    // Calculate approximate table height
    const rowHeight = 18;
    const tableHeight = rowHeight * (shotTypes.length + 1); // +1 for header
    const spaceAfterTitle = 20;
    // If table won't fit on current page, move to new page
    if (yOffset + spaceAfterTitle + tableHeight + margin > pageHeight) {
        pdf.addPage();
        yOffset = margin;
    }

    // Draw table title
    pdf.text(tableTitle, (pageWidth - tableTitleWidth) / 2, yOffset);
    yOffset += spaceAfterTitle;

    // --- Draw Table ---
    const cellPadding = 4;
    const cols = playerIds.length + 1; // +1 for "Shot Type"
    const colWidth = pdfWidth / cols;

    // Header row
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(10);
    pdf.text("Shot Type", margin + cellPadding, yOffset + 12);
    playerIds.forEach((id, idx) => {
        const x = margin + colWidth * (idx + 1) + cellPadding;
        pdf.text(`Player ${id}`, x, yOffset + 12);
    });

    // Draw header boxes
    for (let c = 0; c < cols; c++) {
        const x = margin + colWidth * c;
        pdf.rect(x, yOffset, colWidth, rowHeight);
    }
    yOffset += rowHeight;

    // Table rows
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(9);
    shotTypes.forEach((shot) => {
        // Page break if next row won't fit
        if (yOffset + rowHeight + margin > pageHeight) {
            pdf.addPage();
            yOffset = margin;
        }
        // Draw cell rectangles
        for (let c = 0; c < cols; c++) {
            const x = margin + colWidth * c;
            pdf.rect(x, yOffset, colWidth, rowHeight);
        }
        // Row text
        pdf.text(shot, margin + cellPadding, yOffset + 12);
        playerIds.forEach((id, idx) => {
            const x = margin + colWidth * (idx + 1) + cellPadding;
            pdf.text((playerStats[shot][idx] || 0).toString(), x, yOffset + 12);
        });
        yOffset += rowHeight;
    });

    pdf.save("match_report.pdf");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white">
        <nav className="max-w-6xl mx-auto px-6 py-6 flex justify-center space-x-12">
          <Link 
                to="/" 
                className="relative text-lg font-medium text-white group transition-all duration-300 hover:text-purple-200 no-underline"
                style={{ textDecoration: 'none', color: 'white' }}
              >
                Home
                <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-110"></span>
              </Link>
          <Link 
                to="/about" 
                className="relative text-lg font-medium text-white group transition-all duration-300 hover:text-purple-200 no-underline"
                style={{ textDecoration: 'none', color: 'white' }}
              >
                About
                <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-110"></span>
              </Link>
          <Link 
                to="/main" 
                className="relative text-lg font-medium text-purple-100 group transition-all duration-300 hover:text-white no-underline"
                style={{ textDecoration: 'none', color: '#e9d5ff' }}
              >
                Main
                <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 transform scale-x-100 transition-transform duration-300 group-hover:scale-x-100"></span>
              </Link>
        </nav>
      </header>
      <main className="flex-grow flex flex-col items-center p-6 space-y-6 bg-gray-100">
      {/* VIDEO + LOGS */}
      <div className="w-full max-w-7xl bg-white shadow-lg rounded-xl p-4">
        {/* Video Row */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-black rounded-xl overflow-hidden flex items-center justify-center h-[512px]">
            {selectedVideo ? (
              <video
                id="video-player"
                src={selectedVideo}
                // src="/overlay.mp4"
                controls
                autoPlay
                muted
                className="w-full h-[450px] object-contain rounded-xl"
              />
            ) : (
              <div className="text-white p-8 text-center">No video loaded</div>
            )}
          </div>

          {/* Event Logs */}
          {modelResult?.events && (
            <div className="w-full md:w-[400px] bg-white shadow-lg rounded-xl p-4 text-black flex flex-col h-[512px]">
              <h3 className="font-semibold text-2xl text-center mb-2">Event Logs</h3>
              <div className="flex items-center gap-2 justify-end mb-2">
                <span className="font-medium">Filter:</span>
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="bg-white border rounded p-1 text-sm"
                >
                  <option value="All">All</option>
                  {shotTypes.map((shot) => (
                    <option key={shot} value={shot}>{shot}</option>
                  ))}
                </select>
              </div>
              <div
                ref={logContainerRef}
                className="flex-1 overflow-y-auto border rounded-lg p-2 bg-gray-50 text-sm"
              >
                {modelResult.events
                  .filter(
                    (e: any) =>
                      logFilter === "All" ||
                      normalizeLabel(e.label) === normalizeLabel(logFilter)
                  )
                  .map((e: any, idx: number) => {
                    const t = timeUnit === "frames" ? e.t0 / fps : e.t0;
                    const isActive = idx === currentEventIndex;
                    return (
                      <div
                        key={idx}
                        className={`p-1 rounded cursor-pointer ${
                          isActive
                            ? "active-event bg-purple-200 font-semibold"
                            : "hover:bg-gray-200"
                        }`}
                        onClick={() => {
                          setSelectedLogIndex(idx);
                          setCurrentEventIndex(idx);
                          const vid = document.getElementById("video-player") as HTMLVideoElement;
                          if (vid) vid.currentTime = t;
                        }}
                      >
                        [{t.toFixed(1)}s]{" "}
                        <span className="font-medium">{formatLabel(e.label)}</span>{" "}
                        by Player {e.track_id}
                      </div>
                    );
                  })}
              </div>
              <div className="flex justify-center mt-8">
              <button
                className="bg-purple-500 text-white px-5 py-2 rounded text-sm hover:bg-purple-600 transition"
                onClick={() => {
                  const csvData = modelResult.events
                    .filter(
                      (e: any) =>
                        logFilter === "All" ||
                        normalizeLabel(e.label) === normalizeLabel(logFilter)
                    )
                    .map((e: any) => {
                      const t = timeUnit === "frames" ? e.t0 / fps : e.t0;
                      return {
                        Time: t.toFixed(1),
                        Shot: formatLabel(e.label),
                        Player: `Player ${e.track_id}`,
                      };
                    });
                  downloadCSV(csvData, "event_logs.csv");
                }}
              >
                Download Logs CSV
              </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {playerIds.length > 0 && (
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* ---------- Row 1: Table | Chart ---------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-2">
            {/* Shot Summary Table */}
            <div
              className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl p-6 flex flex-col text-black"
              ref={summaryContainerRef}
            >
              <h3 className="font-semibold text-2xl text-center mb-2">Shot Summary</h3>
              <table className="w-full border border-gray-200 text-center text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1">Shot Type</th>
                    {playerIds.map((id) => (
                      <th key={id} className="border px-2 py-1">Player {id}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shotTypes.map((shot, idx) => (
                    <tr key={shot} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border px-2 py-1">{shot}</td>
                      {playerIds.map((_, j) => (
                        <td key={j} className="border px-2 py-1">{playerStats[shot]?.[j] || 0}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-center mt-10">
                <button
                  className="bg-purple-500 text-white px-5 py-2 rounded text-sm hover:bg-purple-600 transition"
                  onClick={() => {
                    const csvData = shotTypes.map((shot) => {
                      const row: any = { "Shot Type": shot };
                      playerIds.forEach((id, idx) => {
                        row[`Player ${id}`] = playerStats[shot]?.[idx] || 0;
                      });
                      return row;
                    });
                    downloadCSV(csvData, "shot_summary.csv");
                  }}
                >
                  Download Summary CSV
                </button>
              </div>
            </div>

            {/* Bar Chart */}
            <div
              className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl p-6 flex flex-col text-black">
              <h3 className="font-semibold text-2xl text-center mb-2">Shot Distribution per Player</h3>
              <div ref={barChartRef}>
              {[0, 1].map((idx) => {
                const id = playerIds[idx];
                if (id === undefined) return null;
                const data = shotTypes.map((shot) => ({
                  shot,
                  count: playerStats[shot]?.[idx] || 0,
                }));
                return (
                  <div key={id} className="flex-1">
                    <h4 className="font-semibold text-center mb-2">Player {id}</h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 45 }}>
                        <XAxis dataKey="shot" angle={-90} textAnchor="end" interval={0} height={60} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill={colors[idx % colors.length]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
              </div>
            </div>
          </div>

          {/* ---------- Row 2: AI Analysis | AI References ---------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-2">
            {/* AI Analysis */}
            <div className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl p-6 flex flex-col text-black">
              <h3 className="font-semibold text-2xl text-center mb-3">AI Analysis</h3>
              <div
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 text-base text-gray-800 leading-relaxed whitespace-pre-wrap overflow-y-auto"
                style={{ height: "400px", maxHeight: "400px", scrollbarWidth: "thin" }}
                dangerouslySetInnerHTML={{
                  __html: modelResult?.aiSummary
                    ? cleanAnalysisText(modelResult.aiSummary)
                    : "AI summary will appear here.",
                }}
              />
            </div>

            {/* AI References */}
            <div className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl p-6 flex flex-col text-black">
              <h3 className="font-semibold text-2xl text-center mb-3">
                Recommended Professional Matches
              </h3>
              <div
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 text-base text-gray-800 leading-relaxed overflow-y-auto font-medium"
                style={{ height: "400px", maxHeight: "400px", scrollbarWidth: "thin" }}
              >
                {modelResult?.aiVerified ? (
                  modelResult.aiVerified
                    .trim()
                    .split("\n")
                    .filter((line: string) => line.trim() !== "")
                    .map((line: string, idx: number) => {
                      const [name, link] = line.split(" - ");
                      return (
                        <div key={idx} className="mb-3">
                          <span className="text-black">{name.trim()}</span>{" "}
                          <span className="text-gray-600">- </span>
                          <a
                            href={link?.trim()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-700 hover:text-purple-900 underline break-all"
                          >
                            {link?.trim()}
                          </a>
                        </div>
                      );
                    })
                ) : (
                  <span className="text-gray-500">
                    AI recommended matches will appear here.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>

      {/* Generate PDF button */}
      {modelResult?.aiSummary && (
        <div className="flex justify-center py-6">
          <button
            className="bg-purple-600 text-white px-6 py-3 rounded hover:bg-purple-700 transition"
            onClick={generatePDF}
          >
            Generate Final Report
          </button>
        </div>
      )}
    </div>
  );
}
