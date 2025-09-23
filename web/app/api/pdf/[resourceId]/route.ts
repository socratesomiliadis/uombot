import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/resources";
import { eq } from "drizzle-orm";
import { s3Service } from "@/lib/storage/s3";

export async function GET(
  request: NextRequest,
  { params }: { params: { resourceId: string } }
) {
  try {
    // Get the session to check if user is authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { resourceId } = params;

    // Get the resource from the database
    const resource = await db
      .select()
      .from(resources)
      .where(eq(resources.id, resourceId))
      .limit(1);

    if (resource.length === 0) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    const resourceData = resource[0];

    // Only allow PDF resources
    if (resourceData.type !== "pdf") {
      return NextResponse.json(
        { error: "Resource is not a PDF" },
        { status: 400 }
      );
    }

    // Check if user has access (for now, allow all authenticated users)
    // In the future, you might want to check if the user owns the resource
    // or has been granted access to it

    // Extract the S3 key from the source URL
    const sourceUrl = resourceData.source;
    if (!sourceUrl) {
      return NextResponse.json(
        { error: "PDF source not found" },
        { status: 404 }
      );
    }

    // Extract key from URL (assuming format: http://localhost:9000/bucket/uploads/key)
    const urlParts = sourceUrl.split("/");
    const key = urlParts.slice(-2).join("/"); // gets "uploads/filename"

    // Get the PDF file from S3
    const pdfBuffer = await s3Service.getFile(key);

    // Return the PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${
          resourceData.title || "document"
        }.pdf"`,
        "Cache-Control": "private, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("PDF retrieval error:", error);

    return NextResponse.json(
      {
        error: "Failed to retrieve PDF",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
