import { Link, useNavigate } from "react-router-dom";
import {
  Baby,
  Sparkles,
  GraduationCap,
  Cross,
  Heart,
  Users,
  Music,
  Globe,
  LogOut,
  IdCard,
  Wallet,
  BookOpen,
  CalendarDays,
  Mic,         // for Predikime
  Hand,        // for Lutje
  Compass,     // for Dishepullizimi
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import { useState } from "react";

import ChurchLogo from "./Icon/kbbt.jpg";

export default function ChurchHome() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeService, setActiveService] = useState(null);

  const services = [
    { name: "Fëmijët", icon: Baby, path: "/kbbt/kids" },
    { name: "Brezi i ri", icon: Sparkles, path: "/kbbt/newgen" },
    { name: "Studentët", icon: GraduationCap, path: "/kbbt/students" },
    { name: "Next Step", icon: Cross, path: "/kbbt/nextstep", protected: "nextstep" },
    { name: "Bijat e Sarës", icon: Heart, path: "/kbbt/sarah" },
    { name: "Shërbimi i burrave", icon: Users, path: "/kbbt/man" },
    { name: "Adhurimi", icon: Music, path: "/kbbt/worship", protected: "worship" },
    { name: "Misionet", icon: Globe, path: "/kbbt/missions" },
    { name: "Anëtarësia", icon: IdCard, path: "/kbbt/membership" },
    { name: "Bilancet", icon: Wallet, path: "/kbbt/finance" },
    { name: "Shkolla Biblike", icon: BookOpen, path: "/kbbt/bibleschool" },
    { name: "Kalendar", icon: CalendarDays, path: "/kbbt/calendar" },

    // ✅ New modules
    { name: "Predikime", icon: Mic, path: "/kbbt/sermons" },
    { name: "Lutje", icon: Hand, path: "/kbbt/prayers", openDirect: true }, // 👈 goes directly to prayers
    { name: "Dishepullizimi", icon: Compass, path: "/kbbt/discipleship" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("nextstep_access");
    localStorage.removeItem("worship_access");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleModuleClick = (e, service) => {
    e.preventDefault();

    if (service.openDirect) {
      // 👈 Lutje goes straight
      navigate(service.path);
      return;
    }

    if (service.protected) {
      setActiveService(service);
      setShowModal(true);
    } else {
      toast("🚧 " + service.name + " është në ndërtim!", {
        icon: "🔧",
      });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!activeService) return;

    let rpcFn = null;
    let localKey = null;

    if (activeService.protected === "nextstep") {
      rpcFn = "check_nextstep_password";
      localKey = "nextstep_access";
    } else if (activeService.protected === "worship") {
      rpcFn = "check_worship_password";
      localKey = "worship_access";
    }

    if (!rpcFn) return;

    const { data, error } = await supabase.rpc(rpcFn, { pass: password });

    if (error) {
      console.error(error);
      toast.error("⚠️ Error verifying password");
      return;
    }

    if (data === true) {
      localStorage.setItem(localKey, "true");
      toast.success("✅ Access granted");
      setShowModal(false);
      setPassword("");
      navigate(activeService.path);
    } else {
      toast.error("❌ Fjalëkalimi i pasaktë");
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-100 to-rose-200 shadow">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-800">
            KISHA BIBLIKE BAPTISTE E TIRANËS
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            PËRJETO PREZENCËN E PERËNDISË
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      {/* Services Grid */}
      <main className="flex-1 px-6 pt-9 pb-6 max-w-7xl mx-auto w-full flex">
        <div
          className="
            grid
            grid-cols-5
            grid-rows-3
            gap-4
            w-full
            h-full
          "
        >
          {services.map((service) => {
            const { name, icon: Icon, path } = service;
            return (
              <Link
                key={name}
                to={path}
                onClick={(e) => handleModuleClick(e, service)}
                className="
                  group bg-white rounded-xl shadow-md
                  transition-all duration-300 ease-out
                  flex flex-col items-center justify-center 
                  w-full h-full
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

      {/* Password Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white shadow-xl rounded-xl p-6 w-80">
            <h2 className="text-lg font-bold mb-2 text-gray-800">
              🔒 {activeService?.name}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Shkruaj fjalëkalimin për të vazhduar
            </p>
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="Fjalëkalimi..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 text-white px-4 py-2 rounded-md hover:bg-rose-700 transition"
                >
                  Hyr
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setPassword("");
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                >
                  Anulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
