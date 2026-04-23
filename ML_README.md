# DocIntel RAG - Machine Learning Concepts

This document explains the core Machine Learning concepts and mathematics powering the DocIntel Retrieval-Augmented Generation (RAG) application.

## 1. What is RAG?

**Retrieval-Augmented Generation (RAG)** is an architectural pattern that improves the efficacy of Large Language Models (LLMs) by grounding them with external knowledge. 
Standard LLMs are trained on vast amounts of data up to a certain cutoff point. They cannot know your personal, private, or recent documents. RAG solves this by:
1. **Retrieving** relevant information from a database (using your document).
2. **Augmenting** the user's prompt with this retrieved information.
3. **Generating** an answer using the LLM.

## 2. Text Embeddings

To find relevant text, we must convert text into numbers that a computer can understand and compare. This is called an **Embedding**.

In this project, we use `sentence-transformers/all-MiniLM-L6-v2`. This model takes a chunk of text and maps it into a **384-dimensional dense vector space**.

Mathematically, a piece of text $T$ is transformed into a vector $\vec{v}$:
$$ \vec{v} = [v_1, v_2, v_3, ..., v_{384}] \in \mathbb{R}^{384} $$

The beauty of embeddings is that texts with similar semantic meanings will be mapped to vectors that are close to each other in this 384-dimensional space.

## 3. Vector Similarity Search (Cosine Similarity)

Once all chunks of your document are stored as vectors in **Pinecone**, how do we find the relevant ones when a user asks a question?

1. The user's question is also converted into a 384-dimensional vector $\vec{q}$.
2. Pinecone compares $\vec{q}$ against all document chunk vectors $\vec{d_i}$ in the database.

The comparison metric used is **Cosine Similarity**, which measures the cosine of the angle $\theta$ between two vectors. It focuses on the orientation (meaning) rather than the magnitude (length) of the vectors.

$$ \text{Cosine Similarity}(\vec{q}, \vec{d_i}) = \cos(\theta) = \frac{\vec{q} \cdot \vec{d_i}}{\|\vec{q}\| \|\vec{d_i}\|} $$

Where:
- $\vec{q} \cdot \vec{d_i} = \sum_{j=1}^{384} q_j d_{ij}$ (The Dot Product)
- $\|\vec{q}\| = \sqrt{\sum_{j=1}^{384} q_j^2}$ (The Magnitude of the question vector)
- $\|\vec{d_i}\| = \sqrt{\sum_{j=1}^{384} d_{ij}^2}$ (The Magnitude of the document vector)

A Cosine Similarity close to `1` means the vectors point in the same direction (highly similar meaning). A score close to `0` means they are orthogonal (unrelated). The system retrieves the top $k$ chunks with the highest cosine similarity scores.

## 4. Text Generation (Groq Llama-3)

After retrieving the top $k$ most relevant text chunks, we construct a prompt for the LLM.

The prompt looks something like this:
```
System: You are an intelligent assistant. Use the following context to answer the user.
Context: [Chunk 1] [Chunk 2] [Chunk 3]

User: [User's Question]
```

We send this prompt to **Llama-3.3-70b-versatile** via the Groq API.
Llama-3 is a transformer-based auto-regressive language model. It generates the answer one token at a time by calculating the probability distribution of the next token given all previous tokens, heavily conditioned by the `Context` we provided.

$$ P(w_t | w_1, w_2, ..., w_{t-1}, C) $$
Where $C$ is the retrieved context. This grounds the model's answer in your actual document, significantly reducing hallucinations.
