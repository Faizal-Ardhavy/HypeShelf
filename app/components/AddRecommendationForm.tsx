'use client';

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { GENRES, VALIDATION } from "@/convex/constants";

export default function AddRecommendationForm() {
  const addRecommendation = useMutation(api.modules.recommendations.mutation.addRecommendation);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [link, setLink] = useState("");
  const [blurb, setBlurb] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (title.length > VALIDATION.TITLE_MAX_LENGTH) {
      toast.error(`Title must be ${VALIDATION.TITLE_MAX_LENGTH} characters or less`);
      return;
    }
    
    if (blurb.length > VALIDATION.BLURB_MAX_LENGTH) {
      toast.error(`Description must be ${VALIDATION.BLURB_MAX_LENGTH} characters or less`);
      return;
    }

    if (link && link.length > VALIDATION.LINK_MAX_LENGTH) {
      toast.error(`Link must be ${VALIDATION.LINK_MAX_LENGTH} characters or less`);
      return;
    }
    
    setIsSubmitting(true);
    
    // Set timeout for the operation (30 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Operation timed out. Please try again.")), 30000)
    );
    
    try {
      await Promise.race([
        addRecommendation({ 
          title: title.trim(), 
          genre, 
          link: link.trim(),
          blurb: blurb.trim() 
        }),
        timeoutPromise
      ]);
      
      // Clear form
      setTitle("");
      setGenre("");
      setLink("");
      setBlurb("");
      
      toast.success("Recommendation added successfully!");
    } catch (error: unknown) {
      console.error(error);
      let errorMessage = "Failed to add recommendation. Please try again.";
      
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
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <span className={`text-xs ${title.length > VALIDATION.TITLE_MAX_LENGTH ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
              {title.length}/{VALIDATION.TITLE_MAX_LENGTH}
            </span>
          </div>
          <input
            id="title"
            type="text"
            placeholder="e.g., The Great Gatsby"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={VALIDATION.TITLE_MAX_LENGTH}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
            Genre <span className="text-red-500">*</span>
          </label>
          <select
            id="genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          >
            <option value="">Select a genre...</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-2">
            Link (Optional)
          </label>
          <input
            id="link"
            type="url"
            placeholder="https://example.com"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="blurb" className="block text-sm font-medium text-gray-700">
              Short Description (Optional)
            </label>
            <span className={`text-xs ${blurb.length > VALIDATION.BLURB_MAX_LENGTH ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
              {blurb.length}/{VALIDATION.BLURB_MAX_LENGTH}
            </span>
          </div>
          <textarea
            id="blurb"
            placeholder="A brief description of why you recommend this..."
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            rows={3}
            maxLength={VALIDATION.BLURB_MAX_LENGTH}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Recommendation
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
