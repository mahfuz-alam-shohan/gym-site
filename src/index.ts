export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket; // reserved for future exports/backups
}

/* ----------------------- Shared HTML head ----------------------- */

function baseHead(title: string): string {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <style>
        :root {
          color-scheme: light;
          --surface: #ffffff;
          --surface-soft: #f9fafb;
          --muted: #f3f4f6;
          --primary: #2563eb;
          --primary-soft: #e0ecff;
          --text: #0f172a;
          --border: #d4dbe9;
          --shadow-soft: 0 18px 45px rgba(15, 23, 42, 0.08);
          --danger: #dc2626;
          --success: #16a34a;
        }

        * { box-sizing: border-box; }

        html, body {
          margin: 0;
          padding: 0;
        }

        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
          background: radial-gradient(circle at top, #eff4ff 0, #f9fafb 40%, #eef2ff 100%);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          -webkit-text-size-adjust: 100%;
        }

        .brand-mark {
          width: 32px;
          height: 32px;
          border-radius: 12px;
          background: radial-gradient(circle at 30% 20%, #93c5fd, #1d4ed8);
          display: grid;
          place-items: center;
          color: #eff6ff;
          font-weight: 800;
          font-size: 18px;
        }

        header {
          padding: 18px 20px 10px;
        }

        .header-inner {
          max-width: 1080px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-text h1 {
          margin: 0;
          font-size: 22px;
          letter-spacing: -0.03em;
        }

        .brand-text p {
          margin: 2px 0 0;
          font-size: 13px;
          color: #64748b;
        }

        .tagline {
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(37,99,235,0.06);
          color: #1d4ed8;
          font-weight: 600;
          white-space: nowrap;
        }

        main {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 10px 10px 32px;
        }

        .shell {
          width: 100%;
          max-width: 1080px;
        }

        .card {
          background: var(--surface);
          border-radius: 18px;
          padding: 20px 18px 18px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          box-shadow: var(--shadow-soft);
        }

        input, select, textarea {
          padding: 11px 13px;
          border-radius: 11px;
          border: 1px solid var(--border);
          background: #fdfefe;
          font-size: 16px; /* stop iOS zoom */
          transition: border-color 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
        }

        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 1px rgba(37,99,235,0.12);
          background: #ffffff;
        }

        textarea { resize: vertical; }

        button {
          border: none;
          border-radius: 999px;
          padding: 11px 18px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.08s ease, box-shadow 0.15s ease, background 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        button.primary {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #f9fafb;
          box-shadow: 0 12px 30px rgba(37, 99, 235, 0.35);
        }

        button.secondary {
          background: #e5e7eb;
          color: #111827;
        }

        button.ghost {
          background: transparent;
          color: #6b7280;
        }

        button:active {
          transform: translateY(1px);
          box-shadow: none;
        }

        @media (max-width: 640px) {
          .card { padding: 16px 14px 14px; }
          .header-inner { flex-direction: column; align-items: flex-start; }
          .tagline { align-self: flex-start; }
          button { width: 100%; justify-content: center; }
        }
      </style>
    </head>`;
}

/* ----------------------- Onboarding page ----------------------- */

function renderOnboarding(): Response {
  const html = `${baseHead("Gym Onboarding")}
    <body>
      <header>
        <div class="header-inner">
          <div class="brand">
            <div class="brand-mark">G</div>
            <div class="brand-text">
              <h1>Gym setup assistant</h1>
              <p>First-time setup: gym, roles and membership types.</p>
            </div>
          </div>
          <div class="tagline">Step 1 · Onboarding</div>
        </div>
      </header>
      <main>
        <div class="shell">
          <div class="card">
            <div id="steps" class="steps"></div>
            <form id="wizard">
              <style>
                .steps {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                  gap: 8px;
                  margin-bottom: 14px;
                }
                .step {
                  padding: 9px 10px;
                  border-radius: 12px;
                  border: 1px solid var(--border);
                  background: #f9fafb;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  opacity: 0.7;
                  transition: all 0.15s ease;
                }
                .step.active {
                  border-color: var(--primary);
                  background: var(--primary-soft);
                  opacity: 1;
                }
                .step-number {
                  width: 26px;
                  height: 26px;
                  border-radius: 999px;
                  background: var(--primary);
                  color: #f9fafb;
                  display: grid;
                  place-items: center;
                  font-weight: 700;
                  font-size: 13px;
                }
                .step-title { font-size: 14px; font-weight: 600; }
                .step-caption { font-size: 12px; color: #64748b; }
                .step-content { margin-top: 6px; }
                .grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                  gap: 12px;
                }
                .field { display: flex; flex-direction: column; gap: 4px; }
                label { font-weight: 600; font-size: 13px; color: #0f172a; }
                .hint { font-size: 12px; color: #64748b; }
                .notice {
                  background: #eff6ff;
                  border-radius: 12px;
                  padding: 10px 12px;
                  font-size: 13px;
                  color: #0b3c96;
                  border: 1px solid #bfdbfe;
                  display: flex;
                  align-items: flex-start;
                  gap: 8px;
                }
                .notice::before { content: "ℹ︎"; font-weight: 700; margin-top: 1px; }
                .workers { display: grid; gap: 10px; margin-top: 10px; }
                .worker-card {
                  border: 1px solid var(--border);
                  border-radius: 12px;
                  padding: 12px;
                  background: #fdfdfd;
                }
                .worker-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  gap: 8px;
                  margin-bottom: 8px;
                }
                .pill {
                  display: inline-flex;
                  align-items: center;
                  gap: 6px;
                  background: rgba(37, 99, 235, 0.06);
                  border-radius: 999px;
                  padding: 6px 10px;
                  font-size: 11px;
                  font-weight: 600;
                  color: #1d4ed8;
                }
                .plans { display: grid; gap: 10px; margin-top: 4px; }
                .plan-card {
                  border-radius: 14px;
                  border: 1px solid var(--border);
                  padding: 12px 12px 10px;
                  background: #fdfefe;
                }
                .plan-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  gap: 8px;
                  margin-bottom: 6px;
                }
                .inline {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                  gap: 8px;
                }
                .chip-row {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 6px;
                  margin-top: 6px;
                }
                .chip {
                  background: #eff6ff;
                  color: #1d4ed8;
                  padding: 4px 8px;
                  border-radius: 999px;
                  font-size: 11px;
                  font-weight: 600;
                }
                .summary {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                  gap: 10px;
                }
                .summary-item {
                  border-radius: 12px;
                  border: 1px solid var(--border);
                  padding: 10px 12px;
                  background: #fdfefe;
                  font-size: 13px;
                }
                .summary-item-title { font-weight: 700; margin-bottom: 3px; }
                .summary-item-body { color: #475569; }
                .status {
                  margin-top: 10px;
                  border-radius: 12px;
                  padding: 10px 12px;
                  border: 1px solid #bbf7d0;
                  background: #ecfdf3;
                  color: #166534;
                  font-size: 13px;
                  display: none;
                }
                .status.error {
                  border-color: #fecaca;
                  background: #fef2f2;
                  color: #991b1b;
                }
                .actions {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-top: 8px;
                  gap: 10px;
                  flex-wrap: wrap;
                }
                .subtext { font-size: 12px; color: #6b7280; }
                @media (max-width: 640px) {
                  .actions { flex-direction: column-reverse; align-items: stretch; }
                }
              </style>

              <!-- STEP 0: Gym + role accounts -->
              <div class="step-content" data-step="0">
                <div class="grid">
                  <div class="field">
                    <label for="gymName">Gym name</label>
                    <input id="gymName" required placeholder="e.g. Skyline Fitness" />
                    <div class="hint">This name will appear on dashboards and exports.</div>
                  </div>
                </div>

                <div class="notice" style="margin-top:10px;">
                  Define separate login accounts for each role. Each email + password is independent.
                </div>

                <div class="grid" style="margin-top:10px;">
                  <div class="field">
                    <label>Admin account (required)</label>
                    <input id="adminName" required placeholder="Admin full name" />
                    <input id="adminEmail" type="email" required placeholder="admin@example.com" style="margin-top:6px;" />
                    <input id="adminPassword" type="password" required minlength="6" placeholder="Admin password" style="margin-top:6px;" />
                    <div class="hint">Admin has full control of this gym’s dashboard.</div>
                  </div>
                  <div class="field">
                    <label>Owner account (optional)</label>
                    <input id="ownerName" placeholder="Owner full name" />
                    <input id="ownerEmail" type="email" placeholder="owner@example.com" style="margin-top:6px;" />
                    <input id="ownerPassword" type="password" placeholder="Owner password" style="margin-top:6px;" />
                    <div class="hint">If set, owner login can view everything.</div>
                  </div>
                  <div class="field">
                    <label>Manager account (optional)</label>
                    <input id="managerName" placeholder="Manager full name" />
                    <input id="managerEmail" type="email" placeholder="manager@example.com" style="margin-top:6px;" />
                    <input id="managerPassword" type="password" placeholder="Manager password" style="margin-top:6px;" />
                    <div class="hint">Manager handles daily operations and staff.</div>
                  </div>
                </div>
              </div>

              <!-- STEP 1: schedule -->
              <div class="step-content" data-step="1" style="display:none;">
                <div class="grid">
                  <div class="field">
                    <label for="gymType">Gym type</label>
                    <select id="gymType" required>
                      <option value="combined">Combined (all members)</option>
                      <option value="male">Male only</option>
                      <option value="female">Female only</option>
                    </select>
                    <div class="hint">This helps you filter attendance and member lists later.</div>
                  </div>
                  <div class="field">
                    <label for="openingTime">Opening time</label>
                    <input id="openingTime" type="time" required />
                  </div>
                  <div class="field">
                    <label for="closingTime">Closing time</label>
                    <input id="closingTime" type="time" required />
                  </div>
                </div>
              </div>

              <!-- STEP 2: workers -->
              <div class="step-content" data-step="2" style="display:none;">
                <div class="notice">
                  Set how many workers you have. Duty slots will be generated and can be adjusted. Login accounts for trainers can be added later.
                </div>
                <div class="grid" style="margin-top:8px;">
                  <div class="field">
                    <label for="workerCount">Number of workers</label>
                    <select id="workerCount"></select>
                    <div class="hint">You can add or adjust workers later in the dashboard.</div>
                  </div>
                  <div class="field">
                    <label for="shiftPreset">Default shift length</label>
                    <select id="shiftPreset">
                      <option value="6">6 hours</option>
                      <option value="8" selected>8 hours</option>
                      <option value="10">10 hours</option>
                    </select>
                  </div>
                </div>
                <div class="workers" id="workers"></div>
              </div>

              <!-- STEP 3: memberships -->
              <div class="step-content" data-step="3" style="display:none;">
                <div class="notice">
                  Add membership styles you offer. You can change prices and details any time.
                </div>
                <div class="plans" id="plans"></div>
                <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:6px;">
                  <button type="button" class="secondary" id="addPlan">Add membership type</button>
                </div>
              </div>

              <!-- STEP 4: summary -->
              <div class="step-content" data-step="4" style="display:none;">
                <div class="summary" id="summary"></div>
                <div id="status" class="status"></div>
              </div>

              <div class="actions">
                <button type="button" class="secondary" id="backBtn">← Back</button>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex:1; max-width:320px;">
                  <button type="button" class="primary" id="nextBtn">Next step →</button>
                  <div class="subtext" id="stepHint"></div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
      <script>
        // -------- STEP META --------
        var stepTitles = [
          "Gym & role logins",
          "Schedule",
          "Team",
          "Memberships",
          "Review"
        ];
        var stepCaptions = [
          "Separate login for admin / owner / manager",
          "Opening hours & type",
          "Workers & duty slots",
          "Packages & pricing",
          "Check everything & finish"
        ];

        // -------- DOM HOOKS --------
        var stepContainer = document.getElementById("steps");
        var stepContents = Array.prototype.slice.call(
          document.querySelectorAll(".step-content")
        );
        var nextBtn = document.getElementById("nextBtn");
        var backBtn = document.getElementById("backBtn");
        var stepHint = document.getElementById("stepHint");

        var workersContainer = document.getElementById("workers");
        var workerCountSelect = document.getElementById("workerCount");
        var shiftPresetSelect = document.getElementById("shiftPreset");

        var statusBox = document.getElementById("status");
        var summaryBox = document.getElementById("summary");

        var plansContainer = document.getElementById("plans");
        var addPlanBtn = document.getElementById("addPlan");

        var currentStep = 0;
        var membershipPlans = [
          {
            name: "Standard",
            price: "1500",
            billing: "monthly",
            access: "full",
            perks: "Gym floor + basic classes"
          },
          {
            name: "Premium",
            price: "2500",
            billing: "monthly",
            access: "full",
            perks: "All classes, full-time access"
          }
        ];

        // -------- HELPERS --------
        function populateWorkerCount() {
          var html = "";
          for (var i = 1; i <= 20; i++) {
            html +=
              '<option value="' +
              i +
              '"' +
              (i === 3 ? " selected" : "") +
              ">" +
              i +
              "</option>";
          }
          workerCountSelect.innerHTML = html;
        }

        function renderSteps() {
          var html = "";
          for (var i = 0; i < stepTitles.length; i++) {
            var active = i === currentStep ? " active" : "";
            html +=
              '<div class="step' +
              active +
              '"><div class="step-number">' +
              (i + 1) +
              '</div><div><div class="step-title">' +
              stepTitles[i] +
              '</div><div class="step-caption">' +
              stepCaptions[i] +
              "</div></div></div>";
          }
          stepContainer.innerHTML = html;
          stepHint.textContent = stepCaptions[currentStep];
        }

        function timeFromPreset(index, preset) {
          var startHour = 6 + (index % 3) * 3;
          var start = (startHour < 10 ? "0" : "") + startHour + ":00";
          var endHour = (startHour + preset) % 24;
          var end = (endHour < 10 ? "0" : "") + endHour + ":00";
          return { start: start, end: end };
        }

        function renderWorkers() {
          var count = Number(workerCountSelect.value || 0);
          var preset = Number(shiftPresetSelect.value || 8);
          var html = "";
          for (var i = 0; i < count; i++) {
            var times = timeFromPreset(i, preset);
            html +=
              '<div class="worker-card">' +
              '<div class="worker-header">' +
              '<div style="font-weight:600; font-size:14px;">Worker ' +
              (i + 1) +
              "</div>" +
              '<span class="pill">Default shift ' +
              times.start +
              " – " +
              times.end +
              "</span>" +
              "</div>" +
              '<div class="grid">' +
              '<div class="field">' +
              '<label for="worker-name-' +
              i +
              '">Full name</label>' +
              '<input id="worker-name-' +
              i +
              '" placeholder="e.g. Trainer ' +
              (i + 1) +
              '" />' +
              "</div>" +
              '<div class="field">' +
              '<label for="worker-role-' +
              i +
              '">Role</label>' +
              '<select id="worker-role-' +
              i +
              '">' +
              '<option value="trainer">Trainer</option>' +
              '<option value="front-desk">Front desk</option>' +
              '<option value="maintenance">Maintenance</option>' +
              '<option value="manager">Manager</option>' +
              "</select>" +
              "</div>" +
              '<div class="field">' +
              '<label for="worker-start-' +
              i +
              '">Duty starts</label>' +
              '<input id="worker-start-' +
              i +
              '" type="time" value="' +
              times.start +
              '" />' +
              "</div>" +
              '<div class="field">' +
              '<label for="worker-end-' +
              i +
              '">Duty ends</label>' +
              '<input id="worker-end-' +
              i +
              '" type="time" value="' +
              times.end +
              '" />' +
              "</div>" +
              "</div>" +
              "</div>";
          }
          workersContainer.innerHTML = html;
        }

        function renderPlans() {
          var html = "";
          for (var i = 0; i < membershipPlans.length; i++) {
            var plan = membershipPlans[i];
            var removeButton =
              i > 0
                ? '<button type="button" class="secondary" data-remove="' +
                  i +
                  '" style="padding:6px 10px; font-size:12px;">Remove</button>'
                : "";
            html +=
              '<div class="plan-card">' +
              '<div class="plan-header">' +
              '<div style="font-weight:600; font-size:14px;">Plan ' +
              (i + 1) +
              "</div>" +
              removeButton +
              "</div>" +
              '<div class="inline">' +
              '<div class="field">' +
              '<label for="plan-name-' +
              i +
              '">Name</label>' +
              '<input id="plan-name-' +
              i +
              '" value="' +
              plan.name +
              '" />' +
              "</div>" +
              '<div class="field">' +
              '<label for="plan-price-' +
              i +
              '">Price</label>' +
              '<input id="plan-price-' +
              i +
              '" type="number" min="0" value="' +
              plan.price +
              '" />' +
              "</div>" +
              '<div class="field">' +
              '<label for="plan-billing-' +
              i +
              '">Billing</label>' +
              '<select id="plan-billing-' +
              i +
              '">' +
              '<option value="daily"' +
              (plan.billing === "daily" ? " selected" : "") +
              ">Per day</option>" +
              '<option value="weekly"' +
              (plan.billing === "weekly" ? " selected" : "") +
              ">Weekly</option>" +
              '<option value="monthly"' +
              (plan.billing === "monthly" ? " selected" : "") +
              ">Monthly</option>" +
              '<option value="yearly"' +
              (plan.billing === "yearly" ? " selected" : "") +
              ">Yearly</option>" +
              "</select>" +
              "</div>" +
              '<div class="field">' +
              '<label for="plan-access-' +
              i +
              '">Access</label>' +
              '<select id="plan-access-' +
              i +
              '">' +
              '<option value="full"' +
              (plan.access === "full" ? " selected" : "") +
              ">Full facility</option>" +
              '<option value="daytime"' +
              (plan.access === "daytime" ? " selected" : "") +
              ">Daytime</option>" +
              '<option value="classes"' +
              (plan.access === "classes" ? " selected" : "") +
              ">Classes only</option>" +
              '<option value="swim"' +
              (plan.access === "swim" ? " selected" : "") +
              ">Pool & spa</option>" +
              "</select>" +
              "</div>" +
              "</div>" +
              '<div class="field" style="margin-top:8px;">' +
              '<label for="plan-perks-' +
              i +
              '">Perks</label>' +
              '<textarea id="plan-perks-' +
              i +
              '" rows="2">' +
              (plan.perks || "") +
              "</textarea>" +
              "</div>" +
              '<div class="chip-row">' +
              '<span class="chip">Billing: ' +
              plan.billing +
              "</span>" +
              '<span class="chip">Access: ' +
              plan.access +
              "</span>" +
              "</div>" +
              "</div>";
          }
          plansContainer.innerHTML = html;

          var removeButtons = plansContainer.querySelectorAll("[data-remove]");
          for (var j = 0; j < removeButtons.length; j++) {
            removeButtons[j].addEventListener("click", function (event) {
              var index = Number(event.target.getAttribute("data-remove"));
              membershipPlans.splice(index, 1);
              renderPlans();
            });
          }
        }

        function syncPlansFromInputs() {
          for (var i = 0; i < membershipPlans.length; i++) {
            var nameEl = document.getElementById("plan-name-" + i);
            var priceEl = document.getElementById("plan-price-" + i);
            var billingEl = document.getElementById("plan-billing-" + i);
            var accessEl = document.getElementById("plan-access-" + i);
            var perksEl = document.getElementById("plan-perks-" + i);
            if (!membershipPlans[i]) membershipPlans[i] = {};
            membershipPlans[i].name = nameEl ? nameEl.value : membershipPlans[i].name;
            membershipPlans[i].price = priceEl ? priceEl.value : membershipPlans[i].price;
            membershipPlans[i].billing = billingEl ? billingEl.value : membershipPlans[i].billing;
            membershipPlans[i].access = accessEl ? accessEl.value : membershipPlans[i].access;
            membershipPlans[i].perks = perksEl ? perksEl.value : membershipPlans[i].perks;
          }
        }

        function goToStep(index) {
          for (var i = 0; i < stepContents.length; i++) {
            stepContents[i].style.display = i === index ? "" : "none";
          }
          currentStep = index;
          renderSteps();
          backBtn.style.visibility = index === 0 ? "hidden" : "visible";
          nextBtn.textContent =
            index === stepContents.length - 1 ? "Finish setup" : "Next step →";
        }

        function validateCurrentStep() {
          var container = stepContents[currentStep];
          if (!container) return true;
          var inputs = container.querySelectorAll("input, select");
          for (var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            if (input.hasAttribute("required") && !input.value) {
              if (typeof input.reportValidity === "function") {
                input.reportValidity();
              }
              input.focus();
              return false;
            }
          }
          return true;
        }

        function gatherData() {
          syncPlansFromInputs();

          function v(id) {
            var el = document.getElementById(id);
            return el && typeof el.value === "string" ? el.value.trim() : "";
          }

          var gymTypeEl = document.getElementById("gymType");
          var openingEl = document.getElementById("openingTime");
          var closingEl = document.getElementById("closingTime");

          var data = {
            gymName: v("gymName"),

            adminName: v("adminName"),
            adminEmail: v("adminEmail"),
            adminPassword: v("adminPassword"),

            ownerName: v("ownerName"),
            ownerEmail: v("ownerEmail"),
            ownerPassword: v("ownerPassword"),

            managerName: v("managerName"),
            managerEmail: v("managerEmail"),
            managerPassword: v("managerPassword"),

            gymType: gymTypeEl ? (gymTypeEl.value || "").trim() : "",
            openingTime: openingEl ? (openingEl.value || "").trim() : "",
            closingTime: closingEl ? (closingEl.value || "").trim() : "",

            workerCount: Number(workerCountSelect.value || 0),
            workers: [],
            memberships: membershipPlans
          };

          for (var i = 0; i < data.workerCount; i++) {
            var nameEl = document.getElementById("worker-name-" + i);
            var roleEl = document.getElementById("worker-role-" + i);
            var startEl = document.getElementById("worker-start-" + i);
            var endEl = document.getElementById("worker-end-" + i);

            data.workers.push({
              name: nameEl ? nameEl.value : "",
              role: roleEl ? roleEl.value : "",
              dutyStart: startEl ? startEl.value : "",
              dutyEnd: endEl ? endEl.value : ""
            });
          }

          return data;
        }

        function showSummary() {
          var data = gatherData();
          var previewTables = [
            "gyms (identity & hours)",
            "accounts (admin / manager / owner / worker logins)",
            "workers (duty slots)",
            "membership_plans (pricing & billing)",
            "members (members linked to plans)",
            "attendance_logs (check-ins)",
            "balance_dues (due tracking)"
          ];

          var html =
            '<div class="summary-item">' +
            '<div class="summary-item-title">Gym</div>' +
            '<div class="summary-item-body">' +
            (data.gymName || "Unnamed gym") +
            "<br /><span style='color:#64748b;'>" +
            (data.gymType || "Type not set") +
            " • " +
            (data.openingTime || "--:--") +
            " – " +
            (data.closingTime || "--:--") +
            "</span></div></div>";

          html +=
            '<div class="summary-item">' +
            '<div class="summary-item-title">Accounts</div>' +
            '<div class="summary-item-body">' +
            "<strong>Admin:</strong> " +
            (data.adminEmail || "not set") +
            "<br />" +
            "<strong>Owner:</strong> " +
            (data.ownerEmail || "none") +
            "<br />" +
            "<strong>Manager:</strong> " +
            (data.managerEmail || "none") +
            "</div></div>";

          html +=
            '<div class="summary-item">' +
            '<div class="summary-item-title">Team</div>' +
            '<div class="summary-item-body">' +
            data.workerCount +
            " workers configured</div></div>";

          html +=
            '<div class="summary-item">' +
            '<div class="summary-item-title">Memberships</div>' +
            '<div class="summary-item-body">' +
            data.memberships.length +
            " membership types<br />" +
            data.memberships
              .map(function (m) {
                return m.name + " (" + m.billing + ")";
              })
              .join(", ") +
            "</div></div>";

          html +=
            '<div class="summary-item">' +
            '<div class="summary-item-title">Tables to create</div>' +
            '<div class="summary-item-body"><ul style="padding-left:16px; margin:4px 0 0;">' +
            previewTables
              .map(function (t) {
                return "<li>" + t + "</li>";
              })
              .join("") +
            "</ul></div></div>";

          summaryBox.innerHTML = html;
        }

        // -------- INIT --------
        populateWorkerCount();
        renderSteps();
        renderWorkers();
        renderPlans();
        goToStep(0);

        workerCountSelect.addEventListener("change", renderWorkers);
        shiftPresetSelect.addEventListener("change", renderWorkers);

        addPlanBtn.addEventListener("click", function () {
          syncPlansFromInputs();
          membershipPlans.push({
            name: "New plan",
            price: "0",
            billing: "monthly",
            access: "full",
            perks: ""
          });
          renderPlans();
        });

        nextBtn.addEventListener("click", function () {
          if (!validateCurrentStep()) return;

          if (currentStep < stepContents.length - 1) {
            if (currentStep === stepContents.length - 2) {
              showSummary();
            }
            goToStep(currentStep + 1);
            return;
          }

          var payload = gatherData();
          statusBox.style.display = "block";
          statusBox.classList.remove("error");
          statusBox.textContent = "Creating gym and all accounts...";

          fetch("/api/setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          })
            .then(function (response) {
              return response.json().then(function (data) {
                return { ok: response.ok, data: data };
              });
            })
            .then(function (result) {
              if (!result.ok) {
                throw new Error(result.data.error || "Failed to create gym");
              }
              statusBox.textContent = "Gym created. Redirecting to dashboard...";
              window.location.href = "/admin";
            })
            .catch(function (error) {
              statusBox.classList.add("error");
              statusBox.textContent = error.message || "Something went wrong.";
            });
        });

        backBtn.addEventListener("click", function () {
          if (currentStep === 0) return;
          goToStep(currentStep - 1);
        });
      </script>
    </body>
  </html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "no-store" },
  });
}

/* ----------------------- Login page ----------------------- */

function renderLogin(): Response {
  const html = `${baseHead("Gym Login")}
    <body>
      <header>
        <div class="header-inner">
          <div class="brand">
            <div class="brand-mark">G</div>
            <div class="brand-text">
              <h1>Gym admin login</h1>
              <p>Sign in with your role account to manage your gym.</p>
            </div>
          </div>
          <div class="tagline">Secure access</div>
        </div>
      </header>
      <main>
        <div class="shell">
          <div class="card" style="max-width: 420px; margin: 0 auto;">
            <h2 style="margin-top:0; margin-bottom:4px; font-size:18px;">Welcome back</h2>
            <p style="margin:0 0 16px; font-size:13px; color:#6b7280;">
              Use the email and password for your admin / owner / manager / worker account.
            </p>
            <div class="field" style="display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">
              <label for="email">Email</label>
              <input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div class="field" style="display:flex; flex-direction:column; gap:6px; margin-bottom:14px;">
              <label for="password">Password</label>
              <input id="password" type="password" placeholder="••••••••" />
            </div>
            <button class="primary" id="loginBtn" style="width:100%; justify-content:center; margin-bottom:6px;">Sign in</button>
            <div id="status" style="font-size:12px; color:#991b1b; min-height:16px;"></div>
          </div>
        </div>
      </main>
      <script>
        var btn = document.getElementById("loginBtn");
        var statusBox = document.getElementById("status");
        btn.addEventListener("click", function () {
          statusBox.textContent = "";
          var emailEl = document.getElementById("email");
          var passEl = document.getElementById("password");
          var email = emailEl && emailEl.value ? emailEl.value.trim() : "";
          var password = passEl && passEl.value ? passEl.value.trim() : "";
          if (!email || !password) {
            statusBox.textContent = "Enter both email and password.";
            return;
          }
          fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, password: password })
          })
            .then(function (res) {
              return res.json().then(function (data) {
                return { ok: res.ok, data: data };
              });
            })
            .then(function (result) {
              if (!result.ok) throw new Error(result.data.error || "Login failed");
              window.location.href = "/admin";
            })
            .catch(function (err) {
              statusBox.textContent = err.message || "Login failed.";
            });
        });
      </script>
    </body>
  </html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "no-store" },
  });
}

/* ----------------------- Dashboard page (same as before) ----------------------- */
/* (I’m not re-explaining everything; just keeping exactly as from last version.) */

function renderAdminDashboard(accountName: string, role: string): Response {
  const html = `${baseHead("Gym Admin Dashboard")}
    <body>
      <header>
        <div class="header-inner">
          <div class="brand">
            <div class="brand-mark">G</div>
            <div class="brand-text">
              <h1>Gym dashboard</h1>
              <p>Manage attendance, memberships, workers and roles.</p>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="font-size:12px; text-align:right;">
              <div style="font-weight:600;">${accountName || "Account"}</div>
              <div style="color:#6b7280;">${role}</div>
            </div>
            <button class="ghost" id="logoutBtn">Log out</button>
          </div>
        </div>
      </header>
      <main>
        <div class="shell" style="display:flex; gap:16px; min-height:520px;">
          <style>
            .sidebar {
              width: 220px;
              max-width: 40%;
              background: var(--surface);
              border-radius: 16px;
              border: 1px solid rgba(148,163,184,0.35);
              padding: 12px 10px;
              display: flex;
              flex-direction: column;
              gap: 6px;
              height: fit-content;
            }
            .nav-item {
              padding: 8px 10px;
              border-radius: 10px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 13px;
              cursor: pointer;
              color: #475569;
            }
            .nav-item span { font-weight: 500; }
            .nav-item.active {
              background: var(--primary-soft);
              color: #1d4ed8;
            }
            .main-panel {
              flex: 1;
              border-radius: 18px;
              background: var(--surface);
              border: 1px solid rgba(148,163,184,0.35);
              padding: 14px 14px 16px;
              box-shadow: var(--shadow-soft);
              overflow: hidden;
            }
            .panel-header {
              display:flex;
              justify-content:space-between;
              align-items:center;
              margin-bottom:8px;
            }
            .panel-title {
              font-size:16px;
              font-weight:600;
            }
            .panel-subtitle {
              font-size:12px;
              color:#6b7280;
            }
            .cards-row {
              display:grid;
              grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
              gap:10px;
              margin-bottom:12px;
            }
            .metric-card {
              background: var(--surface-soft);
              border-radius:12px;
              border:1px solid var(--border);
              padding:10px 10px;
              font-size:13px;
            }
            .metric-label {
              color:#6b7280;
              font-size:12px;
            }
            .metric-value {
              font-size:18px;
              font-weight:700;
            }
            .metric-extra {
              margin-top:3px;
              font-size:11px;
              color:#16a34a;
            }
            .section {
              margin-top:10px;
            }
            .section h3 {
              margin:0 0 6px;
              font-size:14px;
            }
            .section-inner {
              border-radius:12px;
              border:1px solid var(--border);
              padding:8px 10px;
              background:#f9fafb;
            }
            .list-row {
              display:flex;
              justify-content:space-between;
              align-items:center;
              padding:6px 0;
              border-bottom:1px dashed rgba(148,163,184,0.5);
              font-size:12px;
            }
            .list-row:last-child{ border-bottom:none; }
            .pill-soft {
              display:inline-flex;
              padding:3px 7px;
              border-radius:999px;
              font-size:11px;
              background:#e5e7eb;
              color:#374151;
            }
            .pill-soft.green {
              background:#dcfce7;
              color:#166534;
            }
            .pill-soft.blue {
              background:#dbeafe;
              color:#1d4ed8;
            }
            .pill-soft.orange {
              background:#ffedd5;
              color:#c05621;
            }
            .form-grid {
              display:grid;
              grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
              gap:10px;
            }
            .field {
              display:flex;
              flex-direction:column;
              gap:4px;
              font-size:12px;
            }
            .field label { font-weight:600; font-size:12px; }
            .field small { font-size:11px; color:#6b7280; }
            .btn-row {
              display:flex;
              justify-content:flex-end;
              gap:8px;
              margin-top:8px;
            }
            .danger-text { color:var(--danger); font-size:12px; }
            .status-bar {
              font-size:12px;
              margin-top:6px;
              min-height:16px;
            }
            @media(max-width:768px){
              .shell{ flex-direction:column; }
              .sidebar{ width:100%; max-width:none; flex-direction:row; overflow-x:auto; }
              .nav-item{ flex:1; justify-content:center; }
            }
          </style>

          <aside class="sidebar">
            <div class="nav-item active" data-tab="overview">
              <span>Overview</span><span>●</span>
            </div>
            <div class="nav-item" data-tab="memberships">
              <span>Memberships</span><span>●</span>
            </div>
            <div class="nav-item" data-tab="workers">
              <span>Workers</span><span>●</span>
            </div>
            <div class="nav-item" data-tab="accounts">
              <span>Accounts</span><span>●</span>
            </div>
            <div class="nav-item" data-tab="settings">
              <span>Settings</span><span>●</span>
            </div>
          </aside>

          <section class="main-panel">
            <div class="panel-header">
              <div>
                <div class="panel-title" id="panelTitle">Overview</div>
                <div class="panel-subtitle" id="panelSubtitle">Quick snapshot of your gym</div>
              </div>
              <div style="font-size:11px; color:#6b7280;" id="gymLabel"></div>
            </div>

            <div id="tab-overview">
              <div class="cards-row">
                <div class="metric-card">
                  <div class="metric-label">Active memberships</div>
                  <div class="metric-value" id="metricMembers">0</div>
                  <div class="metric-extra" id="metricMembersNote">No members yet</div>
                </div>
                <div class="metric-card">
                  <div class="metric-label">Membership plans</div>
                  <div class="metric-value" id="metricPlans">0</div>
                  <div class="metric-extra">Standard / Premium ready</div>
                </div>
                <div class="metric-card">
                  <div class="metric-label">Workers</div>
                  <div class="metric-value" id="metricWorkers">0</div>
                  <div class="metric-extra">Trainers & support team</div>
                </div>
              </div>

              <div class="section">
                <h3>Today’s attendance (placeholder)</h3>
                <div class="section-inner">
                  <div class="list-row">
                    <span>Attendance tracking</span>
                    <span class="pill-soft orange">Will be implemented later</span>
                  </div>
                </div>
              </div>
            </div>

            <div id="tab-memberships" style="display:none;">
              <div class="section">
                <h3>Existing membership plans</h3>
                <div class="section-inner" id="membershipList">
                  <div class="list-row"><span>Loading...</span></div>
                </div>
              </div>
              <div class="section" style="margin-top:12px;">
                <h3>Add new membership plan</h3>
                <div class="section-inner">
                  <div class="form-grid">
                    <div class="field">
                      <label for="m-name">Name</label>
                      <input id="m-name" placeholder="e.g. Evening pass" />
                    </div>
                    <div class="field">
                      <label for="m-price">Price</label>
                      <input id="m-price" type="number" min="0" placeholder="e.g. 1200" />
                    </div>
                    <div class="field">
                      <label for="m-billing">Billing</label>
                      <select id="m-billing">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly" selected>Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div class="field">
                      <label for="m-access">Access</label>
                      <select id="m-access">
                        <option value="full">Full facility</option>
                        <option value="daytime">Daytime</option>
                        <option value="classes">Classes only</option>
                        <option value="swim">Pool & spa</option>
                      </select>
                    </div>
                  </div>
                  <div class="field" style="margin-top:8px;">
                    <label for="m-perks">Perks</label>
                    <textarea id="m-perks" rows="2" placeholder="Describe what this plan includes"></textarea>
                  </div>
                  <div class="btn-row">
                    <button class="primary" id="btnAddMembership">Add plan</button>
                  </div>
                  <div class="status-bar" id="membershipStatus"></div>
                </div>
              </div>
            </div>

            <div id="tab-workers" style="display:none;">
              <div class="section">
                <h3>Workers</h3>
                <div class="section-inner" id="workerList">
                  <div class="list-row"><span>Loading...</span></div>
                </div>
              </div>
              <div class="section" style="margin-top:12px;">
                <h3>Add worker</h3>
                <div class="section-inner">
                  <div class="form-grid">
                    <div class="field">
                      <label for="w-name">Full name</label>
                      <input id="w-name" placeholder="e.g. Trainer Mahfuz" />
                    </div>
                    <div class="field">
                      <label for="w-role">Role</label>
                      <select id="w-role">
                        <option value="trainer">Trainer</option>
                        <option value="front-desk">Front desk</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>
                    <div class="field">
                      <label for="w-start">Duty starts</label>
                      <input id="w-start" type="time" />
                    </div>
                    <div class="field">
                      <label for="w-end">Duty ends</label>
                      <input id="w-end" type="time" />
                    </div>
                  </div>
                  <div class="btn-row">
                    <button class="primary" id="btnAddWorker">Add worker</button>
                  </div>
                  <div class="status-bar" id="workerStatus"></div>
                </div>
              </div>
            </div>

            <div id="tab-accounts" style="display:none;">
              <div class="section">
                <h3>Accounts (logins)</h3>
                <div class="section-inner" id="accountList">
                  <div class="list-row"><span>Loading...</span></div>
                </div>
              </div>
              <div class="section" style="margin-top:12px;">
                <h3>Create new account</h3>
                <div class="section-inner">
                  <div class="form-grid">
                    <div class="field">
                      <label for="a-name">Full name</label>
                      <input id="a-name" placeholder="e.g. New manager" />
                    </div>
                    <div class="field">
                      <label for="a-email">Email</label>
                      <input id="a-email" type="email" placeholder="user@example.com" />
                      <small>Used for login</small>
                    </div>
                    <div class="field">
                      <label for="a-role">Role</label>
                      <select id="a-role">
                        <option value="manager">Manager</option>
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="worker">Worker</option>
                      </select>
                    </div>
                    <div class="field">
                      <label for="a-password">Password</label>
                      <input id="a-password" type="password" placeholder="Set a password" />
                    </div>
                  </div>
                  <div class="btn-row">
                    <button class="primary" id="btnAddAccount">Create account</button>
                  </div>
                  <div class="status-bar" id="accountStatus"></div>
                </div>
              </div>
            </div>

            <div id="tab-settings" style="display:none;">
              <div class="section">
                <h3>Settings</h3>
                <div class="section-inner">
                  <p style="margin:0; font-size:13px;">Basic settings will be managed here later (gym name, opening hours, etc.).</p>
                  <p class="danger-text" style="margin-top:8px;">Note: Do not delete the database directly unless you know what you’re doing.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <script>
        var CURRENT_ROLE = "${role}";
        var navItems = document.querySelectorAll(".nav-item");
        var tabs = {
          overview: document.getElementById("tab-overview"),
          memberships: document.getElementById("tab-memberships"),
          workers: document.getElementById("tab-workers"),
          accounts: document.getElementById("tab-accounts"),
          settings: document.getElementById("tab-settings")
        };
        var titles = {
          overview: "Overview",
          memberships: "Memberships",
          workers: "Workers",
          accounts: "Accounts",
          settings: "Settings"
        };
        var subtitles = {
          overview: "Quick snapshot of your gym",
          memberships: "Configure plans and pricing",
          workers: "Manage trainers and staff",
          accounts: "Who can log in and manage",
          settings: "Basic gym configuration"
        };
        var panelTitle = document.getElementById("panelTitle");
        var panelSubtitle = document.getElementById("panelSubtitle");
        var gymLabel = document.getElementById("gymLabel");

        navItems.forEach(function(item) {
          var tab = item.getAttribute("data-tab");
          if (CURRENT_ROLE === "worker") {
            if (tab === "accounts" || tab === "settings") item.style.display = "none";
          } else if (CURRENT_ROLE === "manager") {
            if (tab === "settings") item.style.display = "none";
          }
        });

        function switchTab(tab) {
          for (var key in tabs) {
            if (!tabs.hasOwnProperty(key)) continue;
            tabs[key].style.display = key === tab ? "" : "none";
          }
          navItems.forEach(function(item) {
            item.classList.toggle("active", item.getAttribute("data-tab") === tab);
          });
          panelTitle.textContent = titles[tab];
          panelSubtitle.textContent = subtitles[tab];
        }

        navItems.forEach(function(item) {
          item.addEventListener("click", function() {
            var tab = item.getAttribute("data-tab");
            if (tab === "accounts" && CURRENT_ROLE === "worker") return;
            if (tab === "settings" && (CURRENT_ROLE === "worker" || CURRENT_ROLE === "manager")) return;
            switchTab(tab);
          });
        });

        document.getElementById("logoutBtn").addEventListener("click", function() {
          fetch("/api/logout", { method: "POST" }).finally(function() {
            window.location.href = "/";
          });
        });

        function loadBootstrap() {
          fetch("/api/admin/bootstrap")
            .then(function(res) {
              return res.json().then(function(data) {
                return { ok: res.ok, data: data };
              });
            })
            .then(function(result) {
              if (!result.ok) throw new Error(result.data.error || "Failed");
              var data = result.data;

              if (data.gym) {
                gymLabel.textContent =
                  data.gym.name +
                  " • " +
                  data.gym.gym_type +
                  " • " +
                  data.gym.opening_time +
                  "–" +
                  data.gym.closing_time;
              }

              document.getElementById("metricMembers").textContent = data.memberCount || 0;
              document.getElementById("metricPlans").textContent = data.plans.length || 0;
              document.getElementById("metricWorkers").textContent = data.workers.length || 0;
              var note = document.getElementById("metricMembersNote");
              if ((data.memberCount || 0) === 0) {
                note.textContent = "No members yet";
              } else {
                note.textContent = data.memberCount + " active member(s)";
              }

              var membershipList = document.getElementById("membershipList");
              if (!data.plans.length) {
                membershipList.innerHTML = '<div class="list-row"><span>No plans yet</span></div>';
              } else {
                membershipList.innerHTML = data.plans
                  .map(function(p) {
                    return (
                      '<div class="list-row"><span>' +
                      p.name +
                      '</span><span class="pill-soft blue">' +
                      p.billing_cycle +
                      " • " +
                      p.price +
                      "</span></div>"
                    );
                  })
                  .join("");
              }

              var workerList = document.getElementById("workerList");
              if (!data.workers.length) {
                workerList.innerHTML = '<div class="list-row"><span>No workers yet</span></div>';
              } else {
                workerList.innerHTML = data.workers
                  .map(function(w) {
                    return (
                      '<div class="list-row"><span>' +
                      w.full_name +
                      '</span><span class="pill-soft">' +
                      w.role +
                      " • " +
                      (w.duty_start || "--:--") +
                      "-" +
                      (w.duty_end || "--:--") +
                      "</span></div>"
                    );
                  })
                  .join("");
              }

              var accountList = document.getElementById("accountList");
              if (!data.accounts.length) {
                accountList.innerHTML = '<div class="list-row"><span>No accounts yet</span></div>';
              } else {
                accountList.innerHTML = data.accounts
                  .map(function(a) {
                    return (
                      '<div class="list-row"><span>' +
                      a.full_name +
                      " (" +
                      (a.email || "no email") +
                      ')</span><span class="pill-soft green">' +
                      a.role +
                      "</span></div>"
                    );
                  })
                  .join("");
              }
            })
            .catch(function(err) {
              console.error(err);
            });
        }

        var btnAddMembership = document.getElementById("btnAddMembership");
        if (btnAddMembership) {
          btnAddMembership.addEventListener("click", function() {
            if (CURRENT_ROLE === "worker") return;
            var name = (document.getElementById("m-name").value || "").trim();
            var price = (document.getElementById("m-price").value || "").trim();
            var billing = (document.getElementById("m-billing").value || "");
            var access = (document.getElementById("m-access").value || "");
            var perks = (document.getElementById("m-perks").value || "").trim();
            var status = document.getElementById("membershipStatus");
            status.textContent = "";
            if (!name || !price) {
              status.textContent = "Name and price are required.";
              return;
            }
            fetch("/api/admin/add-membership", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: name,
                price: Number(price),
                billing: billing,
                access: access,
                perks: perks
              })
            })
              .then(function(res) {
                return res.json().then(function(data) {
                  return { ok: res.ok, data: data };
                });
              })
              .then(function(result) {
                if (!result.ok) throw new Error(result.data.error || "Failed to add plan");
                status.textContent = "Plan added.";
                document.getElementById("m-name").value = "";
                document.getElementById("m-price").value = "";
                document.getElementById("m-perks").value = "";
                loadBootstrap();
              })
              .catch(function(err) {
                status.textContent = err.message || "Error adding plan.";
              });
          });
        }

        var btnAddWorker = document.getElementById("btnAddWorker");
        if (btnAddWorker) {
          btnAddWorker.addEventListener("click", function() {
            if (CURRENT_ROLE === "worker") return;
            var name = (document.getElementById("w-name").value || "").trim();
            var role = (document.getElementById("w-role").value || "trainer");
            var dutyStart = (document.getElementById("w-start").value || "").trim();
            var dutyEnd = (document.getElementById("w-end").value || "").trim();
            var status = document.getElementById("workerStatus");
            status.textContent = "";
            if (!name) {
              status.textContent = "Worker name is required.";
              return;
            }
            fetch("/api/admin/add-worker", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: name,
                role: role,
                dutyStart: dutyStart,
                dutyEnd: dutyEnd
              })
            })
              .then(function(res) {
                return res.json().then(function(data) {
                  return { ok: res.ok, data: data };
                });
              })
              .then(function(result) {
                if (!result.ok) throw new Error(result.data.error || "Failed to add worker");
                status.textContent = "Worker added.";
                document.getElementById("w-name").value = "";
                document.getElementById("w-start").value = "";
                document.getElementById("w-end").value = "";
                loadBootstrap();
              })
              .catch(function(err) {
                status.textContent = err.message || "Error adding worker.";
              });
          });
        }

        var btnAddAccount = document.getElementById("btnAddAccount");
        if (btnAddAccount) {
          btnAddAccount.addEventListener("click", function() {
            if (CURRENT_ROLE !== "admin" && CURRENT_ROLE !== "owner") return;
            var name = (document.getElementById("a-name").value || "").trim();
            var email = (document.getElementById("a-email").value || "").trim();
            var role = (document.getElementById("a-role").value || "manager");
            var password = (document.getElementById("a-password").value || "").trim();
            var status = document.getElementById("accountStatus");
            status.textContent = "";
            if (!name || !email || !password) {
              status.textContent = "Name, email and password are required.";
              return;
            }
            fetch("/api/admin/add-account", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: name,
                email: email,
                role: role,
                password: password
              })
            })
              .then(function(res) {
                return res.json().then(function(data) {
                  return { ok: res.ok, data: data };
                });
              })
              .then(function(result) {
                if (!result.ok) throw new Error(result.data.error || "Failed to create account");
                status.textContent = "Account created.";
                document.getElementById("a-name").value = "";
                document.getElementById("a-email").value = "";
                document.getElementById("a-password").value = "";
                loadBootstrap();
              })
              .catch(function(err) {
                status.textContent = err.message || "Error creating account.";
              });
          });
        }

        switchTab("overview");
        loadBootstrap();
      </script>
    </body>
  </html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "no-store" },
  });
}

