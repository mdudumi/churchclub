import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, BookOpen, Layers } from "lucide-react";
import toast from "react-hot-toast";

export default function CourseLibrary() {
  const { churchSlug } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, [churchSlug]);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("discipleship_courses")
      .select("id, title, description, image_url, order_number")
      .eq("church_slug", churchSlug)
      .order("order_number", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("Gabim gjatë ngarkimit të kurseve!");
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => navigate(`/${churchSlug}/discipleship`)}
          className="flex items-center gap-2 text-rose-700 font-medium hover:underline"
        >
          <ArrowLeft size={18} /> Kthehu
        </button>

        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
          <Layers className="text-rose-600" /> Materialet e Kurseve
        </h1>

        <div></div>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-center text-gray-500 py-10">Duke ngarkuar kurset...</p>
      ) : courses.length === 0 ? (
        <p className="text-center text-gray-500 py-10">Nuk ka kurse të regjistruara ende.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
            >
              {/* Optional image */}
              {course.image_url ? (
                <img
                  src={course.image_url}
                  alt={course.title}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-rose-100 flex items-center justify-center">
                  <BookOpen className="text-rose-400" size={48} />
                </div>
              )}

              {/* Course content */}
              <div className="p-4 flex flex-col justify-between h-[220px]">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-2">{course.title}</h2>
                  <p className="text-gray-600 text-sm line-clamp-4">
                    {course.description || "Ky kurs nuk ka përshkrim."}
                  </p>
                </div>

                <button
                  onClick={() =>
                    navigate(`/${churchSlug}/discipleship/course/${course.id}`)
                  }
                  className="mt-4 bg-rose-600 text-white py-2 rounded-md hover:bg-rose-700 transition flex items-center justify-center gap-2 font-medium"
                >
                  <BookOpen size={18} /> Hap Materialet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
