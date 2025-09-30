// src/churches/KBBT/NextStep/ServiceHome.jsx
import { Link, useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Mic,
  CalendarDays,
  Hand,
  Sparkles,
  Image as ImageIcon,
  Lightbulb,
  LogOut,
  ArrowLeft, // back icon
} from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function NextStepHome() {
  const navigate = useNavigate();

  // 🔒 Protect route: redirect if not unlocked
  useEffect(() => {
    const hasAccess = localStorage.getItem("nextstep_access") === "true";
    if (!hasAccess) {
      navigate("/kbbt", { replace: true });
    }
  }, [navigate]);

  // ✅ add `ready` flag
  const modules = [
    { name: "Forum", icon: MessageCircle, path: "/kbbt/nextstep/forum", ready: false },
    { name: "Podcasts", icon: Mic, path: "/kbbt/nextstep/podcasts", ready: false },
    { name: "Aktivitetet", icon: CalendarDays, path: "/kbbt/nextstep/activities", ready: false },
    { name: "Lutjet", icon: Hand, path: "/kbbt/nextstep/prayers", ready: true }, // ✅ LIVE
    { name: "Kalendar", icon: CalendarDays, path: "/kbbt/nextstep/calendar", ready: false },
    { name: "Inkurajime", icon: Lightbulb, path: "/kbbt/nextstep/encouragement", ready: false },
    { name: "Krijime", icon: Sparkles, path: "/kbbt/nextstep/creations", ready: false },
    { name: "Fotografi", icon: ImageIcon, path: "/kbbt/nextstep/photos", ready: false },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("nextstep_access");
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-100 to-rose-200 shadow">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-800">
          Next Step
        </h1>

        {/* Back + Logout buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/kbbt")}
            className="flex items-center gap-2 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Modules Grid */}
      <main className="flex-1 px-6 pt-9 max-w-6xl mx-auto w-full flex">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
          {modules.map((module) => {
            const { name, icon: Icon, path, ready } = module;
            return (
              <Link
                key={name}
                to={ready ? path : "#"}
                onClick={(e) => {
                  if (!ready) {
                    e.preventDefault();
                    toast("🚧 " + name + " është në ndërtim!", { icon: "🔧" });
                  }
                }}
                className="
                  group bg-white rounded-xl shadow-md
                  transition-all duration-300 ease-out
                  flex flex-col items-center justify-center 
                  p-4 h-40
                  hover:scale-105 hover:shadow-2xl hover:ring-2 hover:ring-rose-400/40
                "
              >
                <div className="mb-3 h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-8 w-8" />
                </div>
                <span className="font-semibold text-gray-800 text-base sm:text-lg group-hover:text-rose-600 transition-colors duration-300 text-center">
                  {name}
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
