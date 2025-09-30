import { Routes, Route, Navigate } from "react-router-dom";
import NextStepLogin from "./Auth/Login";
import ServiceHome from "./ServiceHome";
import PrayerRequestsHome from "./PrayerRequests/PrayerRequestsHome.jsx";

export default function NextStepRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<NextStepLogin />} />
      <Route path="/" element={<ServiceHome />} />
      <Route path="/prayer-requests" element={<PrayerRequestsHome />} />
      <Route path="*" element={<Navigate to="/kbbt/nextstep" replace />} />
    </Routes>
  );
}
