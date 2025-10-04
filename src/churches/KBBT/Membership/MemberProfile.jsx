import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Edit } from "lucide-react";
import toast from "react-hot-toast";

export default function MemberProfile() {
  const { churchSlug, memberId } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);

  useEffect(() => {
    fetchMember();
  }, [memberId]);

  const fetchMember = async () => {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .eq("church_slug", churchSlug)
      .single();
    if (error) toast.error("Gabim gjatë ngarkimit të profilit");
    else setMember(data);
  };

  if (!member) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Duke ngarkuar...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(`/${churchSlug}/membership`)}
          className="flex items-center gap-2 text-rose-700 font-medium hover:underline"
        >
          <ArrowLeft size={18} /> Kthehu tek lista
        </button>
        <h1 className="text-2xl font-extrabold text-gray-800">👤 Profili i Anëtarit</h1>
        <button
          onClick={() => navigate(`/${churchSlug}/membership?edit=${member.id}`)}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition"
        >
          <Edit size={18} /> Përditëso
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-xl max-w-3xl mx-auto p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <img
            src={member.foto_url || "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"}
            alt="Foto"
            className="w-40 h-40 rounded-full object-cover border-4 border-rose-300"
          />
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800 mb-1">
              {member.emri} {member.mbiemri}
            </h2>
            <p className="text-gray-600 text-sm mb-4 italic">{member.roli_kishes}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
              <p><span className="font-semibold">Gjinia:</span> {member.gjinia}</p>
              <p><span className="font-semibold">Data lindjes:</span> {member.data_lindjes || "—"}</p>
              <p><span className="font-semibold">Telefoni:</span> {member.telefoni || "—"}</p>
              <p><span className="font-semibold">Email:</span> {member.email || "—"}</p>
              <p><span className="font-semibold">Adresa:</span> {member.adresa || "—"}</p>
              <p><span className="font-semibold">Qyteti:</span> {member.qyteti || "—"}</p>
              <p><span className="font-semibold">Statusi martesor:</span> {member.statusi_martesor || "—"}</p>
              <p><span className="font-semibold">Data bashkimit:</span> {member.data_bashkimi || "—"}</p>
              <p><span className="font-semibold">Aktiv:</span> {member.aktiv ? "Po" : "Jo"}</p>
            </div>
          </div>
        </div>

        <hr className="my-6 border-rose-200" />

        {/* Spiritual Data */}
        <h3 className="text-lg font-semibold mb-2 text-gray-800">🕊️ Të dhëna shpirtërore</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
          <p>
            <span className="font-semibold">Data e shpëtimit:</span>{" "}
            {member.salvation_date || "—"}
          </p>
          <p>
            <span className="font-semibold">Data e pagëzimit:</span>{" "}
            {member.baptism_date || "—"}
          </p>
          <p>
            <span className="font-semibold">Vendi i pagëzimit:</span>{" "}
            {member.baptism_place || "—"}
          </p>
          <p>
            <span className="font-semibold">Shkolla e Dishepullizimit:</span>{" "}
            {member.discip_school_completed
              ? `Po (${member.discip_school_date || "Data e panjohur"})`
              : "Jo"}
          </p>
        </div>

        {member.testimony && (
          <div className="mt-4">
            <p className="font-semibold text-gray-800 mb-1">Dëshmia personale:</p>
            <p className="text-gray-700 italic whitespace-pre-line">{member.testimony}</p>
          </div>
        )}

        {member.ministries && member.ministries.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold text-gray-800 mb-1">Shërbimet aktive:</p>
            <ul className="list-disc list-inside text-gray-700">
              {member.ministries.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {member.notes && (
          <div className="mt-4">
            <p className="font-semibold text-gray-800 mb-1">Shënime:</p>
            <p className="text-gray-700 whitespace-pre-line">{member.notes}</p>
          </div>
        )}

        <hr className="my-6 border-rose-200" />

        {/* Future Section */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-800">🗂️ Aktivitetet e fundit</h3>
          <p className="text-gray-600 text-sm">
            Këtu mund të shtohen më vonë pjesëmarrjet, trajnime, takime ose kontribute për këtë anëtar.
          </p>
        </div>
      </div>
    </div>
  );
}

