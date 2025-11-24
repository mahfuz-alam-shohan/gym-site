export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
}

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
          --muted: #f6f7fb;
          --primary: #1c6dd0;
          --text: #0f172a;
          --border: #d7deeb;
          --shadow: 0 12px 38px rgba(28, 109, 208, 0.12);
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: var(--muted);
          color: var(--text);
        }

        header {
          background: var(--surface);
          box-shadow: var(--shadow);
          padding: 20px 28px 14px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        h1 {
          margin: 0 0 6px;
          font-size: 26px;
          letter-spacing: -0.02em;
        }

        main {
          max-width: 1080px;
          margin: 32px auto 48px;
          padding: 0 20px;
        }

        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: var(--shadow);
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 8px;
          margin-bottom: 16px;
        }

        .step {
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0.75;
          transition: all 0.2s ease;
        }

        .step.active {
          border-color: var(--primary);
          background: #e6f0ff;
          opacity: 1;
        }

        .step-number {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--primary);
          color: #fff;
          display: grid;
          place-items: center;
          font-weight: 700;
          font-size: 13px;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        label {
          font-weight: 600;
          font-size: 14px;
        }

        input,
        select,
        textarea {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: #fdfefe;
          font-size: 15px;
        }

        input:focus,
        select:focus,
        textarea:focus {
          outline: 2px solid var(--primary);
          border-color: var(--primary);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 12px;
        }

        .actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }

        button {
          border: none;
          border-radius: 12px;
          padding: 12px 18px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.08s ease, box-shadow 0.2s ease;
        }

        .primary {
          background: var(--primary);
          color: #fff;
          box-shadow: var(--shadow);
        }

        .secondary {
          background: #e8edf4;
          color: #0f172a;
        }

        button:active {
          transform: translateY(1px);
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #e7f3ff;
          color: #0f3c96;
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 13px;
        }

        .workers {
          display: grid;
          gap: 12px;
        }

        .worker-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px;
          background: #fdfdfd;
        }

        .notice {
          background: #f0f7ff;
          color: #0b3c75;
          border: 1px solid #cfe1ff;
          padding: 12px 14px;
          border-radius: 12px;
          font-weight: 600;
        }

        .summary {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }

        .summary-item {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px;
          background: #fdfefe;
        }

        .status {
          border-radius: 10px;
          padding: 12px;
          border: 1px solid var(--border);
          background: #f0f9ff;
          color: #0b5394;
          display: none;
        }

        .status.error {
          background: #fff1f2;
          color: #9f1239;
        }

        .plans {
          display: grid;
          gap: 12px;
        }

        .plan-card {
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px 14px 10px;
          background: #fdfefe;
        }

        .plan-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .inline {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 10px;
        }

        .chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 8px 0 0;
        }

        .chip {
          background: #e6f0ff;
          color: #0f3c96;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <header>
        <div class="pill">Cloudflare D1 + R2 ready</div>
        <h1>Gym attendance onboarding</h1>
        <p style="margin: 0; color: #475569;">Create your gym, team, and memberships with a few clean steps.</p>
      </header>
      <main>
        <div class="card">
          <div class="steps" id="steps"></div>
          <form id="wizard">
            <div class="step-content" data-step="0">
              <div class="grid">
                <div class="field">
                  <label for="gymName">Gym name</label>
                  <input id="gymName" name="gymName" required placeholder="e.g. Skyline Fitness" />
                </div>
                <div class="field">
                  <label for="email">Admin Gmail</label>
                  <input id="email" name="email" type="email" required placeholder="name@gmail.com" />
                </div>
                <div class="field">
                  <label for="password">Dashboard password</label>
                  <input id="password" name="password" type="password" required minlength="6" placeholder="Create a strong password" />
                </div>
              </div>
            </div>

            <div class="step-content" data-step="1" style="display:none;">
              <div class="grid">
                <div class="field">
                  <label for="gymType">Gym type</label>
                  <select id="gymType" name="gymType" required>
                    <option value="combined">Combined (all members)</option>
                    <option value="male">Male only</option>
                    <option value="female">Female only</option>
                  </select>
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

            <div class="step-content" data-step="2" style="display:none;">
              <div class="notice">Set how many workers you have. We will create accounts and duty time slots automatically.</div>
              <div class="grid">
                <div class="field">
                  <label for="workerCount">Workers</label>
                  <select id="workerCount" name="workerCount"></select>
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

            <div class="step-content" data-step="3" style="display:none;">
              <div class="notice">Add membership styles you offer. Adjust price, billing, and perks.</div>
              <div class="plans" id="plans"></div>
              <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:6px;">
                <button type="button" class="secondary" id="addPlan">Add another type</button>
              </div>
            </div>

            <div class="step-content" data-step="4" style="display:none;">
              <div class="summary" id="summary"></div>
              <div class="status" id="status"></div>
            </div>

            <div class="actions">
              <button type="button" class="secondary" id="backBtn">Back</button>
              <button type="button" class="primary" id="nextBtn">Next</button>
            </div>
          </form>
        </div>
      </main>

      <script>
        const steps = ["Gym details", "Schedule", "Team", "Memberships", "Review"];
        const stepContainer = document.getElementById("steps");
        const stepContents = Array.from(document.querySelectorAll(".step-content"));
        const nextBtn = document.getElementById("nextBtn");
        const backBtn = document.getElementById("backBtn");
        const workersContainer = document.getElementById("workers");
        const workerCountSelect = document.getElementById("workerCount");
        const shiftPresetSelect = document.getElementById("shiftPreset");
        const statusBox = document.getElementById("status");
        const summaryBox = document.getElementById("summary");
        const plansContainer = document.getElementById("plans");
        const addPlanBtn = document.getElementById("addPlan");

        let currentStep = 0;
        let membershipPlans = [
          { name: "Standard", price: "39", billing: "monthly", access: "full", perks: "Gym floor + basic classes" },
          { name: "Premium", price: "59", billing: "monthly", access: "full", perks: "All classes + sauna" },
          { name: "Day Pass", price: "12", billing: "daily", access: "full", perks: "One visit, all areas" },
        ];

        function populateWorkerCount() {
          workerCountSelect.innerHTML = Array.from({ length: 20 }, (_, i) => {
            const value = i + 1;
            const selected = value === 3 ? " selected" : "";
            return '<option value="' + value + '"' + selected + '>' + value + '</option>';
          }).join("");
        }

        function renderSteps() {
          stepContainer.innerHTML = steps
            .map(function(title, index) {
              const active = index === currentStep ? " active" : "";
              const caption = ["Basics", "Hours", "Shifts", "Memberships", "Review"][index];
              return '<div class="step' + active + '"><div class="step-number">' + (index + 1) + '</div><div><div style="font-weight:700; font-size:14px;">' + title + '</div><div style="color:#475569; font-size:13px;">' + caption + '</div></div></div>';
            })
            .join("");
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
          workersContainer.innerHTML = Array.from({ length: count }, function(_, i) {
            const times = timeFromPreset(i, preset);
            return [
              '<div class="worker-card">',
              '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">',
              '<div style="font-weight:700;">Worker ' + (i + 1) + '</div>',
              '<span class="pill">Auto shift: ' + times.start + ' - ' + times.end + '</span>',
              '</div>',
              '<div class="grid">',
              '<div class="field">',
              '<label for="worker-name-' + i + '">Full name</label>',
              '<input id="worker-name-' + i + '" name="worker-name-' + i + '" placeholder="e.g. Jordan Smith" required />',
              '</div>',
              '<div class="field">',
              '<label for="worker-role-' + i + '">Role</label>',
              '<select id="worker-role-' + i + '" name="worker-role-' + i + '">',
              '<option value="trainer">Trainer</option>',
              '<option value="front-desk">Front desk</option>',
              '<option value="maintenance">Maintenance</option>',
              '<option value="manager">Manager</option>',
              '</select>',
              '</div>',
              '<div class="field">',
              '<label for="worker-start-' + i + '">Duty starts</label>',
              '<input id="worker-start-' + i + '" name="worker-start-' + i + '" type="time" value="' + times.start + '" />',
              '</div>',
              '<div class="field">',
              '<label for="worker-end-' + i + '">Duty ends</label>',
              '<input id="worker-end-' + i + '" name="worker-end-' + i + '" type="time" value="' + times.end + '" />',
              '</div>',
              '</div>',
              '</div>'
            ].join("");
          }).join("");
        }

        function renderPlans() {
          plansContainer.innerHTML = membershipPlans
            .map(function(plan, i) {
              const removeButton = i > 0 ? '<button type="button" class="secondary" data-remove="' + i + '" style="padding:8px 10px;">Remove</button>' : "";
              return [
                '<div class="plan-card">',
                '<div class="plan-header">',
                '<div style="font-weight:700; font-size:15px;">Plan ' + (i + 1) + '</div>',
                removeButton,
                '</div>',
                '<div class="inline">',
                '<div class="field">',
                '<label for="plan-name-' + i + '">Name</label>',
                '<input id="plan-name-' + i + '" name="plan-name-' + i + '" value="' + plan.name + '" required />',
                '</div>',
                '<div class="field">',
                '<label for="plan-price-' + i + '">Price</label>',
                '<input id="plan-price-' + i + '" name="plan-price-' + i + '" type="number" min="0" value="' + plan.price + '" required />',
                '</div>',
                '<div class="field">',
                '<label for="plan-billing-' + i + '">Billing</label>',
                '<select id="plan-billing-' + i + '" name="plan-billing-' + i + '">',
                '<option value="daily"' + (plan.billing === 'daily' ? ' selected' : '') + '>Per day</option>',
                '<option value="weekly"' + (plan.billing === 'weekly' ? ' selected' : '') + '>Weekly</option>',
                '<option value="monthly"' + (plan.billing === 'monthly' ? ' selected' : '') + '>Monthly</option>',
                '<option value="yearly"' + (plan.billing === 'yearly' ? ' selected' : '') + '>Yearly</option>',
                '</select>',
                '</div>',
                '<div class="field">',
                '<label for="plan-access-' + i + '">Access</label>',
                '<select id="plan-access-' + i + '" name="plan-access-' + i + '">',
                '<option value="full"' + (plan.access === 'full' ? ' selected' : '') + '>Full facility</option>',
                '<option value="daytime"' + (plan.access === 'daytime' ? ' selected' : '') + '>Daytime</option>',
                '<option value="classes"' + (plan.access === 'classes' ? ' selected' : '') + '>Classes only</option>',
                '<option value="swim"' + (plan.access === 'swim' ? ' selected' : '') + '>Pool & spa</option>',
                '</select>',
                '</div>',
                '</div>',
                '<div class="field" style="margin-top:10px;">',
                '<label for="plan-perks-' + i + '">Perks</label>',
                '<textarea id="plan-perks-' + i + '" name="plan-perks-' + i + '" rows="2">' + plan.perks + '</textarea>',
                '</div>',
                '<div class="chip-row">',
                '<span class="chip">Billing: ' + plan.billing + '</span>',
                '<span class="chip">Access: ' + plan.access + '</span>',
                '</div>',
                '</div>'
              ].join("");
            })
            .join("");

          plansContainer.querySelectorAll("[data-remove]").forEach(function(btn) {
            btn.addEventListener("click", function(event) {
              const index = Number(event.target.getAttribute("data-remove"));
              membershipPlans.splice(index, 1);
              renderPlans();
            });
          });
        }

        function syncPlansFromInputs() {
          membershipPlans = membershipPlans.map(function(plan, i) {
            const name = document.getElementById('plan-name-' + i);
            const price = document.getElementById('plan-price-' + i);
            const billing = document.getElementById('plan-billing-' + i);
            const access = document.getElementById('plan-access-' + i);
            const perks = document.getElementById('plan-perks-' + i);
            return {
              name: name ? name.value : plan.name,
              price: price ? price.value : plan.price,
              billing: billing ? billing.value : plan.billing,
              access: access ? access.value : plan.access,
              perks: perks ? perks.value : plan.perks,
            };
          });
        }

        function goToStep(index) {
          stepContents.forEach(function(content, i) {
            content.setAttribute("style", i === index ? "" : "display:none;");
          });
          currentStep = index;
          renderSteps();
          backBtn.style.visibility = index === 0 ? "hidden" : "visible";
          nextBtn.textContent = index === stepContents.length - 1 ? "Create database" : "Next";
        }

        function validateCurrentStep() {
          const inputs = stepContents[currentStep].querySelectorAll("input, select");
          for (const input of Array.from(inputs)) {
            if (input.hasAttribute("required") && !(input).value) {
              input.reportValidity();
              return false;
            }
          }
          return true;
        }

        function gatherData() {
          syncPlansFromInputs();
          const data = {
            gymName: document.getElementById("gymName").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            gymType: document.getElementById("gymType").value,
            openingTime: document.getElementById("openingTime").value,
            closingTime: document.getElementById("closingTime").value,
            workerCount: Number(workerCountSelect.value),
            workers: [],
            memberships: membershipPlans,
          };

          for (let i = 0; i < data.workerCount; i++) {
            const name = document.getElementById('worker-name-' + i).value;
            const role = document.getElementById('worker-role-' + i).value;
            const dutyStart = document.getElementById('worker-start-' + i).value;
            const dutyEnd = document.getElementById('worker-end-' + i).value;
            data.workers.push({ name, role, dutyStart, dutyEnd });
          }

          return data;
        }

        function showSummary() {
          const data = gatherData();
          const previewTables = [
            "gyms (name, email, password_hash, gym_type, opening_time, closing_time, created_at)",
            "workers (gym_id, full_name, role, duty_start, duty_end)",
            "membership_plans (gym_id, name, price, billing_cycle, access_scope, perks)",
            "members (gym_id, full_name, email, phone, membership_plan_id, start_date, end_date, status)",
            "attendance_logs (gym_id, worker_id, attendee_name, attendee_type, check_in, check_out, status)",
            "balance_dues (gym_id, member_name, amount_due, due_date, status)"
          ];

          summaryBox.innerHTML = [
            '<div class="summary-item">',
            '<div style="font-weight:700;">Gym</div>',
            '<div>' + data.gymName + ' • ' + data.gymType + '</div>',
            '<div style="color:#475569;">' + data.openingTime + ' - ' + data.closingTime + '</div>',
            '</div>',
            '<div class="summary-item">',
            '<div style="font-weight:700;">Team</div>',
            '<div>' + data.workerCount + ' workers</div>',
            '<div style="color:#475569;">' + data.workers.map(function(w) { return w.name || '(pending)'; }).join(', ') + '</div>',
            '</div>',
            '<div class="summary-item">',
            '<div style="font-weight:700;">Memberships</div>',
            '<div>' + data.memberships.length + ' types</div>',
            '<div style="color:#475569;">' + data.memberships.map(function(m) { return m.name + ' (' + m.billing + ')'; }).join(', ') + '</div>',
            '</div>',
            '<div class="summary-item">',
            '<div style="font-weight:700;">Tables to create</div>',
            '<ul style="padding-left:18px; margin:6px 0 0; color:#334155;">',
            previewTables.map(function(t) { return '<li>' + t + '</li>'; }).join(''),
            '</ul>',
            '</div>'
          ].join('');
        }

        populateWorkerCount();
        renderSteps();
        renderWorkers();
        renderPlans();
        goToStep(0);

        workerCountSelect.addEventListener("change", renderWorkers);
        shiftPresetSelect.addEventListener("change", renderWorkers);

        addPlanBtn.addEventListener("click", function() {
          syncPlansFromInputs();
          membershipPlans.push({ name: "New plan", price: "0", billing: "monthly", access: "full", perks: "" });
          renderPlans();
        });

        nextBtn.addEventListener("click", async function() {
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
          statusBox.textContent = "Creating tables and saving data...";

          try {
            const response = await fetch("/api/setup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Failed to create tables");
            statusBox.textContent = result.message;
          } catch (error) {
            statusBox.classList.add("error");
            statusBox.textContent = error.message;
          }
        });

        backBtn.addEventListener("click", function() {
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

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeText(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }
  return fallback;
}

function safeTime(value: unknown, fallback = "00:00"): string {
  return safeText(value, fallback) || fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizePayload(raw: any) {
  const workerCount = safeNumber(raw.workerCount, 0);
  const workers = Array.isArray(raw.workers) ? raw.workers.slice(0, 50) : [];
  const memberships = Array.isArray(raw.memberships) ? raw.memberships.slice(0, 50) : [];

  return {
    gymName: safeText(raw.gymName, "Gym"),
    email: safeText(raw.email),
    password: safeText(raw.password),
    gymType: safeText(raw.gymType, "combined"),
    openingTime: safeTime(raw.openingTime),
    closingTime: safeTime(raw.closingTime),
    workerCount,
    workers: workers.map((worker, index) => ({
      name: safeText(worker?.name, `Worker ${index + 1}`),
      role: safeText(worker?.role, "trainer"),
      dutyStart: safeTime(worker?.dutyStart),
      dutyEnd: safeTime(worker?.dutyEnd),
    })),
    memberships: memberships.map((plan, index) => ({
      name: safeText(plan?.name, `Plan ${index + 1}`),
      price: safeNumber(plan?.price, 0),
      billing: safeText(plan?.billing, "monthly"),
      access: safeText(plan?.access, "full"),
      perks: safeText(plan?.perks, ""),
    })),
  };
}

async function setupDatabase(env: Env) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS gyms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      gym_type TEXT NOT NULL,
      opening_time TEXT NOT NULL,
      closing_time TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS membership_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      billing_cycle TEXT NOT NULL,
      access_scope TEXT,
      perks TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
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
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gym_id) REFERENCES gyms(id)
    )`,
    `CREATE VIEW IF NOT EXISTS attendance_daily_counts AS
      SELECT gym_id, date(check_in) AS day, worker_id, COUNT(*) AS total
      FROM attendance_logs
      GROUP BY gym_id, day, worker_id`
  ];

  for (const sql of statements) {
    await env.DB.prepare(sql).run();
  }
}

async function insertGym(env: Env, payload: any) {
  const password_hash = await hashPassword(payload.password);
  const gymResult = await env.DB.prepare(
    `INSERT INTO gyms (name, email, password_hash, gym_type, opening_time, closing_time) VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(payload.gymName, payload.email, password_hash, payload.gymType, payload.openingTime, payload.closingTime)
    .run();

  const gymId = gymResult.lastInsertRowId as number;

  const workerStmt = env.DB.prepare(
    `INSERT INTO workers (gym_id, full_name, role, duty_start, duty_end) VALUES (?, ?, ?, ?, ?)`
  );

  for (const worker of payload.workers || []) {
    await workerStmt.bind(gymId, worker.name || "Pending", worker.role, worker.dutyStart, worker.dutyEnd).run();
  }

  const planStmt = env.DB.prepare(
    `INSERT INTO membership_plans (gym_id, name, price, billing_cycle, access_scope, perks) VALUES (?, ?, ?, ?, ?, ?)`
  );

  for (const plan of payload.memberships || []) {
    await planStmt.bind(gymId, plan.name, Number(plan.price || 0), plan.billing, plan.access, plan.perks).run();
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/setup") {
      try {
        const payload = await request.json();
        const sanitizedPayload = sanitizePayload(payload);

        if (!sanitizedPayload.gymName || !sanitizedPayload.email || !sanitizedPayload.password) {
          return new Response(JSON.stringify({ error: "Gym name, email, and password are required." }), { status: 400 });
        }

        await setupDatabase(env);
        await insertGym(env, sanitizedPayload);

        return new Response(JSON.stringify({
          message: "D1 tables are ready and the initial gym profile has been saved.",
        }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
      }
    }

    return layout();
  },
};