/* ----------------------- Utils ----------------------- */

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

function safeText(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const v = value.trim();
    return v === "" ? fallback : v;
  }
  return fallback;
}

function safeTime(value: unknown, fallback = "00:00"): string {
  const t = safeText(value, fallback);
  return t || fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get("Cookie");
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [name, ...rest] = part.split("=");
    if (!name) continue;
    cookies[name.trim()] = decodeURIComponent(rest.join("=").trim());
  }
  return cookies;
}

/* ----------------------- DB setup ----------------------- */

async function setupDatabase(env: Env) {
  if (!env.DB) throw new Error("D1 binding DB is missing from the environment.");

  const statements = [
    `CREATE TABLE IF NOT EXISTS gyms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gym_type TEXT NOT NULL,
      opening_time TEXT NOT NULL,
      closing_time TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`,
    `CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      FOREIGN KEY (gym_id) REFERENCES gyms(id)
    )`,
    `CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      duty_start TEXT NOT NULL,
      duty_end TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      FOREIGN KEY (gym_id) REFERENCES gyms(id)
    )`,
    `CREATE TABLE IF NOT EXISTS membership_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      billing_cycle TEXT NOT NULL,
      access_scope TEXT,
      perks TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      FOREIGN KEY (gym_id) REFERENCES gyms(id)
    )`,
    `CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      membership_plan_id INTEGER,
      start_date TEXT,
      end_date TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      FOREIGN KEY (gym_id) REFERENCES gyms(id),
      FOREIGN KEY (membership_plan_id) REFERENCES membership_plans(id)
    )`,
    `CREATE TABLE IF NOT EXISTS attendance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_id INTEGER NOT NULL,
      worker_id INTEGER,
      attendee_name TEXT,
      attendee_type TEXT NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT,
      status TEXT DEFAULT 'present',
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      FOREIGN KEY (gym_id) REFERENCES gyms(id),
      FOREIGN KEY (worker_id) REFERENCES workers(id)
    )`,
    `CREATE TABLE IF NOT EXISTS balance_dues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_id INTEGER NOT NULL,
      member_name TEXT NOT NULL,
      amount_due REAL NOT NULL,
      due_date TEXT,
      status TEXT DEFAULT 'unpaid',
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      FOREIGN KEY (gym_id) REFERENCES gyms(id)
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      expires_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    )`,
  ];

  for (const sql of statements) {
    await env.DB.prepare(sql).run();
  }
}

