export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
}

/**
 * HTML layout for the onboarding wizard
 */
function layout(): Response {
  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Gym Onboarding</title>
      <style>
        :root {
          color-scheme: light;
          --surface: #ffffff;
          --muted: #f5f7fb;
          --primary: #2563eb;
          --primary-soft: #e0ecff;
          --text: #0f172a;
          --border: #d4dbe9;
          --shadow-soft: 0 18px 45px rgba(15, 23, 42, 0.08);
        }

        * {
          box-sizing: border-box;
        }

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

        .step-title {
          font-size: 14px;
          font-weight: 600;
        }

        .step-caption {
          font-size: 12px;
          color: #64748b;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .step-content {
          margin-top: 6px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 12px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        label {
          font-weight: 600;
          font-size: 13px;
          color: #0f172a;
        }

        .hint {
          font-size: 12px;
          color: #64748b;
        }

        input,
        select,
        textarea {
          padding: 11px 13px;
          border-radius: 11px;
          border: 1px solid var(--border);
          background: #fdfefe;
          font-size: 14px;
          transition: border-color 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
        }

        input:focus,
        select:focus,
        textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.12);
          background: #ffffff;
        }

        textarea {
          resize: vertical;
          min-height: 56px;
        }

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

        .notice::before {
          content: "ℹ︎";
          font-weight: 700;
          margin-top: 1px;
        }

        .workers {
          display: grid;
          gap: 10px;
          margin-top: 10px;
        }

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

        .plans {
          display: grid;
          gap: 10px;
          margin-top: 4px;
        }

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

        .summary-item-title {
          font-weight: 700;
          margin-bottom: 3px;
        }

        .summary-item-body {
          color: #475569;
        }

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

        button:active {
          transform: translateY(1px);
          box-shadow: none;
        }

        .subtext {
          font-size: 12px;
          color: #6b7280;
        }

        @media (max-width: 640px) {
          .card {
            padding: 16px 14px 14px;
          }

          .header-inner {
            flex-direction: column;
            align-items: flex-start;
          }

          .tagline {
            align-self: flex-start;
          }

          button {
            width: 100%;
            justify-content: center;
          }

          .actions {
            flex-direction: column-reverse;
            align-items: stretch;
          }
        }
      </style>
    </head>
    <body>
      <header>
        <div class="header-inner">
          <div class="brand">
            <div class="brand-mark">G</div>
            <div class="brand-text">
              <h1>Gym setup assistant</h1>
              <p>Create your gym, roles and membership types in a single flow.</p>
            </div>
          </div>
          <div class="tagline">Attendance & roles ready from day one</div>
        </div>
      </header>
      <main>
        <div class="shell">
          <div class="card">
            <div id="steps" class="steps"></div>
            <form id="wizard">
              <!-- STEP 0: Gym & role owners -->
              <div class="step-content" data-step="0">
                <div class="grid">
                  <div class="field">
                    <label for="gymName">Gym name</label>
                    <input id="gymName" name="gymName" required placeholder="e.g. Skyline Fitness" />
                    <div class="hint">This name will appear on dashboards and exports.</div>
                  </div>
                  <div class="field">
                    <label for="adminName">Admin full name</label>
                    <input id="adminName" name="adminName" required placeholder="Person managing the dashboard" />
                  </div>
                  <div class="field">
                    <label for="adminEmail">Admin email</label>
                    <input id="adminEmail" name="adminEmail" type="email" required placeholder="admin@example.com" />
                    <div class="hint">Use an email you actually check for login and recovery.</div>
                  </div>
                  <div class="field">
                    <label for="adminPassword">Admin password</label>
                    <input id="adminPassword" name="adminPassword" type="password" required minlength="6" placeholder="Create a strong password" />
                  </div>
                </div>
                <div class="grid" style="margin-top: 10px;">
                  <div class="field">
                    <label for="ownerName">Owner name (optional)</label>
                    <input id="ownerName" name="ownerName" placeholder="Gym owner full name" />
                    <div class="hint">For records — owner can be different from the admin.</div>
                  </div>
                  <div class="field">
                    <label for="managerName">Manager name (optional)</label>
                    <input id="managerName" name="managerName" placeholder="Primary floor manager" />
                    <div class="hint">Person supervising daily operations.</div>
                  </div>
                </div>
              </div>

              <!-- STEP 1: Gym schedule -->
              <div class="step-content" data-step="1" style="display:none;">
                <div class="grid">
                  <div class="field">
                    <label for="gymType">Gym type</label>
                    <select id="gymType" name="gymType" required>
                      <option value="combined">Combined (all members)</option>
                      <option value="male">Male only</option>
                      <option value="female">Female only</option>
                    </select>
                    <div class="hint">This helps you filter attendance and member lists later.</div>
                  </div>
                  <div class="field">
                    <label for="openingTime">Opening time</label>
                    <input id="openingTime" name="openingTime" type="time" required />
                  </div>
                  <div class="field">
                    <label for="closingTime">Closing time</label>
                    <input id="closingTime" name="closingTime" type="time" required />
                  </div>
                </div>
              </div>

              <!-- STEP 2: Team / workers -->
              <div class="step-content" data-step="2" style="display:none;">
                <div class="notice">
                  Set how many workers you have. We’ll generate clean duty slots you can adjust.
                </div>
                <div class="grid" style="margin-top:8px;">
                  <div class="field">
                    <label for="workerCount">Number of workers</label>
                    <select id="workerCount" name="workerCount"></select>
                    <div class="hint">You can add or adjust workers later in the dashboard.</div>
                  </div>
                  <div class="field">
                    <label for="shiftPreset">Default shift length</label>
                    <select id="shiftPreset" name="shiftPreset">
                      <option value="6">6 hours</option>
                      <option value="8" selected>8 hours</option>
                      <option value="10">10 hours</option>
                    </select>
                  </div>
                </div>
                <div class="workers" id="workers"></div>
              </div>

              <!-- STEP 3: Membership plans -->
              <div class="step-content" data-step="3" style="display:none;">
                <div class="notice">
                  Add membership styles you offer. You can change prices and details any time.
                </div>
                <div class="plans" id="plans"></div>
                <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:6px;">
                  <button type="button" class="secondary" id="addPlan">Add membership type</button>
                </div>
              </div>

              <!-- STEP 4: Review & create -->
              <div class="step-content" data-step="4" style="display:none;">
                <div class="summary" id="summary"></div>
                <div id="status" class="status"></div>
              </div>

              <div class="actions">
                <button type="button" class="secondary" id="backBtn">
                  ← Back
                </button>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex:1; max-width:320px;">
                  <button type="button" class="primary" id="nextBtn">
                    Next step →
                  </button>
                  <div class="subtext" id="stepHint"></div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <script>
        const stepTitles = ["Gym & roles", "Schedule", "Team", "Memberships", "Review"];
        const stepCaptions = ["Owner, admin, manager", "Opening hours & type", "Workers & duty slots", "Packages & pricing", "Check everything & finish"];
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
          { name: "Premium", price: "2500", billing: "monthly", access: "full", perks: "All classes, full-time access" },
          { name: "Day Pass", price: "300", billing: "daily", access: "full", perks: "Single visit, all areas" }
        ];

        function populateWorkerCount() {
          workerCountSelect.innerHTML = Array.from({ length: 20 }, (_, i) => {
            const value = i + 1;
            const selected = value === 3 ? " selected" : "";
            return '<option value="' + value + '"' + selected + '>' + value + "</option>";
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
              '<input id="worker-name-' + i + '" name="worker-name-' + i + '" placeholder="e.g. Mahfuz Alam" />',
              "</div>",
              '<div class="field">',
              '<label for="worker-role-' + i + '">Role</label>',
              '<select id="worker-role-' + i + '" name="worker-role-' + i + '">',
              '<option value="trainer">Trainer</option>',
              '<option value="front-desk">Front desk</option>',
              '<option value="maintenance">Maintenance</option>',
              '<option value="manager">Manager</option>',
              "</select>",
              "</div>",
              '<div class="field">',
              '<label for="worker-start-' + i + '">Duty starts</label>',
              '<input id="worker-start-' + i + '" name="worker-start-' + i + '" type="time" value="' + times.start + '" />',
              "</div>",
              '<div class="field">',
              '<label for="worker-end-' + i + '">Duty ends</label>',
              '<input id="worker-end-' + i + '" name="worker-end-' + i + '" type="time" value="' + times.end + '" />',
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
                '<input id="plan-name-' + i + '" name="plan-name-' + i + '" value="' + plan.name + '" required />',
                "</div>",
                '<div class="field">',
                '<label for="plan-price-' + i + '">Price</label>',
                '<input id="plan-price-' + i + '" name="plan-price-' + i + '" type="number" min="0" value="' + plan.price + '" required />',
                "</div>",
                '<div class="field">',
                '<label for="plan-billing-' + i + '">Billing</label>',
                '<select id="plan-billing-' + i + '" name="plan-billing-' + i + '">',
                '<option value="daily"' + (plan.billing === "daily" ? " selected" : "") + ">Per day</option>",
                '<option value="weekly"' + (plan.billing === "weekly" ? " selected" : "") + ">Weekly</option>",
                '<option value="monthly"' + (plan.billing === "monthly" ? " selected" : "") + ">Monthly</option>",
                '<option value="yearly"' + (plan.billing === "yearly" ? " selected" : "") + ">Yearly</option>",
                "</select>",
                "</div>",
                '<div class="field">',
                '<label for="plan-access-' + i + '">Access</label>',
                '<select id="plan-access-' + i + '" name="plan-access-' + i + '">',
                '<option value="full"' + (plan.access === "full" ? " selected" : "") + ">Full facility</option>",
                '<option value="daytime"' + (plan.access === "daytime" ? " selected" : "") + ">Daytime</option>",
                '<option value="classes"' + (plan.access === "classes" ? " selected" : "") + ">Classes only</option>",
                '<option value="swim"' + (plan.access === "swim" ? " selected" : "") + ">Pool & spa</option>",
                "</select>",
                "</div>",
                "</div>",
                '<div class="field" style="margin-top:8px;">',
                '<label for="plan-perks-' + i + '">Perks</label>',
                '<textarea id="plan-perks-' + i + '" name="plan-perks-' + i + '" rows="2">' + plan.perks + "</textarea>",
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
            "role_accounts (owner, admin, manager)",
            "workers (duty slots)",
            "membership_plans (pricing & billing)",
            "members (future: members linked to plans)",
            "attendance_logs (future: check-ins)",
            "balance_dues (future: due tracking)"
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
              .map(function (m) {
                return m.name + " (" + m.billing + ")";
              })
              .join(", "),
            "</div>",
            "</div>",
            '<div class="summary-item">',
            '<div class="summary-item-title">Tables to create</div>',
            '<div class="summary-item-body">',
            "<ul style='padding-left:16px; margin:4px 0 0;'>",
            previewTables
              .map(function (t) {
                return "<li>" + t + "</li>";
              })
              .join(""),
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
          statusBox.textContent = "Creating tables and saving your gym...";

          try {
            const response = await fetch("/api/setup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Failed to create tables");
            statusBox.textContent = result.message;
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
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "no-store",
    },
  });
}

