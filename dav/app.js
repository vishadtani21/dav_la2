/**
 * AcademiaIQ - Enterprise Student Academic Performance & Early Warning Platform
 * Client Application Logic & In-Memory Data Store (with LocalStorage persistence)
 */

// -----------------------------------------------------------------------------
// 1. DATA INITIALIZATION & LOCAL STORAGE PERSISTENCE
// -----------------------------------------------------------------------------
const STORAGE_KEY = "academiaiq_students_roster";

// Load from LocalStorage if available; otherwise initialize from STUDENTS_DATA
let currentRoster = [];

function initializeRoster() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      currentRoster = JSON.parse(saved);
    } catch (e) {
      console.warn("Could not parse saved roster, falling back to base dataset.");
      currentRoster = [...STUDENTS_DATA];
    }
  } else {
    currentRoster = [...STUDENTS_DATA];
  }
}

function persistRoster() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentRoster));
  updateKPIMetrics();
  renderAtRiskFeed();
  renderRosterTable();
  if (activeAnalyticsChart) {
    updateActiveAnalyticsChart();
  }
}

// -----------------------------------------------------------------------------
// 2. SCIKIT-LEARN REGRESSION ENGINE
// -----------------------------------------------------------------------------
const ML_ENGINE = {
  intercept: -11.1505,
  coefs: {
    attendance: 0.2340,
    study: 1.7097,
    assignment: 0.2952,
    internal: 0.2517,
    previous: 0.2353
  },
  predict(att, study, assign, internal, prev) {
    const raw = this.intercept +
      (this.coefs.attendance * att) +
      (this.coefs.study * study) +
      (this.coefs.assignment * assign) +
      (this.coefs.internal * internal) +
      (this.coefs.previous * prev);
    return Math.min(100, Math.max(0, parseFloat(raw.toFixed(2))));
  },
  categorize(score) {
    if (score >= 85) return "Excellent (85-100)";
    if (score >= 70) return "Good (70-84.99)";
    if (score >= 50) return "Average (50-69.99)";
    return "Needs Improvement (<50)";
  }
};

// -----------------------------------------------------------------------------
// 3. KPI CALCULATIONS
// -----------------------------------------------------------------------------
function updateKPIMetrics() {
  const total = currentRoster.length;
  document.getElementById("metric-total-students").textContent = total;

  if (total === 0) {
    document.getElementById("metric-avg-marks").textContent = "0.0";
    document.getElementById("metric-avg-attendance").textContent = "0.0%";
    document.getElementById("metric-at-risk-count").textContent = "0";
    return;
  }

  const sumMarks = currentRoster.reduce((acc, s) => acc + (s.Final_Marks || 0), 0);
  const sumAtt = currentRoster.reduce((acc, s) => acc + (s.Attendance_Percentage || 0), 0);

  const avgMarks = (sumMarks / total).toFixed(2);
  const avgAtt = (sumAtt / total).toFixed(2);

  // At-risk criteria: Final Marks < 50 OR Attendance < 65%
  const atRiskCount = currentRoster.filter(s => (s.Final_Marks < 50) || (s.Attendance_Percentage < 65)).length;

  document.getElementById("metric-avg-marks").textContent = avgMarks;
  document.getElementById("metric-avg-attendance").textContent = `${avgAtt}%`;
  document.getElementById("metric-at-risk-count").textContent = atRiskCount;
}

