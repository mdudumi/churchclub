// src/churches/KBBT/Worship/utils/generatePowerpoint.js
import PptxGenJS from "pptxgenjs";

export default function generatePowerpoint(songs, customName) {
  if (!songs || songs.length === 0) {
    alert("Zgjidh të paktën një këngë");
    return;
  }

  const pptx = new PptxGenJS();

  songs.forEach((song) => {
    // Slide i titullit (top-center)
    let titleSlide = pptx.addSlide();
    titleSlide.background = { fill: "000000" };
    titleSlide.addText(song.title || "Pa Titull", {
      x: 0.5,
      y: 0.7,
      w: "90%",
      h: 1.5,
      fontSize: 44,
      bold: true,
      color: "FFFFFF",
      align: "center",
      valign: "top",
    });

    // ✅ Seksionet sipas rendit (structureOrder ose fallback)
    (song.structureOrder || Object.keys(song.structure || {})).forEach(
      (section) => {
        const data = song.structure[section];
        if (!data || !data.lyrics) return;

        let slide = pptx.addSlide();
        slide.background = { fill: "000000" };
        slide.addText(data.lyrics, {
          x: 0.5,
          y: 0.7,
          w: "90%",
          h: "80%",
          fontSize: 34,
          bold: true,
          color: "FFFFFF",
          align: "center",
          valign: "top",
        });
      }
    );
  });

  // ⚡ Emri i file-it
  let fileName = "Kenge_Adhurimi.pptx";
  if (customName && customName.trim() !== "") {
    fileName = customName.trim().replace(/\s+/g, "_") + ".pptx";
  } else if (songs.length === 1) {
    fileName = songs[0].title.replace(/\s+/g, "_") + ".pptx";
  }

  pptx.writeFile({ fileName });
}
