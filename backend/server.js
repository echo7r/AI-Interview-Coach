const PDFDocument = require("pdfkit");
const express = require("express");
const cors = require("cors");
//const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

require("dotenv").config();

const app = express();

// const genAI = new GoogleGenerativeAI(
//   process.env.GEMINI_API_KEY
// );
    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
});
let interviewState = {
  difficulty: "easy",
  questionCount: 0,
  totalScore: 0,
};

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "AI Interview Coach Backend Running",
  });
});

app.post("/start-interview", (req, res) => {
  const { role } = req.body;

  interviewState = {
    difficulty: "easy",
    questionCount: 1,
    totalScore: 0,
  };

  let firstQuestion = "";

  switch (role) {
    case "Software Engineer":
      firstQuestion =
        "Tell me about yourself and your technical background.";
      break;

    case "Frontend Developer":
      firstQuestion =
        "What frontend technologies are you most comfortable with?";
      break;

    case "Backend Developer":
      firstQuestion =
        "Explain a backend project you have worked on.";
      break;

    case "Data Analyst":
      firstQuestion =
        "What tools do you use for data analysis?";
      break;

    case "HR":
      firstQuestion =
        "Why did you choose a career in Human Resources?";
      break;

    case "Sales":
      firstQuestion =
        "How would you handle an unhappy customer?";
      break;

    default:
      firstQuestion = "Tell me about yourself.";
  }

  res.json({
    success: true,
    role,
    firstQuestion,
  });
});

app.post("/next-question", async (req, res) => {
  try {
    const { role, answer, currentQuestion, history } = req.body;

    // const model = genAI.getGenerativeModel({
    //   model: "gemini-2.5-flash",
    // });

    const prompt = `
You are a professional interviewer.

Role: ${role}

Interview History:
${JSON.stringify(history, null, 2)}

Current Difficulty:
${interviewState.difficulty}

Current Question:
${currentQuestion}

Latest Answer:
${answer}

Evaluate the latest answer.

Rules:
1. Give a score from 1-10.
2. Determine difficulty:
   - score 1-4 => easy
   - score 5-7 => medium
   - score 8-10 => hard
3. Ask ONE follow-up interview question.
4. Do not repeat previous questions.
5. Return ONLY valid JSON.

Return format:

{
  "score": 8,
  "difficulty": "hard",
  "nextQuestion": "Your question here"
}
`;

const completion =
  await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
  });

const responseText =
  completion.choices[0].message.content.trim();

    // remove markdown wrappers if Gemini returns ```json
    const cleanText = responseText
    .replace(/```json\s*/g, "")
    .replace(/```/g, "")
    .trim();

const parsed = JSON.parse(cleanText);

// Update interview state
interviewState.questionCount += 1;
if (interviewState.questionCount > 15) {
  return res.json({
    interviewCompleted: true,
    averageScore:
      interviewState.totalScore /
      (interviewState.questionCount - 1),
    history,
  });
}
interviewState.totalScore += parsed.score;

// Difficulty adjustment
if (parsed.score >= 8) {
  if (interviewState.difficulty === "easy") {
    interviewState.difficulty = "medium";
  } else if (interviewState.difficulty === "medium") {
    interviewState.difficulty = "hard";
  }
}

if (parsed.score <= 4) {
  if (interviewState.difficulty === "hard") {
    interviewState.difficulty = "medium";
  } else if (interviewState.difficulty === "medium") {
    interviewState.difficulty = "easy";
  }
}

res.json({
  nextQuestion: parsed.nextQuestion,
  score: parsed.score,
  difficulty: interviewState.difficulty,
  questionCount: interviewState.questionCount,
});

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to generate question",
    });
  }
});
app.post("/generate-feedback", async (req, res) => {
  try {
    const { role, history, averageScore } = req.body;

    const prompt = `
You are a senior technical interviewer.

Role: ${role}

Average Score: ${averageScore}

Interview History:
${JSON.stringify(history, null, 2)}

Analyze the candidate fairly.

Do not penalize the candidate for being a fresher.

Evaluate based on:
- Technical understanding
- Problem solving
- Communication
- Project knowledge

Return ONLY valid JSON.

{
  "overallScore": 8,
  "technicalScore": 8,
  "communicationScore": 7,
  "problemSolvingScore": 8,
  "strengths": [],
  "weaknesses": [],
  "recommendation": ""
}
`;

    const completion =
      await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      });

    const responseText =
      completion.choices[0].message.content.trim();

    const cleanText = responseText
      .replace(/```json\s*/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanText);

    res.json(parsed);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to generate feedback",
    });
  }
});
app.post("/download-report", async (req, res) => {
  try {
    const {
      overallScore,
      strengths,
      weaknesses,
      recommendation,
    } = req.body;

    const doc = new PDFDocument();

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Interview-Report.pdf"
    );

    doc.pipe(res);

    doc.fontSize(22)
       .text("AI Interview Report");

    doc.moveDown();

    doc.fontSize(16)
       .text(`Overall Score: ${overallScore}`);

    doc.moveDown();

    doc.fontSize(18)
       .text("Strengths");

    strengths.forEach((item) => {
      doc.fontSize(14).text(`• ${item}`);
    });

    doc.moveDown();

    doc.fontSize(18)
       .text("Weaknesses");

    weaknesses.forEach((item) => {
      doc.fontSize(14).text(`• ${item}`);
    });

    doc.moveDown();

    doc.fontSize(18)
       .text("Recommendation");

    doc.fontSize(14)
       .text(recommendation);

    doc.end();

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to generate PDF",
    });
  }
});
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});