// -----------------------------------------------------------------------------
// 4. EARLY WARNING & AT-RISK TRIAGE FEED
// -----------------------------------------------------------------------------
function renderAtRiskFeed() {
  const container = document.getElementById("at-risk-feed-container");
  container.innerHTML = "";

  const atRiskStudents = currentRoster.filter(s => (s.Final_Marks < 50) || (s.Attendance_Percentage < 65));

  if (atRiskStudents.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--emerald); padding: 30px;">
        <i class="fa-solid fa-circle-check" style="font-size: 24px; margin-bottom: 8px;"></i>
        <p>No critical academic alerts! All students are currently maintaining acceptable performance benchmarks.</p>
      </div>
    `;
    return;
  }

  // Display top 10 most critical cases
  atRiskStudents.slice(0, 10).forEach(student => {
    const item = document.createElement("div");
    item.className = "risk-item";

    const reason = student.Attendance_Percentage < 65 
      ? `Critical Attendance (${student.Attendance_Percentage}%)`
      : `Projected Failure Risk (Score: ${student.Final_Marks})`;

    item.innerHTML = `
      <div class="risk-student-info">
        <h4>${student.Student_ID} <span style="font-weight: 400; color: var(--text-dim);">(${student.Gender})</span></h4>
        <span>${reason}</span>
      </div>
      <div class="risk-stats">
        <div class="risk-score">${student.Final_Marks}</div>
        <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.76rem;" onclick="viewStudentProfile('${student.Student_ID}')">
          <i class="fa-solid fa-user-pen"></i> Triage
        </button>
      </div>
    `;
    container.appendChild(item);
  });
}

// -----------------------------------------------------------------------------
// 5. WHAT-IF SCENARIO SIMULATOR
// -----------------------------------------------------------------------------
const simAtt = document.getElementById("sim-slider-att");
const simStudy = document.getElementById("sim-slider-study");
const simAssign = document.getElementById("sim-slider-assign");
const simInt = document.getElementById("sim-slider-int");
const simPrev = document.getElementById("sim-slider-prev");

const simValAtt = document.getElementById("sim-val-att");
const simValStudy = document.getElementById("sim-val-study");
const simValAssign = document.getElementById("sim-val-assign");
const simValInt = document.getElementById("sim-val-int");
const simValPrev = document.getElementById("sim-val-prev");

const simDisplayScore = document.getElementById("sim-display-score");
const simDisplayBadge = document.getElementById("sim-display-badge");
const simDisplayAdvice = document.getElementById("sim-display-advice");
const simSvgRing = document.getElementById("sim-svg-ring");

function updateSimulator() {
  const att = parseFloat(simAtt.value);
  const study = parseFloat(simStudy.value);
  const assign = parseFloat(simAssign.value);
  const internal = parseFloat(simInt.value);
  const prev = parseFloat(simPrev.value);

  simValAtt.textContent = `${att}%`;
  simValStudy.textContent = `${study.toFixed(1)} hrs`;
  simValAssign.textContent = `${assign}`;
  simValInt.textContent = `${internal}`;
  simValPrev.textContent = `${prev}`;

  const score = ML_ENGINE.predict(att, study, assign, internal, prev);
  simDisplayScore.textContent = score.toFixed(1);

  // SVG Ring Progress (Circumference = 2 * PI * 45 ≈ 283)
  const circumference = 283;
  const offset = circumference - (circumference * score / 100);
  simSvgRing.style.strokeDashoffset = offset;

  simDisplayBadge.className = "sim-tier-badge";
  if (score >= 85) {
    simDisplayBadge.classList.add("excellent");
    simDisplayBadge.textContent = "Excellent (85-100)";
    simSvgRing.style.stroke = "#10b981";
    simDisplayAdvice.textContent = "Exceptional performance profile! High probability of graduating with honors.";
  } else if (score >= 70) {
    simDisplayBadge.classList.add("good");
    simDisplayBadge.textContent = "Good (70-84.99)";
    simSvgRing.style.stroke = "#4f46e5";
    simDisplayAdvice.textContent = "Solid academic trajectory. Targeted assignment feedback will push student into top tier.";
  } else if (score >= 50) {
    simDisplayBadge.classList.add("average");
    simDisplayBadge.textContent = "Average (50-69.99)";
    simSvgRing.style.stroke = "#f59e0b";
    simDisplayAdvice.textContent = "Borderline stability. Increasing study hours to 5+ hrs/day strongly improves examination safety.";
  } else {
    simDisplayBadge.classList.add("needs-improvement");
    simDisplayBadge.textContent = "Needs Improvement (<50)";
    simSvgRing.style.stroke = "#f43f5e";
    simDisplayAdvice.textContent = "Immediate counseling required. Compulsory remedial tutorials and attendance tracking advised.";
  }
}

function resetSimulator() {
  simAtt.value = 85;
  simStudy.value = 5.0;
  simAssign.value = 88;
  simInt.value = 82;
  simPrev.value = 78;
  updateSimulator();
  showToast("Simulator reset to baseline parameters.");
}

[simAtt, simStudy, simAssign, simInt, simPrev].forEach(slider => {
  slider.addEventListener("input", updateSimulator);
});

// -----------------------------------------------------------------------------
// 6. STUDENT ROSTER MANAGEMENT (FILTERING, PAGINATION, CRUD)
// -----------------------------------------------------------------------------
let filteredRoster = [];
let rosterPage = 1;
const ROSTER_PAGE_SIZE = 10;

const rosterSearch = document.getElementById("roster-search");
const filterTier = document.getElementById("filter-tier");
const filterGender = document.getElementById("filter-gender");
const rosterTableBody = document.getElementById("roster-table-body");
const paginationInfo = document.getElementById("pagination-info");
const pageNumDisplay = document.getElementById("page-num-display");
const btnPagePrev = document.getElementById("btn-page-prev");
const btnPageNext = document.getElementById("btn-page-next");

function applyRosterFilters() {
  const query = rosterSearch.value.toLowerCase().trim();
  const tier = filterTier.value;
  const gender = filterGender.value;

  filteredRoster = currentRoster.filter(s => {
    const matchesQuery = s.Student_ID.toLowerCase().includes(query);
    const matchesTier = (tier === "ALL" || s.Performance_Category === tier);
    const matchesGender = (gender === "ALL" || s.Gender === gender);
    return matchesQuery && matchesTier && matchesGender;
  });

  rosterPage = 1;
  renderRosterTable();
}

function renderRosterTable() {
  rosterTableBody.innerHTML = "";
  const total = filteredRoster.length;
  const totalPages = Math.ceil(total / ROSTER_PAGE_SIZE) || 1;
  const startIdx = (rosterPage - 1) * ROSTER_PAGE_SIZE;
  const endIdx = Math.min(startIdx + ROSTER_PAGE_SIZE, total);

  const slice = filteredRoster.slice(startIdx, endIdx);

  if (slice.length === 0) {
    rosterTableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-dim); padding: 30px;">No matching student records found.</td></tr>`;
  } else {
    slice.forEach(student => {
      const tr = document.createElement("tr");

      let badgeClass = "average";
      if (student.Performance_Category && student.Performance_Category.includes("Excellent")) badgeClass = "excellent";
      else if (student.Performance_Category && student.Performance_Category.includes("Good")) badgeClass = "good";
      else if (student.Performance_Category && student.Performance_Category.includes("Needs")) badgeClass = "needs-improvement";

      tr.innerHTML = `
        <td><strong style="color: #fff;">${student.Student_ID}</strong></td>
        <td>${student.Gender}</td>
        <td>${student.Attendance_Percentage}%</td>
        <td>${student.Study_Hours} hrs</td>
        <td>${student.Assignment_Score}</td>
        <td>${student.Internal_Marks}</td>
        <td>${student.Previous_Semester_Marks}</td>
        <td><strong style="color: #fff;">${student.Final_Marks}</strong></td>
        <td><span class="tier-badge ${badgeClass}">${student.Performance_Category ? student.Performance_Category.split(" ")[0] : "N/A"}</span></td>
        <td style="text-align: right;">
          <div class="action-btn-group" style="justify-content: flex-end;">
            <button class="icon-btn" title="View Dossier" onclick="viewStudentProfile('${student.Student_ID}')"><i class="fa-solid fa-eye"></i></button>
            <button class="icon-btn delete" title="Delete Student" onclick="deleteStudent('${student.Student_ID}')"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      `;
      rosterTableBody.appendChild(tr);
    });
  }

  paginationInfo.textContent = total > 0 
    ? `Showing ${startIdx + 1}-${endIdx} of ${total} records` 
    : `Showing 0 records`;

  pageNumDisplay.textContent = `Page ${rosterPage} of ${totalPages}`;
  btnPagePrev.disabled = rosterPage <= 1;
  btnPageNext.disabled = rosterPage >= totalPages;
}

