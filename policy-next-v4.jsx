import { useState, useEffect, useRef } from "react";

// ── 상수 ────────────────────────────────────────────────────────────────────
const EXAMPLE_QUERIES = [
  "서울 IT 창업 2년차, 사업화 자금 필요해",
  "경기도 제조업 3년차 지원금 있을까?",
  "1인 기업 컨설팅 지원 알려줘",
  "AI 도입 지원사업 추천해줘",
];

const DEADLINE_LIST = [
  { title: "2026년 여성발명왕EXPO 참가기업 모집", dday: 3, region: "전국", amount: "최대 500만원" },
  { title: "[서울] B the B 뷰티 융복합 콘텐츠 전시", dday: 5, region: "서울", amount: "참가비 지원" },
  { title: "[강원] 철원군 중소기업 수출단체보험 지원", dday: 7, region: "강원", amount: "보험료 80%" },
  { title: "[충남] 경영위기 소상공인 재기 지원사업", dday: 12, region: "충남", amount: "최대 2,000만원" },
  { title: "AI·디지털전환 지원사업", dday: 18, region: "전국", amount: "최대 5,000만원" },
];

const IDEA_QUESTIONS = [
  { key: "problem", q: "어떤 문제를 해결하는 사업인가요?", hint: "핵심 한 문장으로 말씀해주세요", emoji: "💡" },
  { key: "target", q: "목표 고객과 예상 시장은요?", hint: "예: 30~40대 직장인 / 국내 SMB 시장", emoji: "🎯" },
  { key: "goal", q: "6개월 안에 달성할 목표는?", hint: "예: 베타 출시 + MAU 1,000명", emoji: "🚀" },
];

const buildChatPrompt = (profile, ideaContext) => `당신은 퍼펙트 정부지원정책 AI 컨설턴트입니다. 20년 경력 비즈니스 아키텍트 수준의 전문성을 가집니다.
${profile.region || profile.industry ? `\n[프로필] 지역:${profile.region||"-"} / 업종:${profile.industry||"-"} / 업력:${profile.age||"-"}` : ""}
${ideaContext ? `\n[수집된 아이디어]\n${ideaContext}` : ""}

원칙: 자연어에서 조건 자동 추출 → 맞춤 공고 추천. 질문은 한 번에 1개. 추천 공고명은 **굵게**. 금액·마감 명확히. 사용자가 관심 보이면 "사업계획서 작성을 도와드릴까요?" 유도. 친근하되 전문적 톤, 이모지 적절히.`;

const buildPlanPrompt = (profile, program, idea) => `당신은 정부지원사업 사업계획서 전문 작성가입니다. 심사관이 높게 평가할 설득력 있는 초안을 작성합니다.

[신청 정보]
- 지원사업: ${program}
- 지역: ${profile.region||"미입력"} / 업종: ${profile.industry||"미입력"} / 업력: ${profile.age||"미입력"}

[사업 아이디어]
- 문제: ${idea.problem||"미입력"}
- 고객·시장: ${idea.target||"미입력"}
- 6개월 목표: ${idea.goal||"미입력"}

다음 6섹션 사업계획서를 작성해주세요. 각 섹션은 구체적이고 수치 중심으로:

## 1. 사업 개요
## 2. 문제 정의 및 시장 필요성
## 3. 솔루션 및 차별성
## 4. 목표 시장 및 고객
## 5. 추진 일정 (6개월 로드맵)
## 6. 기대 효과 및 활용 계획

마지막 한 줄: "※ 본 초안은 AI 생성 참고용입니다. 실제 신청 전 반드시 검토·수정하세요."`;

