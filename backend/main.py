from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
from langchain_community.vectorstores import Chroma

from dotenv import load_dotenv

from openai import OpenAI

import shutil
import os

# =========================
# Load Environment Variables
# =========================

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# =========================
# OpenRouter Client
# =========================

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

# =========================
# Create Upload Folder
# =========================

os.makedirs("uploads", exist_ok=True)

# =========================
# Create FastAPI App
# =========================

app = FastAPI()

# =========================
# Enable CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Embedding Model
# =========================

embedding_model = HuggingFaceInferenceAPIEmbeddings(
    api_key=os.getenv("HUGGINGFACE_API_KEY"),
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# =========================
# Request Model
# =========================

class QuestionRequest(BaseModel):
    question: str

# =========================
# Home Route
# =========================

@app.get("/")
def home():
    return {
        "message": "PDF RAG Chatbot Backend Running"
    }

# =========================
# Upload PDF API
# =========================

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    try:

        # Save PDF
        file_path = f"uploads/{file.filename}"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Load PDF
        loader = PyPDFLoader(file_path)

        documents = loader.load()

        # Split Text
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

        texts = text_splitter.split_documents(documents)

        # Store in ChromaDB
        vectordb = Chroma.from_documents(
            documents=texts,
            embedding=embedding_model,
            persist_directory="chroma_db"
        )

        vectordb.persist()

        return {
            "message": "PDF uploaded successfully"
        }

    except Exception as e:
        return {
            "error": str(e)
        }

# =========================
# Ask Question API
# =========================

@app.post("/ask")
async def ask_question(request: QuestionRequest):

    try:

        question = request.question

        # Load Vector DB
        vectordb = Chroma(
            persist_directory="chroma_db",
            embedding_function=embedding_model
        )

        # Retriever
        retriever = vectordb.as_retriever(
            search_kwargs={"k": 3}
        )

        docs = retriever.invoke(question)

        # No docs found
        if not docs:
            return {
                "answer": "No relevant content found in PDF."
            }

        # Create context
        context = "\n\n".join(
            [doc.page_content for doc in docs]
        )

        # Prompt
        prompt = f"""
You are a PDF assistant.

Answer ONLY from the PDF context.

Do NOT use outside knowledge.

If answer is not found in context,
reply:
Answer not found in document.

Context:
{context}

Question:
{question}
"""

        # OpenRouter API Call
        completion = client.chat.completions.create(
            model="openai/gpt-3.5-turbo",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        answer = completion.choices[0].message.content

        return {
            "answer": answer
        }

    except Exception as e:
        return {
            "error": str(e)
        }