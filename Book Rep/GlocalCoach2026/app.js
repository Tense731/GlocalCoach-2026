/* ============================================
   GlocalCoach 2026 — Application Logic
   ============================================ */

// ─── DATA STORE ───
var STORAGE_KEY = 'glocalcoach2026';

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData();
  } catch (e) { return defaultData(); }
}

function defaultData() {
  return {
    sessions: [],
    totalHours: 0,
    coachName: '',
    coachCity: 'Toronto'
  };
}

function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

var appData = loadData();

// ─── UTILITY ───
function showToast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 2400);
}

// ─── STATUS BAR CLOCK ───
function updateClock() {
  var el = document.getElementById('statusTime');
  if (el) {
    var now = new Date();
    el.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}
updateClock();
setInterval(updateClock, 30000);

// ════════════════════════════════════════════
//  TAB NAVIGATION
// ════════════════════════════════════════════

function switchTab(tabId) {
  // Update nav buttons
  var navItems = document.querySelectorAll('.nav-item');
  for (var i = 0; i < navItems.length; i++) {
    navItems[i].classList.remove('active');
    if (navItems[i].getAttribute('data-tab') === tabId) {
      navItems[i].classList.add('active');
    }
  }
  // Update tab views
  var tabViews = document.querySelectorAll('.tab-view');
  for (var j = 0; j < tabViews.length; j++) {
    tabViews[j].classList.remove('active');
    if (tabViews[j].id === tabId) {
      tabViews[j].style.animation = 'none';
      tabViews[j].offsetHeight; // reflow
      tabViews[j].style.animation = '';
      tabViews[j].classList.add('active');
    }
  }
  // Draw dashboard if switching to it
  if (tabId === 'tabDashboard') {
    setTimeout(drawDashboard, 50);
  }
}

// Attach nav listeners with event delegation on the nav bar itself
document.addEventListener('DOMContentLoaded', function () {
  var bottomNav = document.getElementById('bottomNav');
  if (bottomNav) {
    bottomNav.addEventListener('click', function (e) {
      var btn = e.target.closest('.nav-item');
      if (btn) {
        var tabId = btn.getAttribute('data-tab');
        if (tabId) switchTab(tabId);
      }
    });
  }

  // Also attach directly to each nav-item as backup
  var navItems = document.querySelectorAll('.nav-item');
  for (var i = 0; i < navItems.length; i++) {
    (function (item) {
      item.addEventListener('click', function () {
        var tabId = item.getAttribute('data-tab');
        if (tabId) switchTab(tabId);
      });
    })(navItems[i]);
  }

  initQuickLog();
  initResourceLibrary();
  initLedger();
  updateSoulMeter();
  updateHoursRing();

  // Restore saved values
  if (appData.coachName) {
    var el = document.getElementById('coachName');
    if (el) el.value = appData.coachName;
  }
  if (appData.coachCity) {
    var el2 = document.getElementById('coachCity');
    if (el2) el2.value = appData.coachCity;
  }
});

// ════════════════════════════════════════════
//  FEATURE 1: QUICK-LOG
// ════════════════════════════════════════════

var currentCard = 0;
var totalCards = 5;
var ratings = {};
var ratingLabels = ['', 'Needs work', 'Developing', 'Competent', 'Proficient', 'Exemplary'];

function initQuickLog() {
  // Build dots
  var dotsContainer = document.getElementById('swipeDots');
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    for (var i = 0; i < totalCards; i++) {
      var dot = document.createElement('div');
      dot.className = 'swipe-dot' + (i === 0 ? ' active' : '');
      dotsContainer.appendChild(dot);
    }
  }

  showCard(0);

  // Prev/Next buttons
  var prevBtn = document.getElementById('prevCard');
  var nextBtn = document.getElementById('nextCard');
  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      if (currentCard > 0) { currentCard--; showCard(currentCard); }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      if (currentCard < totalCards - 1) { currentCard++; showCard(currentCard); }
    });
  }

  // Star ratings
  var starGroups = document.querySelectorAll('.star-rating');
  for (var g = 0; g < starGroups.length; g++) {
    setupStarGroup(starGroups[g]);
  }

  // Submit button
  var submitBtn = document.getElementById('submitLog');
  if (submitBtn) {
    submitBtn.addEventListener('click', submitLog);
  }

  // Touch swipe
  var deck = document.getElementById('swipeDeck');
  if (deck) {
    var touchStartX = 0;
    deck.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    deck.addEventListener('touchend', function (e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentCard < totalCards - 1) { currentCard++; showCard(currentCard); }
        else if (diff < 0 && currentCard > 0) { currentCard--; showCard(currentCard); }
      }
    }, { passive: true });
  }
}

