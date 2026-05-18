import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const email = req.nextauth.token?.email
    if (email !== process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
