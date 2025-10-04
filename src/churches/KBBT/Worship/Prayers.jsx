// src/churches/KBBT/Worship/Prayers.jsx
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Share2,
  Edit,
  Trash2,
  Check,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function Prayers() {
  const navigate = useNavigate();
  const { serviceSlug } = useParams();
  const effectiveServiceSlug = serviceSlug || "worship";

  // 🔹 Data
  const [requests, setRequests] = useState([]);
  const [answered, setAnswered] = useState([]);
  const [userRole, setUserRole] = useState("viewer");
  const [loadingRole, setLoadingRole] = useState(true);
  const [userId, setUserId] = useState(null);
  const [reactions, setReactions] = useState({});

  // 🔹 Filters
  const [filterCategory, setFilterCategory] = useState("Të gjitha");
  const [filterStatus, setFilterStatus] = useState("Të gjitha");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // 🔹 Sorting
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  // 🔹 Pagination
  const pageSize = 5;
  const [pageRequests, setPageRequests] = useState(1);
  const [pageAnswered, setPageAnswered] = useState(1);

  // 🔹 Edit
  const [editingPrayer, setEditingPrayer] = useState(null);
  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState("Të tjera");

  // 🔹 Prayer/Testimony Forms
  const [namePrayer, setNamePrayer] = useState("");
  const [textPrayer, setTextPrayer] = useState("");
  const [categoryPrayer, setCategoryPrayer] = useState("Të tjera");
  const [loadingPrayer, setLoadingPrayer] = useState(false);

  const [nameTestimony, setNameTestimony] = useState("");
  const [textTestimony, setTextTestimony] = useState("");
  const [categoryTestimony, setCategoryTestimony] = useState("Të tjera");
  const [loadingTestimony, setLoadingTestimony] = useState(false);

  // 🔹 Fetch prayers
  const fetchPrayers = async () => {
    const { data, error } = await supabase
      .from("prayers")
      .select("*")
      .eq("church_slug", "kbbt")
      .eq("service_slug", effectiveServiceSlug)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
      toast.error("Nuk mund të marrim lutjet.");
      return;
    }
    setRequests(data.filter((p) => p.status === "request"));
    setAnswered(data.filter((p) => p.status === "answered"));
  };

  // 🔹 Fetch user role via service_memberships
  const fetchRole = async () => {
    setLoadingRole(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUserRole("viewer");
      setLoadingRole(false);
      return;
    }
    setUserId(user.id);

    const { data: church } = await supabase
      .from("churches")
      .select("id")
      .eq("slug", "kbbt")
      .maybeSingle();

    if (!church) {
      setUserRole("viewer");
      setLoadingRole(false);
      return;
    }

    const { data: membership, error } = await supabase
      .from("service_memberships")
      .select("role")
      .eq("user_id", user.id)
      .eq("church_id", church.id)
      .eq("service_slug", effectiveServiceSlug)
      .maybeSingle();

    if (error) {
      console.error(error.message);
      setUserRole("viewer");
    } else {
      setUserRole(membership?.role || "viewer");
    }

    setLoadingRole(false);
  };

  // 🔹 Fetch reactions
  const fetchReactions = async () => {
    const { data, error } = await supabase
      .from("prayer_reactions")
      .select("prayer_id, user_id");
    if (error) return console.error(error);
    const grouped = data.reduce((acc, r) => {
      if (!acc[r.prayer_id]) acc[r.prayer_id] = [];
      acc[r.prayer_id].push(r.user_id);
      return acc;
    }, {});
    setReactions(grouped);
  };

  useEffect(() => {
    fetchPrayers();
    fetchRole();
    fetchReactions();
  }, [effectiveServiceSlug]);

  // 🔹 Realtime reactions
  useEffect(() => {
    const channel = supabase
      .channel("worship_prayer_reactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prayer_reactions" },
        (payload) => {
          const { eventType, new: newR, old: oldR } = payload;
          setReactions((prev) => {
            const updated = { ...prev };
            if (eventType === "INSERT" && newR) {
              if (!updated[newR.prayer_id]) updated[newR.prayer_id] = [];
              if (!updated[newR.prayer_id].includes(newR.user_id))
                updated[newR.prayer_id].push(newR.user_id);
            }
            if (eventType === "DELETE" && oldR) {
              if (updated[oldR.prayer_id])
                updated[oldR.prayer_id] = updated[oldR.prayer_id].filter(
                  (uid) => uid !== oldR.user_id
                );
            }
            return updated;
          });
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // 🔹 Filtering
  const withinDateRange = (date) => {
    if (!dateFrom && !dateTo) return true;
    const d = new Date(date);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo)) return false;
    return true;
  };

  const filterPrayers = (list) =>
    list
      .filter((p) =>
        filterCategory === "Të gjitha" ? true : p.category === filterCategory
      )
      .filter((p) =>
        filterStatus === "Të gjitha"
          ? true
          : filterStatus === "Kërkesa"
          ? p.status === "request"
          : p.status === "answered"
      )
      .filter(
        (p) =>
          p.text.toLowerCase().includes(search.toLowerCase()) ||
          p.name.toLowerCase().includes(search.toLowerCase())
      )
      .filter((p) => withinDateRange(p.created_at))
      .sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });

  const categories = [
    "Të gjitha",
    "Shëndeti",
    "Familja",
    "Puna",
    "Besimi",
    "Martesa",
    "Fëmijët",
    "Arsimi",
    "Financat",
    "Shërbesa",
    "Udhëtim",
    "Të tjera",
  ];
  const statuses = ["Të gjitha", "Kërkesa", "Përgjigjur"];

  // 🔹 Reaction Handler
  const handlePray = async (id) => {
    if (!userId) return toast.error("Duhet të jeni i kyçur për të lutur.");
    const hasPrayed = reactions[id]?.includes(userId);
    if (hasPrayed) {
      await supabase
        .from("prayer_reactions")
        .delete()
        .eq("prayer_id", id)
        .eq("user_id", userId);
    } else {
      const { error } = await supabase
        .from("prayer_reactions")
        .insert([{ prayer_id: id, user_id: userId }]);
      if (!error) toast.success("Po lutesh për këtë kërkesë 🙏");
    }
  };

  // 🔹 Admin Handlers
  const handleMarkAnswered = async (id) => {
    if (userRole !== "admin") return toast.error("Nuk keni leje.");
    await supabase.from("prayers").update({ status: "answered" }).eq("id", id);
    fetchPrayers();
  };

  const handleMarkRequest = async (id) => {
    if (userRole !== "admin") return toast.error("Nuk keni leje.");
    await supabase.from("prayers").update({ status: "request" }).eq("id", id);
    fetchPrayers();
  };

  const handleDelete = async (id) => {
    if (userRole !== "admin") return toast.error("Nuk keni leje.");
    if (!confirm("A jeni i sigurt?")) return;
    await supabase.from("prayers").delete().eq("id", id);
    fetchPrayers();
  };

  const handleEdit = (p) => {
    if (userRole !== "admin") return;
    setEditingPrayer(p);
    setEditText(p.text);
    setEditCategory(p.category);
  };

  const handleSaveEdit = async () => {
    if (!editingPrayer) return;
    await supabase
      .from("prayers")
      .update({ text: editText, category: editCategory })
      .eq("id", editingPrayer.id);
    toast.success("Përditësuar!");
    setEditingPrayer(null);
    fetchPrayers();
  };

  const handleShare = (p) => {
    const text = `🙏 Lutje nga ${p.name} (${p.category}) më ${new Date(
      p.created_at
    ).toLocaleDateString("sq-AL")}: "${p.text}"`;
    if (navigator.share) navigator.share({ title: "Lutje", text });
    else {
      navigator.clipboard.writeText(text);
      toast.success("Kopjuar!");
    }
  };

  const paginate = (list, page) =>
    list.slice((page - 1) * pageSize, page * pageSize);

  // 🔹 Table row
  const PrayerRow = ({ p }) => (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-4 py-2 font-semibold text-gray-800">{p.name}</td>
      <td className="px-4 py-2">{p.text}</td>
      <td className="px-4 py-2 text-center">{p.category}</td>
      <td className="px-4 py-2 text-center">
        {new Date(p.created_at).toLocaleDateString("sq-AL")}
      </td>
      <td className="px-4 py-2 text-right flex justify-end gap-2">
        <button
          onClick={() => handleShare(p)}
          title="Ndaj"
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Share2 size={16} />
        </button>

        <button
          onClick={() => handlePray(p.id)}
          title="Po lutem"
          className={`p-2 rounded-lg ${
            reactions[p.id]?.includes(userId)
              ? "bg-yellow-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          🙏 {reactions[p.id]?.length || 0}
        </button>

        {userRole === "admin" && (
          <>
            {p.status === "request" ? (
              <button
                onClick={() => handleMarkAnswered(p.id)}
                title="Shëno përgjigjur"
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Check size={16} />
              </button>
            ) : (
              <button
                onClick={() => handleMarkRequest(p.id)}
                title="Kthe si kërkesë"
                className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                ↩
              </button>
            )}
            <button
              onClick={() => handleEdit(p)}
              title="Edito"
              className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDelete(p.id)}
              title="Fshi"
              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </td>
    </tr>
  );

  // 🔹 UI
  if (loadingRole)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Duke ngarkuar...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100">
      <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-100 to-rose-200 shadow">
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800">
          Lutjet & Dëshmitë
        </h1>
        <button
          onClick={() =>
            navigate(
              effectiveServiceSlug ? `/kbbt/${effectiveServiceSlug}` : "/kbbt"
            )
          }
          className="flex items-center gap-2 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
        >
          <ArrowLeft size={18} /> Kthehu
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-12">
        {/* Filters, tables, and forms identical to KBBT version */}
        {/* ... */}
      </main>

      {editingPrayer && userRole === "admin" && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg space-y-4">
            <h2 className="text-xl font-bold">✏️ Edito Lutjen/Dëshminë</h2>
            <textarea
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <select
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
            >
              {categories
                .filter((c) => c !== "Të gjitha")
                .map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingPrayer(null)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Anulo
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Ruaj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
