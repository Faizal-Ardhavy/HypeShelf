"use client";
import { useEffect, useState } from "react";
import AddRecommendationForm from "./add_feature/AddRecommendationForm";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import AuthButtons from "./clerk_auth/authButtons";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn } = useUser();
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  
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

  useEffect(() => {
    if (isSignedIn) {
      createOrGetUser().catch(console.error);
    }
  }, [isSignedIn, createOrGetUser]);

  const handleDelete = async (id: Id<"recommendations">) => {
    if (confirm("Are you sure you want to delete this recommendation?")) {
      try {
        await deleteRecommendation({ id });
      } catch (error) {
        console.error(error);
        alert("Failed to delete recommendation");
      }
    }
  };

  const handleToggleStaffPick = async (id: Id<"recommendations">) => {
    try {
      await toggleStaffPick({ id });
    } catch (error) {
      console.error(error);
      alert("Failed to toggle staff pick");
    }
  };

  const canDelete = (rec: { userId: string; _id: Id<"recommendations"> }) => {
    if (!currentUser) return false;
    return currentUser.role === "admin" || rec.userId === currentUser.userId;
  };

  const genres = ["all", ...new Set(recommendations?.map(r => r.genre) || [])];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
        {isSignedIn ? (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Add New Recommendation
            </h2>
            <AddRecommendationForm />
          </div>
        ) : (
          <div className="mb-12 text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600 text-lg mb-4">Please sign in to add recommendations</p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              All Recommendations
            </h2>
            
            <div className="flex items-center gap-2">
              <label htmlFor="genre-filter" className="text-sm font-medium text-gray-700">
                Filter by genre:
              </label>
              <select
                id="genre-filter"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre === "all" ? "All Genres" : genre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {recommendations === undefined ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="ml-4 text-gray-600">Loading recommendations...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500 text-lg">No recommendations yet. Be the first to add one!</p>
            </div>
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
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {rec.genre}
                        </span>
                        <span className="text-sm text-gray-500">
                          by {rec.authorName}
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
                            className="w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {rec.isStaffPick ? "Remove Staff Pick" : "Mark as Staff Pick"}
                          </button>
                        )}
                        
                        {canDelete(rec) && (
                          <button
                            onClick={() => handleDelete(rec._id)}
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
