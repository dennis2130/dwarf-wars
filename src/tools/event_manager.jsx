import { useState, useEffect, useCallback } from "react";
import EventViewer from "./EventViewer";

const SUPABASE_URL = "https://mswtikjdftgyykcvxqhg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zd3Rpa2pkZnRneXlrY3Z4cWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NzE1OTYsImV4cCI6MjA4NTQ0NzU5Nn0.dC2Rdfptw_Ocd8VG4B73lCjrQ5854t3u4jy1CpxjuF0";

const headers = {
  "Content-Type": "application/json",
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

const EVENT_TYPES = ["combat", "check", "heal", "money", "price", "flavor", "c3_encounter", "c3_check"];

const TYPE_META = {
  combat:  { color: "#c0392b", glyph: "⚔️",  label: "Combat" },
  check:   { color: "#2980b9", glyph: "🎯",  label: "Skill Check" },
  heal:    { color: "#27ae60", glyph: "💚",  label: "Heal" },
  money:   { color: "#f1c40f", glyph: "💰",  label: "Money" },
  price:   { color: "#f39c12", glyph: "📈",  label: "Price Shift" },
  flavor:  { color: "#8e44ad", glyph: "🌙",  label: "Flavor" },
  c3_encounter: { color: "#3498db", glyph: "🤝", label: "C3 Encounter" },
  c3_check:     { color: "#9b59b6", glyph: "🤝", label: "C3 Skill Check" },
};

const C3_CATEGORIES = ["gold", "gems", "health", "inventory"];
const CHECK_STATS = ["combat", "wisdom", "intelligence", "charisma", "dexterity", "constitution", "stealth"];

const ITEMS = ["rations", "ale", "potions", "tools", "scrolls", "gems"];

const EMPTY_OUTCOMES = {
  fail:         { text: "", effect: {} },
  success:      { text: "", effect: {} },
  crit_fail:    { text: "", effect: {} },
  crit_success: { text: "", effect: {} },
};

const OUTCOME_META = {
  crit_success: { label: "Crit Success (Nat 20) 🎉", color: "#27ae60" },
  success:      { label: "Success ✅",                color: "#2ecc71" },
  fail:         { label: "Fail ❌",                   color: "#e67e22" },
  crit_fail:    { label: "Crit Fail (Nat 1) 💀",      color: "#c0392b" },
};

const EMPTY_EVENT = {
  slug: "", type: "flavor", text: "",
  risk_weight: 5, req_net_worth: 0, is_active: true, config: {},
};

// ── Supabase helpers ───────────────────────────────────────────────────────
async function fetchEvents() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/game_events?select=*&order=type,slug`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function upsertEvent(event) {
  const method = event.id ? "PATCH" : "POST";
  const url = event.id ? `${SUPABASE_URL}/rest/v1/game_events?id=eq.${event.id}` : `${SUPABASE_URL}/rest/v1/game_events`;
  const body = { ...event }; if (!body.id) delete body.id; delete body.created_at;
  const res = await fetch(url, { method, headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function deleteEvent(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/game_events?id=eq.${id}`, { method: "DELETE", headers });
  if (!res.ok) throw new Error(await res.text());
}

// ── Config builders ────────────────────────────────────────────────────────
function buildEffect(e) {
  const out = {};
  if (e.health)              out.health            = Number(e.health);
  if (e.gold)                out.gold              = Number(e.gold);
  if (e.gold_pct)            out.gold_pct          = Number(e.gold_pct);
  if (e.max_inventory)       out.max_inventory     = Number(e.max_inventory);
  if (e.add_item)          { out.add_item          = e.add_item; out.amount = Number(e.amount ?? 1); }
  if (e.zero_gold)           out.zero_gold         = true;
  if (e.clear_inventory)     out.clear_inventory   = true;
  if (e.clear_debt)          out.clear_debt        = true;
  if (e.force_pay_or_hurt)   out.force_pay_or_hurt = { damage: Number(e.force_pay_or_hurt.damage ?? 0), interest_pct: Number(e.force_pay_or_hurt.interest_pct ?? 0) };
  return out;
}

