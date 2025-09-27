import { PDFUpload } from "@/components/pdf-upload";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function UploadPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/sign-in");
  }

  return (
    <div className="size-full py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Upload</h1>
          <p className="text-gray-600 mt-2">
            Upload PDF documents to create searchable knowledge base entries
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          <PDFUpload />
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            How it works
          </h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• Upload your PDF document (max 10MB)</li>
            <li>• Text is automatically extracted and cleaned</li>
            <li>• Content is intelligently chunked for optimal processing</li>
            <li>• Vector embeddings are generated for semantic search</li>
            <li>• Your documents become searchable in the chat interface</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
