"use client";
import { useEffect, useState } from "react";
import AddRecommendationForm from "./components/AddRecommendationForm";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import AuthButtons from "./components/AuthButtons";
import { useUser } from "@clerk/nextjs";
import { toast, Toaster } from "sonner";
import DeleteModal from "./components/DeleteModal";
import { DBErrorFallback, DBLoading, DBEmpty } from "./components/DBErrorHandler";

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffInMs = now - timestamp;
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default function Home() {
  const { isSignedIn } = useUser();
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: Id<"recommendations">;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingStaffPick, setTogglingStaffPick] = useState<
    Id<"recommendations"> | null
  >(null);
  const [queryError, setQueryError] = useState<Error | null>(null);
  
  const createOrGetUser = useMutation(api.modules.users.mutation.createOrGetUser);
  const currentUser = useQuery(api.modules.users.query.getCurrentUser);
  const recommendations = useQuery(
    api.modules.recommendations.query.getRecommendations,
    { genre: selectedGenre }
  );
  
  const deleteRecommendation = useMutation(
    api.modules.recommendations.mutation.deleteRecommendation
  );
  const toggleStaffPick = useMutation(
    api.modules.recommendations.mutation.toggleStaffPick
  );

  // Monitor for query loading issues (e.g., taking too long)
  useEffect(() => {
    if (recommendations === undefined) {
      // Set a timeout to detect if query is taking too long
      const timeout = setTimeout(() => {
        if (recommendations === undefined) {
          setQueryError(new Error("Loading is taking longer than expected. Please check your connection."));
        }
      }, 15000); // 15 seconds timeout warning

      return () => clearTimeout(timeout);
    } else {
      // Clear error when data loads successfully
      setQueryError(null);
    }
  }, [recommendations]);

  useEffect(() => {
    if (isSignedIn) {
      createOrGetUser().catch((err) => {
        console.error("Failed to create/get user:", err);
        toast.error("Authentication error. Please try signing in again.");
      });
    }
  }, [isSignedIn, createOrGetUser]);

  /**
   * Retry loading recommendations
   * Clears error state and triggers a re-fetch by temporarily toggling genre
   */
  const handleRetry = () => {
    setQueryError(null);
    toast.info("Retrying...");
    
    // Force re-render and re-fetch by toggling state
    const currentGenre = selectedGenre;
    setSelectedGenre("");
    setTimeout(() => setSelectedGenre(currentGenre), 100);
  };

  /**
   * Open delete confirmation modal
   */
  const handleDeleteClick = (id: Id<"recommendations">, title: string) => {
    setItemToDelete({ id, title });
    setDeleteModalOpen(true);
  };

  /**
   * Confirm and execute delete with timeout handling
   */
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    
    // Set timeout for the operation (30 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Delete operation timed out. Please try again.")), 30000)
    );

    try {
      await Promise.race([
        deleteRecommendation({ id: itemToDelete.id }),
        timeoutPromise
      ]);
      
      toast.success("Recommendation deleted successfully!");
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error: unknown) {
      console.error(error);
      let errorMessage = "Failed to delete recommendation";
      
      if (error instanceof Error) {
        if (error.message.includes("timeout") || error.message.includes("timed out")) {
          errorMessage = "Delete operation timed out. The server might be busy. Please try again.";
        } else if (error.message.includes("network") || error.message.includes("Failed to fetch")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Toggle staff pick status with loading feedback and timeout handling
   */
  const handleToggleStaffPick = async (id: Id<"recommendations">) => {
    setTogglingStaffPick(id);
    
    // Set timeout for the operation (30 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Toggle operation timed out. Please try again.")), 30000)
    );
    
    try {
      await Promise.race([
        toggleStaffPick({ id }),
        timeoutPromise
      ]);
      
      toast.success("Staff pick updated!");
    } catch (error: unknown) {
      console.error(error);
      let errorMessage = "Failed to update staff pick";
      
      if (error instanceof Error) {
        if (error.message.includes("timeout") || error.message.includes("timed out")) {
          errorMessage = "Operation timed out. The server might be busy. Please try again.";
        } else if (error.message.includes("network") || error.message.includes("Failed to fetch")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setTogglingStaffPick(null);
    }
  };

  /**
   * Check if current user can delete a recommendation
   * RBAC: Admin can delete any, user can delete own
   */
  const canDelete = (rec: { userId: string; _id: Id<"recommendations"> }) => {
    if (!currentUser) return false;
    return currentUser.role === "admin" || rec.userId === currentUser.userId;
  };

  /**
   * Get available genres from recommendations
   * Excludes "all" to prevent duplicate in dropdown
   */
  const availableGenres = Array.from(
    new Set(recommendations?.map(r => r.genre) || [])
  ).filter(genre => genre.trim() !== "");
  
  const genreOptions = ["all", ...availableGenres];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster richColors position="top-right" />
      
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={itemToDelete?.title || ""}
        isDeleting={isDeleting}
      />
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                HypeShelf
              </h1>
              <p className="mt-2 text-gray-600">
                Collect and share the stuff you&apos;re hyped about
              </p>
            </div>
            <AuthButtons />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isSignedIn && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Add New Recommendation
            </h2>
            <AddRecommendationForm />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              {isSignedIn ? "All Recommendations" : "Latest Recommendations"}
            </h2>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="genre-filter" className="text-sm font-medium text-gray-700">
                  Filter:
                </label>
                <select
                  id="genre-filter"
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {genreOptions.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre === "all" ? "All Genres" : genre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {!isSignedIn && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <p className="text-center text-gray-700">
                <span className="font-medium">Want to share your recommendations?</span> Sign in to add yours!
              </p>
            </div>
          )}
          
          {/* Database Error Handling */}
          {queryError ? (
            <DBErrorFallback 
              error={queryError} 
              retry={handleRetry} 
            />
          ) : recommendations === undefined ? (
            <DBLoading message="Loading recommendations..." />
          ) : recommendations.length === 0 ? (
            <DBEmpty message="No recommendations yet. Be the first to add one!" />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((rec) => (
                <div
                  key={rec._id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-xl font-bold text-white line-clamp-2">
                        {rec.title}
                      </h3>
                      {rec.isStaffPick && (
                        <span className="ml-2 flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900">
                          Staff Pick
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {rec.genre}
                          </span>
                          <span className="text-sm text-gray-500">
                            by {rec.authorName}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatTimeAgo(rec._creationTime)}
                        </span>
                      </div>

                      {rec.blurb && (
                        <p className="text-gray-600 text-sm line-clamp-3">
                          {rec.blurb}
                        </p>
                      )}

                      {rec.link && (
                        <a
                          href={rec.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                        >
                          Visit Link
                          <svg
                            className="ml-1 w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      )}
                    </div>

                    {isSignedIn && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                        {currentUser?.role === "admin" && (
                          <button
                            onClick={() => handleToggleStaffPick(rec._id)}
                            disabled={togglingStaffPick === rec._id}
                            className="w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {togglingStaffPick === rec._id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700"></div>
                                Updating...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {rec.isStaffPick ? "Remove Staff Pick" : "Mark as Staff Pick"}
                              </>
                            )}
                          </button>
                        )}
                        
                        {canDelete(rec) && (
                          <button
                            onClick={() => handleDeleteClick(rec._id, rec.title)}
                            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