function buildConfig(type, cfg) {
  if (type === "flavor") return {};
  if (type === "heal")   return { value: cfg.value ?? 25 };
  if (type === "money")  return { value: cfg.value ?? 200 };
  if (type === "price")  return { value: cfg.value ?? 1.0 };
  if (type === "c3_encounter") {
    return { c3_encounter: true, category: cfg.category ?? "gold" };
  }
  if (type === "c3_check") {
    const out = {};
    for (const ok of ["fail", "success", "crit_fail", "crit_success"]) {
      // Preserve existing effect if present, otherwise build from form
      const effectVal = cfg.outcomes?.[ok]?.effect;
      out[ok] = { text: cfg.outcomes?.[ok]?.text ?? "", effect: effectVal && Object.keys(effectVal).length > 0 ? effectVal : buildEffect(cfg.outcomes?.[ok]?.effect ?? {}) };
    }
    const result = { c3_encounter: true, category: cfg.category ?? "gold", stat: cfg.stat ?? "charisma", outcomes: out, difficulty: cfg.difficulty ?? 12 };
    if (cfg.req_debt)                  result.req_debt    = true;
    if (cfg.req_min_day !== "")        result.req_min_day = Number(cfg.req_min_day);
    if (cfg.req_max_day !== "")        result.req_max_day = Number(cfg.req_max_day);
    return result;
  }
  if (type === "combat" || type === "check") {
    const out = {};
    for (const ok of ["fail", "success", "crit_fail", "crit_success"]) {
      out[ok] = { text: cfg.outcomes?.[ok]?.text ?? "", effect: buildEffect(cfg.outcomes?.[ok]?.effect ?? {}) };
    }
    const result = { stat: cfg.stat ?? "combat", outcomes: out, difficulty: cfg.difficulty ?? 12 };
    if (cfg.req_debt)                  result.req_debt    = true;
    if (cfg.req_min_day !== "")        result.req_min_day = Number(cfg.req_min_day);
    if (cfg.req_max_day !== "")        result.req_max_day = Number(cfg.req_max_day);
    return result;
  }
  return {};
}

function parseConfig(type, raw) {
  if (!raw || type === "flavor") return {};
  if (type === "heal" || type === "money" || type === "price") return { value: raw.value };
  if (type === "c3_encounter") {
    return { category: raw.category ?? "gold" };
  }
  if (type === "c3_check") {
    return {
      category: raw.category ?? "gold",
      stat: raw.stat ?? "charisma",
      difficulty: raw.difficulty ?? 12,
      req_debt: raw.req_debt ?? false,
      req_min_day: raw.req_min_day ?? "",
      req_max_day: raw.req_max_day ?? "",
      outcomes: {
        fail:         { text: raw.outcomes?.fail?.text ?? "",         effect: raw.outcomes?.fail?.effect ?? {} },
        success:      { text: raw.outcomes?.success?.text ?? "",      effect: raw.outcomes?.success?.effect ?? {} },
        crit_fail:    { text: raw.outcomes?.crit_fail?.text ?? "",    effect: raw.outcomes?.crit_fail?.effect ?? {} },
        crit_success: { text: raw.outcomes?.crit_success?.text ?? "", effect: raw.outcomes?.crit_success?.effect ?? {} },
      },
    };
  }
  if (type === "combat" || type === "check") {
    return {
      stat: raw.stat ?? "combat",
      difficulty: raw.difficulty ?? 12,
      req_debt: raw.req_debt ?? false,
      req_min_day: raw.req_min_day ?? "",
      req_max_day: raw.req_max_day ?? "",
      outcomes: {
        fail:         { text: raw.outcomes?.fail?.text ?? "",         effect: raw.outcomes?.fail?.effect ?? {} },
        success:      { text: raw.outcomes?.success?.text ?? "",      effect: raw.outcomes?.success?.effect ?? {} },
        crit_fail:    { text: raw.outcomes?.crit_fail?.text ?? "",    effect: raw.outcomes?.crit_fail?.effect ?? {} },
        crit_success: { text: raw.outcomes?.crit_success?.text ?? "", effect: raw.outcomes?.crit_success?.effect ?? {} },
      },
    };
  }
  return {};
}

