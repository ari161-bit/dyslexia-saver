import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  size = "default",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** "lg" is used on student pages — bigger, friendlier type for young readers. */
  size?: "default" | "lg";
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1
          className={cn(
            "font-heading font-semibold tracking-tight",
            size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className={cn("mt-1.5 text-muted-foreground", size === "lg" && "text-lg")}>{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