function showCard(index) {
  var cards = document.querySelectorAll('.swipe-card');
  for (var i = 0; i < cards.length; i++) {
    cards[i].classList.remove('active');
    if (i === index) cards[i].classList.add('active');
  }
  var dots = document.querySelectorAll('.swipe-dot');
  for (var d = 0; d < dots.length; d++) {
    dots[d].classList.toggle('active', d === index);
  }
  var prevBtn = document.getElementById('prevCard');
  var nextBtn = document.getElementById('nextCard');
  if (prevBtn) prevBtn.disabled = index === 0;
  if (nextBtn) nextBtn.disabled = index === totalCards - 1;

  var submitBtn = document.getElementById('submitLog');
  if (submitBtn) {
    submitBtn.style.display = (index === totalCards - 1 && Object.keys(ratings).length > 0) ? 'flex' : 'none';
  }
}

function setupStarGroup(group) {
  var question = group.getAttribute('data-question');
  var stars = group.querySelectorAll('.star');
  var card = group.closest('.swipe-card');
  var cardIdx = card ? card.getAttribute('data-index') : '0';
  var label = document.getElementById('ratingLabel' + cardIdx);

  for (var s = 0; s < stars.length; s++) {
    (function (star, allStars) {
      star.addEventListener('mouseenter', function () {
        var v = parseInt(star.getAttribute('data-val'));
        for (var k = 0; k < allStars.length; k++) {
          allStars[k].classList.toggle('hovered', parseInt(allStars[k].getAttribute('data-val')) <= v);
        }
      });
      star.addEventListener('mouseleave', function () {
        for (var k = 0; k < allStars.length; k++) {
          allStars[k].classList.remove('hovered');
        }
      });
      star.addEventListener('click', function () {
        var v = parseInt(star.getAttribute('data-val'));
        ratings[question] = v;
        for (var k = 0; k < allStars.length; k++) {
          allStars[k].classList.toggle('active', parseInt(allStars[k].getAttribute('data-val')) <= v);
        }
        if (label) label.textContent = ratingLabels[v];
        if (parseInt(cardIdx) === totalCards - 1) {
          var submitBtn = document.getElementById('submitLog');
          if (submitBtn) submitBtn.style.display = 'flex';
        }
      });
    })(stars[s], stars);
  }
}

function submitLog() {
  if (Object.keys(ratings).length === 0) {
    showToast('Rate at least one prompt');
    return;
  }
  var session = {
    date: new Date().toISOString(),
    ratings: {}
  };
  for (var key in ratings) {
    session.ratings[key] = ratings[key];
  }
  appData.sessions.push(session);
  saveData(appData);
  updateSoulMeter();
  showToast('✓ Session logged!');

  // Reset
  for (var key in ratings) { delete ratings[key]; }
  var allStars = document.querySelectorAll('.star');
  for (var i = 0; i < allStars.length; i++) allStars[i].classList.remove('active');
  var labels = document.querySelectorAll('.rating-label');
  for (var j = 0; j < labels.length; j++) labels[j].textContent = 'Tap to rate';
  currentCard = 0;
  showCard(0);
}