async function getGymCount(env: Env): Promise<number> {
  const row = await env.DB.prepare("SELECT COUNT(*) AS c FROM gyms").first<{ c: number }>();
  return row?.c ?? 0;
}

/* ----------------------- Sessions ----------------------- */

async function createSession(env: Env, accountId: number): Promise<string> {
  const token = crypto.randomUUID();
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  const expiresStr = expires.toISOString();
  await env.DB.prepare(
    `INSERT INTO sessions (account_id, token, expires_at) VALUES (?, ?, ?)`,
  ).bind(accountId, token, expiresStr).run();
  return token;
}

async function getSessionAccount(
  env: Env,
  token: string | undefined | null,
): Promise<{ id: number; full_name: string; role: string; gym_id: number } | null> {
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT a.id, a.full_name, a.role, a.gym_id
     FROM sessions s
     JOIN accounts a ON s.account_id = a.id
     WHERE s.token = ?`,
  ).bind(token).first<any>();
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name,
    role: row.role,
    gym_id: row.gym_id,
  };
}

/* ----------------------- Setup handler ----------------------- */

async function handleSetup(env: Env, raw: any): Promise<number> {
  const workerCount = safeNumber(raw?.workerCount, 0);
  const workers = Array.isArray(raw?.workers) ? raw.workers.slice(0, 50) : [];
  const memberships = Array.isArray(raw?.memberships) ? raw.memberships.slice(0, 50) : [];

  const gymName = safeText(raw?.gymName, "Gym");

  const adminName = safeText(raw?.adminName, "Admin");
  const adminEmail = safeText(raw?.adminEmail);
  const adminPassword = safeText(raw?.adminPassword);

  const ownerName = safeText(raw?.ownerName);
  const ownerEmail = safeText(raw?.ownerEmail);
  const ownerPassword = safeText(raw?.ownerPassword);

  const managerName = safeText(raw?.managerName);
  const managerEmail = safeText(raw?.managerEmail);
  const managerPassword = safeText(raw?.managerPassword);

  const gymType = safeText(raw?.gymType, "combined");
  const openingTime = safeTime(raw?.openingTime, "06:00");
  const closingTime = safeTime(raw?.closingTime, "22:00");

  if (!gymName || !adminEmail || !adminPassword) {
    throw new Error("Gym name, admin email, and admin password are required.");
  }

  const gymRes = await env.DB.prepare(
    `INSERT INTO gyms (name, gym_type, opening_time, closing_time)
     VALUES (?, ?, ?, ?)`,
  ).bind(gymName, gymType, openingTime, closingTime).run();
  const gymId = Number(gymRes.lastInsertRowId);
  if (!Number.isFinite(gymId) || gymId <= 0) {
    throw new Error("Could not determine newly created gym ID.");
  }

  const adminHash = await hashPassword(adminPassword);
  const adminRes = await env.DB.prepare(
    `INSERT INTO accounts (gym_id, role, full_name, email, password_hash)
     VALUES (?, 'admin', ?, ?, ?)`,
  ).bind(gymId, adminName, adminEmail, adminHash).run();
  const adminId = Number(adminRes.lastInsertRowId);
  if (!Number.isFinite(adminId) || adminId <= 0) {
    throw new Error("Could not determine admin account ID.");
  }

  if (ownerName && ownerEmail && ownerPassword) {
    const ownerHash = await hashPassword(ownerPassword);
    await env.DB.prepare(
      `INSERT INTO accounts (gym_id, role, full_name, email, password_hash)
       VALUES (?, 'owner', ?, ?, ?)`,
    ).bind(gymId, ownerName, ownerEmail, ownerHash).run();
  }

  if (managerName && managerEmail && managerPassword) {
    const managerHash = await hashPassword(managerPassword);
    await env.DB.prepare(
      `INSERT INTO accounts (gym_id, role, full_name, email, password_hash)
       VALUES (?, 'manager', ?, ?, ?)`,
    ).bind(gymId, managerName, managerEmail, managerHash).run();
  }

  const workerStmt = env.DB.prepare(
    `INSERT INTO workers (gym_id, full_name, role, duty_start, duty_end)
     VALUES (?, ?, ?, ?, ?)`,
  );

  for (let i = 0; i < workerCount; i++) {
    const w = workers[i] ?? {};
    const name = safeText(w?.name, `Worker ${i + 1}`);
    const role = safeText(w?.role, "trainer");
    const dutyStart = safeTime(w?.dutyStart, "00:00");
    const dutyEnd = safeTime(w?.dutyEnd, "00:00");
    await workerStmt.bind(gymId, name, role, dutyStart, dutyEnd).run();
  }

  const planStmt = env.DB.prepare(
    `INSERT INTO membership_plans (gym_id, name, price, billing_cycle, access_scope, perks)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );

  for (let i = 0; i < memberships.length; i++) {
    const p = memberships[i] ?? {};
    const name = safeText(p?.name, `Plan ${i + 1}`);
    const price = safeNumber(p?.price, 0);
    const billing = safeText(p?.billing, "monthly");
    const access = safeText(p?.access, "full");
    const perks = safeText(p?.perks, "");
    await planStmt.bind(gymId, name, price, billing, access, perks).run();
  }

  return adminId;
}

