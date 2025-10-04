import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function LessonViewer() {
  const { churchSlug, courseId } = useParams();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Merr kursin nga Supabase
  const fetchCourse = async () => {
    const { data, error } = await supabase
      .from("discipleship_courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (error) {
      console.error(error);
      toast.error("Gabim gjatë ngarkimit të kursit!");
    } else {
      setCourse(data);
    }
  };

  // 🔹 Merr mësimet dhe detajet
  const fetchLessons = async () => {
    const { data, error } = await supabase
      .from("discipleship_lessons")
      .select("*, lesson_details(*)")
      .eq("course_id", courseId)
      .order("order_number");

    if (error) {
      console.error(error);
      toast.error("Gabim gjatë ngarkimit të mësimeve!");
    } else {
      setLessons(data || []);
    }
  };

  // 🔹 Ngarko të dhënat
  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchCourse();
      await fetchLessons();
      setLoading(false);
    })();
  }, [courseId]);

  // 🔹 Navigimi midis mësimeve
  const currentIndex = lessons.findIndex((l) => l.id === activeLesson?.id);
  const nextLesson = lessons[currentIndex + 1];
  const prevLesson = lessons[currentIndex - 1];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-rose-100">
        <p className="text-gray-500 italic">Duke ngarkuar mësimet...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(`/${churchSlug}/discipleship/course-library`)}
          className="flex items-center gap-2 text-rose-700 font-medium hover:underline"
        >
          <ArrowLeft size={18} /> Kthehu
        </button>
        <h1 className="text-2xl font-extrabold text-gray-800">
          {course ? course.title : "Ngarkim..."}
        </h1>
        <div></div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar e mësimeve */}
        <div className="bg-white rounded-xl shadow-md p-4 h-fit md:sticky top-4">
          <h2 className="font-bold text-gray-800 mb-2">Mësimet</h2>
          <ul className="space-y-1">
            {lessons.map((l) => (
              <li
                key={l.id}
                onClick={() => setActiveLesson(l)}
                className={`cursor-pointer rounded-md px-3 py-2 ${
                  activeLesson?.id === l.id
                    ? "bg-rose-100 text-rose-700 font-semibold"
                    : "hover:bg-rose-50"
                }`}
              >
                {l.title}
              </li>
            ))}
          </ul>
        </div>

        {/* Përmbajtja e mësimit */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-md p-6">
          {!activeLesson ? (
            <p className="text-gray-500 italic text-center py-10">
              Zgjidh një mësim për ta parë.
            </p>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {activeLesson.title}
              </h2>
              <p className="text-gray-600 mb-4 whitespace-pre-line">
                {activeLesson.summary}
              </p>

              {activeLesson.lesson_details?.map((d) => (
                <div
                  key={d.id}
                  className="border-t border-gray-200 pt-3 mt-3 text-gray-700"
                >
                  {d.scripture_reference && (
                    <p className="font-semibold text-rose-700 mb-1">
                      📖 {d.scripture_reference}
                    </p>
                  )}
                  <p className="whitespace-pre-line">{d.content}</p>
                  {d.resources?.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                      {d.resources.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {/* Navigim mes mësimeve */}
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() =>
                    prevLesson ? setActiveLesson(prevLesson) : null
                  }
                  disabled={!prevLesson}
                  className={`px-4 py-2 rounded-md ${
                    prevLesson
                      ? "bg-gray-200 hover:bg-gray-300"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  ← Mësimi i Mëparshëm
                </button>

                <button
                  onClick={() =>
                    nextLesson ? setActiveLesson(nextLesson) : null
                  }
                  disabled={!nextLesson}
                  className={`px-4 py-2 rounded-md ${
                    nextLesson
                      ? "bg-gray-200 hover:bg-gray-300"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Mësimi Tjetër →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
