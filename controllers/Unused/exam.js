const { router } = require("../../utils/routes.imports.utils");
const { OpenAI } = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sessionContexts = new Map();

router.post("/V1/exam", async (req, res) => {
  try {
    const { sessionId, question, image } = req.body;
    if (!sessionId || (!question && !image)) {
      return res.status(400).json({
        success: false,
        message: "sessionId and either question or image are required",
        code: "EXAM_VALIDATION_ERROR",
      });
    }
    if (question && question.trim().length === 0 && !image) {
      return res.status(400).json({
        success: false,
        message: "Question cannot be empty when no image is provided",
        code: "EXAM_VALIDATION_ERROR",
      });
    }

    const history = sessionContexts.get(sessionId) || [];

    // If available, pass the last response id for reasoning context
    const lastAssistant = history
      .slice()
      .reverse()
      .find((h) => h.role === "assistant");
    const previous_response_id = lastAssistant
      ? lastAssistant.responseId
      : undefined;

    // Use OpenAI Responses API
    const input = [
      {
        role: "system",
        content:
          "You are an expert MSc AI RPA(Robotic Process Automation) examiner that work with UI Path studio. Provide only the correct answer options (Can have more than one good answer) for the given multiple choice question. Return only the answer letters and the option and no explanations. If the question's options label A,B,C,D, ... are not present, then make an educated guess based on the question content what are the likely options present and then try to get the best options. For image-based questions, carefully analyze the visual content and provide accurate answers.",
      },
      ...history.map((h) => ({ role: h.role, content: h.content })),
    ];

    // Build user message content based on whether image is provided
    if (image) {
      input.push({
        role: "user",
        content: [
          {
            type: "input_text",
            text: question
              ? `Answer this question with only the correct option(s):\n\n${question}`
              : "Analyze this image and provide the correct answer options for any multiple choice questions shown. Return only the answer letters and options, no explanations.",
          },
          {
            type: "input_image",
            image_url: image.startsWith("data:")
              ? image
              : `data:image/jpeg;base64,${image}`,
          },
        ],
      });
    } else {
      input.push({
        role: "user",
        content: `Answer this question with only the correct option(s):\n\n${question}`,
      });
    }

    const resp = await client.responses.create({
      model: "gpt-5",
      input: input,
      ...(previous_response_id && {
        previous_response_id: previous_response_id,
      }),
      reasoning: {
        effort: "minimal",
      },
    });

    // Extract answer from responses API
    const answerText = resp.output_text?.trim() || "";

    // Append to history with responseId
    const newEntry = {
      role: "assistant",
      content: answerText,
      responseId: resp.id,
    };
    const updatedHistory = [
      ...history,
      { role: "user", content: question || "[Image uploaded]" },
      newEntry,
    ];
    sessionContexts.set(sessionId, updatedHistory);

    return res.status(200).json({
      success: true,
      message: "Exam question processed successfully",
      data: {
        answer: answerText,
        sessionId,
        questionCount: updatedHistory.filter((h) => h.role === "user").length,
      },
    });
  } catch (err) {
    console.error("Error in /V1/exam:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Unknown error occurred",
      code: "EXAM_CONTEXT_API_ERROR",
    });
  }
});

// Route to flush/clear session context
router.delete("/V1/exam/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required",
        code: "EXAM_VALIDATION_ERROR",
      });
    }

    // Check if session exists
    const sessionExists = sessionContexts.has(sessionId);

    if (sessionExists) {
      // Delete the session context
      sessionContexts.delete(sessionId);

      return res.status(200).json({
        success: true,
        message: "Session context flushed successfully",
        data: {
          sessionId,
          flushed: true,
        },
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Session not found",
        code: "SESSION_NOT_FOUND",
        data: {
          sessionId,
          flushed: false,
        },
      });
    }
  } catch (err) {
    console.error("Error in /V1/exam/session/:sessionId DELETE:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Unknown error occurred",
      code: "EXAM_SESSION_FLUSH_ERROR",
    });
  }
});

// Route to flush all session contexts (admin/maintenance endpoint)
router.delete("/V1/exam/sessions/all", async (req, res) => {
  try {
    const sessionCount = sessionContexts.size;

    // Clear all session contexts
    sessionContexts.clear();

    return res.status(200).json({
      success: true,
      message: "All session contexts flushed successfully",
      data: {
        flushedSessionCount: sessionCount,
      },
    });
  } catch (err) {
    console.error("Error in /V1/exam/sessions/all DELETE:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Unknown error occurred",
      code: "EXAM_ALL_SESSIONS_FLUSH_ERROR",
    });
  }
});

// Route to get session information (for debugging/monitoring)
router.get("/V1/exam/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required",
        code: "EXAM_VALIDATION_ERROR",
      });
    }

    const sessionHistory = sessionContexts.get(sessionId);

    if (sessionHistory) {
      return res.status(200).json({
        success: true,
        message: "Session information retrieved successfully",
        data: {
          sessionId,
          exists: true,
          messageCount: sessionHistory.length,
          questionCount: sessionHistory.filter((h) => h.role === "user").length,
          lastActivity: sessionHistory.length > 0 ? "Recent" : "None",
        },
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Session not found",
        code: "SESSION_NOT_FOUND",
        data: {
          sessionId,
          exists: false,
        },
      });
    }
  } catch (err) {
    console.error("Error in /V1/exam/session/:sessionId GET:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Unknown error occurred",
      code: "EXAM_SESSION_INFO_ERROR",
    });
  }
});

module.exports = router;
