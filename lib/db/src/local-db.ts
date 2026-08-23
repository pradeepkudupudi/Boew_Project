import fs from "fs";
import path from "path";
import { usersTable } from "./schema/users";
import { datasetImagesTable } from "./schema/dataset_images";
import { retrievalHistoryTable } from "./schema/retrieval_history";

export interface LocalDbState {
  users: any[];
  dataset_images: any[];
  retrieval_history: any[];
}

const DB_FILE = path.resolve(process.cwd(), "local_db.json");

function loadData(): LocalDbState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn("Failed to read local_db.json, re-initializing", err);
  }

  const initial: LocalDbState = {
    users: [
      {
        id: 1,
        email: "admin@boew.ai",
        // pre-hashed "admin123" for quick admin login
        passwordHash: "$2a$10$vI8aWBnW3fID.ZQ4/zo1G.qH0.6Y34uE7Oa7WqVfU3wR7P4n9L8yW",
        name: "BOEW Administrator",
        role: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    dataset_images: [],
    retrieval_history: [],
  };
  saveData(initial);
  return initial;
}

function saveData(data: LocalDbState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save local_db.json", err);
  }
}

function getTableName(table: any): keyof LocalDbState {
  if (table === usersTable || table?._?.name === "users" || table?.name === "users") {
    return "users";
  }
  if (table === datasetImagesTable || table?._?.name === "dataset_images" || table?.name === "dataset_images") {
    return "dataset_images";
  }
  if (table === retrievalHistoryTable || table?._?.name === "retrieval_history" || table?.name === "retrieval_history") {
    return "retrieval_history";
  }
  return "dataset_images";
}

