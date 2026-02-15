import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Shared Utils & Types
import { generateMatchReport } from "./utils/pdfGenerator";
import { ModelResult, PlayerStats } from "./types";
import { DEFAULT_FPS, SHOT_TYPES, CHART_COLORS } from "./constants";

/**
 * MainPage Component
 * * Displays the analyzed match results dashboard.
 * * Features: Video playback, event logs, statistical charts, and AI insights.
 */
export default function MainPage(): JSX.Element {
  // --- State Management ---
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [modelResult, setModelResult] = useState<ModelResult | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [logFilter, setLogFilter] = useState<string>("All");

  // Refs for PDF Generation & Scrolling
  const logContainerRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---
  const normalizeLabel = (label: string) =>
    label.toLowerCase().replace(/_/g, " ").trim();

  const formatLabel = (label: string) => {
    const match = SHOT_TYPES.find(
      (s) => normalizeLabel(s) === normalizeLabel(label),
    );
    return (
      match ||
      label
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    );
  };

  /**
   * Data Persistence
   * Loads the analysis result from localStorage to persist state across refreshes.
   */
  useEffect(() => {
    const stored = localStorage.getItem("modelResult");
    if (stored) {
      try {
        const parsed: ModelResult = JSON.parse(stored);

        // Filter out invalid/negative detections
        if (parsed?.events) {
          parsed.events = parsed.events.filter(
            (e) => e.label?.toLowerCase() !== "negative",
          );
        }
        setModelResult(parsed);

        // Resolve Google Cloud Storage URI to public URL if needed
        const gcsUri =
          parsed?.outputs?.overlay_mp4?.gcs_uri ||
          parsed?.outputs?.overlay_video;
        if (gcsUri) {
          setSelectedVideo(
            gcsUri.replace("gs://", "https://storage.googleapis.com/"),
          );
        }
      } catch (error) {
        console.error("Failed to parse model result from storage", error);
      }
    }
  }, []);

  // --- Derived State (Memoized for Performance) ---

  const timeUnit = useMemo(() => {
    if (!modelResult?.events?.length) return "frames";
    // Heuristic: if timestamps are large integers, they are likely frames
    const avg =
      modelResult.events.slice(0, 5).reduce((acc, e) => acc + (e.t0 || 0), 0) /
      5;
    return avg > 100 ? "frames" : "seconds";
  }, [modelResult]);

  const playerIds = useMemo(() => {
    if (!modelResult?.events) return [];
    return Array.from(
      new Set(modelResult.events.map((e) => e.track_id)),
    ).sort();
  }, [modelResult]);

  /**
   * Calculates shot counts per player for charts and tables.
   * Returns object: { "Smash": [player1Count, player2Count], ... }
   */
  const playerStats: PlayerStats = useMemo(() => {
    if (!modelResult?.events || playerIds.length === 0) return {};

    const stats: PlayerStats = {};
    SHOT_TYPES.forEach(
      (type) => (stats[type] = Array(playerIds.length).fill(0)),
    );

    modelResult.events.forEach((e) => {
      const key = SHOT_TYPES.find(
        (t) => normalizeLabel(t) === normalizeLabel(e.label),
      );
      const playerIdx = playerIds.indexOf(e.track_id);

      if (key && playerIdx !== -1) {
        stats[key][playerIdx] += 1;
      }
    });
    return stats;
  }, [modelResult, playerIds]);

  const chartData = useMemo(() => {
    // Transform playerStats into Recharts-friendly format
    return SHOT_TYPES.map((shot) => {
      // Only return if at least one player has data for this shot (optional optimization)
      return {
        shot,
        counts: playerIds.map((_, idx) => playerStats[shot]?.[idx] || 0),
      };
    });
  }, [playerStats, playerIds]);

  // --- Event Listeners & Effects ---

  // Sync Video Time
  useEffect(() => {
    const vid = document.getElementById("video-player") as HTMLVideoElement;
    if (!vid) return;
    const updateTime = () => setCurrentTime(vid.currentTime);
    vid.addEventListener("timeupdate", updateTime);
    return () => vid.removeEventListener("timeupdate", updateTime);
  }, [selectedVideo]);

  // Sync Current Event Log Highlight
  useEffect(() => {
    if (!modelResult?.events) return;
    const idx = modelResult.events
      .map((e) => (timeUnit === "frames" ? e.t0 / DEFAULT_FPS : e.t0))
      .reduce((acc, t, i) => (t <= currentTime ? i : acc), -1);

    setCurrentEventIndex(idx === -1 ? 0 : idx);
  }, [currentTime, modelResult, timeUnit]);

  // Auto-scroll Logs
  useEffect(() => {
    const container = logContainerRef.current;
    const active = container?.querySelector(".active-event") as HTMLDivElement;

    if (container && active) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const offset = activeRect.top - containerRect.top + container.scrollTop;
      const scrollTarget = Math.max(
        0,
        offset - container.clientHeight / 2 + active.offsetHeight / 2,
      );

      container.scrollTo({ top: scrollTarget, behavior: "smooth" });
    }
  }, [currentEventIndex]);

  // --- Action Handlers ---

  const handleDownloadCSV = () => {
    if (!modelResult?.events) return;

    const filteredEvents = modelResult.events.filter(
      (e) =>
        logFilter === "All" ||
        normalizeLabel(e.label) === normalizeLabel(logFilter),
    );

    const csvRows = [
      "Time (s),Shot Type,Player ID",
      ...filteredEvents.map((e) => {
        const t = timeUnit === "frames" ? e.t0 / DEFAULT_FPS : e.t0;
        return `${t.toFixed(1)},${formatLabel(e.label)},Player ${e.track_id}`;
      }),
    ];

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "match_event_logs.csv";
    link.click();
  };

  const handleDownloadSummaryCSV = () => {
    const csvRows = [
      `Shot Type,${playerIds.map((id) => `Player ${id}`).join(",")}`,
      ...SHOT_TYPES.map((shot) => {
        const counts = playerIds.map((_, idx) => playerStats[shot]?.[idx] || 0);
        return `${shot},${counts.join(",")}`;
      }),
    ];

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "shot_summary.csv";
    link.click();
  };

  const handleGeneratePDF = () => {
    if (!modelResult) return;
    generateMatchReport({
      modelResult,
      playerIds,
      playerStats,
      chartElement: barChartRef.current,
      timeUnit,
      fps: DEFAULT_FPS,
    });
  };

  // Pre-process AI text for display
  const cleanAnalysisText = (text: string) =>
    text
      .replace(/^### (.*)$/gm, "<h4 class='font-semibold'>$1</h4>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header Navigation */}
      <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white">
        <nav className="max-w-6xl mx-auto px-6 py-6 flex justify-center space-x-12">
          <Link
            to="/"
            className="text-lg font-medium text-white hover:text-purple-200 transition-colors"
          >
            Home
          </Link>
          <Link
            to="/about"
            className="text-lg font-medium text-white hover:text-purple-200 transition-colors"
          >
            About
          </Link>
          <Link
            to="/main"
            className="text-lg font-medium text-purple-100 hover:text-white transition-colors"
          >
            Main
          </Link>
        </nav>
      </header>

      <main className="flex-grow flex flex-col items-center p-6 space-y-6 bg-gray-100">
        {/* --- Section 1: Video Player & Event Logs --- */}
        <div className="w-full max-w-7xl bg-white shadow-lg rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Video Player */}
            <div className="flex-1 bg-black rounded-xl overflow-hidden flex items-center justify-center h-[512px]">
              {selectedVideo ? (
                <video
                  id="video-player"
                  src={selectedVideo}
                  controls
                  autoPlay
                  muted
                  className="w-full h-[450px] object-contain rounded-xl"
                />
              ) : (
                <div className="text-white p-8 text-center">
                  No video loaded. Please upload a file on the Home page.
                </div>
              )}
            </div>

            {/* Event Logs Panel */}
            {modelResult?.events && (
              <div className="w-full md:w-[400px] bg-white shadow-lg rounded-xl p-4 text-black flex flex-col h-[512px]">
                <h3 className="font-semibold text-2xl text-center mb-2">
                  Event Logs
                </h3>

                {/* Filter Dropdown */}
                <div className="flex items-center gap-2 justify-end mb-2">
                  <span className="font-medium">Filter:</span>
                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="bg-white border rounded p-1 text-sm"
                  >
                    <option value="All">All</option>
                    {SHOT_TYPES.map((shot) => (
                      <option key={shot} value={shot}>
                        {shot}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Log List */}
                <div
                  ref={logContainerRef}
                  className="flex-1 overflow-y-auto border rounded-lg p-2 bg-gray-50 text-sm"
                >
                  {modelResult.events
                    .filter(
                      (e) =>
                        logFilter === "All" ||
                        normalizeLabel(e.label) === normalizeLabel(logFilter),
                    )
                    .map((e, idx) => {
                      const t =
                        timeUnit === "frames" ? e.t0 / DEFAULT_FPS : e.t0;
                      const isActive = idx === currentEventIndex;
                      return (
                        <div
                          key={idx}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            isActive
                              ? "active-event bg-purple-200 font-semibold"
                              : "hover:bg-gray-200"
                          }`}
                          onClick={() => {
                            setCurrentEventIndex(idx);
                            const vid = document.getElementById(
                              "video-player",
                            ) as HTMLVideoElement;
                            if (vid) vid.currentTime = t;
                          }}
                        >
                          [{t.toFixed(1)}s]{" "}
                          <span className="font-medium">
                            {formatLabel(e.label)}
                          </span>{" "}
                          by Player {e.track_id}
                        </div>
                      );
                    })}
                </div>

                <div className="flex justify-center mt-4">
                  <button
                    className="bg-purple-500 text-white px-5 py-2 rounded text-sm hover:bg-purple-600 transition"
                    onClick={handleDownloadCSV}
                  >
                    Download Logs CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- Section 2: Statistics & Analysis --- */}
        {playerIds.length > 0 && (
          <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Shot Summary Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-2">
              <div className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl p-6 flex flex-col text-black">
                <h3 className="font-semibold text-2xl text-center mb-2">
                  Shot Summary
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 text-center text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-2 py-1">Shot Type</th>
                        {playerIds.map((id) => (
                          <th key={id} className="border px-2 py-1">
                            Player {id}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SHOT_TYPES.map((shot, idx) => (
                        <tr
                          key={shot}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="border px-2 py-1 font-medium">
                            {shot}
                          </td>
                          {playerIds.map((_, j) => (
                            <td key={j} className="border px-2 py-1">
                              {playerStats[shot]?.[j] || 0}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-center mt-6">
                  <button
                    className="bg-purple-500 text-white px-5 py-2 rounded text-sm hover:bg-purple-600 transition"
                    onClick={handleDownloadSummaryCSV}
                  >
                    Download Summary CSV
                  </button>
                </div>
              </div>

              {/* Bar Charts */}
              <div className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl p-6 flex flex-col text-black">
                <h3 className="font-semibold text-2xl text-center mb-2">
                  Shot Distribution per Player
                </h3>
                <div ref={barChartRef} className="flex flex-col gap-4">
                  {[0, 1].map((idx) => {
                    const id = playerIds[idx];
                    if (id === undefined) return null;

                    // Filter data for specific player chart
                    const playerChartData = chartData.map((d) => ({
                      shot: d.shot,
                      count: d.counts[idx],
                    }));

                    return (
                      <div key={id} className="flex-1">
                        <h4 className="font-semibold text-center mb-2">
                          Player {id}
                        </h4>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart
                            data={playerChartData}
                            margin={{
                              top: 10,
                              right: 10,
                              left: 10,
                              bottom: 45,
                            }}
                          >
                            <XAxis
                              dataKey="shot"
                              angle={-90}
                              textAnchor="end"
                              interval={0}
                              height={60}
                            />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar
                              dataKey="count"
                              fill={CHART_COLORS[idx % CHART_COLORS.length]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Insights & References */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-2">
              {/* AI Analysis Text */}
              <div className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl p-6 flex flex-col text-black">
                <h3 className="font-semibold text-2xl text-center mb-3">
                  AI Analysis
                </h3>
                <div
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 text-base text-gray-800 leading-relaxed whitespace-pre-wrap overflow-y-auto scrollbar-thin"
                  style={{ height: "400px", maxHeight: "400px" }}
                  dangerouslySetInnerHTML={{
                    __html: modelResult?.aiSummary
                      ? cleanAnalysisText(modelResult.aiSummary)
                      : "AI summary will appear here.",
                  }}
                />
              </div>

              {/* Professional Matches */}
              <div className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl p-6 flex flex-col text-black">
                <h3 className="font-semibold text-2xl text-center mb-3">
                  Recommended Professional Matches
                </h3>
                <div
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 text-base text-gray-800 leading-relaxed overflow-y-auto scrollbar-thin"
                  style={{ height: "400px", maxHeight: "400px" }}
                >
                  {modelResult?.aiVerified ? (
                    modelResult.aiVerified
                      .trim()
                      .split("\n")
                      .filter((line) => line.trim() !== "")
                      .map((line, idx) => {
                        const [name, link] = line.split(" - ");
                        return (
                          <div key={idx} className="mb-3">
                            <span className="text-black font-medium">
                              {name?.trim()}
                            </span>
                            {link && (
                              <>
                                <span className="text-gray-600"> - </span>
                                <a
                                  href={link.trim()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-700 hover:text-purple-900 underline break-all"
                                >
                                  {link.trim()}
                                </a>
                              </>
                            )}
                          </div>
                        );
                      })
                  ) : (
                    <span className="text-gray-500 italic">
                      AI recommended matches will appear here.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PDF Generation Action */}
      {modelResult?.aiSummary && (
        <div className="flex justify-center py-6 bg-gray-100">
          <button
            className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition shadow-lg transform active:scale-95 font-medium"
            onClick={handleGeneratePDF}
          >
            Generate Final Report
          </button>
        </div>
      )}
    </div>
  );
}
