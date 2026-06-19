(function () {
  "use strict";

  /* ================================================================
     1. DEFAULT CONFIGURATION / RULES
     ================================================================ */
  const DEFAULT_RULES = {
    fxRates: { AED: 1, USD: 3.6725, EUR: 4.247138, GBP: 4.863304, SAR: 0.9793333333, EGP: 0.0691, LYD: 0.57616 },
    sheetMap: [
      { sheetName: "01_CONTRACT_TRACKER", recordType: "Contract",       enabled: true, headerRow: "auto" },
      { sheetName: "02_VO TO CLIENT_",    recordType: "VO to Client",   enabled: true, headerRow: "auto" },
      { sheetName: "02.01_VO TO SUBCON",  recordType: "VO to Subcon",   enabled: true, headerRow: "auto" },
      { sheetName: "03_SCA TRACKER",      recordType: "Subconsultant",  enabled: true, headerRow: "auto" }
    ],
    columnMap: {
      "Contract":      { projectNo:"Project Number", projectName:"Project Name", pm:"Project Manager", status:"Signed Contract/ LOA", currency:"Currency", amount:"Total Contract Value", date:"", year:"Year", description:"Nature of the Project", remarks:"Remarks", client:"Client Name", location:"Location", ms_award:"Award", ms_formOfContract:"Form of Contract", ms_issue:"Issue", ms_technicalReview:"Technical Review", ms_commercialReview:"Commercial Review", ms_submittedForSignature:"Submitted to Dr. Shams for Signature", ms_signedInternal:"Signed by Dr. Shams", ms_submittedClientSig:"Submitted for Client Signature", ms_signedContractCollected:"Signed Contract Collected" },
      "VO to Client":  { projectNo:"Project No", projectName:"Project Name", pm:"Project Manager", status:"VO Status", invoiceStatus:"Invoice Status", currency:"Currency", amount:"Amount", date:"", year:"Year", description:"Description", remarks:"Remarks", voNo:"VO.No.", client:"", location:"", vms_issuance:"Issuance / Request", vms_review:"Review", vms_approval:"Approval", vms_submitClientSig:"Submit For client Signature", vms_voWorkStatus:"VO Work Status", vms_invoice:"Invoice" },
      "VO to Subcon":  { projectNo:"Project No", projectName:"Project Name", pm:"Project Manager", status:"Status", currency:"Currency", amount:"Amount", date:"", year:"Year", description:"Description", remarks:"Remarks", client:"", location:"", vsms_issuanceRequest:"Issuance Request (PM)", vsms_review:"Review (Contracts)", vsms_approval:"Approval (Finance/Technical)", vsms_submitClientSig:"Submit For client Signature (PM)", vsms_payment:"Payment (Finance)" },
      "Subconsultant": { projectNo:"Project No", projectName:"Project Name", pm:"Project Manager", status:"Status", currency:"Currency", amount:"Amount", date:"", year:"Year", description:"ITEM(S) / SERVICE SUPPLIED", remarks:"Remarks", client:"", location:"", scms_initialRequest:"Initial Request (PM)", scms_collectQuotes:"Collect 3 Quotations (Procurement)", scms_evaluateQuotes:"Evaluate the Quotations and share with PM (Procurement)", scms_recommendation:"Recommend one of the Quotations (PM)", scms_commercialReview:"Commercial Review (Finance)", scms_collectSignedQuotation:"Collect signed Quotation from Sub-Consultant (Contracts)", scms_submitToDrShams:"Submit Quotation to Dr. Shams to sign (Contracts)", scms_generatePo:"Generate PO (Contracts)" }
    },
    statusBadges: [
      { keywords: ["yes","approved","signed by customer","contract signed","completed","closed done","done"], category: "good", enabled: true },
      { keywords: ["open","awaiting","in progress","review","sent","negotiation","submitted","pending"], category: "warn", enabled: true },
      { keywords: ["no","rejected","cancelled"], category: "danger", enabled: true },
      { keywords: ["superseded"], category: "purple", enabled: true }
    ],
    pmLookup: {},
    masterDictionaries: {
      currencies: ["AED","USD","EUR","GBP","SAR","EGP","LYD"],
      contractStatuses: ["Contract Signed","Signed by Customer","Approved","Negotiation","Awaiting","Open","Rejected","Cancelled"],
      voStatuses: ["Approved","Submitted","Open","Awaiting","In Progress","Review","Sent","Rejected","Cancelled","Closed Done","Done","Superseded"],
      scaStatuses: ["Completed","In Progress","Pending","Open","Cancelled"],
      sources: [],
      priorities: []
    },
    detectedHeaders: {
      "Contract": [],
      "VO to Client": [],
      "VO to Subcon": [],
      "Subconsultant": []
    }
  };

  const RECORD_FIELDS = ["type","projectNo","projectName","pm","status","invoiceStatus","currency","amount","amountAED","date","year","description","remarks","vendor","client","source","location","scope","voNo","ms_award","ms_formOfContract","ms_issue","ms_technicalReview","ms_commercialReview","ms_submittedForSignature","ms_signedInternal","ms_submittedClientSig","ms_signedContractCollected","vms_issuance","vms_review","vms_approval","vms_submitClientSig","vms_voWorkStatus","vms_invoice","vsms_issuanceRequest","vsms_review","vsms_approval","vsms_submitClientSig","vsms_payment","scms_initialRequest","scms_collectQuotes","scms_evaluateQuotes","scms_recommendation","scms_commercialReview","scms_collectSignedQuotation","scms_submitToDrShams","scms_generatePo"];

  const CONTRACT_MILESTONES = [
    { field: "ms_award",                   label: "Award" },
    { field: "ms_formOfContract",          label: "Form of Contract" },
    { field: "ms_issue",                   label: "Issue" },
    { field: "ms_technicalReview",         label: "Technical Review" },
    { field: "ms_commercialReview",        label: "Commercial Review" },
    { field: "ms_submittedForSignature",   label: "Submitted for Signature" },
    { field: "ms_signedInternal",          label: "Signed Internal" },
    { field: "ms_submittedClientSig",      label: "Submitted Client Sig." },
    { field: "ms_signedContractCollected", label: "Contract Collected" }
  ];

  const VO_CLIENT_MILESTONES = [
    { field: "vms_issuance",        label: "Issuance / Request" },
    { field: "vms_review",          label: "Review" },
    { field: "vms_approval",        label: "Approval" },
    { field: "vms_submitClientSig", label: "Submit for Client Sig." },
    { field: "vms_voWorkStatus",    label: "VO Work Status" },
    { field: "vms_invoice",         label: "Invoice" }
  ];

  const VO_SUBCON_MILESTONES = [
    { field: "vsms_issuanceRequest", label: "Issuance Request" },
    { field: "vsms_review",          label: "Review" },
    { field: "vsms_approval",        label: "Approval" },
    { field: "vsms_submitClientSig", label: "Submit for Client Sig." },
    { field: "vsms_payment",         label: "Payment" }
  ];

  const SCA_MILESTONES = [
    { field: "scms_initialRequest",         label: "Initial Request" },
    { field: "scms_collectQuotes",          label: "Collect 3 Quotations" },
    { field: "scms_evaluateQuotes",         label: "Evaluate Quotations" },
    { field: "scms_recommendation",         label: "Recommendation" },
    { field: "scms_commercialReview",       label: "Commercial Review" },
    { field: "scms_collectSignedQuotation", label: "Collect Signed Quotation" },
    { field: "scms_submitToDrShams",        label: "Submit to Dr. Shams" },
    { field: "scms_generatePo",             label: "Generate PO" }
  ];

  const STATUS_FILTER_ALL = "__ALL__";
  const FILTER_ALL = STATUS_FILTER_ALL;

  /* ================================================================
     2. APP STATE
     ================================================================ */
  const state = {
    page: "overview",
    filters: { type:[FILTER_ALL], pm:[FILTER_ALL], status:[STATUS_FILTER_ALL], invoiceStatus:[FILTER_ALL], years:[FILTER_ALL], projectNo:[FILTER_ALL], projectName:[FILTER_ALL] },
    data: { sourceFile: "No file loaded", importedAt: "—", milestoneResponsibilities: {}, records: { contracts:[], voClient:[], voSubcon:[], sca:[] } },
    rules: JSON.parse(JSON.stringify(DEFAULT_RULES)),
    charts: {}
  };

  function allData() {
    const r = state.data.records;
    return [].concat(r.contracts, r.voClient, r.voSubcon, r.sca);
  }

  /* ================================================================
     3. PERSISTENCE (localStorage + JSON import/export)
     ================================================================ */
  const STORAGE_RULES = "ct_dashboard_rules";
  const STORAGE_DATA  = "ct_dashboard_data";
  const STORAGE_THEME = "ct_dashboard_theme";

  function saveRules() { try { localStorage.setItem(STORAGE_RULES, JSON.stringify(state.rules)); } catch(e){} }
  function loadRules() {
    try {
      const raw = localStorage.getItem(STORAGE_RULES);
      if (raw) {
        const parsed = JSON.parse(raw);
        Object.assign(state.rules, parsed);
        var defMap = DEFAULT_RULES.columnMap;
        var curMap = state.rules.columnMap;
        var migrated = false;
        Object.keys(defMap).forEach(function (type) {
          if (!curMap[type]) {
            curMap[type] = JSON.parse(JSON.stringify(defMap[type]));
            migrated = true;
            return;
          }
          var missingFields = Object.keys(defMap[type]).filter(function (f) { return !(f in curMap[type]); });
          var extraFields = Object.keys(curMap[type]).filter(function (f) { return !(f in defMap[type]); });
          if (missingFields.length > 0 || extraFields.length > 0) {
            curMap[type] = JSON.parse(JSON.stringify(defMap[type]));
            migrated = true;
          }
        });
        if (!state.rules.detectedHeaders) {
          state.rules.detectedHeaders = JSON.parse(JSON.stringify(DEFAULT_RULES.detectedHeaders));
          migrated = true;
        }
        if (migrated) saveRules();
      }
    } catch(e){}
  }
  function saveData() { try { localStorage.setItem(STORAGE_DATA, JSON.stringify(state.data)); } catch(e){} }
  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_DATA);
      if (raw) {
        state.data = JSON.parse(raw);
        if (!state.data.milestoneResponsibilities) state.data.milestoneResponsibilities = {};
        applyPMCleanup();
        repairCachedStatuses();
      }
    } catch(e){}
  }
  function exportRulesJSON() {
    const blob = new Blob([JSON.stringify(state.rules, null, 2)], { type: "application/json" });
    downloadBlob(blob, "dashboard_rules.json");
  }
  function importRulesJSON(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        Object.assign(state.rules, parsed);
        saveRules();
        renderAll();
        showToast("Rules imported successfully.", "success");
      } catch (err) { showToast("Invalid JSON file: " + err.message, "danger"); }
    };
    reader.readAsText(file);
  }
  function resetRules() {
    state.rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
    saveRules();
    renderAll();
    showToast("Rules reset to defaults.", "info");
  }

  function loadTheme() {
    var saved = "light";
    try {
      saved = localStorage.getItem(STORAGE_THEME) || "light";
    } catch (e) {}
    applyTheme(saved === "dark" ? "dark" : "light");
  }

  function applyTheme(theme) {
    var normalized = theme === "dark" ? "dark" : "light";
    document.body.setAttribute("data-theme", normalized);
    var toggle = document.getElementById("themeToggle");
    var label = document.getElementById("themeToggleLabel");
    if (toggle) toggle.checked = normalized === "dark";
    if (label) label.textContent = normalized === "dark" ? "Dark" : "Light";
    try { localStorage.setItem(STORAGE_THEME, normalized); } catch (e) {}
    if (state && state.charts) {
      setTimeout(function () { renderAll(); }, 0);
    }
  }

  /* ================================================================
     4. UTILITY HELPERS
     ================================================================ */
  function fmtNumber(n) { return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(n || 0)); }
  function fmtMoney(n) { return fmtMoneyShort(n); }
  function fmtMoneyShort(n) {
    if (n == null || isNaN(Number(n))) return "—";
    var value = Math.abs(Number(n));
    var sign = Number(n) < 0 ? "-" : "";
    var units = [
      { limit: 1000000000, suffix: "B" },
      { limit: 1000000, suffix: "M" },
      { limit: 1000, suffix: "K" }
    ];
    for (var i = 0; i < units.length; i++) {
      if (value >= units[i].limit) {
        var shortValue = value / units[i].limit;
        var digits = 0;
        return "AED " + sign + Number(shortValue.toFixed(digits)).toString() + units[i].suffix;
      }
    }
    return "AED " + sign + fmtNumber(value);
  }
  function fmtDate(v) {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  function safe(v) { return (v ?? "").toString().trim(); }
  function slug(v) { return safe(v).toLowerCase(); }
  function headerKey(v) { return safe(v).toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function sumAED(rows) { return rows.reduce(function (a, r) { return a + (Number(r.amountAED) || 0); }, 0); }
  function uniq(arr) { return Array.from(new Set(arr.filter(Boolean))).sort(); }
  function escHtml(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  function downloadBlob(blob, name) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
  }

  function showToast(msg, type) {
    type = type || "info";
    var id = "toast-" + Date.now();
    var html = '<div id="'+id+'" class="toast align-items-center text-bg-'+type+' border-0 show" role="alert">' +
      '<div class="d-flex"><div class="toast-body">'+escHtml(msg)+'</div>' +
      '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>';
    document.getElementById("toast-area").insertAdjacentHTML("beforeend", html);
    setTimeout(function () { var el = document.getElementById(id); if (el) el.remove(); }, 5000);
  }

  /* ================================================================
     5. RULES ENGINE
     ================================================================ */
  function badgeClass(status) {
    var s = slug(status);
    if (!s) return "badge-muted";
    if (s === "signed") return "badge-good";
    if (s === "unsigned") return "badge-danger";
    var rules = state.rules.statusBadges;
    for (var i = 0; i < rules.length; i++) {
      if (!rules[i].enabled) continue;
      for (var j = 0; j < rules[i].keywords.length; j++) {
        if (s.indexOf(rules[i].keywords[j]) !== -1) return "badge-" + rules[i].category;
      }
    }
    return "badge-muted";
  }
  function convertToAED(amount, currency) {
    var rate = state.rules.fxRates[currency];
    if (!rate) rate = 1;
    return (Number(amount) || 0) * rate;
  }
  function enrichPM(row) {
    if (!row.pm && row.projectNo && state.rules.pmLookup[row.projectNo]) {
      row.pm = state.rules.pmLookup[row.projectNo];
    }
  }
  function isInvalidPM(value) {
    var v = safe(value);
    if (!v) return true;
    if (v === "-" || v === "?" || v === "0") return true;
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return true;
    if (/^\d{5}(\.\d+)?$/.test(v)) return true;
    return false;
  }
  function normalizePM(value) {
    return isInvalidPM(value) ? "" : safe(value).replace(/^\((.*)\)$/, "$1").trim();
  }
  function normalizeStatusValue(value, recordType) {
    var raw = safe(value);
    if (!raw) return "";
    var key = raw.toLowerCase().replace(/\s+/g, " ").trim();
    // Contracts use the "Signed Contract/ LOA" column whose raw values are Yes/No.
    // Surface them as the clearer "Signed" / "Unsigned" everywhere.
    if (recordType === "Contract") {
      if (key === "yes") return "Signed";
      if (key === "no") return "Unsigned";
    }
    var map = {
      "completed": "Completed",
      "in progress": "In Progress",
      "on hold": "On Hold",
      "cancelled": "Cancelled",
      "superseded": "Superseded",
      "closed": "Closed",
      "open": "Open",
      "open invoiced": "Open Invoiced",
      "open not invoiced": "Open Not Invoiced",
      "awaiting sub signature": "Awaiting Sub Signature",
      "awaiting subcon signature": "Awaiting Subcon Signature",
      "signed by dr. shams": "Signed by Dr. Shams",
      "signed by customer": "Signed by Customer",
      "contract signed": "Contract Signed",
      "approved": "Approved",
      "review": "Review",
      "pending": "Pending",
      "yes": "Yes",
      "no": "No"
    };
    return map[key] || raw.replace(/\s+/g, " ").trim();
  }
  function normalizeProjectNo(value) {
    return slug(value).replace(/\s+/g, "").replace(/-uae$/, "-dxb");
  }
  function applyPMCleanup(records) {
    records = records || state.data.records || {};
    var lookup = {};
    (records.contracts || []).forEach(function (row) {
      row.pm = normalizePM(row.pm);
      var key = normalizeProjectNo(row.projectNo);
      if (key && row.pm) lookup[key] = row.pm;
    });
    ["voClient", "voSubcon", "sca"].forEach(function (key) {
      (records[key] || []).forEach(function (row) {
        row.pm = normalizePM(row.pm);
        if (!row.pm) {
          var projectKey = normalizeProjectNo(row.projectNo);
          if (projectKey && lookup[projectKey]) row.pm = lookup[projectKey];
        }
        enrichPM(row);
      });
    });
  }
  function repairCachedStatuses(records) {
    records = records || state.data.records || {};
    var keyToType = { contracts: "Contract", voClient: "VO to Client", voSubcon: "VO to Subcon", sca: "Subconsultant" };
    ["contracts", "voClient", "voSubcon", "sca"].forEach(function (key) {
      var recordType = keyToType[key];
      (records[key] || []).forEach(function (row) {
        row.status = normalizeStatusValue(row.status, recordType);
        if ("invoiceStatus" in row) row.invoiceStatus = normalizeStatusValue(row.invoiceStatus, recordType);
      });
    });
    (records.voClient || []).forEach(function (row) {
      if (!safe(row.status) && safe(row.invoiceStatus)) row.status = row.invoiceStatus;
    });
  }

  /* ================================================================
     6. FILTER ENGINE
     ================================================================ */
  function filterRows(rows, scopedType) {
    return filterRowsWithExclusions(rows, scopedType, []);
  }

  // emptyMeansAll: when true, a filter whose selection is an empty array is treated as
  // "no constraint" instead of "match nothing". Used ONLY when computing the available
  // options for each dropdown, so that temporarily deselecting all values in one filter
  // does not collapse the option lists of the other filters (which would wipe their
  // selections). Data display always passes it falsy, so empty still means "match none".
  function filterRowsWithExclusions(rows, scopedType, excludedFilters, emptyMeansAll) {
    excludedFilters = excludedFilters || [];
    var f = state.filters;
    return rows.filter(function (row) {
      if (scopedType && row.type !== scopedType) return false;
      if (excludedFilters.indexOf("type") === -1 && !multiFilterMatches(f.type, row.type, emptyMeansAll)) return false;
      if (excludedFilters.indexOf("pm") === -1 && !multiFilterMatches(f.pm, normalizePM(row.pm), emptyMeansAll)) return false;
      if (excludedFilters.indexOf("status") === -1 && Array.isArray(f.status)) {
        if (f.status.indexOf(STATUS_FILTER_ALL) !== -1) {
          // no status filtering
        } else if (!f.status.length) {
          if (emptyMeansAll !== true) return false;
        } else {
        var statusKey = state.page === "overview" ? (safe(row.type) + "|" + safe(row.status)) : safe(row.status);
        if (f.status.indexOf(statusKey) === -1) return false;
        }
      }
      if (state.page === "voClient" && excludedFilters.indexOf("invoiceStatus") === -1 && Array.isArray(f.invoiceStatus)) {
        if (f.invoiceStatus.indexOf(FILTER_ALL) !== -1) {
          // no invoice status filtering
        } else if (!f.invoiceStatus.length) {
          if (emptyMeansAll !== true) return false;
        } else if (f.invoiceStatus.indexOf(safe(row.invoiceStatus)) === -1) {
          return false;
        }
      }
      if (excludedFilters.indexOf("years") === -1 && !multiFilterMatches(f.years, safe(row.year), emptyMeansAll)) return false;
      if (excludedFilters.indexOf("projectNo") === -1 && !multiFilterMatches(f.projectNo, safe(row.projectNo) || "Blank", emptyMeansAll)) return false;
      if (excludedFilters.indexOf("projectName") === -1 && !multiFilterMatches(f.projectName, safe(row.projectName) || "Blank", emptyMeansAll)) return false;
      return true;
    });
  }

  function multiFilterMatches(selected, value, emptyMeansAll) {
    if (!Array.isArray(selected) || selected.indexOf(FILTER_ALL) !== -1) return true;
    if (!selected.length) return emptyMeansAll === true;
    return selected.indexOf(safe(value) || "Blank") !== -1;
  }

  function topCounts(rows, key, limit) {
    limit = limit || 6;
    var map = {};
    rows.forEach(function (r) { var k = safe(typeof key === "function" ? key(r) : r[key]) || "Unspecified"; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).sort(function (a, b) { return b[1] - a[1]; }).slice(0, limit).map(function (e) { return { label: e[0], value: e[1] }; });
  }
  function topSums(rows, key, limit) {
    limit = limit || 6;
    var map = {};
    rows.forEach(function (r) { var k = safe(typeof key === "function" ? key(r) : r[key]) || "Unspecified"; map[k] = (map[k] || 0) + (Number(r.amountAED) || 0); });
    return Object.entries(map).sort(function (a, b) { return b[1] - a[1]; }).slice(0, limit).map(function (e) { return { label: e[0], value: e[1] }; });
  }
  function projectDisplayLabel(row) {
    var projectNo = safe(row && row.projectNo);
    var projectName = safe(row && row.projectName);
    if (projectNo && projectName) return projectNo + " - " + projectName;
    return projectNo || projectName || "Unspecified";
  }
  function trackerFilterClass(type) {
    if (type === "Contract") return "tracker-contract";
    if (type === "VO to Client") return "tracker-voclient";
    if (type === "VO to Subcon") return "tracker-vosubcon";
    if (type === "Subconsultant") return "tracker-sca";
    return "";
  }
  function trackerSortOrder(type) {
    if (type === "Contract") return 1;
    if (type === "VO to Client") return 2;
    if (type === "VO to Subcon") return 3;
    if (type === "Subconsultant") return 4;
    return 99;
  }
  function buildStatusFilterOptions(rows, includeTracker) {
    var seen = {};
    var options = [];
    rows.forEach(function (row) {
      var status = safe(row.status);
      if (!status) return;
      var type = safe(row.type);
      var key = includeTracker ? (type + "|" + status) : status;
      if (seen[key]) return;
      seen[key] = true;
      options.push({
        key: key,
        label: status,
        tracker: type,
        className: includeTracker ? trackerFilterClass(type) : ""
      });
    });
    return options.sort(function (a, b) {
      var trackerOrder = trackerSortOrder(a.tracker) - trackerSortOrder(b.tracker);
      if (trackerOrder !== 0) return trackerOrder;
      return a.label.localeCompare(b.label);
    });
  }
  function statusFilterSummary(selected, options) {
    if (!Array.isArray(selected) || selected.indexOf(STATUS_FILTER_ALL) !== -1 || selected.length === options.length) return "All statuses";
    if (!selected.length) return "No statuses";
    if (selected.length === 1) {
      var match = options.find(function (option) { return option.key === selected[0]; });
      return match ? match.label : selected[0];
    }
    return selected.length + " selected";
  }
  function statusFilterChipLabel(selected, options) {
    if (!Array.isArray(selected) || selected.indexOf(STATUS_FILTER_ALL) !== -1 || selected.length === options.length) return "";
    if (!selected.length) return "No statuses";
    if (selected.length === 1) {
      var match = options.find(function (option) { return option.key === selected[0]; });
      if (!match) return selected[0];
      return match.tracker && state.page === "overview" ? match.label + " (" + match.tracker + ")" : match.label;
    }
    return selected.length + " statuses selected";
  }
  function statusFilterChipClass(selected, options) {
    if (!Array.isArray(selected) || selected.length !== 1) return "";
    var match = options.find(function (option) { return option.key === selected[0]; });
    return match && match.className ? match.className : "";
  }
  function isAllFilterSelected(selected, optionCount) {
    return !Array.isArray(selected) || selected.indexOf(FILTER_ALL) !== -1 || selected.length === optionCount;
  }
  function multiFilterSummary(selected, options, allLabel, singularLabel, pluralLabel) {
    pluralLabel = pluralLabel || (singularLabel.toLowerCase() + "s");
    if (isAllFilterSelected(selected, options.length)) return allLabel;
    if (!selected.length) return "No " + pluralLabel;
    if (selected.length === 1) return selected[0];
    return selected.length + " selected";
  }
  function multiFilterChipValue(selected, options, singularLabel, pluralLabel) {
    pluralLabel = pluralLabel || (singularLabel.toLowerCase() + "s");
    if (isAllFilterSelected(selected, options.length)) return "";
    if (!selected.length) return "No " + pluralLabel;
    if (selected.length === 1) return selected[0];
    return selected.length + " " + pluralLabel + " selected";
  }
  function resetSingleFilter(key) {
    if (key === "status") {
      state.filters.status = [STATUS_FILTER_ALL];
    } else if (key === "invoiceStatus") {
      state.filters.invoiceStatus = [FILTER_ALL];
    } else if (key === "type" || key === "pm" || key === "years" || key === "projectNo" || key === "projectName") {
      state.filters[key] = [FILTER_ALL];
    }
    renderAll();
  }
  function renderFilterSummaryChips(filterOptions) {
    var wrap = document.getElementById("filterSummaryChips");
    if (!wrap) return;
    var typeOpts = filterOptions.type || [];
    var pmOpts = filterOptions.pm || [];
    var statusOpts = filterOptions.status || [];
    var invoiceStatusOpts = filterOptions.invoiceStatus || [];
    var yearOpts = filterOptions.years || [];
    var projectNoOpts = filterOptions.projectNo || [];
    var projectNameOpts = filterOptions.projectName || [];
    var chips = [];
    function addChip(key, label, value, className) {
      if (!value) return;
      chips.push('<button type="button" class="filter-chip ' + escHtml(className || "") + '" data-filter-key="' + key + '">' +
        '<span class="filter-chip-label">' + escHtml(label) + '</span>' +
        '<span class="filter-chip-value">' + escHtml(value) + '</span>' +
        '<span class="filter-chip-remove" aria-hidden="true">&times;</span>' +
        '<span class="visually-hidden">Clear ' + escHtml(label) + ' filter</span>' +
      '</button>');
    }
    var typeValue = multiFilterChipValue(state.filters.type, typeOpts, "Tracker");
    addChip("type", "Tracker", typeValue, Array.isArray(state.filters.type) && state.filters.type.length === 1 ? trackerFilterClass(state.filters.type[0]) : "");
    addChip("pm", "PM", multiFilterChipValue(state.filters.pm, pmOpts, "PM", "PMs"));
    addChip("status", "Status", statusFilterChipLabel(state.filters.status, statusOpts), statusFilterChipClass(state.filters.status, statusOpts));
    if (state.page === "voClient") addChip("invoiceStatus", "Invoice Status", multiFilterChipValue(state.filters.invoiceStatus, invoiceStatusOpts, "Invoice Status", "invoice statuses"));
    addChip("years", "Year", multiFilterChipValue(state.filters.years, yearOpts, "Year", "years"));
    addChip("projectNo", "Project No.", multiFilterChipValue(state.filters.projectNo, projectNoOpts, "Project No.", "project nos."));
    addChip("projectName", "Project Name", multiFilterChipValue(state.filters.projectName, projectNameOpts, "Project Name", "project names"));
    wrap.innerHTML = chips.length ? '<span class="filter-chip-caption">Active filters</span>' + chips.join("") : "";
    wrap.classList.toggle("d-none", chips.length === 0);
    wrap.querySelectorAll("[data-filter-key]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        resetSingleFilter(chip.getAttribute("data-filter-key"));
      });
    });
  }
  function closeStatusFilterMenu() {
    var menu = document.getElementById("filterStatusMenu");
    if (menu) menu.classList.add("d-none");
  }
  function renderStatusFilter(options) {
    var toggle = document.getElementById("filterStatusToggle");
    var menu = document.getElementById("filterStatusMenu");
    if (!toggle || !menu) return;
    toggle.textContent = statusFilterSummary(state.filters.status, options);
    if (!options.length) {
      menu.innerHTML = '<div class="status-filter-empty">No statuses available</div>';
      return;
    }
    var selectedAll = state.filters.status.indexOf(STATUS_FILTER_ALL) !== -1 || state.filters.status.length === options.length;
    menu.innerHTML = '<div class="excel-filter-search"><input type="text" class="form-control form-control-sm" id="filterStatusSearch" placeholder="Search"></div>' +
      '<label class="status-filter-option status-filter-all"><input type="checkbox" data-status-all="1"' + (selectedAll ? ' checked' : '') + '> <span>Select All</span></label>' +
      '<div class="status-filter-divider"></div>' +
      '<div class="excel-filter-options">' +
      options.map(function (option) {
        var checked = state.filters.status.indexOf(option.key) !== -1 || selectedAll;
        var tag = option.className ? ' <span class="status-filter-tag ' + option.className + '">' + escHtml(option.tracker) + '</span>' : "";
        return '<label class="status-filter-option" data-filter-option="' + escHtml((option.label + " " + option.tracker).toLowerCase()) + '"><input type="checkbox" value="' + escHtml(option.key) + '"' + (checked ? ' checked' : '') + '> <span>' + escHtml(option.label) + '</span>' + tag + '</label>';
      }).join("") + '</div>';
    var allInput = menu.querySelector('[data-status-all="1"]');
    var search = menu.querySelector("#filterStatusSearch");
    if (allInput) {
      allInput.addEventListener("change", function () {
        if (allInput.checked) {
          state.filters.status = [STATUS_FILTER_ALL];
        } else {
          state.filters.status = [];
          menu.querySelectorAll('input[type="checkbox"]').forEach(function (input) {
            if (!input.hasAttribute("data-status-all")) input.checked = false;
          });
        }
        toggle.textContent = statusFilterSummary(state.filters.status, options);
        renderAll();
      });
    }
    menu.querySelectorAll('.excel-filter-options input[type="checkbox"]').forEach(function (input) {
      if (input.hasAttribute("data-status-all")) return;
      input.addEventListener("change", function () {
        var checked = Array.from(menu.querySelectorAll('.excel-filter-options input[type="checkbox"]:checked')).filter(function (el) {
          return !el.hasAttribute("data-status-all");
        }).map(function (el) { return el.value; });
        state.filters.status = checked.length === options.length ? [STATUS_FILTER_ALL] : checked;
        toggle.textContent = statusFilterSummary(state.filters.status, options);
        renderAll();
      });
    });
    if (search) {
      search.addEventListener("input", function () {
        var term = slug(search.value);
        menu.querySelectorAll("[data-filter-option]").forEach(function (row) {
          row.classList.toggle("d-none", term && row.getAttribute("data-filter-option").indexOf(term) === -1);
        });
      });
    }
  }
  function renderExcelFilter(config) {
    var toggle = document.getElementById(config.toggleId);
    var menu = document.getElementById(config.menuId);
    if (!toggle || !menu) return;
    var options = config.options || [];
    var selected = Array.isArray(state.filters[config.key]) ? state.filters[config.key] : [FILTER_ALL];
    selected = selected.filter(function (value) {
      return value === FILTER_ALL || options.indexOf(value) !== -1;
    });
    state.filters[config.key] = selected;
    toggle.textContent = multiFilterSummary(selected, options, config.allLabel, config.singularLabel, config.pluralLabel);
    if (!options.length) {
      menu.innerHTML = '<div class="status-filter-empty">No options available</div>';
      return;
    }
    var selectedAll = isAllFilterSelected(selected, options.length);
    var searchId = config.menuId + "Search";
    menu.innerHTML = '<div class="excel-filter-search"><input type="text" class="form-control form-control-sm" id="' + searchId + '" placeholder="' + escHtml(config.searchPlaceholder || "Search") + '"></div>' +
      '<label class="status-filter-option status-filter-all"><input type="checkbox" data-filter-all="1"' + (selectedAll ? ' checked' : '') + '> <span>Select All</span></label>' +
      '<div class="status-filter-divider"></div>' +
      '<div class="excel-filter-options">' + options.map(function (option) {
        var checked = selected.indexOf(option) !== -1 || selectedAll;
        var tagClass = config.tagClass ? config.tagClass(option) : "";
        var tag = tagClass ? ' <span class="status-filter-tag ' + tagClass + '">' + escHtml(option) + '</span>' : "";
        return '<label class="status-filter-option" data-filter-option="' + escHtml(option.toLowerCase()) + '"><input type="checkbox" value="' + escHtml(option) + '"' + (checked ? ' checked' : '') + '> <span>' + escHtml(option) + '</span>' + tag + '</label>';
      }).join("") + '</div>';
    var allInput = menu.querySelector('[data-filter-all="1"]');
    var search = menu.querySelector("#" + searchId);
    var optionWrap = menu.querySelector(".excel-filter-options");
    function syncSelection() {
      var checked = Array.from(menu.querySelectorAll('.excel-filter-options input[type="checkbox"]:checked')).map(function (el) { return el.value; });
      state.filters[config.key] = checked.length === options.length ? [FILTER_ALL] : checked;
      toggle.textContent = multiFilterSummary(state.filters[config.key], options, config.allLabel, config.singularLabel, config.pluralLabel);
      renderAll();
    }
    if (allInput) {
      allInput.addEventListener("change", function () {
        if (allInput.checked) {
          state.filters[config.key] = [FILTER_ALL];
        } else {
          state.filters[config.key] = [];
          menu.querySelectorAll('.excel-filter-options input[type="checkbox"]').forEach(function (input) { input.checked = false; });
        }
        toggle.textContent = multiFilterSummary(state.filters[config.key], options, config.allLabel, config.singularLabel, config.pluralLabel);
        renderAll();
      });
    }
    if (optionWrap) {
      optionWrap.querySelectorAll('input[type="checkbox"]').forEach(function (input) {
        input.addEventListener("change", syncSelection);
      });
    }
    if (search) {
      search.addEventListener("input", function () {
        var term = slug(search.value);
        menu.querySelectorAll("[data-filter-option]").forEach(function (row) {
          row.classList.toggle("d-none", term && row.getAttribute("data-filter-option").indexOf(term) === -1);
        });
      });
    }
  }
  function contractStatusLabel(row) {
    var s = slug(row.status);
    if (s === "yes") return "Signed";
    if (s === "no") return "Unsigned";
    return safe(row.status) || "Unspecified";
  }
  function monthlyTrend(rows) {
    var map = {};
    rows.forEach(function (r) {
      if (!r.date) return;
      var d = new Date(r.date);
      if (isNaN(d.getTime())) return;
      var k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      map[k] = (map[k] || 0) + (Number(r.amountAED) || 0);
    });
    return Object.entries(map).sort(function (a, b) { return a[0].localeCompare(b[0]); }).slice(-10).map(function (e) { return { label: e[0], value: e[1] }; });
  }

  /* ================================================================
     7. EXCEL PARSER (SheetJS)
     ================================================================ */
  var uploadState = { workbook: null, file: null, sheetMapping: [], validationReport: null };

  function parseExcelFile(file, cb) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var wb = XLSX.read(e.target.result, { type: "array", cellDates: true });
        cb(null, wb);
      } catch (err) { cb(err, null); }
    };
    reader.readAsArrayBuffer(file);
  }

  function sheetToObjects(wb, sheetName, headerRow) {
    var ws = wb.Sheets[sheetName];
    if (!ws) return [];
    var opts = { defval: "", raw: false };
    if (typeof headerRow === "number" && headerRow >= 0) {
      opts.range = headerRow;
    }
    return XLSX.utils.sheet_to_json(ws, opts);
  }

  function detectColumns(wb, sheetName, headerRow) {
    var ws = wb.Sheets[sheetName];
    if (!ws) return [];
    var range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    var row = (typeof headerRow === "number" && headerRow >= 0) ? headerRow : range.s.r;
    var cols = [];
    for (var c = range.s.c; c <= range.e.c; c++) {
      var cell = ws[XLSX.utils.encode_cell({ r: row, c: c })];
      cols.push(cell ? String(cell.v).trim() : "");
    }
    return cols.filter(function (c) { return c !== ""; });
  }

  function findHeaderRow(wb, sheetName, recordType) {
    var ws = wb.Sheets[sheetName];
    if (!ws) return 0;
    var range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    var maxScan = Math.min(range.s.r + 15, range.e.r);
    var colMap = state.rules.columnMap[recordType] || {};
    var knownNames = new Set();
    Object.values(colMap).forEach(function (v) {
      if (v) knownNames.add(v.toLowerCase().replace(/[^a-z0-9]/g, ""));
    });

    var bestRow = range.s.r, bestScore = -1;
    for (var r = range.s.r; r <= maxScan; r++) {
      var score = 0, filled = 0;
      for (var c = range.s.c; c <= range.e.c; c++) {
        var cell = ws[XLSX.utils.encode_cell({ r: r, c: c })];
        if (!cell || cell.v === undefined || cell.v === null || String(cell.v).trim() === "") continue;
        filled++;
        var normalized = String(cell.v).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        if (knownNames.has(normalized)) score += 3;
      }
      score += filled;
      if (filled >= 3 && score > bestScore) { bestScore = score; bestRow = r; }
    }
    return bestRow;
  }

  function resolveHeaderRow(wb, sheetName, recordType, configuredValue) {
    if (configuredValue === "auto" || configuredValue === undefined || configuredValue === null || configuredValue === "") {
      return findHeaderRow(wb, sheetName, recordType);
    }
    var n = parseInt(configuredValue, 10);
    return (isNaN(n) || n < 1) ? findHeaderRow(wb, sheetName, recordType) : n - 1;
  }

  /* ================================================================
     8. VALIDATION ENGINE
     ================================================================ */
  function fuzzyMatch(input, candidates) {
    var s = input.toLowerCase().replace(/[^a-z0-9]/g, "");
    var best = null, bestScore = 0;
    candidates.forEach(function (c) {
      var t = c.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (s === t) { best = c; bestScore = 999; return; }
      var score = 0;
      if (t.indexOf(s) !== -1 || s.indexOf(t) !== -1) score = 50;
      else {
        for (var i = 0; i < Math.min(s.length, t.length); i++) { if (s[i] === t[i]) score++; }
      }
      if (score > bestScore) { bestScore = score; best = c; }
    });
    return bestScore >= 3 ? best : null;
  }

  function validateWorkbook(wb) {
    var report = { sheets: [], errors: 0, warnings: 0, rowIssues: [] };
    var rulesMap = {};
    state.rules.sheetMap.forEach(function (sm) { if (sm.enabled) rulesMap[sm.sheetName] = sm; });

    var detectedSheets = wb.SheetNames;
    var matched = [];
    var unmatched = [];

    detectedSheets.forEach(function (sn) {
      if (rulesMap[sn]) {
        var rule = rulesMap[sn];
        var hr = resolveHeaderRow(wb, sn, rule.recordType, rule.headerRow);
        matched.push({ detected: sn, expected: sn, recordType: rule.recordType, status: "matched", headerRow: hr });
      } else {
        var guess = fuzzyMatch(sn, Object.keys(rulesMap));
        var gRule = guess ? rulesMap[guess] : null;
        var ghr = gRule ? resolveHeaderRow(wb, sn, gRule.recordType, gRule.headerRow) : 0;
        unmatched.push({ detected: sn, expected: guess, recordType: gRule ? gRule.recordType : null, status: guess ? "fuzzy" : "unknown", headerRow: ghr });
      }
    });

    Object.keys(rulesMap).forEach(function (expected) {
      if (!matched.find(function (m) { return m.expected === expected; }) && !unmatched.find(function (u) { return u.expected === expected; })) {
        report.sheets.push({ detected: null, expected: expected, recordType: rulesMap[expected].recordType, status: "missing", columns: [], colIssues: [], headerRow: 0 });
        report.errors++;
      }
    });

    matched.concat(unmatched.filter(function (u) { return u.expected; })).forEach(function (entry) {
      var cols = detectColumns(wb, entry.detected, entry.headerRow);
      var expectedColMap = state.rules.columnMap[entry.recordType] || {};
      var colIssues = [];
      Object.entries(expectedColMap).forEach(function (pair) {
        var field = pair[0], expectedCol = pair[1];
        if (!expectedCol) return;
        if (cols.indexOf(expectedCol) === -1) {
          var suggestion = fuzzyMatch(expectedCol, cols);
          colIssues.push({ field: field, expected: expectedCol, suggestion: suggestion, severity: suggestion ? "warning" : "error" });
          if (suggestion) report.warnings++; else report.errors++;
        }
      });
      report.sheets.push(Object.assign({}, entry, { columns: cols, colIssues: colIssues }));
    });

    unmatched.filter(function (u) { return !u.expected; }).forEach(function (entry) {
      var hr = findHeaderRow(wb, entry.detected, null);
      report.sheets.push(Object.assign({}, entry, { columns: detectColumns(wb, entry.detected, hr), colIssues: [], headerRow: hr }));
      report.warnings++;
    });

    return report;
  }

  function validateRows(rows, recordType) {
    var issues = [];
    rows.forEach(function (row, idx) {
      var msgs = [];
      if (!row.projectNo && !row.projectName) msgs.push("Missing project identifier");
      if (row.__amountIssue) msgs.push("Non-numeric amount: " + row.__amountIssue);
      if (row.date && isNaN(new Date(row.date).getTime())) msgs.push("Invalid date: " + row.date);
      if (msgs.length) issues.push({ row: idx + 2, messages: msgs });
    });
    return issues;
  }

  /* ================================================================
     9. MAPPING ENGINE
     ================================================================ */
  function isMilestoneField(field) { return field.indexOf("ms_") === 0 || field.indexOf("vms_") === 0 || field.indexOf("vsms_") === 0 || field.indexOf("scms_") === 0; }
  function isDateField(field) { return field === "date" || isMilestoneField(field); }

  function parseAmountValue(val) {
    if (val === undefined || val === null || val === "") return { value: null, issue: "" };
    if (typeof val === "number") return isFinite(val) ? { value: val, issue: "" } : { value: null, issue: String(val) };

    var raw = String(val).trim();
    if (!raw) return { value: null, issue: "" };
    if (/^(?:-|--|—|n\/a|na|null|nil)$/i.test(raw)) return { value: null, issue: "" };

    var normalized = raw
      .replace(/\(([^)]+)\)/g, "-$1")
      .replace(/\s+/g, "")
      .replace(/,/g, "")
      .replace(/\b(?:AED|USD|EUR|GBP|SAR|EGP|LYD)\b/gi, "")
      .replace(/[^0-9.\-]/g, "");

    if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") {
      return { value: null, issue: raw };
    }

    var parsed = Number(normalized);
    return isFinite(parsed) ? { value: parsed, issue: "" } : { value: null, issue: raw };
  }

  function parseDateValue(val) {
    if (!val) return "";
    var s = String(val).trim();
    if (s === "-" || s === "—" || s === "--") return "-";
    if (val instanceof Date) return isNaN(val.getTime()) ? "" : val.toISOString().slice(0, 10);
    var d = new Date(val);
    return isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
  }

  function hasMilestoneDate(row, field) {
    var v = safe(row[field]);
    return v !== "";
  }

  function getMilestonesForType(type) {
    if (type === "Contract") return CONTRACT_MILESTONES;
    if (type === "VO to Client") return VO_CLIENT_MILESTONES;
    if (type === "VO to Subcon") return VO_SUBCON_MILESTONES;
    if (type === "Subconsultant") return SCA_MILESTONES;
    return [];
  }

  function getMilestoneDoneCountForType(row, milestones) {
    var count = 0;
    milestones.forEach(function (ms) { if (hasMilestoneDate(row, ms.field)) count++; });
    return count;
  }

  function getNextPendingMilestoneForType(row, milestones) {
    for (var i = 0; i < milestones.length; i++) {
      if (!hasMilestoneDate(row, milestones[i].field)) return milestones[i];
    }
    return null;
  }

  function getMilestoneHeader(recordType, field) {
    var map = state.rules.columnMap[recordType] || {};
    return safe(map[field]);
  }

  function normalizeMilestoneLabel(label) {
    return safe(label).toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]/g, "");
  }

  function isPendingMilestoneValue(value) {
    return safe(value).toLowerCase() === "pending";
  }

  function findSheetName(wb, expectedName) {
    var expected = slug(expectedName);
    return (wb.SheetNames || []).find(function (name) { return slug(name) === expected; }) || "";
  }

  function extractMilestoneResponsibilities(wb) {
    var map = {};
    var sheetName = findSheetName(wb, "Milestone Mapping");
    if (!sheetName) return map;

    var rows = sheetToObjects(wb, sheetName, 0).map(function (row) {
      var normalized = {};
      Object.keys(row || {}).forEach(function (key) {
        normalized[headerKey(key)] = row[key];
      });
      return {
        pipeline: safe(normalized.pipeline),
        responsibility: safe(normalized.responsibility)
      };
    }).filter(function (row) {
      return row.pipeline || row.responsibility;
    });

    var sections = [
      { type: "Contract", milestones: CONTRACT_MILESTONES },
      { type: "VO to Client", milestones: VO_CLIENT_MILESTONES },
      { type: "VO to Subcon", milestones: VO_SUBCON_MILESTONES },
      { type: "Subconsultant", milestones: SCA_MILESTONES }
    ];

    var cursor = 0;
    sections.forEach(function (section) {
      map[section.type] = map[section.type] || {};
      section.milestones.forEach(function (ms) {
        var labelKey = normalizeMilestoneLabel(ms.label);
        var matchedIndex = -1;
        for (var i = cursor; i < rows.length; i++) {
          if (normalizeMilestoneLabel(rows[i].pipeline) === labelKey) {
            matchedIndex = i;
            break;
          }
        }
        if (matchedIndex === -1 && cursor < rows.length) matchedIndex = cursor;
        if (matchedIndex !== -1) {
          map[section.type][ms.field] = safe(rows[matchedIndex].responsibility) || "Unassigned";
          cursor = matchedIndex + 1;
        }
      });
    });

    return map;
  }

  function getMilestoneDepartment(recordType, field) {
    var mapped = state.data.milestoneResponsibilities &&
      state.data.milestoneResponsibilities[recordType] &&
      state.data.milestoneResponsibilities[recordType][field];
    if (safe(mapped)) return safe(mapped);
    var header = getMilestoneHeader(recordType, field);
    var match = header.match(/\(([^)]+)\)\s*$/);
    return safe(match ? match[1] : "") || "Unassigned";
  }

  function normalizeDepartmentLabel(label) {
    var v = safe(label).toLowerCase();
    if (!v) return "Unassigned";
    if (v === "pm" || v === "project manager") return "PM";
    if (v === "contracts" || v === "contract") return "Contracts";
    if (v === "finance") return "Finance";
    if (v === "technical") return "Technical";
    if (v === "procurement" || v === "procureme") return "Procurement";
    if (v === "finance/technical" || v === "finance / technical") return "Finance / Technical";
    return label;
  }

  function milestoneDisplayDate(row, field) {
    var v = safe(row[field]);
    if (v === "") return null;
    if (v === "-" || v === "—" || v === "--") return "Approved";
    return fmtDate(v);
  }

  function deriveContractStatus(row) {
    var total = CONTRACT_MILESTONES.length;
    var done = 0;
    CONTRACT_MILESTONES.forEach(function (ms) { if (hasMilestoneDate(row, ms.field)) done++; });
    var lastDone = hasMilestoneDate(row, "ms_signedContractCollected");
    if (lastDone) return "Signed";
    if (done === 0) return "Not Started";
    return "In Progress (" + done + "/" + total + ")";
  }

  function getLastCompletedMilestone(row) {
    var last = null;
    for (var i = 0; i < CONTRACT_MILESTONES.length; i++) {
      if (hasMilestoneDate(row, CONTRACT_MILESTONES[i].field)) last = CONTRACT_MILESTONES[i];
    }
    return last;
  }

  function getNextPendingMilestone(row) {
    for (var i = 0; i < CONTRACT_MILESTONES.length; i++) {
      if (!hasMilestoneDate(row, CONTRACT_MILESTONES[i].field)) return CONTRACT_MILESTONES[i];
    }
    return null;
  }

  function getMilestonesDoneCount(row) {
    var count = 0;
    CONTRACT_MILESTONES.forEach(function (ms) { if (hasMilestoneDate(row, ms.field)) count++; });
    return count;
  }

  function buildProjectStepperHtml(row, compact) {
    var total = CONTRACT_MILESTONES.length;
    var foundPending = false;
    var cls = compact ? "pipeline-stepper pipeline-stepper-compact" : "pipeline-stepper";
    var html = '<div class="' + cls + '">';
    for (var i = 0; i < total; i++) {
      var ms = CONTRACT_MILESTONES[i];
      var has = hasMilestoneDate(row, ms.field);
      var stepClass = "pipeline-step ";
      if (has) {
        stepClass += "done";
      } else if (!foundPending) {
        stepClass += "pending";
        foundPending = true;
      } else {
        stepClass += "future";
      }
      html += '<div class="' + stepClass + '">';
      var displayDate = milestoneDisplayDate(row, ms.field);
      html += '<div class="step-dot" title="' + escHtml(ms.label) + (has ? ": " + displayDate : ": Pending") + '"></div>';
      if (i < total - 1) html += '<div class="step-line"></div>';
      html += '<div class="step-label">' + escHtml(ms.label) + '</div>';
      if (has && displayDate) html += '<div class="step-date">' + escHtml(displayDate) + '</div>';
      html += '</div>';
    }
    html += '</div>';
    if (!compact) {
      var pending = getNextPendingMilestone(row);
      if (!pending) {
        html += '<div class="pipeline-waiting-label text-done"><small>&#10003; All milestones complete</small></div>';
      } else if (getMilestonesDoneCount(row) === 0) {
        html += '<div class="pipeline-waiting-label text-pending"><small>Not started</small></div>';
      } else {
        html += '<div class="pipeline-waiting-label text-pending"><small>Waiting: ' + escHtml(pending.label) + '</small></div>';
      }
    }
    return html;
  }

  function buildGenericStepperHtml(row, milestones, compact) {
    var total = milestones.length;
    var foundPending = false;
    var doneCount = 0;
    milestones.forEach(function (ms) { if (hasMilestoneDate(row, ms.field)) doneCount++; });
    var cls = compact ? "pipeline-stepper pipeline-stepper-compact" : "pipeline-stepper";
    var html = '<div class="' + cls + '">';
    var nextPending = null;
    for (var i = 0; i < total; i++) {
      var ms = milestones[i];
      var has = hasMilestoneDate(row, ms.field);
      var stepClass = "pipeline-step ";
      if (has) {
        stepClass += "done";
      } else if (!foundPending) {
        stepClass += "pending";
        foundPending = true;
        nextPending = ms;
      } else {
        stepClass += "future";
      }
      html += '<div class="' + stepClass + '">';
      var displayDate = milestoneDisplayDate(row, ms.field);
      html += '<div class="step-dot" title="' + escHtml(ms.label) + (has ? ": " + displayDate : ": Pending") + '"></div>';
      if (i < total - 1) html += '<div class="step-line"></div>';
      html += '<div class="step-label">' + escHtml(ms.label) + '</div>';
      if (has && displayDate) html += '<div class="step-date">' + escHtml(displayDate) + '</div>';
      html += '</div>';
    }
    html += '</div>';
    if (!compact) {
      if (doneCount === total) {
        html += '<div class="pipeline-waiting-label text-done"><small>&#10003; All steps complete</small></div>';
      } else if (doneCount === 0) {
        html += '<div class="pipeline-waiting-label text-pending"><small>Not started</small></div>';
      } else if (nextPending) {
        html += '<div class="pipeline-waiting-label text-pending"><small>Waiting: ' + escHtml(nextPending.label) + '</small></div>';
      }
    }
    return html;
  }

  function bottleneckColor(label, index) {
    var dept = normalizeDepartmentLabel(label);
    var key = slug(dept);
    if (key === "finance") return "#45c49c";
    if (key === "pm") return "#5a8dee";
    if (key === "contracts") return "#9aa9bd";
    if (key === "procurement") return "#f6ad55";
    if (key === "finance/technical" || key === "finance / technical") return "#7c6ff0";
    return ["#5a8dee", "#45c49c", "#9aa9bd", "#f6ad55", "#7c6ff0", "#5ec5e8"][index % 6];
  }

  function buildStyledBottleneckChart(containerId, title, subtitle, items) {
    var categories = items.map(function (item) { return item.label; });
    var values = items.map(function (item) { return item.value; });
    var colors = items.map(function (item, index) { return bottleneckColor(item.responsibility || item.label, index); });
    var html = '<div class="card"><div class="card-header">' +
      '<h6 class="card-title mb-0">' + escHtml(title) + '</h6>' +
      '<small class="text-muted">' + escHtml(subtitle) + '</small>' +
      '</div><div class="card-body"><div id="' + containerId + '" class="chart-container"></div></div></div>';
    setTimeout(function () {
      var el = document.getElementById(containerId);
      if (!el || !values.length) return;
      if (state.charts[containerId]) { try { state.charts[containerId].destroy(); } catch(e){} }
      state.charts[containerId] = new ApexCharts(el, {
        chart: { type: "bar", height: Math.max(260, categories.length * 52), toolbar: { show: false } },
        series: [{ name: "Pending", data: values }],
        colors: colors,
        plotOptions: {
          bar: {
            horizontal: true,
            borderRadius: 5,
            barHeight: "54%",
            distributed: true
          }
        },
        dataLabels: {
          enabled: true,
          formatter: function (val) { return fmtNumber(val); },
          style: { colors: ["#ffffff"], fontSize: "11px", fontWeight: 700 },
          offsetX: -8
        },
        xaxis: {
          categories: categories,
          labels: { style: { fontSize: "11px", colors: "#6c7a92" } },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: {
            maxWidth: 260,
            style: { fontSize: "12px", colors: "#50607a" }
          }
        },
        grid: {
          borderColor: "#e9edf4",
          strokeDashArray: 0,
          xaxis: { lines: { show: true } },
          yaxis: { lines: { show: true } },
          padding: { left: 8, right: 12 }
        },
        legend: { show: false },
        tooltip: {
          y: {
            formatter: function (val) {
              return fmtNumber(val) + " pending bottleneck" + (val === 1 ? "" : "s");
            }
          }
        }
      });
      state.charts[containerId].render();
    }, 60);
    return html;
  }

  function buildDepartmentBottleneckChart(containerId, rows) {
    var trackerMeta = [
      { type: "Contract", label: "Contracts", color: "#5a8dee" },
      { type: "VO to Client", label: "VO to Client", color: "#45c49c" },
      { type: "VO to Subcon", label: "VO to Subcon", color: "#f6ad55" },
      { type: "Subconsultant", label: "Subconsultants", color: "#9aa9bd" }
    ];
    var counts = {};
    rows.forEach(function (row) {
      var milestones = getMilestonesForType(row.type);
      if (!milestones.length) return;
      milestones.forEach(function (ms) {
        if (!isPendingMilestoneValue(row[ms.field])) return;
        var dept = normalizeDepartmentLabel(getMilestoneDepartment(row.type, ms.field));
        counts[dept] = counts[dept] || {};
        counts[dept][row.type] = (counts[dept][row.type] || 0) + 1;
      });
    });
    var ordered = Object.keys(counts).map(function (label) {
      var total = trackerMeta.reduce(function (sum, tracker) {
        return sum + (counts[label][tracker.type] || 0);
      }, 0);
      return { label: label, total: total };
    }).sort(function (a, b) { return b.total - a.total; });
    var categories = ordered.map(function (item) { return item.label; });
    var totals = ordered.map(function (item) { return item.total; });
    var series = trackerMeta.map(function (tracker) {
      return {
        name: tracker.label,
        data: ordered.map(function (item) { return counts[item.label][tracker.type] || 0; })
      };
    });
    var html = '<div class="card"><div class="card-header">' +
      '<h6 class="card-title mb-0">Pipeline Bottleneck</h6>' +
      '<small class="text-muted">Pending milestone counts by responsible entity across all trackers</small>' +
      '</div><div class="card-body"><div id="' + containerId + '" class="chart-container"></div></div></div>';
    setTimeout(function () {
      var el = document.getElementById(containerId);
      if (!el || !categories.length) return;
      if (state.charts[containerId]) { try { state.charts[containerId].destroy(); } catch(e){} }
      state.charts[containerId] = new ApexCharts(el, {
        chart: { type: "bar", stacked: true, height: Math.max(280, categories.length * 52), toolbar: { show: false } },
        series: series,
        colors: trackerMeta.map(function (tracker) { return tracker.color; }),
        plotOptions: {
          bar: {
            horizontal: true,
            borderRadius: 5,
            barHeight: "56%"
          }
        },
        dataLabels: {
          enabled: true,
          formatter: function (val) { return val > 0 ? fmtNumber(val) : ""; },
          style: { colors: ["#ffffff"], fontSize: "11px", fontWeight: 700 }
        },
        xaxis: {
          categories: categories,
          labels: { style: { fontSize: "11px", colors: "#6c7a92" } },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: {
            maxWidth: 260,
            style: { fontSize: "12px", colors: "#50607a" }
          }
        },
        grid: {
          borderColor: "#e9edf4",
          strokeDashArray: 0,
          xaxis: { lines: { show: true } },
          yaxis: { lines: { show: true } },
          padding: { left: 8, right: 28 }
        },
        legend: { show: false },
        tooltip: {
          shared: true,
          intersect: false,
          y: {
            formatter: function (val) {
              return fmtNumber(val) + " pending bottleneck" + (val === 1 ? "" : "s");
            }
          }
        },
        annotations: {
          points: categories.map(function (label, index) {
            return {
              x: totals[index],
              y: label,
              marker: { size: 0 },
              label: {
                text: String(fmtNumber(totals[index])),
                borderWidth: 0,
                offsetX: 18,
                style: {
                  background: "transparent",
                  color: "#50607a",
                  fontSize: "12px",
                  fontWeight: 700
                }
              }
            };
          })
        }
      });
      state.charts[containerId].render();
    }, 60);
    return html;
  }

  function buildMilestoneBottleneckChart(containerId, recordType, rows) {
    var milestones = getMilestonesForType(recordType);
    var items = milestones.map(function (ms) {
      var count = rows.reduce(function (sum, row) {
        return sum + (isPendingMilestoneValue(row[ms.field]) ? 1 : 0);
      }, 0);
      return {
        label: getMilestoneHeader(recordType, ms.field) || ms.label,
        value: count,
        responsibility: getMilestoneDepartment(recordType, ms.field)
      };
    });
    return buildStyledBottleneckChart(
      containerId,
      "Pipeline Bottleneck",
      "Pending milestone counts on this tracker",
      items
    );
  }

  function buildStatusProgressHtml(status) {
    var s = slug(status);
    var stages = [
      { label: "Submitted", keywords: ["submitted","sent","open","awaiting","pending","in progress","review","negotiation"] },
      { label: "Reviewed", keywords: ["review","in progress","negotiation","sent"] },
      { label: "Approved", keywords: ["approved","signed","contract signed","completed","closed","done","yes"] }
    ];
    var level = 0;
    if (stages[2].keywords.some(function (k) { return s.indexOf(k) !== -1; })) level = 3;
    else if (stages[1].keywords.some(function (k) { return s.indexOf(k) !== -1; })) level = 2;
    else if (stages[0].keywords.some(function (k) { return s.indexOf(k) !== -1; })) level = 1;

    var html = '<div class="status-progress">';
    for (var i = 0; i < 3; i++) {
      var dotClass = "sp-dot";
      if (i < level) dotClass += " done";
      else if (i === level && level > 0) dotClass += " active";
      html += '<div class="sp-step"><div class="' + dotClass + '" title="' + escHtml(stages[i].label) + '"></div>';
      if (i < 2) {
        var lineClass = "sp-line";
        if (i < level - 1) lineClass += " done";
        else if (i === level - 1 && level > 0) lineClass += " active";
        html += '<div class="' + lineClass + '"></div>';
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function mapSheetRows(rawRows, recordType) {
    var colMap = state.rules.columnMap[recordType] || {};
    return rawRows.map(function (raw) {
      var row = { type: recordType };
      var rawKeyMap = {};
      Object.keys(raw).forEach(function (key) { rawKeyMap[headerKey(key)] = raw[key]; });
      Object.entries(colMap).forEach(function (pair) {
        var field = pair[0], excelCol = pair[1];
        var val = excelCol ? (Object.prototype.hasOwnProperty.call(raw, excelCol) ? raw[excelCol] : rawKeyMap[headerKey(excelCol)]) : "";
        if (isDateField(field)) { val = parseDateValue(val); }
        row[field] = val !== undefined && val !== null ? val : "";
      });
      var amountMeta = parseAmountValue(row.amount);
      row.amount = amountMeta.value;
      if (amountMeta.issue) row.__amountIssue = amountMeta.issue;
      row.currency = safe(row.currency) || "AED";
      row.amountAED = convertToAED(row.amount, row.currency);
      row.year = safe(row.year);
      row.pm = normalizePM(row.pm);
      row.status = normalizeStatusValue(row.status, recordType);
      if ("invoiceStatus" in row) row.invoiceStatus = normalizeStatusValue(row.invoiceStatus, recordType);
      enrichPM(row);
      return row;
    }).filter(function (r) { return r.projectNo || r.projectName || r.amount; });
  }

  function loadMappedData(wb, sheetMapping) {
    var records = { contracts: [], voClient: [], voSubcon: [], sca: [] };
    var typeToKey = { "Contract": "contracts", "VO to Client": "voClient", "VO to Subcon": "voSubcon", "Subconsultant": "sca" };
    sheetMapping.forEach(function (entry) {
      if (!entry.recordType || !entry.detected) return;
      var key = typeToKey[entry.recordType];
      if (!key) return;
      var hr = (typeof entry.headerRow === "number") ? entry.headerRow : 0;
      var rawRows = sheetToObjects(wb, entry.detected, hr);
      records[key] = mapSheetRows(rawRows, entry.recordType);
    });
    applyPMCleanup(records);
    repairCachedStatuses(records);
    return records;
  }

  /* ================================================================
     10. UI COMPONENT BUILDERS
     ================================================================ */
  function buildKPIs(cards) {
    return '<div class="row kpi-grid mb-3">' + cards.map(function (c) {
      return '<div class="col"><div class="card"><div class="card-body">' +
        '<p class="text-muted small mb-1">' + escHtml(c.label) + '</p>' +
        '<h4 class="kpi-value mb-1">' + c.value + '</h4>' +
        (c.meta ? '<span class="kpi-meta">' + c.meta + '</span>' : '') +
        '</div></div></div>';
    }).join("") + '</div>';
  }

  function truncateLabel(label, maxLength) {
    label = safe(label);
    if (!maxLength || label.length <= maxLength) return label;
    return label.slice(0, Math.max(0, maxLength - 3)).trimEnd() + "...";
  }

  function buildBarList(title, subtitle, items, formatter, options) {
    formatter = formatter || fmtNumber;
    options = options || {};
    var labelMaxWidth = options.labelMaxWidth || 150;
    var labelMinWidth = options.labelMinWidth || 120;
    var labelWidth = options.labelWidth || 0;
    var labelMaxLength = options.labelMaxLength || 0;
    var bodyClass = options.scroll ? ' class="bar-list-scroll"' : '';
    var max = Math.max.apply(null, items.map(function (i) { return i.value; }).concat([1]));
    var body = items.length ? items.map(function (item) {
      var label = truncateLabel(item.label, labelMaxLength);
      var labelStyle = labelWidth ?
        'flex:0 0 ' + labelWidth + 'px;max-width:' + labelWidth + 'px' :
        'min-width:' + labelMinWidth + 'px;max-width:' + labelMaxWidth + 'px';
      return '<div class="d-flex align-items-center gap-2 mb-2">' +
        '<span class="text-truncate small" style="' + labelStyle + '" title="' + escHtml(item.label) + '">' + escHtml(label) + '</span>' +
        '<div class="flex-grow-1 stat-bar-track"><div class="stat-bar-fill" style="width:' + Math.max(4, (item.value / max) * 100) + '%"></div></div>' +
        '<span class="small fw-bold text-nowrap">' + formatter(item.value) + '</span></div>';
    }).join("") : '<p class="text-muted small">No data.</p>';
    return '<div class="card"><div class="card-header"><h6 class="card-title mb-0">' + escHtml(title) + '</h6><small class="text-muted">' + escHtml(subtitle) + '</small></div><div class="card-body"><div' + bodyClass + '>' + body + '</div></div></div>';
  }

  function buildDonutChart(containerId, title, subtitle, items, centerLabel) {
    centerLabel = centerLabel || "Records";
    var labels = items.map(function (i) { return i.label; });
    var series = items.map(function (i) { return i.value; });
    var html = '<div class="card"><div class="card-header"><h6 class="card-title mb-0">' + escHtml(title) + '</h6><small class="text-muted">' + escHtml(subtitle) + '</small></div><div class="card-body"><div id="' + containerId + '" class="chart-container"></div></div></div>';
    setTimeout(function () {
      var el = document.getElementById(containerId);
      if (!el || !series.length) return;
      if (state.charts[containerId]) { try { state.charts[containerId].destroy(); } catch(e){} }
      state.charts[containerId] = new ApexCharts(el, {
        chart: { type: "donut", height: 260 },
        series: series, labels: labels,
        legend: { position: "bottom" },
        dataLabels: { enabled: true, formatter: function(val) { return val.toFixed(1) + "%"; } },
        plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, label: centerLabel, formatter: function(w) { return fmtNumber(w.globals.seriesTotals.reduce(function(a,b){return a+b;},0)); } } } } } }
      });
      state.charts[containerId].render();
    }, 50);
    return html;
  }

  function buildTrendChart(containerId, title, subtitle, items) {
    var cats = items.map(function (i) { return i.label; });
    var vals = items.map(function (i) { return i.value; });
    var html = '<div class="card"><div class="card-header"><h6 class="card-title mb-0">' + escHtml(title) + '</h6><small class="text-muted">' + escHtml(subtitle) + '</small></div><div class="card-body"><div id="' + containerId + '" class="chart-container"></div></div></div>';
    setTimeout(function () {
      var el = document.getElementById(containerId);
      if (!el || !vals.length) return;
      if (state.charts[containerId]) { try { state.charts[containerId].destroy(); } catch(e){} }
      state.charts[containerId] = new ApexCharts(el, {
        chart: { type: "bar", height: 260, toolbar: { show: false } },
        series: [{ name: "AED Value", data: vals }],
        xaxis: { categories: cats },
        yaxis: { labels: { formatter: function (v) { return fmtNumber(v); } } },
        tooltip: { y: { formatter: function (v) { return fmtMoney(v); } } },
        colors: ["#3a57e8"],
        plotOptions: { bar: { borderRadius: 4 } }
      });
      state.charts[containerId].render();
    }, 50);
    return html;
  }

  function buildTable(rows, columns, tableId) {
    tableId = tableId || ("dt-" + Date.now());
    var html = '<div class="card"><div class="card-header d-flex justify-content-between align-items-center">' +
      '<div><h6 class="card-title mb-0">Detailed Records</h6><small class="text-muted">' + fmtNumber(rows.length) + ' rows</small></div></div>' +
      '<div class="card-body p-0"><div class="table-responsive table-scroll-body" data-scroll-body="' + tableId + '">' +
      '<table id="' + tableId + '" class="table table-striped mb-0"><thead><tr>' +
      columns.map(function (c) { return "<th>" + escHtml(c.label) + "</th>"; }).join("") +
      '</tr></thead><tbody>' +
      rows.map(function (row) {
        return "<tr>" + columns.map(function (c) { return "<td>" + c.render(row) + "</td>"; }).join("") + "</tr>";
      }).join("") +
      '</tbody></table></div></div></div>';
    setTimeout(function () {
      var tbl = document.getElementById(tableId);
      if (tbl && $.fn.DataTable && !$.fn.DataTable.isDataTable(tbl)) {
        $(tbl).DataTable({ pageLength: 25, order: [], language: { search: "Filter:" } });
      }
      initFloatingTableScroll(tableId);
    }, 80);
    return html;
  }

  var floatingTableScroll = {
    host: null,
    table: null,
    helper: null,
    inner: null,
    tableId: "",
    bound: false,
    syncing: false,
    resizeObserver: null
  };

  function ensureFloatingTableScroll() {
    if (floatingTableScroll.helper) return floatingTableScroll.helper;
    var helper = document.createElement("div");
    helper.id = "floatingTableScroll";
    helper.className = "floating-table-scroll d-none";
    helper.innerHTML = '<div class="floating-table-scroll-inner"></div>';
    document.body.appendChild(helper);
    floatingTableScroll.helper = helper;
    floatingTableScroll.inner = helper.firstElementChild;
    return helper;
  }

  function refreshFloatingTableScroll() {
    var host = floatingTableScroll.host;
    var helper = floatingTableScroll.helper || ensureFloatingTableScroll();
    var inner = floatingTableScroll.inner;
    if (!host || !document.body.contains(host) || !host.scrollWidth || host.scrollWidth <= host.clientWidth) {
      helper.classList.add("d-none");
      return;
    }
    var rect = host.getBoundingClientRect();
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    var visible = rect.top < viewportHeight && rect.bottom > 0;
    if (!visible) {
      helper.classList.add("d-none");
      return;
    }
    helper.style.left = Math.max(12, rect.left) + "px";
    helper.style.width = Math.max(120, rect.width) + "px";
    inner.style.width = host.scrollWidth + "px";
    helper.scrollLeft = host.scrollLeft;
    helper.classList.remove("d-none");
  }

  function initFloatingTableScroll(tableId) {
    var table = document.getElementById(tableId);
    var body = document.querySelector('[data-scroll-body="' + tableId + '"]');
    if (!table || !body) return;
    ensureFloatingTableScroll();
    floatingTableScroll.host = body;
    floatingTableScroll.table = table;
    floatingTableScroll.tableId = tableId;

    if (floatingTableScroll.resizeObserver) {
      try { floatingTableScroll.resizeObserver.disconnect(); } catch (e) {}
    }
    if (window.ResizeObserver) {
      floatingTableScroll.resizeObserver = new ResizeObserver(function () {
        refreshFloatingTableScroll();
      });
      floatingTableScroll.resizeObserver.observe(body);
      floatingTableScroll.resizeObserver.observe(table);
    }

    if (!floatingTableScroll.bound) {
      floatingTableScroll.helper.addEventListener("scroll", function () {
        if (floatingTableScroll.syncing || !floatingTableScroll.host) return;
        floatingTableScroll.syncing = true;
        floatingTableScroll.host.scrollLeft = floatingTableScroll.helper.scrollLeft;
        floatingTableScroll.syncing = false;
      });
      window.addEventListener("scroll", refreshFloatingTableScroll, { passive: true });
      window.addEventListener("resize", refreshFloatingTableScroll);
      floatingTableScroll.bound = true;
    }

    body.addEventListener("scroll", function () {
      if (floatingTableScroll.syncing || floatingTableScroll.host !== body) return;
      floatingTableScroll.syncing = true;
      floatingTableScroll.helper.scrollLeft = body.scrollLeft;
      floatingTableScroll.syncing = false;
    });
    body.addEventListener("mouseenter", refreshFloatingTableScroll);

    refreshFloatingTableScroll();
    setTimeout(refreshFloatingTableScroll, 250);
    setTimeout(refreshFloatingTableScroll, 800);
    setTimeout(refreshFloatingTableScroll, 1600);
  }

  function badgeHtml(status) {
    return '<span class="badge rounded-pill ' + badgeClass(status) + '">' + escHtml(safe(status) || "Unspecified") + '</span>';
  }

  function cellProject(row) {
    return '<strong>' + escHtml(safe(row.projectName) || "—") + '</strong><br><small class="text-muted">' + escHtml(safe(row.projectNo) || "No project no.") + '</small>';
  }

  function cellContractProject(row) {
    var html = '<strong>' + escHtml(safe(row.projectName) || "—") + '</strong>' +
      '<br><small class="text-muted">' + escHtml(safe(row.projectNo) || "No project no.") + '</small>';
    if (safe(row.client)) html += '<br><small class="text-muted">' + escHtml(row.client) + '</small>';
    return html;
  }

  /* ================================================================
     11. PAGE META
     ================================================================ */
  var PAGE_META = {
    overview:     { title: "Overview",             subtitle: "Portfolio-wide view across contracts, VO trackers, and subconsultants." },
    contracts:    { title: "Contracts",            subtitle: "Contract pipeline, value, geography, and status analysis." },
    voClient:     { title: "VO to Client",         subtitle: "Client-facing variation orders, statuses, and distribution." },
    voSubcon:     { title: "VO to Subconsultant",  subtitle: "Subconsultant variations, exposure, and team leader distribution." },
    sca:          { title: "Subconsultants",       subtitle: "Issued subconsultant appointments, vendors, and status." },
    rulesConfig:  { title: "Rules & Configuration", subtitle: "Manage status rules, FX rates, sheet mappings, PM lookup, and master dictionaries." }
  };

  function cellProjectVOClient(row) {
    var html = cellProject(row);
    if (safe(row.voNo)) html += '<br><small class="text-muted">' + escHtml(row.voNo) + '</small>';
    return html;
  }

  /* ================================================================
     12. PAGE RENDERERS
     ================================================================ */
  function renderOverview() {
    var rows = filterRows(allData());
    var contracts = rows.filter(function (r) { return r.type === "Contract"; });
    var voClient = rows.filter(function (r) { return r.type === "VO to Client"; });
    var voSubcon = rows.filter(function (r) { return r.type === "VO to Subcon"; });
    var sca = rows.filter(function (r) { return r.type === "Subconsultant"; });

    var kpis = buildKPIs([
      { label: "Total Contract Value", value: fmtMoneyShort(sumAED(contracts)), meta: fmtNumber(contracts.length) + " contracts" },
      { label: "Total VO to Client Value", value: fmtMoneyShort(sumAED(voClient)), meta: fmtNumber(voClient.length) + " variations" },
      { label: "Total VO to Subcon Value", value: fmtMoneyShort(sumAED(voSubcon)), meta: fmtNumber(voSubcon.length) + " variations" },
      { label: "Total Subconsultant Value", value: fmtMoneyShort(sumAED(sca)), meta: fmtNumber(sca.length) + " appointments" }
    ]);

    var html = kpis;
    html += '<div class="row mb-3"><div class="col-xl-3 col-md-6">' +
      buildDonutChart("ov-donut-contract-status", "Contracts", "Contracts by status", topCounts(contracts, contractStatusLabel, 7), "Rows") +
      '</div><div class="col-xl-3 col-md-6">' +
      buildDonutChart("ov-donut-voclient-status", "VO to Client", "Client VOs by status", topCounts(voClient, "status", 7), "Rows") +
      '</div><div class="col-xl-3 col-md-6">' +
      buildDonutChart("ov-donut-vosubcon-status", "VO to Subconsultant", "Subconsultant VOs by status", topCounts(voSubcon, "status", 7), "Rows") +
      '</div><div class="col-xl-3 col-md-6">' +
      buildDonutChart("ov-donut-sca-status", "Subconsultants", "Appointments by status", topCounts(sca, "status", 7), "Rows") +
      '</div></div>';
    html += '<div class="row mb-3"><div class="col-12">' +
      buildBarList("Top Projects by AED Value", "Largest by normalized value", topSums(rows, projectDisplayLabel, 20).filter(function(i){return i.label!=="Unspecified";}), fmtMoney, { scroll: true, labelWidth: 340, labelMaxLength: 48 }) +
      '</div></div>';

    if (contracts.length > 0) {
      html += '<div class="row mb-3"><div class="col-12">' +
        buildDepartmentBottleneckChart("ov-bottleneck", rows) +
        '</div></div>';
    }

    document.getElementById("page-overview").innerHTML = html;
  }

  function renderAllTrackers() {
    var rows = filterRows(allData()).sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
    var openCount = rows.filter(function(r){return /open|awaiting|review|in progress|pending|negotiation/i.test(safe(r.status));}).length;
    var closedCount = rows.filter(function(r){return /approved|signed|contract signed|completed|closed/i.test(safe(r.status));}).length;
    var html = buildKPIs([
      { label: "Visible Rows", value: fmtNumber(rows.length), meta: "Combined universe" },
      { label: "Visible AED Value", value: fmtMoney(sumAED(rows)), meta: "Normalized" },
      { label: "Open / Pending", value: fmtNumber(openCount), meta: "Status-based" },
      { label: "Completed / Signed", value: fmtNumber(closedCount), meta: "Status-based" }
    ]);
    var cols = [
      { label: "Tracker", render: function (r) { return '<span class="badge bg-soft-primary">' + escHtml(r.type) + '</span>'; } },
      { label: "Project", render: cellProject },
      { label: "PM", render: function (r) { return escHtml(safe(r.pm) || "—"); } },
      { label: "Status", render: function (r) { return badgeHtml(r.status); } },
      { label: "Currency", render: function (r) { return escHtml(safe(r.currency) || "AED") + '<br><small>' + (r.amount != null ? fmtNumber(r.amount) : "—") + '</small>'; } },
      { label: "Value (AED)", render: function (r) { return '<strong>' + fmtMoney(r.amountAED) + '</strong>'; } },
      { label: "Date", render: function (r) { return fmtDate(r.date); } },
      { label: "Notes", render: function (r) { return escHtml(safe(r.description || r.remarks || r.vendor || r.client || r.reference) || "—"); } }
    ];
    html += buildTable(rows, cols, "tbl-all");
    document.getElementById("page-allTrackers").innerHTML = html;
  }

  function milestoneProgressHtml(row) {
    var done = getMilestonesDoneCount(row);
    var total = CONTRACT_MILESTONES.length;
    var pending = getNextPendingMilestone(row);
    var stepper = buildProjectStepperHtml(row, true);
    var label = '';
    if (done === total) {
      label = '<span class="pipeline-waiting-label text-done"><small>&#10003; Complete</small></span>';
    } else if (done === 0) {
      label = '<span class="pipeline-waiting-label text-pending"><small>Not started</small></span>';
    } else {
      label = '<span class="pipeline-waiting-label text-pending"><small>Waiting: ' + escHtml(pending.label) + '</small></span>';
    }
    return '<div style="min-width:200px">' + stepper + label + ' <small class="text-muted">' + done + '/' + total + '</small></div>';
  }

  function renderContracts() {
    var rows = filterRows(state.data.records.contracts, "Contract").sort(function (a, b) { return (b.amountAED || 0) - (a.amountAED || 0); });
    var html = buildKPIs([
      { label: "Total No. of Contracts", value: fmtNumber(rows.length), meta: "" },
      { label: "Contract Value", value: fmtMoney(sumAED(rows)), meta: "AED normalized" },
      { label: "Signed", value: fmtNumber(rows.filter(function(r){return /^yes$/i.test(safe(r.status));}).length), meta: "" },
      { label: "Pending", value: fmtNumber(rows.filter(function(r){return /^no$/i.test(safe(r.status));}).length), meta: "" }
    ]);
    html += '<div class="row mb-3"><div class="col-md-6">' +
      buildDonutChart("c-donut-status", "Contract Status Split", "Pipeline statuses", topCounts(rows, "status", 7), "Rows") +
      '</div><div class="col-md-6">' +
      buildBarList("Top Locations", "By contract count", topCounts(rows, "location", 7)) +
      '</div></div>';
    html += '<div class="row mb-3"><div class="col-md-6">' +
      buildBarList("Top Contracts by AED", "Largest after normalization", topSums(rows, projectDisplayLabel, rows.length), fmtMoney, { scroll: true, labelWidth: 240, labelMaxLength: 36 }) +
      '</div><div class="col-md-6">' +
      buildBarList("Top PMs", "By contract count", topCounts(rows, "pm", rows.length), fmtNumber, { scroll: true, labelWidth: 220, labelMaxLength: 32 }) +
      '</div></div>';
    html += '<div class="row mb-3"><div class="col-12">' +
      buildMilestoneBottleneckChart("c-bottleneck", "Contract", rows) +
      '</div></div>';
    var cols = [
      { label: "Project", render: cellContractProject },
      { label: "PM", render: function (r) { return escHtml(safe(r.pm) || "—"); } },
      { label: "Status", render: function (r) { return badgeHtml(r.status); } },
      { label: "Milestones", render: milestoneProgressHtml },
      { label: "Original", render: function (r) { return r.amount != null ? escHtml(safe(r.currency)) + " " + fmtNumber(r.amount) : "—"; } },
      { label: "Value (AED)", render: function (r) { return '<strong>' + fmtMoney(r.amountAED) + '</strong>'; } },
      { label: "Date", render: function (r) { return fmtDate(r.date); } }
    ];
    html += buildTable(rows, cols, "tbl-contracts");
    document.getElementById("page-contracts").innerHTML = html;
  }

  function voClientMsDoneCount(row) {
    var c = 0;
    VO_CLIENT_MILESTONES.forEach(function (ms) { if (hasMilestoneDate(row, ms.field)) c++; });
    return c;
  }

  function renderVOClient() {
    var rows = filterRows(state.data.records.voClient, "VO to Client").sort(function (a, b) { return (b.amountAED || 0) - (a.amountAED || 0); });
    var total = VO_CLIENT_MILESTONES.length;
    var closed = rows.filter(function (r) { return /^closed$/i.test(safe(r.invoiceStatus).trim()); }).length;
    var openInvoiced = rows.filter(function (r) { return /^open invoiced$/i.test(safe(r.invoiceStatus).trim()); }).length;
    var openNotInvoiced = rows.filter(function (r) { return /^open not invoiced$/i.test(safe(r.invoiceStatus).trim()); }).length;

    var html = buildKPIs([
      { label: "Total No. of Vo's To Client", value: fmtNumber(rows.length), meta: "" },
      { label: "VO to Client Value", value: fmtMoney(sumAED(rows)), meta: "AED normalized" },
      { label: "Closed", value: fmtNumber(closed), meta: "" },
      { label: "Open Invoiced", value: fmtNumber(openInvoiced), meta: "" },
      { label: "Open Not Invoiced", value: fmtNumber(openNotInvoiced), meta: "" }
    ]);

    html += '<div class="row mb-3"><div class="col-md-6">' +
      buildDonutChart("vc-donut", "VO Status Split", "Status distribution", topCounts(rows, "status", 7), "Rows") +
      '</div><div class="col-md-6">' +
      buildBarList("Top Projects by VO Value", "Highest AED exposure", topSums(rows, projectDisplayLabel, 7), fmtMoney, { scroll: true, labelWidth: 220, labelMaxLength: 34 }) +
      '</div></div>';
    html += '<div class="row mb-3"><div class="col-12">' +
      buildMilestoneBottleneckChart("vc-bottleneck", "VO to Client", rows) +
      '</div></div>';
    var cols = [
      { label: "Project", render: cellProjectVOClient },
      { label: "PM", render: function (r) { return escHtml(safe(r.pm) || "—"); } },
      { label: "Description", render: function (r) { return escHtml(safe(r.description) || "—"); } },
      { label: "VO Status", render: function (r) { return badgeHtml(r.status); } },
      { label: "Invoice Status", render: function (r) { return badgeHtml(r.invoiceStatus); } },
      { label: "Milestones", render: function (r) {
        var d = voClientMsDoneCount(r);
        var stepper = buildGenericStepperHtml(r, VO_CLIENT_MILESTONES, true);
        var lbl = d === total ? '<span class="pipeline-waiting-label text-done"><small>&#10003; Complete</small></span>' :
                  d === 0 ? '<span class="pipeline-waiting-label text-pending"><small>Not started</small></span>' :
                  '<span class="pipeline-waiting-label text-pending"><small>' + d + '/' + total + '</small></span>';
        return '<div style="min-width:160px">' + stepper + lbl + '</div>';
      }},
      { label: "Original", render: function (r) { return r.amount != null ? escHtml(safe(r.currency)) + " " + fmtNumber(r.amount) : "—"; } },
      { label: "Value (AED)", render: function (r) { return '<strong>' + fmtMoney(r.amountAED) + '</strong>'; } },
      { label: "Date", render: function (r) { return fmtDate(r.date); } }
    ];
    html += buildTable(rows, cols, "tbl-voclient");
    document.getElementById("page-voClient").innerHTML = html;
  }

  function renderVOSubcon() {
    var rows = filterRows(state.data.records.voSubcon, "VO to Subcon").sort(function (a, b) { return (b.amountAED || 0) - (a.amountAED || 0); });
    var total = VO_SUBCON_MILESTONES.length;
    var html = buildKPIs([
      { label: "Total  No. of VO's To Subcon", value: fmtNumber(rows.length), meta: "" },
      { label: "VO to Subcon Value", value: fmtMoney(sumAED(rows)), meta: "AED normalized" },
      { label: "Open", value: fmtNumber(rows.filter(function(r){return /open/i.test(safe(r.status));}).length), meta: "" }
    ]);
    html += '<div class="row mb-3"><div class="col-md-6">' +
      buildDonutChart("vs-donut", "Open / Closed Split", "Status distribution", topCounts(rows, "status", 6), "Rows") +
      '</div><div class="col-md-6">' +
      buildBarList("Top Subconsultants", "Most frequent vendors", topCounts(rows, "vendor", 6)) +
      '</div></div>';
    html += '<div class="row mb-3"><div class="col-12">' +
      buildBarList("Top Projects by Value", "Largest subcontract variations", topSums(rows, projectDisplayLabel, 6), fmtMoney) +
      '</div></div>';
    html += '<div class="row mb-3"><div class="col-12">' +
      buildMilestoneBottleneckChart("vs-bottleneck", "VO to Subcon", rows) +
      '</div></div>';
    var cols = [
      { label: "Project", render: cellProject },
      { label: "Subconsultant", render: function (r) { return escHtml(safe(r.vendor) || "—"); } },
      { label: "Description", render: function (r) { return escHtml(safe(r.description) || "—"); } },
      { label: "Status", render: function (r) { return badgeHtml(r.status); } },
      { label: "Milestones", render: function (r) {
        var d = getMilestoneDoneCountForType(r, VO_SUBCON_MILESTONES);
        var stepper = buildGenericStepperHtml(r, VO_SUBCON_MILESTONES, true);
        var lbl = d === total ? '<span class="pipeline-waiting-label text-done"><small>&#10003; Complete</small></span>' :
                  d === 0 ? '<span class="pipeline-waiting-label text-pending"><small>Not started</small></span>' :
                  '<span class="pipeline-waiting-label text-pending"><small>' + d + '/' + total + '</small></span>';
        return '<div style="min-width:190px">' + stepper + lbl + '</div>';
      }},
      { label: "Value (AED)", render: function (r) { return '<strong>' + fmtMoney(r.amountAED) + '</strong>'; } },
      { label: "Date", render: function (r) { return fmtDate(r.date); } }
    ];
    html += buildTable(rows, cols, "tbl-vosubcon");
    document.getElementById("page-voSubcon").innerHTML = html;
  }

  function renderSCA() {
    var rows = filterRows(state.data.records.sca, "Subconsultant").sort(function (a, b) { return (b.amountAED || 0) - (a.amountAED || 0); });
    var total = SCA_MILESTONES.length;
    var html = buildKPIs([
      { label: "Total Count", value: fmtNumber(rows.length), meta: "" },
      { label: "Total Value", value: fmtMoney(sumAED(rows)), meta: "AED normalized" },
      { label: "Completed", value: fmtNumber(rows.filter(function(r){return /completed/i.test(safe(r.status));}).length), meta: "" }
    ]);
    html += '<div class="row mb-3"><div class="col-12">' +
      buildBarList("Top PMs by Count", "SCA records by PM", topCounts(rows, "pm", 7)) +
      '</div></div>';
    html += '<div class="row mb-3"><div class="col-12">' +
      buildMilestoneBottleneckChart("sca-bottleneck", "Subconsultant", rows) +
      '</div></div>';
    var cols = [
      { label: "Project", render: function (r) {
        var html = '<strong>' + escHtml(safe(r.projectName) || "—") + '</strong>';
        html += '<br><small class="text-muted">' + escHtml(safe(r.reference) || "—") + '</small>';
        return html;
      } },
      { label: "PM", render: function (r) { return escHtml(safe(r.pm) || "—"); } },
      { label: "Service", render: function (r) { return escHtml(safe(r.description) || "—"); } },
      { label: "Status", render: function (r) { return badgeHtml(r.status); } },
      { label: "Milestones", render: function (r) {
        var d = getMilestoneDoneCountForType(r, SCA_MILESTONES);
        var stepper = buildGenericStepperHtml(r, SCA_MILESTONES, true);
        var lbl = d === total ? '<span class="pipeline-waiting-label text-done"><small>&#10003; Complete</small></span>' :
                  d === 0 ? '<span class="pipeline-waiting-label text-pending"><small>Not started</small></span>' :
                  '<span class="pipeline-waiting-label text-pending"><small>' + d + '/' + total + '</small></span>';
        return '<div style="min-width:170px">' + stepper + lbl + '</div>';
      }},
      { label: "Original", render: function (r) { return r.amount != null ? escHtml(safe(r.currency)) + " " + fmtNumber(r.amount) : "—"; } },
      { label: "Value (AED)", render: function (r) { return '<strong>' + fmtMoney(r.amountAED) + '</strong>'; } },
      { label: "Date", render: function (r) { return fmtDate(r.date); } }
    ];
    html += buildTable(rows, cols, "tbl-sca");
    document.getElementById("page-sca").innerHTML = html;
  }

  /* ================================================================
     13. RULES & CONFIG PAGE
     ================================================================ */
  function renderRulesConfig() {
    var html = '<ul class="nav nav-tabs mb-3" id="rulesTab" role="tablist">' +
      tabHeader("statusRules", "Status Rules", true) +
      tabHeader("fxRates", "FX Rates") +
      tabHeader("sheetMapping", "Sheet Mapping") +
      tabHeader("columnMapping", "Column Mapping") +
      tabHeader("pmLookup", "PM Lookup") +
      tabHeader("masterDict", "Dictionaries") +
      tabHeader("importExport", "Import / Export") +
      '</ul><div class="tab-content" id="rulesTabContent">';

    // Tab 1: Status rules
    html += tabPane("statusRules", true, function () {
      var rows = state.rules.statusBadges.map(function (rule, idx) {
        return '<tr>' +
          '<td><input class="form-control form-control-sm" value="' + escHtml(rule.keywords.join(", ")) + '" data-rule-idx="' + idx + '" data-rule-field="keywords"></td>' +
          '<td><select class="form-select form-select-sm" data-rule-idx="' + idx + '" data-rule-field="category">' +
            ["good","warn","danger","purple","muted"].map(function(c){ return '<option value="'+c+'"'+(c===rule.category?' selected':'')+'>'+c+'</option>'; }).join("") +
          '</select></td>' +
          '<td><span class="badge rounded-pill badge-' + rule.category + '">Sample</span></td>' +
          '<td><div class="form-check form-switch"><input class="form-check-input" type="checkbox" ' + (rule.enabled ? "checked" : "") + ' data-rule-idx="' + idx + '" data-rule-field="enabled"></div></td>' +
          '<td><button class="btn btn-sm btn-outline-danger" data-rule-delete="' + idx + '">Del</button></td></tr>';
      }).join("");
      return '<table class="table table-sm rules-table"><thead><tr><th>Keywords (comma-separated)</th><th>Category</th><th>Preview</th><th>Enabled</th><th></th></tr></thead><tbody>' +
        rows + '</tbody></table>' +
        '<button class="btn btn-sm btn-outline-primary mt-2" id="addStatusRuleBtn">+ Add Rule</button>';
    });

    // Tab 2: FX Rates
    html += tabPane("fxRates", false, function () {
      var rows = Object.entries(state.rules.fxRates).map(function (e) {
        return '<tr><td>' + escHtml(e[0]) + '</td><td><input class="form-control form-control-sm" type="number" step="any" value="' + e[1] + '" data-fx-currency="' + escHtml(e[0]) + '"></td></tr>';
      }).join("");
      return '<p class="text-muted small">Each rate is multiplied by the original amount to get AED value.</p>' +
        '<table class="table table-sm rules-table"><thead><tr><th>Currency</th><th>Rate to AED</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="d-flex gap-2 mt-2"><input class="form-control form-control-sm" style="max-width:100px" placeholder="Code" id="newFxCode"><input class="form-control form-control-sm" style="max-width:120px" type="number" step="any" placeholder="Rate" id="newFxRate"><button class="btn btn-sm btn-outline-primary" id="addFxBtn">Add</button></div>';
    });

    // Tab 3: Sheet mapping
    html += tabPane("sheetMapping", false, function () {
      var rows = state.rules.sheetMap.map(function (sm, idx) {
        var hrVal = sm.headerRow !== undefined ? sm.headerRow : "auto";
        return '<tr><td><input class="form-control form-control-sm" value="' + escHtml(sm.sheetName) + '" data-sm-idx="' + idx + '" data-sm-field="sheetName"></td>' +
          '<td><select class="form-select form-select-sm" data-sm-idx="' + idx + '" data-sm-field="recordType">' +
            ["Contract","VO to Client","VO to Subcon","Subconsultant"].map(function(t){ return '<option'+(t===sm.recordType?' selected':'')+'>'+t+'</option>'; }).join("") +
          '</select></td>' +
          '<td><input class="form-control form-control-sm" style="max-width:80px" value="' + escHtml(String(hrVal)) + '" data-sm-idx="' + idx + '" data-sm-field="headerRow" title="&quot;auto&quot; or 1-based row number"></td>' +
          '<td><div class="form-check form-switch"><input class="form-check-input" type="checkbox" ' + (sm.enabled ? "checked" : "") + ' data-sm-idx="' + idx + '" data-sm-field="enabled"></div></td>' +
          '<td><button class="btn btn-sm btn-outline-danger" data-sm-delete="' + idx + '">Del</button></td></tr>';
      }).join("");
      return '<p class="text-muted small">Header Row: type <code>auto</code> to detect automatically, or a 1-based row number (e.g. <code>3</code> if headers are on row 3).</p>' +
        '<table class="table table-sm rules-table"><thead><tr><th>Sheet Name</th><th>Record Type</th><th>Header Row</th><th>Enabled</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<button class="btn btn-sm btn-outline-primary mt-2" id="addSheetMapBtn">+ Add Mapping</button>';
    });

    // Tab 4: Column mapping
    html += tabPane("columnMapping", false, function () {
      var dh = state.rules.detectedHeaders || {};
      var hasAnyHeaders = Object.values(dh).some(function (arr) { return arr && arr.length > 0; });
      var intro = '';
      if (!hasAnyHeaders) {
        intro += '<div class="alert alert-warning d-flex align-items-center gap-3 mb-3">' +
          '<div><strong>No Excel headers detected yet.</strong> Click the button to scan an Excel file and populate the dropdowns with real column headers.</div>' +
          '<button class="btn btn-sm btn-primary text-nowrap" id="redetectHeadersBtn">Detect Headers from Excel</button></div>';
      } else {
        intro += '<p class="text-muted small">Map each internal field to the Excel column header for each tracker type.</p>';
        intro += '<button class="btn btn-sm btn-outline-info mb-3" id="redetectHeadersBtn">Re-detect Headers from Workbook</button>';
      }

      var sections = Object.entries(state.rules.columnMap).map(function (entry) {
        var type = entry[0], map = entry[1];
        var headers = (dh[type] && dh[type].length) ? dh[type] : [];
        var headerBadges = '';
        if (headers.length) {
          headerBadges = '<div class="detected-headers-list mb-2"><small class="text-muted fw-bold">Detected columns (' + headers.length + '):</small> ' +
            headers.map(function (h) { return '<span class="badge bg-soft-secondary detected-header-badge">' + escHtml(h) + '</span>'; }).join(" ") + '</div>';
        }

        // Build the list of dropdown options: detected headers + any currently mapped values not in the list
        var allOptions = headers.slice();
        Object.values(map).forEach(function (v) {
          if (v && allOptions.indexOf(v) === -1) allOptions.push(v);
        });

        var rows = Object.entries(map).map(function (pair) {
          var field = pair[0], currentVal = pair[1];
          var options = '<option value="">— Not Mapped —</option>';
          var matched = false;
          allOptions.forEach(function (h) {
            var sel = (h === currentVal) ? ' selected' : '';
            if (h === currentVal) matched = true;
            var inDetected = headers.indexOf(h) !== -1;
            var label = escHtml(h) + (!inDetected && headers.length ? ' (manual)' : '');
            options += '<option value="' + escHtml(h) + '"' + sel + '>' + label + '</option>';
          });
          if (currentVal && !matched) {
            options += '<option value="' + escHtml(currentVal) + '" selected>' + escHtml(currentVal) + ' (manual)</option>';
          }
          var cell = '<select class="form-select form-select-sm" data-cm-type="' + escHtml(type) + '" data-cm-field="' + escHtml(field) + '">' + options + '</select>';
          return '<tr><td><code>' + escHtml(field) + '</code></td><td>' + cell + '</td></tr>';
        }).join("");
        return '<h6 class="mt-3">' + escHtml(type) + ' <small class="text-muted fw-normal">(' + (headers.length ? headers.length + ' headers detected' : 'click Detect Headers above') + ')</small></h6>' +
          headerBadges +
          '<table class="table table-sm rules-table"><thead><tr><th>Field</th><th>Excel Column Name</th></tr></thead><tbody>' + rows + '</tbody></table>';
      }).join("");
      return intro + sections;
    });

    // Tab 5: PM Lookup
    html += tabPane("pmLookup", false, function () {
      var entries = Object.entries(state.rules.pmLookup);
      var rows = entries.map(function (e) {
        return '<tr><td><input class="form-control form-control-sm" value="' + escHtml(e[0]) + '" data-pm-old="' + escHtml(e[0]) + '" data-pm-field="key"></td>' +
          '<td><input class="form-control form-control-sm" value="' + escHtml(e[1]) + '" data-pm-old="' + escHtml(e[0]) + '" data-pm-field="value"></td>' +
          '<td><button class="btn btn-sm btn-outline-danger" data-pm-delete="' + escHtml(e[0]) + '">Del</button></td></tr>';
      }).join("");
      return '<p class="text-muted small">Project number to PM enrichment. If a row has no PM, it is filled from this lookup.</p>' +
        '<table class="table table-sm rules-table"><thead><tr><th>Project No.</th><th>Project Manager</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="d-flex gap-2 mt-2"><input class="form-control form-control-sm" style="max-width:150px" placeholder="Project No" id="newPmKey"><input class="form-control form-control-sm" style="max-width:200px" placeholder="PM Name" id="newPmVal"><button class="btn btn-sm btn-outline-primary" id="addPmBtn">Add</button></div>';
    });

    // Tab 6: Master dictionaries
    html += tabPane("masterDict", false, function () {
      var d = state.rules.masterDictionaries;
      function listEditor(label, key) {
        return '<div class="mb-3"><h6>' + label + '</h6><div class="d-flex flex-wrap gap-1 mb-1" id="dict-' + key + '">' +
          (d[key] || []).map(function (v, i) {
            return '<span class="badge bg-soft-secondary">' + escHtml(v) + ' <button class="btn-close btn-close-sm" data-dict-key="' + key + '" data-dict-idx="' + i + '" style="font-size:.5rem"></button></span>';
          }).join("") +
          '</div><div class="d-flex gap-2"><input class="form-control form-control-sm" style="max-width:200px" placeholder="New value" id="newDict-' + key + '"><button class="btn btn-sm btn-outline-primary" data-dict-add="' + key + '">Add</button></div></div>';
      }
      return listEditor("Currencies", "currencies") +
        listEditor("Contract Statuses", "contractStatuses") +
        listEditor("VO Statuses", "voStatuses") +
        listEditor("SCA Statuses", "scaStatuses") +
        listEditor("Sources", "sources") +
        listEditor("Priorities", "priorities");
    });

    // Tab 7: Import/Export
    html += tabPane("importExport", false, function () {
      return '<div class="row g-3"><div class="col-md-4"><div class="card"><div class="card-body text-center">' +
        '<h6>Export Rules</h6><p class="text-muted small">Download all current rules as a JSON file.</p>' +
        '<button class="btn btn-primary btn-sm" id="exportRulesBtn">Download JSON</button></div></div></div>' +
        '<div class="col-md-4"><div class="card"><div class="card-body text-center">' +
        '<h6>Import Rules</h6><p class="text-muted small">Upload a previously exported JSON file.</p>' +
        '<input type="file" accept=".json" id="importRulesInput" class="form-control form-control-sm"></div></div></div>' +
        '<div class="col-md-4"><div class="card"><div class="card-body text-center">' +
        '<h6>Reset to Defaults</h6><p class="text-muted small">Restore all rules to factory defaults.</p>' +
        '<button class="btn btn-outline-danger btn-sm" id="resetRulesBtn">Reset</button></div></div></div></div>' +
        '<div class="row g-3 mt-1"><div class="col-md-6"><div class="card"><div class="card-body text-center">' +
        '<h6>Export Dashboard Data</h6><p class="text-muted small">Download current loaded data as JSON.</p>' +
        '<button class="btn btn-outline-primary btn-sm" id="exportDataBtn">Download Data JSON</button></div></div></div>' +
        '<div class="col-md-6"><div class="card"><div class="card-body text-center">' +
        '<h6>Clear Cached Data</h6><p class="text-muted small">Remove stored data from localStorage.</p>' +
        '<button class="btn btn-outline-danger btn-sm" id="clearDataBtn">Clear</button></div></div></div></div>';
    });

    html += '</div>';
    document.getElementById("page-rulesConfig").innerHTML = html;
    bindRulesEvents();
  }

  function tabHeader(id, label, active) {
    return '<li class="nav-item" role="presentation"><button class="nav-link' + (active ? " active" : "") + '" id="tab-' + id + '" data-bs-toggle="tab" data-bs-target="#pane-' + id + '" type="button">' + label + '</button></li>';
  }
  function tabPane(id, active, contentFn) {
    return '<div class="tab-pane fade' + (active ? " show active" : "") + '" id="pane-' + id + '" role="tabpanel">' + contentFn() + '</div>';
  }

  /* ================================================================
     14. RULES EVENT BINDINGS
     ================================================================ */
  function bindRulesEvents() {
    var container = document.getElementById("page-rulesConfig");

    // Status rules — inline edit
    container.querySelectorAll("[data-rule-field]").forEach(function (el) {
      el.addEventListener("change", function () {
        var idx = Number(el.dataset.ruleIdx);
        var field = el.dataset.ruleField;
        if (field === "keywords") state.rules.statusBadges[idx].keywords = el.value.split(",").map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
        else if (field === "category") state.rules.statusBadges[idx].category = el.value;
        else if (field === "enabled") state.rules.statusBadges[idx].enabled = el.checked;
        saveRules();
      });
    });
    container.querySelectorAll("[data-rule-delete]").forEach(function (el) {
      el.addEventListener("click", function () { state.rules.statusBadges.splice(Number(el.dataset.ruleDelete), 1); saveRules(); renderRulesConfig(); });
    });
    var addBtn = document.getElementById("addStatusRuleBtn");
    if (addBtn) addBtn.addEventListener("click", function () {
      state.rules.statusBadges.push({ keywords: ["new"], category: "muted", enabled: true }); saveRules(); renderRulesConfig();
    });

    // FX rates
    container.querySelectorAll("[data-fx-currency]").forEach(function (el) {
      el.addEventListener("change", function () { state.rules.fxRates[el.dataset.fxCurrency] = Number(el.value) || 0; saveRules(); });
    });
    var addFxBtn = document.getElementById("addFxBtn");
    if (addFxBtn) addFxBtn.addEventListener("click", function () {
      var code = document.getElementById("newFxCode").value.trim().toUpperCase();
      var rate = Number(document.getElementById("newFxRate").value);
      if (code && rate) { state.rules.fxRates[code] = rate; saveRules(); renderRulesConfig(); }
    });

    // Sheet mapping
    container.querySelectorAll("[data-sm-field]").forEach(function (el) {
      el.addEventListener("change", function () {
        var idx = Number(el.dataset.smIdx), field = el.dataset.smField;
        if (field === "enabled") state.rules.sheetMap[idx].enabled = el.checked;
        else if (field === "headerRow") {
          var v = el.value.trim().toLowerCase();
          state.rules.sheetMap[idx].headerRow = (v === "auto" || v === "") ? "auto" : (parseInt(v, 10) || "auto");
        }
        else state.rules.sheetMap[idx][field] = el.value;
        saveRules();
      });
    });
    container.querySelectorAll("[data-sm-delete]").forEach(function (el) {
      el.addEventListener("click", function () { state.rules.sheetMap.splice(Number(el.dataset.smDelete), 1); saveRules(); renderRulesConfig(); });
    });
    var addSmBtn = document.getElementById("addSheetMapBtn");
    if (addSmBtn) addSmBtn.addEventListener("click", function () {
      state.rules.sheetMap.push({ sheetName: "New_Sheet", recordType: "Contract", enabled: true, headerRow: "auto" }); saveRules(); renderRulesConfig();
    });

    // Column mapping (supports both <select> and <input> fallback)
    container.querySelectorAll("[data-cm-type]").forEach(function (el) {
      el.addEventListener("change", function () {
        state.rules.columnMap[el.dataset.cmType][el.dataset.cmField] = el.value;
        saveRules();
      });
    });

    // Re-detect headers button
    var redetectBtn = document.getElementById("redetectHeadersBtn");
    if (redetectBtn) redetectBtn.addEventListener("click", function () {
      if (uploadState.workbook && uploadState.sheetMapping && uploadState.sheetMapping.length) {
        captureDetectedHeaders(uploadState.workbook, uploadState.sheetMapping);
        autoMatchColumnMap();
        saveRules();
        renderRulesConfig();
        showToast("Headers re-detected and mappings updated.", "success");
      } else {
        var fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".xlsx,.xls,.csv";
        fileInput.addEventListener("change", function () {
          if (!fileInput.files[0]) return;
          parseExcelFile(fileInput.files[0], function (err, wb) {
            if (err) { showToast("Failed to parse: " + err.message, "danger"); return; }
            var mapping = [];
            state.rules.sheetMap.forEach(function (sm) {
              if (!sm.enabled) return;
              var detected = wb.SheetNames.find(function (sn) { return sn === sm.sheetName; }) ||
                             wb.SheetNames.find(function (sn) { return fuzzyMatch(sn, [sm.sheetName]); });
              if (detected) {
                var hr = resolveHeaderRow(wb, detected, sm.recordType, sm.headerRow);
                mapping.push({ detected: detected, recordType: sm.recordType, headerRow: hr });
              }
            });
            captureDetectedHeaders(wb, mapping);
            autoMatchColumnMap();
            saveRules();
            renderRulesConfig();
            showToast("Headers detected from " + fileInput.files[0].name + " and mappings updated.", "success");
          });
        });
        fileInput.click();
      }
    });

    // PM lookup
    container.querySelectorAll("[data-pm-field]").forEach(function (el) {
      el.addEventListener("change", function () {
        var oldKey = el.dataset.pmOld;
        if (el.dataset.pmField === "key") {
          var val = state.rules.pmLookup[oldKey];
          delete state.rules.pmLookup[oldKey];
          state.rules.pmLookup[el.value] = val;
        } else {
          state.rules.pmLookup[oldKey] = el.value;
        }
        saveRules();
      });
    });
    container.querySelectorAll("[data-pm-delete]").forEach(function (el) {
      el.addEventListener("click", function () { delete state.rules.pmLookup[el.dataset.pmDelete]; saveRules(); renderRulesConfig(); });
    });
    var addPmBtn = document.getElementById("addPmBtn");
    if (addPmBtn) addPmBtn.addEventListener("click", function () {
      var k = document.getElementById("newPmKey").value.trim();
      var v = document.getElementById("newPmVal").value.trim();
      if (k) { state.rules.pmLookup[k] = v; saveRules(); renderRulesConfig(); }
    });

    // Dictionaries
    container.querySelectorAll("[data-dict-key]").forEach(function (el) {
      el.addEventListener("click", function () {
        var key = el.dataset.dictKey, idx = Number(el.dataset.dictIdx);
        state.rules.masterDictionaries[key].splice(idx, 1); saveRules(); renderRulesConfig();
      });
    });
    container.querySelectorAll("[data-dict-add]").forEach(function (el) {
      el.addEventListener("click", function () {
        var key = el.dataset.dictAdd;
        var input = document.getElementById("newDict-" + key);
        var val = input.value.trim();
        if (val) { state.rules.masterDictionaries[key].push(val); saveRules(); renderRulesConfig(); }
      });
    });

    // Import/Export
    var exportBtn = document.getElementById("exportRulesBtn");
    if (exportBtn) exportBtn.addEventListener("click", exportRulesJSON);
    var importInput = document.getElementById("importRulesInput");
    if (importInput) importInput.addEventListener("change", function () { if (importInput.files[0]) importRulesJSON(importInput.files[0]); });
    var resetBtn = document.getElementById("resetRulesBtn");
    if (resetBtn) resetBtn.addEventListener("click", function () { if (confirm("Reset all rules to defaults?")) resetRules(); });
    var exportDataBtn = document.getElementById("exportDataBtn");
    if (exportDataBtn) exportDataBtn.addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
      downloadBlob(blob, "dashboard_data.json");
    });
    var clearDataBtn = document.getElementById("clearDataBtn");
    if (clearDataBtn) clearDataBtn.addEventListener("click", function () {
      if (confirm("Clear all cached data?")) { localStorage.removeItem(STORAGE_DATA); state.data = { sourceFile:"No file loaded", importedAt:"—", milestoneResponsibilities:{}, records:{contracts:[],voClient:[],voSubcon:[],sca:[]} }; renderAll(); showToast("Data cleared.", "info"); }
    });
  }

  /* ================================================================
     15. UPLOAD WIZARD
     ================================================================ */
  var uploadStep = 1;

  function resetUpload() {
    uploadStep = 1;
    uploadState = { workbook: null, file: null, sheetMapping: [], validationReport: null };
    document.getElementById("uploadStep1").classList.remove("d-none");
    document.getElementById("uploadStep2").classList.add("d-none");
    document.getElementById("uploadStep3").classList.add("d-none");
    document.getElementById("selectedFileInfo").classList.add("d-none");
    document.getElementById("excelFileInput").value = "";
    updateUploadStepUI();
  }

  function updateUploadStepUI() {
    var b1 = document.getElementById("uploadStep1Badge");
    var b2 = document.getElementById("uploadStep2Badge");
    var b3 = document.getElementById("uploadStep3Badge");
    b1.className = "badge " + (uploadStep === 1 ? "bg-primary" : "bg-success");
    b2.className = "badge " + (uploadStep === 2 ? "bg-primary" : uploadStep > 2 ? "bg-success" : "bg-secondary");
    b3.className = "badge " + (uploadStep === 3 ? "bg-primary" : "bg-secondary");
    document.getElementById("uploadBackBtn").classList.toggle("d-none", uploadStep === 1);
    var nextBtn = document.getElementById("uploadNextBtn");
    nextBtn.textContent = uploadStep === 3 ? "Load Data" : "Next";
    nextBtn.disabled = (uploadStep === 1 && !uploadState.file);
  }

  function handleFileSelected(file) {
    if (!file) return;
    uploadState.file = file;
    document.getElementById("selectedFileName").textContent = file.name;
    document.getElementById("selectedFileSize").textContent = "(" + (file.size / 1024).toFixed(1) + " KB)";
    document.getElementById("selectedFileInfo").classList.remove("d-none");
    document.getElementById("uploadNextBtn").disabled = false;
  }

  function goUploadStep2() {
    uploadStep = 2;
    document.getElementById("uploadStep1").classList.add("d-none");
    document.getElementById("uploadStep2").classList.remove("d-none");
    document.getElementById("uploadStep3").classList.add("d-none");
    updateUploadStepUI();

    document.getElementById("uploadNextBtn").disabled = true;
    parseExcelFile(uploadState.file, function (err, wb) {
      if (err) { showToast("Failed to parse Excel: " + err.message, "danger"); return; }
      uploadState.workbook = wb;
      var report = validateWorkbook(wb);
      uploadState.validationReport = report;

      var tbody = document.getElementById("sheetMappingTable").querySelector("tbody");
      uploadState.sheetMapping = [];
      var rulesMap = {};
      state.rules.sheetMap.forEach(function (sm) { rulesMap[sm.sheetName] = sm; });

      tbody.innerHTML = report.sheets.map(function (s, idx) {
        var hr = (typeof s.headerRow === "number") ? s.headerRow : 0;
        uploadState.sheetMapping.push({ detected: s.detected, recordType: s.recordType, status: s.status, headerRow: hr });
        var statusBadge = s.status === "matched" ? '<span class="badge bg-success">Matched</span>' :
                          s.status === "fuzzy" ? '<span class="badge bg-warning">Fuzzy Match</span>' :
                          s.status === "missing" ? '<span class="badge bg-danger">Missing</span>' :
                          '<span class="badge bg-secondary">Unrecognized</span>';
        var typeOptions = '<option value="">— Skip —</option>' + ["Contract","VO to Client","VO to Subcon","Subconsultant"].map(function (t) {
          return '<option value="' + t + '"' + (t === s.recordType ? ' selected' : '') + '>' + t + '</option>';
        }).join("");
        return '<tr><td>' + escHtml(s.detected || "(not found: " + s.expected + ")") + '</td>' +
          '<td><small>' + (s.columns ? s.columns.length + " columns" : "—") + '</small></td>' +
          '<td><select class="form-select form-select-sm" data-sheet-idx="' + idx + '">' + typeOptions + '</select></td>' +
          '<td><input type="number" class="form-control form-control-sm" style="max-width:70px" min="1" value="' + (hr + 1) + '" data-hr-idx="' + idx + '" title="1-based row number"></td>' +
          '<td>' + statusBadge + '</td></tr>';
      }).join("");

      tbody.querySelectorAll("[data-sheet-idx]").forEach(function (sel) {
        sel.addEventListener("change", function () { uploadState.sheetMapping[Number(sel.dataset.sheetIdx)].recordType = sel.value; });
      });
      tbody.querySelectorAll("[data-hr-idx]").forEach(function (inp) {
        inp.addEventListener("change", function () {
          var row1Based = parseInt(inp.value, 10);
          if (!isNaN(row1Based) && row1Based >= 1) {
            uploadState.sheetMapping[Number(inp.dataset.hrIdx)].headerRow = row1Based - 1;
          }
        });
      });

      document.getElementById("uploadNextBtn").disabled = false;
    });
  }

  function goUploadStep3() {
    uploadStep = 3;
    document.getElementById("uploadStep2").classList.add("d-none");
    document.getElementById("uploadStep3").classList.remove("d-none");
    updateUploadStepUI();

    captureDetectedHeaders(uploadState.workbook, uploadState.sheetMapping);
    autoMatchColumnMap();
    saveRules();
    renderMappingPreview();

    var report = uploadState.validationReport;
    var totalErrors = report.errors;
    var totalWarnings = report.warnings;

    // Row-level validation
    var rowIssues = [];
    uploadState.sheetMapping.forEach(function (entry) {
      if (!entry.recordType || !entry.detected) return;
      var hr = (typeof entry.headerRow === "number") ? entry.headerRow : 0;
      var rawRows = sheetToObjects(uploadState.workbook, entry.detected, hr);
      var mapped = mapSheetRows(rawRows, entry.recordType);
      var issues = validateRows(mapped, entry.recordType);
      if (issues.length) rowIssues.push({ sheet: entry.detected, type: entry.recordType, issues: issues });
      totalWarnings += issues.length;
    });

    var summaryClass = totalErrors > 0 ? "alert-danger" : totalWarnings > 0 ? "alert-warning" : "alert-success";
    var summaryMsg = totalErrors > 0 ? totalErrors + " error(s) and " + totalWarnings + " warning(s) found." :
                     totalWarnings > 0 ? "No errors, but " + totalWarnings + " warning(s)." : "All checks passed.";
    document.getElementById("validationSummary").innerHTML = '<div class="alert ' + summaryClass + '">' + summaryMsg + '</div>';

    var accordion = document.getElementById("validationAccordion");
    var accHtml = "";
    report.sheets.forEach(function (s, i) {
      var items = "";
      s.colIssues.forEach(function (ci) {
        items += '<div class="p-2 mb-1 rounded validation-item ' + ci.severity + '"><strong>' + escHtml(ci.field) + '</strong>: expected column "' + escHtml(ci.expected) + '"' +
          (ci.suggestion ? ' — suggested match: <strong>"' + escHtml(ci.suggestion) + '"</strong>' : ' — <span class="text-danger">not found</span>') + '</div>';
      });
      if (!items && s.status !== "missing") items = '<div class="p-2 mb-1 rounded validation-item ok">All columns matched.</div>';
      if (s.status === "missing") items = '<div class="p-2 mb-1 rounded validation-item error">Sheet not found in workbook.</div>';
      accHtml += '<div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#vacc-' + i + '">' +
        escHtml(s.detected || s.expected) + ' → ' + escHtml(s.recordType || "unmapped") +
        '</button></h2><div id="vacc-' + i + '" class="accordion-collapse collapse"><div class="accordion-body">' + items + '</div></div></div>';
    });
    rowIssues.forEach(function (ri, i) {
      var items = ri.issues.slice(0, 50).map(function (issue) {
        return '<div class="p-2 mb-1 rounded validation-item warning">Row ' + issue.row + ': ' + issue.messages.join("; ") + '</div>';
      }).join("");
      if (ri.issues.length > 50) items += '<div class="p-2 text-muted small">...and ' + (ri.issues.length - 50) + ' more</div>';
      accHtml += '<div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#rvacc-' + i + '">Row issues: ' +
        escHtml(ri.sheet) + ' (' + ri.issues.length + ')</button></h2><div id="rvacc-' + i + '" class="accordion-collapse collapse"><div class="accordion-body">' + items + '</div></div></div>';
    });
    accordion.innerHTML = accHtml;

    document.getElementById("uploadNextBtn").disabled = false;
    document.getElementById("uploadNextBtn").textContent = totalErrors > 0 ? "Load Anyway" : "Load Data";
  }

  function mappingPreviewFields(recordType) {
    var common = ["projectNo", "projectName", "pm", "status", "year", "currency", "amount"];
    if (recordType === "Contract") return common.concat(["client", "description"]);
    if (recordType === "VO to Client") return common.concat(["description", "invoiceStatus"]);
    if (recordType === "VO to Subcon") return common.concat(["description", "vsms_issuanceRequest", "vsms_review", "vsms_approval", "vsms_submitClientSig", "vsms_payment"]);
    if (recordType === "Subconsultant") return common.concat(["description", "scms_initialRequest", "scms_collectQuotes", "scms_evaluateQuotes", "scms_recommendation", "scms_commercialReview", "scms_collectSignedQuotation", "scms_submitToDrShams", "scms_generatePo"]);
    return common;
  }

  function fieldDisplayName(field) {
    var names = {
      projectNo: "Project No.", projectName: "Project Name", pm: "Project Manager",
      status: "Status", year: "Year", currency: "Currency", amount: "Amount", client: "Client",
      source: "Source", description: "Description / Service", voNo: "VO No.",
      invoiceStatus: "Invoice Status", vendor: "Vendor / Subconsultant",
      vsms_issuanceRequest: "Issuance Request", vsms_review: "Review", vsms_approval: "Approval",
      vsms_submitClientSig: "Submit for Client Sig.", vsms_payment: "Payment",
      scms_initialRequest: "Initial Request", scms_collectQuotes: "Collect 3 Quotations",
      scms_evaluateQuotes: "Evaluate Quotations", scms_recommendation: "Recommendation",
      scms_commercialReview: "Commercial Review", scms_collectSignedQuotation: "Collect Signed Quotation",
      scms_submitToDrShams: "Submit to Dr. Shams", scms_generatePo: "Generate PO"
    };
    return names[field] || field;
  }

  function renderMappingPreview() {
    var wrap = document.getElementById("mappingPreview");
    var entries = uploadState.sheetMapping.filter(function (entry) { return entry.recordType && entry.detected; });
    if (!entries.length) {
      wrap.innerHTML = '<div class="alert alert-warning mb-0">No mapped tracker sheets are available for column preview.</div>';
      return;
    }
    var html = '<div class="card"><div class="card-header"><h6 class="mb-0">Column Mapping Preview</h6><small class="text-muted">Review key field mappings before loading the workbook.</small></div><div class="card-body">';
    entries.forEach(function (entry, idx) {
      var headers = state.rules.detectedHeaders[entry.recordType] || [];
      var map = state.rules.columnMap[entry.recordType] || {};
      html += '<div class="mb-3"><div class="d-flex justify-content-between align-items-center mb-2">' +
        '<strong>' + escHtml(entry.recordType) + '</strong><small class="text-muted">' + escHtml(entry.detected) + '</small></div>' +
        '<div class="table-responsive"><table class="table table-sm table-bordered align-middle mb-0"><thead><tr><th style="width:34%">Dashboard Field</th><th>Excel Column</th></tr></thead><tbody>';
      mappingPreviewFields(entry.recordType).forEach(function (field) {
        var selected = map[field] || "";
        var opts = '<option value=""' + (!selected ? ' selected' : '') + '>— Not mapped —</option>' + headers.map(function (h) {
          return '<option value="' + escHtml(h) + '"' + (h === selected ? ' selected' : '') + '>' + escHtml(h) + '</option>';
        }).join("");
        html += '<tr><td>' + escHtml(fieldDisplayName(field)) + '</td><td><select class="form-select form-select-sm" data-preview-type="' + escHtml(entry.recordType) + '" data-preview-field="' + escHtml(field) + '">' + opts + '</select></td></tr>';
      });
      html += '</tbody></table></div></div>';
    });
    html += '</div></div>';
    wrap.innerHTML = html;
    wrap.querySelectorAll("[data-preview-type]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        state.rules.columnMap[sel.dataset.previewType][sel.dataset.previewField] = sel.value;
        saveRules();
      });
    });
  }

  function captureDetectedHeaders(wb, sheetMapping) {
    sheetMapping.forEach(function (entry) {
      if (!entry.recordType || !entry.detected) return;
      var hr = (typeof entry.headerRow === "number") ? entry.headerRow : 0;
      var cols = detectColumns(wb, entry.detected, hr);
      if (cols.length) {
        state.rules.detectedHeaders[entry.recordType] = cols;
      }
    });
  }

  function findHeaderMatch(headers, name) {
    if (!name) return "";
    if (headers.indexOf(name) !== -1) return name;
    var wanted = headerKey(name);
    return headers.find(function (h) { return headerKey(h) === wanted; }) || "";
  }

  function autoMatchColumnMap() {
    var dh = state.rules.detectedHeaders;
    var cm = state.rules.columnMap;
    var preferred = {
      pm: ["Project Manager", "Design Manager", "PM"],
      projectNo: ["Project No", "Project Number"],
      description: ["Description", "ITEM(S) / SERVICE SUPPLIED", "Nature of the Project"],
      status: ["VO Status", "Status", "Payment (Finance)", "Payment", "Signed Contract/ LOA"]
    };
    Object.keys(cm).forEach(function (type) {
      var headers = dh[type];
      if (!headers || !headers.length) return;
      var map = cm[type];
      Object.keys(map).forEach(function (field) {
        var current = map[field];
        var currentMatch = findHeaderMatch(headers, current);
        if (currentMatch) {
          map[field] = currentMatch;
          return;
        }
        var pref = preferred[field] || [];
        var preferredMatch = "";
        pref.some(function (h) {
          preferredMatch = findHeaderMatch(headers, h);
          return !!preferredMatch;
        });
        if (preferredMatch) {
          map[field] = preferredMatch;
          return;
        }
        if (!current) {
          var fieldLabel = field.replace(/^(ms_|vms_)/, "").replace(/([A-Z])/g, " $1").trim();
          var suggestion = fuzzyMatch(fieldLabel, headers);
          if (suggestion) map[field] = suggestion;
        } else {
          var suggestion = fuzzyMatch(current, headers);
          if (suggestion) map[field] = suggestion;
        }
      });
    });
  }

  function finalizeUpload() {
    captureDetectedHeaders(uploadState.workbook, uploadState.sheetMapping);
    saveRules();

    var records = loadMappedData(uploadState.workbook, uploadState.sheetMapping);
    state.data = {
      sourceFile: uploadState.file.name,
      importedAt: new Date().toISOString().slice(0, 10),
      milestoneResponsibilities: extractMilestoneResponsibilities(uploadState.workbook),
      records: records
    };
    saveData();
    var modal = bootstrap.Modal.getInstance(document.getElementById("uploadModal"));
    if (modal) modal.hide();
    resetUpload();
    renderAll();
    showToast("Data loaded: " + fmtNumber(allData().length) + " records from " + state.data.sourceFile, "success");
  }

  /* ================================================================
     16. FILTER INIT & BINDING
     ================================================================ */
  function normalizeMultiFilterValue(value) {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null || value === "" || value === "All") return [FILTER_ALL];
    return [safe(value)];
  }
  function migrateFilterState() {
    state.filters.type = normalizeMultiFilterValue(state.filters.type);
    state.filters.pm = normalizeMultiFilterValue(state.filters.pm);
    state.filters.status = Array.isArray(state.filters.status) ? state.filters.status : [STATUS_FILTER_ALL];
    state.filters.invoiceStatus = normalizeMultiFilterValue(state.filters.invoiceStatus);
    state.filters.years = normalizeMultiFilterValue(state.filters.years || state.filters.yearFrom);
    state.filters.projectNo = normalizeMultiFilterValue(state.filters.projectNo);
    state.filters.projectName = normalizeMultiFilterValue(state.filters.projectName);
    delete state.filters.yearFrom;
    delete state.filters.yearTo;
  }
  function initFilters() {
    migrateFilterState();
    var all = allData();
    var pageScope = state.page === "contracts" ? "Contract" :
                    state.page === "voClient" ? "VO to Client" :
                    state.page === "voSubcon" ? "VO to Subcon" :
                    state.page === "sca" ? "Subconsultant" : null;
    var rowsForType = filterRowsWithExclusions(all, pageScope, ["type"], true);
    var rowsForPM = filterRowsWithExclusions(all, pageScope, ["pm"], true);
    var rowsForStatus = filterRowsWithExclusions(all, pageScope, ["status"], true);
    var rowsForInvoiceStatus = filterRowsWithExclusions(all, pageScope, ["invoiceStatus"], true);
    var rowsForYear = filterRowsWithExclusions(all, pageScope, ["years"], true);
    var rowsForProjectNo = filterRowsWithExclusions(all, pageScope, ["projectNo"], true);
    var rowsForProjectName = filterRowsWithExclusions(all, pageScope, ["projectName"], true);
    var pmOpts = uniq(rowsForPM.map(function(r){return normalizePM(r.pm);}));
    var yearOpts = uniq(rowsForYear.map(function(r){return safe(r.year);}));
    var projectNoOpts = uniq(rowsForProjectNo.map(function(r){return safe(r.projectNo) || "Blank";}));
    var projectNameOpts = uniq(rowsForProjectName.map(function(r){return safe(r.projectName) || "Blank";}));
    var overviewStatuses = state.page === "overview";
    var statusOpts = buildStatusFilterOptions(rowsForStatus, overviewStatuses);
    var invoiceStatusOpts = uniq(rowsForInvoiceStatus.filter(function (r) { return r.type === "VO to Client"; }).map(function (r) { return safe(r.invoiceStatus); }));
    var typeOpts = uniq(rowsForType.map(function (r) { return safe(r.type); })).filter(function (type) {
      return ["Contract", "VO to Client", "VO to Subcon", "Subconsultant"].indexOf(type) !== -1;
    }).sort(function (a, b) { return trackerSortOrder(a) - trackerSortOrder(b); });
    var statusControl = document.getElementById("filterStatusWrap");
    var statusBlock = statusControl ? statusControl.closest(".col-md-2") : null;
    var invoiceStatusBlock = document.getElementById("filterInvoiceStatusBlock");
    if (statusBlock) statusBlock.classList.remove("d-none");
    if (invoiceStatusBlock) invoiceStatusBlock.classList.toggle("d-none", state.page !== "voClient");
    ["type", "pm", "years", "projectNo", "projectName"].forEach(function (key) {
      var options = key === "type" ? typeOpts : key === "pm" ? pmOpts : key === "years" ? yearOpts : key === "projectNo" ? projectNoOpts : projectNameOpts;
      state.filters[key] = state.filters[key].filter(function (value) {
        return value === FILTER_ALL || options.indexOf(value) !== -1;
      });
    });
    state.filters.status = state.filters.status.filter(function (status) {
      return status === STATUS_FILTER_ALL || statusOpts.some(function (option) { return option.key === status; });
    });
    state.filters.invoiceStatus = state.filters.invoiceStatus.filter(function (status) {
      return status === FILTER_ALL || invoiceStatusOpts.indexOf(status) !== -1;
    });
    if (state.page !== "voClient") state.filters.invoiceStatus = [FILTER_ALL];

    renderExcelFilter({ key:"type", toggleId:"filterTypeToggle", menuId:"filterTypeMenu", options:typeOpts, allLabel:"All trackers", singularLabel:"Tracker", pluralLabel:"trackers", searchPlaceholder:"Search trackers" });
    renderExcelFilter({ key:"pm", toggleId:"filterPMToggle", menuId:"filterPMMenu", options:pmOpts, allLabel:"All PMs", singularLabel:"PM", pluralLabel:"PMs", searchPlaceholder:"Search PMs" });
    renderStatusFilter(statusOpts);
    if (state.page === "voClient") {
      renderExcelFilter({ key:"invoiceStatus", toggleId:"filterInvoiceStatusToggle", menuId:"filterInvoiceStatusMenu", options:invoiceStatusOpts, allLabel:"All invoice statuses", singularLabel:"Invoice Status", pluralLabel:"invoice statuses", searchPlaceholder:"Search invoice statuses" });
    }
    renderExcelFilter({ key:"years", toggleId:"filterYearToggle", menuId:"filterYearMenu", options:yearOpts, allLabel:"All years", singularLabel:"Year", pluralLabel:"years", searchPlaceholder:"Search years" });
    renderExcelFilter({ key:"projectNo", toggleId:"filterProjectNoToggle", menuId:"filterProjectNoMenu", options:projectNoOpts, allLabel:"All project nos.", singularLabel:"Project No.", pluralLabel:"project nos.", searchPlaceholder:"Type project no." });
    renderExcelFilter({ key:"projectName", toggleId:"filterProjectNameToggle", menuId:"filterProjectNameMenu", options:projectNameOpts, allLabel:"All project names", singularLabel:"Project Name", pluralLabel:"project names", searchPlaceholder:"Type project name" });
    renderFilterSummaryChips({ type:typeOpts, pm:pmOpts, status:statusOpts, invoiceStatus:invoiceStatusOpts, years:yearOpts, projectNo:projectNoOpts, projectName:projectNameOpts });
  }

  function fillSelect(id, options, selected) {
    var el = document.getElementById(id);
    el.innerHTML = options.map(function (o) { return '<option value="' + escHtml(o) + '"' + (o === selected ? ' selected' : '') + '>' + escHtml(o) + '</option>'; }).join("");
  }

  /* ================================================================
     17. RENDER ALL
     ================================================================ */
  function renderAll() {
    // Destroy existing charts and DataTables
    Object.keys(state.charts).forEach(function (k) { try { state.charts[k].destroy(); } catch(e){} });
    state.charts = {};
    if ($.fn.DataTable) {
      $(".page-section table").each(function () {
        if ($.fn.DataTable.isDataTable(this)) { $(this).DataTable().destroy(); }
      });
    }

    // Navigation
    document.querySelectorAll("#sidebar-menu .nav-link[data-page]").forEach(function (a) {
      a.classList.toggle("active", a.dataset.page === state.page);
    });
    document.querySelectorAll(".page-section").forEach(function (p) { p.classList.remove("active"); });
    var activePage = document.getElementById("page-" + state.page);
    if (activePage) activePage.classList.add("active");

    // Page title
    var meta = PAGE_META[state.page] || {};
    document.getElementById("pageTitle").textContent = meta.title || "";
    document.getElementById("pageSubtitle").textContent = meta.subtitle || "";

    // Hide filters on rules page
    document.getElementById("filtersCard").classList.toggle("d-none", state.page === "rulesConfig");

    // Init filters before any filtered counts or page renders
    initFilters();

    // Record counter
    var count = filterRows(allData()).length;
    document.getElementById("recordCounterBadge").textContent = fmtNumber(count) + " records";

    // Footer
    document.getElementById("footerSourceFile").textContent = state.data.sourceFile;
    document.getElementById("footerImportedAt").textContent = state.data.importedAt;

    // FX pills
    document.getElementById("sidebarFxPills").innerHTML = Object.entries(state.rules.fxRates).map(function (e) {
      return '<span class="badge bg-soft-info fx-pill">' + e[0] + ' = ' + (e[0] === "AED" ? "1" : Number(e[1]).toFixed(4)) + '</span>';
    }).join("");

    // Render active page
    if (state.page === "allTrackers") state.page = "overview";
    switch (state.page) {
      case "overview": renderOverview(); break;
      case "contracts": renderContracts(); break;
      case "voClient": renderVOClient(); break;
      case "voSubcon": renderVOSubcon(); break;
      case "sca": renderSCA(); break;
      case "rulesConfig": renderRulesConfig(); break;
    }
  }

  /* ================================================================
     18. CSV EXPORT
     ================================================================ */
  function exportCSV() {
    var typeMap = { overview: null, contracts: "Contract", voClient: "VO to Client", voSubcon: "VO to Subcon", sca: "Subconsultant", rulesConfig: null };
    var source = state.page === "contracts" ? state.data.records.contracts :
                 state.page === "voClient" ? state.data.records.voClient :
                 state.page === "voSubcon" ? state.data.records.voSubcon :
                 state.page === "sca" ? state.data.records.sca : allData();
    var rows = filterRows(source, typeMap[state.page]);
    if (!rows.length) { showToast("No rows to export.", "warning"); return; }
    var headers = RECORD_FIELDS;
    var csv = [headers.join(",")].concat(rows.map(function (row) {
      return headers.map(function (h) { return '"' + String(row[h] ?? "").replace(/"/g, '""') + '"'; }).join(",");
    })).join("\n");
    var stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "dashboard_" + state.page + "_current_view_" + stamp + ".csv");
    showToast("Exported " + fmtNumber(rows.length) + " rows from the current view.", "success");
  }

  /* ================================================================
     19. EVENT BINDING (main)
     ================================================================ */
  function bindEvents() {
    // Navigation
    document.querySelectorAll("#sidebar-menu .nav-link[data-page]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        state.page = a.dataset.page;
        renderAll();
      });
    });

    // Reset filters
    document.getElementById("resetFiltersBtn").addEventListener("click", function () {
      state.filters = { type:[FILTER_ALL], pm:[FILTER_ALL], status:[STATUS_FILTER_ALL], invoiceStatus:[FILTER_ALL], years:[FILTER_ALL], projectNo:[FILTER_ALL], projectName:[FILTER_ALL] };
      renderAll();
    });

    [
      { toggle:"filterTypeToggle", menu:"filterTypeMenu" },
      { toggle:"filterPMToggle", menu:"filterPMMenu" },
      { toggle:"filterStatusToggle", menu:"filterStatusMenu" },
      { toggle:"filterInvoiceStatusToggle", menu:"filterInvoiceStatusMenu" },
      { toggle:"filterYearToggle", menu:"filterYearMenu" },
      { toggle:"filterProjectNoToggle", menu:"filterProjectNoMenu" },
      { toggle:"filterProjectNameToggle", menu:"filterProjectNameMenu" }
    ].forEach(function (entry) {
      var toggle = document.getElementById(entry.toggle);
      var menu = document.getElementById(entry.menu);
      if (!toggle || !menu) return;
      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll(".status-filter-menu").forEach(function (otherMenu) {
          if (otherMenu !== menu) otherMenu.classList.add("d-none");
        });
        menu.classList.toggle("d-none");
        if (!menu.classList.contains("d-none")) {
          var search = menu.querySelector(".excel-filter-search input");
          if (search) setTimeout(function () { search.focus(); search.select(); }, 0);
        }
      });
      menu.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    });
    document.addEventListener("click", function () {
      document.querySelectorAll(".status-filter-menu").forEach(function (menu) {
        menu.classList.add("d-none");
      });
    });

    // Export CSV
    document.getElementById("exportCsvBtn").addEventListener("click", exportCSV);

    // Theme toggle
    var themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("change", function (e) {
        applyTheme(e.target.checked ? "dark" : "light");
      });
    }

    // Upload modal
    var dropZone = document.getElementById("dropZone");
    var fileInput = document.getElementById("excelFileInput");
    document.getElementById("browseFileBtn").addEventListener("click", function () { fileInput.click(); });
    dropZone.addEventListener("click", function () { fileInput.click(); });
    fileInput.addEventListener("change", function () { if (fileInput.files[0]) handleFileSelected(fileInput.files[0]); });
    dropZone.addEventListener("dragover", function (e) { e.preventDefault(); dropZone.classList.add("drag-over"); });
    dropZone.addEventListener("dragleave", function () { dropZone.classList.remove("drag-over"); });
    dropZone.addEventListener("drop", function (e) {
      e.preventDefault(); dropZone.classList.remove("drag-over");
      if (e.dataTransfer.files[0]) { handleFileSelected(e.dataTransfer.files[0]); }
    });
    document.getElementById("clearFileBtn").addEventListener("click", function () {
      uploadState.file = null; fileInput.value = "";
      document.getElementById("selectedFileInfo").classList.add("d-none");
      document.getElementById("uploadNextBtn").disabled = true;
    });
    document.getElementById("uploadNextBtn").addEventListener("click", function () {
      if (uploadStep === 1) goUploadStep2();
      else if (uploadStep === 2) goUploadStep3();
      else if (uploadStep === 3) finalizeUpload();
    });
    document.getElementById("uploadBackBtn").addEventListener("click", function () {
      if (uploadStep === 2) { uploadStep = 1; document.getElementById("uploadStep2").classList.add("d-none"); document.getElementById("uploadStep1").classList.remove("d-none"); }
      else if (uploadStep === 3) { uploadStep = 2; document.getElementById("uploadStep3").classList.add("d-none"); document.getElementById("uploadStep2").classList.remove("d-none"); }
      updateUploadStepUI();
    });
    document.getElementById("uploadModal").addEventListener("hidden.bs.modal", resetUpload);
  }

  /* ================================================================
     20. AUTO-LOAD BUNDLED DATA
     ================================================================ */
  var BUNDLED_DATA_URL = "../data/contracts-data.xlsx";

  function autoLoadBundledData() {
    fetch(BUNDLED_DATA_URL, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status + " fetching " + BUNDLED_DATA_URL);
        return res.arrayBuffer();
      })
      .then(function (buffer) {
        var wb = XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: true });

        // Build the sheet mapping the same way the upload wizard does:
        // validateWorkbook resolves the matched sheet name (.detected) and a
        // numeric header row for each sheet (loadMappedData requires both).
        var report = validateWorkbook(wb);
        var sheetMapping = report.sheets.map(function (s) {
          var hr = (typeof s.headerRow === "number") ? s.headerRow : 0;
          return { detected: s.detected, recordType: s.recordType, status: s.status, headerRow: hr };
        });

        // Mirror the wizard's column-mapping refinement before loading.
        captureDetectedHeaders(wb, sheetMapping);
        autoMatchColumnMap();
        saveRules();

        var records = loadMappedData(wb, sheetMapping);
        var total = records.contracts.length + records.voClient.length + records.voSubcon.length + records.sca.length;
        if (total === 0) {
          showToast("Auto-load: file fetched but 0 records found. Sheet names may not match.", "warning");
          console.warn("Auto-load: workbook sheets =", wb.SheetNames, "| expected mapping =", state.rules.sheetMap.map(function(s){return s.sheetName;}));
          return;
        }
        state.data = {
          sourceFile: "contracts-data.xlsx",
          importedAt: new Date().toISOString().slice(0, 10),
          milestoneResponsibilities: extractMilestoneResponsibilities(wb),
          records: records
        };
        saveData();
        renderAll();
        showToast("Data loaded: " + total + " records from contracts-data.xlsx", "success");
      })
      .catch(function (err) {
        showToast("Auto-load failed: " + err.message, "danger");
        console.error("Auto-load error:", err);
      });
  }

  /* ================================================================
     21. INIT
     ================================================================ */
  function init() {
    loadTheme();
    loadRules();
    loadData();
    bindEvents();
    renderAll();
    autoLoadBundledData();
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); }
  else { init(); }

})();
