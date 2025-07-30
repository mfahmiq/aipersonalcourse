import React, { useState, ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface LessonAssistantProps {
  showAssistant: boolean
  setShowAssistant: (show: boolean) => void
  chatHistory: { role: string; content: string }[]
  userMessage: string
  setUserMessage: (msg: string) => void
  handleAssistantSubmit: (e: React.FormEvent) => void
}

// Memoized chat message component
const ChatMessage = React.memo(function ChatMessage({ msg }: { msg: { role: string, content: string } }) {
  if (msg.role === "assistant") {
    return (
      <div className="p-2 rounded-lg w-full break-words whitespace-pre-line bg-primary/10 mr-auto">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            // Handle code blocks - prevent nesting issues
            code(props: {node?: any, inline?: boolean, className?: string, children?: ReactNode}) {
              const {inline, className, children, ...rest} = props;
              
              if (inline) {
                return (
                  <code className={cn("bg-muted px-1 py-0.5 rounded text-sm", className)} {...rest}>
                    {children}
                  </code>
                );
              }
              
              // Block code - render as standalone element
              return (
                <pre className="bg-muted border rounded p-2 my-2 overflow-x-auto" style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                  <code className={cn("text-sm", className)} {...rest}>{children}</code>
                </pre>
              );
            },
            // Reduce spacing for paragraphs
            p: (props: any) => (
              <p className="mb-2 last:mb-0" {...props}>{props.children}</p>
            ),
            // Reduce spacing for lists
            ul: (props: any) => (
              <ul className="mb-2 last:mb-0 space-y-1" {...props}>{props.children}</ul>
            ),
            ol: (props: any) => (
              <ol className="mb-2 last:mb-0 space-y-1" {...props}>{props.children}</ol>
            ),
            li: (props: any) => (
              <li className="ml-4" {...props}>{props.children}</li>
            ),
            // Reduce spacing for headings
            h1: (props: any) => (
              <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0" {...props}>{props.children}</h1>
            ),
            h2: (props: any) => (
              <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0" {...props}>{props.children}</h2>
            ),
            h3: (props: any) => (
              <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0" {...props}>{props.children}</h3>
            ),
            // Reduce spacing for blockquotes
            blockquote: (props: any) => (
              <blockquote className="border-l-4 border-primary/30 pl-3 py-1 my-2 italic text-muted-foreground" {...props}>{props.children}</blockquote>
            ),
          }}
        >{msg.content}</ReactMarkdown>
      </div>
    );
  }
  return (
    <div className="p-2 rounded-lg w-full break-words whitespace-pre-line bg-muted ml-auto">
      {msg.content}
    </div>
  );
});

export const LessonAssistant: React.FC<LessonAssistantProps> = ({
  showAssistant,
  setShowAssistant,
  chatHistory,
  userMessage,
  setUserMessage,
  handleAssistantSubmit,
}) => {
  const [isThinking, setIsThinking] = useState(false);

  // Wrap the submit handler to show 'Thinking...' while waiting
  const onSubmit = async (e: React.FormEvent) => {
    setIsThinking(true);
    await handleAssistantSubmit(e);
    setIsThinking(false);
  };

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 transition-all duration-300",
      showAssistant ? "w-full sm:w-[420px] max-w-[95vw]" : "w-auto"
    )}>
      {showAssistant ? (
        <Card className="shadow-lg border">
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
          <CardContent className="p-3">
            <div className="h-72 sm:h-96 overflow-y-auto mb-3 space-y-3">
              {Array.isArray(chatHistory) && chatHistory.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Apa yang bisa saya bantu untuk kursus ini?</p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => <ChatMessage key={idx} msg={msg} />)
              )}
              {isThinking && (
                <div className="text-center text-muted-foreground animate-pulse py-2">Sedang memproses<span className="animate-bounce">...</span></div>
              )}
            </div>
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