// ── 메인 ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [profile, setProfile] = useState({ region: "", industry: "", age: "" });
  const [savedProfile, setSavedProfile] = useState({ region: "", industry: "", age: "" });

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [ideaPhase, setIdeaPhase] = useState(null);
  const [ideaStep, setIdeaStep] = useState(0);
  const [ideaData, setIdeaData] = useState({ problem: "", target: "", goal: "" });
  const [selectedProgram, setSelectedProgram] = useState("");

  const [planVisible, setPlanVisible] = useState(false);
  const [planContent, setPlanContent] = useState("");
  const [planLoading, setPlanLoading] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading, ideaPhase, ideaStep]);

  const callChatAI = async (msgs) => {
    const ideaContext = ideaPhase === "done"
      ? `문제: ${ideaData.problem} / 고객: ${ideaData.target} / 목표: ${ideaData.goal}` : null;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: buildChatPrompt(savedProfile, ideaContext),
          messages: msgs.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      return data.content?.map((c) => c.text || "").join("") || "응답 오류";
    } catch { return "오류가 발생했습니다."; }
  };

  const startChat = async (query) => {
    if (!query.trim()) return;
    setScreen("chat"); setInput("");
    const userMsg = { role: "user", content: query };
    setMessages([userMsg]); setChatLoading(true);
    const reply = await callChatAI([userMsg]);
    setMessages([userMsg, { role: "assistant", content: reply }]);
    setChatLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || chatLoading) return;
    if (ideaPhase === "collecting") { handleIdeaAnswer(text); return; }
    setInput("");
    const newMsgs = [...messages, { role: "user", content: text }];
    setMessages(newMsgs); setChatLoading(true);
    const reply = await callChatAI(newMsgs);
    setMessages([...newMsgs, { role: "assistant", content: reply }]);
    setChatLoading(false);
    if (reply.includes("**") && !selectedProgram) {
      const match = reply.match(/\*\*([^*]{5,30})\*\*/);
      if (match) setSelectedProgram(match[1]);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const triggerIdeaFlow = (programName) => {
    const prog = programName || selectedProgram || "해당 지원사업";
    setSelectedProgram(prog); setIdeaPhase("collecting"); setIdeaStep(0);
    setIdeaData({ problem: "", target: "", goal: "" });
    setMessages((prev) => [...prev,
      { role: "assistant", content: `좋아요! **${prog}** 신청을 위한 사업계획서를 함께 만들어볼게요 📝\n\n3가지 질문에 답하시면 자동으로 초안이 생성됩니다.`, type: "system" },
      { role: "assistant", content: `${IDEA_QUESTIONS[0].emoji} ${IDEA_QUESTIONS[0].q}\n\n${IDEA_QUESTIONS[0].hint}`, type: "question" },
    ]);
  };

  const handleIdeaAnswer = (answer) => {
    const currentKey = IDEA_QUESTIONS[ideaStep].key;
    const newData = { ...ideaData, [currentKey]: answer };
    setIdeaData(newData); setInput("");
    const userMsg = { role: "user", content: answer };
    if (ideaStep < IDEA_QUESTIONS.length - 1) {
      const nextStep = ideaStep + 1;
      setIdeaStep(nextStep);
      setMessages((prev) => [...prev, userMsg,
        { role: "assistant", content: `${IDEA_QUESTIONS[nextStep].emoji} ${IDEA_QUESTIONS[nextStep].q}\n\n${IDEA_QUESTIONS[nextStep].hint}`, type: "question" },
      ]);
    } else {
      setIdeaPhase("done");
      setMessages((prev) => [...prev, userMsg, {
        role: "assistant",
        content: `완벽해요! 아이디어가 모두 수집됐습니다 ✨\n\n💡 **문제**: ${newData.problem}\n🎯 **고객**: ${newData.target}\n🚀 **목표**: ${newData.goal}\n\n이제 사업계획서 초안을 만들어볼게요.`,
        type: "ready", ideaData: newData,
      }]);
    }
  };

  const generatePlan = async (overrideData) => {
    const data = overrideData || ideaData;
    setPlanVisible(true); setPlanContent(""); setPlanLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: buildPlanPrompt(savedProfile, selectedProgram, data) }],
        }),
      });
      const json = await res.json();
      setPlanContent(json.content?.map((c) => c.text || "").join("") || "생성 실패");
    } catch { setPlanContent("오류가 발생했습니다."); }
    setPlanLoading(false);
  };

  const hasProfile = savedProfile.region || savedProfile.industry || savedProfile.age;

  return (
    <div style={S.root}>
      <style>{GLOBAL_CSS}</style>
      {/* 글로벌 배경 효과 */}
      <div style={S.bgGradient} />
      <div style={S.bgGrain} />

      {/* 홈 */}
      {screen === "home" && (
        <div style={S.page}>
          <header style={S.header}>
            <div style={S.logoWrap}>
              <div style={S.logoBadge}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 6V12C4 17 7 21 12 22C17 21 20 17 20 12V6L12 2Z" fill="url(#gradLogo)" />
                  <path d="M8 12L11 15L16 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="gradLogo" x1="0" y1="0" x2="24" y2="24">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div>
                <div style={S.logoName}>퍼펙트 <span style={S.logoNameAccent}>정부지원정책</span></div>
                <div style={S.logoSub}>AI POLICY CONSULTANT</div>
              </div>
            </div>
            <button style={S.profileBtn} onClick={() => setScreen("profile")}>
              <span style={{ fontSize: 16 }}>👤</span>
              {hasProfile && <span style={S.profileDot} />}
            </button>
          </header>

          <div style={S.homeScroll}>
            {/* 히어로 */}
            <div style={S.hero}>
              <div style={S.heroLabel}>
                <span style={S.heroLabelDot} />
                AI 기반 맞춤 정책자금 매칭
              </div>
              <h1 style={S.heroTitle}>
                정책자금,<br />
                <span style={S.heroTitleGrad}>대화로 찾아드려요</span>
              </h1>
              <p style={S.heroDesc}>
                자연어로 묻기만 하면, AI가 맞춤 공고부터<br />
                사업계획서 초안까지 한 번에 완성합니다.
              </p>
            </div>

            {/* 검색 카드 */}
            <div style={S.searchCard}>
              <div style={S.searchInner}>
                <textarea
                  style={S.searchInput}
                  placeholder="예: 서울 IT 창업 2년차, 사업화 자금이 필요해요"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); startChat(input); } }}
                  rows={2}
                />
                <button
                  style={{ ...S.searchBtn, opacity: input.trim() ? 1 : 0.4 }}
                  onClick={() => startChat(input)} disabled={!input.trim()}
                >
                  <span>AI 컨설팅 시작</span>
                  <span style={S.searchBtnArrow}>→</span>
                </button>
              </div>
              <div style={S.exampleScroll}>
                {EXAMPLE_QUERIES.map((q, i) => (
                  <button key={q} style={S.exampleChip} onClick={() => startChat(q)}>
                    <span style={S.exampleNum}>0{i + 1}</span>
                    <span style={S.exampleText}>{q}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 마감임박 */}
            <div style={S.section}>
              <div style={S.sectionHead}>
                <div>
                  <div style={S.sectionLabel}>URGENT</div>
                  <h2 style={S.sectionTitle}>
                    <span style={S.fireEmoji}>🔥</span> 마감 임박 공고
                  </h2>
                </div>
                <span style={S.sectionCount}>{DEADLINE_LIST.length}건</span>
              </div>
              <div style={S.deadlineGrid}>
                {DEADLINE_LIST.map((item, i) => (
                  <button key={i} style={S.deadlineCard}
                    onClick={() => startChat(`${item.title} 자격 조건이랑 신청 방법 알려줘`)}>
                    <div style={S.deadlineTop}>
                      <div style={{
                        ...S.ddayBadge,
                        background: item.dday <= 7 ? "linear-gradient(135deg, #FF4D6D, #FF8C42)" : "linear-gradient(135deg, #FFB800, #FF8C42)"
                      }}>
                        D-{item.dday}
                      </div>
                      <span style={S.deadlineRegion}>{item.region}</span>
                    </div>
                    <div style={S.deadlineTitle}>{item.title}</div>
                    <div style={S.deadlineBottom}>
                      <span style={S.deadlineAmount}>💰 {item.amount}</span>
                      <span style={S.deadlineArrow}>→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 기능 */}
            <div style={S.section}>
              <h2 style={S.sectionTitle}>주요 기능</h2>
              <div style={S.featureGrid}>
                {[
                  { icon: "🔍", title: "자연어 검색", desc: "조건 자동 추출" },
                  { icon: "🤖", title: "맞춤 추천", desc: "프로필 기반 매칭" },
                  { icon: "📝", title: "AI 사업계획서", desc: "6섹션 초안 생성" },
                  { icon: "🛡", title: "자격 사전 확인", desc: "신청 전 체크" },
                ].map((f) => (
                  <div key={f.title} style={S.featureCard}>
                    <div style={S.featureIconWrap}>
                      <span style={S.featureIcon}>{f.icon}</span>
                    </div>
                    <div style={S.featureTitle}>{f.title}</div>
                    <div style={S.featureDesc}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={S.disclaimer}>
              <span style={S.disclaimerIcon}>ⓘ</span>
              AI 답변은 참고용입니다. 실제 선정은 주관기관 심사에 따릅니다.
            </div>
          </div>
        </div>
      )}

      {/* 채팅 */}
      {screen === "chat" && (
        <div style={S.chatRoot}>
          <header style={S.chatHeader}>
            <button style={S.backBtn} onClick={() => { setScreen("home"); setMessages([]); setIdeaPhase(null); setPlanVisible(false); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div style={S.chatHeaderCenter}>
              <div style={S.chatHeaderTitle}>
                <span style={S.chatHeaderDot} />
                AI 컨설턴트
              </div>
              {ideaPhase === "collecting" && (
                <div style={S.ideaProgressTag}>
                  <span>아이디어 수집</span>
                  <span style={S.ideaProgressNum}>{ideaStep + 1}/3</span>
                </div>
              )}
            </div>
            <button style={S.profileSmBtn} onClick={() => setScreen("profile")}>👤</button>
          </header>

          {ideaPhase === "collecting" && (
            <div style={S.progressBarOuter}>
              <div style={{ ...S.progressBarFill, width: `${((ideaStep) / 3) * 100}%` }} />
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
            {ideaPhase === "collecting" && (
              <div style={S.ideaHint}>
                <span style={S.ideaHintBadge}>Q{ideaStep + 1}</span>
                <span>{IDEA_QUESTIONS[ideaStep]?.q}</span>
              </div>
            )}
            <div style={S.inputBox}>
              <textarea
                ref={inputRef} style={S.textarea}
                placeholder={ideaPhase === "collecting" ? "답변을 입력하세요..." : "메시지 입력..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
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
                      <button style={S.copyBtn}
                        onClick={() => { navigator.clipboard.writeText(planContent); }}>
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
                      <div style={S.spinnerRing}>
                        <div style={S.spinnerInner} />
                      </div>
                      <p style={S.planLoadingText}>사업계획서 작성 중...</p>
                      <p style={S.planLoadingDesc}>
                        {selectedProgram} · 6섹션 자동 생성
                      </p>
                    </div>
                  ) : (
                    <div style={S.planContent}>
                      {planContent.split("\n").map((line, i) => {
                        if (line.startsWith("## ")) {
                          const num = line.match(/## (\d+)\./)?.[1];
                          return (
                            <div key={i} style={S.planSection}>
                              {num && <span style={S.planSectionNum}>{num}</span>}
                              <h3 style={S.planSectionTitle}>{line.replace(/## \d*\.?\s*/, "")}</h3>
                            </div>
                          );
                        }
                        if (line.startsWith("※")) return <p key={i} style={S.planDisclaimerText}>{line}</p>;
                        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
                        return <p key={i} style={S.planPara}>{line}</p>;
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 프로필 */}
      {screen === "profile" && (
        <div style={S.page}>
          <header style={S.header}>
            <button style={S.backBtn} onClick={() => setScreen("home")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span style={S.profileHeaderTitle}>내 프로필</span>
            <div style={{ width: 40 }} />
          </header>
          <div style={S.homeScroll}>
            <div style={S.profileHero}>
              <div style={S.profileAvatar}>
                <span style={{ fontSize: 32 }}>👤</span>
              </div>
              <p style={S.profileDesc}>프로필을 저장하면 AI가<br />더 정확한 맞춤 공고를 추천합니다</p>
            </div>

            <div style={S.formCard}>
              {[
                { key: "region", label: "지역", icon: "📍", ph: "예: 서울시 강남구" },
                { key: "industry", label: "업종", icon: "💼", ph: "예: IT 서비스, 제조업" },
                { key: "age", label: "업력", icon: "📅", ph: "예: 창업 3년차, 예비창업" },
              ].map((f) => (
                <div key={f.key} style={S.formGroup}>
                  <label style={S.formLabel}>
                    <span style={S.formLabelIcon}>{f.icon}</span>
                    <span>{f.label}</span>
                  </label>
                  <input style={S.formInput} placeholder={f.ph}
                    value={profile[f.key]}
                    onChange={(e) => setProfile((p) => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <button style={S.saveBtn} onClick={() => { setSavedProfile({ ...profile }); setScreen("home"); }}>
                <span>프로필 저장</span>
                <span style={S.searchBtnArrow}>→</span>
              </button>
            </div>

            <div style={S.principleWrap}>
              <h3 style={S.principleTitle}>운영 원칙</h3>
              {[
                { icon: "🔒", t: "API 보안", d: "모든 AI 호출은 서버에서 처리" },
                { icon: "🛡", t: "LLM 역할 제한", d: "공고 생성·자격 결정 불가" },
                { icon: "📋", t: "실제 데이터", d: "공공 데이터 기반 (가상 공고 없음)" },
                { icon: "⚠️", t: "법적 고지", d: "최종 판단은 주관기관 기준" },
              ].map((p) => (
                <div key={p.t} style={S.principleCard}>
                  <div style={S.principleIconBox}>
                    <span>{p.icon}</span>
                  </div>
                  <div>
                    <div style={S.principleCardTitle}>{p.t}</div>
                    <div style={S.principleCardDesc}>{p.d}</div>
                  </div>
                </div>
              ))}
              <div style={{ height: 40 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 메시지 버블 ──────────────────────────────────────────────────────────────
function MessageBubble({ msg, onTriggerIdea, onGeneratePlan, selectedProgram, ideaPhase }) {
  const isUser = msg.role === "user";

  const renderText = (text) =>
    text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={j} style={{ color: isUser ? "#fff" : "#6366F1", fontWeight: 700, background: isUser ? "transparent" : "linear-gradient(120deg, #6366F1, #A855F7)", WebkitBackgroundClip: isUser ? "unset" : "text", WebkitTextFillColor: isUser ? "#fff" : "transparent" }}>{p.slice(2, -2)}</strong>
          : p
      );
      if (!line.trim()) return <div key={i} style={{ height: 4 }} />;
      if (line.startsWith("- ") || line.startsWith("•")) {
        return (
          <div key={i} style={{ display: "flex", gap: 8, margin: "3px 0" }}>
            <span style={{ color: "#6366F1", flexShrink: 0, fontWeight: 700 }}>•</span>
            <span style={{ lineHeight: 1.6 }}>{parts.map((p) => typeof p === "string" ? p.replace(/^[-•]\s*/, "") : p)}</span>
          </div>
        );
      }
      return <div key={i} style={{ lineHeight: 1.65 }}>{parts}</div>;
    });

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14, animation: "fadeUp 0.3s ease" }}>
        <div style={S.userBubble}>{renderText(msg.content)}</div>
      </div>
    );
  }

  const isQuestion = msg.type === "question";

  return (
    <div style={{ marginBottom: 18, animation: "fadeUp 0.3s ease" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={isQuestion ? S.avatarQ : S.avatarAI}>
          {isQuestion ? "Q" : <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6V12C4 17 7 21 12 22C17 21 20 17 20 12V6L12 2Z" fill="#fff" />
            <path d="M8 12L11 15L16 9" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>}
        </div>
        <div style={isQuestion ? S.questionBubble : S.aiBubble}>
          {renderText(msg.content)}
        </div>
      </div>

      {msg.type === "ready" && (
        <div style={S.actionCard}>
          <div style={S.actionSparkle}>✨</div>
          <button style={S.actionPrimary} onClick={() => onGeneratePlan(msg.ideaData)}>
            <span>AI 사업계획서 초안 생성</span>
            <span style={{ fontSize: 16 }}>→</span>
          </button>
          <div style={S.actionNote}>입력하신 아이디어가 자동으로 반영됩니다</div>
        </div>
      )}

      {!ideaPhase && msg.type !== "question" && msg.type !== "ready" && msg.type !== "system"
        && msg.content.includes("사업계획서") && selectedProgram && (
        <div style={{ paddingLeft: 42, marginTop: 10 }}>
          <button style={S.inlinePlanBtn} onClick={() => onTriggerIdea(selectedProgram)}>
            <span>📝</span>
            <span>"{selectedProgram}" 사업계획서 바로 시작</span>
          </button>
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 18, animation: "fadeUp 0.3s ease" }}>
      <div style={S.avatarAI}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 6V12C4 17 7 21 12 22C17 21 20 17 20 12V6L12 2Z" fill="#fff" />
        </svg>
      </div>
      <div style={{ ...S.aiBubble, display: "flex", gap: 6, alignItems: "center", padding: "14px 18px" }}>
        {[0, 0.15, 0.3].map((d, i) => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366F1, #A855F7)",
            display: "inline-block",
            animation: `bounce 1.2s ${d}s infinite ease-in-out`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── 글로벌 CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  textarea, input { font-family: inherit; }
  textarea::placeholder, input::placeholder { color: #94A3B8; }
  @keyframes fadeUp { from{opacity:0; transform:translateY(12px)} to{opacity:1; transform:translateY(0)} }
  @keyframes bounce { 0%,60%,100%{transform:translateY(0); opacity:0.4} 30%{transform:translateY(-6px); opacity:1} }
  @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes pulse { 0%,100%{opacity:1; transform:scale(1)} 50%{opacity:0.6; transform:scale(1.1)} }
  @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
  ::-webkit-scrollbar { width: 0; }
`;

// ── 스타일 (premium fintech) ─────────────────────────────────────────────────
const S = {
  root: {
    maxWidth: 480, margin: "0 auto", minHeight: "100vh",
    background: "#0F0F1E",
    fontFamily: "'Pretendard','Apple SD Gothic Neo','Noto Sans KR','SF Pro Display',sans-serif",
    position: "relative", overflow: "hidden",
    color: "#E5E7EB",
  },
  bgGradient: {
    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
    background: `
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.25) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 100% 30%, rgba(168,85,247,0.15) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 0% 60%, rgba(99,102,241,0.1) 0%, transparent 60%)
    `,
  },
  bgGrain: {
    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.4,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3CfeColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.1 0 0 0 0 0.2 0 0 0 0.4 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  },
  page: { minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 },

  // 헤더
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px",
    background: "rgba(15,15,30,0.7)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    position: "sticky", top: 0, zIndex: 10,
  },
  logoWrap: { display: "flex", alignItems: "center", gap: 10 },
  logoBadge: {
    width: 38, height: 38, borderRadius: 11,
    background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 20px rgba(99,102,241,0.25)",
  },
  logoName: { fontSize: 14, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.02em" },
  logoNameAccent: {
    background: "linear-gradient(120deg, #6366F1, #A855F7)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  logoSub: { fontSize: 9, color: "#64748B", letterSpacing: "0.1em", fontWeight: 600, marginTop: 1 },
  profileBtn: {
    position: "relative", width: 40, height: 40,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  profileDot: {
    position: "absolute", top: 4, right: 4,
    width: 8, height: 8, borderRadius: "50%",
    background: "linear-gradient(135deg, #10B981, #3B82F6)",
    boxShadow: "0 0 8px rgba(16,185,129,0.6)",
    animation: "pulse 2s infinite",
  },
  backBtn: {
    width: 40, height: 40, background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
    color: "#E5E7EB", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  profileHeaderTitle: { fontSize: 16, fontWeight: 700, color: "#F1F5F9" },

  // 홈 스크롤
  homeScroll: { flex: 1, overflowY: "auto", padding: "0 0 100px" },

  // 히어로
  hero: { padding: "32px 20px 24px" },
  heroLabel: {
    display: "inline-flex", alignItems: "center", gap: 8,
    fontSize: 11, color: "#A5B4FC", fontWeight: 600, letterSpacing: "0.05em",
    padding: "6px 12px",
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 100, marginBottom: 20,
  },
  heroLabelDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#A5B4FC", boxShadow: "0 0 8px #A5B4FC",
    animation: "pulse 2s infinite",
  },
  heroTitle: {
    fontSize: 32, fontWeight: 900, color: "#F8FAFC",
    margin: 0, lineHeight: 1.15, letterSpacing: "-0.03em",
  },
  heroTitleGrad: {
    background: "linear-gradient(120deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)",
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    animation: "shimmer 4s linear infinite",
  },
  heroDesc: {
    fontSize: 14, color: "#94A3B8", lineHeight: 1.7,
    marginTop: 14, marginBottom: 0,
  },

  // 검색 카드
  searchCard: {
    margin: "8px 20px 0",
    background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20, padding: 16,
    boxShadow: "0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
    backdropFilter: "blur(20px)",
  },
  searchInner: { marginBottom: 14 },
  searchInput: {
    width: "100%",
    background: "rgba(15,15,30,0.5)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, padding: "14px 16px",
    fontSize: 14, color: "#F1F5F9", outline: "none",
    resize: "none", lineHeight: 1.6, marginBottom: 10,
    transition: "all 0.2s",
  },
  searchBtn: {
    width: "100%", padding: "13px",
    background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
    border: "none", borderRadius: 12,
    color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
    transition: "all 0.2s",
  },
  searchBtnArrow: { fontSize: 16, transition: "transform 0.2s" },
  exampleScroll: { display: "flex", flexDirection: "column", gap: 6 },
  exampleChip: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "11px 14px", fontSize: 13,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12, color: "#CBD5E1",
    cursor: "pointer", textAlign: "left",
    transition: "all 0.2s",
  },
  exampleNum: {
    fontSize: 10, fontWeight: 700, color: "#A5B4FC",
    background: "rgba(99,102,241,0.15)",
    padding: "2px 6px", borderRadius: 4,
    letterSpacing: "0.05em",
  },
  exampleText: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },

  // 섹션
  section: { margin: "32px 20px 0" },
  sectionHead: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-end",
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: 700, color: "#F87171",
    letterSpacing: "0.15em", marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18, fontWeight: 800, color: "#F1F5F9",
    margin: 0, display: "flex", alignItems: "center", gap: 6,
    letterSpacing: "-0.02em",
  },
  fireEmoji: { fontSize: 16, animation: "float 2s ease-in-out infinite" },
  sectionCount: {
    fontSize: 11, color: "#94A3B8",
    background: "rgba(255,255,255,0.05)",
    padding: "4px 10px", borderRadius: 100,
    border: "1px solid rgba(255,255,255,0.06)",
  },

  // 마감 임박
  deadlineGrid: { display: "flex", flexDirection: "column", gap: 10 },
  deadlineCard: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16, padding: 14,
    cursor: "pointer", textAlign: "left",
    transition: "all 0.2s",
    backdropFilter: "blur(10px)",
  },
  deadlineTop: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 10,
  },
  ddayBadge: {
    fontSize: 11, fontWeight: 800, color: "#fff",
    padding: "4px 10px", borderRadius: 6,
    letterSpacing: "0.02em",
    boxShadow: "0 4px 12px rgba(255,77,109,0.3)",
  },
  deadlineRegion: {
    fontSize: 10, color: "#A5B4FC",
    padding: "3px 8px",
    background: "rgba(99,102,241,0.12)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 6, fontWeight: 600,
  },
  deadlineTitle: {
    fontSize: 14, color: "#F1F5F9", fontWeight: 600,
    lineHeight: 1.4, marginBottom: 10,
    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  deadlineBottom: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  deadlineAmount: { fontSize: 12, color: "#10B981", fontWeight: 600 },
  deadlineArrow: { fontSize: 14, color: "#64748B" },

  // 기능
  featureGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  featureCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14, padding: 14,
  },
  featureIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 10,
  },
  featureIcon: { fontSize: 18 },
  featureTitle: { fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 2 },
  featureDesc: { fontSize: 11, color: "#94A3B8", lineHeight: 1.4 },

  disclaimer: {
    margin: "32px 20px 0",
    fontSize: 11, color: "#64748B", textAlign: "center",
    padding: 12,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  },
  disclaimerIcon: {
    width: 16, height: 16, borderRadius: "50%",
    background: "rgba(99,102,241,0.2)",
    color: "#A5B4FC",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontSize: 10, fontWeight: 700,
  },

  // 채팅
  chatRoot: {
    height: "100vh", display: "flex", flexDirection: "column",
    position: "relative", zIndex: 1,
  },
  chatHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 16px",
    background: "rgba(15,15,30,0.85)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
  chatHeaderCenter: { display: "flex", flexDirection: "column", alignItems: "center", gap: 3 },
  chatHeaderTitle: {
    fontSize: 14, fontWeight: 700, color: "#F1F5F9",
    display: "flex", alignItems: "center", gap: 6,
  },
  chatHeaderDot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "#10B981", boxShadow: "0 0 8px #10B981",
    animation: "pulse 2s infinite",
  },
  ideaProgressTag: {
    fontSize: 10, fontWeight: 600,
    padding: "3px 8px",
    background: "rgba(168,85,247,0.15)",
    border: "1px solid rgba(168,85,247,0.3)",
    color: "#D8B4FE", borderRadius: 100,
    display: "flex", gap: 6, alignItems: "center",
  },
  ideaProgressNum: {
    background: "rgba(168,85,247,0.3)",
    padding: "1px 5px", borderRadius: 4,
    fontWeight: 800,
  },
  profileSmBtn: {
    width: 36, height: 36, background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, fontSize: 14, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },

  progressBarOuter: {
    height: 3, background: "rgba(255,255,255,0.06)",
    flexShrink: 0, overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6366F1, #A855F7, #EC4899)",
    boxShadow: "0 0 12px rgba(168,85,247,0.6)",
    transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
  },

  chatMessages: { flex: 1, overflowY: "auto", padding: "20px 16px 12px" },

  inputArea: {
    flexShrink: 0, padding: "10px 16px 16px",
    background: "rgba(15,15,30,0.85)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  ideaHint: {
    display: "flex", gap: 8, alignItems: "center",
    fontSize: 12, color: "#D8B4FE", marginBottom: 10,
    padding: "8px 12px",
    background: "rgba(168,85,247,0.08)",
    border: "1px solid rgba(168,85,247,0.2)",
    borderRadius: 10,
  },
  ideaHintBadge: {
    fontSize: 10, fontWeight: 800, color: "#fff",
    background: "linear-gradient(135deg, #A855F7, #EC4899)",
    padding: "2px 7px", borderRadius: 4,
    letterSpacing: "0.02em",
  },
  inputBox: {
    display: "flex", gap: 10, alignItems: "flex-end",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "10px 12px",
  },
  textarea: {
    flex: 1, background: "transparent", border: "none",
    fontSize: 14, color: "#F1F5F9", outline: "none",
    resize: "none", lineHeight: 1.6, maxHeight: 100, overflowY: "auto",
  },
  sendBtn: {
    width: 36, height: 36, flexShrink: 0,
    background: "linear-gradient(135deg, #6366F1, #A855F7)",
    border: "none", borderRadius: 12, color: "#fff",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
    transition: "opacity 0.15s",
  },
  planShortcut: {
    width: "100%", marginTop: 10, padding: "12px 14px",
    background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 12, color: "#E0E7FF",
    cursor: "pointer",
    display: "flex", alignItems: "center", gap: 12,
    boxShadow: "0 4px 16px rgba(99,102,241,0.15)",
  },
  planShortcutIcon: { fontSize: 18 },
  planShortcutText: { flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, fontSize: 13 },
  planShortcutArrow: { fontSize: 16, color: "#A5B4FC" },

  // 버블
  userBubble: {
    maxWidth: "78%",
    background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
    color: "#fff",
    borderRadius: "20px 20px 4px 20px",
    padding: "12px 16px", fontSize: 14,
    boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
  },
  avatarAI: {
    width: 34, height: 34, flexShrink: 0,
    background: "linear-gradient(135deg, #6366F1, #A855F7)",
    borderRadius: 11,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
    marginTop: 2,
  },
  avatarQ: {
    width: 34, height: 34, flexShrink: 0,
    background: "linear-gradient(135deg, #A855F7, #EC4899)",
    color: "#fff", borderRadius: 11,
    fontSize: 13, fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 12px rgba(168,85,247,0.4)",
    marginTop: 2,
  },
  aiBubble: {
    maxWidth: "82%",
    background: "rgba(255,255,255,0.06)",
    color: "#E5E7EB",
    borderRadius: "4px 20px 20px 20px",
    padding: "13px 17px", fontSize: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    lineHeight: 1.65,
  },
  questionBubble: {
    maxWidth: "82%",
    background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.1))",
    color: "#F5F3FF",
    borderRadius: "4px 20px 20px 20px",
    padding: "13px 17px", fontSize: 14, fontWeight: 600,
    border: "1px solid rgba(168,85,247,0.3)",
    lineHeight: 1.65,
    boxShadow: "0 4px 16px rgba(168,85,247,0.1)",
  },

  // 액션 카드
  actionCard: {
    marginLeft: 44, marginTop: 12,
    background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))",
    border: "1px solid rgba(16,185,129,0.25)",
    borderRadius: 16, padding: 16,
    position: "relative", overflow: "hidden",
  },
  actionSparkle: {
    position: "absolute", top: 8, right: 12,
    fontSize: 20, animation: "float 2s ease-in-out infinite",
  },
  actionPrimary: {
    width: "100%", padding: "13px",
    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    border: "none", borderRadius: 12,
    color: "#fff", fontSize: 14, fontWeight: 700,
    cursor: "pointer", marginBottom: 8,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: "0 8px 24px rgba(16,185,129,0.35)",
  },
  actionNote: { fontSize: 11, color: "#86EFAC", textAlign: "center" },
  inlinePlanBtn: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 16px",
    background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 100, color: "#C7D2FE",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  },

  // 사업계획서 오버레이
  planOverlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    zIndex: 100,
    display: "flex", alignItems: "flex-end",
    animation: "fadeUp 0.3s ease",
  },
  planPanel: {
    width: "100%", maxWidth: 480, margin: "0 auto",
    background: "linear-gradient(180deg, #1A1B2E 0%, #0F0F1E 100%)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "24px 24px 0 0",
    maxHeight: "88vh", display: "flex", flexDirection: "column",
    animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    boxShadow: "0 -20px 80px rgba(0,0,0,0.5)",
  },
  planHandle: {
    width: 40, height: 4, background: "rgba(255,255,255,0.2)",
    borderRadius: 2, margin: "10px auto 0",
  },
  planPanelHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "12px 20px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  planPanelSub: {
    fontSize: 11, fontWeight: 700, color: "#A5B4FC",
    letterSpacing: "0.1em", marginBottom: 4,
  },
  planPanelTitle: { fontSize: 17, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.01em" },
  planPanelActions: { display: "flex", gap: 8, alignItems: "center", flexShrink: 0 },
  copyBtn: {
    padding: "7px 12px", fontSize: 12,
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 8, color: "#C7D2FE",
    cursor: "pointer",
    display: "flex", alignItems: "center", gap: 5,
    fontWeight: 600,
  },
  closeBtn: {
    width: 32, height: 32,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8, color: "#94A3B8",
    cursor: "pointer", fontSize: 14,
  },
  planBody: { flex: 1, overflowY: "auto", padding: "16px 20px 32px" },
  planLoading: { textAlign: "center", padding: "48px 20px" },
  spinnerRing: {
    width: 56, height: 56, margin: "0 auto 20px",
    borderRadius: "50%",
    background: "conic-gradient(from 0deg, transparent, #6366F1, #A855F7, #EC4899, transparent)",
    animation: "spin 1.2s linear infinite",
    padding: 3,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  spinnerInner: {
    width: "100%", height: "100%",
    background: "#1A1B2E",
    borderRadius: "50%",
  },
  planLoadingText: { fontSize: 15, color: "#F1F5F9", fontWeight: 700 },
  planLoadingDesc: { fontSize: 12, color: "#94A3B8", marginTop: 6 },
  planContent: {},
  planSection: {
    display: "flex", gap: 10, alignItems: "center",
    margin: "24px 0 10px",
    paddingBottom: 8,
    borderBottom: "1px solid rgba(99,102,241,0.2)",
  },
  planSectionNum: {
    width: 26, height: 26, flexShrink: 0,
    background: "linear-gradient(135deg, #6366F1, #A855F7)",
    color: "#fff", borderRadius: 7,
    fontSize: 12, fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
  },
  planSectionTitle: {
    fontSize: 14, fontWeight: 700, color: "#F1F5F9",
    margin: 0, letterSpacing: "-0.01em",
  },
  planPara: { fontSize: 13, color: "#CBD5E1", lineHeight: 1.75, margin: "4px 0" },
  planDisclaimerText: {
    fontSize: 11, color: "#64748B",
    marginTop: 24, paddingTop: 16,
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },

  // 프로필
  profileHero: {
    textAlign: "center", padding: "32px 20px 20px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
  },
  profileAvatar: {
    width: 80, height: 80, borderRadius: 20,
    background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 12px 40px rgba(99,102,241,0.2)",
  },
  profileDesc: {
    fontSize: 13, color: "#94A3B8", lineHeight: 1.7,
    margin: 0, textAlign: "center",
  },

  formCard: {
    margin: "16px 20px",
    background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20, padding: 20,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  formGroup: { marginBottom: 16 },
  formLabel: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 12, fontWeight: 700, color: "#A5B4FC",
    marginBottom: 8, letterSpacing: "0.02em",
  },
  formLabelIcon: { fontSize: 14 },
  formInput: {
    width: "100%", padding: "12px 14px",
    background: "rgba(15,15,30,0.5)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 11, fontSize: 14, color: "#F1F5F9",
    outline: "none",
  },
  saveBtn: {
    width: "100%", padding: "14px",
    background: "linear-gradient(135deg, #6366F1, #A855F7)",
    border: "none", borderRadius: 12,
    color: "#fff", fontSize: 14, fontWeight: 700,
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    marginTop: 8,
    boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
  },

  // 원칙
  principleWrap: { padding: "8px 0 0" },
  principleTitle: {
    fontSize: 15, fontWeight: 700, color: "#F1F5F9",
    margin: "0 0 12px 20px",
  },
  principleCard: {
    display: "flex", gap: 12, alignItems: "flex-start",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12, padding: 14,
    margin: "0 20px 8px",
  },
  principleIconBox: {
    width: 36, height: 36, flexShrink: 0,
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 10, fontSize: 16,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  principleCardTitle: { fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 2 },
  principleCardDesc: { fontSize: 11, color: "#94A3B8", lineHeight: 1.5 },
};
