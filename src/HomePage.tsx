import { useState, DragEvent, ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";

type FileWithPreview = File & { preview?: string };

/**
 * HomePage Component
 * * The entry point for the application. It handles:
 * 1. File selection via Drag & Drop or System Dialog.
 * 2. Secure file upload to Google Cloud Storage (GCS).
 * 3. Triggering the backend ML pipeline.
 * 4. Redirecting to the Main analysis page upon success.
 */
export default function HomePage(): JSX.Element {
  // State Management
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = useNavigate();

  // --- Event Handlers --------------------------------------------------------

  const handleFileDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    processFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(e.target.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Helper to filter and map files to state
  const processFiles = (fileList: FileList) => {
    const files: FileWithPreview[] = Array.from(fileList)
      .filter((f) => f.type === "video/mp4")
      .map((f) => Object.assign(f, { preview: URL.createObjectURL(f) }));

    setUploadedFiles(files);
    setStatusMessage(null);
  };

  /**
   * Core Upload Pipeline
   * 1. Gets a Pre-Signed URL from the backend API.
   * 2. Uploads the raw video file directly to GCS via PUT request.
   * 3. Triggers the ML pipeline (`/api/run-model`).
   * 4. Fetches AI analysis (`/api/analyze-table`).
   * 5. Saves results to localStorage and navigates to Dashboard.
   */
  const uploadToGC = async () => {
    if (uploadedFiles.length === 0) return;

    setUploading(true);
    setStatusMessage("Initializing upload...");
    setUploadProgress(0);

    try {
      const uploadedKeys: string[] = [];

      // Step 1: Upload all files
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];

        // Fetch Signed URL
        const urlRes = await fetch(
          `/api/upload-url?filename=${encodeURIComponent(file.name)}&filetype=${encodeURIComponent(file.type)}`,
        );
        const { uploadUrl, key } = await urlRes.json();

        if (!urlRes.ok || !uploadUrl) {
          throw new Error(`Failed to get pre-signed URL for ${file.name}`);
        }

        // Upload to GCS
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round(
                ((i + event.loaded / event.total) / uploadedFiles.length) * 100,
              );
              setUploadProgress(percent);
            }
          };

          xhr.onload = () =>
            xhr.status === 200 || xhr.status === 201
              ? resolve()
              : reject(new Error(`Upload failed`));
          xhr.onerror = () => reject(new Error(`Network error`));
          xhr.send(file);
        });

        uploadedKeys.push(key);
        setStatusMessage(`Uploaded: ${file.name}`);
      }

      // Step 2: Trigger ML Processing
      setUploading(false);
      setStatusMessage("Upload complete. Initializing AI models...");
      setIsProcessing(true);

      const firstKey = uploadedKeys[0]; // Currently processing single file

      const modelRes = await fetch("/api/run-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: firstKey }),
      });

      if (!modelRes.ok) throw new Error("Model pipeline execution failed");
      const modelData = await modelRes.json();

      // Step 3: Process Data for AI Analysis
      const events = modelData.events || [];
      const shotTypes = [
        "Smash",
        "Jump Smash",
        "Block",
        "Drop",
        "Clear",
        "Lift",
        "Drive",
        "Straight Net",
        "Cross Net",
        "Serve",
        "Push",
        "Tap",
      ];

      // Generate Stats Table locally for AI context
      const uniqueIds = Array.from(new Set(events.map((e: any) => e.track_id)));
      const normalizeLabel = (label: string) =>
        label.toLowerCase().replace(/_/g, " ").trim();

      const playerStats: { [key: string]: number[] } = {};
      shotTypes.forEach(
        (type) => (playerStats[type] = Array(uniqueIds.length).fill(0)),
      );

      events.forEach((e: any) => {
        const key = shotTypes.find(
          (t) => normalizeLabel(t) === normalizeLabel(e.label),
        );
        const idx = uniqueIds.indexOf(e.track_id);
        if (key && idx !== -1) playerStats[key][idx] += 1;
      });

      const summaryTable = shotTypes.map((shot) => ({
        shot,
        ...Object.fromEntries(
          uniqueIds.map((id, idx) => [
            `player${id}`,
            playerStats[shot][idx] || 0,
          ]),
        ),
      }));

      // Step 4: Get Generative AI Insights
      setStatusMessage("Generating AI tactical analysis...");
      const aiRes = await fetch("/api/analyze-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summaryTable }),
      });

      if (!aiRes.ok) throw new Error("AI analysis service failed");
      const aiData = await aiRes.json();

      // Step 5: Finalize & Redirect
      const finalResult = {
        ...modelData,
        aiSummary: aiData.aiSummary,
        aiVerified: aiData.aiVerified,
      };

      localStorage.setItem("modelResult", JSON.stringify(finalResult));
      setStatusMessage("Done! Redirecting...");
      navigate(`/main`);
    } catch (err: any) {
      console.error("Pipeline Error:", err);
      setStatusMessage(`Error: ${err.message}`);
      setUploading(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header Navigation */}
      <header className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
        <nav className="relative z-10 max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center space-x-12">
            <Link
              to="/"
              className="text-lg font-medium text-purple-100 hover:text-white transition-colors"
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
              className="text-lg font-medium text-white hover:text-purple-200 transition-colors"
            >
              Main
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Video Background */}
      <main className="bg-black">
        <video
          controls
          className="w-full h-[470px] object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/tutorial_fixed.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </main>

      {/* File Upload Area */}
      <section className="flex flex-col items-center py-10 bg-gray-200 flex-grow">
        <h2 className="text-3xl sm:text-4xl font-semibold mb-6 text-center text-black">
          Upload Your Videos
        </h2>

        <div
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          className="w-full max-w-2xl border-4 border-dashed border-blue-400 bg-white rounded-lg p-8 text-center text-gray-600 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          <p className="mb-2 text-lg">
            Drag & Drop your MP4 files here or click to select
          </p>
          <input
            id="fileInput"
            type="file"
            accept="video/mp4"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* File List & Controls */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6 w-full max-w-2xl px-4">
            <h3 className="text-xl font-semibold mb-2 text-black">
              Selected Files:
            </h3>
            <ul className="bg-white rounded-lg shadow p-4 space-y-2">
              {uploadedFiles.map((file, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center text-gray-800 border-b last:border-0 pb-2 last:pb-0"
                >
                  <span className="truncate max-w-[80%]">{file.name}</span>
                  <span className="text-sm text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col items-center w-full">
              <div className="flex gap-4">
                <button
                  onClick={uploadToGC}
                  disabled={uploading}
                  className={`px-8 py-3 rounded-lg text-white font-medium shadow-lg transition-transform transform active:scale-95 ${
                    uploading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  }`}
                >
                  {uploading ? "Uploading..." : "Start Analysis"}
                </button>

                <button
                  onClick={() => setUploadedFiles([])}
                  disabled={uploading}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="w-full mt-6">
                  <div className="bg-gray-300 h-4 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-center text-gray-700 mt-2 font-medium">
                    {statusMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-90 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity duration-300">
          <div className="relative w-[800px] max-w-[90%] aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <video
              src="/loading_video.mp4"
              autoPlay
              loop
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
              <p className="text-white text-xl font-semibold tracking-wide animate-pulse">
                Analysing Match Footage...
              </p>
              <p className="text-gray-300 text-sm mt-1">
                This may take a few minutes depending on video length.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
