import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlashCardProps {
  question: string;
  options: string[];
  correct: number;
  selected: number | null;
  onSelect: (idx: number) => void;
  showAnswer: boolean;
  onFlip: () => void;
}

export const FlashCard: React.FC<FlashCardProps> = ({
  question,
  options,
  correct,
  selected,
  onSelect,
  showAnswer,
  onFlip,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto my-4">
      <div className={cn(
        "relative w-full h-64 transition-transform duration-500 [perspective:1000px]",
        showAnswer ? "[transform:rotateY(180deg)]" : ""
      )}>
        {/* Front Side */}
        <Card className={cn(
          "absolute w-full h-full backface-hidden z-10",
          showAnswer ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"
        )}>
          <CardContent className="flex flex-col justify-center h-full p-6">
            <div className="mb-4 text-lg font-semibold text-foreground">{question}</div>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <Button
                  key={idx}
                  variant={selected === idx ? "default" : "outline"}
                  className={cn("w-full text-left", selected === idx && "ring-2 ring-primary")}
                  onClick={() => onSelect(idx)}
                  disabled={selected !== null}
                >
                  {opt}
                </Button>
              ))}
            </div>
            <Button
              className="mt-6 w-full bg-primary text-primary-foreground"
              onClick={onFlip}
              disabled={selected === null}
            >
              Lihat Jawaban
            </Button>
          </CardContent>
        </Card>
        {/* Back Side */}
        <Card className="absolute w-full h-full [transform:rotateY(180deg)] backface-hidden z-20">
          <CardContent className="flex flex-col justify-center h-full p-6 items-center">
            <div className="mb-4 text-lg font-semibold text-foreground">{question}</div>
            <div className="mb-4">
              {selected === correct ? (
                <span className="text-green-600 font-bold">Jawaban kamu benar!</span>
              ) : (
                <span className="text-red-600 font-bold">Jawaban kamu salah.</span>
              )}
            </div>
            <div className="mb-2 text-foreground">Jawaban yang benar:</div>
            <div className="mb-4 text-primary font-semibold">{options[correct]}</div>
            <Button className="w-full" onClick={onFlip}>
              Kembali
            </Button>
          </CardContent>
        </Card>
      </div>
      <style jsx>{`
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}; 