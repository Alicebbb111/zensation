(() => {
  const apply = document.getElementById("apply-gel");
  const tray = document.getElementById("makeup-tray");
  const status = document.getElementById("game-status");
  const blemishes = document.getElementById("blemishes");
  const label = document.getElementById("stage-label");
  const svg = document.getElementById("face-art");
  const defaultBrows = [
    "M444 165 Q465 153 491 165",
    "M529 165 Q550 154 573 166",
  ];
  let prepared = false;
  let finished = false;
  let lookBlob = null;
  let resultUrl = null;
  let generation = 0;
  const pending = new Set();
  const revisions = {};
  const result = document.getElementById("look-result");
  const shell = document.querySelector(".game-shell");
  const finishButton = document.getElementById("finish-look");
  const resultStatus = document.getElementById("result-status");
  let reacting = false;
  let saving = false;
  const saveButton = document.getElementById("save-look");
  let reactionTimer;
  const happyImage = new Image();
  happyImage.src = "assets/character-happy.png";
  function syncControls() {
    tray
      .querySelectorAll("button[data-part]")
      .forEach((button) => (button.disabled = !prepared || saving));
    tray.setAttribute("aria-busy", String(reacting));
    saveButton.disabled = saving;
    finishButton.disabled = !prepared || saving || pending.size > 0;
    document
      .querySelectorAll(".game-steps li")
      .forEach((item) => item.removeAttribute("aria-current"));
    document
      .getElementById(
        finished ? "step-save" : prepared ? "step-makeup" : "step-prep",
      )
      .setAttribute("aria-current", "step");
  }
  function celebrate() {
    syncControls();
    status.textContent = "เลือกสีหรือสไตล์ต่อได้เลย พร้อมแล้วกด FINISH MY LOOK";
  }
  const fashion = {
    hair: "original",
    outfit: "tank",
    clip: "none",
    earrings: "none",
  };
  const hairAssets = {
    original: "assets/character-neutral.png",
    bob: "assets/character-bob.png",
    waves: "assets/character-waves.png",
  };
  const outfitAssets = {
    tank: "assets/character-tank.png",
    original: "assets/character-neutral.png",
    blazer: "assets/character-blazer.png",
    satin: "assets/character-satin.png",
  };
  const earrings = {
    none: "",
    pearl:
      '<g fill="#fff4dd" stroke="#bd9149" stroke-width="1"><circle cx="421" cy="222" r="5"/><circle cx="602" cy="222" r="5"/></g>',
    hoops:
      '<g fill="none" stroke="url(#gold-metal)" stroke-width="3"><ellipse cx="421" cy="232" rx="7" ry="12"/><ellipse cx="602" cy="232" rx="7" ry="12"/></g>',
    stars:
      '<g fill="url(#gold-metal)" stroke="#a67b3c" stroke-width=".7"><path d="M421 220v12m181-12v12"/><path d="M421 231l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z M602 231l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></g>',
  };
  const clips = {
    none: "",
    pearls:
      '<g transform="rotate(27 595 144)" fill="#fff6e5" stroke="#c9ad80" stroke-width="1"><rect x="572" y="140" width="43" height="7" rx="3" fill="#c9ad80"/><circle cx="576" cy="143" r="4"/><circle cx="584" cy="143" r="4"/><circle cx="592" cy="143" r="4"/><circle cx="600" cy="143" r="4"/><circle cx="608" cy="143" r="4"/></g>',
    star: '<path d="M593 120l5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1Z" fill="url(#gold-metal)" stroke="#a9864c" stroke-width="1.3"/>',
    bow: '<g transform="rotate(20 597 140)" fill="#df8eac" stroke="#ac5b7c" stroke-width="1.2"><path d="M597 139 Q566 115 572 142 Q571 159 597 142 Q624 159 624 140 Q624 116 597 139Z"/><path d="M591 143l-7 20 12-5 6 7 1-22"/><ellipse cx="598" cy="140" rx="5" ry="7" fill="#f1b6ca"/></g>',
  };
  tray.querySelectorAll("[data-tab]").forEach((tab) =>
    tab.addEventListener("click", () => {
      tray
        .querySelectorAll("[data-tab]")
        .forEach((item) =>
          item.setAttribute("aria-selected", String(item === tab)),
        );
      document.getElementById("makeup-panel").hidden =
        tab.dataset.tab !== "makeup";
      document.getElementById("style-panel").hidden =
        tab.dataset.tab !== "style";
    }),
  );
  function reset() {
    generation++;
    prepared = false;
    finished = false;
    result.hidden = true;
    shell.hidden = false;
    lookBlob = null;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    document.getElementById("result-portrait").replaceChildren();
    document.getElementById("tank-image").setAttribute("opacity", "1");
    document.getElementById("hair-color-image").setAttribute("opacity", "0");
    reacting = false;
    clearTimeout(reactionTimer);
    svg.classList.remove("is-happy");
    syncControls();
    tray.setAttribute("aria-disabled", "true");
    document.getElementById("tray-locked").hidden = false;
    blemishes.style.opacity = ".76";
    document.getElementById("blush-layer").setAttribute("opacity", "0");
    document.getElementById("shadow-layer").setAttribute("opacity", "0");
    document.getElementById("brows-layer").setAttribute("fill", "#71514e");

    document.getElementById("lip-layer").setAttribute("opacity", "0");
    document
      .getElementById("happy-lip-layer")
      .style.setProperty("--lip-opacity", "0");
    document.getElementById("brows-layer").setAttribute("opacity", "0");
    tray
      .querySelectorAll("button[data-part]")
      .forEach((button) => button.classList.remove("active"));
    Object.assign(fashion, {
      hair: "original",
      outfit: "tank",
      clip: "none",
      earrings: "none",
    });
    document
      .getElementById("character-base")
      .setAttribute("href", hairAssets.original);
    document.getElementById("outfit-image").setAttribute("opacity", "0");
    document.getElementById("clips-layer").replaceChildren();
    document.getElementById("earrings-layer").replaceChildren();
    tray
      .querySelectorAll("[data-part]")
      .forEach((item) => item.setAttribute("aria-pressed", "false"));
    document
      .getElementById("hair-color-image")
      .setAttribute("href", hairAssets.original);
    document
      .getElementById("hair-mask-image")
      .setAttribute("href", hairAssets.original);
    for (const [part, value] of Object.entries({
      ...fashion,
      hairColor: "original",
    })) {
      const choice = tray.querySelector(
        `button[data-part="${part}"][data-value="${value}"]`,
      );
      if (choice) {
        choice.classList.add("active");
        choice.setAttribute("aria-pressed", "true");
      }
    }
    label.textContent = "BARE FACE / 00";
    status.textContent = "แตะ “APPLY ZENSATION” เพื่อเริ่มเล่น ✦";
    apply.disabled = false;
    apply.querySelector("strong").textContent = "APPLY ZENSATION";
  }
  apply.addEventListener("click", () => {
    if (prepared) return;
    prepared = true;
    tray.setAttribute("aria-disabled", "false");
    document.getElementById("tray-locked").hidden = true;
    blemishes.style.opacity = ".15";
    svg.parentElement.classList.remove("gel-applied");
    void svg.parentElement.offsetWidth;
    svg.parentElement.classList.add("gel-applied");
    label.textContent = "SKIN PREPPED / 01";
    status.textContent = "พร้อมแล้ว! เลือกเมคอัพที่ชอบได้เลย ✦";
    apply.disabled = true;
    apply.querySelector("strong").textContent = "SKIN PREPPED ✓";
    celebrate();
  });
  const colors = {
    blush: { pink: "#e7829d", peach: "#ed9c82", rose: "#c76e86" },
    shadow: { rose: "#c59ba9", peach: "#e6ae8a", mauve: "#9d86aa" },
    lip: {
      pink: "#ee4e99",
      coral: "#f0713e",
      berry: "#8f234f",
      nude: "#c58e78",
    },
    brows: { soft: "#71514e", defined: "#3e2b33", light: "#a78371" },
  };
  Object.assign(colors.blush, {
    apricot: "#e9a369",
    mauve: "#b883a0",
    berry: "#ac5675",
  });
  Object.assign(colors.shadow, {
    cocoa: "#9b7763",
    champagne: "#d7bb8f",
    sage: "#93aa8d",
    blue: "#8ca5c8",
  });
  Object.assign(colors.lip, {
    red: "#c51630",
    rose: "#b95575",
    caramel: "#975b32",
    plum: "#622876",
  });
  tray.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-part]");
    if (!button || !prepared || saving) return;
    const { part, value } = button.dataset;
    if (part === "hair" || part === "outfit") {
      const ticket = (revisions[part] = (revisions[part] || 0) + 1);
      const epoch = generation;
      pending.add(part);
      syncControls();
      status.textContent = "กำลังเปลี่ยนลุค…";
      try {
        const asset = part === "hair" ? hairAssets[value] : outfitAssets[value];
        const ready = new Image();
        ready.src = asset;
        await ready.decode();
        // A reset while loading must not restore an abandoned choice.
        if (!prepared || epoch !== generation || revisions[part] !== ticket)
          return;
        document
          .getElementById(part === "hair" ? "character-base" : "outfit-image")
          .setAttribute("href", asset);
        if (part === "outfit")
          document.getElementById("outfit-image").setAttribute("opacity", "1");
        if (part === "outfit")
          document
            .getElementById("tank-image")
            .setAttribute("opacity", value === "tank" ? "1" : "0");
        if (part === "hair") {
          document
            .getElementById("hair-color-image")
            .setAttribute("href", asset);
          document
            .getElementById("hair-mask-image")
            .setAttribute("href", asset);
        }
        fashion[part] = value;
      } catch (_) {
        status.textContent = "โหลดลุคไม่สำเร็จ ลองเลือกอีกครั้ง";
        reacting = false;
        syncControls();
        return;
      } finally {
        if (revisions[part] === ticket) pending.delete(part);
        syncControls();
      }
    } else if (part === "hairColor") {
      const tint = {
        espresso: [0.55, 0.35, 0.25],
        copper: [1.7, 0.8, 0.35],
        blonde: [2.2, 1.65, 0.9],
        rose: [1.6, 0.75, 1.25],
        blue: [0.6, 1.05, 1.6],
        original: [1, 1, 1],
      }[value];
      ["R", "G", "B"].forEach((c, i) =>
        document
          .querySelector(`#hair-tint feFunc${c}`)
          .setAttribute("slope", tint[i]),
      );
      document
        .getElementById("hair-color-image")
        .setAttribute("opacity", value === "original" ? "0" : "1");
    } else if (part === "clip" || part === "earrings") {
      document.getElementById(
        part === "clip" ? "clips-layer" : "earrings-layer",
      ).innerHTML = (part === "clip" ? clips : earrings)[value];
      fashion[part] = value;
    }
    tray
      .querySelectorAll(`button[data-part="${part}"]`)
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
    tray
      .querySelectorAll(`button[data-part="${part}"]`)
      .forEach((item) => item.classList.toggle("active", item === button));
    if (part === "blush" || part === "shadow") {
      const layer = document.getElementById(`${part}-layer`);
      layer.setAttribute(
        "opacity",
        value === "none" ? "0" : part === "blush" ? ".28" : ".3",
      );
      if (colors[part][value])
        layer
          .querySelectorAll("ellipse")
          .forEach((shape) => shape.setAttribute("fill", colors[part][value]));
    } else if (part === "lip") {
      document
        .getElementById("lip-layer")
        .setAttribute("fill", colors.lip[value]);
      document.getElementById("lip-layer").setAttribute("opacity", ".78");
      document
        .getElementById("happy-lip-layer")
        .setAttribute("fill", colors.lip[value]);
      document
        .getElementById("happy-lip-layer")
        .style.setProperty("--lip-opacity", ".78");
    } else if (part === "brows") {
      const brows = document.getElementById("brows-layer");
      brows.setAttribute("fill", colors.brows[value]);
      brows.setAttribute(
        "opacity",
        value === "defined" ? ".38" : value === "light" ? ".16" : ".24",
      );
    }
    label.textContent = "YOUR LOOK / ✦";
    celebrate();
  });
  async function exportLook() {
    let sourceUrl;
    try {
      const snapshot = svg.cloneNode(true);
      snapshot.removeAttribute("class");
      snapshot.setAttribute("width", "880");
      snapshot.setAttribute("height", "1118");
      // Freeze the visible makeup layers before any asynchronous work.
      const originals = svg.querySelectorAll("*");
      snapshot.querySelectorAll("*").forEach((element, index) => {
        const style = getComputedStyle(originals[index]);
        for (const property of [
          "opacity",
          "fill",
          "stroke",
          "stroke-width",
          "mix-blend-mode",
        ]) {
          element.style.setProperty(property, style.getPropertyValue(property));
        }
        element.style.setProperty("transition", "none");
        element.style.setProperty("animation", "none");
      });
      snapshot.querySelector("#happy-face").remove();
      snapshot.querySelector("#happy-lip-layer").remove();
      for (const image of snapshot.querySelectorAll("image")) {
        const response = await fetch(image.getAttribute("href"));
        if (!response.ok) throw new Error("Image unavailable");
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          response.blob().then((blob) => reader.readAsDataURL(blob), reject);
        });
        image.setAttribute("href", dataUrl);
      }
      sourceUrl = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(snapshot)], {
          type: "image/svg+xml;charset=utf-8",
        }),
      );
      const rendered = new Image();
      rendered.src = sourceUrl;
      await rendered.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 880;
      canvas.height = 1182;
      const context = canvas.getContext("2d");
      context.fillStyle = "#f9f4e4";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(rendered, 0, 0);
      context.fillStyle = "#fffaf8";
      context.fillRect(0, 1118, 880, 64);
      context.fillStyle = "#164b3c";
      context.font = "600 20px Georgia, serif";
      context.fillText("ZENSATION", 26, 1158);
      context.font = "16px Georgia, serif";
      context.textAlign = "right";
      context.fillText("Confidence. No Compromises.", 854, 1158);
      const png = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!png) throw new Error("Export failed");
      return png;
    } finally {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    }
  }
  function downloadLook() {
    if (!lookBlob) return;
    const url = URL.createObjectURL(lookBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "zensation-my-look.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    resultStatus.textContent = "ส่งรูปไปยังรายการดาวน์โหลดแล้ว ♡";
  }
  finishButton.addEventListener("click", async () => {
    if (!prepared || saving || pending.size) return;
    saving = true;
    syncControls();
    finishButton.textContent = "CREATING YOUR LOOK…";
    try {
      lookBlob = await exportLook();
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      resultUrl = URL.createObjectURL(lookBlob);
      const preview = new Image();
      preview.alt = "ลุคที่คุณแต่งเสร็จแล้ว";
      preview.src = resultUrl;
      await preview.decode();
      document.getElementById("result-portrait").replaceChildren(preview);
      finished = true;
      shell.hidden = true;
      result.hidden = false;
      resultStatus.textContent = "";
      document.getElementById("result-title").focus();
      result.scrollIntoView({ block: "start", behavior: "instant" });
    } catch (_) {
      status.textContent =
        "สร้างรูปไม่สำเร็จ ลองกด FINISH อีกครั้ง ลุคของคุณยังอยู่ครบ";
    } finally {
      saving = false;
      finishButton.textContent = "FINISH MY LOOK →";
      syncControls();
    }
  });
  saveButton.addEventListener("click", downloadLook);
  document.getElementById("share-look").addEventListener("click", async () => {
    if (!lookBlob) return;
    const file = new File([lookBlob], "zensation-my-look.png", {
      type: "image/png",
    });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Zensation look" });
      } else {
        downloadLook();
        resultStatus.textContent =
          "เบราว์เซอร์นี้ยังแชร์รูปโดยตรงไม่ได้ บันทึกรูปแล้วส่งให้เพื่อนได้เลย";
      }
    } catch (error) {
      if (error.name !== "AbortError")
        resultStatus.textContent =
          "แชร์ไม่สำเร็จ กด SAVE YOUR LOOK เพื่อบันทึกรูปแทนได้";
    }
  });
  document.getElementById("edit-look").addEventListener("click", () => {
    finished = false;
    result.hidden = true;
    shell.hidden = false;
    syncControls();
    finishButton.focus();
  });
  document.getElementById("reset-look").addEventListener("click", () => {
    reset();
    apply.focus();
  });
  reset();
})();
