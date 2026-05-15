"use client";

import { useState } from "react";
import axios from "axios";

export default function Home() {

  // Backend URL
  const API_URL = "https://pdf-rag-chatbot-2-um68.onrender.com";

  // States
  const [file, setFile] = useState<File | null>(null);

  const [question, setQuestion] = useState("");

  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(false);

  // =========================
  // Upload PDF
  // =========================

  const uploadPDF = async () => {

    if (!file) {
      alert("Please select a PDF");
      return;
    }

    try {

      setLoading(true);

      const formData = new FormData();

      formData.append("file", file);

      const response = await axios.post(
        `${API_URL}/upload-pdf`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(response.data.message);

    } catch (error) {

      console.log(error);

      alert("Failed to upload PDF");

    } finally {

      setLoading(false);
    }
  };

  // =========================
  // Ask Question
  // =========================

  const askQuestion = async () => {

    if (!question.trim()) {
      alert("Please enter a question");
      return;
    }

    try {

      setLoading(true);

      setAnswer("");

      const response = await axios.post(
        `${API_URL}/ask`,
        {
          question: question,
        }
      );

      setAnswer(response.data.answer);

    } catch (error) {

      console.log(error);

      alert("Failed to get answer");

    } finally {

      setLoading(false);
    }
  };

  // =========================
  // UI
  // =========================

  return (

    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white flex items-center justify-center p-6">

      <div className="w-full max-w-5xl bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8 space-y-8">

        {/* Heading */}

        <div className="text-center space-y-3">

          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            PDF RAG Chatbot
          </h1>

          <p className="text-gray-300 text-lg">
            Upload PDF files and ask intelligent questions.
          </p>

        </div>

        {/* Upload Section */}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">

          <h2 className="text-2xl font-semibold text-cyan-300">
            Upload PDF
          </h2>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {

              if (e.target.files) {
                setFile(e.target.files[0]);
              }

            }}
            className="w-full p-3 rounded-xl bg-black/30 border border-white/20"
          />

          <button
            onClick={uploadPDF}
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 transition-all duration-300 text-white font-semibold py-3 rounded-xl"
          >
            {loading ? "Uploading..." : "Upload PDF"}
          </button>

        </div>

        {/* Ask Question Section */}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">

          <h2 className="text-2xl font-semibold text-blue-300">
            Ask Question
          </h2>

          <textarea
            placeholder="Ask anything from the PDF..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full h-32 p-4 rounded-xl bg-black/30 border border-white/20 text-white outline-none resize-none"
          />

          <button
            onClick={askQuestion}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-300 text-white font-semibold py-3 rounded-xl"
          >
            {loading ? "Generating Answer..." : "Ask Question"}
          </button>

        </div>

        {/* Answer Section */}

        {answer && (

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">

            <h2 className="text-2xl font-semibold text-green-300">
              Answer
            </h2>

            <div className="bg-black/30 p-5 rounded-xl whitespace-pre-wrap leading-relaxed text-gray-200">
              {answer}
            </div>

          </div>

        )}

      </div>

    </main>
  );
}