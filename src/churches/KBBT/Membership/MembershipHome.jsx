import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  User,
  Filter,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

export default function MembershipHome() {
  const navigate = useNavigate();
  const { churchSlug } = useParams();

  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [userRole, setUserRole] = useState("viewer");
  const [loadingRole, setLoadingRole] = useState(true);

  // 🔍 Filters and Sort
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("Të gjithë");
  const [roleFilter, setRoleFilter] = useState("Të gjithë");
  const [maritalFilter, setMaritalFilter] = useState("Të gjithë");
  const [activeFilter, setActiveFilter] = useState("Të gjithë");
  const [discipFilter, setDiscipFilter] = useState("Të gjithë");
  const [sortBy, setSortBy] = useState("emri");

  const [formData, setFormData] = useState({
    emri: "",
    mbiemri: "",
    gjinia: "Mashkull",
    data_lindjes: "",
    telefoni: "",
    email: "",
    adresa: "",
    qyteti: "",
    statusi_martesor: "Beqar",
    data_bashkimi: "",
    roli_kishes: "Anëtar",
    aktiv: true,
    foto_url: "",
    baptism_date: "",
    baptism_place: "",
    testimony: "",
    salvation_date: "",
    discip_school_completed: false,
    discip_school_date: "",
    ministries: [],
    notes: "",
  });

  const [selected, setSelected] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // 🧩 Merr rolin e userit nga service_memberships
  useEffect(() => {
    const fetchRole = async () => {
      setLoadingRole(true);
      try {
        const { data: sessionUser } = await supabase.auth.getUser();
        const user = sessionUser?.user;
        if (!user) {
          setUserRole("viewer");
          setLoadingRole(false);
          return;
        }

        const { data: church } = await supabase
          .from("churches")
          .select("id, slug")
          .eq("slug", churchSlug)
          .maybeSingle();
        if (!church) {
          setUserRole("viewer");
          setLoadingRole(false);
          return;
        }

        const { data: services } = await supabase
          .from("services")
          .select("id, slug")
          .in("slug", ["membership", "anetaresia", "anetarsia", "members"])
          .limit(1);
        const service = services?.[0];
        if (!service) {
          setUserRole("viewer");
          setLoadingRole(false);
          return;
        }

        const { data: membership } = await supabase
          .from("service_memberships")
          .select("role")
          .eq("user_id", user.id)
          .eq("church_id", church.id)
          .eq("service_id", service.id)
          .maybeSingle();

        setUserRole(membership?.role || "viewer");
      } catch (err) {
        console.error(err);
        setUserRole("viewer");
      } finally {
        setLoadingRole(false);
      }
    };
    fetchRole();
  }, [churchSlug]);

  // 🔹 Merr anëtarët
  useEffect(() => {
    fetchMembers();
  }, [churchSlug]);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("church_slug", churchSlug)
      .order("emri", { ascending: true });
    if (error) toast.error("Gabim gjatë ngarkimit të anëtarëve!");
    else {
      setMembers(data);
      setFilteredMembers(data);
    }
  };

  // 🔍 Filter + Sort Logic
  useEffect(() => {
    let result = [...members];
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter(
        (m) =>
          (m.emri || "").toLowerCase().includes(term) ||
          (m.mbiemri || "").toLowerCase().includes(term) ||
          (m.qyteti || "").toLowerCase().includes(term) ||
          (m.email || "").toLowerCase().includes(term) ||
          (m.telefoni || "").toLowerCase().includes(term)
      );
    }
    if (genderFilter !== "Të gjithë")
      result = result.filter((m) => m.gjinia === genderFilter);
    if (roleFilter !== "Të gjithë")
      result = result.filter((m) => m.roli_kishes === roleFilter);
    if (maritalFilter !== "Të gjithë")
      result = result.filter((m) => m.statusi_martesor === maritalFilter);
    if (activeFilter !== "Të gjithë")
      result = result.filter((m) =>
        activeFilter === "Aktiv" ? m.aktiv : !m.aktiv
      );
    if (discipFilter !== "Të gjithë")
      result = result.filter((m) =>
        discipFilter === "Përfunduar"
          ? m.discip_school_completed
          : !m.discip_school_completed
      );
    result.sort((a, b) => {
      const A = (a[sortBy] || "").toString().toLowerCase();
      const B = (b[sortBy] || "").toString().toLowerCase();
      return A.localeCompare(B);
    });
    setFilteredMembers(result);
  }, [
    members,
    searchTerm,
    genderFilter,
    roleFilter,
    maritalFilter,
    activeFilter,
    discipFilter,
    sortBy,
  ]);

  // 🔹 Export to Excel
  const exportToExcel = () => {
    if (filteredMembers.length === 0) {
      toast.error("Nuk ka të dhëna për eksportim!");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(filteredMembers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Anetaret");
    XLSX.writeFile(workbook, `anetaret_${churchSlug}.xlsx`);
    toast.success("Të dhënat u eksportuan me sukses!");
  };

  // 🔹 Upload photo
  const handleUploadPhoto = async (file) => {
    if (!file) return null;
    const fileName = `${churchSlug}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("member_photos")
      .upload(fileName, file);
    if (error) {
      toast.error("Ngarkimi i fotos dështoi!");
      return null;
    }
    const { data: publicUrl } = supabase.storage
      .from("member_photos")
      .getPublicUrl(fileName);
    return publicUrl.publicUrl;
  };

  // ✅ Submit (insert/update) — fixed for empty date fields
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userRole !== "admin") {
      toast.error("Vetëm administratorët mund të shtojnë ose editojnë anëtarë!");
      return;
    }

    let photoUrl = formData.foto_url;
    if (photoFile) {
      photoUrl = await handleUploadPhoto(photoFile);
      if (!photoUrl) return;
    }

    const nullifyEmptyDates = (obj) => {
      const newObj = { ...obj };
      for (const key in newObj) {
        if (
          key.toLowerCase().includes("date") ||
          key.toLowerCase().includes("data_")
        ) {
          if (newObj[key] === "") newObj[key] = null;
        }
      }
      return newObj;
    };

    const payload = nullifyEmptyDates({
      ...formData,
      foto_url: photoUrl,
      church_slug: churchSlug,
    });

    try {
      if (selected) {
        const { error } = await supabase
          .from("members")
          .update(payload)
          .eq("id", selected.id);
        if (error) throw error;
        toast.success("Anëtari u përditësua me sukses!");
      } else {
        const { error } = await supabase.from("members").insert([payload]);
        if (error) throw error;
        toast.success("Anëtari u shtua me sukses!");
      }
      setShowForm(false);
      setSelected(null);
      resetForm();
      fetchMembers();
    } catch (error) {
      console.error("❌ Supabase error:", error.message);
      toast.error(`Gabim gjatë shtimit: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      emri: "",
      mbiemri: "",
      gjinia: "Mashkull",
      data_lindjes: "",
      telefoni: "",
      email: "",
      adresa: "",
      qyteti: "",
      statusi_martesor: "Beqar",
      data_bashkimi: "",
      roli_kishes: "Anëtar",
      aktiv: true,
      foto_url: "",
      baptism_date: "",
      baptism_place: "",
      testimony: "",
      salvation_date: "",
      discip_school_completed: false,
      discip_school_date: "",
      ministries: [],
      notes: "",
    });
    setPhotoFile(null);
  };

  const handleDelete = async (id) => {
    if (userRole !== "admin") {
      toast.error("Vetëm administratorët mund të fshijnë anëtarë!");
      return;
    }
    if (!confirm("A je i sigurt që dëshiron të fshish këtë anëtar?")) return;
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) toast.error("Gabim gjatë fshirjes!");
    else toast.success("Anëtari u fshi!");
    fetchMembers();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setGenderFilter("Të gjithë");
    setRoleFilter("Të gjithë");
    setMaritalFilter("Të gjithë");
    setActiveFilter("Të gjithë");
    setDiscipFilter("Të gjithë");
    setSortBy("emri");
  };

  if (loadingRole)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Duke ngarkuar të dhënat e përdoruesit...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100 p-6">
      <div className="mb-3 text-sm text-gray-700">
        <span className="bg-gray-100 px-2 py-1 rounded">
          Role: <strong>{userRole}</strong> | Church:{" "}
          <strong>{churchSlug}</strong>
        </span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(`/${churchSlug}`)}
          className="flex items-center gap-2 text-rose-700 font-medium hover:underline"
        >
          <ArrowLeft size={18} /> Kthehu pas
        </button>
        <h1 className="text-2xl font-extrabold text-gray-800">
          📖 Anëtarësia e Kishës
        </h1>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <FileSpreadsheet size={18} /> Eksporto Excel
          </button>
          {userRole === "admin" && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition"
            >
              <Plus size={18} /> Shto Anëtar
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-40 bg-white shadow-md rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="text-rose-600" size={18} />
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Kërko</label>
            <input
              type="text"
              placeholder="Emër, qytet, telefon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-md px-3 py-2 w-52"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Gjinia</label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option>Të gjithë</option>
              <option>Mashkull</option>
              <option>Femer</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Roli</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option>Të gjithë</option>
              <option>Anëtar</option>
              <option>Shërbyes</option>
              <option>Udhëheqës</option>
              <option>Pastor</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Statusi Martesor</label>
            <select
              value={maritalFilter}
              onChange={(e) => setMaritalFilter(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option>Të gjithë</option>
              <option>Beqar</option>
              <option>Martuar</option>
              <option>I Ve</option>
              <option>E Ve</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Aktiviteti</label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option>Të gjithë</option>
              <option>Aktiv</option>
              <option>Jo Aktiv</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">
              Shkolla Dishepullizimit
            </label>
            <select
              value={discipFilter}
              onChange={(e) => setDiscipFilter(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option>Të gjithë</option>
              <option>Përfunduar</option>
              <option>Jo përfunduar</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Rendit sipas</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="emri">Emrit</option>
              <option value="qyteti">Qytetit</option>
              <option value="roli_kishes">Rolës</option>
              <option value="data_bashkimi">Datës së Bashkimit</option>
              <option value="baptism_date">Datës së Pagëzimit</option>
              <option value="salvation_date">Datës së Shpëtimit</option>
            </select>
          </div>
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 bg-gray-100 px-3 py-2 rounded-md hover:bg-gray-200 text-gray-600 mt-5"
          >
            <XCircle size={16} /> Fshi Filtrat
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-md p-4">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-rose-100">
            <tr>
              <th className="px-4 py-2 text-left">Foto</th>
              <th className="px-4 py-2 text-left">Emri</th>
              <th className="px-4 py-2 text-left">Mbiemri</th>
              <th className="px-4 py-2 text-left">Telefoni</th>
              <th className="px-4 py-2 text-left">Qyteti</th>
              <th className="px-4 py-2 text-left">Roli</th>
              <th className="px-4 py-2 text-center">Veprime</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((m) => (
              <tr key={m.id} className="border-t hover:bg-rose-50">
                <td className="px-4 py-2">
                  {m.foto_url ? (
                    <img
                      src={m.foto_url}
                      alt="Foto"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="text-gray-400" size={24} />
                  )}
                </td>
                <td className="px-4 py-2">{m.emri}</td>
                <td className="px-4 py-2">{m.mbiemri}</td>
                <td className="px-4 py-2">{m.telefoni || "—"}</td>
                <td className="px-4 py-2">{m.qyteti || "—"}</td>
                <td className="px-4 py-2">{m.roli_kishes}</td>
                <td className="px-4 py-2 flex justify-center gap-3">
                  <button
                    onClick={() =>
                      navigate(`/${churchSlug}/membership/${m.id}`)
                    }
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Shiko
                  </button>

                  {userRole === "admin" && (
                    <>
                      <button
                        onClick={() => {
                          setSelected(m);
                          setFormData(m);
                          setShowForm(true);
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredMembers.length === 0 && (
          <p className="text-center text-gray-500 py-6">
            Asnjë anëtar nuk u gjet.
          </p>
        )}
      </div>

      {/* Modal për shtim / përditësim */}
      {showForm && userRole === "admin" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[420px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-gray-800">
              {selected ? "Përditëso Anëtarin" : "Shto Anëtar të Ri"}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Emri"
                required
                value={formData.emri}
                onChange={(e) =>
                  setFormData({ ...formData, emri: e.target.value })
                }
                className="border rounded-md px-3 py-2"
              />

              <input
                type="text"
                placeholder="Mbiemri"
                required
                value={formData.mbiemri}
                onChange={(e) =>
                  setFormData({ ...formData, mbiemri: e.target.value })
                }
                className="border rounded-md px-3 py-2"
              />

              <select
                value={formData.gjinia}
                onChange={(e) =>
                  setFormData({ ...formData, gjinia: e.target.value })
                }
                className="border rounded-md px-3 py-2"
              >
                <option>Mashkull</option>
                <option>Femer</option>
              </select>

              <input
                type="date"
                value={formData.data_lindjes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, data_lindjes: e.target.value })
                }
                className="border rounded-md px-3 py-2"
              />

              <input
                type="text"
                placeholder="Telefoni"
                value={formData.telefoni}
                onChange={(e) =>
                  setFormData({ ...formData, telefoni: e.target.value })
                }
                className="border rounded-md px-3 py-2"
              />

              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="border rounded-md px-3 py-2"
              />

              <input
                type="text"
                placeholder="Adresa"
                value={formData.adresa}
                onChange={(e) =>
                  setFormData({ ...formData, adresa: e.target.value })
                }
                className="border rounded-md px-3 py-2"
              />

              <input
                type="text"
                placeholder="Qyteti"
                value={formData.qyteti}
                onChange={(e) =>
                  setFormData({ ...formData, qyteti: e.target.value })
                }
                className="border rounded-md px-3 py-2"
              />

              <select
                value={formData.statusi_martesor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    statusi_martesor: e.target.value,
                  })
                }
                className="border rounded-md px-3 py-2"
              >
                <option>Beqar</option>
                <option>Martuar</option>
                <option>I Ve</option>
                <option>E Ve</option>
              </select>

              <input
                type="text"
                placeholder="Roli në Kishë"
                value={formData.roli_kishes}
                onChange={(e) =>
                  setFormData({ ...formData, roli_kishes: e.target.value })
                }
                className="border rounded-md px-3 py-2"
              />

              {/* Seksioni shpirtëror */}
              <hr className="my-2 border-gray-300" />
              <h3 className="font-semibold text-gray-800 mt-2">
                🕊️ Të dhëna shpirtërore
              </h3>

              <input
                type="date"
                value={formData.salvation_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, salvation_date: e.target.value })
                }
                className="border rounded-md px-3 py-2"
              />

              <textarea
                placeholder="Dëshmia personale"
                value={formData.testimony || ""}
                onChange={(e) =>
                  setFormData({ ...formData, testimony: e.target.value })
                }
                className="border rounded-md px-3 py-2 min-h-[60px]"
              />

              <input
                type="date"
                value={formData.baptism_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, baptism_date: e.target.value })
                }
                className="border rounded-md px-3 py-2"
              />

              <input
                type="text"
                placeholder="Vendi i pagëzimit"
                value={formData.baptism_place || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    baptism_place: e.target.value,
                  })
                }
                className="border rounded-md px-3 py-2"
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.discip_school_completed}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discip_school_completed: e.target.checked,
                    })
                  }
                />
                <label>Ka përfunduar Shkollën e Dishepullizimit</label>
              </div>

              {formData.discip_school_completed && (
                <input
                  type="date"
                  value={formData.discip_school_date || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discip_school_date: e.target.value,
                    })
                  }
                  className="border rounded-md px-3 py-2"
                />
              )}

              <input
                type="text"
                placeholder="Shërbimet (ndarë me presje)"
                value={(formData.ministries || []).join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ministries: e.target.value
                      .split(",")
                      .map((m) => m.trim())
                      .filter(Boolean),
                  })
                }
                className="border rounded-md px-3 py-2"
              />

              <textarea
                placeholder="Shënime"
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="border rounded-md px-3 py-2 min-h-[60px]"
              />

              {/* Foto */}
              <div className="flex flex-col gap-2">
                <label className="font-medium text-sm text-gray-700">
                  Foto
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  className="border rounded-md px-3 py-2"
                />
                {formData.foto_url && (
                  <img
                    src={formData.foto_url}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover mt-2"
                  />
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 text-white py-2 rounded-md hover:bg-rose-700 transition"
                >
                  Ruaj
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelected(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition"
                >
                  Anulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

             
