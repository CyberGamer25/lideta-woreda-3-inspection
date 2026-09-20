function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[c]));
}

function adminLanguage() {
  return localStorage.getItem("site-english-mode") === "true" ? {
    title: "Title", details: "Details", attach: "Attach images or videos", save: "Save", remove: "Delete", empty: "No items yet.", noMatches: "No matching titles or descriptions.",
  } : {
    title: "ርዕስ", details: "መግለጫ", attach: "ምስሎች ወይም ቪዲዮዎች ያያይዙ", save: "አስቀምጥ", remove: "ሰርዝ", empty: "እስካሁን ምንም አልተጨመረም።", noMatches: "ተዛማጅ ርዕስ ወይም መግለጫ አልተገኘም።",
  };
}

async function api(url, options) {
  const res = await fetch(url, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
}

function renderSection(section, items) {
  const root = document.querySelector('[data-section="' + section + '"] .admin-list');
  if (!root) return;
  root.innerHTML = "";
  if (!items.length) {
    root.innerHTML = '<div class="forum-empty">' + adminLanguage().empty + "</div>";
    return;
  }
  const labels = adminLanguage();
  items.forEach((item) => {
    const wrap = document.createElement("article");
    wrap.className = "forum-item";
    wrap.innerHTML =
      '<form class="forum-form" style="padding:16px">' +
      '<label>' + labels.title + '<input name="title" required value="' + escapeHtml(item.title) + '"></label>' +
      '<label>' + labels.details + '<textarea name="body" rows="4">' + escapeHtml(item.body || "") + "</textarea></label>" +
      '<label>' + labels.attach + '<input name="media" type="file" accept="image/*,video/*" multiple></label>' +
      renderMediaPreview(item.media) +
      '<div style="display:flex;gap:12px">' +
      '<button type="submit" class="forum-submit">' + labels.save + '</button>' +
      '<button type="button" class="forum-delete delete-btn">' + labels.remove + '</button>' +
      "</div></form>";
    wrap.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const payload = new FormData();
      payload.append("title", form.title.value.trim());
      payload.append("body", form.body.value.trim());
      payload.append("existingMedia", JSON.stringify(item.media || []));
      Array.from(form.media.files).forEach((file) => payload.append("media", file));
      await api("/api/content/" + section + "/" + item.id, {
        method: "PUT",
        headers: {},
        body: payload,
      });
      await loadSection(section);
    });
    wrap.querySelector(".delete-btn").addEventListener("click", async () => {
      if (!confirm("Delete this item?")) return;
      await api("/api/content/" + section + "/" + item.id, { method: "DELETE" });
      await loadSection(section);
    });
    root.appendChild(wrap);
  });
}

function renderMediaPreview(media = []) {
  if (!media.length) return "";
  return '<div class="admin-media-list">' + media.map((file) =>
    '<span>' + escapeHtml(file.name || file.url) + '</span>'
  ).join("") + "</div>";
}

async function loadSection(section) {
  const items = await api("/api/content/" + section);
  renderSection(section, items);
}

function renderSearchResults(items) {
  const root = document.getElementById("search-results");
  if (!root) return;
  root.innerHTML = "";
  if (!items.length) {
    root.innerHTML = '<div class="forum-empty">' + adminLanguage().noMatches + "</div>";
    return;
  }
  items.forEach((item) => {
    const result = document.createElement("article");
    result.className = "forum-item search-result";
    result.innerHTML =
      '<strong>' + escapeHtml(item.title) + '</strong><span>' +
      escapeHtml(item.section) + '</span>';
    root.appendChild(result);
  });
}

async function boot() {
  try {
    const me = await api("/api/auth/me");
    if (!me.authenticated) {
      location.href = "/login";
      return;
    }
  } catch (e) {
    location.href = "/login";
    return;
  }

  const settings = await api("/api/settings");
  const settingsForm = document.getElementById("settings-form");
  Array.from(settingsForm.elements).forEach((el) => {
    if (el.name && settings[el.name] != null) el.value = settings[el.name];
  });
  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {};
    Array.from(settingsForm.elements).forEach((el) => {
      if (el.name) payload[el.name] = el.value;
    });
    await api("/api/settings", { method: "PUT", body: JSON.stringify(payload) });
    alert("Settings saved.");
  });

  document.getElementById("search-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = document.getElementById("content-search").value.trim();
    renderSearchResults(query ? await api("/api/content/search?q=" + encodeURIComponent(query)) : []);
  });

  document.querySelectorAll("[data-section]").forEach((sectionEl) => {
    const section = sectionEl.dataset.section;
    loadSection(section);
    sectionEl.querySelector(".add-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      await api("/api/content/" + section, {
        method: "POST",
        headers: {},
        body: (() => {
          const payload = new FormData();
          payload.append("title", form.title.value.trim());
          payload.append("body", form.body ? form.body.value.trim() : "");
          if (form.media) Array.from(form.media.files).forEach((file) => payload.append("media", file));
          return payload;
        })(),
      });
      form.reset();
      await loadSection(section);
    });
  });

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await api("/api/auth/logout", { method: "POST" });
    location.href = "/login";
  });
}

boot();
