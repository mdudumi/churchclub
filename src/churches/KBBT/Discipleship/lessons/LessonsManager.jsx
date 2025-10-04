import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LessonsManager() {
  const { churchSlug, courseId } = useParams();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [form, setForm] = useState({ title: "", summary: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState("");

  const [userRole, setUserRole] = useState("viewer");
  const [loadingRole, setLoadingRole] = useState(true);

  // ✅ Church-based role check (service_memberships)
  useEffect(() => {
    const fetchUserRole = async () => {
      setLoadingRole(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setUserRole("viewer");
          setLoadingRole(false);
          return;
        }

        // 1️⃣ Get the church ID from slug
        const { data: church, error: churchError } = await supabase
          .from("churches")
          .select("id, slug")
          .eq("slug", churchSlug)
          .maybeSingle();

        if (churchError || !church) {
          console.warn("❌ No church found for slug:", churchSlug);
          setUserRole("viewer");
          setLoadingRole(false);
          return;
        }

        console.log("[LESSONS] Church row =", church);

        // 2️⃣ Find the discipleship service for this church
        const { data: service, error: serviceError } = await supabase
          .from("services")
          .select("id, slug, name")
          .eq("church_id", church.id)
          .eq("slug", "discipleship")
          .maybeSingle();

        if (serviceError || !service) {
          console.warn("❌ No discipleship service found for church:", churchSlug);
          setUserRole("viewer");
          setLoadingRole(false);
          return;
        }

        console.log("[LESSONS] Service row =", service);

        // 3️⃣ Check membership in service_memberships
        const { data: membership, error: membershipError } = await supabase
          .from("service_memberships")
          .select("role, church_id, service_id, user_id")
          .eq("church_id", church.id)
          .eq("service_id", service.id)
          .eq("user_id", user.id)
          .maybeSingle();

        console.log("[LESSONS] Membership row =", membership || null);

        if (membershipError) {
          console.error("Error fetching role:", membershipError.message);
          setUserRole("viewer");
        } else if (membership) {
          setUserRole(membership.role || "viewer");
        } else {
          console.warn("No service_membership row found, defaulting to viewer");
          setUserRole("viewer");
        }
      } catch (err) {
        console.error("Error in fetchUserRole:", err.message);
        setUserRole("viewer");
      } finally {
        setLoadingRole(false);
      }
    };

    fetchUserRole();
  }, [churchSlug]);

  // 🔹 Fetch course and lessons
  useEffect(() => {
    fetchLessons();
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    const { data, error } = await supabase
      .from("discipleship_courses")
      .select("title")
      .eq("id", courseId)
      .maybeSingle();
    if (!error && data) setCourseTitle(data.title);
  };

  const fetchLessons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("discipleship_lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("order_number", { ascending: true });

    if (error) toast.error("Gabim gjatë ngarkimit të mësimeve!");
    else setLessons(data || []);
    setLoading(false);
  };

  // 🔹 Add or update lesson (admin only)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userRole !== "admin") {
      toast.error("Vetëm administratorët mund të shtojnë ose përditësojnë mësime!");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Vendos titullin e mësimit!");
      return;
    }

    const payload = { ...form, course_id: courseId };

    let result;
    if (editingId) {
      result = await supabase
        .from("discipleship_lessons")
        .update(payload)
        .eq("id", editingId);
    } else {
      result = await supabase
        .from("discipleship_lessons")
        .insert([{ ...payload, order_number: lessons.length + 1 }]);
    }

    if (result.error) {
      console.error(result.error);
      toast.error("Gabim gjatë ruajtjes së mësimit!");
    } else {
      toast.success(editingId ? "Mësimi u përditësua!" : "Mësimi u shtua!");
      setForm({ title: "", summary: "" });
      setEditingId(null);
      fetchLessons();
    }
  };

  // 🔹 Delete lesson (admin only)
  const handleDelete = async (id) => {
    if (userRole !== "admin") {
      toast.error("Vetëm administratorët mund të fshijnë mësime!");
      return;
    }

    if (!confirm("Je i sigurt që dëshiron ta fshish këtë mësim?")) return;

    const { error } = await supabase
      .from("discipleship_lessons")
      .delete()
      .eq("id", id);

    if (error) toast.error("Gabim gjatë fshirjes!");
    else {
      toast.success("Mësimi u fshi!");
      fetchLessons();
    }
  };

  if (loadingRole) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Duke ngarkuar të dhënat e përdoruesit...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(`/${churchSlug}/discipleship/courses/manage`)}
          className="flex items-center gap-2 text-rose-700 font-medium hover:underline"
        >
          <ArrowLeft size={18} /> Kthehu
        </button>
        <h1 className="text-2xl font-extrabold text-gray-800">
          📖 Mësimet e Kursit
        </h1>
        <div></div>
      </div>

      <h2 className="text-lg font-semibold text-center mb-4 text-gray-700">
        Kursi: <span className="text-rose-600">{courseTitle}</span>
      </h2>

      {/* Form (only for admins) */}
      {userRole === "admin" && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow max-w-xl mx-auto mb-8"
        >
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "✏️ Përditëso Mësimin" : "➕ Shto Mësim të Ri"}
          </h2>

          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 mb-3"
            placeholder="Titulli i mësimit"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <textarea
            className="w-full border rounded-md px-3 py-2 mb-3 min-h-[100px]"
            placeholder="Përmbledhje e shkurtër e mësimit"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />

          <button
            type="submit"
            className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition"
          >
            {editingId ? "Ruaj Ndryshimet" : "Shto Mësimin"}
          </button>
        </form>
      )}

      {/* Lessons List */}
      <div className="bg-white p-6 rounded-xl shadow max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold mb-4">Lista e Mësimeve</h2>
        {loading ? (
          <p className="text-center text-gray-500">Duke ngarkuar...</p>
        ) : lessons.length === 0 ? (
          <p className="text-center text-gray-500">Nuk ka mësime ende.</p>
        ) : (
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-rose-100">
                <th className="p-2">Titulli</th>
                <th className="p-2">Përmbledhja</th>
                <th className="p-2 text-center">Veprime</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l) => (
                <tr key={l.id} className="border-t hover:bg-rose-50">
                  <td className="p-2">{l.title}</td>
                  <td className="p-2 text-gray-600">{l.summary}</td>
                  <td className="p-2 flex justify-center gap-3">
                    {userRole === "admin" ? (
                      <>
                        <Edit
                          className="text-blue-600 cursor-pointer hover:scale-110"
                          onClick={() => {
                            setForm({ title: l.title, summary: l.summary });
                            setEditingId(l.id);
                          }}
                        />
                        <Trash2
                          className="text-red-600 cursor-pointer hover:scale-110"
                          onClick={() => handleDelete(l.id)}
                        />
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
