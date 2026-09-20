function toggleMenu(btn) {
  const nav = document.getElementById("mobileNav");
  const open = nav.classList.toggle("open");
  btn.setAttribute("aria-expanded", open);
  btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  btn.innerHTML = open
    ? '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
    : '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[c]));
}

async function fetchJson(url, options) {
  const res = await fetch(url, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options && options.headers) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || "Request failed");
    error.status = res.status;
    throw error;
  }
  return data;
}

function renderForumList(container, items) {
  if (!container) return;
  container.innerHTML = "";
  if (!items.length) {
    container.innerHTML = '<div class="forum-empty">' + text("empty") + "</div>";
    return;
  }
  items.slice().reverse().forEach((item) => {
    const article = document.createElement("article");
    article.className = "forum-item";
    const body = escapeHtml(item.body || "").replace(/\n/g, "<br>");
    article.innerHTML =
      '<button class="forum-title" type="button" aria-expanded="false">' +
      "<span>" + escapeHtml(item.title) + '</span><span class="forum-chevron">⌄</span></button>' +
      '<div class="forum-description"><div>' + (body || " ") + "</div>" + renderMedia(item.media) + "</div>";
    const btn = article.querySelector(".forum-title");
    btn.addEventListener("click", () => {
      const open = article.classList.toggle("open");
      btn.setAttribute("aria-expanded", open);
    });
    container.appendChild(article);
  });
}

function renderMedia(media = []) {
  if (!media.length) return "";
  return '<div class="post-media">' + media.map((file) => {
    if (String(file.type || "").startsWith("video/")) {
      return '<video controls preload="metadata" src="' + escapeHtml(file.url) + '"></video>';
    }
    return '<img loading="lazy" src="' + escapeHtml(file.url) + '" alt="' + escapeHtml(file.name || "Attached image") + '">';
  }).join("") + "</div>";
}

function renderServiceList(container, items) {
  if (!container) return;
  container.innerHTML = "";
  const icon =
    '<span class="circle"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"/></svg></span>';
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "list-card";
    li.innerHTML = icon + '<span class="item-text">' + escapeHtml(item.title) + "</span>" + renderMedia(item.media);
    container.appendChild(li);
  });
}

function renderFocusList(container, items) {
  if (!container) return;
  container.innerHTML = "";
  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "list-card";
    li.innerHTML =
      '<span class="number">' +
      (index + 1) +
      '</span><span class="item-text">' +
      escapeHtml(item.title) +
      "</span>" + renderMedia(item.media);
    container.appendChild(li);
  });
}

function currentLanguage() {
  return localStorage.getItem("site-english-mode") === "true" ? "en" : "am";
}

const interfaceText = {
  am: {
    brand: "የልደታ ወረዳ 3 ኢንስፔክሽን እና ስነምባር",
    home: "ዋና ገጽ",
    services: "የሚንሰጣቸው አገልግሎቶች",
    accomplishments: "በየወቅቱ የተከናወኑ መረጃዎች",
    focus: "የትኩረት መስክ",
    general: "ጥቅል መረጃዎች",
    login: "የባለቤት መግቢያ",
    address: "አድራሻ",
    phone: "ስልክ",
    website: "የድረ-ገጽ አድራሻ",
    published: "የተጨመሩ መረጃዎች",
    instruction: "ርዕሱን ይጫኑ መግለጫውን ለማየት።",
    empty: "እስካሁን ምንም መረጃ አልተጨመረም።",
    work: "የተግባር ማሳያ",
    community: "የማህበረሰብ ተግባር",
    search: "ፍለጋ",
    searchTitle: "መረጃ ይፈልጉ",
    searchHint: "በርዕስ ወይም በመግለጫ ይፈልጉ",
    settings: "ቅንብሮች",
    dark: "ጨለማ ሁነታ",
    english: "እንግሊዝኛ ሁነታ",
    searching: "በመፈለግ ላይ...",
    noResults: "ተዛማጅ መረጃ አልተገኘም።",
    unavailable: "ፍለጋው ለጊዜው አይገኝም።",
  },
  en: {
    brand: "Lideta Woreda 3 Inspection and Ethics",
    home: "Home",
    services: "Services",
    accomplishments: "Accomplishments",
    focus: "Focus areas",
    general: "General information",
    login: "Owner login",
    address: "Address",
    phone: "Phone",
    website: "Website contact",
    published: "Published information",
    instruction: "Select a title to view its description.",
    empty: "No information has been added yet.",
    work: "Our work",
    community: "Community in action",
    search: "Search",
    searchTitle: "Search information",
    searchHint: "Search titles and descriptions",
    settings: "Settings",
    dark: "Dark mode",
    english: "English mode",
    searching: "Searching...",
    noResults: "No matching information found.",
    unavailable: "Search is temporarily unavailable.",
  },
};

