const statusEl = document.getElementById("status");
const rowsEl = document.getElementById("rows");
const examEl = document.getElementById("exam");
const loadMoreContainerEl = document.getElementById("loadMoreContainer");
const loadMoreEl = document.getElementById("loadMore");
const groupEl = document.getElementById("group");
const cgpaEl = document.getElementById("cgpa");
const sortByEl = document.getElementById("sortBy");
const searchEl = document.getElementById("search");
const pageTitleEl = document.getElementById("pageTitle");
const photoViewerEl = document.getElementById("photoViewer");
const photoViewerImageEl = document.getElementById("photoViewerImage");
const photoViewerCloseEl = document.getElementById("photoViewerClose");
let photoTriggerEl = null;
let photoViewerCloseTimer = null;
let visibleCount = 20;

const EXAM_LABELS = {
  "merged-results.json": "Half Yearly 2026",
  "merged-results-2.json": "Annual 2026",
  "merged-results-3.json": "Pre-test 2026",
};

// Holds the ranked, cleaned dataset for whichever exam is currently loaded.
let rankedData = [];
let spooderPromoTimer = null;

function numeric(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function computeTotal(subjects) {
  if (!Array.isArray(subjects)) return 0;
  return subjects.reduce((sum, sub) => sum + numeric(sub.total), 0);
}

function formatNumber(val) {
  return typeof val === "number" && Number.isFinite(val)
    ? val.toFixed(2).replace(/\.00$/, "")
    : "—";
}

function hideSpooderPromo() {
  const promo = document.getElementById("spooder-promo");
  if (!promo) return;

  promo.classList.add("is-hiding");
  window.setTimeout(() => promo.remove(), 260);
}

function showSpooderPromo() {
  if (document.getElementById("spooder-promo")) return;

  const promo = document.createElement("div");
  promo.id = "spooder-promo";
  promo.className = "spooder-promo";
  promo.innerHTML = `
    <div class="spooder-card" role="dialog" aria-label="Follow me on Instagram">
    
      <img class="spooder-image" src="spooder.png" alt="Spooder" />
      <div class="spooder-bubble">help me improve this, send feedback to <a href="https://www.instagram.com/arf.env" target="_blank" rel="noopener noreferrer">arf.env</a></div>
    </div>
  `;

  promo.addEventListener("click", (event) => {
    if (event.target === promo) hideSpooderPromo();
  });

  promo
    .querySelector(".spooder-close")
    ?.addEventListener("click", hideSpooderPromo);

  document.body.appendChild(promo);
  window.requestAnimationFrame(() => promo.classList.add("is-visible"));

  window.setTimeout(hideSpooderPromo, 10000);
}

function scheduleSpooderPromo() {
  window.clearTimeout(spooderPromoTimer);
  spooderPromoTimer = window.setTimeout(showSpooderPromo, 1500);
}

function closePhotoViewer() {
  if (!photoViewerEl.open || photoViewerEl.classList.contains("is-closing")) {
    return;
  }

  photoViewerEl.classList.add("is-closing");
  photoViewerCloseTimer = window.setTimeout(() => {
    photoViewerEl.close();
  }, 150);
}

photoViewerCloseEl.addEventListener("click", closePhotoViewer);
photoViewerEl.addEventListener("click", (event) => {
  if (event.target !== photoViewerImageEl) closePhotoViewer();
});
photoViewerEl.addEventListener("close", () => {
  window.clearTimeout(photoViewerCloseTimer);
  photoViewerEl.classList.remove("is-closing");
  photoTriggerEl?.focus();
});

function renderTable(data) {
  rowsEl.innerHTML = "";

  if (data.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");

    td.colSpan = 8;
    td.className = "not-found";
    td.textContent = "এজ্জা এখানেও পাওয়া গেলনা তাকে, মুভ অন করেই ফেল";

    tr.appendChild(td);
    rowsEl.appendChild(tr);
    return;
  }

  data.forEach((item) => {
    const tr = document.createElement("tr");
    const cells = [
      { label: "Rank", value: item.rank, className: "col-rank" },
      {
        label: "Photo",
        value: item.studentId
          ? `media/pfp/result-${item.studentId}.webp`
          : null,
        className: "col-photo",
      },
      {
        label: "Student",
        value: `<div>${item.name || "Unknown"}</div><div class="muted">${item.studentId || ""}</div>`,
        className: "col-student",
      },
      {
        label: "Total Marks",
        value: item.totalMarks,
        className: "detail-col",
      },
      {
        label: "GPA",
        value: formatNumber(item.gpa),
        className: "detail-col",
      },
      {
        label: "CGPA",
        value:
          item.cgpa === 0
            ? '<span class="fail">FAIL</span>'
            : formatNumber(item.cgpa),
        className: "detail-col",
      },
      {
        label: "Subjects",
        value: item.subjects?.length || 0,
        className: "detail-col",
      },
      {
        label: "Group",
        value: item.group || "—",
        className: "detail-col",
      },
    ];

    cells.forEach((cell) => {
      const td = document.createElement("td");
      td.setAttribute("data-label", cell.label);
      if (cell.className) td.className = cell.className;
      if (cell.label === "Photo" && cell.value) {
        const photoButton = document.createElement("button");
        photoButton.type = "button";
        photoButton.className = "photo-open-btn";
        photoButton.setAttribute(
          "aria-label",
          `View photo of ${item.name || "student"}`,
        );

        const photo = document.createElement("img");
        photo.className = "student-photo";
        photo.src = cell.value;
        photo.alt = "";
        photo.loading = "lazy";
        photoButton.appendChild(photo);
        photoButton.addEventListener("click", () => {
          photoTriggerEl = photoButton;
          photoViewerImageEl.src = photo.src;
          photoViewerImageEl.alt = item.name || "Student";
          photoViewerEl.showModal();
          photoViewerCloseEl.focus();
        });
        td.appendChild(photoButton);
      } else if (cell.label === "Photo") {
        td.innerHTML = '<span class="muted">—</span>';
      } else {
        td.innerHTML = cell.value;
      }
      tr.appendChild(td);
    });

    // Mobile details toggle button inside student cell
    const studentCell = tr.querySelector(".col-student");
    if (studentCell) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "toggle-btn";
      btn.textContent = "See breakdown";
      btn.addEventListener("click", () => {
        const isOpen = tr.classList.toggle("open");
        btn.textContent = isOpen
          ? "Hide detailed marks"
          : "Show detailed marks";
      });
      studentCell.appendChild(btn);
    }
    rowsEl.appendChild(tr);

    // Detail row with subject-wise marks
    const detailTr = document.createElement("tr");
    detailTr.className = "detail-row";
    const detailTd = document.createElement("td");
    detailTd.colSpan = 8;

    const subjects = Array.isArray(item.subjects) ? item.subjects : [];
    const subjectRows = subjects
      .map((sub) => {
        const safe = (v) =>
          v === null || v === undefined || v === "" ? "—" : v;
        return `
                <tr>
                  <td>${safe(sub.code)}</td>
                  <td>${safe(sub.subject)}</td>
                  <td>${safe(sub.cq)}</td>
                  <td>${safe(sub.mcq)}</td>
                  <td>${safe(sub.pr)}</td>
                  <td>${safe(sub.total)}</td>
                  <td>${safe(sub.grade)}</td>
                  <td>${safe(sub.point)}</td>
                </tr>`;
      })
      .join("");

    detailTd.innerHTML = `
            <div style="padding: 12px 14px;">
              <div style="font-weight:700; margin-bottom:8px;">Subject-wise marks</div>
              <div style="overflow-x:auto;">
                <table class="detail-table" aria-label="Subject details for ${
                  item.name || "student"
                }">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Subject</th>
                      <th>CQ</th>
                      <th>MCQ</th>
                      <th>PR</th>
                      <th>Total</th>
                      <th>Grade</th>
                      <th>Point</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${subjectRows || '<tr><td colspan="8" class="muted">No subject data</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>`;

    detailTr.appendChild(detailTd);
    rowsEl.appendChild(detailTr);
  });
}

