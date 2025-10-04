// src/churches/KBBT/Prayers/Prayers.jsx
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Share2, FileText, Edit, Trash2, Check } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function Prayers() {
  const navigate = useNavigate();
  const { serviceSlug } = useParams();

  // 🔹 Data
  const [requests, setRequests] = useState([]);
  const [answered, setAnswered] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
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

  // 🔹 Prayer/Testimony forms
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
    let query = supabase
      .from("prayers")
      .select("*")
      .eq("church_slug", "kbbt")
      .order("created_at", { ascending: false });

    if (serviceSlug) query = query.eq("service_slug", serviceSlug);
    else query = query.is("service_slug", null);

    const { data, error } = await query;
    if (error) {
      console.error(error);
      toast.error("Nuk mund të marrim lutjet.");
      return;
    }

    setRequests(data.filter((p) => p.status === "request"));
    setAnswered(data.filter((p) => p.status === "answered"));
  };

  // 🔹 Fetch role & user
  const fetchRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);

    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!error) setIsAdmin(data?.is_admin || false);
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
  }, [serviceSlug]);

  useEffect(() => {
    setPageRequests(1);
    setPageAnswered(1);
  }, [filterCategory, filterStatus, search, dateFrom, dateTo, sortConfig]);

  // 🔹 Realtime reactions
  useEffect(() => {
    const channel = supabase
      .channel("prayer_reactions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prayer_reactions",
        },
        (payload) => {
          const { eventType, new: newReaction, old: oldReaction } = payload;
          setReactions((prev) => {
            const updated = { ...prev };
            if (eventType === "INSERT" && newReaction) {
              const pid = newReaction.prayer_id;
              if (!updated[pid]) updated[pid] = [];
              if (!updated[pid].includes(newReaction.user_id))
                updated[pid].push(newReaction.user_id);
            }
            if (eventType === "DELETE" && oldReaction) {
              const pid = oldReaction.prayer_id;
              if (updated[pid])
                updated[pid] = updated[pid].filter(
                  (uid) => uid !== oldReaction.user_id
                );
            }
            return updated;
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // 🔹 Helpers
  const withinDateRange = (date) => {
    if (!dateFrom && !dateTo) return true;
    const d = new Date(date);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo)) return false;
    return true;
  };

  const filterPrayers = (list) => {
    let result = list
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
      .filter((p) => withinDateRange(p.created_at));

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  };

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

  // 🔹 Reaction handler
  const handlePray = async (prayerId) => {
    if (!userId) return toast.error("Duhet të jeni i kyçur për të lutur.");
    const hasPrayed = reactions[prayerId]?.includes(userId);

    if (hasPrayed) {
      const { error } = await supabase
        .from("prayer_reactions")
        .delete()
        .eq("prayer_id", prayerId)
        .eq("user_id", userId);
      if (error) return;
    } else {
      const { error } = await supabase
        .from("prayer_reactions")
        .insert([{ prayer_id: prayerId, user_id: userId }]);
      if (!error) toast.success("Po lutesh për këtë kërkesë 🙏");
    }
  };

  // 🔹 Admin Handlers
  const handleMarkAnswered = async (id) => {
    if (!isAdmin) return toast.error("Nuk keni leje.");
    await supabase.from("prayers").update({ status: "answered" }).eq("id", id);
    toast.success("Shënuar si përgjigjur.");
    fetchPrayers();
  };

  const handleMarkRequest = async (id) => {
    if (!isAdmin) return toast.error("Nuk keni leje.");
    await supabase.from("prayers").update({ status: "request" }).eq("id", id);
    toast.success("Kthyer në kërkesë.");
    fetchPrayers();
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return toast.error("Nuk keni leje.");
    if (!confirm("A jeni i sigurt?")) return;
    await supabase.from("prayers").delete().eq("id", id);
    toast.success("Fshirë me sukses.");
    fetchPrayers();
  };

  const handleEdit = (p) => {
    if (!isAdmin) return;
    setEditingPrayer(p);
    setEditText(p.text);
    setEditCategory(p.category);
  };

  const handleSaveEdit = async () => {
    if (!editingPrayer) return;
    const { error } = await supabase
      .from("prayers")
      .update({ text: editText, category: editCategory })
      .eq("id", editingPrayer.id);
    if (error) toast.error("Gabim gjatë ruajtjes.");
    else {
      toast.success("Përditësuar me sukses.");
      setEditingPrayer(null);
      fetchPrayers();
    }
  };

  const handleShare = (p) => {
    const text = `🙏 Lutje nga ${p.name} (${p.category}) më ${new Date(
      p.created_at
    ).toLocaleDateString("sq-AL")}: "${p.text}"`;
    if (navigator.share) navigator.share({ title: "Lutje", text });
    else {
      navigator.clipboard.writeText(text);
      toast.success("Lutja u kopjua!");
    }
  };

  const paginate = (list, page) =>
    list.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  const SortableHeader = ({ columnKey, label, center }) => (
    <th
      onClick={() =>
        setSortConfig((prev) => ({
          key: columnKey,
          direction:
            prev.key === columnKey && prev.direction === "asc" ? "desc" : "asc",
        }))
      }
      className={`px-4 py-2 cursor-pointer select-none ${
        center ? "text-center" : "text-left"
      }`}
    >
      {label}{" "}
      {sortConfig.key === columnKey &&
        (sortConfig.direction === "asc" ? "▲" : "▼")}
    </th>
  );

  const PaginationControls = ({ list, page, setPage }) => {
    const totalPages = Math.ceil(list.length / pageSize);
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          ‹
        </button>
        <span>
          Faqja {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          ›
        </button>
      </div>
    );
  };

  // 🔹 Prayer Row
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

        {isAdmin && (
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100">
      <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-100 to-rose-200 shadow">
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800">
          Lutjet & Dëshmitë
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(serviceSlug ? `/kbbt/${serviceSlug}` : "/kbbt")}
            className="flex items-center gap-2 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            <ArrowLeft size={18} /> Kthehu
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-12">
        {/* Filters */}
        <section className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-4 rounded-xl shadow">
          <div>
            <label className="block text-sm font-semibold mb-1">Kërko</label>
            <input
              type="text"
              placeholder="Emër ose tekst..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Kategori</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Nga data</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Deri më</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </section>

        {/* Requests Table */}
        <section>
          <h2 className="text-2xl font-bold mb-4">🙏 Kërkesa për Lutje</h2>
          {filterPrayers(requests).length === 0 ? (
            <p className="text-gray-500">Nuk ka kërkesa.</p>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full border rounded-xl bg-white shadow">
                  <thead className="bg-rose-100">
                    <tr>
                      <SortableHeader columnKey="name" label="Emri" />
                      <SortableHeader columnKey="text" label="Teksti" />
                      <SortableHeader
                        columnKey="category"
                        label="Kategoria"
                        center
                      />
                      <SortableHeader
                        columnKey="created_at"
                        label="Data"
                        center
                      />
                      <th className="px-4 py-2 text-right">Veprime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginate(filterPrayers(requests), pageRequests).map((p) => (
                      <PrayerRow key={p.id} p={p} />
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                list={filterPrayers(requests)}
                page={pageRequests}
                setPage={setPageRequests}
              />
            </div>
          )}
        </section>

        {/* Answered Table */}
        <section>
          <h2 className="text-2xl font-bold mb-4">
            ✨ Dëshmitë & Lutjet e Përgjigjura
          </h2>
          {filterPrayers(answered).length === 0 ? (
            <p className="text-gray-500">Nuk ka dëshmi.</p>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full border rounded-xl bg-white shadow">
                  <thead className="bg-green-100">
                    <tr>
                      <SortableHeader columnKey="name" label="Emri" />
                      <SortableHeader columnKey="text" label="Teksti" />
                      <SortableHeader
                        columnKey="category"
                        label="Kategoria"
                        center
                      />
                      <SortableHeader
                        columnKey="created_at"
                        label="Data"
                        center
                      />
                      <th className="px-4 py-2 text-right">Veprime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginate(filterPrayers(answered), pageAnswered).map((p) => (
                      <PrayerRow key={p.id} p={p} />
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                list={filterPrayers(answered)}
                page={pageAnswered}
                setPage={setPageAnswered}
              />
            </div>
          )}
        </section>

        {/* Add Prayer & Testimony */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Prayer */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!textPrayer.trim() || !namePrayer.trim())
                return toast.error("Ju lutem shkruani emrin dhe lutjen.");
              setLoadingPrayer(true);
              const { error } = await supabase.from("prayers").insert([
                {
                  church_slug: "kbbt",
                  service_slug: serviceSlug || null,
                  name: namePrayer,
                  text: textPrayer,
                  category: categoryPrayer,
                  status: "request",
                },
              ]);
              if (error) toast.error("Gabim gjatë shtimit të lutjes.");
              else {
                toast.success("Lutja u shtua!");
                setNamePrayer("");
                setTextPrayer("");
                setCategoryPrayer("Të tjera");
                fetchPrayers();
              }
              setLoadingPrayer(false);
            }}
            className="space-y-4 border rounded-xl bg-white shadow-sm p-6"
          >
            <h2 className="text-xl font-bold">➕ Shto një Lutje</h2>
            <input
              type="text"
              placeholder="Emri juaj"
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              value={namePrayer}
              onChange={(e) => setNamePrayer(e.target.value)}
            />
            <textarea
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              placeholder="Shkruani lutjen tuaj këtu..."
              value={textPrayer}
              onChange={(e) => setTextPrayer(e.target.value)}
            />
            <select
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              value={categoryPrayer}
              onChange={(e) => setCategoryPrayer(e.target.value)}
            >
              {categories.filter((c) => c !== "Të gjitha").map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={loadingPrayer}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingPrayer ? "Duke u shtuar..." : "Shto Lutje"}
            </button>
          </form>

          {/* Add Testimony */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!textTestimony.trim() || !nameTestimony.trim())
                return toast.error("Ju lutem shkruani emrin dhe dëshminë.");
              setLoadingTestimony(true);
              const { error } = await supabase.from("prayers").insert([
                {
                  church_slug: "kbbt",
                  service_slug: serviceSlug || null,
                  name: nameTestimony,
                  text: textTestimony,
                  category: categoryTestimony,
                  status: "answered",
                },
              ]);
              if (error) toast.error("Gabim gjatë shtimit të dëshmisë.");
              else {
                toast.success("Dëshmia u shtua!");
                setNameTestimony("");
                setTextTestimony("");
                setCategoryTestimony("Të tjera");
                fetchPrayers();
              }
              setLoadingTestimony(false);
            }}
            className="space-y-4 border rounded-xl bg-white shadow-sm p-6"
          >
            <h2 className="text-xl font-bold">🌟 Shto një Dëshmi</h2>
            <input
              type="text"
              placeholder="Emri juaj"
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-purple-500"
              value={nameTestimony}
              onChange={(e) => setNameTestimony(e.target.value)}
            />
            <textarea
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-purple-500"
              placeholder="Shkruani dëshminë tuaj këtu..."
              value={textTestimony}
              onChange={(e) => setTextTestimony(e.target.value)}
            />
            <select
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-purple-500"
              value={categoryTestimony}
              onChange={(e) => setCategoryTestimony(e.target.value)}
            >
              {categories.filter((c) => c !== "Të gjitha").map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={loadingTestimony}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loadingTestimony ? "Duke u shtuar..." : "Shto Dëshmi"}
            </button>
          </form>
        </section>
      </main>

      {/* Edit Modal */}
      {editingPrayer && isAdmin && (
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
              {categories.filter((c) => c !== "Të gjitha").map((cat) => (
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
