import { AppShell } from "@/components/shell/app-shell";
import { requireUser } from "@/lib/auth/require-user";

export default async function HubLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return <AppShell email={user.email}>{children}</AppShell>;
}