function updateSoulMeter() {
  var sessions = appData.sessions;
  if (sessions.length === 0) return;
  var total = 0, count = 0;
  for (var i = 0; i < sessions.length; i++) {
    var vals = Object.values(sessions[i].ratings);
    for (var v = 0; v < vals.length; v++) { total += vals[v]; count++; }
  }
  var avg = count > 0 ? total / count : 0;
  var pct = Math.round((avg / 5) * 100);
  var circumference = 2 * Math.PI * 85;
  var offset = circumference - (pct / 100) * circumference;
  var fill = document.getElementById('soulFill');
  var val = document.getElementById('soulValue');
  if (fill) fill.style.strokeDashoffset = offset;
  if (val) val.textContent = pct + '%';
}

// ════════════════════════════════════════════
//  FEATURE 2: CQ DASHBOARD
// ════════════════════════════════════════════

function getCQDimensions() {
  var sessions = appData.sessions;
  var dimMap = {
    pedagogical_pivot: 'Strategy',
    local_analogy: 'Knowledge',
    inclusive_language: 'Action',
    cultural_constraint: 'Knowledge',
    athlete_voice: 'Drive'
  };
  var sums = { Drive: 0, Knowledge: 0, Strategy: 0, Action: 0 };
  var counts = { Drive: 0, Knowledge: 0, Strategy: 0, Action: 0 };

  for (var i = 0; i < sessions.length; i++) {
    var r = sessions[i].ratings;
    for (var q in r) {
      var dim = dimMap[q] || 'Drive';
      sums[dim] += r[q];
      counts[dim]++;
    }
  }

  return {
    Drive: counts.Drive > 0 ? sums.Drive / counts.Drive : 0,
    Knowledge: counts.Knowledge > 0 ? sums.Knowledge / counts.Knowledge : 0,
    Strategy: counts.Strategy > 0 ? sums.Strategy / counts.Strategy : 0,
    Action: counts.Action > 0 ? sums.Action / counts.Action : 0
  };
}

