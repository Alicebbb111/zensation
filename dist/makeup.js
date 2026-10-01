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
  let reacting = false;
  let saving = false;
  const saveButton = document.getElementById("save-look");
  let reactionTimer;
  const happyImage = new Image();
  happyImage.src = "assets/character-happy.png";
  function syncControls() {
    tray
      .querySelectorAll("button[data-part]")
      .forEach((button) => (button.disabled = !prepared || reacting || saving));
    tray.setAttribute("aria-busy", String(reacting));
    saveButton.disabled = reacting || saving;
    document
      .querySelectorAll(".game-steps li")
      .forEach((item) => item.removeAttribute("aria-current"));
    document
      .getElementById(
        saving ? "step-save" : prepared ? "step-makeup" : "step-prep",
      )
      .setAttribute("aria-current", "step");
  }
  function celebrate() {
    reacting = true;
    syncControls();
    svg.classList.add("is-happy");
    status.textContent = "ชอบลุคนี้จัง ♡";
    clearTimeout(reactionTimer);
    reactionTimer = setTimeout(() => {
      svg.classList.remove("is-happy");
      reactionTimer = setTimeout(() => {
        reacting = false;
        syncControls();
        status.textContent =
          "แต่งต่อได้เลย ลองสีอื่นหรือบันทึกลุคนี้ไว้ก็ได้ ♡";
      }, 550);
    }, 700);
  }
  const fashion = {
    hair: "original",
    outfit: "original",
    clip: "none",
    earrings: "none",
  };
  const hairAssets = {
    original: "assets/character-neutral.png",
    bob: "assets/character-bob.png",
    waves: "assets/character-waves.png",
  };
  const outfitAssets = {
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
    prepared = false;
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
      outfit: "original",
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
      pink: "#df7698",
      coral: "#dc8374",
      berry: "#a95270",
      nude: "#bd7778",
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
    red: "#bf4356",
    rose: "#ba657a",
    caramel: "#b47f65",
    plum: "#884d77",
  });
  tray.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-part]");
    if (!button || !prepared || reacting || saving) return;
    const { part, value } = button.dataset;
    if (part === "hair" || part === "outfit") {
      reacting = true;
      syncControls();
      status.textContent = "กำลังเปลี่ยนลุค…";
      try {
        const asset = part === "hair" ? hairAssets[value] : outfitAssets[value];
        const ready = new Image();
        ready.src = asset;
        await ready.decode();
        // A reset while loading must not restore an abandoned choice.
        if (!prepared) return;
        document
          .getElementById(part === "hair" ? "character-base" : "outfit-image")
          .setAttribute("href", asset);
        if (part === "outfit")
          document
            .getElementById("outfit-image")
            .setAttribute("opacity", value === "original" ? "0" : "1");
        fashion[part] = value;
      } catch (_) {
        status.textContent = "โหลดลุคไม่สำเร็จ ลองเลือกอีกครั้ง";
        reacting = false;
        syncControls();
        return;
      }
      reacting = false;
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
      document.getElementById("lip-layer").setAttribute("opacity", ".28");
      document
        .getElementById("happy-lip-layer")
        .setAttribute("fill", colors.lip[value]);
      document
        .getElementById("happy-lip-layer")
        .style.setProperty("--lip-opacity", ".28");
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
  saveButton.addEventListener("click", async () => {
    if (reacting || saving) return;
    saving = true;
    syncControls();
    saveButton.textContent = "SAVING…";
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
      const downloadUrl = URL.createObjectURL(png);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `zensation-my-look-${Date.now()}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
      status.textContent =
        "ส่งรูปให้ดาวน์โหลดแล้ว ดูได้ในรายการดาวน์โหลดของเบราว์เซอร์ ♡";
    } catch (error) {
      status.textContent = "ยังบันทึกรูปไม่ได้ กรุณาลองกดบันทึกอีกครั้ง";
    } finally {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      saving = false;
      saveButton.textContent = "SAVE YOUR LOOK ↓";
      syncControls();
    }
  });
  document.getElementById("reset-look").addEventListener("click", reset);
  syncControls();
})();