btnPagePrev.addEventListener("click", () => {
  if (rosterPage > 1) {
    rosterPage--;
    renderRosterTable();
  }
});

btnPageNext.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredRoster.length / ROSTER_PAGE_SIZE);
  if (rosterPage < totalPages) {
    rosterPage++;
    renderRosterTable();
  }
});

rosterSearch.addEventListener("input", applyRosterFilters);
filterTier.addEventListener("change", applyRosterFilters);
filterGender.addEventListener("change", applyRosterFilters);

// Delete Student
function deleteStudent(studentId) {
  if (confirm(`Are you sure you want to delete student ${studentId} from the active database?`)) {
    currentRoster = currentRoster.filter(s => s.Student_ID !== studentId);
    persistRoster();
    applyRosterFilters();
    showToast(`Student ${studentId} removed from roster.`);
  }
}

// -----------------------------------------------------------------------------
// 7. STUDENT PROFILE & INTERVENTION DOSSIER
// -----------------------------------------------------------------------------
const profileModal = document.getElementById("modal-student-profile");
const profileModalContent = document.getElementById("profile-modal-content");
let selectedProfileStudent = null;

function viewStudentProfile(studentId) {
  const student = currentRoster.find(s => s.Student_ID === studentId);
  if (!student) return;

  selectedProfileStudent = student;

  let badgeClass = "average";
  if (student.Performance_Category.includes("Excellent")) badgeClass = "excellent";
  else if (student.Performance_Category.includes("Good")) badgeClass = "good";
  else if (student.Performance_Category.includes("Needs")) badgeClass = "needs-improvement";

  profileModalContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-light); padding-bottom: 14px;">
      <div>
        <h2 style="color: #fff; font-size: 1.5rem; margin-bottom: 4px;">${student.Student_ID}</h2>
        <span style="font-size: 0.85rem; color: var(--text-muted);">${student.Gender} Student • Enrolled Roster</span>
      </div>
      <span class="tier-badge ${badgeClass}" style="font-size: 0.85rem; padding: 6px 14px;">${student.Performance_Category}</span>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px;">
      <div style="background: var(--bg-subtle); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
        <div style="font-size: 0.78rem; color: var(--text-dim); text-transform: uppercase;">Classroom Attendance</div>
        <div style="font-size: 1.3rem; font-weight: 700; color: #fff;">${student.Attendance_Percentage}%</div>
        <div style="font-size: 0.76rem; color: ${student.Attendance_Percentage >= 75 ? 'var(--emerald)' : 'var(--rose)'};">
          ${student.Attendance_Percentage >= 75 ? 'Above 75% requirement' : 'Below mandatory minimum'}
        </div>
      </div>

      <div style="background: var(--bg-subtle); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
        <div style="font-size: 0.78rem; color: var(--text-dim); text-transform: uppercase;">Daily Study Hours</div>
        <div style="font-size: 1.3rem; font-weight: 700; color: #fff;">${student.Study_Hours} hrs/day</div>
        <div style="font-size: 0.76rem; color: var(--text-muted);">Cohort average: 4.6 hrs</div>
      </div>

      <div style="background: var(--bg-subtle); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
        <div style="font-size: 0.78rem; color: var(--text-dim); text-transform: uppercase;">Assignment Score</div>
        <div style="font-size: 1.3rem; font-weight: 700; color: #fff;">${student.Assignment_Score} / 100</div>
        <div style="font-size: 0.76rem; color: var(--text-muted);">Correlation with finals: r = 0.76</div>
      </div>

      <div style="background: var(--bg-subtle); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
        <div style="font-size: 0.78rem; color: var(--text-dim); text-transform: uppercase;">Internal Assessment</div>
        <div style="font-size: 1.3rem; font-weight: 700; color: #fff;">${student.Internal_Marks} / 100</div>
        <div style="font-size: 0.76rem; color: var(--text-muted);">Mid-term evaluations</div>
      </div>
    </div>

    <div style="background: rgba(79, 70, 229, 0.12); border: 1px solid rgba(79, 70, 229, 0.3); border-radius: var(--radius-sm); padding: 16px;">
      <h4 style="color: #fff; margin-bottom: 6px; font-size: 0.92rem;"><i class="fa-solid fa-robot"></i> Automated Intervention Recommendation:</h4>
      <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">
        ${student.Final_Marks < 50 
          ? "CRITICAL: Student is projected to fail the final examination. Issue an official academic notice, mandate 3 remedial tutorials per week, and verify study habits." 
          : "STABLE: Student demonstrates sufficient academic progress. Continue monitoring continuous assessment benchmarks."}
      </p>
    </div>
  `;

  profileModal.style.display = "flex";
}

function closeProfileModal() {
  profileModal.style.display = "none";
}

function logInterventionAction() {
  if (selectedProfileStudent) {
    showToast(`Advising session logged for ${selectedProfileStudent.Student_ID}.`);
    closeProfileModal();
  }
}

// -----------------------------------------------------------------------------
// 8. ADD NEW STUDENT MODAL & LOGIC
// -----------------------------------------------------------------------------
const modalAddStudent = document.getElementById("modal-add-student");

function openAddStudentModal() {
  document.getElementById("form-student").reset();
  modalAddStudent.style.display = "flex";
}

function closeAddStudentModal() {
  modalAddStudent.style.display = "none";
}

function handleSaveStudent(e) {
  e.preventDefault();

  const id = document.getElementById("inp-student-id").value.trim().toUpperCase();
  const gender = document.getElementById("inp-gender").value;
  const att = parseFloat(document.getElementById("inp-attendance").value);
  const study = parseFloat(document.getElementById("inp-study").value);
  const assign = parseFloat(document.getElementById("inp-assignment").value);
  const internal = parseFloat(document.getElementById("inp-internal").value);
  const prev = parseFloat(document.getElementById("inp-prev").value);

  // Check duplicate
  if (currentRoster.some(s => s.Student_ID === id)) {
    alert(`Student ID ${id} already exists in the active roster.`);
    return;
  }

  // Calculate ML score
  const finalMarks = ML_ENGINE.predict(att, study, assign, internal, prev);
  const category = ML_ENGINE.categorize(finalMarks);

  const newStudent = {
    Student_ID: id,
    Gender: gender,
    Attendance_Percentage: att,
    Study_Hours: study,
    Assignment_Score: assign,
    Internal_Marks: internal,
    Previous_Semester_Marks: prev,
    Final_Marks: finalMarks,
    Performance_Category: category
  };

  currentRoster.unshift(newStudent);
  persistRoster();
  applyRosterFilters();
  closeAddStudentModal();
  showToast(`Student ${id} enrolled with predicted score of ${finalMarks}.`);
}

// -----------------------------------------------------------------------------
// 9. BATCH CSV IMPORT ENGINE
// -----------------------------------------------------------------------------
const modalImport = document.getElementById("modal-import");

function openImportModal() {
  modalImport.style.display = "flex";
}

function closeImportModal() {
  modalImport.style.display = "none";
}

function handleCSVFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    parseAndIngestCSV(e.target.result);
  };
  reader.readAsText(file);
}

function processPastedCSV() {
  const text = document.getElementById("text-csv-input").value.trim();
  if (!text) {
    alert("Please paste CSV data or select a file.");
    return;
  }
  parseAndIngestCSV(text);
}

function parseAndIngestCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) {
    alert("CSV does not contain sufficient rows.");
    return;
  }

  const header = lines[0].split(",").map(h => h.trim());
  let addedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",").map(p => p.trim());
    if (parts.length >= 7) {
      const id = parts[0] || `STU${1000 + currentRoster.length + 1}`;
      const gender = parts[1] || "Male";
      const att = parseFloat(parts[2]) || 75.0;
      const study = parseFloat(parts[3]) || 4.5;
      const assign = parseFloat(parts[4]) || 70.0;
      const internal = parseFloat(parts[5]) || 68.0;
      const prev = parseFloat(parts[6]) || 70.0;

      // Predict if final marks not present
      const finalMarks = parts[7] ? parseFloat(parts[7]) : ML_ENGINE.predict(att, study, assign, internal, prev);
      const category = ML_ENGINE.categorize(finalMarks);

      // Skip duplicate IDs
      if (!currentRoster.some(s => s.Student_ID === id)) {
        currentRoster.push({
          Student_ID: id,
          Gender: gender,
          Attendance_Percentage: att,
          Study_Hours: study,
          Assignment_Score: assign,
          Internal_Marks: internal,
          Previous_Semester_Marks: prev,
          Final_Marks: finalMarks,
          Performance_Category: category
        });
        addedCount++;
      }
    }
  }

  persistRoster();
  applyRosterFilters();
  closeImportModal();
  showToast(`Batch Ingestion Complete: ${addedCount} new student records added.`);
}

// -----------------------------------------------------------------------------
// 10. EXPORT CURRENT ROSTER TO CSV
// -----------------------------------------------------------------------------
function exportCurrentRosterToCSV() {
  if (filteredRoster.length === 0) {
    alert("No records to export.");
    return;
  }

  const headers = ["Student_ID", "Gender", "Attendance_Percentage", "Study_Hours", "Assignment_Score", "Internal_Marks", "Previous_Semester_Marks", "Final_Marks", "Performance_Category"];
  let csvContent = headers.join(",") + "\n";

  filteredRoster.forEach(s => {
    const row = [
      s.Student_ID,
      s.Gender,
      s.Attendance_Percentage,
      s.Study_Hours,
      s.Assignment_Score,
      s.Internal_Marks,
      s.Previous_Semester_Marks,
      s.Final_Marks,
      `"${s.Performance_Category}"`
    ];
    csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `AcademiaIQ_Student_Roster_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Filtered student roster exported to CSV.");
}

