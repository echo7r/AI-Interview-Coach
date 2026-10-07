"use client";

import { useState } from "react";

export default function Home() {
  const [role, setRole] = useState("Software Engineer");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [difficulty, setDifficulty] = useState("easy");
  const [averageScore, setAverageScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [scores, setScores] = useState<number[]>([]);

  const startInterview = async () => {
    const response = await fetch(
      "http://localhost:5000/start-interview",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      }
    );

    const data = await response.json();
    setQuestion(data.firstQuestion);
    setQuestionCount(1);
    setDifficulty("easy");
    setAverageScore(0);

    setHistory([
      {
        question: data.firstQuestion,
        answer: "",
      },
    ]);
  };

  const submitAnswer = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/next-question",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role,
            answer,
            currentQuestion: question,
            history,
          }),
        }
      );

      const data = await response.json();
      if (data.difficulty) {
        setDifficulty(data.difficulty);
}
      if (data.score) {
        setScores((prev) => [...prev, data.score]);
      }
      if (data.interviewCompleted) {
  const feedbackResponse = await fetch(
    "http://localhost:5000/generate-feedback",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role,
        history,
        averageScore: data.averageScore,
      }),
    }
  );

  const feedbackData =
    await feedbackResponse.json();

  setFeedback(feedbackData);
//-------------------------------------------------------------
  return;
}
      if (!response.ok) {
        alert("AI is busy. Please try again.");
        setLoading(false);
        return;
}

      const updatedHistory = [...history];

      updatedHistory[updatedHistory.length - 1].answer = answer;

      updatedHistory.push({
        question: data.nextQuestion,
        answer: "",
      });

      setHistory(updatedHistory);

      setQuestion(data.nextQuestion);

      setDifficulty(data.difficulty);

      setQuestionCount(data.questionCount);

      setAverageScore(
        (prev) =>
          ((prev * (data.questionCount - 1)) + data.score) /
          data.questionCount
      );

      setAnswer("");
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };
const downloadReport = async () => {
  if (!feedback) return;

  const response = await fetch(
    "http://localhost:5000/download-report",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        overallScore: feedback.overallScore,
        strengths: feedback.strengths,
        weaknesses: feedback.weaknesses,
        recommendation: feedback.recommendation,
      }),
    }
  );

  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "Interview-Report.pdf";

  document.body.appendChild(link);

  link.click();

  link.remove();
};
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">
        AI Interview Coach
      </h1>

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="border p-3 rounded"
      >
        <option>Software Engineer</option>
        <option>Frontend Developer</option>
        <option>Backend Developer</option>
        <option>Data Analyst</option>
        <option>HR</option>
        <option>Sales</option>
      </select>

      <button
        onClick={startInterview}
        className="bg-black text-white px-6 py-3 rounded"
      >
        Start Interview
      </button>

      {question && (
        
        <>
          <div className="flex gap-6 text-sm">
            <span>Question: {questionCount}/15</span>
            <span>Difficulty: {difficulty}</span>
            <span>Average Score: {averageScore.toFixed(1)}</span>
          </div>
          <div className="text-xl font-medium max-w-2xl text-center">
            {question}
          </div>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="border p-3 rounded w-full max-w-xl h-32"
          />

          <button
            onClick={submitAnswer}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded"
          >
            {loading ? "AI is thinking..." : "Submit Answer"}
          </button>
        </>
      )}
      {scores.length > 0 && (
  <div className="border p-6 rounded max-w-2xl w-full">
    <h2 className="text-2xl font-bold mb-4">
      Interview Analytics
    </h2>

    {scores.map((score, index) => (
      <div
        key={index}
        className="flex justify-between border-b py-2"
      >
        <span>
          Question {index + 1}
        </span>

        <span>
          Score: {score}/10
        </span>
      </div>
    ))}
  </div>
)}
      {feedback && (
  <div className="border p-6 rounded max-w-2xl w-full mt-8">
    <h2 className="text-2xl font-bold mb-4">
      Interview Report
    </h2>

    <p>
      <strong>Overall Score:</strong>{" "}
      {feedback.overallScore}
    </p>

    <p className="mt-4 font-semibold">
      Strengths
    </p>

    <ul className="list-disc ml-6">
      {feedback.strengths?.map(
        (item: string, index: number) => (
          <li key={index}>{item}</li>
        )
      )}
    </ul>

    <p className="mt-4 font-semibold">
      Weaknesses
    </p>

    <ul className="list-disc ml-6">
      {feedback.weaknesses?.map(
        (item: string, index: number) => (
          <li key={index}>{item}</li>
        )
      )}
    </ul>

    <p className="mt-4">
      <strong>Recommendation:</strong>{" "}
      {feedback.recommendation}
    </p>
    <button
      onClick={downloadReport}
      className="bg-green-600 text-white px-4 py-2 rounded mt-6"
    >
      Download PDF Report
    </button>
  </div>
)}
    </main>
  );
}