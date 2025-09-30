// src/components/ProtectedNextStep.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedNextStep({ children }) {
  const hasAccess = localStorage.getItem("nextstep_access") === "true";

  if (!hasAccess) {
    return <Navigate to="/kbbt" replace />;
  }

  return children;
}
