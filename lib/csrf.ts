export function isSameOriginHost(origin:string,requestHost:string|null){
  if(!requestHost)return false;
  try{return new URL(origin).host===requestHost}catch{return false}
}
