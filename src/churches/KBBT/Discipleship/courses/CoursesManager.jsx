import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  BookOpen,
  FileText,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function CoursesManager() {
  const { churchSlug } = useParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({ title: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [userRole, setUserRole] = useState("viewer");
  const [loadingRole, setLoadingRole] = useState(true);

  // ✅ Church-specific role (based on service_memberships)
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

        // 1️⃣ Get the church UUID from slug
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

        console.log("[COURSES] Church row =", church);

        // 2️⃣ Get discipleship service for that church
        const { data: service, error: serviceError } = await supabase
          .from("services")
          .select("id, slug, name")
          .eq("church_id", church.id)
          .eq("slug", "discipleship")
          .maybeSingle();

        if (serviceError || !service) {
          console.warn("❌ No discipleship service found for church", churchSlug);
          setUserRole("viewer");
          setLoadingRole(false);
          return;
        }

        console.log("[COURSES] Service row =", service);

        // 3️⃣ Fetch the membership for that service and user
        const { data: membership, error: membershipError } = await supabase
          .from("service_memberships")
          .select("role, church_id, service_id, user_id")
          .eq("church_id", church.id)
          .eq("service_id", service.id)
          .eq("user_id", user.id)
          .maybeSingle();

        console.log("[COURSES] Membership row =", membership || null);

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

  // 🔹 Merr listën e kurseve
  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("discipleship_courses")
      .select("*")
      .eq("church_slug", churchSlug)
      .order("order_number", { ascending: true });

    if (error) {
      console.error("❌ Supabase error:", error.message);
      toast.error("Gabim gjatë ngarkimit të kurseve!");
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, [churchSlug]);

  // 🔹 Shto ose përditëso kursin (vetëm admin)
  const handleAdd = async (e) => {
    e.preventDefault();

    if (userRole !== "admin") {
      toast.error("Vetëm administratorët mund të shtojnë ose përditësojnë kurse!");
      return;
    }

    if (!newCourse.title.trim()) {
      toast.error("Vendos një titull kursi!");
      return;
    }

    let result;
    if (editingId) {
      result = await supabase
        .from("discipleship_courses")
        .update({
          title: newCourse.title,
          description: newCourse.description,
          church_slug: churchSlug,
        })
        .eq("id", editingId);
      if (!result.error) toast.success("Kursi u përditësua!");
    } else {
      result = await supabase.from("discipleship_courses").insert([
        {
          title: newCourse.title,
          description: newCourse.description,
          church_slug: churchSlug,
          order_number: courses.length + 1,
        },
      ]);
      if (!result.error) toast.success("Kursi u shtua me sukses!");
    }

    if (result.error) {
      console.error(result.error);
      toast.error(`Gabim gjatë ruajtjes: ${result.error.message}`);
    }

    setNewCourse({ title: "", description: "" });
    setEditingId(null);
    fetchCourses();
  };

  // 🔹 Përgatit për editim
  const handleEdit = (course) => {
    if (userRole !== "admin") {
      toast.error("Vetëm administratorët mund të përditësojnë kurse!");
      return;
    }
    setNewCourse({ title: course.title, description: course.description });
    setEditingId(course.id);
  };

  // 🔹 Fshi kursin (vetëm admin)
  const handleDelete = async (id) => {
    if (userRole !== "admin") {
      toast.error("Vetëm administratorët mund të fshijnë kurse!");
      return;
    }

    if (!confirm("Je i sigurt që dëshiron ta fshish këtë kurs?")) return;

    const { error } = await supabase
      .from("discipleship_courses")
      .delete()
      .eq("id", id)
      .eq("church_slug", churchSlug);

    if (error) {
      toast.error("Gabim gjatë fshirjes!");
    } else {
      toast.success("Kursi u fshi!");
      fetchCourses();
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
    <div className="min-h-screen bg-rose-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(`/${churchSlug}/discipleship`)}
          className="flex items-center text-rose-600 font-semibold hover:underline"
        >
          <ArrowLeft className="w-5 h-5 mr-1" /> Kthehu pas
        </button>

        <h1 className="text-2xl font-bold text-gray-800">
          📚 Menaxho Kurset e Dishepullizimit
        </h1>

        <button
          onClick={() => navigate(`/${churchSlug}/discipleship/course-library`)}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition"
        >
          <BookOpen size={18} /> Materialet e Kurseve
        </button>
      </div>

      {/* Forma për shtim/editim */}
      {userRole === "admin" && (
        <form
          onSubmit={handleAdd}
          className="bg-white p-6 rounded-2xl shadow max-w-xl mx-auto mb-8"
        >
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "✏️ Përditëso Kursin" : "➕ Shto Kurs të Ri"}
          </h2>

          <div className="mb-3">
            <label className="block font-semibold mb-1">Titulli i Kursit</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2"
              value={newCourse.title}
              onChange={(e) =>
                setNewCourse({ ...newCourse, title: e.target.value })
              }
              placeholder="p.sh. Niveli 1: Bazat e Besimit"
            />
          </div>

          <div className="mb-3">
            <label className="block font-semibold mb-1">Përshkrimi</label>
            <textarea
              className="w-full border rounded-lg p-2"
              value={newCourse.description}
              onChange={(e) =>
                setNewCourse({ ...newCourse, description: e.target.value })
              }
              placeholder="Shkurtimisht për çfarë është ky kurs"
            />
          </div>

          <button
            type="submit"
            className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition"
          >
            {editingId ? "Ruaj Ndryshimet" : "Shto Kursin"}
          </button>
        </form>
      )}

      {/* Lista e kurseve */}
      <div className="bg-white p-6 rounded-2xl shadow max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold mb-4">Lista e Kurseve</h2>

        {loading ? (
          <p className="text-center text-gray-500">Duke ngarkuar...</p>
        ) : courses.length === 0 ? (
          <p className="text-center text-gray-500">Nuk ka kurse ende.</p>
        ) : (
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-rose-100">
                <th className="p-2">Titulli</th>
                <th className="p-2">Përshkrimi</th>
                <th className="p-2 text-center">Veprime</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-t hover:bg-rose-50">
                  <td className="p-2 font-medium">{c.title}</td>
                  <td className="p-2 text-gray-600">{c.description}</td>
                  <td className="p-2 flex justify-center gap-3">
                    {userRole === "admin" ? (
                      <>
                        <Edit
                          className="text-blue-600 cursor-pointer hover:scale-110"
                          title="Përditëso kursin"
                          onClick={() => handleEdit(c)}
                        />
                        <button
                          onClick={() =>
                            navigate(
                              `/${churchSlug}/discipleship/courses/${c.id}/lessons`
                            )
                          }
                          title="Shto ose shiko mësimet"
                          className="text-green-600 hover:text-green-800"
                        >
                          <FileText size={18} />
                        </button>
                        <Trash2
                          className="text-red-600 cursor-pointer hover:scale-110"
                          title="Fshi kursin"
                          onClick={() => handleDelete(c.id)}
                        />
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            navigate(
                              `/${churchSlug}/discipleship/courses/${c.id}/lessons`
                            )
                          }
                          title="Shiko mësimet"
                          className="text-green-600 hover:text-green-800"
                        >
                          <FileText size={18} />
                        </button>
                        <span className="text-gray-400 text-sm ml-2">
                          View Only
                        </span>
                      </>
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
