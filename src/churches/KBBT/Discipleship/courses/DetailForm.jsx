import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function DetailForm({ detail, onClose, onSaved, lessonId }) {
  const [form, setForm] = useState({
    scripture_reference: "",
    content: "",
    resources: "",
  });

  useEffect(() => {
    if (detail)
      setForm({
        scripture_reference: detail.scripture_reference || "",
        content: detail.content || "",
        resources: (detail.resources || []).join(", "),
      });
  }, [detail]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      lesson_id: lessonId,
      scripture_reference: form.scripture_reference,
      content: form.content,
      resources: form.resources
        ? form.resources.split(",").map((r) => r.trim())
        : [],
    };

    if (detail) {
      const { error } = await supabase
        .from("lesson_details")
        .update(payload)
        .eq("id", detail.id);
      if (error) return toast.error("Gabim gjatë përditësimit të përmbajtjes");
      toast.success("Përmbajtja u përditësua!");
    } else {
      const { error } = await supabase
        .from("lesson_details")
        .insert([payload]);
      if (error) return toast.error("Gabim gjatë shtimit të përmbajtjes");
      toast.success("Përmbajtja u shtua!");
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[500px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4 text-gray-800">
          {detail ? "Përditëso Përmbajtjen" : "Shto Përmbajtje të Re"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Referenca Biblike (p.sh. Gjoni 3:16)"
            value={form.scripture_reference}
            onChange={(e) =>
              setForm({ ...form, scripture_reference: e.target.value })
            }
            className="border rounded-md px-3 py-2"
          />
          <textarea
            placeholder="Përmbajtja e mësimit"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="border rounded-md px-3 py-2 min-h-[120px]"
          />
          <textarea
            placeholder="Burimet (ndarë me presje)"
            value={form.resources}
            onChange={(e) => setForm({ ...form, resources: e.target.value })}
            className="border rounded-md px-3 py-2 min-h-[60px]"
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
