import { type AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabaseAdmin } from '@/lib/supabase'

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string
      isAdmin?: boolean
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: { signIn: '/profile' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        await supabaseAdmin.from('users').upsert({
          google_id: account.providerAccountId,
          email: user.email,
          name: user.name || '',
          avatar: user.image || '',
          last_seen_at: new Date().toISOString(),
        }, { onConflict: 'google_id' })
      }
      return true
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub
        session.user.isAdmin = session.user.email === process.env.ADMIN_EMAIL
      }
      return session
    },
  },
}
