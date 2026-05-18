'use client'
import { useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useStore } from '@/lib/store'
import { S } from '@/lib/styles'
import { IDEA_QUESTIONS } from '@/lib/constants'
import MessageBubble from '@/components/MessageBubble'
import TypingIndicator from '@/components/TypingIndicator'
import type { Message, IdeaData } from '@/lib/types'

function ChatContent() {
  const router = useRouter()
  const params = useSearchParams()
  const { data: session } = useSession()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    input, setInput,
    messages, setMessages, addMessage,
    chatLoading, setChatLoading,
    savedProfile, loadProfile,
    ideaPhase, setIdeaPhase,
    ideaStep, setIdeaStep,
    ideaData, setIdeaData,
    selectedProgram, setSelectedProgram,
    planVisible, setPlanVisible,
    planContent, setPlanContent,
    planLoading, setPlanLoading,
    resetChat,
  } = useStore()

  useEffect(() => { loadProfile() }, [])

  useEffect(() => {
    const q = params.get('q')
    if (q && messages.length <= 1) {
      const userMsg: Message = { role: 'user', content: q }
      setMessages([userMsg])
      callAI([userMsg])
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading, ideaPhase, ideaStep])

  const callAI = async (msgs: Message[]) => {
    const ideaContext = ideaPhase === 'done'
      ? `문제: ${ideaData.problem} / 고객: ${ideaData.target} / 목표: ${ideaData.goal}` : null
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: msgs.map((m) => ({ role: m.role, content: m.content })),
          profile: savedProfile,
          ideaContext,
          userEmail: session?.user?.email || null,
        }),
      })
      const data = await res.json()
      const reply = data.content?.map((c: { text?: string }) => c.text || '').join('') || '응답 오류'
      addMessage({ role: 'assistant', content: reply })
      if (reply.includes('**') && !selectedProgram) {
        const match = reply.match(/\*\*([^*]{5,30})\*\*/)
        if (match) setSelectedProgram(match[1])
      }
    } catch {
      addMessage({ role: 'assistant', content: '오류가 발생했습니다.' })
    }
    setChatLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || chatLoading) return
    if (ideaPhase === 'collecting') { handleIdeaAnswer(text); return }
    setInput('')
    const newMsg: Message = { role: 'user', content: text }
    addMessage(newMsg)
    await callAI([...messages, newMsg])
  }

  const triggerIdeaFlow = (programName: string) => {
    const prog = programName || selectedProgram || '해당 지원사업'
    setSelectedProgram(prog)
    setIdeaPhase('collecting')
    setIdeaStep(0)
    setIdeaData({ problem: '', target: '', goal: '' })
    addMessage({ role: 'assistant', content: `좋아요! **${prog}** 신청을 위한 사업계획서를 함께 만들어볼게요 📝\n\n3가지 질문에 답하시면 자동으로 초안이 생성됩니다.`, type: 'system' })
    addMessage({ role: 'assistant', content: `${IDEA_QUESTIONS[0].emoji} ${IDEA_QUESTIONS[0].q}\n\n${IDEA_QUESTIONS[0].hint}`, type: 'question' })
  }

  const handleIdeaAnswer = (answer: string) => {
    const currentKey = IDEA_QUESTIONS[ideaStep].key as keyof IdeaData
    const newData: IdeaData = { ...ideaData, [currentKey]: answer }
    setIdeaData(newData)
    setInput('')
    addMessage({ role: 'user', content: answer })
    if (ideaStep < IDEA_QUESTIONS.length - 1) {
      const nextStep = ideaStep + 1
      setIdeaStep(nextStep)
      addMessage({ role: 'assistant', content: `${IDEA_QUESTIONS[nextStep].emoji} ${IDEA_QUESTIONS[nextStep].q}\n\n${IDEA_QUESTIONS[nextStep].hint}`, type: 'question' })
    } else {
      setIdeaPhase('done')
      addMessage({
        role: 'assistant',
        content: `완벽해요! 아이디어가 모두 수집됐습니다 ✨\n\n💡 **문제**: ${newData.problem}\n🎯 **고객**: ${newData.target}\n🚀 **목표**: ${newData.goal}\n\n이제 사업계획서 초안을 만들어볼게요.`,
        type: 'ready',
        ideaData: newData,
      })
    }
  }

  const generatePlan = async (overrideData?: IdeaData) => {
    const data = overrideData || ideaData
    setPlanVisible(true)
    setPlanContent('')
    setPlanLoading(true)
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: savedProfile, selectedProgram, ideaData: data, userEmail: session?.user?.email || null }),
      })
      const json = await res.json()
      setPlanContent(json.content?.map((c: { text?: string }) => c.text || '').join('') || '생성 실패')
    } catch {
      setPlanContent('오류가 발생했습니다.')
    }
    setPlanLoading(false)
  }

  return (
    <div style={S.root}>
      <div style={S.bgGradient} />
      <div style={S.bgGrain} />
      <div style={S.chatRoot}>
        <header style={S.chatHeader}>
          <button style={S.backBtn} onClick={() => { resetChat(); router.push('/') }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div style={S.chatHeaderCenter}>
            <div style={S.chatHeaderTitle}>
              <span style={S.chatHeaderDot} />
              AI 컨설턴트
            </div>
            {ideaPhase === 'collecting' && (
              <div style={S.ideaProgressTag}>
                <span>아이디어 수집</span>
                <span style={S.ideaProgressNum}>{ideaStep + 1}/3</span>
              </div>
            )}
          </div>
          <button style={S.profileSmBtn} onClick={() => router.push('/profile')}>👤</button>
        </header>

        {ideaPhase === 'collecting' && (
          <div style={S.progressBarOuter}>
            <div style={{ ...S.progressBarFill, width: `${(ideaStep / 3) * 100}%` }} />
          </div>
        )}

        <div style={S.chatMessages}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg}
              onTriggerIdea={triggerIdeaFlow}
              onGeneratePlan={generatePlan}
              selectedProgram={selectedProgram}
              ideaPhase={ideaPhase}
            />
          ))}
          {chatLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        <div style={S.inputArea}>
          {ideaPhase === 'collecting' && (
            <div style={S.ideaHint}>
              <span style={S.ideaHintBadge}>Q{ideaStep + 1}</span>
              <span>{IDEA_QUESTIONS[ideaStep]?.q}</span>
            </div>
          )}
          <div style={S.inputBox}>
            <textarea
              ref={inputRef} style={S.textarea}
              placeholder={ideaPhase === 'collecting' ? '답변을 입력하세요...' : '메시지 입력...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              rows={1}
            />
            <button style={{ ...S.sendBtn, opacity: input.trim() && !chatLoading ? 1 : 0.3 }}
              onClick={sendMessage} disabled={!input.trim() || chatLoading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          {!ideaPhase && selectedProgram && (
            <button style={S.planShortcut} onClick={() => triggerIdeaFlow(selectedProgram)}>
              <span style={S.planShortcutIcon}>📄</span>
              <span style={S.planShortcutText}>
                <span style={{ fontSize: 11, opacity: 0.7 }}>이 공고로</span>
                <span style={{ fontWeight: 700 }}>사업계획서 작성하기</span>
              </span>
              <span style={S.planShortcutArrow}>→</span>
            </button>
          )}
        </div>

        {planVisible && (
          <div style={S.planOverlay} onClick={() => setPlanVisible(false)}>
            <div style={S.planPanel} onClick={(e) => e.stopPropagation()}>
              <div style={S.planHandle} />
              <div style={S.planPanelHeader}>
                <div style={{ flex: 1 }}>
                  <div style={S.planPanelSub}>AI 사업계획서 초안</div>
                  <div style={S.planPanelTitle}>{selectedProgram}</div>
                </div>
                <div style={S.planPanelActions}>
                  {planContent && (
                    <button style={S.copyBtn} onClick={() => navigator.clipboard.writeText(planContent)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                        <path d="M5 15H4C2.9 15 2 14.1 2 13V4C2 2.9 2.9 2 4 2H13C14.1 2 15 2.9 15 4V5" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      복사
                    </button>
                  )}
                  <button style={S.closeBtn} onClick={() => setPlanVisible(false)}>✕</button>
                </div>
              </div>
              <div style={S.planBody}>
                {planLoading ? (
                  <div style={S.planLoading}>
                    <div style={S.spinnerRing}><div style={S.spinnerInner} /></div>
                    <p style={S.planLoadingText}>사업계획서 작성 중...</p>
                    <p style={S.planLoadingDesc}>{selectedProgram} · 6섹션 자동 생성</p>
                  </div>
                ) : (
                  <div style={S.planContent}>
                    {planContent.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) {
                        const num = line.match(/## (\d+)\./)?.[1]
                        return (
                          <div key={i} style={S.planSection}>
                            {num && <span style={S.planSectionNum}>{num}</span>}
                            <h3 style={S.planSectionTitle}>{line.replace(/## \d*\.?\s*/, '')}</h3>
                          </div>
                        )
                      }
                      if (line.startsWith('※')) return <p key={i} style={S.planDisclaimerText}>{line}</p>
                      if (!line.trim()) return <div key={i} style={{ height: 6 }} />
                      return <p key={i} style={S.planPara}>{line}</p>
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatContent />
    </Suspense>
  )
}