// -----------------------------------------------------------------------------
// 11. VISUAL ANALYTICS ENGINE (CHART.JS)
// -----------------------------------------------------------------------------
let activeAnalyticsChart = null;
let currentChartType = "distribution";
const analyticsCanvas = document.getElementById("analytics-canvas");
const activeAnalyticsTitle = document.getElementById("active-analytics-title");
const activeAnalyticsDesc = document.getElementById("active-analytics-desc");

function updateActiveAnalyticsChart() {
  if (activeAnalyticsChart) {
    activeAnalyticsChart.destroy();
  }

  if (currentChartType === "distribution") {
    activeAnalyticsTitle.textContent = "Cohort Final Examination Score Distribution";
    activeAnalyticsDesc.textContent = "Frequency of students across score ranges in current active database.";

    const bins = ["<50", "50-59", "60-69", "70-79", "80-89", "90-100"];
    const counts = [0, 0, 0, 0, 0, 0];

    currentRoster.forEach(s => {
      const m = s.Final_Marks;
      if (m < 50) counts[0]++;
      else if (m < 60) counts[1]++;
      else if (m < 70) counts[2]++;
      else if (m < 80) counts[3]++;
      else if (m < 90) counts[4]++;
      else counts[5]++;
    });

    activeAnalyticsChart = new Chart(analyticsCanvas, {
      type: "bar",
      data: {
        labels: bins,
        datasets: [{
          label: "Number of Students",
          data: counts,
          backgroundColor: "#4f46e5",
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } },
          y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } }
        }
      }
    });
  } else if (currentChartType === "tiers") {
    activeAnalyticsTitle.textContent = "Student Breakdown by Performance Standing";
    activeAnalyticsDesc.textContent = "Institutional category distribution across active cohort.";

    const tiers = ["Excellent (85-100)", "Good (70-84.99)", "Average (50-69.99)", "Needs Improvement (<50)"];
    const counts = [0, 0, 0, 0];

    currentRoster.forEach(s => {
      const idx = tiers.indexOf(s.Performance_Category);
      if (idx !== -1) counts[idx]++;
    });

    activeAnalyticsChart = new Chart(analyticsCanvas, {
      type: "bar",
      data: {
        labels: tiers,
        datasets: [{
          label: "Student Count",
          data: counts,
          backgroundColor: ["#10b981", "#4f46e5", "#f59e0b", "#f43f5e"],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } },
          y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } }
        }
      }
    });
  } else if (currentChartType === "study-impact") {
    activeAnalyticsTitle.textContent = "Self-Study Hours vs. Final Marks Impact";
    activeAnalyticsDesc.textContent = "Scatter distribution highlighting the positive academic return of daily study time.";

    const points = currentRoster.slice(0, 150).map(s => ({ x: s.Study_Hours, y: s.Final_Marks }));

    activeAnalyticsChart = new Chart(analyticsCanvas, {
      type: "scatter",
      data: {
        datasets: [{
          label: "Student (Study vs Score)",
          data: points,
          backgroundColor: "rgba(6, 182, 212, 0.75)"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: "Daily Study Hours", color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } },
          y: { title: { display: true, text: "Final Marks", color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } }
        }
      }
    });
  } else if (currentChartType === "attendance-impact") {
    activeAnalyticsTitle.textContent = "Lecture Attendance Rate vs. Final Marks";
    activeAnalyticsDesc.textContent = "Attendance threshold comparison indicating minimum presence for exam safety.";

    const points = currentRoster.slice(0, 150).map(s => ({ x: s.Attendance_Percentage, y: s.Final_Marks }));

    activeAnalyticsChart = new Chart(analyticsCanvas, {
      type: "scatter",
      data: {
        datasets: [{
          label: "Student (Attendance vs Score)",
          data: points,
          backgroundColor: "rgba(16, 185, 129, 0.75)"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: "Attendance Percentage (%)", color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } },
          y: { title: { display: true, text: "Final Marks", color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } }
        }
      }
    });
  } else if (currentChartType === "actual-pred") {
    activeAnalyticsTitle.textContent = "Regression Model Diagnostics (R² = 81.83%)";
    activeAnalyticsDesc.textContent = "Actual student examination outcomes compared against Scikit-Learn linear predictions.";

    const points = currentRoster.slice(0, 100).map(s => {
      const pred = ML_ENGINE.predict(s.Attendance_Percentage, s.Study_Hours, s.Assignment_Score, s.Internal_Marks, s.Previous_Semester_Marks);
      return { x: s.Final_Marks, y: pred };
    });

    activeAnalyticsChart = new Chart(analyticsCanvas, {
      type: "scatter",
      data: {
        datasets: [{
          label: "Actual vs Predicted Fit",
          data: points,
          backgroundColor: "rgba(79, 70, 229, 0.75)"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: "Actual Marks", color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } },
          y: { title: { display: true, text: "Predicted Marks", color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } }
        }
      }
    });
  }
}

// Chart tab click handlers
document.querySelectorAll(".chart-tab-list .chart-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".chart-tab-list .chart-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentChartType = tab.getAttribute("data-chart");
    updateActiveAnalyticsChart();
  });
});

// -----------------------------------------------------------------------------
// 12. TOAST NOTIFICATION UTILITY
// -----------------------------------------------------------------------------
const toastNotice = document.getElementById("toast-notice");
const toastText = document.getElementById("toast-text");
let toastTimeout = null;

function showToast(message) {
  toastText.textContent = message;
  toastNotice.style.display = "flex";
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastNotice.style.display = "none";
  }, 3200);
}

// -----------------------------------------------------------------------------
// 13. APP INITIALIZATION
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initializeRoster();
  updateKPIMetrics();
  renderAtRiskFeed();
  applyRosterFilters();
  updateSimulator();
  updateActiveAnalyticsChart();
});
