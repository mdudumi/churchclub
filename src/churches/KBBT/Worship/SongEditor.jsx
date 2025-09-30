// src/churches/KBBT/Worship/components/SongEditor.jsx
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

const ELEMENTS = ["intro", "strofë", "pararefren", "refren", "bridge", "outro"];

// lista e stileve të zakonshme muzikore
const STYLES = [
  "Worship",
  "Baladë",
  "Pop",
  "Rock",
  "Jazz",
  "Gospel",
  "Classical",
  "Reggae",
  "Hip-Hop",
  "Country",
  "Folk",
  "R&B",
  "Metal",
  "Latin",
  "Electronic",
  "Allegro",
  "Adagio",
  "Moderato",
  "Andante",
];

export default function SongEditor({ isOpen, onClose, song, refreshSongs }) {
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState("");
  const [tempo, setTempo] = useState("");
  const [capo, setCapo] = useState("");
  const [ritmi, setRitmi] = useState("");
  const [structure, setStructure] = useState({});
  const [structureOrder, setStructureOrder] = useState([]);

  useEffect(() => {
    if (song) {
      setTitle(song.title || "");
      setStyle(song.style || "");
      setTempo(song.tempo || "");
      setCapo(song.capo || "");
      setRitmi(song.ritmi || "");
      setStructure(song.structure || {});
      setStructureOrder(song.structureOrder || Object.keys(song.structure || {}));
    } else {
      setTitle("");
      setStyle("");
      setTempo("");
      setCapo("");
      setRitmi("");
      setStructure({});
      setStructureOrder([]);
    }
  }, [song]);

  function addSection(type) {
    const count = Object.keys(structure).filter((k) => k.startsWith(type)).length;
    const key = count === 0 ? type : `${type}${count + 1}`;
    setStructure({
      ...structure,
      [key]: { lyrics: "", chords: "" },
    });
    setStructureOrder([...structureOrder, key]);
  }

  function removeSection(key) {
    const newStruct = { ...structure };
    delete newStruct[key];
    setStructure(newStruct);
    setStructureOrder(structureOrder.filter((k) => k !== key));
  }

  function updateSection(key, field, value) {
    setStructure({
      ...structure,
      [key]: { ...structure[key], [field]: value },
    });
  }

  function moveSection(key, direction) {
    const index = structureOrder.indexOf(key);
    if (index < 0) return;
    const newOrder = [...structureOrder];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newOrder.length) return;
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setStructureOrder(newOrder);
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Vendos titullin e këngës!");
      return;
    }

    const { error } = await supabase
      .from("songs")
      .upsert({
        id: song?.id,
        title: title.trim(),
        style: style.trim(),
        tempo: tempo.trim(),
        capo: capo.trim(),
        ritmi: ritmi.trim(),
        structure,
        structureOrder, // ✅ save order too
        church_slug: "kbbt",
      });

    if (error) {
      toast.error("Nuk u ruajt kënga");
    } else {
      toast.success("Kënga u ruajt");
      refreshSongs();
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl space-y-4 overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">
          {song ? "Edito këngën" : "Shto këngë"}
        </h2>

        {/* Titulli */}
        <div>
          <label className="block font-semibold mb-1">Titulli i këngës</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Shkruaj titullin..."
            className="w-full border rounded p-2"
          />
        </div>

        {/* Stili / Tempo / Capo / Ritmi */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block font-semibold mb-1">Stili</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">-- Zgjidh stilin --</option>
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Tempo (BPM)</label>
            <input
              type="number"
              value={tempo}
              onChange={(e) => setTempo(e.target.value)}
              placeholder="72"
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Capo</label>
            <input
              type="text"
              value={capo}
              onChange={(e) => setCapo(e.target.value)}
              placeholder="No Capo / 2"
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Ritmi</label>
            <input
              type="text"
              value={ritmi}
              onChange={(e) => setRitmi(e.target.value)}
              placeholder="4/4, 3/4, 6/8"
              className="w-full border rounded p-2"
            />
          </div>
        </div>

        {/* Butona për të shtuar seksione */}
        <div className="flex flex-wrap gap-2 mb-4">
          {ELEMENTS.map((el) => (
            <button
              key={el}
              onClick={() => addSection(el)}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              + {el}
            </button>
          ))}
        </div>

        {/* Fushat për çdo seksion */}
        {structureOrder.map((key) => {
          const data = structure[key];
          if (!data) return null;
          return (
            <div key={key} className="border rounded p-3 space-y-2 relative">
              <h3 className="font-bold text-rose-600 capitalize">{key}</h3>
              <textarea
                placeholder="Teksti..."
                className="w-full border rounded p-2"
                value={data.lyrics}
                onChange={(e) => updateSection(key, "lyrics", e.target.value)}
              />
              <textarea
                placeholder="Akordet..."
                className="w-full border rounded p-2 font-mono text-sm"
                value={data.chords}
                onChange={(e) => updateSection(key, "chords", e.target.value)}
              />
              <div className="flex gap-2 absolute top-2 right-2">
                <button
                  onClick={() => moveSection(key, -1)}
                  className="bg-gray-300 text-xs px-2 py-1 rounded"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveSection(key, 1)}
                  className="bg-gray-300 text-xs px-2 py-1 rounded"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeSection(key)}
                  className="bg-red-500 text-white text-xs px-2 py-1 rounded"
                >
                  Fshi
                </button>
              </div>
            </div>
          );
        })}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Anulo
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Ruaj
          </button>
        </div>
      </div>
    </div>
  );
}
