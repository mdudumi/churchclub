// src/churches/KBBT/Worship/WorshipHome.jsx
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Filter,
  MonitorPlay,
  FileText,
  Music,
  Search,
  Plus,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import generatePowerpoint from "./utils/generatePowerpoint";
import generatePdf from "./utils/generatePdf";
import SongEditor from "./SongEditor";
import Select from "react-select";

export default function WorshipHome() {
  const navigate = useNavigate();
  const { churchSlug } = useParams();

  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [searchSong, setSearchSong] = useState("");
  const [pptCount, setPptCount] = useState(0);
  const [selectedList, setSelectedList] = useState([]);

  const [selectedSong, setSelectedSong] = useState(null);
  const [viewMode, setViewMode] = useState("lyrics");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [customFileName, setCustomFileName] = useState("");
  const [comboOpen, setComboOpen] = useState(false);
  const comboRef = useRef(null);

  const [userRole, setUserRole] = useState("viewer");
  const [loadingRole, setLoadingRole] = useState(true);

  // 🔹 Initialization
  useEffect(() => {
    const init = async () => {
      try {
        const { data: sessionUser } = await supabase.auth.getUser();
        const user = sessionUser?.user;
        if (!user) {
          toast.error("Nuk jeni i autentikuar.");
          navigate(`/${churchSlug || ""}`, { replace: true });
          return;
        }

        // 🔹 Get current church
        const { data: church, error: churchErr } = await supabase
          .from("churches")
          .select("id, slug")
          .eq("slug", churchSlug)
          .maybeSingle();
        if (churchErr) console.error(churchErr);
        if (!church) {
          toast.error(`Kisha '${churchSlug}' nuk u gjet.`);
          setUserRole("viewer");
          setLoadingRole(false);
          return;
        }

        // 🔹 Get service id (try both slugs)
        let { data: service, error: svcErr } = await supabase
          .from("services")
          .select("id, slug")
          .eq("slug", "worship")
          .maybeSingle();
        if (svcErr) console.error(svcErr);
        if (!service) {
          const res2 = await supabase
            .from("services")
            .select("id, slug")
            .eq("slug", "adhurimi")
            .maybeSingle();
          service = res2.data || null;
        }

        if (!service) {
          toast.error("Shërbimi 'worship/adhurimi' nuk u gjet.");
          setUserRole("viewer");
          setLoadingRole(false);
          return;
        }

        // 🔹 Debug logs (keep while testing)
        console.table({
          user_id: user.id,
          church_id: church.id,
          service_id: service.id,
          churchSlug,
          serviceSlug: service.slug,
        });

        // 🔹 Check membership role
        const { data: membership, error: memErr } = await supabase
          .from("service_memberships")
          .select("role")
          .eq("user_id", user.id)
          .eq("church_id", church.id)
          .eq("service_id", service.id)
          .maybeSingle();

        if (memErr) console.error(memErr);

        if (!membership) {
          console.warn("No service_memberships row found. Falling back to viewer.");
          toast("Nuk u gjet rol për këtë shërbim. Po vazhdojmë si vizitor.", {
            icon: "👀",
          });
        }

        setUserRole(membership?.role || "viewer");
      } catch (e) {
        console.error(e);
        toast.error("Gabim gjatë ngarkimit të rolit.");
        setUserRole("viewer");
      } finally {
        setLoadingRole(false);
        fetchSongs();
      }
    };
    init();
  }, [navigate, churchSlug]);

  // 🔹 Fetch songs for this church
  async function fetchSongs() {
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .eq("church_slug", churchSlug)
      .order("title");

    if (error) toast.error("Nuk mund të marrim këngët");
    else setSongs(data);
  }

  function openEditor(song = null) {
    if (userRole !== "admin") {
      toast.error("Vetëm administratorët mund të shtojnë ose ndryshojnë këngë.");
      return;
    }
    setCurrentSong(song);
    setIsEditorOpen(true);
  }

  // 🔹 Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (comboRef.current && !comboRef.current.contains(event.target)) {
        setComboOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.structure &&
        JSON.stringify(s.structure)
          .toLowerCase()
          .includes(search.toLowerCase()))
  );

  const filteredForShiko = filteredSongs.filter((s) =>
    s.title.toLowerCase().includes(searchSong.toLowerCase())
  );

  const clearSearch = () => setSearch("");

  if (loadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <p className="text-gray-700 font-medium">
          Duke ngarkuar të dhënat e rolit...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-100 to-rose-200 shadow">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-800">
          Adhurimi
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/${churchSlug}`)}
            className="flex items-center gap-2 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Kthehu</span>
          </button>

          {/* Hide 'Lutje' for viewers */}
          {userRole === "admin" && (
            <button
              onClick={() => navigate(`/${churchSlug}/worship/prayers`)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              🙏 Lutje
            </button>
          )}
        </div>
      </header>

      {/* Debug role banner */}
      <div className="mx-6 mt-3 text-xs text-gray-600">
        <span className="px-2 py-1 rounded bg-gray-100">
          Role: <strong>{userRole}</strong> | Church:{" "}
          <strong>{churchSlug}</strong>
        </span>
      </div>

      <main className="flex-1 px-6 pt-9 max-w-6xl mx-auto w-full flex flex-col gap-6">
        {/* 🔍 Kërko këngë */}
        <div className="bg-white shadow-md rounded-xl p-4 relative">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <Search size={18} /> Kërko këngë
          </h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Shkruaj titull ose tekst këngë..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded px-3 py-2 pr-10"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-2 text-gray-500 hover:text-red-600 transition"
                title="Fshi kërkimin"
              >
                <XCircle size={20} />
              </button>
            )}
          </div>

          {search && (
            <div className="mt-3 border rounded bg-gray-50 p-2 max-h-48 overflow-y-auto">
              {filteredSongs.length > 0 ? (
                filteredSongs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      setSelectedSong(song);
                      setSearchSong(song.title);
                      setSearch("");
                    }}
                    className="p-2 cursor-pointer hover:bg-gray-100 rounded"
                  >
                    {song.title}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 p-2">Asnjë këngë nuk u gjet</div>
              )}
            </div>
          )}
        </div>

        {/* 🎵 Shiko këngë */}
        <div className="bg-white shadow-md rounded-xl p-4" ref={comboRef}>
          <h2 className="font-semibold mb-2">Shiko këngë</h2>
          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Kërko ose zgjidh këngë..."
                value={searchSong}
                onFocus={() => setComboOpen(true)}
                onChange={(e) => {
                  setSearchSong(e.target.value);
                  setComboOpen(true);
                }}
                className="border rounded p-2 w-full"
              />
              {comboOpen && (
                <div className="absolute z-10 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-lg">
                  {filteredForShiko.length > 0 ? (
                    filteredForShiko.map((song) => (
                      <div
                        key={song.id}
                        onClick={() => {
                          setSelectedSong(song);
                          setSearchSong(song.title);
                          setComboOpen(false);
                        }}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {song.title}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500">
                      Asnjë këngë nuk u gjet
                    </div>
                  )}
                </div>
              )}
            </div>

            {userRole === "admin" && (
              <button
                onClick={() => openEditor(null)}
                className="flex items-center gap-1 bg-green-500 text-white px-3 py-2 rounded"
              >
                <Plus size={16} /> Shto
              </button>
            )}
          </div>

          {selectedSong && (
            <>
              <div className="mb-4 bg-gray-50 p-3 rounded border">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedSong.title}
                </h2>
                <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-4">
                  {selectedSong.style && <span>🎵 Stili: {selectedSong.style}</span>}
                  {selectedSong.tempo && <span>⏱️ Tempo: {selectedSong.tempo} bpm</span>}
                  {selectedSong.capo && <span>🎸 Capo: {selectedSong.capo}</span>}
                  {selectedSong.ritmi && <span>🥁 Ritmi: {selectedSong.ritmi}</span>}
                </div>
              </div>

              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setViewMode("lyrics")}
                  className={`px-3 py-1 rounded ${
                    viewMode === "lyrics"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  <FileText size={14} className="inline mr-1" />
                  Tekst
                </button>
                <button
                  onClick={() => setViewMode("chords")}
                  className={`px-3 py-1 rounded ${
                    viewMode === "chords"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  <Music size={14} className="inline mr-1" />
                  Akorde
                </button>
              </div>

              <div className="bg-gray-100 p-4 rounded space-y-4">
                {(selectedSong.structureOrder ||
                  Object.keys(selectedSong.structure || {})).map(
                  (section, idx) => {
                    const data = selectedSong.structure[section];
                    if (!data) return null;
                    return viewMode === "lyrics" ? (
                      <div key={idx} className="border-b pb-3">
                        <h3 className="text-lg font-bold text-rose-600 mb-1">
                          {section}
                        </h3>
                        <p className="whitespace-pre-wrap font-medium text-gray-800">
                          {data.lyrics || "Nuk ka tekst për këtë seksion."}
                        </p>
                      </div>
                    ) : (
                      <div key={idx} className="border-b pb-3">
                        <h3 className="text-lg font-bold text-indigo-600 mb-1">
                          {section}
                        </h3>
                        <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                          {data.chords || "Nuk ka akorde për këtë seksion."}
                        </pre>
                      </div>
                    );
                  }
                )}
              </div>
            </>
          )}
        </div>

        {/* PowerPoint/PDF Builder (Admin only) */}
        {userRole === "admin" && (
          <div className="bg-white shadow-md rounded-xl p-4">
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <Filter size={18} /> PowerPoint & PDF Builder
            </h2>

            <label className="block mb-3">
              Sa këngë do për PPT/PDF?
              <input
                type="number"
                min="1"
                max={filteredSongs.length}
                value={pptCount}
                onChange={(e) => {
                  setPptCount(Number(e.target.value));
                  setSelectedList([]);
                }}
                className="ml-2 border rounded p-1 w-20"
              />
            </label>

            <input
              type="text"
              placeholder="Shkruaj emrin e file-it (opsional)"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              className="border rounded px-3 py-2 mb-3 w-full"
            />

            <Select
              isMulti
              options={filteredSongs.map((s) => ({
                value: s.id,
                label: s.title,
              }))}
              onChange={(selected) =>
                setSelectedList(
                  selected.map((sel) =>
                    filteredSongs.find((s) => s.id === sel.value)
                  )
                )
              }
              value={selectedList.map((s) => ({
                value: s.id,
                label: s.title,
              }))}
              placeholder="Kërko dhe zgjidh këngë..."
              className="mb-4"
            />

            <div className="flex gap-3 mt-4">
              <button
                disabled={pptCount === 0 || selectedList.length !== pptCount}
                onClick={() => generatePowerpoint(selectedList, customFileName)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                <MonitorPlay size={18} /> Gjenero PowerPoint
              </button>

              <button
                disabled={pptCount === 0 || selectedList.length !== pptCount}
                onClick={() => generatePdf(selectedList, customFileName)}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                📄 Gjenero PDF (akorde)
              </button>
            </div>
          </div>
        )}
      </main>

      <SongEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        song={currentSong}
        refreshSongs={fetchSongs}
        userRole={userRole}
      />
    </div>
  );
}
