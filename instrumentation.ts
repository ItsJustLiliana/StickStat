export async function register(){
  if(process.env.NEXT_RUNTIME!=="nodejs")return;
  const g=globalThis as unknown as {stickstatSyncStarted?:boolean}; if(g.stickstatSyncStarted)return; g.stickstatSyncStarted=true;
  const minutes=Math.max(5,Number(process.env.SYNC_INTERVAL_MINUTES)||60);
  setInterval(async()=>{ const {syncAllTeams}=await import("./services/sync"); await syncAllTeams(); },minutes*60_000).unref();
  console.info(JSON.stringify({timestamp:new Date().toISOString(),level:"info",message:"StickStat server gestart",syncIntervalMinutes:minutes}));
}
