"use client";

import { useState } from "react";

export default function Home() {
  const [role, setRole] = useState("Software Engineer");
  const [question, setQuestion] = useState("");

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
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
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
        <div className="mt-4 text-xl font-medium">
          {question}
        </div>
      )}
    </main>
  );
}