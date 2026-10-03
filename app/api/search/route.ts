import {z} from "zod";
import {findJobs} from "@/lib/tinyfish";
import {safeUrl} from "@/lib/matching";
export const dynamic="force-dynamic";
const schema=z.object({role:z.string().trim().min(2).max(100),location:z.string().trim().max(100),keywords:z.string().trim().max(200),seniority:z.enum(['intern','junior','mid','senior','any']),visa:z.enum(['any','preferred','required']),remote:z.boolean(),sources:z.string().max(1500)}).strict();
export async function POST(request:Request){
 const origin=request.headers.get('origin');if(origin&&new URL(origin).host!==new URL(request.url).host)return Response.json({error:"Cross-origin searches are not allowed."},{status:403});
 if(Number(request.headers.get('content-length')||0)>8000)return Response.json({error:"Search input is too large."},{status:413});
 let raw;try{const text=await request.text();if(text.length>8000)return Response.json({error:"Search input is too large."},{status:413});raw=JSON.parse(text)}catch{return Response.json({error:"Invalid search request."},{status:400})}
 const parsed=schema.safeParse(raw);if(!parsed.success)return Response.json({error:"Please enter a role and valid search preferences."},{status:400});const p=parsed.data;const urls=p.sources.split(/[\n,]+/).map(u=>u.trim()).filter(Boolean);if(urls.length>3||urls.some(u=>!safeUrl(u)))return Response.json({error:"Use up to three public HTTPS careers URLs."},{status:400});
 const clientKey = request.headers.get('x-tinyfish-api-key');
 const key=clientKey||process.env.TINYFISH_API_KEY;if(!key)return Response.json({error:"TinyFish API key is missing. Please provide it in the preferences or configure it on the server."},{status:503});
 const encoder=new TextEncoder();const controller=new AbortController();request.signal.addEventListener('abort',()=>controller.abort(),{once:true});
 const stream=new ReadableStream({async start(c){let open=true;function send(value:unknown){if(open)try{c.enqueue(encoder.encode(JSON.stringify(value)+'\n'))}catch{open=false;controller.abort()}}const heartbeat=setInterval(()=>send({type:"heartbeat"}),12000);try{const data=await findJobs(p,key,message=>send({type:"progress",message}),controller.signal);send({type:"result",data})}catch(e){send({type:"error",message:e instanceof Error?e.message:"Search failed. Please try again."})}finally{clearInterval(heartbeat);if(open){open=false;c.close()}}},cancel(){controller.abort()}});
 return new Response(stream,{headers:{"Content-Type":"application/x-ndjson","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}})
}
