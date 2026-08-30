type SessionCookieEnvironment={NODE_ENV?:string;SESSION_COOKIE_SECURE?:string};

export function shouldUseSecureSessionCookie(environment:SessionCookieEnvironment=process.env){
  const configured=environment.SESSION_COOKIE_SECURE?.trim().toLowerCase();
  if(configured==="true")return true;
  if(configured==="false")return false;
  return environment.NODE_ENV==="production";
}
