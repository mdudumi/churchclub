import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function CourseForm({ course, onClose, onSaved, churchSlug }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    level: 1,
    order_number: 1,
  });

  useEffect(() => {
    if (course) setForm(course);
  }, [course]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { ...form, church_slug: churchSlug };

    if (course) {
      const { error } = await supabase
        .from("discipleship_courses")
        .update(payload)
        .eq("id", course.id);
      if (error) return toast.error("Gabim gjatë përditësimit të kursit");
      toast.success("Kursi u përditësua me sukses!");
    } else {
      const { error } = await supabase
        .from("discipleship_courses")
        .insert([payload]);
      if (error) return toast.error("Gabim gjatë shtimit të kursit");
      toast.success("Kursi u shtua me sukses!");
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[400px]">
        <h2 className="text-lg font-bold mb-4 text-gray-800">
          {course ? "Përditëso Kursin" : "Shto Kurs të Ri"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Titulli i kursit"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border rounded-md px-3 py-2"
            required
          />
          <textarea
            placeholder="Përshkrimi"
            value={form.description || ""}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="border rounded-md px-3 py-2 min-h-[60px]"
          />
          <input
            type="number"
            placeholder="Niveli"
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            className="border rounded-md px-3 py-2"
          />
          <input
            type="number"
            placeholder="Renditja"
            value={form.order_number}
            onChange={(e) => setForm({ ...form, order_number: e.target.value })}
            className="border rounded-md px-3 py-2"
          />
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              className="flex-1 bg-rose-600 text-white py-2 rounded-md hover:bg-rose-700 transition"
            >
              Ruaj
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition"
            >
              Anulo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
