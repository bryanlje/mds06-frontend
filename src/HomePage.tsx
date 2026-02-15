import { useState, DragEvent, ChangeEvent} from 'react';
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';

type FileWithPreview = File & { preview?: string };

export default function HomePage(): JSX.Element {
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();


  const handleFileDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files: FileWithPreview[] = Array.from(e.dataTransfer.files)
      .filter(f => f.type === 'video/mp4')
      .map(f => Object.assign(f, { preview: URL.createObjectURL(f) }));
    setUploadedFiles(files);
    setStatusMessage(null);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files: FileWithPreview[] = Array.from(e.target.files)
      .filter(f => f.type === 'video/mp4')
      .map(f => Object.assign(f, { preview: URL.createObjectURL(f) }));
    setUploadedFiles(files);
    setStatusMessage(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // --------------------------------------------------------------
  // Function: uploadToGC
  // Purpose: Upload user-selected files to Google Cloud Storage
  // Requirement:
  //    The system must upload videos securely using a pre-signed URL.
  // This function retrieves a signed URL from the backend and uploads
  // each file directly to Google Cloud Storage.
  // --------------------------------------------------------------
  const uploadToGC = async () => {
  if (uploadedFiles.length === 0) return;

  setUploading(true);
  setStatusMessage("Uploading...");
  setUploadProgress(0);

  try {
    const uploadedKeys: string[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];

      // 1️⃣ Request a signed URL from backend
      const urlRes = await fetch(
        `/api/upload-url?filename=${encodeURIComponent(file.name)}&filetype=${encodeURIComponent(file.type)}`
      );
      const { uploadUrl, key } = await urlRes.json();

      if (!urlRes.ok || !uploadUrl) {
        throw new Error(`Failed to get pre-signed URL for ${file.name}`);
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            // Overall progress across all files
            const percent =
              Math.round(
                ((i + event.loaded / event.total) / uploadedFiles.length) * 100
              );
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) resolve();
          else reject(new Error(`Upload failed for ${file.name}`));
        };

        xhr.onerror = () => reject(new Error(`Upload error for ${file.name}`));

        xhr.send(file);
      });

      uploadedKeys.push(key);
      setStatusMessage(`Upload complete for ${file.name}`);
    }

    setUploading(false);
    setStatusMessage("All uploads complete! Running model...");
    setIsProcessing(true);

    const firstKey = uploadedKeys[0];

    //ML Pipeline Execution — Send uploaded file to processing container
    const modelRes = await fetch("/api/run-model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: firstKey }),
    });
    if (!modelRes.ok) throw new Error("Model run failed");
    const modelData = await modelRes.json();

    //Shot summary for AI analysis
    const events = modelData.events || [];
    const shotTypes = [
      "Smash", "Jump Smash", "Block", "Drop", "Clear", "Lift", "Drive",
      "Straight Net", "Cross Net", "Serve", "Push", "Tap"
    ];

    const uniqueIds = Array.from(new Set(events.map((e: any) => e.track_id)));
    const normalizeLabel = (label: string) => label.toLowerCase().replace(/_/g, " ").trim();

    const playerStats: { [key: string]: number[] } = {};
    shotTypes.forEach(type => (playerStats[type] = Array(uniqueIds.length).fill(0)));

    events.forEach((e: any) => {
      const key = shotTypes.find(t => normalizeLabel(t) === normalizeLabel(e.label));
      const idx = uniqueIds.indexOf(e.track_id);
      if (key && idx !== -1) playerStats[key][idx] += 1;
    });

    const summaryTable = shotTypes.map((shot) => ({
      shot,
      ...Object.fromEntries(uniqueIds.map((id, idx) => [`player${id}`, playerStats[shot][idx] || 0]))
    }));

    // 🔹 Step 3: Run AI analysis
    setStatusMessage("Running AI analysis...");
    const aiRes = await fetch("/api/analyze-table", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summaryTable }),
    });
    if (!aiRes.ok) throw new Error("AI analysis failed");
    const aiData = await aiRes.json();

    // 🔹 Combine model + AI result
    const finalResult = {
      ...modelData,
      aiSummary: aiData.aiSummary,
      aiVerified: aiData.aiVerified
    };

    // Save results in localStorage
    localStorage.setItem("modelResult", JSON.stringify(finalResult));

    setStatusMessage("Processing complete! Redirecting...");
    navigate(`/main`)

  } catch (err: any) {
    console.error("Upload error:", err);
    setStatusMessage(`Error: ${err.message}`);
    setUploading(false);
    setIsProcessing(false);
  }
};


  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
        {/* Navigation omitted for brevity */}
        <nav className="relative z-10 max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center space-x-12">
           <Link 
                to="/" 
                className="relative text-lg font-medium text-purple-100 group transition-all duration-300 hover:text-white no-underline"
                style={{ textDecoration: 'none', color: '#e9d5ff' }}
              >
                Home
                <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 transform scale-x-100 transition-transform duration-300 group-hover:scale-x-100"></span>
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
                className="relative text-lg font-medium text-white group transition-all duration-300 hover:text-purple-200 no-underline"
                style={{ textDecoration: 'none', color: 'white' }}
              >
                Main
                <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-110"></span>
              </Link>
          </div>
        </nav>
      </header>

      {/* Video Playback Section */}
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



      {/* Upload Section */}
      <section className="flex flex-col items-center py-10 bg-gray-200 flex-grow">
        <h2 className="text-3xl sm:text-4xl font-semibold mb-6 text-center text-black">
          Upload Your Videos
        </h2>

        <div
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          className="w-full max-w-2xl border-4 border-dashed border-blue-400 bg-white rounded-lg p-8 text-center text-gray-600 cursor-pointer hover:border-blue-500 hover:bg-blue-50"
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <p className="mb-2">Drag & Drop your MP4 files here or click to select</p>
          <input
            id="fileInput"
            type="file"
            accept="video/mp4"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-6 w-full max-w-2xl px-4">
            <h3 className="text-xl font-semibold mb-2 text-black">Files to be uploaded:</h3>
            <ul className="list-disc list-inside space-y-1">
              {uploadedFiles.map((file, idx) => (
                <li key={idx} className="flex justify-between items-center text-black">
                  <span>{file.name}</span>
                  <span className="text-sm text-black">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-col items-center w-full max-w-2xl">
              <div className="flex flex-wrap gap-4 justify-center">
                <button onClick={uploadToGC} disabled={uploading} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button onClick={() => setUploadedFiles([])} disabled={uploading} className="px-6 py-3 bg-gray-500 text-white rounded-lg">
                  Clear
                </button>
              </div>

            {uploading && (
              <div className="w-full mt-4">
                <div className="bg-gray-300 h-4 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-center text-gray-700 mt-2">{statusMessage}</p>
              </div>
            )}
          </div>
          </div>
        )}
      </section>
      {isProcessing && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-70 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <video
            src="/loading_video.mp4"
            autoPlay
            loop
            muted
            className="w-[800px] max-w-[90%] rounded-2xl shadow-2xl border border-white"
          />
          <p className="text-white mt-6 text-xl font-semibold tracking-wide animate-pulse">
            Processing model... please wait
          </p>
        </div>
      )}
    </div>
  );
}