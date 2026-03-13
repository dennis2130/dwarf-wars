import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

function formatEffect(effect) {
  if (!effect || typeof effect !== 'object') return 'None';

  const parts = [];

  if (effect.health !== undefined) parts.push(`health: ${effect.health}`);
  if (effect.gold !== undefined) parts.push(`gold: ${effect.gold}`);
  if (effect.gold_pct !== undefined) parts.push(`gold_pct: ${effect.gold_pct}`);
  if (effect.max_inventory !== undefined) parts.push(`max_inventory: ${effect.max_inventory}`);
  if (effect.add_item) parts.push(`add_item: ${effect.add_item}`);
  if (effect.amount !== undefined) parts.push(`amount: ${effect.amount}`);
  if (effect.zero_gold) parts.push('zero_gold: true');
  if (effect.clear_inventory) parts.push('clear_inventory: true');
  if (effect.clear_debt) parts.push('clear_debt: true');
  if (effect.force_pay_or_hurt) {
    const { damage, interest_pct } = effect.force_pay_or_hurt;
    parts.push(`force_pay_or_hurt: damage ${damage}, interest_pct ${interest_pct}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'None';
}

function formatConstraints(config) {
  if (!config || typeof config !== 'object') return [];

  const constraints = [];

  if (config.req_debt) constraints.push('Requires active debt');
  if (config.req_min_day !== undefined || config.req_max_day !== undefined) {
    const minDay = config.req_min_day ?? 1;
    const maxDay = config.req_max_day ?? 31;
    constraints.push(`Days ${minDay}-${maxDay}`);
  }
  if (config.category) constraints.push(`Category: ${config.category}`);
  if (config.c3_encounter) constraints.push('C3 encounter');

  return constraints;
}

function getDifficulty(event) {
  return event.config?.difficulty ?? -1;
}

function matchesConstraintFilter(event, filterValue) {
  const config = event.config || {};

  switch (filterValue) {
    case 'all':
      return true;
    case 'active':
      return event.is_active !== false;
    case 'inactive':
      return event.is_active === false;
    case 'c3':
      return Boolean(config.c3_encounter);
    case 'debt':
      return Boolean(config.req_debt);
    case 'day-gated':
      return config.req_min_day !== undefined || config.req_max_day !== undefined;
    case 'outcomes':
      return Boolean(config.outcomes);
    case 'simple':
      return !config.outcomes;
    default:
      return true;
  }
}

function sortEvents(events, sortBy) {
  const sorted = [...events];

  sorted.sort((left, right) => {
    switch (sortBy) {
      case 'slug':
        return left.slug.localeCompare(right.slug);
      case 'type': {
        const byType = (left.type || '').localeCompare(right.type || '');
        return byType !== 0 ? byType : left.slug.localeCompare(right.slug);
      }
      case 'difficulty-desc':
        return getDifficulty(right) - getDifficulty(left) || left.slug.localeCompare(right.slug);
      case 'difficulty-asc':
        return getDifficulty(left) - getDifficulty(right) || left.slug.localeCompare(right.slug);
      case 'active-first':
        return Number(right.is_active ?? true) - Number(left.is_active ?? true) || left.slug.localeCompare(right.slug);
      default:
        return 0;
    }
  });

  return sorted;
}

// Helper to fetch events from Supabase
async function fetchEvents() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPERBASE_SERVICE_KEY;
  if (!url || !key) return [];
  // Fetch 'text' field as well
  const res = await fetch(`${url}/rest/v1/game_events?select=slug,type,config,text,is_active`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!res.ok) return [];
  return await res.json();
}

export default function EventViewer() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [constraintFilter, setConstraintFilter] = useState('all');
  const [sortBy, setSortBy] = useState('slug');

  useEffect(() => {
    fetchEvents().then(setEvents);
  }, []);

  const eventTypes = ['all', ...new Set(events.map((event) => event.type).filter(Boolean))];

  const filteredEvents = sortEvents(
    events.filter((event) => {
      const search = filter.trim().toLowerCase();
      const matchesSearch = !search ||
        event.slug.toLowerCase().includes(search) ||
        event.text?.toLowerCase().includes(search);
      const matchesType = typeFilter === 'all' || event.type === typeFilter;
      const matchesConstraint = matchesConstraintFilter(event, constraintFilter);

      return matchesSearch && matchesType && matchesConstraint;
    }),
    sortBy
  );

  return (
    <div className="p-6 bg-slate-900 rounded-xl border border-slate-700 max-w-3xl mx-auto mt-8 shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4">Event Viewer</h2>
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <input
          className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white"
          placeholder="Filter by slug or text..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <select
          className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="slug">Sort: Slug</option>
          <option value="type">Sort: Type</option>
          <option value="difficulty-desc">Sort: Difficulty High-Low</option>
          <option value="difficulty-asc">Sort: Difficulty Low-High</option>
          <option value="active-first">Sort: Active First</option>
        </select>
      </div>
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <select
          className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Types' : `Type: ${type}`}
            </option>
          ))}
        </select>
        <select
          className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white"
          value={constraintFilter}
          onChange={(e) => setConstraintFilter(e.target.value)}
        >
          <option value="all">All Constraints</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
          <option value="c3">C3 Only</option>
          <option value="debt">Requires Debt</option>
          <option value="day-gated">Day-Gated</option>
          <option value="outcomes">Has Outcomes</option>
          <option value="simple">Simple Config Only</option>
        </select>
      </div>
      <div className="mb-6 text-sm text-slate-400">
        Showing <span className="font-bold text-slate-200">{filteredEvents.length}</span> of <span className="font-bold text-slate-200">{events.length}</span> events
      </div>
      <div className="space-y-6">
        {filteredEvents.map(event => (
          <div key={event.slug} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              {event.config?.c3_encounter && <Users size={24} className="text-purple-400" />}
              <span className="text-lg font-bold text-white">{event.slug}</span>
              <span className="text-xs text-slate-400">{event.type || event.config?.category}</span>
              <span className={`rounded border px-2 py-0.5 text-[11px] ${event.is_active === false ? 'border-amber-600 text-amber-400' : 'border-emerald-700 text-emerald-400'}`}>
                {event.is_active === false ? 'inactive' : 'active'}
              </span>
            </div>
            {/* Event Text (Story Context) */}
            {event.text && (
              <div className="mb-3 text-slate-200 text-base italic">"{event.text}"</div>
            )}
            {/* Stat & Difficulty for checks/combat */}
            {(event.config?.stat || event.config?.difficulty) && (
              <div className="mb-2 text-slate-300">Stat: <span className="font-bold">{event.config?.stat}</span> | Difficulty: <span className="font-bold">{event.config?.difficulty}</span></div>
            )}
            {formatConstraints(event.config).length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {formatConstraints(event.config).map((constraint) => (
                  <span key={constraint} className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-[11px] text-slate-300">
                    {constraint}
                  </span>
                ))}
              </div>
            )}
            {/* Outcomes for events with outcomes */}
            {event.config?.outcomes && (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(event.config.outcomes).map(([outcome, details]) => (
                  <div key={outcome} className="bg-slate-700 rounded p-3">
                    <div className="text-sm font-bold mb-1 text-purple-300">{outcome.replace('_', ' ').toUpperCase()}</div>
                    <div className="text-xs text-slate-200 mb-2">{details.text}</div>
                    <div className="text-xs text-slate-400">Effect: {formatEffect(details.effect)}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Non-check event configs (heal, money, price, flavor, etc.) */}
            {!event.config?.outcomes && event.config && (
              <div className="mt-2 text-xs text-slate-400">
                {Object.entries(event.config).map(([k, v]) => (
                  <div key={k}>
                    <span className="font-bold text-slate-300">{k}:</span> <span>{typeof v === 'object' ? JSON.stringify(v) : v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
