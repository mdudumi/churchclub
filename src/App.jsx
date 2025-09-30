import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ChurchHome from "./churches/KBBT/ChurchHome";
import NextStepHome from "./churches/KBBT/NextStep/ServiceHome";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedNextStep from "./components/ProtectedNextStep";
import Prayers from "./churches/KBBT/Prayers/Prayers.jsx"; // 👈 renamed path
import WorshipHome from "./churches/KBBT/Worship/WorshipHome";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/kbbt"
          element={
            <ProtectedRoute>
              <ChurchHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kbbt/nextstep"
          element={
            <ProtectedRoute>
              <ProtectedNextStep>
                <NextStepHome />
              </ProtectedNextStep>
            </ProtectedRoute>
          }
        />

        {/* General prayers (service_slug = null) */}
        <Route
          path="/kbbt/prayers"
          element={
            <ProtectedRoute>
              <Prayers />
            </ProtectedRoute>
          }
        />

        {/* Service-specific prayers (serviceSlug = worship, nextstep, etc.) */}
        <Route
          path="/kbbt/:serviceSlug/prayers"
          element={
            <ProtectedRoute>
              <Prayers />
            </ProtectedRoute>
          }
        />

        {/* Adhurimi */}
        <Route
          path="/kbbt/worship"
          element={
            <ProtectedRoute>
              <WorshipHome />
            </ProtectedRoute>
          }
        />
      </Routes>

      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </BrowserRouter>
  );
}