function text(key) {
  return interfaceText[currentLanguage()][key];
}

function applyLanguage() {
  const language = currentLanguage();
  const page = document.body.dataset.page || "home";
  const pageKey = page === "services" ? "services" : page;
  const elements = {
    brand: document.body.dataset.admin ? [] : document.querySelectorAll(".brand-title"),
    home: document.querySelectorAll('a[href="index.html"].nav-link, a[href="index.html"].mobile-link'),
    services: document.querySelectorAll('a[href="services.html"].nav-link, a[href="services.html"].mobile-link'),
    accomplishments: document.querySelectorAll('a[href="accomplishments.html"].nav-link, a[href="accomplishments.html"].mobile-link'),
    focus: document.querySelectorAll('a[href="focus.html"].nav-link, a[href="focus.html"].mobile-link'),
    general: document.querySelectorAll('a[href="general.html"].nav-link, a[href="general.html"].mobile-link'),
  };
  Object.entries(elements).forEach(([key, nodes]) => nodes.forEach((node) => { node.textContent = text(key); }));
  document.querySelectorAll('a[href="login.html"]').forEach((node) => { node.textContent = text("login"); });
  if (document.body.dataset.admin) {
    const adminText = currentLanguage() === "en" ? {
      view: "View site", logout: "Log out", owner: "Owner admin", intro: "Visitors can only read the public pages. Changes here are saved to SQLite.",
      searchContent: "Search content", searchLabel: "Search titles and descriptions", settings: "Home / contact settings", save: "Save settings", add: "Add", title: "Title", details: "Details", attach: "Attach images or videos",
    } : {
      view: "ድረ-ገጹን ይመልከቱ", logout: "ውጣ", owner: "የባለቤት አስተዳደር", intro: "ጎብኚዎች ይዘቱን ብቻ ማንበብ ይችላሉ። ለውጦች በSQLite ይቀመጣሉ።",
      searchContent: "ይዘት ይፈልጉ", searchLabel: "በርዕስ እና በመግለጫ ይፈልጉ", settings: "የመነሻ / የእውቂያ ቅንብሮች", save: "ቅንብሮችን አስቀምጥ", add: "ጨምር", title: "ርዕስ", details: "መግለጫ", attach: "ምስሎች ወይም ቪዲዮዎች ያያይዙ",
    };
    const adminNav = document.querySelector('a[href="index.html"].nav-link');
    if (adminNav) adminNav.textContent = adminText.view;
    const logout = document.getElementById("logout-btn");
    if (logout) logout.textContent = adminText.logout;
    const owner = document.querySelector(".report-head h1");
    if (owner) owner.textContent = adminText.owner;
    const intro = document.querySelector(".report-head p");
    if (intro) intro.textContent = adminText.intro;
    const searchHeading = document.querySelector("#search-form") && document.querySelector("#search-form").parentElement.querySelector("h2");
    if (searchHeading) searchHeading.textContent = adminText.searchContent;
    const searchLabel = document.querySelector("#content-search") && document.querySelector("#content-search").parentElement;
    if (searchLabel) searchLabel.firstChild.nodeValue = adminText.searchLabel;
    const settingsHeading = document.querySelector("#settings-form") && document.querySelector("#settings-form").parentElement.querySelector("h2");
    if (settingsHeading) settingsHeading.textContent = adminText.settings;
    document.querySelectorAll("[data-section]").forEach((section) => {
      section.querySelectorAll(".add-form label").forEach((label) => {
        const input = label.querySelector("input, textarea");
        if (!input) return;
        if (input.name === "title") label.firstChild.nodeValue = adminText.title;
        if (input.name === "body") label.firstChild.nodeValue = adminText.details;
        if (input.name === "media") label.firstChild.nodeValue = adminText.attach;
      });
      const add = section.querySelector(".add-form .forum-submit");
      if (add) add.textContent = adminText.add;
    });
    const save = document.querySelector('#settings-form button[type="submit"]');
    if (save) save.textContent = adminText.save;
  }
  const pageTitle = document.querySelector(".banner-title");
  const heading = document.querySelector(".report-head h1");
  document.title = document.body.dataset.page ? text(pageKey) + " · " + text("brand") : text("brand");
  if (document.body.dataset.page && pageTitle && text(pageKey)) pageTitle.textContent = text(pageKey);
  if (document.body.dataset.page && heading && text(pageKey)) heading.textContent = text(pageKey);
  document.querySelectorAll(".footer h2").forEach((node) => { node.textContent = text("website"); });
  document.querySelectorAll("#home-address h2").forEach((node) => { node.textContent = text("address"); });
  document.querySelectorAll("#home-phone").forEach((node) => {
    const headingNode = node.parentElement && node.parentElement.querySelector("h2");
    if (headingNode) headingNode.textContent = text("phone");
  });
  document.querySelectorAll(".forum-help").forEach((node) => {
    if (node.textContent.includes("ርዕሱን") || node.dataset.interfaceText === "instruction") {
      node.dataset.interfaceText = "instruction";
      node.textContent = text("instruction");
    }
  });
  document.querySelectorAll(".report-head > p").forEach((node) => {
    if (node.textContent.includes("ርዕሱን") || node.dataset.interfaceText === "instruction") {
      node.dataset.interfaceText = "instruction";
      node.textContent = text("instruction");
    }
  });
  if (page === "accomplishments" || page === "general") {
    document.querySelectorAll(".section > h2").forEach((node) => { node.textContent = text("published"); });
  }
  const galleryEyebrow = document.querySelector(".gallery-heading .eyebrow");
  const galleryHeading = document.querySelector(".gallery-heading h2");
  if (galleryEyebrow) galleryEyebrow.textContent = text("work");
  if (galleryHeading) galleryHeading.textContent = text("community");
  document.querySelectorAll(".gallery-card figcaption").forEach((node) => { node.textContent = text("community"); });
  document.documentElement.lang = language === "en" ? "en" : "am";
  document.documentElement.classList.toggle("english-mode", language === "en");
}

