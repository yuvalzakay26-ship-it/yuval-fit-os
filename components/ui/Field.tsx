import { cn } from "@/lib/utils";

const inputClasses =
  "h-12 w-full rounded-2xl border border-border bg-surface-2 px-3.5 text-[15px] text-foreground outline-none transition-[border-color,box-shadow,background-color] placeholder:text-faint focus:border-accent focus:bg-surface focus:ring-4 focus:ring-[color:var(--accent-soft)]";

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[12px] font-semibold tracking-wide text-muted",
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputClasses, "appearance-none", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        inputClasses,
        "h-auto min-h-20 resize-y py-2.5 leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}