// ── EffectBuilder ──────────────────────────────────────────────────────────
function EffectBuilder({ effect = {}, onChange }) {
  const set = (k, v) => {
    const next = { ...effect };
    if (v === "" || v === false || v === null || v === undefined) delete next[k];
    else next[k] = v;
    onChange(next);
  };
  const setNested = (k, subk, v) => {
    onChange({ ...effect, [k]: { ...(effect[k] || {}), [subk]: v } });
  };
  const hasForce = !!effect.force_pay_or_hurt;

  return (
    <div style={{ display: "grid", gap: 8, padding: 12, background: "#0a0a0a", borderRadius: 8, border: "1px solid #1e1e1e" }}>
      <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Effects</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <MiniField label="Health (e.g. -40 or 25)">
          <input type="number" value={effect.health ?? ""} placeholder="none"
            onChange={(e) => set("health", e.target.value === "" ? "" : Number(e.target.value))} style={miniInput} />
        </MiniField>
        <MiniField label="Gold (flat amount)">
          <input type="number" value={effect.gold ?? ""} placeholder="none"
            onChange={(e) => set("gold", e.target.value === "" ? "" : Number(e.target.value))} style={miniInput} />
        </MiniField>
        <MiniField label="Gold % (e.g. -0.25 = lose 25%)">
          <input type="number" step="0.01" value={effect.gold_pct ?? ""} placeholder="none"
            onChange={(e) => set("gold_pct", e.target.value === "" ? "" : Number(e.target.value))} style={miniInput} />
        </MiniField>
        <MiniField label="Inventory Space (+/-)">
          <input type="number" value={effect.max_inventory ?? ""} placeholder="none"
            onChange={(e) => set("max_inventory", e.target.value === "" ? "" : Number(e.target.value))} style={miniInput} />
        </MiniField>
        <MiniField label="Give Item">
          <select value={effect.add_item ?? ""} onChange={(e) => set("add_item", e.target.value || null)} style={miniInput}>
            <option value="">— none —</option>
            {ITEMS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </MiniField>
        {effect.add_item && (
          <MiniField label="Item Amount">
            <input type="number" min={1} value={effect.amount ?? 1}
              onChange={(e) => set("amount", Number(e.target.value))} style={miniInput} />
          </MiniField>
        )}
      </div>

      {/* Boolean toggles */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
        {[["zero_gold", "💸 Zero Gold"], ["clear_inventory", "🎒 Clear Inventory"], ["clear_debt", "📜 Clear Debt"]].map(([k, label]) => (
          <button key={k} onClick={() => set(k, effect[k] ? null : true)} style={{
            padding: "4px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
            border: `1px solid ${effect[k] ? "#c9a84c" : "#2a2a2a"}`,
            background: effect[k] ? "#c9a84c22" : "transparent",
            color: effect[k] ? "#c9a84c" : "#555",
          }}>{label}</button>
        ))}
        <button onClick={() => { if (hasForce) set("force_pay_or_hurt", null); else set("force_pay_or_hurt", { damage: 25, interest_pct: 0.1 }); }} style={{
          padding: "4px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
          border: `1px solid ${hasForce ? "#e74c3c" : "#2a2a2a"}`,
          background: hasForce ? "#e74c3c22" : "transparent",
          color: hasForce ? "#e74c3c" : "#555",
        }}>⚖️ Pay or Hurt</button>
      </div>

      {hasForce && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4, padding: 10, background: "#110a0a", borderRadius: 6, border: "1px solid #e74c3c33" }}>
          <MiniField label="Damage if can't pay">
            <input type="number" value={effect.force_pay_or_hurt?.damage ?? 0}
              onChange={(e) => setNested("force_pay_or_hurt", "damage", Number(e.target.value))} style={miniInput} />
          </MiniField>
          <MiniField label="Interest % added (e.g. 0.1)">
            <input type="number" step="0.01" value={effect.force_pay_or_hurt?.interest_pct ?? 0}
              onChange={(e) => setNested("force_pay_or_hurt", "interest_pct", Number(e.target.value))} style={miniInput} />
          </MiniField>
        </div>
      )}
    </div>
  );
}

