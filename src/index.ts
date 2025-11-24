export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket; // reserved for future file exports/backups
}

/* ----------------------- Shared HTML head bits ----------------------- */

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
          font-size: 14px;
          transition: border-color 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
        }

        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.12);
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
              <p>First-time setup: create your gym, roles and membership types.</p>
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

              <!-- step contents (same as before, omitted for brevity here in comments) -->
              <div class="step-content" data-step="0">
                <div class="grid">
                  <div class="field">
                    <label for="gymName">Gym name</label>
                    <input id="gymName" required placeholder="e.g. Skyline Fitness" />
                    <div class="hint">This name will appear on dashboards and exports.</div>
                  </div>
                  <div class="field">
                    <label for="adminName">Admin full name</label>
                    <input id="adminName" required placeholder="Person managing the dashboard" />
                  </div>
                  <div class="field">
                    <label for="adminEmail">Admin email</label>
                    <input id="adminEmail" type="email" required placeholder="admin@example.com" />
                    <div class="hint">Use an email you actually check for login and recovery.</div>
                  </div>
                  <div class="field">
                    <label for="adminPassword">Admin password</label>
                    <input id="adminPassword" type="password" required minlength="6" placeholder="Create a strong password" />
                  </div>
                </div>
                <div class="grid" style="margin-top: 10px;">
                  <div class="field">
                    <label for="ownerName">Owner name (optional)</label>
                    <input id="ownerName" placeholder="Gym owner full name" />
                    <div class="hint">Owner can be different from the admin.</div>
                  </div>
                  <div class="field">
                    <label for="managerName">Manager name (optional)</label>
                    <input id="managerName" placeholder="Primary floor manager" />
                    <div class="hint">Person supervising daily operations.</div>
                  </div>
                </div>
              </div>

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

              <div class="step-content" data-step="2" style="display:none;">
                <div class="notice">
                  Set how many workers you have. Duty slots will be generated and can be adjusted.
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

              <div class="step-content" data-step="3" style="display:none;">
                <div class="notice">
                  Add membership styles you offer. You can change prices and details any time.
                </div>
                <div class="plans" id="plans"></div>
                <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:6px;">
                  <button type="button" class="secondary" id="addPlan">Add membership type</button>
                </div>
              </div>

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
        const stepTitles = ["Gym & roles", "Schedule", "Team", "Memberships", "Review"];
        const stepCaptions = [
          "Owner, admin, manager",
          "Opening hours & type",
          "Workers & duty slots",
          "Packages & pricing",
          "Check everything & finish"
        ];

        const stepContainer = document.getElementById("steps");
        const stepContents = Array.from(document.querySelectorAll(".step-content"));
        const nextBtn = document.getElementById("nextBtn");
        const backBtn = document.getElementById("backBtn");
        const stepHint = document.getElementById("stepHint");
        const workersContainer = document.getElementById("workers");
        const workerCountSelect = document.getElementById("workerCount");
        const shiftPresetSelect = document.getElementById("shiftPreset");
        const statusBox = document.getElementById("status");
        const summaryBox = document.getElementById("summary");
        const plansContainer = document.getElementById("plans");
        const addPlanBtn = document.getElementById("addPlan");

        let currentStep = 0;

        let membershipPlans = [
          { name: "Standard", price: "1500", billing: "monthly", access: "full", perks: "Gym floor + basic classes" },
          { name: "Premium", price: "2500", billing: "monthly", access: "full", perks: "All classes, full-time access" }
        ];

        function populateWorkerCount() {
          workerCountSelect.innerHTML = Array.from({ length: 20 }, (_, i) => {
            const value = i + 1;
            const selected = value === 3 ? " selected" : "";
            return '<option value="' + value + '"' + selected + ">" + value + "</option>";
          }).join("");
        }

        function renderSteps() {
          stepContainer.innerHTML = stepTitles
            .map(function (title, index) {
              const active = index === currentStep ? " active" : "";
              return (
                '<div class="step' +
                active +
                '"><div class="step-number">' +
                (index + 1) +
                '</div><div><div class="step-title">' +
                title +
                '</div><div class="step-caption">' +
                stepCaptions[index] +
                "</div></div></div>"
              );
            })
            .join("");
          stepHint.textContent = stepCaptions[currentStep];
        }

        function timeFromPreset(index, preset) {
          const startHour = 6 + (index % 3) * 3;
          const start = String(startHour).padStart(2, "0") + ":00";
          const endHour = (startHour + preset) % 24;
          const end = String(endHour).padStart(2, "0") + ":00";
          return { start, end };
        }

        function renderWorkers() {
          const count = Number(workerCountSelect.value || 0);
          const preset = Number(shiftPresetSelect.value || 8);
          workersContainer.innerHTML = Array.from({ length: count }, function (_, i) {
            const times = timeFromPreset(i, preset);
            return [
              '<div class="worker-card">',
              '<div class="worker-header">',
              '<div style="font-weight:600; font-size:14px;">Worker ' + (i + 1) + "</div>",
              '<span class="pill">Default shift ' + times.start + " – " + times.end + "</span>",
              "</div>",
              '<div class="grid">',
              '<div class="field">',
              '<label for="worker-name-' + i + '">Full name</label>',
              '<input id="worker-name-' + i + '" placeholder="e.g. Trainer ' + (i + 1) + '" />',
              "</div>",
              '<div class="field">',
              '<label for="worker-role-' + i + '">Role</label>',
              '<select id="worker-role-' + i + '">',
              '<option value="trainer">Trainer</option>',
              '<option value="front-desk">Front desk</option>',
              '<option value="maintenance">Maintenance</option>',
              '<option value="manager">Manager</option>',
              "</select>",
              "</div>",
              '<div class="field">',
              '<label for="worker-start-' + i + '">Duty starts</label>',
              '<input id="worker-start-' + i + '" type="time" value="' + times.start + '" />',
              "</div>",
              '<div class="field">',
              '<label for="worker-end-' + i + '">Duty ends</label>',
              '<input id="worker-end-' + i + '" type="time" value="' + times.end + '" />',
              "</div>",
              "</div>",
              "</div>"
            ].join("");
          }).join("");
        }

        function renderPlans() {
          plansContainer.innerHTML = membershipPlans
            .map(function (plan, i) {
              const removeButton =
                i > 0
                  ? '<button type="button" class="secondary" data-remove="' + i + '" style="padding:6px 10px; font-size:12px;">Remove</button>'
                  : "";
              return [
                '<div class="plan-card">',
                '<div class="plan-header">',
                '<div style="font-weight:600; font-size:14px;">Plan ' + (i + 1) + "</div>",
                removeButton,
                "</div>",
                '<div class="inline">',
                '<div class="field">',
                '<label for="plan-name-' + i + '">Name</label>',
                '<input id="plan-name-' + i + '" value="' + plan.name + '" required />',
                "</div>",
                '<div class="field">',
                '<label for="plan-price-' + i + '">Price</label>',
                '<input id="plan-price-' + i + '" type="number" min="0" value="' + plan.price + '" required />',
                "</div>",
                '<div class="field">',
                '<label for="plan-billing-' + i + '">Billing</label>',
                '<select id="plan-billing-' + i + '">',
                '<option value="daily"' + (plan.billing === "daily" ? " selected" : "") + ">Per day</option>",
                '<option value="weekly"' + (plan.billing === "weekly" ? " selected" : "") + ">Weekly</option>",
                '<option value="monthly"' + (plan.billing === "monthly" ? " selected" : "") + ">Monthly</option>",
                '<option value="yearly"' + (plan.billing === "yearly" ? " selected" : "") + ">Yearly</option>",
                "</select>",
                "</div>",
                '<div class="field">',
                '<label for="plan-access-' + i + '">Access</label>',
                '<select id="plan-access-' + i + '">',
                '<option value="full"' + (plan.access === "full" ? " selected" : "") + ">Full facility</option>',
                '<option value="daytime"' + (plan.access === "daytime" ? " selected" : "") + ">Daytime</option>',
                '<option value="classes"' + (plan.access === "classes" ? " selected" : "") + ">Classes only</option>',
                '<option value="swim"' + (plan.access === "swim" ? " selected" : "") + ">Pool & spa</option>',
                "</select>",
                "</div>",
                "</div>",
                '<div class="field" style="margin-top:8px;">',
                '<label for="plan-perks-' + i + '">Perks</label>',
                '<textarea id="plan-perks-' + i + '" rows="2">' + plan.perks + "</textarea>",
                "</div>",
                '<div class="chip-row">',
                '<span class="chip">Billing: ' + plan.billing + "</span>",
                '<span class="chip">Access: ' + plan.access + "</span>",
                "</div>",
                "</div>"
              ].join("");
            })
            .join("");

          plansContainer.querySelectorAll("[data-remove]").forEach(function (btn) {
            btn.addEventListener("click", function (event) {
              const index = Number(event.target.getAttribute("data-remove"));
              membershipPlans.splice(index, 1);
              renderPlans();
            });
          });
        }

        function syncPlansFromInputs() {
          membershipPlans = membershipPlans.map(function (plan, i) {
            const name = document.getElementById("plan-name-" + i);
            const price = document.getElementById("plan-price-" + i);
            const billing = document.getElementById("plan-billing-" + i);
            const access = document.getElementById("plan-access-" + i);
            const perks = document.getElementById("plan-perks-" + i);
            return {
              name: name ? name.value : plan.name,
              price: price ? price.value : plan.price,
              billing: billing ? billing.value : plan.billing,
              access: access ? access.value : plan.access,
              perks: perks ? perks.value : plan.perks
            };
          });
        }

        function goToStep(index) {
          stepContents.forEach(function (content, i) {
            content.style.display = i === index ? "" : "none";
          });
          currentStep = index;
          renderSteps();
          backBtn.style.visibility = index === 0 ? "hidden" : "visible";
          nextBtn.textContent = index === stepContents.length - 1 ? "Finish setup" : "Next step →";
        }

        function validateCurrentStep() {
          const inputs = stepContents[currentStep].querySelectorAll("input, select");
          for (const input of Array.from(inputs)) {
            if (input.hasAttribute("required") && !(input).value) {
              (input).reportValidity();
              return false;
            }
          }
          return true;
        }

        function gatherData() {
          syncPlansFromInputs();
          const data = {
            gymName: (document.getElementById("gymName").value || "").trim(),
            adminName: (document.getElementById("adminName").value || "").trim(),
            adminEmail: (document.getElementById("adminEmail").value || "").trim(),
            adminPassword: (document.getElementById("adminPassword").value || "").trim(),
            ownerName: (document.getElementById("ownerName").value || "").trim(),
            managerName: (document.getElementById("managerName").value || "").trim(),
            gymType: (document.getElementById("gymType").value || "").trim(),
            openingTime: (document.getElementById("openingTime").value || "").trim(),
            closingTime: (document.getElementById("closingTime").value || "").trim(),
            workerCount: Number(workerCountSelect.value || 0),
            workers: [],
            memberships: membershipPlans
          };

          for (let i = 0; i < data.workerCount; i++) {
            const nameEl = document.getElementById("worker-name-" + i);
            const roleEl = document.getElementById("worker-role-" + i);
            const startEl = document.getElementById("worker-start-" + i);
            const endEl = document.getElementById("worker-end-" + i);

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
          const data = gatherData();
          const previewTables = [
            "gyms (identity & hours)",
            "accounts (admin / manager / owner / worker logins)",
            "workers (duty slots)",
            "membership_plans (pricing & billing)",
            "members (members linked to plans)",
            "attendance_logs (check-ins)",
            "balance_dues (due tracking)"
          ];

          summaryBox.innerHTML = [
            '<div class="summary-item">',
            '<div class="summary-item-title">Gym</div>',
            '<div class="summary-item-body">',
            data.gymName || "Unnamed gym",
            "<br /><span style='color:#64748b;'>",
            data.gymType || "Type not set",
            " • ",
            data.openingTime || "--:--",
            " – ",
            data.closingTime || "--:--",
            "</span>",
            "</div>",
            "</div>",
            '<div class="summary-item">',
            '<div class="summary-item-title">Roles</div>',
            '<div class="summary-item-body">',
            "<strong>Admin:</strong> ",
            data.adminName || "Not specified",
            " (",
            data.adminEmail || "no email",
            ")<br />",
            "<strong>Owner:</strong> ",
            data.ownerName || "Not set",
            "<br />",
            "<strong>Manager:</strong> ",
            data.managerName || "Not set",
            "</div>",
            "</div>",
            '<div class="summary-item">',
            '<div class="summary-item-title">Team</div>',
            '<div class="summary-item-body">',
            data.workerCount + " workers configured",
            "</div>",
            "</div>",
            '<div class="summary-item">',
            '<div class="summary-item-title">Memberships</div>',
            '<div class="summary-item-body">',
            data.memberships.length + " membership types<br />",
            data.memberships
              .map(function (m) { return m.name + " (" + m.billing + ")"; })
              .join(", "),
            "</div>",
            "</div>",
            '<div class="summary-item">',
            '<div class="summary-item-title">Tables to create</div>',
            '<div class="summary-item-body">',
            "<ul style='padding-left:16px; margin:4px 0 0;'>",
            previewTables.map(function (t) { return "<li>" + t + "</li>"; }).join(""),
            "</ul>",
            "</div>",
            "</div>"
          ].join("");
        }

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

        nextBtn.addEventListener("click", async function () {
          if (!validateCurrentStep()) return;

          if (currentStep < stepContents.length - 1) {
            if (currentStep === stepContents.length - 2) {
              showSummary();
            }
            goToStep(currentStep + 1);
            return;
          }

          const payload = gatherData();
          statusBox.style.display = "block";
          statusBox.classList.remove("error");
          statusBox.textContent = "Creating gym and initial admin account...";

          try {
            const response = await fetch("/api/setup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Failed to create gym");
            statusBox.textContent = "Gym created. Redirecting to dashboard...";
            window.location.href = "/admin";
          } catch (error) {
            statusBox.classList.add("error");
            statusBox.textContent = error.message || "Something went wrong.";
          }
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
              <p>Sign in as admin, manager or owner to manage your gym.</p>
            </div>
          </div>
          <div class="tagline">Secure access</div>
        </div>
      </header>
      <main>
        <div class="shell">
          <div class="card" style="max-width: 420px; margin: 0 auto;">
            <h2 style="margin-top:0; margin-bottom:4px; font-size:18px;">Welcome back</h2>
            <p style="margin:0 0 16px; font-size:13px; color:#6b7280;">Use the admin / manager / owner account email and password created earlier.</p>
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
        const btn = document.getElementById("loginBtn");
        const statusBox = document.getElementById("status");
        btn.addEventListener("click", async () => {
          statusBox.textContent = "";
          const email = (document.getElementById("email").value || "").trim();
          const password = (document.getElementById("password").value || "").trim();
          if (!email || !password) {
            statusBox.textContent = "Enter both email and password.";
            return;
          }
          try {
            const res = await fetch("/api/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Login failed");
            window.location.href = "/admin";
          } catch (err) {
            statusBox.textContent = err.message || "Login failed.";
          }
        });
      </script>
    </body>
  </html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "no-store" },
  });
}

