const {
  router,
  knexDb,
  fs,
  path,
} = require("../../utils/routes.imports.utils");
const SECURITY_CONFIG = require("../../configs/security.config");

const OUTPUT_DIR = path.resolve(__dirname, "../../configs/metadata");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "ai-database-schema.json");

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

const persistSchema = async (payload) => {
  await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.promises.writeFile(
    OUTPUT_FILE,
    JSON.stringify(payload, null, 2),
    "utf8"
  );
};

router.get("/V1/system/database-schema", async function (req, res) {
  try {
    const dbName = knexDb?.client?.config?.connection?.database;

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

    await persistSchema(schemaPayload);

    res.set(SECURITY_CONFIG.SECURITY_HEADERS);

    return res.status(200).json({
      success: true,
      message:
        "Database schema generated successfully for AI-assisted tooling.",
      payload: schemaPayload,
      savedTo: OUTPUT_FILE,
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
