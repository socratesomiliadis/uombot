"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  FileText,
  Calendar,
  User,
  Hash,
  Globe,
  RefreshCw,
  Download,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

interface Resource {
  id: string;
  type: string;
  title: string | null;
  source: string | null;
  lang: string | null;
  contentHash: string | null;
  createdBy: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  chunkCount: number;
}

interface ResourceStats {
  totalResources: number;
  totalChunks: number;
  statusStats: { status: string; count: number }[];
  typeStats: { type: string; count: number }[];
}

interface ResourcesData {
  resources: Resource[];
  stats?: ResourceStats;
  pagination: {
    page: number;
    limit: number;
    offset: number;
  };
}

export function ResourcesManagement() {
  const [data, setData] = useState<ResourcesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const fetchResources = async (includeStats = false) => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        includeStats: includeStats.toString(),
      });

      const response = await fetch(`/api/admin/resources?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }

      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast.error("Failed to fetch resources");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteResource = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/resources?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete resource");
      }

      toast.success("Resource deleted successfully");
      fetchResources();
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    }
  };

  const updateResourceStatus = async (id: string, status: string) => {
    try {
      const response = await fetch("/api/admin/resources", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update resource status");
      }

      toast.success("Resource status updated successfully");
      fetchResources();
    } catch (error) {
      console.error("Error updating resource status:", error);
      toast.error("Failed to update resource status");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ready":
        return "default";
      case "processing":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    fetchResources(true);
  }, [page]);

  if (loading) {
    return (
      <div className="size-full py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-md w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Resource Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage uploaded documents and their processing status
            </p>
          </div>
          <Button
            onClick={() => fetchResources(true)}
            disabled={refreshing}
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {data?.stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Resources
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {data.stats.totalResources}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <Hash className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Chunks
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {data.stats.totalChunks}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">By Status</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.stats.statusStats.map((stat) => (
                      <Badge
                        key={stat.status}
                        variant="outline"
                        className="text-xs"
                      >
                        {stat.status}: {stat.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">By Type</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.stats.typeStats.map((stat) => (
                      <Badge
                        key={stat.type}
                        variant="outline"
                        className="text-xs"
                      >
                        {stat.type}: {stat.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resources List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Resources</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {data?.resources.map((resource) => (
              <div key={resource.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {resource.title || resource.source || "Untitled"}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(resource.createdAt)}
                          </p>
                          {resource.createdBy && (
                            <p className="text-xs text-gray-500 flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {resource.createdBy}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 flex items-center">
                            <Hash className="h-3 w-3 mr-1" />
                            {resource.chunkCount} chunks
                          </p>
                          {resource.lang && (
                            <Badge variant="outline" className="text-xs">
                              {resource.lang}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge variant={getStatusBadgeVariant(resource.status)}>
                      {resource.status}
                    </Badge>

                    <Select
                      value={resource.status}
                      onValueChange={(status) =>
                        updateResourceStatus(resource.id, status)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>

                    {resource.source && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/api/pdf/${resource.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this resource? This
                            action cannot be undone. All associated chunks and
                            embeddings will also be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteResource(resource.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data?.resources.length === 0 && (
            <div className="px-6 py-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No resources found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.resources.length >= limit && (
          <div className="mt-6 flex justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={data.resources.length < limit}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
