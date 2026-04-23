import { useState } from 'react';
import UploadSection from './components/UploadSection';
import ChatInterface from './components/ChatInterface';

function App() {
  const [documentsIndexed, setDocumentsIndexed] = useState(() => {
    return localStorage.getItem('documentsIndexed') === 'true';
  });

  const handleUploadSuccess = () => {
    setDocumentsIndexed(true);
    localStorage.setItem('documentsIndexed', 'true');
  };

  const handleDeleteSuccess = () => {
    setDocumentsIndexed(false);
    localStorage.removeItem('documentsIndexed');
    localStorage.removeItem('chatMessages');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              AI
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              DocIntel RAG
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${documentsIndexed ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></span>
              {documentsIndexed ? 'Ready to Chat' : 'Waiting for Documents'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 flex flex-col md:flex-row gap-6 h-[calc(100vh-4rem)]">
        {/* Left Column - Upload */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
          <UploadSection onUploadSuccess={handleUploadSuccess} onDeleteSuccess={handleDeleteSuccess} />
          
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex-1">
            <h3 className="font-semibold mb-2 text-slate-200">How it works</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">1.</span>
                Upload a PDF or TXT document containing your knowledge base.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">2.</span>
                We chunk and index the text using Sentence Transformers and Pinecone.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">3.</span>
                Ask questions! We retrieve the most relevant chunks and use Groq's Llama-3 to answer.
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column - Chat */}
        <div className="w-full md:w-2/3 h-full pb-4">
          <ChatInterface key={documentsIndexed ? 'ready' : 'empty'} isReady={documentsIndexed} />
        </div>
      </main>
    </div>
  );
}

export default App;