/** Utility: hash password */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Basic sanitizers */
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

/** Normalise payload coming from frontend */
function sanitizePayload(raw: any) {
  const workerCount = safeNumber(raw?.workerCount, 0);
  const workers = Array.isArray(raw?.workers) ? raw.workers.slice(0, 50) : [];
  const memberships = Array.isArray(raw?.memberships) ? raw.memberships.slice(0, 50) : [];

  return {
    gymName: safeText(raw?.gymName, "Gym"),
    adminName: safeText(raw?.adminName, "Admin"),
    adminEmail: safeText(raw?.adminEmail),
    adminPassword: safeText(raw?.adminPassword),
    ownerName: safeText(raw?.ownerName),
    managerName: safeText(raw?.managerName),
    gymType: safeText(raw?.gymType, "combined"),
    openingTime: safeTime(raw?.openingTime, "06:00"),
    closingTime: safeTime(raw?.closingTime, "22:00"),
    workerCount,
    workers: workers.map((worker: any, index: number) => ({
      name: safeText(worker?.name, `Worker ${index + 1}`),
      role: safeText(worker?.role, "trainer"),
      dutyStart: safeTime(worker?.dutyStart, "00:00"),
      dutyEnd: safeTime(worker?.dutyEnd, "00:00"),
    })),
    memberships: memberships.map((plan: any, index: number) => ({
      name: safeText(plan?.name, `Plan ${index + 1}`),
      price: safeNumber(plan?.price, 0),
      billing: safeText(plan?.billing, "monthly"),
      access: safeText(plan?.access, "full"),
      perks: safeText(plan?.perks),
    })),
  };
}

