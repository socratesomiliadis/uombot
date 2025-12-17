"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const adminRoutes: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/resources": "Resources",
  "/admin/upload": "Upload",
};

export function AdminBreadcrumb() {
  const pathname = usePathname();

  // Get the current page title
  const currentTitle = adminRoutes[pathname] || "Admin";

  // Build breadcrumb items
  const isSubPage = pathname !== "/admin";

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          {isSubPage ? (
            <BreadcrumbLink href="/admin">Admin Panel</BreadcrumbLink>
          ) : (
            <BreadcrumbPage>Admin Panel</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {isSubPage && (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