export function createLocalDb() {
  return {
    select(fields?: any) {
      let selectedTable: keyof LocalDbState = "dataset_images";
      let filterFn: ((row: any) => boolean) | null = null;
      let sortDesc = false;
      let sortKey: string | null = null;
      let offsetNum = 0;
      let limitNum: number | null = null;
      let groupByCol: string | null = null;

      const builder = {
        from(table: any) {
          selectedTable = getTableName(table);
          return builder;
        },
        where(condition: any) {
          if (condition) {
            // Handle drizzle eq/sql conditions
            if (typeof condition === "function") {
              filterFn = condition;
            } else if (condition.left && condition.right !== undefined) {
              const colName = condition.left.name || condition.left.columnName || condition.left._?.name;
              const val = condition.right?.value !== undefined ? condition.right.value : condition.right;
              filterFn = (row: any) => row[colName] == val;
            } else if (condition.queryChunks) {
              // SQL chunk like `category IS NOT NULL`
              filterFn = (row: any) => row.category !== null && row.category !== undefined && row.category !== "";
            }
          }
          return builder;
        },
        orderBy(...orders: any[]) {
          if (orders.length > 0) {
            const first = orders[0];
            if (first?._?.name || first?.name) {
              sortKey = first._?.name || first.name;
              sortDesc = false;
            } else if (first?.column?._?.name || first?.column?.name) {
              sortKey = first.column._?.name || first.column.name;
              sortDesc = first.type === "desc" || first?.direction === "desc";
            }
          }
          return builder;
        },
        groupBy(col: any) {
          groupByCol = col?._?.name || col?.name || "category";
          return builder;
        },
        offset(n: number) {
          offsetNum = n;
          return builder;
        },
        limit(n: number) {
          limitNum = n;
          return builder;
        },
        async then(resolve: any, reject?: any) {
          try {
            const state = loadData();
            let rows = [...(state[selectedTable] || [])];

            if (filterFn) {
              rows = rows.filter(filterFn);
            }

            if (groupByCol) {
              const groups: Record<string, number> = {};
              for (const r of rows) {
                const key = r[groupByCol] || "Uncategorized";
                groups[key] = (groups[key] || 0) + 1;
              }
              const result = Object.entries(groups).map(([name, count]) => ({
                name,
                count,
              }));
              resolve(result);
              return;
            }

            // Aggregations: count / avg / sum
            if (fields && typeof fields === "object" && !Array.isArray(fields)) {
              const keys = Object.keys(fields);
              if (keys.includes("count")) {
                resolve([{ count: rows.length }]);
                return;
              }
              if (keys.includes("avg")) {
                const total = rows.reduce((acc, r) => acc + (Number(r.retrievalTimeMs || r.precision || r.recall || 0) || 0), 0);
                resolve([{ avg: rows.length ? total / rows.length : null }]);
                return;
              }
              if (keys.includes("total")) {
                const total = rows.reduce((acc, r) => acc + (Number(r.fileSize || 0) || 0), 0);
                resolve([{ total }]);
                return;
              }
            }

            if (sortKey) {
              rows.sort((a, b) => {
                const valA = a[sortKey!];
                const valB = b[sortKey!];
                if (valA < valB) return sortDesc ? 1 : -1;
                if (valA > valB) return sortDesc ? -1 : 1;
                return 0;
              });
            }

            if (offsetNum > 0) {
              rows = rows.slice(offsetNum);
            }
            if (limitNum !== null && limitNum !== undefined) {
              rows = rows.slice(0, limitNum);
            }

            resolve(rows);
          } catch (e) {
            if (reject) reject(e);
            else throw e;
          }
        },
      };

      return builder;
    },

    insert(table: any) {
      const selectedTable = getTableName(table);
      let valuesToInsert: any = null;

      const builder = {
        values(data: any) {
          valuesToInsert = data;
          return builder;
        },
        async returning() {
          const state = loadData();
          const list = state[selectedTable] || [];
          const now = new Date().toISOString();
          const nextId = list.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;

          const records = Array.isArray(valuesToInsert) ? valuesToInsert : [valuesToInsert];
          const insertedRecords = records.map((r, i) => ({
            id: nextId + i,
            createdAt: now,
            uploadedAt: now,
            updatedAt: now,
            ...r,
          }));

          state[selectedTable] = [...list, ...insertedRecords];
          saveData(state);

          return insertedRecords;
        },
        async then(resolve: any, reject?: any) {
          try {
            const records = await builder.returning();
            resolve(records);
          } catch (e) {
            if (reject) reject(e);
            else throw e;
          }
        },
      };

      return builder;
    },

    update(table: any) {
      const selectedTable = getTableName(table);
      let updates: any = {};
      let filterFn: ((row: any) => boolean) | null = null;

      const builder = {
        set(data: any) {
          updates = data;
          return builder;
        },
        where(condition: any) {
          if (condition) {
            if (typeof condition === "function") {
              filterFn = condition;
            } else if (condition.left && condition.right !== undefined) {
              const colName = condition.left.name || condition.left.columnName || condition.left._?.name;
              const val = condition.right?.value !== undefined ? condition.right.value : condition.right;
              filterFn = (row: any) => row[colName] == val;
            }
          }
          return builder;
        },
        async then(resolve: any, reject?: any) {
          try {
            const state = loadData();
            let rows = state[selectedTable] || [];
            let updatedCount = 0;

            rows = rows.map((r) => {
              if (!filterFn || filterFn(r)) {
                updatedCount++;
                return { ...r, ...updates, updatedAt: new Date().toISOString() };
              }
              return r;
            });

            state[selectedTable] = rows;
            saveData(state);
            resolve({ count: updatedCount });
          } catch (e) {
            if (reject) reject(e);
            else throw e;
          }
        },
      };

      return builder;
    },

    delete(table: any) {
      const selectedTable = getTableName(table);
      let filterFn: ((row: any) => boolean) | null = null;

      const builder = {
        where(condition: any) {
          if (condition) {
            if (typeof condition === "function") {
              filterFn = condition;
            } else if (condition.left && condition.right !== undefined) {
              const colName = condition.left.name || condition.left.columnName || condition.left._?.name;
              const val = condition.right?.value !== undefined ? condition.right.value : condition.right;
              filterFn = (row: any) => row[colName] == val;
            }
          }
          return builder;
        },
        async then(resolve: any, reject?: any) {
          try {
            const state = loadData();
            let rows = state[selectedTable] || [];
            if (filterFn) {
              rows = rows.filter((r) => !filterFn!(r));
            }
            state[selectedTable] = rows;
            saveData(state);
            resolve({ success: true });
          } catch (e) {
            if (reject) reject(e);
            else throw e;
          }
        },
      };

      return builder;
    },
  };
}
