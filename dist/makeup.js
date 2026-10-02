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
    document.getElementById("surprise-look").disabled =
      !prepared || saving || pending.size > 0;
    finishButton.disabled = !prepared || saving || pending.size > 0;
    document
      .querySelectorAll(".game-steps li")
      .forEach((item) => item.removeAttribute("aria-current"));
    document
      .getElementById(
        finished ? "step-save" : prepared ? "step-makeup" : "step-prep",
      )
      .setAttribute("aria-current", "step");
    syncWardrobe();
  }
  function celebrate() {
    clearTimeout(reactionTimer);
    svg.classList.add("is-happy");
    reactionTimer = setTimeout(() => svg.classList.remove("is-happy"), 480);
    syncControls();
    status.textContent = "เลือกสีหรือสไตล์ต่อได้เลย พร้อมแล้วกด FINISH MY LOOK";
  }
  // Skin grading is shared by the portrait, expression, wardrobe and PNG export.
  const characters = [
    {
      id: "amara",
      name: "Amara",
      tone: "Deep",
      color: "#784630",
      slopes: [0.52, 0.43, 0.37],
      offsets: [0.015, 0.005, 0],
    },
    {
      id: "nia",
      name: "Nia",
      tone: "Rich",
      color: "#a56645",
      slopes: [0.67, 0.57, 0.48],
      offsets: [0.025, 0.01, 0],
    },
    {
      id: "maya",
      name: "Maya",
      tone: "Golden",
      color: "#c28b60",
      slopes: [0.82, 0.76, 0.65],
      offsets: [0.02, 0.01, 0],
    },
    {
      id: "lina",
      name: "Lina",
      tone: "Honey",
      color: "#deac86",
      slopes: [0.93, 0.92, 0.83],
      offsets: [0.015, 0.01, 0.005],
    },
    {
      id: "original",
      name: "Zen",
      tone: "Original",
      color: "#efb69f",
      slopes: [1, 1, 1],
      offsets: [0, 0, 0],
    },
    {
      id: "iris",
      name: "Iris",
      tone: "Fair",
      color: "#f7d5c3",
      slopes: [0.88, 0.9, 0.93],
      offsets: [0.12, 0.12, 0.12],
    },
  ];
  let character = "original";
  const characterOptions = document.querySelector(".character-options");
  characterOptions.innerHTML = characters
    .map(
      (c) =>
        `<button type="button" data-character="${c.id}" aria-pressed="${c.id === character}" aria-label="โทนผิว ${c.tone}" style="--skin-swatch:${c.color}"><span class="character-swatch" aria-hidden="true"></span><small>${c.tone}</small></button>`,
    )
    .join("");
  function setCharacter(id) {
    const selected = characters.find((c) => c.id === id);
    if (!selected) return;
    character = id;
    ["R", "G", "B"].forEach((channel, i) => {
      const fn = document.querySelector(`#skin-tint feFunc${channel}`);
      fn.setAttribute("slope", selected.slopes[i]);
      fn.setAttribute("intercept", selected.offsets[i]);
    });
    ["skin-color-layer", "happy-skin"].forEach((id) =>
      document
        .getElementById(id)
        .setAttribute("opacity", character === "original" ? "0" : "1"),
    );
    characterOptions
      .querySelectorAll("button")
      .forEach((b) =>
        b.setAttribute("aria-pressed", b.dataset.character === character),
      );
    svg.setAttribute("aria-label", `ตัวละครโทนผิว ${selected.tone}`);
  }
  characterOptions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-character]");
    if (!button || saving || finished) return;
    setCharacter(button.dataset.character);
    if (prepared) celebrate();
  });
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
  const tankAssets = {
    original: "assets/character-tank.png",
    bob: "assets/character-tank-bob.png",
    waves: "assets/character-tank-waves.png",
  };
  function syncCharacter() {
    const source =
      fashion.outfit === "tank" ||
      ["offshoulder", "corset", "slip"].includes(fashion.outfit)
        ? tankAssets[fashion.hair]
        : hairAssets[fashion.hair];
    for (const id of [
      "character-base",
      "hair-color-image",
      "hair-mask-image",
      "hair-natural-image",
    ])
      document.getElementById(id).setAttribute("href", source);
    document.getElementById("tank-image").setAttribute("opacity", "0");
    document
      .getElementById("outfit-image")
      .setAttribute("opacity", fashion.outfit === "tank" ? "0" : "1");
    syncWardrobe();
  }
  const outfitAssets = {
    tank: "assets/character-tank.png",
    original: "assets/character-neutral.png",
    blazer: "assets/character-blazer.png",
    satin: "assets/character-satin.png",
    offshoulder: "assets/character-offshoulder.png",
    corset: "assets/character-corset.png",
    slip: "assets/character-slip.png",
  };
  const wardrobe = {
    color: "ivory",
    finish: "satin",
    outer: "none",
    necklace: "none",
    extras: "none",
  };
  const garmentColors = {
    ivory: [1, 1, 1],
    black: [0.16, 0.17, 0.19],
    pink: [0.94, 0.55, 0.66],
    wine: [0.45, 0.12, 0.22],
    sage: [0.47, 0.61, 0.51],
  };
  const garmentPaths = {
    tank: "M418 348L431 346L428 413Q426 456 511 479Q595 459 595 413L594 346L607 348L615 412Q647 464 637 510L643 559H380L382 509Q376 461 404 412Z",
    offshoulder:
      "M316 437Q313 431 323 433Q393 438 511 477Q631 438 697 433Q707 430 705 444L702 457Q710 469 704 483L706 503L639 481L637 559H383L383 481L316 504Q311 494 315 478L313 464Q315 452 316 437Z",
    corset:
      "M378 462Q411 420 469 463L511 492Q584 426 623 448L643 471L631 559H382Z",
    slip: "M410 350L401 419Q453 468 511 500Q580 468 614 419L606 350L615 351L625 427L640 490L638 559H377L381 460L405 350Z",
  };
  function syncWardrobe() {
    const custom = ["offshoulder", "corset", "slip"].includes(fashion.outfit);
    document
      .getElementById("outfit-image")
      .setAttribute(
        "clip-path",
        custom ? "url(#wardrobe-body)" : "url(#outfit-clip)",
      );
    const supported = fashion.outfit in garmentPaths;
    document
      .getElementById("cloth-composite")
      .setAttribute("mask", custom ? "none" : "url(#cloth-mask)");
    const source =
      fashion.outfit === "tank"
        ? tankAssets[fashion.hair]
        : outfitAssets[fashion.outfit];
    ["cloth-mask-image", "cloth-color-image"].forEach((id) =>
      document.getElementById(id).setAttribute("href", source),
    );
    document
      .getElementById("cloth-region-path")
      .setAttribute("d", garmentPaths[fashion.outfit] || "M0 0Z");
    ["R", "G", "B"].forEach((c, i) =>
      document
        .querySelector(`#cloth-tint feFunc${c}`)
        .setAttribute("slope", garmentColors[wardrobe.color][i]),
    );
    document
      .getElementById("cloth-color-image")
      .setAttribute(
        "opacity",
        supported && wardrobe.color !== "ivory" ? "1" : "0",
      );
    document.getElementById("cloth-finish").setAttribute(
      "fill",
      supported
        ? {
            satin: "url(#silk-shine)",
            matte: "none",
            sparkle: "url(#sequin-pattern)",
            lace: "url(#lace-pattern)",
          }[wardrobe.finish]
        : "none",
    );
    const outerPaths = {
      original:
        "M434 339Q349 350 316 420L295 559H436L417 433L416 363Z M594 339Q680 350 707 420L736 559H590L606 433L607 363Z",
      blazer:
        "M433 337Q345 350 312 420L292 559H440L430 431L443 374Z M595 337Q683 350 710 420L740 559H586L594 431L581 374Z",
      satin:
        "M434 339Q349 350 316 420L295 559H436L417 433L416 363Z M594 339Q680 350 707 420L736 559H590L606 433L607 363Z",
    };
    document
      .getElementById("outer-region-path")
      .setAttribute("d", outerPaths[wardrobe.outer] || outerPaths.original);
    document
      .getElementById("extras-layer")
      .setAttribute(
        "transform",
        wardrobe.extras === "brooch" && wardrobe.outer === "none" && custom
          ? "translate(-20 96)"
          : "translate(0 0)",
      );
    const outer = document.getElementById("outer-layer");
    outer.setAttribute(
      "href",
      outfitAssets[wardrobe.outer] || outfitAssets.blazer,
    );
    outer.setAttribute(
      "opacity",
      supported && wardrobe.outer !== "none" ? "1" : "0",
    );
    document
      .querySelectorAll(
        '[data-part="dressColor"],[data-part="fabric"],[data-part="outer"]',
      )
      .forEach((b) => (b.disabled = !prepared || saving || !supported));
    document.getElementById("wardrobe-hint").textContent = supported
      ? "เลือกสี เนื้อผ้า และเสื้อคลุมแยกกันได้"
      : "ชุดสำเร็จรูป — เลือกเสื้อหรือเดรสด้านบนเพื่อปรับสีและเสื้อคลุม";
  }
  const necklaceStyles = {
    none: "",
    pearls:
      '<path d="M470 320Q512 347 553 320" fill="none" stroke="#b4946e" stroke-width="5"/>' +
      Array.from({ length: 17 }, (_, i) => {
        const x = 471 + i * 5;
        const y = 320 + 13 * Math.sin((i / 16) * Math.PI);
        return `<circle cx="${x}" cy="${y}" r="2.8" fill="#fff5df" stroke="#d1b68e" stroke-width=".5"/>`;
      }).join(""),
    silver:
      '<path d="M469 322Q513 370 555 322M466 331Q511 390 559 330" fill="none" stroke="#dce1e6" stroke-width="1.6"/><path d="M508 359l5-6 5 6-5 9Z" fill="#fbffff" stroke="#9ba6b5"/>',
    ribbon:
      '<path d="M470 320Q513 340 554 320" fill="none" stroke="#28242c" stroke-width="6"/><path d="M510 330l-10 31 12-6 9 8-5-33" fill="#353039"/><circle cx="513" cy="330" r="3" fill="#fff7db"/>',
  };
  const extraStyles = {
    none: "",
    glasses:
      '<g transform="rotate(-8 520 96)" stroke="#28242c" stroke-width="3" fill="#4d394a" fill-opacity=".65"><path d="M465 87Q480 77 500 86L498 106Q480 117 466 103Z M524 84Q544 76 560 84L559 101Q542 113 526 103Z"/><path d="M500 90Q512 82 524 88" fill="none"/></g>',
    scarf:
      '<path d="M469 320Q513 337 555 320L552 331Q516 347 471 332Z M545 331Q570 360 571 400L552 392L553 353L535 337Z" fill="#c17c8d" stroke="#9d5e72" stroke-width="1"/><path d="M480 326Q512 338 548 326M550 337L563 386" fill="none" stroke="#eec1c7" stroke-width="2"/>',
    brooch:
      '<g transform="translate(606 406)" fill="url(#gold-metal)" stroke="#ac834f" stroke-width=".7"><path d="M0-10L3-3L10 0L3 3L0 10L-3 3L-10 0L-3-3Z"/><circle r="3" fill="#fff7e9"/></g>',
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
  const stylePanel = document.getElementById("style-panel");
  function choices(part, options) {
    return options
      .map(
        ([value, name]) =>
          `<button type="button" data-part="${part}" data-value="${value}" aria-pressed="false">${name}</button>`,
      )
      .join("");
  }
  const outfitChoices = stylePanel.querySelector(
    '[data-part="outfit"]',
  ).parentElement;
  outfitChoices.insertAdjacentHTML(
    "afterbegin",
    choices("outfit", [
      ["offshoulder", "Off Shoulder"],
      ["corset", "Satin Corset"],
      ["slip", "Slip Dress"],
    ]),
  );
  stylePanel.insertAdjacentHTML(
    "beforeend",
    `
    <p id="wardrobe-hint" class="wardrobe-hint"></p>
    ${[
      [
        "dressColor",
        "COLOR · สีเสื้อ",
        [
          ["ivory", "Ivory"],
          ["black", "Midnight"],
          ["pink", "Blush Pink"],
          ["wine", "Burgundy"],
          ["sage", "Sage"],
        ],
      ],
      [
        "fabric",
        "FABRIC · เนื้อผ้า",
        [
          ["satin", "Satin"],
          ["matte", "Matte"],
          ["sparkle", "Sparkle"],
          ["lace", "Lace"],
        ],
      ],
      [
        "outer",
        "OUTERWEAR · เสื้อคลุม",
        [
          ["none", "No Jacket"],
          ["blazer", "Tweed Jacket"],
          ["original", "Knit Cardigan"],
          ["satin", "Satin Shirt"],
        ],
      ],
      [
        "necklace",
        "NECKLACE · สร้อยเสริม",
        [
          ["none", "No Necklace"],
          ["pearls", "Pearl Choker"],
          ["silver", "Silver Layers"],
          ["ribbon", "Ribbon Choker"],
        ],
      ],
      [
        "extras",
        "EXTRAS · แอ็กเซสซอรี",
        [
          ["none", "No Extra"],
          ["glasses", "Sunglasses"],
          ["scarf", "Silk Scarf"],
          ["brooch", "Star Brooch"],
        ],
      ],
    ]
      .map(
        ([part, title, options]) =>
          `<section class="makeup-group"><h3>${title}</h3><div class="style-choices">${choices(part, options)}</div></section>`,
      )
      .join("")}
    <button type="button" id="surprise-look" class="wardrobe-surprise">SURPRISE ME ✦</button>
  `,
  );
  earrings.crystal =
    '<g stroke="#b4bdc9" stroke-width=".8" fill="#f4fdff"><path d="M421 219l4 6-4 7-4-7Z M421 232l5 10-5 10-5-10Z M602 219l4 6-4 7-4-7Z M602 232l5 10-5 10-5-10Z"/></g>';
  clips.crystal =
    '<path d="M571 137l34 17" stroke="#e2e8ef" stroke-width="4" stroke-dasharray="3 2"/><path d="M579 134v9m-4-4h9M599 146v10m-5-5h10" stroke="#fff9e8" stroke-width="1.5"/>';
  clips.flower =
    '<g transform="translate(597 141)" fill="#edd0d9" stroke="#c38ba0" stroke-width=".7">' +
    [0, 72, 144, 216, 288]
      .map(
        (a) =>
          `<ellipse cx="0" cy="-6" rx="4" ry="7" transform="rotate(${a})"/>`,
      )
      .join("") +
    '<circle r="3" fill="#e6c77e"/></g>';
  clips.headband =
    '<path d="M426 141Q437 31 523 32Q594 34 619 115" fill="none" stroke="#d1a7b8" stroke-width="7"/><path d="M426 141Q437 31 523 32Q594 34 619 115" fill="none" stroke="#f3d7e0" stroke-width="2"/>';
  stylePanel
    .querySelector('[data-part="earrings"]')
    .parentElement.insertAdjacentHTML(
      "beforeend",
      choices("earrings", [["crystal", "Crystal Drops"]]),
    );
  stylePanel
    .querySelector('[data-part="clip"]')
    .parentElement.insertAdjacentHTML(
      "beforeend",
      choices("clip", [
        ["crystal", "Crystal Clip"],
        ["flower", "Silk Flower"],
        ["headband", "Satin Headband"],
      ]),
    );
  document
    .getElementById("surprise-look")
    .addEventListener("click", async () => {
      if (!prepared || saving || pending.size) return;
      const pick = (a) => a[Math.floor(Math.random() * a.length)];
      const outfit = pick(["offshoulder", "corset", "slip"]);
      const epoch = generation;
      pending.add("surprise");
      syncControls();
      try {
        const image = new Image();
        image.src = outfitAssets[outfit];
        await image.decode();
        if (epoch !== generation) return;
        fashion.outfit = outfit;
        wardrobe.color = pick(Object.keys(garmentColors));
        wardrobe.finish = pick(["satin", "sparkle", "lace"]);
        wardrobe.outer = pick(["none", "none", "blazer"]);
        wardrobe.necklace = pick(["pearls", "silver", "ribbon"]);
        wardrobe.extras = "none";
        fashion.earrings = pick(["pearl", "hoops", "crystal"]);
        fashion.clip = pick(["pearls", "crystal", "flower", "bow"]);
        document.getElementById("outfit-image").setAttribute("href", image.src);
        document.getElementById("necklace-layer").innerHTML =
          necklaceStyles[wardrobe.necklace];
        document.getElementById("extras-layer").innerHTML = "";
        document.getElementById("earrings-layer").innerHTML =
          earrings[fashion.earrings];
        document.getElementById("clips-layer").innerHTML = clips[fashion.clip];
        syncCharacter();
        const values = {
          ...fashion,
          dressColor: wardrobe.color,
          fabric: wardrobe.finish,
          outer: wardrobe.outer,
          necklace: wardrobe.necklace,
          extras: wardrobe.extras,
        };
        tray.querySelectorAll("button[data-part]").forEach((b) => {
          if (!(b.dataset.part in values)) return;
          const active = values[b.dataset.part] === b.dataset.value;
          b.setAttribute("aria-pressed", active);
          b.classList.toggle("active", active);
        });
        celebrate();
      } catch {
        status.textContent = "โหลดชุดไม่สำเร็จ ลองสุ่มอีกครั้ง";
      } finally {
        pending.delete("surprise");
        syncControls();
        syncWardrobe();
      }
    });
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
    document.querySelector(".character-picker").hidden = false;
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
    Object.assign(wardrobe, {
      color: "ivory",
      finish: "satin",
      outer: "none",
      necklace: "none",
      extras: "none",
    });
    document.getElementById("necklace-layer").replaceChildren();
    document.getElementById("extras-layer").replaceChildren();
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
      dressColor: "ivory",
      fabric: "satin",
      outer: "none",
      necklace: "none",
      extras: "none",
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
    syncCharacter();
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
        syncCharacter();
      } catch (_) {
        status.textContent = "โหลดลุคไม่สำเร็จ ลองเลือกอีกครั้ง";
        reacting = false;
        syncControls();
        return;
      } finally {
        if (revisions[part] === ticket) pending.delete(part);
        syncControls();
      }
    } else if (
      ["dressColor", "fabric", "outer", "necklace", "extras"].includes(part)
    ) {
      const key = {
        dressColor: "color",
        fabric: "finish",
        outer: "outer",
        necklace: "necklace",
        extras: "extras",
      }[part];
      wardrobe[key] = value;
      if (part === "necklace")
        document.getElementById("necklace-layer").innerHTML =
          necklaceStyles[value];
      if (part === "extras")
        document.getElementById("extras-layer").innerHTML = extraStyles[value];
      syncWardrobe();
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
      // Capture chosen values rather than an in-flight color transition.
      for (const id of [
        "lip-layer",
        "blush-layer",
        "shadow-layer",
        "brows-layer",
      ]) {
        const layer = snapshot.querySelector(`#${id}`);
        if (!layer) continue;
        if (layer.hasAttribute("opacity"))
          layer.style.opacity = layer.getAttribute("opacity");
        for (const node of [layer, ...layer.querySelectorAll("*")]) {
          node.style.removeProperty("fill");
        }
      }
      // Export a stable neutral expression even when Finish is tapped mid-reaction.
      snapshot.querySelector("#lip-layer").style.opacity = svg
        .querySelector("#lip-layer")
        .getAttribute("opacity");
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
    document.body.append(link);
    link.click();
    link.remove();
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
      document.querySelector(".character-picker").hidden = true;
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
    document.querySelector(".character-picker").hidden = false;
    syncControls();
    finishButton.focus();
  });
  document.getElementById("reset-look").addEventListener("click", () => {
    reset();
    apply.focus();
  });
  reset();
})();
