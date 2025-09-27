import { auth } from "@/lib/auth";
import {
  getAllResources,
  getResourceStats,
  deleteResourceById,
  updateResourceStatus,
} from "@/lib/db/queries";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const includeStats = searchParams.get("includeStats") === "true";

    if (includeStats) {
      const [resources, stats] = await Promise.all([
        getAllResources({ limit, offset }),
        getResourceStats(),
      ]);

      return NextResponse.json({
        resources,
        stats,
        pagination: {
          page,
          limit,
          offset,
        },
      });
    } else {
      const resources = await getAllResources({ limit, offset });
      return NextResponse.json({
        resources,
        pagination: {
          page,
          limit,
          offset,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("id");

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    const deletedResource = await deleteResourceById({ id: resourceId });

    if (!deletedResource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Resource deleted successfully",
      resource: deletedResource,
    });
  } catch (error) {
    console.error("Error deleting resource:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Resource ID and status are required" },
        { status: 400 }
      );
    }

    const updatedResource = await updateResourceStatus({ id, status });

    if (!updatedResource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Resource updated successfully",
      resource: updatedResource,
    });
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  }
}
