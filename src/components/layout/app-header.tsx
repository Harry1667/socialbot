import Link from "next/link";
import { Plus, Sparkles, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HookPicker } from "@/components/hooks/picker";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Social Master
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          <Link
            href="/agent/socialmaster"
            className="rounded-md px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-accent"
          >
            內容工作區
          </Link>
          <Link
            href="#"
            className="rounded-md px-3 py-1.5 transition-colors hover:bg-accent hover:text-foreground"
          >
            分析
          </Link>
          <Link
            href="#"
            className="rounded-md px-3 py-1.5 transition-colors hover:bg-accent hover:text-foreground"
          >
            設定
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <HookPicker />
        <ThemeToggle />
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/agent/socialmaster/i/new">
            <Plus className="size-4" />
            <span className="hidden sm:inline">新增身份</span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-500" />
        </Button>
        <Avatar className="size-8">
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
            H
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