/* ----------------------- Admin dashboard page ----------------------- */

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
        const navItems = document.querySelectorAll(".nav-item");
        const tabs = {
          overview: document.getElementById("tab-overview"),
          memberships: document.getElementById("tab-memberships"),
          workers: document.getElementById("tab-workers"),
          accounts: document.getElementById("tab-accounts"),
          settings: document.getElementById("tab-settings")
        };
        const titles = {
          overview: "Overview",
          memberships: "Memberships",
          workers: "Workers",
          accounts: "Accounts",
          settings: "Settings"
        };
        const subtitles = {
          overview: "Quick snapshot of your gym",
          memberships: "Configure plans and pricing",
          workers: "Manage trainers and staff",
          accounts: "Who can log in and manage",
          settings: "Basic gym configuration"
        };
        const panelTitle = document.getElementById("panelTitle");
        const panelSubtitle = document.getElementById("panelSubtitle");
        const gymLabel = document.getElementById("gymLabel");

        function switchTab(tab) {
          for (const key in tabs) {
            tabs[key].style.display = key === tab ? "" : "none";
          }
          navItems.forEach(item => {
            item.classList.toggle("active", item.getAttribute("data-tab") === tab);
          });
          panelTitle.textContent = titles[tab];
          panelSubtitle.textContent = subtitles[tab];
        }

        navItems.forEach(item => {
          item.addEventListener("click", () => {
            const tab = item.getAttribute("data-tab");
            switchTab(tab);
          });
        });

        document.getElementById("logoutBtn").addEventListener("click", async () => {
          try {
            await fetch("/api/logout", { method: "POST" });
          } catch (e) {}
          window.location.href = "/";
        });

        async function loadBootstrap() {
          try {
            const res = await fetch("/api/admin/bootstrap");
            if (!res.ok) throw new Error("Failed to load dashboard data");
            const data = await res.json();

            gymLabel.textContent = data.gym
              ? data.gym.name + " • " + data.gym.gym_type + " • " + data.gym.opening_time + "–" + data.gym.closing_time
              : "";

            document.getElementById("metricMembers").textContent = data.memberCount || 0;
            document.getElementById("metricPlans").textContent = data.plans.length || 0;
            document.getElementById("metricWorkers").textContent = data.workers.length || 0;
            const note = document.getElementById("metricMembersNote");
            if ((data.memberCount || 0) === 0) {
              note.textContent = "No members yet";
            } else {
              note.textContent = data.memberCount + " active member(s)";
            }

            const membershipList = document.getElementById("membershipList");
            if (!data.plans.length) {
              membershipList.innerHTML = '<div class="list-row"><span>No plans yet</span></div>';
            } else {
              membershipList.innerHTML = data.plans.map(p => (
                '<div class="list-row"><span>' +
                p.name +
                '</span><span class="pill-soft blue">' +
                p.billing_cycle +
                " • " +
                p.price +
                "</span></div>"
              )).join("");
            }

            const workerList = document.getElementById("workerList");
            if (!data.workers.length) {
              workerList.innerHTML = '<div class="list-row"><span>No workers yet</span></div>';
            } else {
              workerList.innerHTML = data.workers.map(w => (
                '<div class="list-row"><span>' +
                w.full_name +
                '</span><span class="pill-soft">' +
                w.role +
                " • " +
                (w.duty_start || "--:--") +
                "-" +
                (w.duty_end || "--:--") +
                "</span></div>"
              )).join("");
            }

            const accountList = document.getElementById("accountList");
            if (!data.accounts.length) {
              accountList.innerHTML = '<div class="list-row"><span>No accounts yet</span></div>';
            } else {
              accountList.innerHTML = data.accounts.map(a => (
                '<div class="list-row"><span>' +
                a.full_name +
                " (" +
                (a.email || "no email") +
                ')</span><span class="pill-soft green">' +
                a.role +
                "</span></div>"
              )).join("");
            }
          } catch (err) {
            console.error(err);
          }
        }

        document.getElementById("btnAddMembership").addEventListener("click", async () => {
          const name = document.getElementById("m-name").value.trim();
          const price = document.getElementById("m-price").value.trim();
          const billing = document.getElementById("m-billing").value;
          const access = document.getElementById("m-access").value;
          const perks = document.getElementById("m-perks").value.trim();
          const status = document.getElementById("membershipStatus");
          status.textContent = "";
          if (!name || !price) {
            status.textContent = "Name and price are required.";
            return;
          }
          try {
            const res = await fetch("/api/admin/add-membership", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, price: Number(price), billing, access, perks })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to add plan");
            status.textContent = "Plan added.";
            document.getElementById("m-name").value = "";
            document.getElementById("m-price").value = "";
            document.getElementById("m-perks").value = "";
            loadBootstrap();
          } catch (err) {
            status.textContent = err.message || "Error adding plan.";
          }
        });

        document.getElementById("btnAddWorker").addEventListener("click", async () => {
          const name = document.getElementById("w-name").value.trim();
          const role = document.getElementById("w-role").value;
          const dutyStart = document.getElementById("w-start").value.trim();
          const dutyEnd = document.getElementById("w-end").value.trim();
          const status = document.getElementById("workerStatus");
          status.textContent = "";
          if (!name) {
            status.textContent = "Worker name is required.";
            return;
          }
          try {
            const res = await fetch("/api/admin/add-worker", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, role, dutyStart, dutyEnd })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to add worker");
            status.textContent = "Worker added.";
            document.getElementById("w-name").value = "";
            document.getElementById("w-start").value = "";
            document.getElementById("w-end").value = "";
            loadBootstrap();
          } catch (err) {
            status.textContent = err.message || "Error adding worker.";
          }
        });

        document.getElementById("btnAddAccount").addEventListener("click", async () => {
          const name = document.getElementById("a-name").value.trim();
          const email = document.getElementById("a-email").value.trim();
          const role = document.getElementById("a-role").value;
          const password = document.getElementById("a-password").value.trim();
          const status = document.getElementById("accountStatus");
          status.textContent = "";
          if (!name || !email || !password) {
            status.textContent = "Name, email and password are required.";
            return;
          }
          try {
            const res = await fetch("/api/admin/add-account", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, email, role, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create account");
            status.textContent = "Account created.";
            document.getElementById("a-name").value = "";
            document.getElementById("a-email").value = "";
            document.getElementById("a-password").value = "";
            loadBootstrap();
          } catch (err) {
            status.textContent = err.message || "Error creating account.";
          }
        });

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
      role TEXT NOT NULL,              -- 'admin', 'manager', 'owner', 'worker'
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
    try {
      await env.DB.prepare(sql).run();
    } catch (error) {
      console.error("D1 setup error", { sql, error });
      throw new Error(
        `Failed to initialize database schema while running: ${sql.split("\n")[0]}. ${(error as Error).message}`,
      );
    }
  }
}

