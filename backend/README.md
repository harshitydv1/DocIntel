# DocIntel RAG - Backend

This is the backend server for the DocIntel Retrieval-Augmented Generation (RAG) system. It is built using **FastAPI** and handles all of the Machine Learning logic.

### Tech Stack
- **FastAPI**: Provides high-performance REST endpoints (`/upload` and `/chat`).
- **Sentence-Transformers**: Generates 384-dimensional mathematical embeddings locally.
- **Pinecone**: Cloud Vector Database for storing and retrieving document vectors.
- **Groq & Llama-3**: Powers the incredibly fast LLM text generation based on the retrieved context.

## 🚀 How to Start Locally

1. **Create a Virtual Environment**
   Navigate to the `backend` folder and create a python virtual environment:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

2. **Install Dependencies**
   Install the required Python libraries:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set Up Environment Variables**
   Create a `.env` file in the root of the `backend` directory and add your secret API keys:
   ```env
   GROQ_API_KEY=your_groq_key_here
   PINECONE_API_KEY=your_pinecone_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   ```

4. **Start the Server**
   Start the FastAPI server using Uvicorn. We specify port 8001 to avoid conflicts:
   ```bash
   uvicorn main:app --port 8001 --reload --env-file .env
   ```
   The API will now be running at `http://localhost:8001`.

## ☁️ Deployment
This backend is fully prepared to be deployed on **Render** using the `render.yaml` blueprint located in the root of the repository. No manual server configuration is required.