function renderServicesGallery() {
  const page = document.body.dataset.page;
  if (page !== "services") return;
  const root = document.getElementById("services-list");
  if (!root || document.getElementById("services-gallery")) return;
  const gallery = document.createElement("section");
  gallery.id = "services-gallery";
  gallery.className = "services-gallery";
  gallery.innerHTML = '<div class="gallery-heading"><span class="eyebrow"></span><h2></h2></div>' +
    '<div class="gallery-grid">' + [1, 2, 3, 4].map((number) =>
      '<figure class="gallery-card"><img loading="lazy" src="image' + number + '.jpg" alt="Community work ' + number + '"><figcaption>Community work</figcaption></figure>'
    ).join("") + '</div>';
  root.parentElement.appendChild(gallery);
  applyLanguage();
}

function applySettings(settings) {
  if (!settings) return;
  const lead = document.getElementById("home-lead");
  const sublead = document.getElementById("home-sublead");
  const address = document.getElementById("home-address");
  const phone = document.getElementById("home-phone");
  if (lead) lead.textContent = settings.slogan;
  if (sublead) sublead.textContent = settings.office_name;
  if (address) {
    address.innerHTML =
      "<p>" + escapeHtml(settings.address_line1) + "</p><p>" + escapeHtml(settings.address_line2) + "</p>";
  }
  if (phone) phone.textContent = settings.phone;

  document.querySelectorAll("[data-setting-link='telegram']").forEach((el) => {
    el.href = settings.telegram_url;
    el.textContent = settings.telegram_label;
  });
  document.querySelectorAll("[data-setting-link='whatsapp']").forEach((el) => {
    el.href = settings.whatsapp_url;
    el.textContent = settings.whatsapp_label;
  });
  document.querySelectorAll("[data-setting-text='copyright']").forEach((el) => {
    el.textContent = settings.copyright;
  });
  document.querySelectorAll(".banner img").forEach((image) => {
    image.src = "banner_image.jpg";
    image.alt = "Prosperity Party logo";
  });
}

