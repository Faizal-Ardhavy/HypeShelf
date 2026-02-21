/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as constants from "../constants.js";
import type * as modules_recommendations_mutation from "../modules/recommendations/mutation.js";
import type * as modules_recommendations_query from "../modules/recommendations/query.js";
import type * as modules_users_mutation from "../modules/users/mutation.js";
import type * as modules_users_query from "../modules/users/query.js";
import type * as types from "../types.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  constants: typeof constants;
  "modules/recommendations/mutation": typeof modules_recommendations_mutation;
  "modules/recommendations/query": typeof modules_recommendations_query;
  "modules/users/mutation": typeof modules_users_mutation;
  "modules/users/query": typeof modules_users_query;
  types: typeof types;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
