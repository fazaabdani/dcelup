import { redirect } from "next/navigation";
import { currentSession } from "@/lib/session";
import AppShell from "@/components/AppShell";

export default async function HomePage() {
  const session = await currentSession();
  if (!session) redirect("/login");
  return <AppShell session={{ name: session.name, role: session.role }} />;
}
