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
    /**
     *  Handle general filtering.
     *  params["filters"] is expected to be an array of parameters to .filter()
     *  by, following the ff. format:
     *  filters: [
     *    [column, operator, value],
     *    ...
     *    [columnN, operatorN, valueN]
     *  ]
     *  e.g.,
     *  filters: [
     *    ["status", "eq", "active"]
     *    ["age", "gte", 123]
     *  ]
     * See {@link https://supabase.com/docs/reference/javascript/filter} for a
     * list of supported filter operators.
     */
    if (Array.isArray(params["filters"])) {
      for (const filter of params["filters"]) {
        if (Array.isArray(filter)) {
          const column = filter[0] as string;
          const operator = filter[1] as string;
          const value = filter[2];
          query = query.filter(column, operator, value);
        }
      }
    }

    /**
     * Add more cases as needed. The above technically encompasses
     * all that's needed, but it might be convenient to handle the more
     * specific database query builder functions, too.
     */
    const operatorMap: Record<string, string> = {
      eq: "eq",
      neq: "neq",
      gt: "gt",
      gte: "gte",
      lt: "lt",
      lte: "lte",
      like: "like",
      ilike: "ilike", // case insensitive like
      is: "is",
      in: "in",
      contains: "contains",
      containedBy: "containedBy",
      rangeGt: "rangeGt",
      rangeGte: "rangeGte",
      match: "match",
      overlaps: "overlaps",
    };

    /**
     * If your params object contains an operation
     * 
     * operation: {
     *    column: value,
     *    column2: value2,
     * }
     * 
     * then it essentailly gets mapped into
     * 
     * query = query.operation(column, value).operation(column2, value2)
     * 
     * Note that some operations like `or`, `order`, `textSearch`, and `not`
     * are handled differently, as they do not take a column-value pair
     * 
     */
    for (const [paramKey, methodName] of Object.entries(operatorMap)) {
      const value = params[paramKey];
      if (isStringRecord(value)) { //
        for (const column of Object.keys(value)) {
          // @ts-ignore: dynamic method call
          query = query[methodName](column, value[column]);
        }
      }
    }


  }

  return query;
}