function addLoginLink() {
  const desktopNav = document.querySelector(".desktop-nav");
  const isPublicSite = desktopNav && (desktopNav.querySelector(".icon-btn") || document.querySelector("#mobileNav"));
  if (!isPublicSite) return;
  if (desktopNav && !desktopNav.querySelector('a[href="login.html"]')) {
    const link = document.createElement("a");
    link.className = "nav-link";
    link.href = "login.html";
    link.textContent = "Owner login";
    desktopNav.appendChild(link);
  }
  const mobileList = document.querySelector("#mobileNav ul");
  if (mobileList && !mobileList.querySelector('a[href="login.html"]')) {
    const item = document.createElement("li");
    item.innerHTML = '<a class="mobile-link" href="login.html">Owner login</a>';
    mobileList.appendChild(item);
  }
}

function applyDisplayPreferences() {
  const darkMode = localStorage.getItem("site-dark-mode") === "true";
  const englishMode = localStorage.getItem("site-english-mode") === "true";
  document.documentElement.classList.toggle("dark-mode", darkMode);
  applyLanguage();
  document.querySelectorAll(".dark-toggle").forEach((control) => {
    control.checked = darkMode;
  });
  document.querySelectorAll(".english-toggle").forEach((control) => {
    control.checked = englishMode;
  });
  const searchPanel = document.getElementById("site-search-panel");
  if (searchPanel) {
    searchPanel.querySelector(".site-search-heading h2").textContent = text("searchTitle");
    searchPanel.querySelector(".site-search-heading .eyebrow").textContent = text("search");
    searchPanel.querySelector("#public-search-input").placeholder = text("searchHint");
    searchPanel.querySelector("#public-search-form button").textContent = text("search");
    searchPanel.querySelector(".display-settings strong").textContent = text("settings");
    searchPanel.querySelector(".dark-label").lastChild.nodeValue = " " + text("dark");
    searchPanel.querySelector(".english-label").lastChild.nodeValue = " " + text("english");
  }
}

function setupDisplayControls() {
  document.querySelectorAll(".dark-toggle, .english-toggle").forEach((control) => {
    if (control.dataset.preferenceBound) return;
    control.dataset.preferenceBound = "true";
    control.addEventListener("change", () => {
      if (control.classList.contains("dark-toggle")) {
        localStorage.setItem("site-dark-mode", String(control.checked));
      } else {
        localStorage.setItem("site-english-mode", String(control.checked));
      }
      applyDisplayPreferences();
    });
  });
}