function assignRanks(list) {
  let currentRank = 0;
  let lastCGPA = null;
  let lastGPA = null;
  let lastTotal = null;
  return list.map((item) => {
    if (
      lastCGPA === null ||
      item.cgpa !== lastCGPA ||
      item.gpa !== lastGPA ||
      item.totalMarks !== lastTotal
    ) {
      currentRank += 1; // dense ranking: 1,2,2,3
      lastCGPA = item.cgpa;
      lastGPA = item.gpa;
      lastTotal = item.totalMarks;
    }
    return { ...item, rank: currentRank };
  });
}

// Normalize and create a Bangla/Romanized phonetic key.
// Designed for name searching, not linguistic transliteration.
function phoneticKey(name) {
  if (name === null || name === undefined) return "";

  let s = String(name).toLowerCase().trim();

  if (!s) return "";

  // Unicode normalization:
  // Handles Latin accents and Bangla combining marks safely.
  try {
    s = s.normalize("NFD");
    s = s.replace(/[\u0300-\u036f]/g, "");
  } catch (e) {
    // Older browsers
    s = s.replace(/[\u0300-\u036f]/g, "");
  }

  // Normalize whitespace / punctuation first.
  s = s.replace(/[\s\-_.',]+/g, "");

  // -------------------------------------------------------
  // Romanized Bangla phonetic equivalences
  // -------------------------------------------------------

  // Multi-character sounds FIRST
  s = s
    .replace(/tch/g, "c")
    .replace(/chh/g, "c")
    .replace(/sh/g, "s")
    .replace(/sch/g, "s")
    .replace(/ph/g, "f")
    .replace(/bh/g, "b")
    .replace(/dh/g, "d")
    .replace(/th/g, "t")
    .replace(/gh/g, "g")
    .replace(/kh/g, "k")
    .replace(/zh/g, "j");

  // Single-character equivalents
  s = s
    .replace(/q/g, "k")
    .replace(/c/g, "k")
    .replace(/x/g, "ks")
    .replace(/z/g, "j")
    .replace(/j/g, "j")
    .replace(/w/g, "v")
    .replace(/v/g, "b");

  // Common Bangla vowel spelling variations
  s = s
    .replace(/aa/g, "a")
    .replace(/ae/g, "a")
    .replace(/ei/g, "e")
    .replace(/ey/g, "e")
    .replace(/ee/g, "i")
    .replace(/ii/g, "i")
    .replace(/iy/g, "i")
    .replace(/ou/g, "u")
    .replace(/oo/g, "u")
    .replace(/uu/g, "u");

  // -------------------------------------------------------
  // "h" is often inconsistent in Romanized Bangla names.
  //
  // Examples:
  // Rahim  -> raim
  // Fahim  -> faim
  // Shahin -> sain
  //
  // Keep an initial H because it can be meaningful:
  // Hasan should not become asan.
  // -------------------------------------------------------
  if (s.length > 1) {
    const first = s.charAt(0);
    s = first + s.slice(1).replace(/h/g, "");
  }

  // Collapse repeated letters:
  // Ariff -> arif
  // Rahmaan -> raman
  // etc.
  s = s.replace(/(.)\1+/g, "$1");

  // Keep only:
  // - numbers
  // - Latin letters
  // - Bangla Unicode block
  s = s.replace(/[^0-9a-z\u0980-\u09FF]/g, "");

  return s;
}

// Compute a match score for a record given the query.
function computeMatchScore(item, query) {
  if (!query) return 0;
  const q = String(query).toLowerCase().trim();
  if (!q) return 0;

  const name = String(item.name || "")
    .toLowerCase()
    .trim();
  const id = String(item.studentId || "")
    .toLowerCase()
    .trim();

  // Exact id match should be top priority
  if (id && id === q) return 100;

  // Exact name match (case-insensitive) -> highest priority for names
  if (name === q) return 95;

  // Token exact match (any word equals query)
  const nameTokens = name.split(/\s+/).filter(Boolean);
  if (nameTokens.includes(q)) return 90;

  // Phonetic key equality
  try {
    if (phoneticKey(name) && phoneticKey(name) === phoneticKey(q)) return 80;
  } catch (e) {
    // ignore phonetic errors
  }

  // Substring match
  if (name.includes(q)) return 70;

  return 0;
}

function applySort(list) {
  const sorted = [...list];
  const mode = sortByEl.value || "rank";

  switch (mode) {
    case "id":
      sorted.sort((a, b) => {
        const aId = String(a.studentId ?? "")
          .trim()
          .toLowerCase();
        const bId = String(b.studentId ?? "")
          .trim()
          .toLowerCase();

        if (aId === bId) {
          return (a.rank ?? Infinity) - (b.rank ?? Infinity);
        }

        return aId.localeCompare(bId, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });
      return sorted;

    case "az":
      sorted.sort((a, b) => {
        const aName = String(a.name ?? "").trim();
        const bName = String(b.name ?? "").trim();

        if (aName === bName) {
          return (a.rank ?? Infinity) - (b.rank ?? Infinity);
        }

        return aName.localeCompare(bName, undefined, {
          sensitivity: "base",
        });
      });
      return sorted;

    case "rank":
    default:
      sorted.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
      return sorted;
  }
}

function applyFilters(base) {
  const query = searchEl.value.trim().toLowerCase();
  const groupFilter = groupEl.value;
  const cgpaFilter = cgpaEl.value;

  let filtered = base;
  if (groupFilter !== "all") {
    filtered = filtered.filter(
      (r) => (r.group || "").toLowerCase() === groupFilter.toLowerCase(),
    );
  }
  if (cgpaFilter === "pass") {
    filtered = filtered.filter((r) => r.cgpa > 0);
  } else if (cgpaFilter === "fail") {
    filtered = filtered.filter((r) => r.cgpa === 0);
  }
  if (query) {
    filtered = filtered.filter((r) => {
      const name = (r.name || "").toLowerCase();
      const id = String(r.studentId || "");
      return (
        name.includes(query) ||
        id.includes(query) ||
        phoneticKey(name).includes(phoneticKey(query))
      );
    });
  }

  const sorted = applySort(filtered);
  return sorted;
}

function render(resetVisibleCount = false) {
  if (resetVisibleCount) visibleCount = 20;
  const filtered = applyFilters(rankedData);
  const view = filtered.slice(0, visibleCount);
  renderTable(view);
  statusEl.textContent = `${view.length} shown · ${rankedData.length} total ranked entries`;
  loadMoreContainerEl.hidden = view.length >= filtered.length;
}

async function loadExam(file) {
  statusEl.textContent = `Loading ${file}…`;
  rowsEl.innerHTML = "";
  loadMoreContainerEl.hidden = true;
  visibleCount = 20;
  pageTitleEl.textContent = `NGDC - ${EXAM_LABELS[file] || file}`;
  document.title = `NGDC - ${EXAM_LABELS[file] || file} Leaderboard`;

  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();

    const clean = raw
      .filter((item) => item && !item.error)
      .map((item) => ({
        ...item,
        totalMarks: computeTotal(item.subjects),
        gpa: numeric(item.gpa),
        cgpa: numeric(item.cgpa),
      }))
      .sort((a, b) => {
        if (b.cgpa !== a.cgpa) return b.cgpa - a.cgpa;
        if (b.gpa !== a.gpa) return b.gpa - a.gpa;
        if (b.totalMarks !== a.totalMarks) return b.totalMarks - a.totalMarks;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });

    rankedData = assignRanks(clean);
    render();
  } catch (err) {
    rankedData = [];
    statusEl.innerHTML = `<span class="error">Failed to load ${file}: ${err.message}</span>`;
  }
}

examEl.addEventListener("change", () => loadExam(examEl.value));
groupEl.addEventListener("change", () => render(true));
cgpaEl.addEventListener("change", () => render(true));
sortByEl.addEventListener("change", () => render(true));
searchEl.addEventListener("input", () => {
  window.clearTimeout(searchEl._timer);
  searchEl._timer = window.setTimeout(() => render(true), 120);
});
loadMoreEl.addEventListener("click", () => {
  visibleCount += 20;
  render();
});

loadExam(examEl.value);
scheduleSpooderPromo();
