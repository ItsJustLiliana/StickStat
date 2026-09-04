import {z} from "zod";
import {HttpError} from "@/lib/api";

const releaseSchema=z.object({data:z.object({version:z.string().regex(/^\d+\.\d+\.\d+$/),buildNumber:z.number().int().positive(),downloadUrl:z.string().url(),sha256:z.string().regex(/^[a-f0-9]{64}$/i),sizeBytes:z.number().int().positive().nullable().optional(),packageName:z.literal("nl.stickstat.app"),notes:z.string().optional().default(""),releasedAt:z.string().optional()}).nullable()});

export const releaseFeedUrl=process.env.STICKSTAT_RELEASE_FEED_URL??"https://liliananuzohra.com/api/stickstat-release.php";
export async function fetchWebsiteRelease(){
  const feedUrl=new URL(releaseFeedUrl);let response:Response;
  try{response=await fetch(feedUrl,{cache:"no-store",signal:AbortSignal.timeout(10_000)})}catch{throw new HttpError(502,"RELEASE_FEED_UNAVAILABLE","De website-release is tijdelijk niet bereikbaar")}
  if(!response.ok)throw new HttpError(502,"RELEASE_FEED_FAILED",`De website-release kon niet worden opgehaald (${response.status})`);
  let payload:unknown;try{payload=await response.json()}catch{throw new HttpError(502,"INVALID_RELEASE_FEED","De website gaf geen geldige releasegegevens terug")}
  const parsed=releaseSchema.safeParse(payload);
  if(!parsed.success)throw new HttpError(502,"INVALID_RELEASE_FEED","De website gaf ongeldige releasegegevens terug");
  if(!parsed.data.data)throw new HttpError(404,"NO_RELEASE","Er staat nog geen geldige StickStat-release op de website");
  const finalFeedUrl=new URL(response.url),downloadUrl=new URL(parsed.data.data.downloadUrl,finalFeedUrl);
  if(downloadUrl.origin!==finalFeedUrl.origin)throw new HttpError(502,"INVALID_DOWNLOAD_HOST","De APK-download staat niet op dezelfde website als de releasefeed");
  if(downloadUrl.protocol!=="https:"&&!(["localhost","127.0.0.1","::1"].includes(downloadUrl.hostname)&&downloadUrl.protocol==="http:"))throw new HttpError(502,"INSECURE_DOWNLOAD","De APK-download moet HTTPS gebruiken");
  return {...parsed.data.data,downloadUrl:downloadUrl.toString(),sha256:parsed.data.data.sha256.toLowerCase()};
}
