export type UserProfile = { region: string; industry: string; age: string }
export type PolicyItem = {
  id: string
  title: string
  dday: number
  region: string
  amount: string
  target: string
  deadline: string
  url: string
}
export type IdeaData = { problem: string; target: string; goal: string }
export type IdeaPhase = null | 'collecting' | 'done'
export type MessageType = 'user' | 'assistant' | 'question' | 'system' | 'ready'
export type Message = {
  role: 'user' | 'assistant'
  content: string
  type?: MessageType
  ideaData?: IdeaData
}
