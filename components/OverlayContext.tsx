"use client"

import React, { createContext, useContext, useState, ReactNode } from "react";

interface OverlayContextType {
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
  generationProgress: { module: number; lesson: number; totalModules: number; totalLessons: number };
  setGenerationProgress: (val: { module: number; lesson: number; totalModules: number; totalLessons: number }) => void;
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export const useOverlay = () => {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlay must be used within OverlayProvider");
  return ctx;
};

export const OverlayProvider = ({ children }: { children: ReactNode }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ module: 0, lesson: 0, totalModules: 0, totalLessons: 0 });

  return (
    <OverlayContext.Provider value={{ isGenerating, setIsGenerating, generationProgress, setGenerationProgress }}>
      {children}
      {isGenerating && (
        <div className="fixed inset-0 z-[10000] w-screen h-screen bg-black bg-opacity-40 flex flex-col items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg flex flex-col items-center max-w-md">
            <div className="text-lg font-bold mb-2 text-foreground">
              Sedang generate lesson {generationProgress.lesson} dari {generationProgress.totalLessons}...
            </div>
            <div className="w-64 mb-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.round((generationProgress.lesson / (generationProgress.totalLessons || 1)) * 100)}%` }}></div>
              </div>
            </div>
            <div className="text-muted-foreground text-sm text-center mb-4">
              Mohon tunggu, proses ini bisa memakan waktu beberapa menit.
            </div>
            {/* Peringatan AI Hallucination */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 w-full">
              <div className="flex items-start gap-3">
                <div className="text-amber-600 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-amber-800 mb-1">Peringatan AI</div>
                  <div className="text-amber-700">
                    Course ini dibuat dengan AI menggunakan informasi web terkini untuk memastikan akurasi informasi. Meskipun konten telah diverifikasi dari sumber terpercaya, <strong>mohon periksa kembali konten yang dihasilkan untuk memastikan relevansi dengan kebutuhan Anda.</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </OverlayContext.Provider>
  );
}; 