import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/dashboard'
  }),
  callback: handleCallback(),
  logout: handleLogout({
    returnTo: '/'
  })
});

export const POST = handleAuth(); 