function setupSearch() {
  if (!document.body.dataset.page) return;
  const searchButton = document.querySelector(".desktop-nav .icon-btn");
  const mobileList = document.querySelector("#mobileNav ul");
  if (!searchButton && !mobileList) return;
  const panel = document.createElement("section");
  panel.id = "site-search-panel";
  panel.className = "site-search-panel";
  panel.hidden = true;
  panel.innerHTML =
    '<div class="site-search-inner"><div class="site-search-heading"><div><span class="eyebrow">Search</span><h2></h2></div>' +
    '<button class="icon-btn search-close" type="button" aria-label="Close search">&times;</button></div>' +
    '<form id="public-search-form" class="public-search-form"><input id="public-search-input" type="search" autocomplete="off"><button class="forum-submit" type="submit"></button></form>' +
    '<div class="display-settings"><strong></strong><label><input class="dark-toggle" type="checkbox"></label><label><input class="english-toggle" type="checkbox"></label></div>' +
    '<div id="public-search-results" class="public-search-results" aria-live="polite"></div></div>';
  document.body.appendChild(panel);
  applyLanguage();
  panel.querySelector(".site-search-heading h2").textContent = text("searchTitle");
  panel.querySelector(".site-search-heading .eyebrow").textContent = text("search");
  panel.querySelector("#public-search-input").placeholder = text("searchHint");
  panel.querySelector("#public-search-form button").textContent = text("search");
  panel.querySelector(".display-settings strong").textContent = text("settings");
  panel.querySelector(".dark-toggle").parentElement.classList.add("dark-label");
  panel.querySelector(".dark-toggle").parentElement.append(" " + text("dark"));
  panel.querySelector(".english-toggle").parentElement.classList.add("english-label");
  panel.querySelector(".english-toggle").parentElement.append(" " + text("english"));

  const openSearch = () => {
    const mobileNav = document.getElementById("mobileNav");
    if (mobileNav) {
      mobileNav.classList.remove("open");
      const menuToggle = document.querySelector(".mobile-toggle");
      if (menuToggle) {
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open menu");
        menuToggle.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
      }
    }
    panel.hidden = false;
    document.getElementById("public-search-input").focus();
  };
  if (searchButton) searchButton.addEventListener("click", openSearch);
  if (mobileList) {
    const item = document.createElement("li");
    item.innerHTML = '<button class="mobile-link mobile-search-link" type="button"></button>';
    item.querySelector("button").textContent = text("search");
    item.querySelector("button").addEventListener("click", openSearch);
    mobileList.appendChild(item);
  }
  panel.querySelector(".search-close").addEventListener("click", () => {
    panel.hidden = true;
  });
  panel.querySelector(".dark-toggle").addEventListener("change", (event) => {
    localStorage.setItem("site-dark-mode", String(event.target.checked));
    applyDisplayPreferences();
  });
  panel.querySelector(".english-toggle").addEventListener("change", (event) => {
    localStorage.setItem("site-english-mode", String(event.target.checked));
    applyDisplayPreferences();
  });
  panel.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = document.getElementById("public-search-input").value.trim();
    const results = document.getElementById("public-search-results");
    if (!query) {
      results.innerHTML = "";
      return;
    }
    results.innerHTML = '<div class="forum-empty">' + text("searching") + "</div>";
    try {
      const items = await fetchJson("/api/content/search?q=" + encodeURIComponent(query));
      results.innerHTML = items.length ? items.map((item) =>
        '<a class="public-search-result" href="' + item.section + '.html"><strong>' + escapeHtml(item.title) + '</strong><span>' + escapeHtml(item.section) + '</span></a>'
      ).join("") : '<div class="forum-empty">' + text("noResults") + "</div>";
    } catch (error) {
      results.innerHTML = '<div class="forum-empty">' + text("unavailable") + "</div>";
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  addLoginLink();
  setupSearch();
  setupDisplayControls();
  applyDisplayPreferences();
  try {
    const settings = await fetchJson("/api/settings");
    applySettings(settings);
  } catch (e) {}

  const page = document.body.dataset.page;
  if (!page) return;
  try {
    const items = await fetchJson("/api/content/" + page);
    if (page === "accomplishments" || page === "general") {
      renderForumList(document.getElementById(page + "-list"), items);
    } else if (page === "services") {
      renderServiceList(document.getElementById("services-list"), items);
    } else if (page === "focus") {
      renderFocusList(document.getElementById("focus-list"), items);
    }
    renderServicesGallery();
  } catch (e) {}
});
