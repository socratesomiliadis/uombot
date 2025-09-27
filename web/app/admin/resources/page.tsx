import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ResourcesManagement } from "./resources-management";

export default async function AdminResourcesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/sign-in");
  }

  return <ResourcesManagement />;
}
