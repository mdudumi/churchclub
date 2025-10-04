import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Settings,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";

export default function DiscipleshipHome() {
  const { churchSlug } = useParams();
  const navigate = useNavigate();
  const normalizedChurchSlug = (churchSlug || "").toLowerCase().trim();

  const [records, setRecords] = useState([]);
  const [courses, setCourses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [userRole, setUserRole] = useState("viewer");
  const [loadingRole, setLoadingRole] = useState(true);

  const [formData, setFormData] = useState({
    member_id: "",
    course_id: "",
    mentor_name: "",
    completion_date: "",
    status: "Në proces",
    notes: "",
  });

  // 🔍 Filters and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Të gjitha");
  const [mentorFilter, setMentorFilter] = useState("Të gjithë");
  const [sortOrder, setSortOrder] = useState("desc");

  // ✅ Fetch user role — with proper UUID handling
  useEffect(() => {
    const fetchUserRole = async () => {
      setLoadingRole(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        console.log("[DISCIPLESHIP] route churchSlug =", churchSlug, "→ normalized =", normalizedChurchSlug);
        console.log("[DISCIPLESHIP] user =", user?.id || "(no user)");

        if (!user) {
          setUserRole("viewer");
          setLoadingRole(false);
          return;
        }

        //1️⃣ Fetch church UUID from churches table
        const { data: church, error: churchError } = await supabase
          .from("churches")
          .select("id, slug, name")
          .eq("slug", normalizedChurchSlug)
          .maybeSingle();

        if (churchError || !church) {
          console.warn("❌ No church found for slug:", normalizedChurchSlug);
          setUserRole("viewer");
          setLoadingRole(false);
          return;
        }

        console.log("[DISCIPLESHIP] church row =", church);

        // 2️⃣ Fetch service (discipleship) using UUID church_id
        const { data: service, error: serviceError } = await supabase
          .from("services")
          .select("id, church_id, slug, name")
          .eq("church_id", church.id)
          .eq("slug", "discipleship")
          .maybeSingle();

        console.log("[DISCIPLESHIP] service row =", service || null);

        if (serviceError || !service) {
          console.warn("❌ No discipleship service found");
          setUserRole("viewer");
          setLoadingRole(false);
          return;
        }

        // 3️⃣ Check user membership role
        const { data: membership, error: membershipError } = await supabase
          .from("service_memberships")
          .select("role, church_id, service_id, user_id")
          .eq("church_id", church.id)
          .eq("service_id", service.id)
          .eq("user_id", user.id)
          .maybeSingle();

        console.log("[DISCIPLESHIP] membership row =", membership || null);

        if (membershipError) {
          console.error("Error fetching role:", membershipError.message);
          setUserRole("viewer");
        } else if (membership) {
          setUserRole(membership.role || "viewer");
        } else {
          console.warn("No service_memberships row found, using viewer");
          setUserRole("viewer");
        }
      } catch (err) {
        console.error("Error in role check:", err.message);
        setUserRole("viewer");
      } finally {
        setLoadingRole(false);
      }
    };

    fetchUserRole();
  }, [churchSlug]);

  // ✅ Fetch data
  useEffect(() => {
    fetchAll();
  }, [churchSlug]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [
        { data: members },
        { data: courses },
        { data: records },
      ] = await Promise.all([
        supabase
          .from("members")
          .select("id, emri, mbiemri")
          .eq("church_slug", normalizedChurchSlug),
        supabase
          .from("discipleship_courses")
          .select("id, title")
          .eq("church_slug", normalizedChurchSlug)
          .order("order_number"),
        supabase
          .from("member_discipleship")
          .select(
            "id, member_id, course_id, mentor_name, completion_date, status, notes, members(emri, mbiemri), discipleship_courses(title)"
          )
          .eq("church_slug", normalizedChurchSlug),
      ]);

      setMembers(members || []);
      setCourses(courses || []);
      setRecords(records || []);
    } catch (error) {
      toast.error("Gabim gjatë ngarkimit të të dhënave!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      member_id: "",
      course_id: "",
      mentor_name: "",
      completion_date: "",
      status: "Në proces",
      notes: "",
    });
    setSelected(null);
  };

  // ✅ Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userRole !== "admin") {
      toast.error("Vetëm administratorët mund të shtojnë ose përditësojnë!");
      return;
    }

    const payload = { ...formData, church_slug: normalizedChurchSlug };
    let result;
    if (selected) {
      result = await supabase
        .from("member_discipleship")
        .update(payload)
        .eq("id", selected.id);
    } else {
      result = await supabase.from("member_discipleship").insert([payload]);
    }

    if (result.error) {
      console.error("❌ Supabase Error:", result.error);
      toast.error(`Gabim gjatë ruajtjes: ${result.error.message}`);
      return;
    }

    toast.success(selected ? "Regjistrimi u përditësua!" : "Regjistrimi u shtua!");
    setShowForm(false);
    resetForm();
    fetchAll();
  };

  // ✅ Delete handler
  const handleDelete = async (id) => {
    if (userRole !== "admin") {
      toast.error("Vetëm administratorët mund të fshijnë regjistrime!");
      return;
    }

    if (!confirm("A je i sigurt që dëshiron ta fshish këtë regjistrim?")) return;

    const { error } = await supabase
      .from("member_discipleship")
      .delete()
      .eq("id", id);

    if (error) toast.error("Gabim gjatë fshirjes!");
    else {
      toast.success("Regjistrimi u fshi!");
      fetchAll();
    }
  };

  if (loadingRole) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Duke ngarkuar të dhënat e përdoruesit...
      </div>
    );
  }

  // 🔎 Filtering + sorting
  const filteredRecords = records
    .filter((r) => {
      const fullName = `${r.members?.emri || ""} ${r.members?.mbiemri || ""}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "Të gjitha" || r.status === statusFilter;
      const matchesMentor =
        mentorFilter === "Të gjithë" ||
        (r.mentor_name || "").toLowerCase() === mentorFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesMentor;
    })
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return new Date(a.completion_date) - new Date(b.completion_date);
      } else {
        return new Date(b.completion_date) - new Date(a.completion_date);
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(`/${normalizedChurchSlug}`)}
          className="flex items-center gap-2 text-rose-700 font-medium hover:underline"
        >
          <ArrowLeft size={18} /> Kthehu pas
        </button>

        <h1 className="text-2xl font-extrabold text-gray-800">
          📖 Shkolla e Dishepullizimit
        </h1>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              navigate(`/${normalizedChurchSlug}/discipleship/courses/manage`)
            }
            className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            <Settings size={18} /> Menaxho Kurset
          </button>

          <button
            onClick={() =>
              navigate(`/${normalizedChurchSlug}/discipleship/course-library`)
            }
            className="flex items-center gap-2 bg-green-200 text-green-800 px-4 py-2 rounded-lg hover:bg-green-300 transition"
          >
            <BookOpen size={18} /> Materialet e Kurseve
          </button>

          {userRole === "admin" && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition"
            >
              <Plus size={18} /> Regjistro Kurs
            </button>
          )}
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-1">
            Kërko anëtar:
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Shkruaj emrin..."
            className="border rounded-md px-3 py-2 w-56"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-1">
            Filtri sipas statusit:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option>Të gjitha</option>
            <option>Në proces</option>
            <option>Përfunduar</option>
            <option>Nuk ka filluar</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-1">
            Filtri sipas mentorit:
          </label>
          <select
            value={mentorFilter}
            onChange={(e) => setMentorFilter(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option>Të gjithë</option>
            {[...new Set(records.map((r) => r.mentor_name).filter(Boolean))].map(
              (mentor) => (
                <option key={mentor}>{mentor}</option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-1">
            Radhit sipas datës:
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="desc">Më e reja fillimisht</option>
            <option value="asc">Më e vjetra fillimisht</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-md p-4">
        {loading ? (
          <p className="text-center text-gray-500 py-6">
            Duke ngarkuar të dhënat...
          </p>
        ) : filteredRecords.length === 0 ? (
          <p className="text-center text-gray-500 py-6">
            Asnjë rezultat për filtrat aktualë.
          </p>
        ) : (
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-rose-100">
              <tr>
                <th className="px-4 py-2 text-left">Anëtari</th>
                <th className="px-4 py-2 text-left">Kursi</th>
                <th className="px-4 py-2 text-left">Mentori</th>
                <th className="px-4 py-2 text-left">Data përfundimit</th>
                <th className="px-4 py-2 text-left">Statusi</th>
                <th className="px-4 py-2 text-center">Veprime</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => (
                <tr key={r.id} className="border-t hover:bg-rose-50">
                  <td className="px-4 py-2">
                    {r.members?.emri} {r.members?.mbiemri}
                  </td>
                  <td className="px-4 py-2">{r.discipleship_courses?.title}</td>
                  <td className="px-4 py-2">{r.mentor_name || "—"}</td>
                  <td className="px-4 py-2">{r.completion_date || "—"}</td>
                  <td className="px-4 py-2">{r.status}</td>
                  <td className="px-4 py-2 flex justify-center gap-3">
                    {userRole === "admin" ? (
                      <>
                        <button
                          onClick={() => {
                            setSelected(r);
                            setFormData({
                              member_id: r.member_id,
                              course_id: r.course_id,
                              mentor_name: r.mentor_name || "",
                              completion_date: r.completion_date || "",
                              status: r.status,
                              notes: r.notes || "",
                            });
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">View Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
