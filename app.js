const data = window.ELGEN_DATA;
const learned = new Set(JSON.parse(localStorage.getItem("elgenLearned") || "[]"));

const cards = document.querySelector("#cards");
const search = document.querySelector("#search");
const category = document.querySelector("#category");
const progressText = document.querySelector("#progressText");
const tabLearn = document.querySelector("#tabLearn");
const tabQuiz = document.querySelector("#tabQuiz");
const learnView = document.querySelector("#learnView");
const quizView = document.querySelector("#quizView");
const quizImage = document.querySelector("#quizImage");
const quizTitle = document.querySelector("#quizTitle");
const quizOptions = document.querySelector("#quizOptions");
const quizFeedback = document.querySelector("#quizFeedback");
const nextQuiz = document.querySelector("#nextQuiz");

let quizIndex = 0;
let shuffledQuiz = shuffle([...data.items]);

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function saveProgress() {
  localStorage.setItem("elgenLearned", JSON.stringify([...learned]));
  progressText.textContent = Math.round((learned.size / data.items.length) * 100) + "%";
}

function fillCategories() {
  const cats = ["全部分类", ...new Set(data.items.map(item => item.category))];
  category.innerHTML = cats.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join("");
}

function translateBullet(text) {
  const line = text.toLowerCase();
  if (line.includes("low pressure") && line.includes("medium")) return "用于低压或中压风管系统。";
  if (line.includes("low pressure")) return "主要用于低压风管系统。";
  if (line.includes("high pressure")) return "可用于高压风管系统。";
  if (line.includes("damper")) return "带风阀或与风量调节有关。";
  if (line.includes("stitch welded") || line.includes("welded seam")) return "焊接缝能增加强度，也能减少漏风。";
  if (line.includes("one piece")) return "由整片金属成型，结构更简单稳固。";
  if (line.includes("galvanized") || line.includes("g60") || line.includes("astm")) return "材料通常是镀锌钢板，注意规格和厚度。";
  if (line.includes("optional construction")) return "可以按项目需要选择特殊结构。";
  if (line.includes("made in usa")) return "美国制造。";
  if (line.includes("airflow") || line.includes("air flow")) return "重点和空气流动、风量控制有关。";
  if (line.includes("seal") || line.includes("leakage")) return "重点是密封、防漏风。";
  if (line.includes("smacna")) return "符合 SMACNA 风管行业标准要求。";
  return "";
}

function renderImageGallery(item) {
  const images = item.images || [];
  if (!images.length) return `<div class="image-empty">暂无图片</div>`;
  const visible = images.slice(0, 6);
  return `
    <div class="gallery-label">本页相关图片</div>
    <div class="image-grid count-${Math.min(visible.length, 6)}">
      ${visible.map((src, index) => `<img src="${src}" alt="${escapeHtml(item.title)} 图 ${index + 1}">`).join("")}
    </div>
  `;
}

function renderCards() {
  const q = search.value.trim().toLowerCase();
  const cat = category.value;
  const filtered = data.items.filter(item => {
    const matchesCat = cat === "全部分类" || item.category === cat;
    const hay = `${item.title} ${item.cnName} ${item.category} ${item.cnExplain || ""} ${item.enExplain || ""}`.toLowerCase();
    return matchesCat && hay.includes(q);
  });

  cards.innerHTML = filtered.map(item => {
    const keyPoints = (item.bullets || []).slice(0, 3).map(bullet => {
      const zh = translateBullet(bullet);
      return `<li><span>${escapeHtml(zh || "原文重点")}</span><small>${escapeHtml(bullet)}</small></li>`;
    }).join("");
    const keywords = (item.keywords || []).map(k => `<span>${escapeHtml(k)}</span>`).join("");
    const done = learned.has(item.id);

    return `<article class="card">
      <div class="image-box">${renderImageGallery(item)}</div>
      <div class="card-body">
        <div class="category">${escapeHtml(item.category)}</div>
        <h2>${escapeHtml(item.title)}</h2>
        <div class="cn">${escapeHtml(item.cnName)}</div>
        <p class="intro">${escapeHtml(item.cnExplain || item.intro)}</p>
        <div class="english">
          <strong>可以这样用英文介绍</strong>
          <p>${escapeHtml(item.phrase || item.enExplain || "")}</p>
        </div>
        ${keywords ? `<div class="keywords">${keywords}</div>` : ""}
        ${keyPoints ? `<ul class="keypoints">${keyPoints}</ul>` : ""}
        <div class="card-actions">
          <button class="mark ${done ? "done" : ""}" data-id="${item.id}" type="button">${done ? "已掌握" : "标记掌握"}</button>
          <span class="page">PDF 第 ${item.page} 页</span>
        </div>
      </div>
    </article>`;
  }).join("");
}

cards.addEventListener("click", event => {
  const button = event.target.closest(".mark");
  if (!button) return;
  const id = button.dataset.id;
  if (learned.has(id)) learned.delete(id);
  else learned.add(id);
  saveProgress();
  renderCards();
});

function showLearn() {
  tabLearn.classList.add("active");
  tabQuiz.classList.remove("active");
  learnView.classList.remove("hidden");
  quizView.classList.add("hidden");
}

function showQuiz() {
  tabQuiz.classList.add("active");
  tabLearn.classList.remove("active");
  learnView.classList.add("hidden");
  quizView.classList.remove("hidden");
  renderQuiz();
}

function quizOptionsFor(item) {
  const options = [item.cnName];
  for (const other of shuffle([...data.items])) {
    if (other.cnName !== item.cnName && !options.includes(other.cnName)) options.push(other.cnName);
    if (options.length === 4) break;
  }
  return shuffle(options);
}

function renderQuiz() {
  const item = shuffledQuiz[quizIndex % shuffledQuiz.length];
  quizImage.src = (item.images || [])[0] || "";
  quizImage.alt = item.title;
  quizTitle.textContent = item.title;
  quizFeedback.textContent = "请选择这个英文产品名最接近的中文意思。";
  quizOptions.innerHTML = quizOptionsFor(item).map(option =>
    `<button type="button" data-answer="${escapeHtml(option)}">${escapeHtml(option)}</button>`
  ).join("");
}

quizOptions.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  const item = shuffledQuiz[quizIndex % shuffledQuiz.length];
  [...quizOptions.querySelectorAll("button")].forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.answer === item.cnName) btn.classList.add("correct");
  });
  if (button.dataset.answer === item.cnName) {
    button.classList.add("correct");
    quizFeedback.textContent = `答对了。英文介绍：${item.enExplain || item.phrase || ""}`;
  } else {
    button.classList.add("wrong");
    quizFeedback.textContent = `正确答案是 ${item.cnName}。英文介绍：${item.enExplain || item.phrase || ""}`;
  }
});

nextQuiz.addEventListener("click", () => {
  quizIndex += 1;
  renderQuiz();
});

search.addEventListener("input", renderCards);
category.addEventListener("change", renderCards);
tabLearn.addEventListener("click", showLearn);
tabQuiz.addEventListener("click", showQuiz);

fillCategories();
saveProgress();
renderCards();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
