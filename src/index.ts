export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
}

function layout(body: string): Response {
  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Gym Attendance Setup</title>
      <style>
        :root {
          color-scheme: light;
          --surface: #ffffff;
          --muted: #f4f6fb;
          --primary: #1c6dd0;
          --primary-soft: #e3edfb;
          --text: #1f2937;
          --border: #d6deeb;
          --success: #0f9d58;
          --shadow: 0 12px 40px rgba(28, 109, 208, 0.12);
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
          padding: 20px 28px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        h1 {
          margin: 0;
          font-size: 24px;
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
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .step {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          align-items: center;
          gap: 10px;
          opacity: 0.65;
          transition: all 0.2s ease;
        }

        .step.active {
          border-color: var(--primary);
          background: var(--primary-soft);
          opacity: 1;
        }

        .step-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--primary);
          color: #fff;
          display: grid;
          place-items: center;
          font-weight: 600;
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
          background: #fff7ed;
          color: #8b3a0e;
          border: 1px solid #f8d1a5;
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
      </style>
    </head>
    <body>
      <header>
        <div class="pill">Cloudflare D1 + R2 ready</div>
        <h1>Gym attendance onboarding dashboard</h1>
        <p style="margin: 6px 0 0; color: #475569;">
          Configure what data we need, preview the database tables, and launch the setup for your combined or single-gender gym.
        </p>
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
              <div class="field">
                <label for="gymType">Gym type</label>
                <select id="gymType" name="gymType" required>
                  <option value="combined">Combined (all genders)</option>
                  <option value="male">Male only</option>
                  <option value="female">Female only</option>
                </select>
              </div>
              <div class="field">
                <label for="openingTime">Opening time</label>
                <input id="openingTime" name="openingTime" type="time" required />
              </div>
            </div>

            <div class="step-content" data-step="2" style="display:none;">
              <div class="notice">Set how many workers you have. We will create accounts and duty time slots automatically.</div>
              <div class="grid">
                <div class="field">
                  <label for="workerCount">Workers</label>
                  <select id="workerCount" name="workerCount">
                    ${Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("\n")}
                  </select>
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
        const steps = ["Gym details", "Gym type & hours", "Team setup", "Review & create"];
        const stepContainer = document.getElementById("steps");
        const stepContents = Array.from(document.querySelectorAll(".step-content"));
        const nextBtn = document.getElementById("nextBtn");
        const backBtn = document.getElementById("backBtn");
        const workersContainer = document.getElementById("workers");
        const workerCountSelect = document.getElementById("workerCount");
        const shiftPresetSelect = document.getElementById("shiftPreset");
        const statusBox = document.getElementById("status");
        const summaryBox = document.getElementById("summary");

        let currentStep = 0;

        const renderSteps = () => {
          stepContainer.innerHTML = steps
            .map((title, index) => \`
              <div class="step \${index === currentStep ? "active" : ""}">
                <div class="step-number">\${index + 1}</div>
                <div>
                  <div style="font-weight:700; font-size:14px;">\${title}</div>
                  <div style="color:#475569; font-size:13px;">\${index === 0 ? "Start with basics" : index === 1 ? "Combined or gender specific" : index === 2 ? "Shift definitions" : "Confirm tables"}</div>
                </div>
              </div>
            \`)
            .join("");
        };

        const timeFromPreset = (index: number, preset: number) => {
          const startHour = 6 + (index % 3) * 3;
          const start = String(startHour).padStart(2, "0") + ":00";
          const endHour = (startHour + preset) % 24;
          const end = String(endHour).padStart(2, "0") + ":00";
          return { start, end };
        };

        const renderWorkers = () => {
          const count = Number(workerCountSelect.value);
          const preset = Number(shiftPresetSelect.value);
          workersContainer.innerHTML = Array.from({ length: count }, (_, i) => {
            const times = timeFromPreset(i, preset);
            return \`
              <div class="worker-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <div style="font-weight:700;">Worker \${i + 1}</div>
                  <span class="pill">Auto shift: \${times.start} - \${times.end}</span>
                </div>
                <div class="grid">
                  <div class="field">
                    <label for="worker-name-\${i}">Full name</label>
                    <input id="worker-name-\${i}" name="worker-name-\${i}" placeholder="e.g. Jordan Smith" required />
                  </div>
                  <div class="field">
                    <label for="worker-role-\${i}">Role</label>
                    <select id="worker-role-\${i}" name="worker-role-\${i}">
                      <option value="trainer">Trainer</option>
                      <option value="front-desk">Front desk</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="worker-start-\${i}">Duty starts</label>
                    <input id="worker-start-\${i}" name="worker-start-\${i}" type="time" value="\${times.start}" />
                  </div>
                  <div class="field">
                    <label for="worker-end-\${i}">Duty ends</label>
                    <input id="worker-end-\${i}" name="worker-end-\${i}" type="time" value="\${times.end}" />
                  </div>
                </div>
              </div>
            \`;
          }).join("");
        };

        renderSteps();
        renderWorkers();

        workerCountSelect.addEventListener("change", renderWorkers);
        shiftPresetSelect.addEventListener("change", renderWorkers);

        const goToStep = (index: number) => {
          stepContents.forEach((content, i) => {
            content.setAttribute("style", i === index ? "" : "display:none;");
          });
          currentStep = index;
          renderSteps();
          backBtn.style.visibility = index === 0 ? "hidden" : "visible";
          nextBtn.textContent = index === stepContents.length - 1 ? "Create database" : "Next";
        };

        goToStep(0);

        const gatherData = () => {
          const data = {
            gymName: document.getElementById("gymName").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            gymType: document.getElementById("gymType").value,
            openingTime: document.getElementById("openingTime").value,
            workerCount: Number(workerCountSelect.value),
            workers: [],
          };

          for (let i = 0; i < data.workerCount; i++) {
            const name = document.getElementById(\`worker-name-\${i}\`).value;
            const role = document.getElementById(\`worker-role-\${i}\`).value;
            const dutyStart = document.getElementById(\`worker-start-\${i}\`).value;
            const dutyEnd = document.getElementById(\`worker-end-\${i}\`).value;
            data.workers.push({ name, role, dutyStart, dutyEnd });
          }

          return data;
        };

        const showSummary = () => {
          const data = gatherData();
          const previewTables = [
            "gyms (name, email, password_hash, gym_type, opening_time, created_at)",
            "workers (gym_id, full_name, role, duty_start, duty_end)",
            "attendance_logs (gym_id, worker_id, attendee_name, attendee_type, check_in, check_out, status)",
            "balance_dues (gym_id, member_name, amount_due, due_date, status)"
          ];

          summaryBox.innerHTML = \`
            <div class="summary-item">
              <div style="font-weight:700;">Gym</div>
              <div>\${data.gymName} • \${data.gymType}</div>
              <div style="color:#475569;">Opens at \${data.openingTime}</div>
            </div>
            <div class="summary-item">
              <div style="font-weight:700;">Team</div>
              <div>\${data.workerCount} workers</div>
              <div style="color:#475569;">\${data.workers.map(w => w.name || "(pending)").join(", ")}</div>
            </div>
            <div class="summary-item">
              <div style="font-weight:700;">Tables to create</div>
              <ul style="padding-left:18px; margin:6px 0 0; color:#334155;">
                \${previewTables.map(t => \`<li>\${t}</li>\`).join("")}
              </ul>
            </div>
            <div class="summary-item">
              <div style="font-weight:700;">Automation</div>
              <div>Attendance count view</div>
              <div style="color:#475569;">Auto totals grouped per day and worker</div>
            </div>
          \`;
        };

        const validateCurrentStep = () => {
          const inputs = stepContents[currentStep].querySelectorAll("input, select");
          for (const input of Array.from(inputs)) {
            if (input.hasAttribute("required") && !input.value) {
              input.reportValidity();
              return false;
            }
          }
          return true;
        };

        nextBtn.addEventListener("click", async () => {
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
            statusBox.textContent = (error as Error).message;
          }
        });

        backBtn.addEventListener("click", () => {
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

async function setupDatabase(env: Env) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS gyms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      gym_type TEXT NOT NULL,
      opening_time TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
    `INSERT INTO gyms (name, email, password_hash, gym_type, opening_time) VALUES (?, ?, ?, ?, ?)`
  ).bind(payload.gymName, payload.email, password_hash, payload.gymType, payload.openingTime).run();

  const gymId = gymResult.lastInsertRowId as number;

  const workerStmt = env.DB.prepare(
    `INSERT INTO workers (gym_id, full_name, role, duty_start, duty_end) VALUES (?, ?, ?, ?, ?)`
  );

  for (const worker of payload.workers || []) {
    await workerStmt.bind(gymId, worker.name || "Pending", worker.role, worker.dutyStart, worker.dutyEnd).run();
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/setup") {
      try {
        const payload = await request.json();
        if (!payload.gymName || !payload.email || !payload.password) {
          return new Response(JSON.stringify({ error: "Gym name, email, and password are required." }), { status: 400 });
        }

        await setupDatabase(env);
        await insertGym(env, payload);

        return new Response(JSON.stringify({
          message: "D1 tables are ready and the initial gym profile has been saved.",
        }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
      }
    }

    return layout("");
  },
};
