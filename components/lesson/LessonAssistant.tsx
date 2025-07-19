/**
 * Lesson Assistant Component
 * Komponen chat assistant untuk membantu user dalam pembelajaran
 * Menyediakan interface chat dengan AI untuk pertanyaan seputar pelajaran
 */

import React, { useState, ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

/**
 * Interface untuk props LessonAssistant
 */
interface LessonAssistantProps {
  showAssistant: boolean                    // State untuk menampilkan/menyembunyikan assistant
  setShowAssistant: (show: boolean) => void // Function untuk mengubah state assistant
  chatHistory: { role: string; content: string }[] // Riwayat chat
  userMessage: string                       // Pesan user saat ini
  setUserMessage: (msg: string) => void     // Function untuk mengubah pesan user
  handleAssistantSubmit: (e: React.FormEvent) => void // Handler untuk submit chat
}

/**
 * ChatMessage Component (Memoized)
 * Component untuk menampilkan pesan chat dengan styling yang berbeda untuk user dan assistant
 * 
 * @param msg - Object berisi role dan content pesan
 * @returns JSX element untuk pesan chat
 */
const ChatMessage = React.memo(function ChatMessage({ msg }: { msg: { role: string, content: string } }) {
  // Styling untuk pesan dari assistant
  if (msg.role === "assistant") {
    return (
      <div className="p-2 rounded-lg w-full break-words whitespace-pre-line bg-primary/10 mr-auto">
        <ReactMarkdown
          components={{
            // Custom component untuk code blocks
            code(props: {node?: any, inline?: boolean, className?: string, children?: ReactNode}) {
              const {inline, className, children, ...rest} = props;
              return inline ? (
                // Inline code styling
                <code className={className} {...rest}>{children}</code>
              ) : (
                // Code block styling dengan background dan border
                <pre className="bg-muted border rounded p-2" style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                  <code className={className} {...rest}>{children}</code>
                </pre>
              );
            },
            // Custom component untuk paragraph
            p({ children }) {
              // Jika children mengandung <pre>, render langsung tanpa <p>
              if (
                Array.isArray(children) &&
                children.some(child => (child as any)?.type === 'pre')
              ) {
                return <>{children}</>;
              }
              return <p>{children}</p>;
            }
          }}
        >{msg.content}</ReactMarkdown>
      </div>
    );
  }
  
  // Styling untuk pesan dari user
  return (
    <div className="p-2 rounded-lg w-full break-words whitespace-pre-line bg-muted ml-auto">
      {msg.content}
    </div>
  );
});

/**
 * LessonAssistant Component
 * Component utama untuk chat assistant dalam pembelajaran
 * 
 * @param showAssistant - State untuk menampilkan/menyembunyikan assistant
 * @param setShowAssistant - Function untuk mengubah state assistant
 * @param chatHistory - Riwayat chat
 * @param userMessage - Pesan user saat ini
 * @param setUserMessage - Function untuk mengubah pesan user
 * @param handleAssistantSubmit - Handler untuk submit chat
 * @returns JSX element untuk lesson assistant
 */
export const LessonAssistant: React.FC<LessonAssistantProps> = ({
  showAssistant,
  setShowAssistant,
  chatHistory,
  userMessage,
  setUserMessage,
  handleAssistantSubmit,
}) => {
  // State untuk menampilkan loading indicator
  const [isThinking, setIsThinking] = useState(false);

  /**
   * Wrapper untuk submit handler yang menampilkan loading state
   * 
   * @param e - Form event
   */
  const onSubmit = async (e: React.FormEvent) => {
    setIsThinking(true);
    await handleAssistantSubmit(e);
    setIsThinking(false);
  };

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 transition-all duration-300",
      showAssistant ? "w-[420px] max-w-[95vw] sm:w-[420px] sm:max-w-[95vw] w-full" : "w-auto"
    )}>
      {showAssistant ? (
        // Expanded chat interface
        <Card className="shadow-lg border">
          {/* Header dengan title dan close button */}
          <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-medium">Asisten Kursus</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary/90"
              onClick={() => setShowAssistant(false)}
            >
              &times;
            </Button>
          </div>
          
          {/* Chat content area */}
          <CardContent className="p-3">
            {/* Chat messages container */}
            <div className="h-96 sm:h-96 h-72 overflow-y-auto mb-3 space-y-3">
              {Array.isArray(chatHistory) && chatHistory.length === 0 ? (
                // Empty state ketika belum ada chat
                <div className="text-center text-muted-foreground py-4">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Apa yang bisa saya bantu untuk kursus ini?</p>
                </div>
              ) : (
                // Render chat history
                chatHistory.map((msg, idx) => <ChatMessage key={idx} msg={msg} />)
              )}
              
              {/* Loading indicator */}
              {isThinking && (
                <div className="text-center text-muted-foreground animate-pulse py-2">Sedang memproses<span className="animate-bounce">...</span></div>
              )}
            </div>
            
            {/* Chat input form */}
            <form onSubmit={onSubmit} className="flex gap-2">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Tanyakan sesuatu..."
                className="flex-1 border border-input rounded-md px-2 py-1 text-sm h-8 focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
              />
              <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Kirim
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        // Floating chat button
        <Button
          onClick={() => setShowAssistant(true)}
          className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
} 