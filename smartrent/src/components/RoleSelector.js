export default function RoleSelector({ roles, value, onChange, label = "I am a" }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-semibold text-ink-700">{label}</label>
      <div className={`grid gap-2.5 ${roles.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {roles.map((role) => {
          const active = value === role.value;
          const Icon = role.icon;
          return (
            <button
              type="button"
              key={role.value}
              onClick={() => onChange(role.value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition ${
                active
                  ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500"
                  : "border-ink-200 bg-white text-ink-500 hover:border-brand-300 hover:bg-brand-50/40"
              }`}
            >
              <Icon size={17} />
              {role.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
