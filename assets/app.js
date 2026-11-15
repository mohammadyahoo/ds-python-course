(function () {
  "use strict";

  var COURSE = window.COURSE || { sessions: [], datasets: [] };
  var CONFIG = window.SITE_CONFIG || {};
  var DRIVE = window.DRIVE || { sessions: {}, data: {} };
  var S = COURSE.sessions;
  var app = document.getElementById("app");
  var STORE_KEY = "dsp-course-settings-v1";

  /* ---------- settings ---------- */
  var DEFAULTS = {
    user: "", repo: "", branch: "main",
    start: "", days: [0, 2, 4], time: "", form: "", group: ""
  };
  function loadSettings() {
    var s = {};
    try { s = JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {}; } catch (e) { s = {}; }
    var out = {};
    Object.keys(DEFAULTS).forEach(function (k) { out[k] = s[k] !== undefined ? s[k] : DEFAULTS[k]; });
    return out;
  }
  function saveSettings(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
  }
  var settings = loadSettings();

  function repoInfo() {
    var user = settings.user || CONFIG.user || "";
    var repo = settings.repo || CONFIG.repo || "";
    var host = location.hostname;
    if ((!user || !repo) && /\.github\.io$/.test(host)) {
      user = user || host.split(".")[0];
      var seg = location.pathname.split("/").filter(Boolean)[0];
      repo = repo || seg || "";
    }
    return { user: user, repo: repo, branch: settings.branch || CONFIG.branch || "main" };
  }

  /* ---------- helpers ---------- */
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function md(t) { return esc(t).replace(/`([^`]+)`/g, "<code>$1</code>"); }
  function plain(t) { return String(t || "").replace(/`/g, ""); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function byNum(n) { for (var i = 0; i < S.length; i++) if (S[i].n === n) return S[i]; return null; }
  function file(s, kind) {
    var name = "S" + pad(s.n) + "_" + kind;
    return s.files.indexOf(name) >= 0 ? name : null;
  }
  function localUrl(s, f) { return "materials/" + s.slug + "/" + f; }
  function driveId(s, f) {
    var rec = DRIVE.sessions && DRIVE.sessions[String(s.n)];
    return rec && f ? rec[f.split("_").slice(1).join("_")] || null : null;
  }
  function driveView(id) { return "https://drive.google.com/file/d/" + id + "/view"; }
  function driveFolder(id) { return "https://drive.google.com/drive/folders/" + id; }
  function colabUrl(s, f) {
    var id = driveId(s, f);
    if (id && /\.ipynb$/.test(f)) return "https://colab.research.google.com/drive/" + id;
    var r = repoInfo();
    if (!r.user || !r.repo || !f) return null;
    return "https://colab.research.google.com/github/" + r.user + "/" + r.repo + "/blob/" + r.branch + "/materials/" + s.slug + "/" + f;
  }
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }
  function copyText(text) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast("تم النسخ"); } catch (e) { toast("انسخ النص يدوياً"); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast("تم النسخ"); }, fallback);
    } else { fallback(); }
  }

  var ICON = {
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2z"/><path d="M22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    slides: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
  };

  /* ---------- schedule ---------- */
  var DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  function schedule() {
    var out = {};
    if (!settings.start || !settings.days || !settings.days.length) return out;
    var parts = settings.start.split("-");
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    if (isNaN(d)) return out;
    var n = 1, guard = 0;
    while (n <= S.length && guard < 1000) {
      if (settings.days.indexOf(d.getDay()) >= 0) { out[n] = new Date(d); n++; }
      d.setDate(d.getDate() + 1); guard++;
    }
    return out;
  }
  function fmtDate(d) {
    if (!d) return "";
    try {
      return new Intl.DateTimeFormat("ar-u-nu-latn", { weekday: "long", day: "numeric", month: "long" }).format(d);
    } catch (e) { return DAY_NAMES[d.getDay()] + " " + d.getDate() + "/" + (d.getMonth() + 1); }
  }
  function today() { var t = new Date(); t.setHours(0, 0, 0, 0); return t; }
  function nextSessionNum() {
    var sch = schedule(), t = today();
    for (var i = 0; i < S.length; i++) { var d = sch[S[i].n]; if (d && d >= t) return S[i].n; }
    return null;
  }

  /* ---------- messages ---------- */
  var PART_AR = { A: "أساسي", B: "متوسط", C: "تحدي", D: "المشروع التراكمي", E: "كويز" };
  function link(s, kind) {
    var f = file(s, kind);
    return colabUrl(s, f) || "[رابط Colab: اكتب اسم حسابك على GitHub بصفحة الإعدادات]";
  }
  function msgBefore(s) {
    var sch = schedule(), d = sch[s.n];
    var lines = ["أهلًا شباب 👋", "", "الجلسة " + s.n + ": " + s.title];
    if (s.project) lines.push("🏁 هي جلسة " + projectAr(s.n));
    if (d) lines.push("📅 " + fmtDate(d) + (settings.time ? " الساعة " + settings.time : ""));
    lines.push("", "رح نتعلم:");
    s.objectives.forEach(function (o) { lines.push("• " + plain(o)); });
    lines.push("", "📒 دفتر المحاضرة:", link(s, "lecture.ipynb"), "",
      "افتحوه من Chrome، واعملوا نسخة إلكن من File ثم Save a copy in Drive قبل ما تكتبوا فيه.", "",
      "منشوفكم بالجلسة 🌟");
    return lines.join("\n");
  }
  function msgHomework(s) {
    var sch = schedule(), next = sch[s.n + 1];
    var lines = ["📝 وظيفة الجلسة " + s.n + ": " + s.title, "", link(s, "exercises.ipynb"), "", "الوظيفة فيها:"];
    var groups = {};
    s.exercises.forEach(function (e) { (groups[e.part] = groups[e.part] || []).push(e.title); });
    ["A", "B", "C", "D"].forEach(function (p) {
      if (groups[p]) lines.push("• Part " + p + " (" + PART_AR[p] + "): " + groups[p].join("، "));
    });
    lines.push("• Part E: كويز قصير بآخر الدفتر", "",
      "طريقة التسليم:",
      "1. افتحوا الرابط واعملوا File ثم Save a copy in Drive",
      "2. حلّوا بالنسخة تبعكن وشغّلوا كل الخلايا",
      "3. Share ثم General access: Anyone with the link ثم Viewer ثم Copy link",
      "4. ابعتوا الرابط عالفورم: " + (settings.form || "[رابط الفورم]"), "",
      "⏰ آخر موعد: " + (next ? "قبل جلسة " + fmtDate(next) : "[الموعد]"), "",
      "من الموبايل: افتحوا الرابط من Chrome مو من تطبيق Drive، وإذا ما بيطلع زر Share اختاروا Desktop site من قائمة Chrome.", "",
      "بالتوفيق 💪");
    return lines.join("\n");
  }
  function msgSolution(s) {
    var sch = schedule(), nxt = byNum(s.n + 1), d = nxt ? sch[nxt.n] : null;
    var lines = ["✅ حل وظيفة الجلسة " + s.n + ": " + s.title, "", link(s, "solutions.ipynb"), "",
      "قارنوا حلكن بالحل خطوة خطوة. غالباً في أكتر من طريقة صحيحة، المهم تكون النتيجة صح والكود واضح.",
      "إذا في شي مو واضح، اسألوا هون بالجروب أو بأول الجلسة الجاية."];
    if (nxt) {
      lines.push("", "الجلسة الجاية: " + nxt.title + (d ? " 📅 " + fmtDate(d) + (settings.time ? " الساعة " + settings.time : "") : ""));
    } else {
      lines.push("", "مبروك خلصتوا الكورس 🎉");
    }
    return lines.join("\n");
  }
  function projectAr(n) {
    return { 14: "المشروع الأول", 25: "المشروع الثاني", 44: "المشروع الثالث", 52: "المشروع الرابع، مشروع التخرج" }[n] || "مشروع";
  }

  /* ---------- views ---------- */
  function setNav(key) {
    Array.prototype.forEach.call(document.querySelectorAll("#mainnav a"), function (a) {
      a.classList.toggle("active", a.getAttribute("data-nav") === key);
    });
  }

  function viewHome() {
    setNav("home");
    var nextN = nextSessionNum(), sch = schedule();
    var r = repoInfo();
    var html = '<section class="hero"><h1>Data Science with Python</h1>' +
      '<p>كل مواد الكورس بمكان واحد: دفاتر Colab، العروض التقديمية، والرسائل الجاهزة للنشر لكل جلسة، من أول جلسة لآخر جلسة.</p>' +
      '<div class="stats"><div class="stat"><b>52</b><span>جلسة</span></div><div class="stat"><b>3</b><span>مستويات</span></div>' +
      '<div class="stat"><b>8</b><span>مراحل</span></div><div class="stat"><b>4</b><span>مشاريع</span></div>' +
      '<div class="stat"><b>' + COURSE.datasets.length + '</b><span>ملف داتا</span></div></div></section>';

    if (DRIVE.root) {
      html += '<div class="card next-card" style="margin-bottom:16px"><div><div style="font-weight:700;color:var(--navy)">كل مواد الكورس على Google Drive</div>' +
        '<div class="muted small">مجلد واحد فيه كل الجلسات مرتبة حسب المستوى والمرحلة، والداتا والقوالب. كل الملفات مشاركة Viewer.</div></div>' +
        '<a class="btn primary" target="_blank" rel="noopener" href="' + driveFolder(DRIVE.root) + '">' + ICON.ext + 'افتح مجلد الكورس</a></div>';
    }
    if (!DRIVE.root && (!r.user || !r.repo)) {
      html += '<div class="note" style="margin-bottom:16px">روابط Colab لسا ما اشتغلت: اكتب اسم حسابك على GitHub واسم الـ repository بصفحة <a href="#/settings">الإعدادات</a>. إذا الموقع منشور على GitHub Pages بيتعرّف عليهن لحاله.</div>';
    }
    if (nextN) {
      var ns = byNum(nextN);
      html += '<div class="card next-card"><div><div class="muted small">الجلسة الجاية · ' + esc(fmtDate(sch[nextN])) + (settings.time ? " · " + esc(settings.time) : "") + '</div>' +
        '<div style="font-size:21px;font-weight:700;color:var(--navy)" class="en">' + esc(ns.title) + '</div></div>' +
        '<div style="display:flex;gap:10px;align-items:center"><span class="num">' + pad(nextN) + '</span>' +
        '<a class="btn primary" href="#/s/' + pad(nextN) + '">افتح الجلسة</a></div></div>';
    } else if (!settings.start) {
      html += '<div class="note info">حط تاريخ أول جلسة وأيام الأسبوع بصفحة <a href="#/settings">الإعدادات</a>، وبيطلعلك موعد كل جلسة وبيتعبّى بالرسائل لحاله.</div>';
    }

    html += '<div class="section-title"><h2>الجلسات</h2><input class="search" id="q" type="search" placeholder="دوّر على جلسة: pandas، Streamlit، 31..." aria-label="بحث"></div>';
    html += '<div id="stages"></div>';
    app.innerHTML = html;
    var q = document.getElementById("q");
    function draw() {
      var term = (q.value || "").trim().toLowerCase();
      var out = "", stages = {};
      S.forEach(function (s) {
        var hay = (s.title + " " + s.objectives.join(" ") + " " + s.stageName + " " + s.n).toLowerCase();
        if (term && hay.indexOf(term) < 0) return;
        (stages[s.stage] = stages[s.stage] || { name: s.stageName, level: s.level, items: [] }).items.push(s);
      });
      Object.keys(stages).sort(function (a, b) { return a - b; }).forEach(function (k) {
        var st = stages[k], first = st.items[0].n, last = st.items[st.items.length - 1].n;
        out += '<section class="stage"><div class="stage-head"><span class="stage-badge">' + k + '</span><h3>' + esc(st.name) + '</h3>' +
          '<span class="pill">المستوى ' + st.level + '</span><span class="muted small">الجلسات ' + first + ' إلى ' + last + '</span></div><div class="sessions">';
        st.items.forEach(function (s) {
          var d = sch[s.n];
          out += '<a class="s-card' + (s.project ? " is-project" : "") + (s.n === nextN ? " is-next" : "") + '" href="#/s/' + pad(s.n) + '">' +
            '<span class="s-num">' + pad(s.n) + '</span><span><div class="s-title">' + esc(s.title) + '</div>' +
            '<div class="s-meta">' + (s.project ? '<span class="pill project">' + projectAr(s.n) + '</span> ' : "") + (d ? esc(fmtDate(d)) : "") + '</div></span></a>';
        });
        out += "</div></section>";
      });
      document.getElementById("stages").innerHTML = out || '<div class="empty">ما في جلسة بهالاسم.</div>';
    }
    q.addEventListener("input", draw);
    draw();
  }

  function matCard(icon, title, desc, s, kind, extra) {
    var f = file(s, kind);
    if (!f) return "";
    var colab = /\.ipynb$/.test(f) ? colabUrl(s, f) : null;
    var actions = "";
    if (/\.ipynb$/.test(f)) {
      actions += colab ? '<a class="btn primary" target="_blank" rel="noopener" href="' + esc(colab) + '">' + ICON.ext + 'افتح بـ Colab</a>'
        : '<a class="btn primary" aria-disabled="true" title="اكتب حساب GitHub بالإعدادات">' + ICON.ext + 'افتح بـ Colab</a>';
      actions += '<button class="btn" data-copy="' + esc(colab || "") + '"' + (colab ? "" : ' aria-disabled="true"') + '>' + ICON.copy + 'انسخ الرابط</button>';
    }
    var did = driveId(s, f);
    if (!/\.ipynb$/.test(f) && did) {
      actions += '<a class="btn primary" target="_blank" rel="noopener" href="' + esc(driveView(did)) + '">' + ICON.ext + 'افتح بـ Drive</a>';
      actions += '<button class="btn" data-copy="' + esc(driveView(did)) + '">' + ICON.copy + 'انسخ الرابط</button>';
    }
    actions += '<a class="btn" href="' + esc(localUrl(s, f)) + '" download>' + ICON.down + 'تنزيل</a>';
    if (extra) actions += extra;
    return '<div class="card mat"><div class="kind"><span class="ico">' + icon + '</span><h3>' + title + '</h3></div>' +
      '<p>' + desc + '</p><div class="file-name">' + esc(f) + '</div><div class="actions">' + actions + '</div></div>';
  }

  function viewSession(n) {
    setNav("home");
    var s = byNum(n);
    if (!s) { app.innerHTML = '<div class="empty">ما لقيت هالجلسة. <a href="#/">ارجع للجلسات</a></div>'; return; }
    var sch = schedule(), d = sch[s.n], prev = byNum(n - 1), next = byNum(n + 1);
    var pdf = file(s, "slides.pdf");
    var html = '<div class="crumbs"><a href="#/">الجلسات</a> / المرحلة ' + s.stage + ' · <span class="en">' + esc(s.stageName) + '</span></div>';
    html += '<div class="s-head"><div><div class="eyebrow">الجلسة ' + pad(s.n) + ' من 52 · المستوى ' + s.level + (d ? " · " + esc(fmtDate(d)) : "") + '</div>' +
      '<h1>' + esc(s.title) + '</h1>' + (s.project ? '<span class="pill project">' + projectAr(s.n) + '</span>' : "") + '</div>' +
      '<div class="s-nav">' + (DRIVE.sessions && DRIVE.sessions[String(s.n)] ? '<a class="btn" target="_blank" rel="noopener" href="' + driveFolder(DRIVE.sessions[String(s.n)].folder) + '">مجلد الجلسة بـ Drive</a>' : "") + (prev ? '<a class="btn" href="#/s/' + pad(prev.n) + '">السابقة</a>' : "") + (next ? '<a class="btn" href="#/s/' + pad(next.n) + '">التالية</a>' : "") + '</div></div>';

    html += '<div class="materials">' +
      matCard(ICON.slides, "العرض التقديمي", "ملف PowerPoint مع ملاحظات المدرب تحت كل شريحة.", s, "slides.pptx",
        pdf ? '<a class="btn" target="_blank" rel="noopener" href="' + esc(driveId(s, pdf) ? driveView(driveId(s, pdf)) : localUrl(s, pdf)) + '">PDF</a>' : "") +
      matCard(ICON.book, "دفتر المحاضرة", "الشرح والكود اللي بتشغّله بالجلسة، مع تمارين الصف.", s, "lecture.ipynb") +
      matCard(ICON.pen, "الوظيفة", "تمارين A و B و C و D مع كويز. هاد الرابط اللي بتبعته للطلاب.", s, "exercises.ipynb") +
      matCard(ICON.check, "الحلول", "حل تمارين الصف والوظيفة والكويز. ابعته بعد آخر موعد للتسليم.", s, "solutions.ipynb") +
      '</div>';

    html += '<div class="section-title"><h2>الرسائل الجاهزة للنشر</h2><span class="muted small">بتقدر تعدّل النص قبل النسخ</span></div>';
    html += '<div class="card"><div class="tabs" role="tablist">' +
      '<button class="tab" role="tab" data-msg="before" aria-selected="true">قبل الجلسة</button>' +
      '<button class="tab" role="tab" data-msg="homework" aria-selected="false">الوظيفة</button>' +
      '<button class="tab" role="tab" data-msg="solution" aria-selected="false">حل الوظيفة</button></div>' +
      '<textarea class="msg-box" id="msg" aria-label="نص الرسالة"></textarea>' +
      '<div class="msg-bar"><span class="muted small" id="msg-hint"></span><button class="btn primary" id="copy-msg">' + ICON.copy + 'انسخ الرسالة</button></div></div>';

    html += '<div class="grid2" style="margin-top:16px">';
    html += '<div class="card"><h3>عن الجلسة</h3><p class="where en-block">' + md(s.where) + '</p>' +
      '<h3 style="margin-top:14px">أهداف الجلسة</h3><ol class="objectives en-block">' +
      s.objectives.map(function (o) { return "<li>" + md(o) + "</li>"; }).join("") + '</ol></div>';
    html += '<div class="card"><h3>تمارين الصف</h3><ol class="objectives en-block">' +
      s.inclass.map(function (o) { return "<li>" + md(o) + "</li>"; }).join("") + '</ol>' +
      '<h3 style="margin-top:14px">الوظيفة</h3><ul class="ex-list">' +
      s.exercises.map(function (e) { return '<li><span class="part ' + e.part + '">' + e.part + '</span><span>' + md(e.title) + '</span></li>'; }).join("") +
      '<li><span class="part">E</span><span>Quiz</span></li></ul></div>';
    html += '</div>';

    html += '<div class="section-title"><h2>قبل الجلسة</h2></div><div class="card"><ol style="margin:0;padding-inline-start:22px">' +
      '<li>افتح العرض التقديمي واقرأ ملاحظات المدرب تحت الشرائح.</li>' +
      '<li>شغّل دفتر المحاضرة بـ Colab من أوله لآخره لتتأكد إنه كل شي شغّال.</li>' +
      '<li>انشر رسالة "قبل الجلسة" بالجروب.</li>' +
      '<li>بعد الجلسة انشر رسالة "الوظيفة"، وبعد آخر موعد للتسليم انشر رسالة "حل الوظيفة".</li></ol></div>';
    app.innerHTML = html;

    var box = document.getElementById("msg"), current = "before";
    var builders = { before: msgBefore, homework: msgHomework, solution: msgSolution };
    var hints = {
      before: "انشرها قبل الجلسة بيوم أو بنفس اليوم الصبح.",
      homework: "انشرها بعد الجلسة مباشرة.",
      solution: "انشرها بعد آخر موعد للتسليم."
    };
    function show(kind) {
      current = kind;
      box.value = builders[kind](s);
      document.getElementById("msg-hint").textContent = hints[kind];
      Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
        t.setAttribute("aria-selected", t.getAttribute("data-msg") === kind ? "true" : "false");
      });
    }
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
      t.addEventListener("click", function () { show(t.getAttribute("data-msg")); });
    });
    document.getElementById("copy-msg").addEventListener("click", function () { copyText(box.value); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-copy]"), function (b) {
      b.addEventListener("click", function () { var u = b.getAttribute("data-copy"); if (u) copyText(u); });
    });
    show("before");
  }

  function viewGuide() {
    setNav("guide");
    var r = repoInfo();
    var site = r.user && r.repo ? "https://" + r.user + ".github.io/" + r.repo + "/" : "https://USERNAME.github.io/ds-python-course/";
    app.innerHTML = '<div class="prose">' +
      '<h2>كيف تستعمل الموقع</h2>' +
      '<ol><li>من صفحة <a href="#/settings">الإعدادات</a> حط تاريخ أول جلسة وأيام الأسبوع والساعة ورابط فورم التسليم. هالمعلومات بتتعبّى لحالها بالرسائل.</li>' +
      '<li>افتح الجلسة من صفحة <a href="#/">الجلسات</a>. فوق بتلاقي العرض التقديمي والدفاتر الثلاثة، وتحتهن الرسائل الثلاث الجاهزة.</li>' +
      '<li>كل رسالة بتقدر تعدّلها قبل ما تنسخها. التعديل ما بينحفظ، فإذا بدك تغيير دائم غيّر الإعدادات.</li></ol>' +
      '<h2>روتين كل جلسة</h2>' +
      '<div class="table-wrap"><table><thead><tr><th>متى</th><th>شو بتعمل</th></tr></thead><tbody>' +
      '<tr><td>قبل الجلسة بيوم</td><td>راجع العرض وشغّل دفتر المحاضرة بـ Colab من أوله لآخره. انشر رسالة "قبل الجلسة".</td></tr>' +
      '<tr><td>بالجلسة</td><td>اعرض الشرائح، وشغّل الكود الحي من دفتر المحاضرة، وحلّوا تمارين الصف سوا.</td></tr>' +
      '<tr><td>بعد الجلسة</td><td>انشر رسالة "الوظيفة".</td></tr>' +
      '<tr><td>بعد آخر موعد</td><td>صحّح الوظائف وانشر رسالة "حل الوظيفة".</td></tr></tbody></table></div>' +
      '<h2>روابط Colab</h2>' +
      '<p>زر "افتح بـ Colab" بيفتح الدفتر من Google Drive، والدفاتر كلها مشاركة Viewer، فما بتحتاج تغيّر أي صلاحيات.</p>' +
      '<p>لما الطالب يفتح الرابط بيشوف الدفتر، بس ما بيقدر يحفظ عليه. لحتى يحفظ شغله لازم يعمل <code>File</code> ثم <code>Save a copy in Drive</code>. هالخطوة مكتوبة بالرسائل.</p>' +
      '<h2>إذا الطالب ما قدر يفتح الرابط</h2>' +
      '<ul><li><b>فاتح من تطبيق Drive عالموبايل:</b> التطبيق ما بيفتح دفاتر Colab. لازم يفتح الرابط من Chrome.</li>' +
      '<li><b>مو مسجل دخول:</b> Colab بيطلب حساب Google. بيسجل دخول وبيرجع يفتح الرابط.</li>' +
      '<li><b>ما في زر Share عالموبايل:</b> من قائمة Chrome بيختار Desktop site.</li>' +
      '<li><b>الرابط ناقص:</b> جرّب الرابط بنافذة تصفح خفي، لأنها بتوريك شو بيشوف الطالب بالضبط.</li></ul>' +
      '<h2>تسليم الوظيفة</h2>' +
      '<ol><li>الطالب بيعمل نسخة من الدفتر بـ Drive تبعه، وبيحل فيها.</li>' +
      '<li>بيكبس Share، وبيغيّر General access لـ Anyone with the link مع Viewer، وبينسخ الرابط.</li>' +
      '<li>بيبعت الرابط بالفورم. حط رابط الفورم بالإعدادات لحتى يطلع بالرسالة.</li></ol>' +
      '<h2>الداتا</h2>' +
      '<p>الدفاتر بتحمّل الداتا من مجلد <code>data</code> بهاد الـ repository. تفاصيل كل ملف بصفحة <a href="#/data">الداتا</a>.</p>' +
      '<h2>Google Drive</h2>' +
      '<p>كل مواد الكورس كمان موجودة على Google Drive بحساب eng.mohammad.labania@gmail.com، بمجلد اسمه Data Science with Python - Teknova. أزرار "افتح بـ Colab" بالموقع بتفتح الدفاتر من الـ Drive، وكل الملفات مشاركة Viewer لأي حدا معه الرابط.</p>' +
      (DRIVE.root ? '<p><a class="btn primary" target="_blank" rel="noopener" href="' + driveFolder(DRIVE.root) + '">افتح مجلد الكورس</a></p>' : "") +
      '<p class="muted small">انتبه: مجلد الكورس نفسه فيه الحلول. شارك روابط الملفات مع الطلاب، مو رابط المجلد.</p>' +
      '<h2>رابط الموقع</h2>' +
      '<p>بعد ما ينفعل GitHub Pages بيصير رابط الموقع هيك:</p><pre class="code">' + esc(site) + '</pre>' +
      '<p class="muted small">الرسائل والإعدادات بتنحفظ بالمتصفح اللي فاتح منه الموقع بس. إذا فتحت من جهاز تاني لازم تعيد تعبي الإعدادات.</p>' +
      '</div>';
  }

  function viewData() {
    setNav("data");
    var r = repoInfo();
    var base = r.user && r.repo ? "https://raw.githubusercontent.com/" + r.user + "/" + r.repo + "/" + r.branch + "/data/" : "https://raw.githubusercontent.com/USERNAME/ds-python-course/main/data/";
    var rows = COURSE.datasets.map(function (d) {
      return '<tr><td class="en"><a href="data/' + esc(d.file) + '" download>' + esc(d.file) + '</a>' + (DRIVE.data && DRIVE.data[d.file] ? ' · <a target="_blank" rel="noopener" href="' + driveView(DRIVE.data[d.file]) + '">Drive</a>' : "") + '</td><td class="en">' + d.rows.toLocaleString("en") +
        '</td><td class="en">' + d.cols + '</td><td class="en">' + esc(d.desc) + '</td><td class="en small">' + esc(d.sessions) + '</td></tr>';
    }).join("");
    app.innerHTML = '<div class="prose"><h2>ملفات الداتا</h2>' +
      '<p>كل الداتا مولّدة للتدريب ووهمية، فبتقدر تشاركها بحرية. الدفاتر بتقرأها من هاد الرابط:</p>' +
      '<pre class="code">DATA_URL = "' + esc(base) + '"\ndf = pd.read_csv(DATA_URL + "apartments.csv")</pre>' +
      '<div class="table-wrap"><table><thead><tr><th>الملف</th><th>الصفوف</th><th>الأعمدة</th><th>المحتوى</th><th>الجلسات</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="muted small">الجلسة 24 بتستعمل داتا Titanic من <code>seaborn.load_dataset</code>، والجلسة 34 بتستعمل داتا breast cancer اللي جاية مع scikit-learn.</p>' +
      '<h2>قوالب</h2><p><a href="templates/Course_Template.pptx" download>قالب العرض التقديمي (PPTX)</a> · <a href="templates/teknova_logo_transparent.png" download>شعار Teknova</a></p></div>';
  }

  function viewSettings() {
    setNav("settings");
    var r = repoInfo();
    var dayBoxes = DAY_NAMES.map(function (name, i) {
      return '<label><input type="checkbox" name="day" value="' + i + '"' + (settings.days.indexOf(i) >= 0 ? " checked" : "") + '> ' + name + '</label>';
    }).join("");
    app.innerHTML = '<div class="prose"><h2>الإعدادات</h2><p class="muted">بتنحفظ بهالمتصفح وبتستعمل بالرسائل والمواعيد.</p></div>' +
      '<form class="card form" id="settings-form">' +
      '<div class="field"><label for="f-start">تاريخ أول جلسة</label><input id="f-start" type="date" value="' + esc(settings.start) + '"><div class="hint">من هاد التاريخ بتنحسب مواعيد الـ52 جلسة على الأيام اللي بتختارها.</div></div>' +
      '<div class="field"><label>أيام الجلسات</label><div class="days">' + dayBoxes + '</div><div class="hint">الكورس 3 جلسات بالأسبوع.</div></div>' +
      '<div class="field"><label for="f-time">ساعة الجلسة</label><input id="f-time" type="text" placeholder="مثلاً 6 المسا" value="' + esc(settings.time) + '"></div>' +
      '<div class="field"><label for="f-form">رابط فورم تسليم الوظائف</label><input id="f-form" type="url" placeholder="https://forms.gle/..." value="' + esc(settings.form) + '"></div>' +
      '<div class="field"><label for="f-user">اسم حسابك على GitHub</label><input id="f-user" type="text" class="en" placeholder="' + esc(r.user || "username") + '" value="' + esc(settings.user) + '">' +
      '<div class="hint">اتركه فاضي إذا الموقع منشور على GitHub Pages، بيتعرّف عليه لحاله. الحالي: <code>' + esc(r.user || "غير محدد") + '</code></div></div>' +
      '<div class="field"><label for="f-repo">اسم الـ repository</label><input id="f-repo" type="text" class="en" placeholder="' + esc(r.repo || "ds-python-course") + '" value="' + esc(settings.repo) + '">' +
      '<div class="hint">الحالي: <code>' + esc(r.repo || "غير محدد") + '</code></div></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" type="submit">حفظ</button><button class="btn" type="button" id="reset">مسح الإعدادات</button></div>' +
      '</form>';
    document.getElementById("settings-form").addEventListener("submit", function (e) {
      e.preventDefault();
      settings.start = document.getElementById("f-start").value;
      settings.time = document.getElementById("f-time").value.trim();
      settings.form = document.getElementById("f-form").value.trim();
      settings.user = document.getElementById("f-user").value.trim();
      settings.repo = document.getElementById("f-repo").value.trim();
      settings.days = Array.prototype.map.call(document.querySelectorAll('input[name="day"]:checked'), function (x) { return +x.value; });
      toast(saveSettings(settings) ? "انحفظت الإعدادات" : "المتصفح ما سمح بالحفظ");
      viewSettings();
    });
    document.getElementById("reset").addEventListener("click", function () {
      settings = JSON.parse(JSON.stringify(DEFAULTS));
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
      toast("انمسحت الإعدادات"); viewSettings();
    });
  }

  /* ---------- router ---------- */
  function route() {
    var h = location.hash.replace(/^#\/?/, "");
    var m = h.match(/^s\/(\d+)/);
    if (m) viewSession(parseInt(m[1], 10));
    else if (h === "guide") viewGuide();
    else if (h === "data") viewData();
    else if (h === "settings") viewSettings();
    else viewHome();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();
