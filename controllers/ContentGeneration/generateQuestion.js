const { router } = require("../../utils/routes.imports.utils");
const { OpenAI } = require("openai");
const { zodTextFormat } = require("openai/helpers/zod");
const { z } = require("zod");
const knex = require("knex");
const dbConfig = require("../../configs/db");
const crypto = require("crypto");

const db = knex(dbConfig);
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the MCQ schema using Zod
const MCQSchema = z.object({
  question: z.string().describe("The multiple-choice question text"),
  options: z.object({
    A: z.string().describe("Option A text"),
    B: z.string().describe("Option B text"),
    C: z.string().describe("Option C text"),
    D: z.string().describe("Option D text"),
  }),
  correct_answer: z
    .enum(["A", "B", "C", "D"])
    .describe("The correct answer option (A, B, C, or D)"),
  explanation: z
    .string()
    .describe(
      "Brief explanation of why the correct answer is right (keep it short, 1-2 sentences)"
    ),
  hint: z
    .string()
    .describe(
      "A short helpful hint that guides the student toward the correct answer without revealing it directly (keep it concise, 1 sentence)"
    ),
  correction_prompt: z
    .string()
    .describe(
      "A concise prompt that can be given to an LLM to help correct a student's wrong answer and guide them to the right solution (keep it brief)"
    ),
});

router.post("/V1/content-generation/mcq", async (req, res) => {
  const startTime = Date.now();
  let apiKeyRecord = null;

  try {
    // Validate API key from header
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "API key is required",
        code: "MISSING_API_KEY",
      });
    }

    // Query the database to validate the API key
    apiKeyRecord = await db("api_keys")
      .where({ key: apiKey, status: "active" })
      .first();

    if (!apiKeyRecord) {
      // Log failed request
      await db("requests").insert({
        endpoint: "/V1/content-generation/mcq",
        request_payload_hash: crypto
          .createHash("sha256")
          .update(JSON.stringify({ error: "Invalid API key" }))
          .digest("hex"),
        response_status: 401,
        tokens_used: 0,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid or inactive API key",
        code: "INVALID_API_KEY",
      });
    }

    // Update last_used timestamp
    await db("api_keys").where({ id: apiKeyRecord.id }).update({
      last_used: db.fn.now(),
    });

    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: "Topic is required",
        code: "MISSING_TOPIC",
      });
    }

    const response = await client.responses.parse({
      model: "gpt-5-mini-2025-08-07",
      input: [
        {
          role: "system",
          content:
            "You are an expert educator that creates high-quality multiple-choice questions for educational purposes.",
        },
        {
          role: "user",
          content: `Generate a multiple-choice question (MCQ) on the topic: ${topic}. Provide four options labeled A, B, C, and D, indicate the correct answer with a short explanation (1-2 sentences), provide a concise hint to guide students (1 sentence), and create a brief correction prompt that can be used by an LLM to help students who answer incorrectly.`,
        },
      ],
      text: {
        format: zodTextFormat(MCQSchema, "mcq"),
      },
    });

    // Check for refusal
    if (response.output?.[0]?.content?.[0]?.type === "refusal") {
      return res.status(400).json({
        success: false,
        message: "Unable to generate question for this topic",
        code: "CONTENT_REFUSED",
        refusal: response.output[0].content[0].refusal,
      });
    }

    // Use the parsed output directly
    const mcqData = response.output_parsed;

    // Log successful request
    await db("requests").insert({
      api_key_id: apiKeyRecord.id,
      endpoint: "/V1/content-generation/mcq",
      request_payload_hash: JSON.stringify({ topic }),
      response_payload_hash: JSON.stringify(mcqData),
      response_status: 200,
      tokens_used: response.usage?.total_tokens || 0,
    });

    return res.status(200).json({
      success: true,
      message: "Question generated successfully",
      data: {
        topic: topic,
        question: mcqData.question,
        options: mcqData.options,
        correct_answer: mcqData.correct_answer,
        explanation: mcqData.explanation,
        hint: mcqData.hint,
        correction_prompt: mcqData.correction_prompt,
        metadata: {
          model: response.model,
          created_at: response.created_at,
          usage: response.usage,
        },
      },
    });
  } catch (err) {
    console.error("Error in /V1/content-generation/mcq:", err);

    // Log error request
    if (apiKeyRecord) {
      await db("requests").insert({
        api_key_id: apiKeyRecord.id,
        endpoint: "/V1/content-generation/mcq",
        request_payload_hash: crypto
          .createHash("sha256")
          .update(JSON.stringify(req.body))
          .digest("hex"),
        response_status: 500,
        tokens_used: 0,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to generate question",
      code: "CONTENT_GENERATION_API_ERROR",
      error: err.message,
    });
  }
});

module.exports = router;
