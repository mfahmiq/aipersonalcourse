/**
 * Overlay Context
 * Context React untuk menampilkan overlay progress saat proses generate konten kursus
 * Digunakan untuk menampilkan loading/progress bar di seluruh aplikasi
 */

"use client"

import React, { createContext, useContext, useState, ReactNode } from "react";

/**
 * Tipe context untuk overlay progress
 * - isGenerating: apakah proses generate sedang berjalan
 * - setIsGenerating: setter untuk isGenerating
 * - generationProgress: progress pembuatan konten (modul, lesson, dsb)
 * - setGenerationProgress: setter untuk generationProgress
 */
interface OverlayContextType {
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
  generationProgress: { module: number; lesson: number; totalModules: number; totalLessons: number; currentLessonName: string };
  setGenerationProgress: (val: { module: number; lesson: number; totalModules: number; totalLessons: number; currentLessonName: string }) => void;
}

// Membuat context React untuk overlay
const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

/**
 * Custom hook untuk menggunakan OverlayContext
 * Harus dipakai di dalam OverlayProvider
 */
export const useOverlay = () => {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlay must be used within OverlayProvider");
  return ctx;
};

/**
 * OverlayProvider
 * Provider context untuk overlay progress generate konten kursus
 * Menyediakan state dan setter untuk isGenerating dan generationProgress
 * Menampilkan overlay loading saat isGenerating true
 *
 * @param children - Komponen anak yang dibungkus provider
 */
export const OverlayProvider = ({ children }: { children: ReactNode }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ module: 0, lesson: 0, totalModules: 0, totalLessons: 0, currentLessonName: "" });

  return (
    <OverlayContext.Provider value={{ isGenerating, setIsGenerating, generationProgress, setGenerationProgress }}>
      {children}
      {isGenerating && (
        <div className="fixed inset-0 z-[10000] w-screen h-screen bg-black/40 dark:bg-black/60 flex flex-col items-center justify-center">
          <div className="bg-background p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-semibold text-foreground">Sedang Membuat Konten Kursus</span>
            </div>
            <div className="text-3xl font-bold text-primary mb-1">{generationProgress.lesson}/{generationProgress.totalLessons}</div>
            <div className="text-sm text-muted-foreground mb-4">Materi Dibuat</div>
            <div className="w-full mb-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${Math.round((generationProgress.lesson / (generationProgress.totalLessons || 1)) * 100)}%` }}></div>
              </div>
            </div>
            <div className="text-sm text-foreground text-center mb-4">
              {generationProgress.currentLessonName || "-"}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <svg className="animate-spin h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
              Proses ini mungkin memerlukan beberapa menit...
            </div>
          </div>
        </div>
      )}
    </OverlayContext.Provider>
  );
}; 