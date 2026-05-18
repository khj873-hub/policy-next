'use client'
import { S } from '@/lib/styles'
import type { Message, IdeaPhase } from '@/lib/types'

type Props = {
  msg: Message
  onTriggerIdea: (program: string) => void
  onGeneratePlan: (data?: Message['ideaData']) => void
  selectedProgram: string
  ideaPhase: IdeaPhase
}

function renderText(text: string, isUser: boolean) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={j} style={{
            color: isUser ? '#fff' : '#6366F1', fontWeight: 700,
            background: isUser ? 'transparent' : 'linear-gradient(120deg, #6366F1, #A855F7)',
            WebkitBackgroundClip: isUser ? 'unset' : 'text',
            WebkitTextFillColor: isUser ? '#fff' : 'transparent',
          }}>{p.slice(2, -2)}</strong>
        : p
    )
    if (!line.trim()) return <div key={i} style={{ height: 4 }} />
    if (line.startsWith('- ') || line.startsWith('•')) {
      return (
        <div key={i} style={{ display: 'flex', gap: 8, margin: '3px 0' }}>
          <span style={{ color: '#6366F1', flexShrink: 0, fontWeight: 700 }}>•</span>
          <span style={{ lineHeight: 1.6 }}>{parts.map((p) => typeof p === 'string' ? p.replace(/^[-•]\s*/, '') : p)}</span>
        </div>
      )
    }
    return <div key={i} style={{ lineHeight: 1.65 }}>{parts}</div>
  })
}

export default function MessageBubble({ msg, onTriggerIdea, onGeneratePlan, selectedProgram, ideaPhase }: Props) {
  const isUser = msg.role === 'user'
  const isQuestion = msg.type === 'question'

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14, animation: 'fadeUp 0.3s ease' }}>
        <div style={S.userBubble}>{renderText(msg.content, true)}</div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 18, animation: 'fadeUp 0.3s ease' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={isQuestion ? S.avatarQ : S.avatarAI}>
          {isQuestion ? 'Q' : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6V12C4 17 7 21 12 22C17 21 20 17 20 12V6L12 2Z" fill="#fff" />
              <path d="M8 12L11 15L16 9" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div style={isQuestion ? S.questionBubble : S.aiBubble}>
          {renderText(msg.content, false)}
        </div>
      </div>

      {msg.type === 'ready' && (
        <div style={S.actionCard}>
          <div style={S.actionSparkle}>✨</div>
          <button style={S.actionPrimary} onClick={() => onGeneratePlan(msg.ideaData)}>
            <span>AI 사업계획서 초안 생성</span>
            <span style={{ fontSize: 16 }}>→</span>
          </button>
          <div style={S.actionNote}>입력하신 아이디어가 자동으로 반영됩니다</div>
        </div>
      )}

      {!ideaPhase && msg.type !== 'question' && msg.type !== 'ready' && msg.type !== 'system'
        && msg.content.includes('사업계획서') && selectedProgram && (
        <div style={{ paddingLeft: 42, marginTop: 10 }}>
          <button style={S.inlinePlanBtn} onClick={() => onTriggerIdea(selectedProgram)}>
            <span>📝</span>
            <span>"{selectedProgram}" 사업계획서 바로 시작</span>
          </button>
        </div>
      )}
    </div>
  )
}
