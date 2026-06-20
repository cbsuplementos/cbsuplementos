"use client";

/**
 * Componentes de UI reutilizáveis para o painel admin
 *
 * Centralizar componentes aqui evita repetir as classes Tailwind
 * em todos os formulários e mantém consistência visual.
 */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-xs uppercase tracking-widest text-noir/70 mb-2"
      >
        {label}
      </label>
      <input
        id={inputId}
        {...props}
        className="
          w-full px-4 py-3
          bg-white border border-noir/20
          text-noir placeholder-noir/30
          focus:outline-none focus:border-gold
          transition-colors duration-300
          disabled:opacity-50 disabled:bg-noir/5
        "
      />
      {hint && !error && (
        <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, id, ...props }: TextareaProps) {
  const textareaId = id || props.name;
  return (
    <div>
      <label
        htmlFor={textareaId}
        className="block text-xs uppercase tracking-widest text-noir/70 mb-2"
      >
        {label}
      </label>
      <textarea
        id={textareaId}
        rows={4}
        {...props}
        className="
          w-full px-4 py-3
          bg-white border border-noir/20
          text-noir placeholder-noir/30
          focus:outline-none focus:border-gold
          transition-colors duration-300
          disabled:opacity-50 disabled:bg-noir/5
          resize-y
        "
      />
      {hint && !error && (
        <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, id, ...props }: SelectProps) {
  const selectId = id || props.name;
  return (
    <div>
      <label
        htmlFor={selectId}
        className="block text-xs uppercase tracking-widest text-noir/70 mb-2"
      >
        {label}
      </label>
      <select
        id={selectId}
        {...props}
        className="
          w-full px-4 py-3
          bg-white border border-noir/20
          text-noir
          focus:outline-none focus:border-gold
          transition-colors duration-300
          disabled:opacity-50 disabled:bg-noir/5
        "
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

export function Checkbox({ label, description, id, ...props }: CheckboxProps) {
  const checkboxId = id || props.name;
  return (
    <label htmlFor={checkboxId} className="flex items-start gap-3 cursor-pointer group">
      <input
        id={checkboxId}
        type="checkbox"
        {...props}
        className="
          mt-1 w-5 h-5
          border-2 border-noir/30
          text-gold focus:ring-gold
          cursor-pointer
        "
      />
      <div className="flex-1">
        <span className="text-sm text-noir group-hover:text-gold-dark transition-colors">
          {label}
        </span>
        {description && (
          <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "danger";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center px-6 py-3 text-sm uppercase tracking-widest font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-gold text-noir hover:bg-gold-light",
    outline: "border border-noir text-noir hover:bg-noir hover:text-white",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${props.className || ""}`}
    >
      {loading ? "Processando..." : children}
    </button>
  );
}

/**
 * Container padrão para páginas do admin com header.
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-noir">{title}</h1>
        {description && (
          <p className="text-neutral-500 mt-2">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