/** Create DB schema (tables only) */
async function setupDatabase(env: Env) {
  if (!env.DB) {
    throw new Error("D1 binding DB is missing from the environment.");
  }

  const statements = [
    `CREATE TABLE IF NOT EXISTS gyms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      gym_type TEXT NOT NULL,
      opening_time TEXT NOT NULL,
      closing_time TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`,
    `CREATE TABLE IF NOT EXISTS role_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_id INTEGER NOT NULL,
      role TEXT NOT NULL,              -- 'owner', 'admin', 'manager'
      full_name TEXT NOT NULL,
      email TEXT,
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

/** Insert gym + roles + workers + plans */
async function insertGym(env: Env, payload: ReturnType<typeof sanitizePayload>) {
  if (!payload.adminEmail || !payload.adminPassword) {
    throw new Error("Admin email and password are required.");
  }

  const password_hash = await hashPassword(payload.adminPassword);

  let gymResult;
  try {
    gymResult = await env.DB.prepare(
      `INSERT INTO gyms (name, email, password_hash, gym_type, opening_time, closing_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        payload.gymName,
        payload.adminEmail,
        password_hash,
        payload.gymType,
        payload.openingTime,
        payload.closingTime,
      )
      .run();
  } catch (error) {
    console.error("D1 insert gym error", { payload, error });
    throw new Error(`Failed to insert gym record. ${(error as Error).message}`);
  }

  const gymId = Number(gymResult.lastInsertRowId);

  // role_accounts: admin, owner, manager
  const roleStmt = env.DB.prepare(
    `INSERT INTO role_accounts (gym_id, role, full_name, email) VALUES (?, ?, ?, ?)`,
  );

  // Admin
  try {
    await roleStmt
      .bind(
        gymId,
        "admin",
        payload.adminName || "Admin",
        payload.adminEmail,
      )
      .run();
  } catch (error) {
    console.error("D1 insert admin role error", { payload, error });
    throw new Error(`Failed to insert admin account. ${(error as Error).message}`);
  }

  // Owner (optional)
  if (payload.ownerName) {
    try {
      await roleStmt
        .bind(
          gymId,
          "owner",
          payload.ownerName,
          null,
        )
        .run();
    } catch (error) {
      console.error("D1 insert owner role error", { payload, error });
      throw new Error(`Failed to insert owner record. ${(error as Error).message}`);
    }
  }

  // Manager (optional)
  if (payload.managerName) {
    try {
      await roleStmt
        .bind(
          gymId,
          "manager",
          payload.managerName,
          null,
        )
        .run();
    } catch (error) {
      console.error("D1 insert manager role error", { payload, error });
      throw new Error(`Failed to insert manager record. ${(error as Error).message}`);
    }
  }

  // Workers
  const workerStmt = env.DB.prepare(
    `INSERT INTO workers (gym_id, full_name, role, duty_start, duty_end)
     VALUES (?, ?, ?, ?, ?)`,
  );

  for (const worker of payload.workers || []) {
    const name = worker && typeof worker.name === "string" && worker.name.trim()
      ? worker.name.trim()
      : "Worker";
    const role = worker && typeof worker.role === "string" && worker.role.trim()
      ? worker.role.trim()
      : "trainer";
    const dutyStart = worker && typeof worker.dutyStart === "string" && worker.dutyStart.trim()
      ? worker.dutyStart.trim()
      : "00:00";
    const dutyEnd = worker && typeof worker.dutyEnd === "string" && worker.dutyEnd.trim()
      ? worker.dutyEnd.trim()
      : "00:00";

    try {
      await workerStmt
        .bind(
          gymId,
          name,
          role,
          dutyStart,
          dutyEnd,
        )
        .run();
    } catch (error) {
      console.error("D1 insert worker error", { worker, gymId, error });
      throw new Error(`Failed to insert worker ${name}. ${(error as Error).message}`);
    }
  }

  // Membership plans
  const planStmt = env.DB.prepare(
    `INSERT INTO membership_plans (gym_id, name, price, billing_cycle, access_scope, perks)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );

  for (const plan of payload.memberships || []) {
    const name = plan && typeof plan.name === "string" && plan.name.trim()
      ? plan.name.trim()
      : "Plan";
    const price = Number(plan?.price ?? 0) || 0;
    const billing = plan && typeof plan.billing === "string" && plan.billing.trim()
      ? plan.billing.trim()
      : "monthly";
    const access = plan && typeof plan.access === "string" && plan.access.trim()
      ? plan.access.trim()
      : "full";
    const perks = plan && typeof plan.perks === "string"
      ? plan.perks
      : "";

    try {
      await planStmt
        .bind(
          gymId,
          name,
          price,
          billing,
          access,
          perks,
        )
        .run();
    } catch (error) {
      console.error("D1 insert membership plan error", { plan, gymId, error });
      throw new Error(`Failed to insert membership plan ${name}. ${(error as Error).message}`);
    }
  }
}

/** Worker entry */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const requestId = crypto.randomUUID();

    if (request.method === "POST" && url.pathname === "/api/setup") {
      try {
        const raw = await request.json();
        const payload = sanitizePayload(raw);

        if (!payload.gymName || !payload.adminEmail || !payload.adminPassword) {
          return new Response(
            JSON.stringify({ error: "Gym name, admin email, and admin password are required." }),
            { status: 400 },
          );
        }

        await setupDatabase(env);
        await insertGym(env, payload);

        return new Response(
          JSON.stringify({
            message: "Gym, roles, workers and membership plans have been created successfully.",
            requestId,
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (error) {
        console.error("Setup API error", { requestId, error });
        return new Response(
          JSON.stringify({ error: (error as Error).message, requestId }),
          { status: 500 },
        );
      }
    }

    // Default: serve the onboarding UI
    return layout();
  },
};
