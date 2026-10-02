import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  return (
    <div className="flex">
      <AdminSidebar name={session.user.name ?? session.user.username} />
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
