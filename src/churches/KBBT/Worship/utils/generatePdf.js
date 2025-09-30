// src/churches/KBBT/Worship/utils/generatePdf.js
import pdfMake from "pdfmake/build/pdfmake";
import "pdfmake/build/vfs_fonts";

// helper: Proper Case
function toProperCase(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export default function generatePdf(songs, customName) {
  if (!songs || songs.length === 0) {
    alert("Zgjidh të paktën një këngë");
    return;
  }

  const content = [];

  songs.forEach((song, idx) => {
    // Titulli
    content.push({
      text: song.title || "Pa Titull",
      style: "title",
      margin: [0, 15, 0, 5],
      colSpan: 2, // gjithmonë mbi kolonat
    });

    // Metadata
    let meta = [];
    if (song.style) meta.push(`Stili: ${song.style}`);
    if (song.tempo) meta.push(`Tempo: ${song.tempo} bpm`);
    if (song.capo) meta.push(`Capo: ${song.capo}`);
    if (song.ritmi) meta.push(`Ritmi: ${song.ritmi}`);

    if (meta.length > 0) {
      content.push({
        text: meta.join("   •   "),
        style: "meta",
        margin: [0, 0, 0, 10],
        colSpan: 2,
      });
    }

    // ✅ Seksionet me dy kolona
    const sectionBlocks = [];
    (song.structureOrder || Object.keys(song.structure || {})).forEach(
      (section) => {
        const data = song.structure[section];
        if (!data || !data.chords) return;

        sectionBlocks.push(
          { text: toProperCase(section), style: "section", margin: [0, 10, 0, 3] },
          {
            text: data.chords,
            style: "chords",
            margin: [0, 0, 0, 10],
            preserveLeadingSpaces: true,
          }
        );
      }
    );

    // shtojmë blloqet si dy kolona që rrjedhin
    if (sectionBlocks.length > 0) {
      content.push({
        columns: [
          { stack: sectionBlocks, width: "50%" },
          { stack: [], width: "50%" }, // pdfMake e mbush vetë kolonën e dytë kur e para mbaron
        ],
        columnGap: 20,
      });
    }

    // Page break në fund të çdo kënge (jo brenda kolonave)
    if (idx < songs.length - 1) {
      content.push({ text: "", pageBreak: "after" });
    }
  });

  const docDefinition = {
    content,
    styles: {
      title: { fontSize: 28, bold: true, alignment: "Left" },
      meta: { fontSize: 12, italics: true, alignment: "left" },
      section: { fontSize: 20, bold: true, color: "#c0392b" },
      chords: { fontSize: 20, bold: true, margin: [0, 0, 0, 6] },
    },
    defaultStyle: { font: "Roboto" },
    pageMargins: [40, 60, 40, 60],
  };

  // Emri i file-it
  let fileName = "Kenge_Adhurimi.pdf";
  if (customName && customName.trim() !== "") {
    fileName = customName.trim().replace(/\s+/g, "_") + ".pdf";
  } else if (songs.length === 1) {
    fileName = songs[0].title.replace(/\s+/g, "_") + ".pdf";
  }

  pdfMake.createPdf(docDefinition).download(fileName);
}
