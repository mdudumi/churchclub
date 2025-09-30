import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import KBBTRoutes from "./churches/KBBT";

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/kbbt/*" element={<KBBTRoutes />} />
        <Route path="*" element={<Navigate to="/kbbt" replace />} />
      </Routes>
    </Router>
  );
}
