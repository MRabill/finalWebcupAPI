const {
  router,
  knexDb,
  fs,
  path,
} = require("../../utils/routes.imports.utils");
const SECURITY_CONFIG = require("../../configs/security.config");

const OUTPUT_DIR = path.resolve(__dirname, "../../configs/metadata");
const OUTPUT_FILE_JSON = path.join(OUTPUT_DIR, "ai-database-schema.json");
const OUTPUT_FILE_COMPACT = path.join(OUTPUT_DIR, "ai-database-schema.txt");

const buildSchemaPayload = (dbName, columnRows) => {
  const tables = {};

  columnRows.forEach((column) => {
    const tableName = column.tableName;
    if (!tables[tableName]) {
      tables[tableName] = {
        name: tableName,
        schema: column.tableSchema,
        columns: [],
      };
    }

    tables[tableName].columns.push({
      name: column.columnName,
      dataType: column.dataType,
      columnType: column.columnType,
      isNullable: column.isNullable === "YES",
      defaultValue: column.columnDefault,
      keyType: column.columnKey || null,
      extra: column.extra || null,
      ordinalPosition: column.ordinalPosition,
    });
  });

  return {
    generatedAt: new Date().toISOString(),
    database: dbName,
    tableCount: Object.keys(tables).length,
    tables: Object.values(tables).map((table) => ({
      ...table,
      columns: table.columns.sort(
        (a, b) => a.ordinalPosition - b.ordinalPosition
      ),
    })),
  };
};

const buildCompactSchema = (dbName, columnRows) => {
  const tables = {};

  columnRows.forEach((column) => {
    const tableName = column.tableName;
    if (!tables[tableName]) {
      tables[tableName] = [];
    }

    // Compact format: name:type|null|key|default
    const nullable = column.isNullable === "YES" ? "?" : "";
    const key = column.columnKey ? `[${column.columnKey}]` : "";
    const defaultVal = column.columnDefault ? `=${column.columnDefault}` : "";
    const autoInc = column.extra?.includes("auto_increment") ? "++" : "";

    tables[tableName].push(
      `  ${column.columnName}${nullable}: ${column.columnType}${key}${defaultVal}${autoInc}`
    );
  });

  let output = `// Database: ${dbName}\n// Generated: ${new Date().toISOString()}\n// Tables: ${
    Object.keys(tables).length
  }\n\n`;

  for (const [tableName, columns] of Object.entries(tables)) {
    output += `table ${tableName} {\n${columns.join(";\n")};\n}\n\n`;
  }

  return output;
};

const persistSchema = async (payload, format = "json") => {
  await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });

  if (format === "compact" || format === "both") {
    const compactSchema = buildCompactSchema(
      payload.database,
      payload._rawColumns || []
    );
    await fs.promises.writeFile(OUTPUT_FILE_COMPACT, compactSchema, "utf8");
  }

  if (format === "json" || format === "both") {
    await fs.promises.writeFile(
      OUTPUT_FILE_JSON,
      JSON.stringify(payload, null, 2),
      "utf8"
    );
  }

  return format;
};

router.get("/V1/system/database-schema", async function (req, res) {
  try {
    const dbName = knexDb?.client?.config?.connection?.database;
    const format = req.query.format || "compact"; // compact, json, or both

    if (!dbName) {
      return res.status(500).json({
        success: false,
        message: "Database name is not configured",
      });
    }

    const columns = await knexDb
      .select({
        tableSchema: "TABLE_SCHEMA",
        tableName: "TABLE_NAME",
        columnName: "COLUMN_NAME",
        dataType: "DATA_TYPE",
        columnType: "COLUMN_TYPE",
        columnDefault: "COLUMN_DEFAULT",
        isNullable: "IS_NULLABLE",
        columnKey: "COLUMN_KEY",
        extra: "EXTRA",
        ordinalPosition: "ORDINAL_POSITION",
      })
      .from("information_schema.columns")
      .where("TABLE_SCHEMA", dbName)
      .orderBy("TABLE_NAME")
      .orderBy("ORDINAL_POSITION");

    const schemaPayload = buildSchemaPayload(dbName, columns);
    schemaPayload._rawColumns = columns; // For compact format generation

    const savedFormat = await persistSchema(schemaPayload, format);

    res.set(SECURITY_CONFIG.SECURITY_HEADERS);

    const files = [];
    if (savedFormat === "compact" || savedFormat === "both") {
      files.push(OUTPUT_FILE_COMPACT);
    }
    if (savedFormat === "json" || savedFormat === "both") {
      files.push(OUTPUT_FILE_JSON);
    }

    // Return compact schema in response for immediate use
    const compactSchema = buildCompactSchema(dbName, columns);

    return res.status(200).json({
      success: true,
      message: `Database schema generated successfully (${savedFormat} format).`,
      format: savedFormat,
      compactSchema: compactSchema,
      payload: format === "json" ? schemaPayload : undefined,
      savedTo: files,
      usage: {
        compactTokens: Math.ceil(compactSchema.length / 4),
        jsonTokens: Math.ceil(JSON.stringify(schemaPayload).length / 4),
        savings: `~${Math.round(
          (1 - compactSchema.length / JSON.stringify(schemaPayload).length) *
            100
        )}%`,
      },
    });
  } catch (error) {
    console.error("Failed to build database schema overview:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to generate database schema overview",
      error: error.message,
    });
  }
});

module.exports = router;