function drawRadarChart(values) {
  var canvas = document.getElementById('radarChart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  canvas.width = 340 * dpr;
  canvas.height = 340 * dpr;
  canvas.style.width = '340px';
  canvas.style.height = '340px';
  ctx.scale(dpr, dpr);

  var W = 340, H = 340;
  var cx = W / 2, cy = H / 2;
  var maxR = 130;
  var dims = ['Drive', 'Knowledge', 'Strategy', 'Action'];
  var colors = ['#2dd4bf', '#3b82f6', '#f59e0b', '#e879f9'];
  var angles = [];
  for (var i = 0; i < 4; i++) {
    angles.push((Math.PI * 2 * i) / 4 - Math.PI / 2);
  }

  ctx.clearRect(0, 0, W, H);

  // Grid rings
  for (var ring = 1; ring <= 5; ring++) {
    var r = (ring / 5) * maxR;
    ctx.beginPath();
    for (var i = 0; i <= 4; i++) {
      var a = angles[i % 4];
      var x = cx + Math.cos(a) * r;
      var y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Axis lines + labels
  for (var i = 0; i < dims.length; i++) {
    var a = angles[i];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    var lx = cx + Math.cos(a) * (maxR + 18);
    var ly = cy + Math.sin(a) * (maxR + 18);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dims[i], lx, ly);
  }

  // Benchmark overlay (3.5/5)
  ctx.beginPath();
  for (var i = 0; i <= 4; i++) {
    var a = angles[i % 4];
    var bR = (3.5 / 5) * maxR;
    var x = cx + Math.cos(a) * bR;
    var y = cy + Math.sin(a) * bR;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(245,158,11,0.25)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Data polygon
  var pts = [];
  for (var i = 0; i < dims.length; i++) {
    var val = (values[dims[i]] / 5) * maxR;
    pts.push({
      x: cx + Math.cos(angles[i]) * val,
      y: cy + Math.sin(angles[i]) * val
    });
  }

  ctx.beginPath();
  for (var i = 0; i < pts.length; i++) {
    if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
    else ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();

  var grad = ctx.createLinearGradient(cx - maxR, cy - maxR, cx + maxR, cy + maxR);
  grad.addColorStop(0, 'rgba(45,212,191,0.15)');
  grad.addColorStop(0.5, 'rgba(59,130,246,0.10)');
  grad.addColorStop(1, 'rgba(232,121,249,0.12)');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = 'rgba(45,212,191,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Data dots
  for (var i = 0; i < pts.length; i++) {
    ctx.beginPath();
    ctx.arc(pts[i].x, pts[i].y, 4, 0, Math.PI * 2);
    ctx.fillStyle = colors[i];
    ctx.fill();
    ctx.strokeStyle = '#0a0e1a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawTrendChart() {
  var canvas = document.getElementById('trendChart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  canvas.width = 340 * dpr;
  canvas.height = 120 * dpr;
  canvas.style.width = '340px';
  canvas.style.height = '120px';
  ctx.scale(dpr, dpr);

  var W = 340, H = 120;
  var sessions = appData.sessions.slice(-10);

  if (sessions.length < 2) {
    ctx.fillStyle = '#64748b';
    ctx.font = '500 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Log 2+ sessions to see trends', W / 2, H / 2);
    return;
  }

  var dataPoints = [];
  for (var i = 0; i < sessions.length; i++) {
    var vals = Object.values(sessions[i].ratings);
    var sum = 0;
    for (var v = 0; v < vals.length; v++) sum += vals[v];
    dataPoints.push(sum / vals.length);
  }

  var maxVal = 5;
  var pad = { l: 24, r: 12, t: 12, b: 24 };
  var plotW = W - pad.l - pad.r;
  var plotH = H - pad.t - pad.b;
  var stepX = plotW / (dataPoints.length - 1);

  for (var g = 0; g <= 5; g++) {
    var y = pad.t + plotH - (g / maxVal) * plotH;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(W - pad.r, y);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  var pts = [];
  for (var i = 0; i < dataPoints.length; i++) {
    pts.push({
      x: pad.l + i * stepX,
      y: pad.t + plotH - (dataPoints[i] / maxVal) * plotH
    });
  }

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pad.t + plotH);
  for (var i = 0; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.lineTo(pts[pts.length - 1].x, pad.t + plotH);
  ctx.closePath();
  var areaGrad = ctx.createLinearGradient(0, pad.t, 0, pad.t + plotH);
  areaGrad.addColorStop(0, 'rgba(45,212,191,0.12)');
  areaGrad.addColorStop(1, 'rgba(45,212,191,0)');
  ctx.fillStyle = areaGrad;
  ctx.fill();

  ctx.beginPath();
  for (var i = 0; i < pts.length; i++) {
    if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
    else ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = '#2dd4bf';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (var i = 0; i < pts.length; i++) {
    ctx.beginPath();
    ctx.arc(pts[i].x, pts[i].y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#2dd4bf';
    ctx.fill();
  }

  ctx.fillStyle = '#64748b';
  ctx.font = '500 9px Inter, sans-serif';
  ctx.textAlign = 'center';
  for (var i = 0; i < pts.length; i++) {
    ctx.fillText('S' + (i + 1), pts[i].x, H - 6);
  }
}

function updateBenchmarks() {
  var dims = getCQDimensions();
  var avg = (dims.Drive + dims.Knowledge + dims.Strategy + dims.Action) / 4;
  var deiPct = Math.min(Math.round((avg / 5) * 100), 100);
  var safePct = Math.min(Math.round(((avg + 0.3) / 5) * 100), 100);

  var deiFill = document.getElementById('deiFill');
  var deiVal = document.getElementById('deiVal');
  var safeFill = document.getElementById('safeFill');
  var safeVal = document.getElementById('safeVal');

  if (deiFill) deiFill.style.width = deiPct + '%';
  if (deiVal) deiVal.textContent = deiPct + '%';
  if (safeFill) safeFill.style.width = safePct + '%';
  if (safeVal) safeVal.textContent = safePct + '%';
}

function drawDashboard() {
  var dims = getCQDimensions();
  drawRadarChart(dims);
  drawTrendChart();
  updateBenchmarks();
}

// ════════════════════════════════════════════
//  FEATURE 3: RESOURCE LIBRARY
// ════════════════════════════════════════════

var resources = [
  { id: 1, cat: 'multilingual', icon: '🌐', title: 'Multilingual Coaching Phrasebook', desc: 'Essential coaching phrases in 12 languages spoken across FIFA 2026 host cities.', tag: 'Toolkit' },
  { id: 2, cat: 'multilingual', icon: '📖', title: 'Storytelling for Cultural Connection', desc: 'Templates for using local folk stories and metaphors to teach tactical concepts.', tag: 'Guide' },
  { id: 3, cat: 'indigenous', icon: '🪶', title: 'Indigenous Land Protocols — Toronto', desc: 'Guidance on land acknowledgments and respectful engagement with First Nations communities.', tag: 'Protocol' },
  { id: 4, cat: 'indigenous', icon: '🏔️', title: 'Indigenous Land Protocols — Vancouver', desc: 'BC-specific protocols for Musqueam, Squamish, and Tsleil-Waututh territories.', tag: 'Protocol' },
  { id: 5, cat: 'fifa', icon: '⚽', title: 'Representative Design in Training', desc: 'FIFA Training Centre micro-learning on designing game-representative practice tasks.', tag: 'Video' },
  { id: 6, cat: 'fifa', icon: '🎯', title: 'Constraint-Led Coaching Approach', desc: 'How to use task, environment, and individual constraints to guide athlete learning.', tag: 'Video' },
  { id: 7, cat: 'fifa', icon: '🧠', title: 'Decision-Making Under Pressure', desc: 'Micro-learning clips on developing perceptual-cognitive skills in players.', tag: 'Video' },
  { id: 8, cat: 'dei', icon: '🤝', title: 'Ontario Soccer DEI Action Guide', desc: "Practical steps to meet Ontario Soccer's 2026 Diversity, Equity & Inclusion targets.", tag: 'Guide' },
  { id: 9, cat: 'dei', icon: '🛡️', title: 'Safe Sport Coaching Standards', desc: "Canada Soccer's Safe Sport policies and complaint-resolution frameworks.", tag: 'Standards' },
  { id: 10, cat: 'multilingual', icon: '🎙️', title: 'Active Listening Across Cultures', desc: 'Techniques for coaching feedback that respects cultural communication norms.', tag: 'Toolkit' },
  { id: 11, cat: 'dei', icon: '♿', title: 'Accessibility in Sport Programming', desc: 'Guidelines for inclusive program design for athletes with disabilities.', tag: 'Guide' },
  { id: 12, cat: 'indigenous', icon: '🎨', title: 'Two-Eyed Seeing in Coaching', desc: 'Integrating Indigenous knowledge systems with Western sport science methodologies.', tag: 'Framework' }
];

var activeFilter = 'all';

function renderResources(filter, search) {
  filter = filter || 'all';
  search = search || '';
  var grid = document.getElementById('resourceGrid');
  if (!grid) return;

  var filtered = [];
  for (var i = 0; i < resources.length; i++) {
    var r = resources[i];
    var matchCat = filter === 'all' || r.cat === filter;
    var matchSearch = search === '' || r.title.toLowerCase().indexOf(search) !== -1 || r.desc.toLowerCase().indexOf(search) !== -1;
    if (matchCat && matchSearch) filtered.push(r);
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:24px;">No resources found.</p>';
    return;
  }

  var html = '';
  for (var i = 0; i < filtered.length; i++) {
    var r = filtered[i];
    html += '<div class="resource-card" data-id="' + r.id + '">' +
      '<div class="res-icon cat-' + r.cat + '">' + r.icon + '</div>' +
      '<div class="res-info"><h4>' + r.title + '</h4><p>' + r.desc + '</p>' +
      '<span class="res-tag">' + r.tag + '</span></div></div>';
  }
  grid.innerHTML = html;
}

function initResourceLibrary() {
  renderResources();

  // Filter chips
  var chips = document.querySelectorAll('.chip');
  for (var i = 0; i < chips.length; i++) {
    (function (chip) {
      chip.addEventListener('click', function () {
        for (var j = 0; j < chips.length; j++) chips[j].classList.remove('active');
        chip.classList.add('active');
        activeFilter = chip.getAttribute('data-cat');
        var searchInput = document.getElementById('searchInput');
        renderResources(activeFilter, searchInput ? searchInput.value.toLowerCase().trim() : '');
      });
    })(chips[i]);
  }

  // Search
  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      renderResources(activeFilter, searchInput.value.toLowerCase().trim());
    });
  }

  // Card clicks
  var grid = document.getElementById('resourceGrid');
  if (grid) {
    grid.addEventListener('click', function (e) {
      var card = e.target.closest('.resource-card');
      if (!card) return;
      var id = parseInt(card.getAttribute('data-id'));
      for (var i = 0; i < resources.length; i++) {
        if (resources[i].id === id) {
          showToast(resources[i].icon + ' ' + resources[i].title);
          break;
        }
      }
    });
  }
}

// ════════════════════════════════════════════
//  FEATURE 4: LEGACY HANDOVER LEDGER
// ════════════════════════════════════════════

function updateHoursRing() {
  var hours = appData.totalHours;
  var pct = Math.min(hours / 100, 1);
  var circumference = 2 * Math.PI * 85;
  var offset = circumference - pct * circumference;
  var fill = document.getElementById('hoursRingFill');
  var val = document.getElementById('hoursValue');
  if (fill) fill.style.strokeDashoffset = offset;
  if (val) val.textContent = hours;
}

function initLedger() {
  var hoursInput = document.getElementById('addHours');
  var upBtn = document.getElementById('hoursUp');
  var downBtn = document.getElementById('hoursDown');
  var logBtn = document.getElementById('logHoursBtn');
  var genBtn = document.getElementById('generateCert');
  var printBtn = document.getElementById('printCert');

  if (upBtn && hoursInput) {
    upBtn.addEventListener('click', function () {
      hoursInput.value = Math.min(parseFloat(hoursInput.value) + 0.5, 99);
    });
  }
  if (downBtn && hoursInput) {
    downBtn.addEventListener('click', function () {
      hoursInput.value = Math.max(parseFloat(hoursInput.value) - 0.5, 0.5);
    });
  }
  if (logBtn && hoursInput) {
    logBtn.addEventListener('click', function () {
      var h = parseFloat(hoursInput.value) || 0;
      if (h <= 0) return;
      appData.totalHours = Math.min(appData.totalHours + h, 999);
      saveData(appData);
      updateHoursRing();
      showToast('+' + h + ' hr logged — ' + appData.totalHours + ' total');
    });
  }
  if (genBtn) {
    genBtn.addEventListener('click', function () {
      var nameInput = document.getElementById('coachName');
      var cityInput = document.getElementById('coachCity');
      var name = nameInput ? nameInput.value.trim() : '';
      if (!name) { showToast('Please enter your name'); return; }
      var city = cityInput ? cityInput.value : 'Toronto';
      appData.coachName = name;
      appData.coachCity = city;
      saveData(appData);

      var certName = document.getElementById('certNameDisplay');
      var certHours = document.getElementById('certHoursDisplay');
      var certCity = document.getElementById('certCityDisplay');
      var certDate = document.getElementById('certDate');
      var certPreview = document.getElementById('certPreview');

      if (certName) certName.textContent = name;
      if (certHours) certHours.textContent = appData.totalHours;
      if (certCity) certCity.textContent = city;
      if (certDate) certDate.textContent = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
      if (certPreview) {
        certPreview.style.display = 'block';
        certPreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }
  if (printBtn) {
    printBtn.addEventListener('click', function () { window.print(); });
  }
}
