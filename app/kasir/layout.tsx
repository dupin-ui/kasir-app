import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import KasirNavbar from "@/components/KasirNavbar";

export default async function KasirLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen">
      <KasirNavbar name={session.user.name ?? session.user.username} role={session.user.role} />
      <main className="p-4 lg:p-6">{children}</main>
    </div>
  );
}