// ── OutcomePanel ───────────────────────────────────────────────────────────
function OutcomePanel({ outcomeKey, data, onChange }) {
  const meta = OUTCOME_META[outcomeKey];
  return (
    <div style={{ border: `1px solid ${meta.color}33`, borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
      <div style={{ background: `${meta.color}18`, padding: "8px 14px", borderBottom: `1px solid ${meta.color}22` }}>
        <span style={{ color: meta.color, fontWeight: 700, fontSize: 13 }}>{meta.label}</span>
      </div>
      <div style={{ padding: 12, display: "grid", gap: 10 }}>
        <div>
          <div style={{ color: "#665040", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 }}>Outcome Text</div>
          <textarea value={data.text} onChange={(e) => onChange({ ...data, text: e.target.value })} rows={2}
            placeholder={`What happens on ${outcomeKey.replace("_", " ")}?`}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", fontSize: 13 }} />
        </div>
        <EffectBuilder effect={data.effect} onChange={(effect) => onChange({ ...data, effect })} />
      </div>
    </div>
  );
}

// ── ConfigBuilder ──────────────────────────────────────────────────────────
function ConfigBuilder({ type, cfg, onChange }) {
  const set = (k, v) => onChange({ ...cfg, [k]: v });
  const setOutcome = (ok, val) => onChange({ ...cfg, outcomes: { ...(cfg.outcomes ?? EMPTY_OUTCOMES), [ok]: val } });

  if (type === "flavor") return (
    <div style={{ padding: 20, background: "#0f0f0f", borderRadius: 8, border: "1px solid #1e1e1e", color: "#555", fontSize: 13, textAlign: "center" }}>
      🌙 Flavor events have no config — they're purely atmospheric.
    </div>
  );

  if (type === "c3_encounter") return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ padding: 16, background: "#0f0f1a", borderRadius: 8, border: "1px solid #2a3a5a", color: "#7fa8d1", fontSize: 13 }}>
        🤝 <strong>C3 Player Encounters</strong><br/>These events automatically fetch a random Channel 3 player at runtime and personalize the encounter text with their name. The player receives a guaranteed positive reward based on the category.
      </div>
      <Field label="Encounter Category">
        <select value={cfg.category ?? "gold"} onChange={(e) => set("category", e.target.value)} style={inputStyle}>
          <option value="gold">💰 Gold</option>
          <option value="gems">💎 Gems</option>
          <option value="health">💚 Health</option>
          <option value="inventory">🎒 Inventory</option>
        </select>
      </Field>
    </div>
  );

  if (type === "c3_check") {
    const outcomes = cfg.outcomes ?? EMPTY_OUTCOMES;
    return (
      <div style={{ display: "grid", gap: 18 }}>
        <div style={{ padding: 16, background: "#1a0f0f", borderRadius: 8, border: "1px solid #5a2a2a", color: "#d1a0a8", fontSize: 13 }}>
          🤝 <strong>C3 Skill Checks</strong><br/>Player helps another C3 adventurer with a task. They roll d20 with a stat check, and rewards scale based on the outcome (crit fail: 0%, fail: 25-75%, success: 75-100%, crit success: 100%+).
        </div>
        <Field label="Encounter Category">
          <select value={cfg.category ?? "gold"} onChange={(e) => set("category", e.target.value)} style={inputStyle}>
            <option value="gold">💰 Gold</option>
            <option value="gems">💎 Gems</option>
            <option value="health">💚 Health</option>
            <option value="inventory">🎒 Inventory</option>
          </select>
        </Field>
        {/* Mechanics row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <MiniField label="Stat Used">
            <select value={cfg.stat ?? "charisma"} onChange={(e) => set("stat", e.target.value)} style={inputStyle}>
              {CHECK_STATS.map((stat) => (
                <option key={stat} value={stat}>{stat}</option>
              ))}
            </select>
          </MiniField>
          <MiniField label={`Difficulty (DC): ${cfg.difficulty ?? 12}`}>
            <input type="range" min={5} max={25} value={cfg.difficulty ?? 12}
              onChange={(e) => set("difficulty", Number(e.target.value))}
              style={{ width: "100%", accentColor: "#c9a84c", marginTop: 6 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#555" }}>
              <span>Easy (5)</span><span style={{ color: "#c9a84c", fontWeight: 700 }}>{cfg.difficulty ?? 12}</span><span>Brutal (25)</span>
            </div>
          </MiniField>
        </div>

        {/* Conditions */}
        <div>
          <div style={{ color: "#665040", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Conditions (optional)</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <button onClick={() => set("req_debt", !cfg.req_debt)} style={{
              padding: "7px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
              border: `1px solid ${cfg.req_debt ? "#c9a84c" : "#2a2a2a"}`,
              background: cfg.req_debt ? "#c9a84c22" : "transparent",
              color: cfg.req_debt ? "#c9a84c" : "#555",
            }}>📜 Requires Active Debt</button>
            <MiniField label="Min Day">
              <input type="number" min={1} max={31} value={cfg.req_min_day ?? ""} placeholder="any"
                onChange={(e) => set("req_min_day", e.target.value === "" ? "" : Number(e.target.value))}
                style={{ ...miniInput, width: 80 }} />
            </MiniField>
            <MiniField label="Max Day">
              <input type="number" min={1} max={31} value={cfg.req_max_day ?? ""} placeholder="any"
                onChange={(e) => set("req_max_day", e.target.value === "" ? "" : Number(e.target.value))}
                style={{ ...miniInput, width: 80 }} />
            </MiniField>
          </div>
        </div>

        {/* Outcomes */}
        <div>
          <div style={{ color: "#665040", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Outcomes & Effects</div>
          {["crit_success", "success", "fail", "crit_fail"].map((ok) => (
            <OutcomePanel key={ok} outcomeKey={ok}
              data={outcomes[ok] ?? { text: "", effect: {} }}
              onChange={(val) => setOutcome(ok, val)} />
          ))}
        </div>
      </div>
    );
  }

  if (type === "heal") return (
    <MiniField label="HP Restored">
      <input type="number" min={1} value={cfg.value ?? 25} onChange={(e) => set("value", Number(e.target.value))} style={inputStyle} />
    </MiniField>
  );

  if (type === "money") return (
    <MiniField label="Gold Granted">
      <input type="number" min={1} value={cfg.value ?? 200} onChange={(e) => set("value", Number(e.target.value))} style={inputStyle} />
    </MiniField>
  );

  if (type === "price") return (
    <div style={{ display: "grid", gap: 10 }}>
      <MiniField label="Price Multiplier">
        <input type="number" step="0.05" min={0.1} max={5} value={cfg.value ?? 1.0}
          onChange={(e) => set("value", Number(e.target.value))} style={inputStyle} />
      </MiniField>
      <div style={{ fontSize: 12, color: "#555" }}>
        Examples: <span style={{ color: "#c9a84c" }}>0.5</span> = 50% (crash) · <span style={{ color: "#c9a84c" }}>2.0</span> = 200% (riot)
      </div>
    </div>
  );

  if (type === "combat" || type === "check") {
    const outcomes = cfg.outcomes ?? EMPTY_OUTCOMES;
    return (
      <div style={{ display: "grid", gap: 18 }}>
        {/* Mechanics row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <MiniField label="Stat Used">
            <select value={cfg.stat ?? "combat"} onChange={(e) => set("stat", e.target.value)} style={inputStyle}>
              {CHECK_STATS.map((stat) => (
                <option key={stat} value={stat}>{stat}</option>
              ))}
            </select>
          </MiniField>
          <MiniField label={`Difficulty (DC): ${cfg.difficulty ?? 12}`}>
            <input type="range" min={5} max={25} value={cfg.difficulty ?? 12}
              onChange={(e) => set("difficulty", Number(e.target.value))}
              style={{ width: "100%", accentColor: "#c9a84c", marginTop: 6 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#555" }}>
              <span>Easy (5)</span><span style={{ color: "#c9a84c", fontWeight: 700 }}>{cfg.difficulty ?? 12}</span><span>Brutal (25)</span>
            </div>
          </MiniField>
        </div>

        {/* Conditions */}
        <div>
          <div style={{ color: "#665040", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Conditions (optional)</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <button onClick={() => set("req_debt", !cfg.req_debt)} style={{
              padding: "7px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
              border: `1px solid ${cfg.req_debt ? "#c9a84c" : "#2a2a2a"}`,
              background: cfg.req_debt ? "#c9a84c22" : "transparent",
              color: cfg.req_debt ? "#c9a84c" : "#555",
            }}>📜 Requires Active Debt</button>
            <MiniField label="Min Day">
              <input type="number" min={1} max={31} value={cfg.req_min_day ?? ""} placeholder="any"
                onChange={(e) => set("req_min_day", e.target.value === "" ? "" : Number(e.target.value))}
                style={{ ...miniInput, width: 80 }} />
            </MiniField>
            <MiniField label="Max Day">
              <input type="number" min={1} max={31} value={cfg.req_max_day ?? ""} placeholder="any"
                onChange={(e) => set("req_max_day", e.target.value === "" ? "" : Number(e.target.value))}
                style={{ ...miniInput, width: 80 }} />
            </MiniField>
          </div>
        </div>

        {/* Outcomes */}
        <div>
          <div style={{ color: "#665040", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Outcomes & Effects</div>
          {["crit_success", "success", "fail", "crit_fail"].map((ok) => (
            <OutcomePanel key={ok} outcomeKey={ok}
              data={outcomes[ok] ?? { text: "", effect: {} }}
              onChange={(val) => setOutcome(ok, val)} />
          ))}
        </div>
      </div>
    );
  }
  return null;
}

// ── Event Modal ────────────────────────────────────────────────────────────
function EventModal({ event, onSave, onClose, saving }) {
  const isEdit = !!event?.id;
  const initType = event?.type ?? "flavor";
  const [form, setForm] = useState(event ? { ...event } : { ...EMPTY_EVENT });
  const [cfg, setCfg]   = useState(() => parseConfig(initType, event?.config ?? {}));
  const [tab, setTab]   = useState("basic");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleTypeChange = (t) => { set("type", t); setCfg(parseConfig(t, {})); };

  const handleSubmit = () => {
    if (!form.slug.trim()) return alert("Slug is required.");
    if (!form.text.trim()) return alert("Event text is required.");
    onSave({ ...form, config: buildConfig(form.type, cfg) });
  };

  const meta = TYPE_META[form.type] || TYPE_META.flavor;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#111", border: `1px solid ${meta.color}44`, borderTop: `3px solid ${meta.color}`,
        borderRadius: 12, width: "100%", maxWidth: 700, maxHeight: "92vh",
        display: "flex", flexDirection: "column", boxShadow: `0 0 60px ${meta.color}22`,
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ color: "#f5e6c8", fontFamily: "'Georgia', serif", fontSize: 20, margin: 0 }}>
              {isEdit ? "✏️ Edit Event" : "➕ New Event"}
            </h2>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 22, cursor: "pointer" }}>×</button>
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #1e1e1e" }}>
            {[["basic", "⚙️ Basic Info"], ["config", "🔧 Config Builder"], ["preview", "👁 JSON Preview"]].map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "8px 18px", border: "none", borderBottom: `2px solid ${tab === t ? meta.color : "transparent"}`,
                background: "transparent", color: tab === t ? meta.color : "#555",
                cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 700 : 400, marginBottom: -1,
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
          {tab === "basic" && (
            <div style={{ display: "grid", gap: 16 }}>
              <Field label="Slug (unique identifier)">
                <input value={form.slug} onChange={(e) => set("slug", e.target.value)}
                  placeholder="e.g. cave_troll" style={inputStyle} />
              </Field>
              <Field label="Event Type">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {EVENT_TYPES.map((t) => {
                    const m = TYPE_META[t]; const active = form.type === t;
                    return <button key={t} onClick={() => handleTypeChange(t)} style={{
                      padding: "6px 14px", borderRadius: 20,
                      border: `1px solid ${active ? m.color : "#333"}`,
                      background: active ? `${m.color}22` : "transparent",
                      color: active ? m.color : "#666", cursor: "pointer", fontSize: 13,
                    }}>{m.glyph} {m.label}</button>;
                  })}
                </div>
              </Field>
              <Field label="Event Text (shown to player at trigger)">
                <textarea value={form.text} onChange={(e) => set("text", e.target.value)} rows={3}
                  placeholder='e.g. A massive Cave Troll blocks the path. "Fee or flee!" it roars.'
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label={`Risk Weight: ${form.risk_weight}`}>
                  <input type="range" min={1} max={20} value={form.risk_weight}
                    onChange={(e) => set("risk_weight", Number(e.target.value))}
                    style={{ width: "100%", accentColor: meta.color, marginTop: 6 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#555" }}>
                    <span>Rare (1)</span><span style={{ color: "#c9a84c", fontWeight: 700 }}>{form.risk_weight}</span><span>Common (20)</span>
                  </div>
                </Field>
                <Field label="Min Net Worth (gold)">
                  <input type="number" min={0} value={form.req_net_worth}
                    onChange={(e) => set("req_net_worth", Number(e.target.value))} style={inputStyle} />
                </Field>
              </div>
              <Field label="Status">
                <button onClick={() => set("is_active", !form.is_active)} style={{
                  padding: "8px 20px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 600,
                  border: `1px solid ${form.is_active ? "#27ae60" : "#555"}`,
                  background: form.is_active ? "#27ae6022" : "#1a1a1a",
                  color: form.is_active ? "#27ae60" : "#777",
                }}>{form.is_active ? "✓ Active" : "○ Inactive"}</button>
              </Field>
            </div>
          )}

          {tab === "config" && (
            <ConfigBuilder type={form.type} cfg={cfg} onChange={setCfg} />
          )}

          {tab === "preview" && (
            <div>
              <div style={{ color: "#665040", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Generated config JSON</div>
              <pre style={{
                background: "#0a0a0a", color: "#a8d8a8", border: "1px solid #1e1e1e",
                borderRadius: 8, padding: 16, fontSize: 12, lineHeight: 1.6,
                overflowX: "auto", margin: 0, fontFamily: "'Courier New', monospace",
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>{JSON.stringify(buildConfig(form.type, cfg), null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #1e1e1e", display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ ...btnPrimary, background: meta.color, color: "#fff", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Event"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <div style={{ color: "#a08060", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}
function MiniField({ label, children }) {
  return (
    <div>
      <div style={{ color: "#665040", fontSize: 11, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

// ── Event Card ─────────────────────────────────────────────────────────────
function EventCard({ event, onEdit, onDelete, onToggle }) {
  const meta = TYPE_META[event.type] || TYPE_META.flavor;
  const [confirming, setConfirming] = useState(false);
  return (
    <div style={{
      background: "#111", border: "1px solid #1e1e1e", borderLeft: `3px solid ${event.is_active ? meta.color : "#333"}`,
      borderRadius: 8, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr auto",
      gap: 10, opacity: event.is_active ? 1 : 0.5,
    }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14 }}>{meta.glyph}</span>
          <span style={{ color: "#f5e6c8", fontWeight: 700, fontSize: 14, fontFamily: "'Georgia', serif" }}>{event.slug}</span>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 12, background: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}44`, fontWeight: 600 }}>{meta.label}</span>
          {event.req_net_worth > 0 && <span style={{ fontSize: 10, color: "#f39c12", padding: "2px 6px", border: "1px solid #f39c1244", borderRadius: 10 }}>💰 {event.req_net_worth.toLocaleString()}+</span>}
          {event.config?.req_debt && <span style={{ fontSize: 10, color: "#e74c3c", padding: "2px 6px", border: "1px solid #e74c3c44", borderRadius: 10 }}>📜 debt req</span>}
          {event.config?.req_min_day && <span style={{ fontSize: 10, color: "#9b59b6", padding: "2px 6px", border: "1px solid #9b59b644", borderRadius: 10 }}>📅 day {event.config.req_min_day}–{event.config.req_max_day ?? "31"}</span>}
        </div>
        <div style={{ color: "#888", fontSize: 13, lineHeight: 1.5, marginBottom: 5 }}>
          {event.text?.length > 120 ? event.text.slice(0, 120) + "…" : event.text}
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#555", flexWrap: "wrap" }}>
          <span>Weight: <span style={{ color: "#a08060" }}>{event.risk_weight}</span></span>
          {(event.type === "combat" || event.type === "check") && event.config?.difficulty && <span>DC: <span style={{ color: "#a08060" }}>{event.config.difficulty}</span></span>}
          {(event.type === "heal" || event.type === "money") && event.config?.value && <span>Value: <span style={{ color: "#a08060" }}>{event.config.value}</span></span>}
          {event.type === "price" && event.config?.value && <span>Multiplier: <span style={{ color: "#a08060" }}>{event.config.value}×</span></span>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        <button onClick={() => onEdit(event)} style={btnIconStyle("#4a90d9")}>Edit</button>
        <button onClick={() => onToggle(event)} style={btnIconStyle(event.is_active ? "#f39c12" : "#27ae60")}>{event.is_active ? "Disable" : "Enable"}</button>
        {confirming ? (
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => { setConfirming(false); onDelete(event.id); }} style={btnIconStyle("#e74c3c")}>Confirm</button>
            <button onClick={() => setConfirming(false)} style={btnIconStyle("#555")}>No</button>
          </div>
        ) : <button onClick={() => setConfirming(true)} style={btnIconStyle("#e74c3c")}>Delete</button>}
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [events, setEvents]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [modal, setModal]               = useState(null);
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState(null);
  const [filterType, setFilterType]     = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  const [search, setSearch]             = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setEvents(await fetchEvents()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const handleSave = async (form) => {
    setSaving(true);
    try { await upsertEvent(form); showToast(form.id ? "Event updated!" : "Event created!"); setModal(null); await load(); }
    catch (e) { showToast("Error: " + e.message, false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteEvent(id); showToast("Event deleted."); setEvents((ev) => ev.filter((e) => e.id !== id)); }
    catch (e) { showToast("Error: " + e.message, false); }
  };

  const handleToggle = async (event) => {
    try {
      await upsertEvent({ ...event, is_active: !event.is_active });
      setEvents((ev) => ev.map((e) => e.id === event.id ? { ...e, is_active: !e.is_active } : e));
      showToast(`Event ${!event.is_active ? "enabled" : "disabled"}.`);
    } catch (e) { showToast("Error: " + e.message, false); }
  };

  const filtered = events.filter((e) => {
    if (filterType !== "all" && e.type !== filterType) return false;
    if (filterActive === "active" && !e.is_active) return false;
    if (filterActive === "inactive" && e.is_active) return false;
    if (search && !e.slug.includes(search) && !e.text?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = events.filter((e) => e.is_active).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0c0b09", backgroundImage: "radial-gradient(ellipse at 20% 0%, #1a1200 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, #0a0d1a 0%, transparent 60%)", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#d4c4a0", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e1a12", padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(to right, #0f0d09, #111008)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>⚔️</span>
          <div>
            <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 700, color: "#c9a84c", margin: 0, letterSpacing: 1, textShadow: "0 0 20px #c9a84c55" }}>Dwarf Wars</h1>
            <div style={{ color: "#665040", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Event Manager</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 13, color: "#665040" }}><span style={{ color: "#c9a84c", fontWeight: 700 }}>{activeCount}</span>/{events.length} active</div>
          <button onClick={() => setModal({ event: null })} style={{ ...btnPrimary, background: "linear-gradient(135deg, #c9a84c, #a0762e)", color: "#0c0b09", fontWeight: 700, fontSize: 14, padding: "10px 22px", boxShadow: "0 2px 12px #c9a84c33" }}>
            + New Event
          </button>
        </div>
      </div>

      {/* Event Viewer Section */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 0 0" }}>
        <EventViewer />
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 24px 0" }}>
        {/* Type pills */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          {EVENT_TYPES.map((t) => {
            const m = TYPE_META[t];
            return <div key={t} style={{ padding: "8px 14px", borderRadius: 8, background: "#111", border: `1px solid ${m.color}33`, fontSize: 13 }}>
              <span>{m.glyph} </span>
              <span style={{ color: m.color, fontWeight: 700 }}>{events.filter(e => e.type === t).length}</span>
              <span style={{ color: "#555", marginLeft: 4 }}>{m.label}</span>
            </div>;
          })}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search slug or text…" style={{ ...inputStyle, flex: "1 1 180px" }} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ ...inputStyle, flex: "0 0 auto" }}>
            <option value="all">All Types</option>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
          </select>
          <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} style={{ ...inputStyle, flex: "0 0 auto" }}>
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>Loading events from the realm…
          </div>
        ) : error ? (
          <div style={{ background: "#200", border: "1px solid #e74c3c44", borderRadius: 8, padding: 20, color: "#e74c3c" }}>
            ⚠️ {error}
            <button onClick={load} style={{ marginLeft: 12, ...btnSecondary, display: "inline-block" }}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#444" }}>
            {events.length === 0 ? "No events yet. Create your first!" : "No events match your filters."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} onEdit={(e) => setModal({ event: e })} onDelete={handleDelete} onToggle={handleToggle} />
            ))}
          </div>
        )}
      </div>

      {modal && <EventModal event={modal.event} onSave={handleSave} onClose={() => setModal(null)} saving={saving} />}

      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#1a2e1a" : "#2e1a1a", border: `1px solid ${toast.ok ? "#27ae60" : "#e74c3c"}`, color: toast.ok ? "#27ae60" : "#e74c3c", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.5)", zIndex: 2000 }}>
          {toast.msg}
        </div>
      )}

      <style>{`select option { background: #111; color: #d4c4a0; } ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0c0b09; } ::-webkit-scrollbar-thumb { background: #2a2010; border-radius: 3px; }`}</style>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────
const inputStyle = { background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 6, color: "#d4c4a0", padding: "9px 12px", fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none" };
const miniInput  = { background: "#0a0a0a", border: "1px solid #222", borderRadius: 5, color: "#d4c4a0", padding: "7px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", outline: "none" };
const btnPrimary = { padding: "9px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 };
const btnSecondary = { padding: "9px 20px", borderRadius: 6, border: "1px solid #333", background: "transparent", color: "#888", cursor: "pointer", fontSize: 14 };
const btnIconStyle = (color) => ({ padding: "5px 10px", borderRadius: 5, border: `1px solid ${color}44`, background: `${color}11`, color, cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" });
