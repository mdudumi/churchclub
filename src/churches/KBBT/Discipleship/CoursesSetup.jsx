import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus, Edit, Trash2, BookOpen } from "lucide-react";
import toast from "react-hot-toast";

// ✅ Correct imports for modular forms
import CourseForm from "./courses/CourseForm";
import LessonForm from "./courses/LessonForm";
import DetailForm from "./courses/DetailForm";

export default function CoursesSetup() {
  const { churchSlug } = useParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [details, setDetails] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);

  // Modal state
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showDetailForm, setShowDetailForm] = useState(false);

  // Edit targets
  const [editCourse, setEditCourse] = useState(null);
  const [editLesson, setEditLesson] = useState(null);
  const [editDetail, setEditDetail] = useState(null);

  // --------------------
  // Fetch Data
  // --------------------
  useEffect(() => {
    fetchCourses();
  }, [churchSlug]);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("discipleship_courses")
      .select("*")
      .eq("church_slug", churchSlug)
      .order("order_number");

    if (error) toast.error("Gabim gjatë ngarkimit të kurseve");
    setCourses(data || []);
  };

  const fetchLessons = async (courseId) => {
    const { data, error } = await supabase
      .from("discipleship_lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("order_number");

    if (error) toast.error("Gabim gjatë ngarkimit të mësimeve");
    setLessons(data || []);
  };

  const fetchDetails = async (lessonId) => {
    const { data, error } = await supabase
      .from("lesson_details")
      .select("*")
      .eq("lesson_id", lessonId);

    if (error) toast.error("Gabim gjatë ngarkimit të detajeve");
    setDetails(data || []);
  };

  // --------------------
  // Delete Handler
  // --------------------
  const handleDelete = async (table, id, reloadFn) => {
    if (!confirm("A je i sigurt që dëshiron ta fshish këtë element?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error("Gabim gjatë fshirjes");
    else {
      toast.success("U fshi me sukses!");
      reloadFn();
    }
  };

  // --------------------
  // Render
  // --------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(`/${churchSlug}`)}
          className="flex items-center gap-2 text-rose-700 font-medium hover:underline"
        >
          <ArrowLeft size={18} /> Kthehu pas
        </button>
        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
          <BookOpen /> Menaxhimi i Kurseve
        </h1>
        <button
          onClick={() => {
            setEditCourse(null);
            setShowCourseForm(true);
          }}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition"
        >
          <Plus size={18} /> Shto Kurs
        </button>
      </div>

      {/* Courses list */}
      {!selectedCourse && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="font-bold text-gray-700 mb-3">Kurse ekzistuese</h2>
          {courses.map((c) => (
            <div
              key={c.id}
              className="border-b py-2 flex justify-between items-center hover:bg-rose-50 transition cursor-pointer"
              onClick={() => {
                setSelectedCourse(c);
                fetchLessons(c.id);
              }}
            >
              <span>
                <strong>{c.title}</strong> — {c.description}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditCourse(c);
                    setShowCourseForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete("discipleship_courses", c.id, fetchCourses);
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <p className="text-gray-500 text-sm italic">Nuk ka ende kurse.</p>
          )}
        </div>
      )}

      {/* Lessons list */}
      {selectedCourse && !selectedLesson && (
        <div className="bg-white rounded-xl shadow-md p-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-gray-700">
              Mësimet për: {selectedCourse.title}
            </h2>
            <button
              onClick={() => {
                setEditLesson(null);
                setShowLessonForm(true);
              }}
              className="bg-rose-600 text-white px-3 py-1 rounded-md hover:bg-rose-700 text-sm"
            >
              + Shto Mësim
            </button>
          </div>
          {lessons.map((l) => (
            <div
              key={l.id}
              className="border-b py-2 flex justify-between items-center hover:bg-rose-50 transition cursor-pointer"
              onClick={() => {
                setSelectedLesson(l);
                fetchDetails(l.id);
              }}
            >
              <span>
                <strong>{l.title}</strong> — {l.summary}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditLesson(l);
                    setShowLessonForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete("discipleship_lessons", l.id, () =>
                      fetchLessons(selectedCourse.id)
                    );
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {lessons.length === 0 && (
            <p className="text-gray-500 text-sm italic">
              Nuk ka mësime për këtë kurs.
            </p>
          )}
          <button
            onClick={() => setSelectedCourse(null)}
            className="mt-4 text-sm text-rose-600 hover:underline"
          >
            ← Kthehu te kurset
          </button>
        </div>
      )}

      {/* Lesson details */}
      {selectedLesson && (
        <div className="bg-white rounded-xl shadow-md p-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-gray-700">
              Detajet për: {selectedLesson.title}
            </h2>
            <button
              onClick={() => {
                setEditDetail(null);
                setShowDetailForm(true);
              }}
              className="bg-rose-600 text-white px-3 py-1 rounded-md hover:bg-rose-700 text-sm"
            >
              + Shto Detaj
            </button>
          </div>
          {details.map((d) => (
            <div key={d.id} className="border-b py-2 text-gray-700">
              <p>
                📖 <strong>{d.scripture_reference}</strong>
              </p>
              <p className="text-sm whitespace-pre-line">{d.content}</p>
              {d.resources?.length > 0 && (
                <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                  {d.resources.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {details.length === 0 && (
            <p className="text-gray-500 text-sm italic">
              Nuk ka ende detaje për këtë mësim.
            </p>
          )}
          <button
            onClick={() => setSelectedLesson(null)}
            className="mt-4 text-sm text-rose-600 hover:underline"
          >
            ← Kthehu te mësimet
          </button>
        </div>
      )}

      {/* Modals */}
      {showCourseForm && (
        <CourseForm
          course={editCourse}
          onClose={() => setShowCourseForm(false)}
          onSaved={fetchCourses}
          churchSlug={churchSlug}
        />
      )}
      {showLessonForm && (
        <LessonForm
          lesson={editLesson}
          onClose={() => setShowLessonForm(false)}
          onSaved={() => fetchLessons(selectedCourse.id)}
          courseId={selectedCourse.id}
        />
      )}
      {showDetailForm && (
        <DetailForm
          detail={editDetail}
          onClose={() => setShowDetailForm(false)}
          onSaved={() => fetchDetails(selectedLesson.id)}
          lessonId={selectedLesson.id}
        />
      )}
    </div>
  );
}
