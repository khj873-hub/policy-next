import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabaseAdmin } from '@/lib/supabase'

const handler = NextAuth({
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
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
