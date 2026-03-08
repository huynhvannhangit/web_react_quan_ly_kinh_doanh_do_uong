import { cn } from "@/lib/utils";

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MainContent({ children, className }: MainContentProps) {
  return (
    <main
      id="main-content"
      className={cn(
        "flex-1 overflow-y-auto overflow-x-auto bg-muted/70 p-6",
        className,
      )}
    >
      <div className="mx-auto w-full min-w-fit">{children}</div>
    </main>
  );
}
