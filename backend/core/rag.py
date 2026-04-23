import os
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from pinecone import Pinecone
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document

PINECONE_INDEX_NAME = "docintel-rag"

def get_embeddings():
    # Use FastEmbed (ONNX) to save massive amounts of RAM instead of PyTorch
    # Default model BAAI/bge-small-en-v1.5 outputs 384 dimensions (matches our Pinecone index)
    return FastEmbedEmbeddings()

def process_document(file_path: str) -> int:
    # 1. Load Document
    if file_path.endswith('.pdf'):
        loader = PyPDFLoader(file_path)
    elif file_path.endswith('.txt'):
        loader = TextLoader(file_path)
    else:
        raise ValueError("Unsupported file type")
    
    docs = loader.load()
    
    # 2. Split Document into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        add_start_index=True
    )
    chunks = text_splitter.split_documents(docs)
    
    # 3. Create Embeddings and Store in Pinecone
    embeddings = get_embeddings()
    pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
    
    # Ensure index exists (optional check)
    if PINECONE_INDEX_NAME not in pc.list_indexes().names():
        raise Exception(f"Pinecone index '{PINECONE_INDEX_NAME}' does not exist. Please create it.")
        
    index = pc.Index(PINECONE_INDEX_NAME)
    
    # Manually encode and upsert
    vectors = []
    for i, chunk in enumerate(chunks):
        vector = embeddings.embed_query(chunk.page_content)
        vectors.append({
            "id": f"chunk-{i}-{os.path.basename(file_path)}",
            "values": vector,
            "metadata": {"text": chunk.page_content, "source": file_path}
        })
        
        # Batch upsert
        if len(vectors) >= 100:
            index.upsert(vectors=vectors)
            vectors = []
            
    if vectors:
        index.upsert(vectors=vectors)
        
    return len(chunks)

def delete_document(file_path: str):
    """Deletes all chunks associated with a specific file from Pinecone."""
    pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
    index = pc.Index(PINECONE_INDEX_NAME)
    
    # We use a metadata filter to delete only the vectors belonging to this file
    try:
        index.delete(filter={"source": file_path})
    except Exception as e:
        print(f"Error deleting from Pinecone: {e}")

def chat_with_rag(query: str) -> str:
    # 1. Setup Pinecone Retriever
    embeddings = get_embeddings()
    pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
    index = pc.Index(PINECONE_INDEX_NAME)
    
    # 1. Retrieve
    query_vector = embeddings.embed_query(query)
    search_results = index.query(vector=query_vector, top_k=5, include_metadata=True)
    
    context_text = "\n\n".join([match["metadata"]["text"] for match in search_results["matches"]])
    
    # 2. Setup Groq LLM
    llm = ChatGroq(
        api_key=os.environ.get("GROQ_API_KEY"),
        model_name=os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    )
    
    # 3. Create Prompt Template
    system_prompt = (
        "You are an intelligent assistant for document question-answering. "
        "Use the following pieces of retrieved context to answer the user's question. "
        "If you don't know the answer based on the context, say that you don't know. "
        "Keep your answer concise but informative.\n\n"
        f"Context:\n{context_text}"
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])
    
    # 4. Create and run the chain
    chain = prompt | llm
    response = chain.invoke({"input": query})
    
    return response.content
