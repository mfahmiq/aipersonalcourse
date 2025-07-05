import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface LessonAssistantProps {
  showAssistant: boolean
  setShowAssistant: (show: boolean) => void
  chatHistory: { role: string; content: string }[]
  userMessage: string
  setUserMessage: (msg: string) => void
  handleAssistantSubmit: (e: React.FormEvent) => void
}

export const LessonAssistant: React.FC<LessonAssistantProps> = ({
  showAssistant,
  setShowAssistant,
  chatHistory,
  userMessage,
  setUserMessage,
  handleAssistantSubmit,
}) => {
  return (
    <div className={cn("fixed bottom-6 right-6 z-50 transition-all duration-300", showAssistant ? "w-80" : "w-auto")}> 
      {showAssistant ? (
        <Card className="shadow-lg border">
          <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-medium">Course Assistant</h3>
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
            <div className="h-64 overflow-y-auto mb-3 space-y-3">
              {Array.isArray(chatHistory) && chatHistory.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>How can I help you with this course?</p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-2 rounded-lg max-w-[85%]",
                      msg.role === "user" ? "bg-muted ml-auto" : "bg-primary/10 mr-auto",
                    )}
                  >
                    {msg.content}
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAssistantSubmit} className="flex gap-2">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 border border-input rounded-md px-2 py-1 text-sm h-8 focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
              />
              <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Send
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