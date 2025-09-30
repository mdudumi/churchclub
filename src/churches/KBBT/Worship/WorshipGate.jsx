// src/churches/KBBT/Worship/WorshipGate.jsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function WorshipGate() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from("worship_access")
      .select("password")
      .eq("church_slug", "kbbt")
      .single();

    setLoading(false);

    if (error) {
      toast.error("Gabim në server");
      return;
    }

    if (data.password === password) {
      localStorage.setItem("worship_access", "true");
      navigate("/kbbt/worship/home");
    } else {
      toast.error("Fjalëkalim i gabuar");
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm"
      >
        <h2 className="text-xl font-bold mb-4">Hyrje në Adhurim</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 mb-3 rounded"
          placeholder="Shkruaj fjalëkalimin"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {loading ? "Duke kontrolluar..." : "Hyr"}
        </button>
      </form>
    </div>
  );
}
