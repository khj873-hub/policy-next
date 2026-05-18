'use client'
import { create } from 'zustand'
import type { UserProfile, IdeaData, IdeaPhase, Message } from './types'
import { PROFILE_STORAGE_KEY } from './constants'

type AppStore = {
  profile: UserProfile
  setProfile: (p: UserProfile) => void
  savedProfile: UserProfile
  saveProfile: (p: UserProfile) => void
  loadProfile: () => void

  messages: Message[]
  setMessages: (msgs: Message[]) => void
  addMessage: (m: Message) => void
  clearMessages: () => void

  input: string
  setInput: (v: string) => void

  chatLoading: boolean
  setChatLoading: (v: boolean) => void

  ideaPhase: IdeaPhase
  setIdeaPhase: (v: IdeaPhase) => void
  ideaStep: number
  setIdeaStep: (v: number) => void
  ideaData: IdeaData
  setIdeaData: (v: IdeaData) => void

  selectedProgram: string
  setSelectedProgram: (v: string) => void

  planVisible: boolean
  setPlanVisible: (v: boolean) => void
  planContent: string
  setPlanContent: (v: string) => void
  planLoading: boolean
  setPlanLoading: (v: boolean) => void

  resetChat: () => void
}

const EMPTY_PROFILE: UserProfile = { region: '', industry: '', age: '' }
const EMPTY_IDEA: IdeaData = { problem: '', target: '', goal: '' }

export const useStore = create<AppStore>((set) => ({
  profile: EMPTY_PROFILE,
  setProfile: (p) => set({ profile: p }),
  savedProfile: EMPTY_PROFILE,
  saveProfile: (p) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(p))
    }
    set({ savedProfile: p, profile: p })
  },
  loadProfile: () => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
      if (raw) {
        const p = JSON.parse(raw) as UserProfile
        set({ profile: p, savedProfile: p })
      }
    }
  },

  messages: [],
  setMessages: (msgs) => set({ messages: msgs }),
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  clearMessages: () => set({ messages: [] }),

  input: '',
  setInput: (v) => set({ input: v }),

  chatLoading: false,
  setChatLoading: (v) => set({ chatLoading: v }),

  ideaPhase: null,
  setIdeaPhase: (v) => set({ ideaPhase: v }),
  ideaStep: 0,
  setIdeaStep: (v) => set({ ideaStep: v }),
  ideaData: EMPTY_IDEA,
  setIdeaData: (v) => set({ ideaData: v }),

  selectedProgram: '',
  setSelectedProgram: (v) => set({ selectedProgram: v }),

  planVisible: false,
  setPlanVisible: (v) => set({ planVisible: v }),
  planContent: '',
  setPlanContent: (v) => set({ planContent: v }),
  planLoading: false,
  setPlanLoading: (v) => set({ planLoading: v }),

  resetChat: () => set({
    messages: [],
    input: '',
    chatLoading: false,
    ideaPhase: null,
    ideaStep: 0,
    ideaData: EMPTY_IDEA,
    selectedProgram: '',
    planVisible: false,
    planContent: '',
    planLoading: false,
  }),
}))