/* ----------------------- Admin APIs ----------------------- */

async function requireSession(env: Env, request: Request) {
  const cookies = parseCookies(request);
  const token = cookies["gym_session"];
  const account = await getSessionAccount(env, token);
  if (!account) throw new Error("Unauthenticated");
  return account;
}

async function adminBootstrap(env: Env, request: Request): Promise<Response> {
  const account = await requireSession(env, request);

  const gymRow = await env.DB.prepare(
    `SELECT id, name, gym_type, opening_time, closing_time FROM gyms WHERE id = ?`,
  ).bind(account.gym_id).first<any>();

  const plans = await env.DB.prepare(
    `SELECT id, name, price, billing_cycle, access_scope FROM membership_plans WHERE gym_id = ? ORDER BY id`,
  ).bind(account.gym_id).all<any>();

  const workers = await env.DB.prepare(
    `SELECT id, full_name, role, duty_start, duty_end FROM workers WHERE gym_id = ? ORDER BY id`,
  ).bind(account.gym_id).all<any>();

  const accounts = await env.DB.prepare(
    `SELECT id, full_name, role, email FROM accounts WHERE gym_id = ? ORDER BY role, id`,
  ).bind(account.gym_id).all<any>();

  const membersCountRow = await env.DB.prepare(
    `SELECT COUNT(*) AS c FROM members WHERE gym_id = ? AND status = 'active'`,
  ).bind(account.gym_id).first<{ c: number }>();

  return new Response(JSON.stringify({
    gym: gymRow || null,
    plans: plans.results || [],
    workers: workers.results || [],
    accounts: accounts.results || [],
    memberCount: membersCountRow?.c ?? 0,
  }), { headers: { "Content-Type": "application/json" } });
}

