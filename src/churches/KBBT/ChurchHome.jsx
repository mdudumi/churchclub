import { Link, useNavigate, useParams } from "react-router-dom";
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
  Mic,
  Hand,
  Compass,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import { useState } from "react";
import ChurchLogo from "./Icon/kbbt.jpg";

export default function ChurchHome() {
  const navigate = useNavigate();
  const { churchSlug } = useParams(); // supports other churches dynamically

  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeService, setActiveService] = useState(null);

  // Helper for dynamic paths
  const path = (segment) => `/${churchSlug}/${segment}`;

  // ✅ Custom order updated
  const services = [
    { name: "Anëtarësia", icon: IdCard, path: path("membership"), protected: "membership" },
    { name: "Adhurimi", icon: Music, path: path("worship"), protected: "worship" },
    { name: "Lutje", icon: Hand, path: path("prayers"), openDirect: true },
    { name: "Dishepullizimi", icon: Compass, path: path("discipleship"), protected: "discipleship" },
    { name: "Predikime", icon: Mic, path: path("sermons") },
    { name: "Fëmijët", icon: Baby, path: path("kids") },
    { name: "Brezi i ri", icon: Sparkles, path: path("newgen") },
    { name: "Studentët", icon: GraduationCap, path: path("students") },
    { name: "Next Step", icon: Cross, path: path("nextstep"), protected: "nextstep" },
    { name: "Bijat e Sarës", icon: Heart, path: path("sarah") },
    { name: "Shërbimi i burrave", icon: Users, path: path("man") },
    { name: "Misionet", icon: Globe, path: path("missions") },
    { name: "Bilancet", icon: Wallet, path: path("finance") },
    { name: "Materiale të tjera", icon: BookOpen, path: path("bibleschool") },
    { name: "Kalendar", icon: CalendarDays, path: path("calendar") },
  ];

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    ["nextstep", "worship", "membership", "discipleship"].forEach((key) =>
      localStorage.removeItem(`${key}_access`)
    );
    toast.success("U çregjistruat me sukses!");
    navigate("/");
  };

  // Handle module click
  const handleModuleClick = (e, service) => {
    e.preventDefault();

    if (service.openDirect) {
      navigate(service.path);
      return;
    }

    if (service.protected) {
      setActiveService(service);
      setShowModal(true);
    } else {
      toast("🚧 " + service.name + " është në ndërtim!", { icon: "🔧" });
    }
  };

  // Password verification
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!activeService) return;

    let rpcFn = null;
    let localKey = null;

    switch (activeService.protected) {
      case "nextstep":
        rpcFn = "check_nextstep_password";
        localKey = "nextstep_access";
        break;
      case "worship":
        rpcFn = "check_worship_password";
        localKey = "worship_access";
        break;
      case "membership":
        rpcFn = "check_membership_password";
        localKey = "membership_access";
        break;
      case "discipleship":
        rpcFn = "check_discipleship_password";
        localKey = "discipleship_access";
        break;
      default:
        return;
    }

    // Call Supabase RPC
    const { data, error } = await supabase.rpc(rpcFn, { pass: password });

    // ✅ Fallback in case RPC fails or function not found
    const fallbackPasswords = {
      nextstep: "NextStep123?",
      worship: "Adhurim123?",
      membership: "Anetaresia123?",
      discipleship: "Dishepull123?",
    };

    if (error || data === null) {
      if (password === fallbackPasswords[activeService.protected]) {
        localStorage.setItem(localKey, "true");
        toast.success("✅ Qasja u lejua");
        setShowModal(false);
        setPassword("");
        navigate(activeService.path);
      } else {
        toast.error("❌ Fjalëkalimi i pasaktë");
      }
      return;
    }

    // ✅ Success via Supabase
    if (data === true) {
      localStorage.setItem(localKey, "true");
      toast.success("✅ Qasja u lejua");
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
        <div className="flex items-center gap-3">
          <img
            src={ChurchLogo}
            alt="Church Logo"
            className="h-14 w-14 object-cover rounded-lg"
          />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-800">
              KISHA BIBLIKE BAPTISTE E TIRANËS
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              PËRJETO PREZENCËN E PERËNDISË
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Dil</span>
        </button>
      </header>

      {/* Services Grid */}
      <main className="flex-1 px-6 pt-9 pb-6 max-w-7xl mx-auto w-full flex">
        <div className="grid grid-cols-5 grid-rows-3 gap-4 w-full h-full">
          {services.map((service) => {
            const { name, icon: Icon, path } = service;
            return (
              <Link
                key={name}
                to={path}
                onClick={(e) => handleModuleClick(e, service)}
                className="group bg-white rounded-xl shadow-md transition-all duration-300 ease-out flex flex-col items-center justify-center w-full h-full hover:scale-105 hover:shadow-2xl hover:ring-2 hover:ring-rose-400/40"
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
