import { Json } from "./db.rawtypes";
import { SupabaseClient } from "@supabase/supabase-js";

function isStringRecord(obj: any): obj is Record<string, unknown> {
  return obj && typeof obj === "object" && !Array.isArray(obj);
}

/**
 *
 * @param supabase The instance of a Supabase client to interact with
 * @param tableName The name of the table to query
 * @param params JSON parameters to filter the query
 * @returns
 */
export function buildSelectQuery(
  supabase: SupabaseClient,
  tableName: string,
  params: Json
): any {
  let query = supabase.from(tableName).select();

  if (isStringRecord(params)) {
    const operatorList = [
      "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is", "in",
      "contains", "containedBy", "rangeGt", "rangeGte", "match", "overlaps",
      "textSearch",

      // Special handling required
      "or", "not", "filter", "order"
    ];

    for (const operator of operatorList) {
      const value = params[operator];
      if ((operator === "or" || operator === "order") && value !== undefined) {
        // 'or' expects raw PostgREST syntax, 'order' expects a column name
        // ! This does not account for ordering options like ascending/descending (.reverse() can do that)
        query = query.or(value as string);
      } else if ((operator === "not" || operator === "filter") && value !== undefined) {
        /**
         *  'filter' and 'not' expect a list of lists of filters, e.g.
         *   filter: [
         *    ["status", "eq", "active"],
         *    ["age", "gte", 123]
         *  ]
         *  */
        if (Array.isArray(params[operator])) {
          for (const filter of params[operator]) {
            if (Array.isArray(filter)) {
              const column = filter[0] as string;
              const operator = filter[1] as string;
              const value = filter[2];
              // @ts-ignore: dynamic method call
              query = query[operator](column, operator, value);
            }
          }
        }
      } else if (isStringRecord(value)) {
        // General handling: query = query.operator(column, value[column]);
        /**
         * ! Supabase docs allow textSearch to be used with additional options,
         * ! but this is not handled here
         *  */
        for (const column of Object.keys(value)) {
          // @ts-ignore: dynamic method call
          query = query[operator](column, value[column]);
        }
      }
    }
  }

  return query;
}
