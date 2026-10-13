/** Heading block shared by the login and registration forms. */
export default function AuthHeader({ title, subtitle }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-2xl font-semibold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-2 text-base text-slate-600">{subtitle}</p>}
    </div>
  );
}