async function getGymCount(env: Env): Promise<number> {
  const row = await env.DB.prepare("SELECT COUNT(*) AS c FROM gyms").first<{ c: number }>();
  return row?.c ?? 0;
}

/* ----------------------- Session helpers ----------------------- */

async function createSession(env: Env, accountId: number): Promise<string> {
  const token = crypto.randomUUID();
  const expires = new Date();
  expires.setDate(expires.getDate() + 30); // 30 days
  const expiresStr = expires.toISOString();

  await env.DB.prepare(
    `INSERT INTO sessions (account_id, token, expires_at) VALUES (?, ?, ?)`,
  ).bind(accountId, token, expiresStr).run();

  return token;
}

async function getSessionAccount(env: Env, token: string | undefined | null): Promise<{ id: number; full_name: string; role: string; gym_id: number } | null> {
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

/* ----------------------- Setup & inserts ----------------------- */

async function handleSetup(env: Env, raw: any): Promise<void> {
  const workerCount = safeNumber(raw?.workerCount, 0);
  const workers = Array.isArray(raw?.workers) ? raw.workers.slice(0, 50) : [];
  const memberships = Array.isArray(raw?.memberships) ? raw.memberships.slice(0, 50) : [];

  const gymName = safeText(raw?.gymName, "Gym");
  const adminName = safeText(raw?.adminName, "Admin");
  const adminEmail = safeText(raw?.adminEmail);
  const adminPassword = safeText(raw?.adminPassword);
  const ownerName = safeText(raw?.ownerName);
  const managerName = safeText(raw?.managerName);
  const gymType = safeText(raw?.gymType, "combined");
  const openingTime = safeTime(raw?.openingTime, "06:00");
  const closingTime = safeTime(raw?.closingTime, "22:00");

  if (!gymName || !adminEmail || !adminPassword) {
    throw new Error("Gym name, admin email, and admin password are required.");
  }

  const passwordHash = await hashPassword(adminPassword);

  // Insert gym
  const gymResult = await env.DB.prepare(
    `INSERT INTO gyms (name, gym_type, opening_time, closing_time)
     VALUES (?, ?, ?, ?)`,
  ).bind(gymName, gymType, openingTime, closingTime).run();

  const anyResult: any = gymResult;
  const gymId = Number(
    anyResult?.meta?.last_row_id ??
    anyResult?.last_row_id ??
    anyResult?.lastInsertRowId,
  );
  if (!Number.isFinite(gymId) || gymId <= 0) {
    throw new Error("Could not determine newly created gym ID.");
  }

  // Insert admin account
  const adminResult = await env.DB.prepare(
    `INSERT INTO accounts (gym_id, role, full_name, email, password_hash)
     VALUES (?, 'admin', ?, ?, ?)`,
  ).bind(gymId, adminName, adminEmail, passwordHash).run();

  const adminAny: any = adminResult;
  const adminId = Number(
    adminAny?.meta?.last_row_id ??
    adminAny?.last_row_id ??
    adminAny?.lastInsertRowId,
  );
  if (!Number.isFinite(adminId) || adminId <= 0) {
    throw new Error("Could not determine admin account ID.");
  }

  // Optional owner & manager (no login until explicitly created via Accounts tab)
  if (ownerName) {
    await env.DB.prepare(
      `INSERT INTO accounts (gym_id, role, full_name, email, password_hash)
       VALUES (?, 'owner', ?, ?, ?)`,
    ).bind(gymId, ownerName, "", passwordHash).run();
  }
  if (managerName) {
    await env.DB.prepare(
      `INSERT INTO accounts (gym_id, role, full_name, email, password_hash)
       VALUES (?, 'manager', ?, ?, ?)`,
    ).bind(gymId, managerName, "", passwordHash).run();
  }

  // Workers
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

  // Membership plans
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

  // Setup done; session creation happens in handler
}

/* ----------------------- Admin API ----------------------- */

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

    try {
      await setupDatabase(env);
    } catch (err) {
      console.error("DB setup failed", err);
      return new Response("Database setup failed.", { status: 500 });
    }

    // API: setup (only when no gym exists)
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
        await handleSetup(env, raw);

        // Get admin account for session
        const admin = await env.DB.prepare(
          `SELECT id FROM accounts WHERE role = 'admin' ORDER BY id LIMIT 1`,
        ).first<any>();

        let headers: Record<string, string> = { "Content-Type": "application/json" };
        if (admin?.id) {
          const token = await createSession(env, Number(admin.id));
          headers["Set-Cookie"] = `gym_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure`;
        }

        return new Response(JSON.stringify({ message: "Gym created." }), { headers });
      } catch (error) {
        console.error("Setup API error", error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // API: login
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
        console.error("Login API error", error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // API: logout
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

    // Admin APIs
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
        console.error("bootstrap error", err);
        return new Response(JSON.stringify({ error: "Server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (path === "/api/admin/add-membership" && method === "POST") {
      try {
        const account = await requireSession(env, request);
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
        console.error("add-membership error", err);
        return new Response(JSON.stringify({ error: (err as Error).message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (path === "/api/admin/add-worker" && method === "POST") {
      try {
        const account = await requireSession(env, request);
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
        console.error("add-worker error", err);
        return new Response(JSON.stringify({ error: (err as Error).message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (path === "/api/admin/add-account" && method === "POST") {
      try {
        const account = await requireSession(env, request);
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
        console.error("add-account error", err);
        return new Response(JSON.stringify({ error: (err as Error).message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Routing for pages
    if (path === "/admin" && method === "GET") {
      const sessionAccount = await getSessionAccount(env, cookies["gym_session"]);
      if (!sessionAccount) {
        return new Response("", {
          status: 302,
          headers: { Location: "/" },
        });
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
        return new Response("", {
          status: 302,
          headers: { Location: "/admin" },
        });
      }
      return renderLogin();
    }

    return new Response("Not found", { status: 404 });
  },
};