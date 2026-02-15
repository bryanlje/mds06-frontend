# 🏸 High-Speed Badminton Match AI Analyser (Frontend)

![React](https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)
![Python](https://img.shields.io/badge/Python-FFD43B?style=for-the-badge&logo=python&logoColor=blue)

**High-Speed Badminton Match AI Analyser** is a full-stack web application designed to revolutionise sports analytics. Users can upload raw badminton match footage, which is processed by a sophisticated computer vision pipeline on Google Cloud Platform (GCP). The application returns a detailed breakdown of the match, including shot classification, player statistics, and AI-driven tactical insights.

---

## 🚀 Key Features

### 🎥 Intelligent Video Analysis
* **Automated CV Pipeline:** End-to-end processing including player detection, tracking, shuttlecock trajectory, and contact point detection.
* **Smart Video Player:** Watch the match with overlaid bounding boxes and annotations, synchronised perfectly with event logs.

### 📊 Interactive Dashboard
* **Event Logs:** A clickable, scrollable list of every shot detected (e.g., "Smash by Player 1"). Clicking a log entry jumps the video to that exact timestamp.
* **Data Visualisation:** Interactive bar charts and summary tables powered by `Recharts` to visualise shot distribution and player dominance.
* **Shot Filtering:** Easily filter the feed to see only specific actions (e.g., isolate all "Jump Smashes" or "Net Shots").

### 🤖 AI Coach Insights
* **Generative AI Summary:** The system analyses the statistical data to generate a textual summary of the match, offering professional tactical advice and observations.
* **Pro Match Comparisons:** References similar professional playstyles or matches based on the detected patterns.

### 📄 Reporting
* **PDF Export:** Generate a professional-grade PDF report containing the AI summary, charts, and match logs with a single click.
* **CSV Downloads:** Export raw data for further analysis in Excel or Python.

---

## 🔗 Project Structure & Repositories

This project is divided into three main repositories to handle the frontend, backend logic, and model development separately:

* **Frontend (This Repo):** [https://github.com/bryanlje/mds06-frontend](https://github.com/bryanlje/mds06-frontend)
* **Backend API:** [https://github.com/bryanlje/mds06-backend](https://github.com/bryanlje/mds06-backend)
* **Model Training & Data Preparation:** [https://github.com/bryanlje/mds06-ml](https://github.com/bryanlje/mds06-ml)

---

## 🧠 The AI Pipeline

The core of this application relies on a multi-stage Deep Learning pipeline hosted on **Google Cloud Platform**:

1.  **Ingestion:** User uploads video directly to GCS via secure signed URLs.
2.  **Player Detection & Tracking:** Identifies players and maintains their ID (Player 1 vs. Player 2) throughout the clip.
3.  **Shuttlecock Tracking:** Tracks the high-speed projectile path of the shuttlecock.
4.  **Contact Point Detection:** Identifies the exact frame intervals where a racket strikes the shuttle.
5.  **Shot Classification:** A classifier model determines the specific stroke type based on player pose and shuttle trajectory.
6.  **Aggregation:** Results are compiled into a structured JSON format for the frontend to render.

---

## 📋 Supported Shot Types

The model is trained to recognise the following specific badminton strokes:

| Offensive | Defensive/Neutral | Net Play |
| :--- | :--- | :--- |
| **Smash** | **Block** | **Straight Net** |
| **Jump Smash** | **Lift** | **Cross Net** |
| **Drive** | **Clear** | **Tap** |
| **Push** | **Serve** | **Drop** |

---

## 🛠 Tech Stack

### Frontend
* **Framework:** React (Vite)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Visualisation:** Recharts
* **PDF Generation:** jsPDF, html2canvas
* **Routing:** React Router DOM

### Backend & Infrastructure
* **Cloud Provider:** Google Cloud Platform (GCP)
* **Storage:** Google Cloud Storage (GCS)
* **Compute:** Cloud Run / Compute Engine (for GPU inference)
* **API:** REST API (for handling upload signatures and triggering models)

---

## 🔧 Installation & Setup

Follow these steps to run the frontend application locally.

### Prerequisites
* Node.js (v16+)
* npm or yarn

### Steps

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/bryanlje/mds06-frontend.git](https://github.com/bryanlje/mds06-frontend.git)
    cd mds06-frontend
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory. You will need to point this to your backend API service.
    ```env
    VITE_API_BASE_URL=http://localhost:8000/api
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Open in Browser**
    Navigate to `http://localhost:5173` to view the app.

---

## 📖 Usage Guide

1.  **Upload:**
    * Navigate to the **Home** page.
    * Drag and drop your `.mp4` badminton match file into the upload zone.
    * Click **Upload**. The progress bar will indicate the transfer to Google Cloud.

2.  **Process:**
    * Once uploaded, the system will automatically trigger the AI pipeline. A loading screen will appear while the GPU processes the footage.

3.  **Analyse:**
    * You will be redirected to the **Main** dashboard.
    * Use the **Video Player** to watch the analysed footage.
    * Click on rows in the **Event Logs** to study specific shots.
    * Review the **Bar Charts** to compare player statistics.

4.  **Export:**
    * Scroll to the bottom and click **Generate Final Report** to download the comprehensive PDF.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 👥 Team Members

This project was developed by:

* **Bryan Leong Jing Ern**
* **Phua Yee Yen**
* **Ting Shu Hui**
* **Lee Jian Jun Thomas**

---

## 📄 License

[License Information]

---

## 📧 Contact

Email - [2025mds06@gmail.com](mailto:2025mds06@gmail.com)

Project Link: [https://github.com/bryanlje/mds06-frontend](https://github.com/bryanlje/mds06-frontend)
