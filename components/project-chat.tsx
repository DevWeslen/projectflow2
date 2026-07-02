'use client'

import { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '@/lib/store'
import { Send, Paperclip, MessageSquare, Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserAvatar } from './user-avatar'
import { cn } from '@/lib/utils'

interface ProjectChatProps {
  projectId: string
}

export function ProjectChat({ projectId }: ProjectChatProps) {
  const { projectMessages, user, addProjectMessage } = useProjectStore()
  const [content, setContent] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const messages = projectMessages.filter(m => m.projectId === projectId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!content.trim() || !user) return

    addProjectMessage({
      projectId,
      userId: user.id,
      userName: user.name,
      content: content.trim(),
      attachments: []
    })

    setContent('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-background/50 border border-border/50 rounded-2xl overflow-hidden glass shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-secondary/30 flex items-center gap-3 shrink-0">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-foreground">Chat do Projeto</h3>
          <p className="text-xs text-muted-foreground">Comunicação e arquivos da equipe</p>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 text-center px-4">
            <MessageSquare className="h-12 w-12 mb-3 text-muted-foreground" />
            <p className="text-sm font-bold">Nenhuma mensagem ainda.</p>
            <p className="text-xs text-muted-foreground">Seja o primeiro a mandar um "Olá"!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.userId === user?.id
            const showAvatar = idx === 0 || messages[idx - 1].userId !== msg.userId

            return (
              <div 
                key={msg.id} 
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  isMe ? "ml-auto flex-row-reverse" : ""
                )}
              >
                {showAvatar ? (
                  <UserAvatar name={msg.userName} size="sm" className="shrink-0 mt-auto mb-1 shadow-sm" />
                ) : (
                  <div className="w-8 shrink-0" /> // Placeholder for alignment
                )}

                <div className={cn(
                  "flex flex-col gap-1",
                  isMe ? "items-end" : "items-start"
                )}>
                  {showAvatar && (
                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 px-1">
                      {msg.userName.split(' ')[0]}
                    </span>
                  )}
                  
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-br-sm" 
                      : "bg-secondary text-secondary-foreground rounded-bl-sm"
                  )}>
                    {msg.content}
                  </div>
                  
                  <span className="text-[9px] font-bold text-muted-foreground/40 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-secondary/20 border-t border-border/50 shrink-0">
        <div className="flex items-end gap-2 bg-background border border-border/50 rounded-xl p-2 focus-within:ring-2 focus-within:ring-primary/50 transition-all shadow-sm">
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary rounded-lg">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            className="flex-1 max-h-[120px] min-h-[36px] bg-transparent border-none focus:outline-none resize-none py-2 text-sm text-foreground custom-scrollbar"
            rows={1}
          />

          <Button 
            onClick={handleSend}
            disabled={!content.trim()}
            size="icon" 
            className="shrink-0 h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[9px] text-center text-muted-foreground/40 font-bold uppercase mt-2">
          Pressione Enter para enviar, Shift + Enter para quebrar linha
        </p>
      </div>
    </div>
  )
}
