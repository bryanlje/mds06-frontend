import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import About from "./About";
import MainPage from "./MainPage";

function App() {
  /**
   * Session Management
   * Clears localStorage and sessionStorage when the user closes the tab or refreshes.
   * This ensures a clean state for file uploads on every new session.
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.clear();
      sessionStorage.clear();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/main" element={<MainPage />} />
      </Routes>
    </Router>
  );
}

export default App;
