import { Routes, Route, Navigate } from "react-router-dom";
import ChurchHome from "./ChurchHome";
import KBBTLogin from "./Auth/Login";
import NextStepRoutes from "./NextStep";

export default function KBBTRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<KBBTLogin />} />
      <Route path="/" element={<ChurchHome />} />
      <Route path="/nextstep/*" element={<NextStepRoutes />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
