import { useState, useRef } from 'react';

export default function UploadSection({ onUploadSuccess, onDeleteSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');
  const [persistedFileName, setPersistedFileName] = useState(() => localStorage.getItem('uploadedFileName') || null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    if (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain') {
      setFile(selectedFile);
      setUploadStatus(null);
      setMessage('');
    } else {
      setUploadStatus('error');
      setMessage('Please upload a PDF or TXT file.');
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent opening file dialog
    if (!persistedFileName) return;

    setIsDeleting(true);
    setUploadStatus(null);
    setMessage('Deleting document from Pinecone...');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const response = await fetch(`${API_URL}/delete?filename=${encodeURIComponent(persistedFileName)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUploadStatus('success');
        setMessage('Document deleted successfully.');
        localStorage.removeItem('uploadedFileName');
        localStorage.removeItem('chatMessages'); // Clear chat before triggering remount
        setPersistedFileName(null);
        setFile(null);
        if (onDeleteSuccess) onDeleteSuccess();
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Delete failed');
      }
    } catch (error) {
      setUploadStatus('error');
      setMessage(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);
    setMessage('Processing and indexing...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setMessage(data.message);
        localStorage.setItem('uploadedFileName', file.name);
        setPersistedFileName(file.name);
        onUploadSuccess();
      } else {
        throw new Error(data.detail || 'Upload failed');
      }
    } catch (error) {
      setUploadStatus('error');
      setMessage(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        Upload Knowledge
      </h2>
      
      <div 
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer
          ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/20'}
          ${uploadStatus === 'success' ? 'border-emerald-500/50 bg-emerald-500/5' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          accept=".pdf,.txt"
        />
        
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-slate-400 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        
        {file ? (
          <div className="text-slate-200 font-medium truncate max-w-full px-4">{file.name}</div>
        ) : persistedFileName ? (
          <div className="text-emerald-400 font-medium truncate max-w-full px-4 flex flex-col gap-3 items-center relative z-10">
            <span>Active: {persistedFileName}</span>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm rounded-lg transition-colors border border-rose-500/20 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {isDeleting ? 'Deleting...' : 'Delete Document'}
            </button>
          </div>
        ) : (
          <>
            <p className="text-slate-300 font-medium mb-1">Click to upload or drag & drop</p>
            <p className="text-xs text-slate-500">PDF or TXT up to 10MB</p>
          </>
        )}
      </div>

      {file && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className={`w-full py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2
            ${isUploading 
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
            }
          `}
        >
          {isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : 'Index Document'}
        </button>
      )}

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
          uploadStatus === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
          uploadStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
          'bg-slate-700/50 text-slate-300'
        }`}>
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
