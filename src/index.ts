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
    // Just validation + step switch here; API call only at last step.
    if (!validateCurrentStep()) return;

    if (currentStep < stepContents.length - 1) {
      if (currentStep === stepContents.length - 2) {
        showSummary();
      }
      goToStep(currentStep + 1);
      return;
    }

    // LAST STEP → send to backend
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
