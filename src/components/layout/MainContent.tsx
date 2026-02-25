import { cn } from "@/lib/utils";

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MainContent({ children, className }: MainContentProps) {
  return (
    <main
      id="main-content"
      className={cn("flex-1 overflow-y-auto bg-muted/70 p-6", className)}
    >
      <div className="mx-auto max-w-screen-2xl">{children}</div>
    </main>
  );
}
