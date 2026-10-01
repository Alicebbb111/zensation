(() => {
  const config = window.ZENSATION_CONFIG || {};
  const channels = config.channels || {};
  for (const link of document.querySelectorAll("[data-channel]")) {
    const url = channels[link.dataset.channel];
    if (url && /^https:\/\//i.test(url)) {
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.removeAttribute("aria-disabled");
      link.querySelector(".channel-status").textContent = "FOLLOW ZENSATION";
    } else {
      link.addEventListener("click", (event) => event.preventDefault());
    }
  }

  const form = document.getElementById("redeem-form");
  if (!form) return;
  const storageReady = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  if (!storageReady) {
    const notice = document.createElement("p");
    notice.className = "activity-notice";
    notice.textContent =
      "ระบบลงทะเบียนกำลังเตรียมเปิดให้บริการ กรุณากลับมาอีกครั้ง";
    form.before(notice);
  }
  const submissionId = crypto.randomUUID();
  const codeInput = document.getElementById("scratch-code");
  const normalizeCode = (value) =>
    String(value || "")
      .replace(/\s/g, "")
      .toLowerCase();
  const validateCode = () =>
    codeInput.setCustomValidity(
      codeInput.value &&
        normalizeCode(codeInput.value) !== "confidencenocompromises"
        ? "กรุณาพิมพ์ Confidence No Compromises เท่านั้น (ไม่ต้องใส่จุด)"
        : "",
    );
  codeInput.addEventListener("input", validateCode);
  const status = document.getElementById("form-status");
  const button = form.querySelector('button[type="submit"]');
  const show = (title, detail, success = false) => {
    status.hidden = false;
    status.className = `form-status${success ? " success" : ""}`;
    status.replaceChildren();
    const strong = document.createElement("strong");
    strong.textContent = title;
    const p = document.createElement("span");
    p.textContent = detail;
    status.append(strong, p);
    status.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.hidden = true;
    validateCode();
    if (!form.reportValidity()) return;
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      show(
        "ยังไม่สามารถบันทึกข้อมูลได้",
        "ระบบลงทะเบียนยังไม่พร้อมให้บริการ ข้อมูลของคุณยังไม่ได้ถูกส่ง กรุณาลองใหม่ภายหลัง",
      );
      return;
    }
    const values = Object.fromEntries(new FormData(form));
    const code = normalizeCode(values.code);
    if (code !== "confidencenocompromises") {
      show(
        "รูปแบบรหัสไม่ถูกต้อง",
        "กรุณาพิมพ์ Confidence No Compromises เท่านั้น",
      );
      return;
    }
    button.disabled = true;
    form.setAttribute("aria-busy", "true");
    const controller = new AbortController();
    const requestTimeout = setTimeout(() => controller.abort(), 20000);
    button.firstChild.textContent = "SUBMITTING… ";
    try {
      const response = await fetch(
        `${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/register_participant`,
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            apikey: config.supabaseAnonKey,
            ...(config.supabaseAnonKey.startsWith("eyJ")
              ? { Authorization: `Bearer ${config.supabaseAnonKey}` }
              : {}),
          },
          body: JSON.stringify({
            p_submission_id: submissionId,
            p_code: code,
            p_first_name: String(values.first_name || "").trim(),
            p_last_name: String(values.last_name || "").trim(),
            p_phone: String(values.phone || "").trim(),
            p_age_range: values.age_range,
            p_gender: values.gender,
            p_occupation: values.occupation,
            p_education: values.education,
            p_consent: values.consent === "on",
          }),
        },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.status === "registered" && result.registration_id) {
        form.hidden = true;
        document.querySelector(".form-card-header").hidden = true;
        const success = document.getElementById("registration-success");
        success.hidden = false;
        success.focus();
        success.scrollIntoView({ behavior: "smooth", block: "center" });
        form.reset();
      } else if (result.status === "invalid_code") {
        show("ไม่พบรหัสนี้", "ตรวจสอบตัวอักษรบนบัตรขูดแล้วลองอีกครั้ง");
      } else {
        show(
          "กรุณาตรวจสอบข้อมูล",
          "กรุณากรอกข้อมูลให้ครบและตรวจสอบรหัสบนบัตรอีกครั้ง",
        );
      }
    } catch (_) {
      show(
        "ยังยืนยันการบันทึกไม่ได้",
        "การเชื่อมต่อขัดข้อง กรุณาลองอีกครั้ง หากยังไม่ได้ ให้เจ้าหน้าที่ที่บูธช่วยตรวจสอบบัตร",
      );
    } finally {
      clearTimeout(requestTimeout);
      form.removeAttribute("aria-busy");
      button.disabled = false;
      button.firstChild.textContent = "SUBMIT ENTRY ";
    }
  });
})();