/* ----------------------- Worker entry ----------------------- */

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const cookies = parseCookies(request);

    await setupDatabase(env);

    // --- setup (only when no gym exists) ---
    if (method === "POST" && path === "/api/setup") {
      try {
        const gymCount = await getGymCount(env);
        if (gymCount > 0) {
          return new Response(JSON.stringify({ error: "Gym already exists." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const raw = await request.json();
        const adminId = await handleSetup(env, raw);

        const token = await createSession(env, Number(adminId));
        return new Response(JSON.stringify({ message: "Gym created." }), {
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `gym_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure`,
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // --- login ---
    if (method === "POST" && path === "/api/login") {
      try {
        const body = await request.json();
        const email = safeText(body?.email);
        const password = safeText(body?.password);
        if (!email || !password) {
          return new Response(JSON.stringify({ error: "Email and password are required." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const row = await env.DB.prepare(
          `SELECT id, password_hash FROM accounts WHERE email = ? LIMIT 1`,
        ).bind(email).first<any>();

        if (!row) {
          return new Response(JSON.stringify({ error: "Invalid email or password." }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const ok = await verifyPassword(password, row.password_hash);
        if (!ok) {
          return new Response(JSON.stringify({ error: "Invalid email or password." }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const token = await createSession(env, Number(row.id));
        return new Response(JSON.stringify({ message: "Logged in." }), {
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `gym_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure`,
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // --- logout ---
    if (method === "POST" && path === "/api/logout") {
      const token = cookies["gym_session"];
      if (token) {
        await env.DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
      }
      return new Response("Logged out", {
        headers: {
          "Set-Cookie": `gym_session=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`,
        },
      });
    }

    // --- admin APIs ---
    if (path === "/api/admin/bootstrap" && method === "GET") {
      try {
        return await adminBootstrap(env, request);
      } catch (err) {
        if ((err as Error).message === "Unauthenticated") {
          return new Response(JSON.stringify({ error: "Unauthenticated" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (path === "/api/admin/add-membership" && method === "POST") {
      try {
        const account = await requireSession(env, request);
        if (account.role === "worker") {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }

        const body = await request.json();
        const name = safeText(body?.name);
        const price = safeNumber(body?.price, 0);
        const billing = safeText(body?.billing, "monthly");
        const access = safeText(body?.access, "full");
        const perks = safeText(body?.perks);
        if (!name) throw new Error("Name is required.");
        await env.DB.prepare(
          `INSERT INTO membership_plans (gym_id, name, price, billing_cycle, access_scope, perks)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).bind(account.gym_id, name, price, billing, access, perks).run();
        return new Response(JSON.stringify({ message: "Membership added." }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        if ((err as Error).message === "Unauthenticated") {
          return new Response(JSON.stringify({ error: "Unauthenticated" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: (err as Error).message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (path === "/api/admin/add-worker" && method === "POST") {
      try {
        const account = await requireSession(env, request);
        if (account.role === "worker") {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }

        const body = await request.json();
        const name = safeText(body?.name);
        const role = safeText(body?.role, "trainer");
        const dutyStart = safeTime(body?.dutyStart, "00:00");
        const dutyEnd = safeTime(body?.dutyEnd, "00:00");
        if (!name) throw new Error("Name is required.");
        await env.DB.prepare(
          `INSERT INTO workers (gym_id, full_name, role, duty_start, duty_end)
           VALUES (?, ?, ?, ?, ?)`,
        ).bind(account.gym_id, name, role, dutyStart, dutyEnd).run();
        return new Response(JSON.stringify({ message: "Worker added." }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        if ((err as Error).message === "Unauthenticated") {
          return new Response(JSON.stringify({ error: "Unauthenticated" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: (err as Error).message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (path === "/api/admin/add-account" && method === "POST") {
      try {
        const account = await requireSession(env, request);
        if (account.role !== "admin" && account.role !== "owner") {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }

        const body = await request.json();
        const name = safeText(body?.name);
        const email = safeText(body?.email);
        const role = safeText(body?.role, "manager");
        const password = safeText(body?.password);
        if (!name || !email || !password) throw new Error("Name, email and password are required.");
        const hash = await hashPassword(password);
        await env.DB.prepare(
          `INSERT INTO accounts (gym_id, role, full_name, email, password_hash)
           VALUES (?, ?, ?, ?, ?)`,
        ).bind(account.gym_id, role, name, email, hash).run();
        return new Response(JSON.stringify({ message: "Account created." }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        if ((err as Error).message === "Unauthenticated") {
          return new Response(JSON.stringify({ error: "Unauthenticated" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: (err as Error).message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // --- pages ---
    if (path === "/admin" && method === "GET") {
      const sessionAccount = await getSessionAccount(env, cookies["gym_session"]);
      if (!sessionAccount) {
        return new Response("", { status: 302, headers: { Location: "/" } });
      }
      return renderAdminDashboard(sessionAccount.full_name, sessionAccount.role);
    }

    if (path === "/" && method === "GET") {
      const count = await getGymCount(env);
      if (count === 0) {
        return renderOnboarding();
      }
      const sessionAccount = await getSessionAccount(env, cookies["gym_session"]);
      if (sessionAccount) {
        return new Response("", { status: 302, headers: { Location: "/admin" } });
      }
      return renderLogin();
    }

    return new Response("Not found", { status: 404 });
  },
};
