import type {Job,Preferences} from "./jobs";
export function safeUrl(value:string):string|null{try{const u=new URL(value);const h=u.hostname.toLowerCase();if(u.protocol!=="https:"||u.username||u.password||u.port||!h.includes(".")||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(h)||h.includes(":")||/\.(local|internal|test|localhost)$/.test(h)||/^\d+[.\d]*$/.test(h))return null;u.hash="";return u.href}catch{return null}}
export function canonicalUrl(value:string){const valid=safeUrl(value);if(!valid)return "";const u=new URL(valid);for(const k of [...u.searchParams.keys()])if(/^(utm_|ref$|source$|src$|tracking|gh_src$|fbclid$|gclid$|lever-source$)/i.test(k))u.searchParams.delete(k);u.hostname=u.hostname.replace(/^www\./,"");u.pathname=u.pathname.replace(/\/$/,"")||"/";u.searchParams.sort();return u.toString()}
const normalized=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
export function tokens(v:string){return normalized(v).split(" ").filter(t=>t.length>2&&!['the','and','for','with','role','jobs','job'].includes(t))}
export function classifyVisa(text:string){const sentences=text.replace(/[*#]/g,"").split(/\n+|(?<=[.!?])\s+/).map(s=>s.trim()).filter(s=>s.length>8&&s.length<700&&/visa|sponsor|work authori|right to work/i.test(s));const negative=sentences.find(s=>/((not|no|cannot|unable|without|don.t|doesn.t|won.t|do not|does not).{0,65}sponsor|sponsor.{0,50}(not available|not offered|not provided)|must.{0,50}(right to work|work authori))/i.test(s));if(negative)return {visa:"not-supported",visaEvidence:negative};const positive=sentences.find(s=>/((offer|provide|available|eligible|support).{0,45}(visa sponsorship|sponsorship|work visa)|(visa sponsorship|sponsorship).{0,35}(available|provided|offered|supported))/i.test(s)&&!/(may|might|case.by.case|depending|not guaranteed)/i.test(s));return positive?{visa:"supported",visaEvidence:positive}:{visa:"unknown",visaEvidence:sentences[0]||""}}
export function seniorityOf(text:string){if(/\bintern(ship)?\b/i.test(text))return "Internship";if(/\b(graduate|entry.level|junior|new grad)\b/i.test(text))return "Graduate / entry level";if(/\b(senior|staff|principal|lead|director|head of)\b/i.test(text))return "Senior";if(/\b(mid.level|intermediate|engineer ii|associate)\b/i.test(text))return "Mid-level";return "Not stated"}
export function rankJob(job:Job,p:Preferences,body:string):Job|null{
 const title=normalized(job.title),text=normalized(body),terms=tokens(p.role),hits=terms.filter(t=>title.includes(t));
 if(!hits.length)return null;
 if(/software|developer|frontend|backend|full.?stack/i.test(p.role)&&!/software|developer|frontend|backend|full.?stack|data engineer|ai.*engineer|machine learning/i.test(job.title))return null;
 let score=Math.round(40*hits.length/Math.max(1,terms.length));const reasons:string[]=[hits.length===terms.length?"Role matches":"Related role"],gaps:string[]=[];
 const expected:Record<string,string>={intern:"Internship",junior:"Graduate / entry level",mid:"Mid-level",senior:"Senior"};
 if(p.seniority==='any'){score+=15}else if(job.seniority===expected[p.seniority]){score+=15;reasons.push(job.seniority)}else if(job.seniority!=="Not stated"){return null}else gaps.push("Experience level needs checking");
 const aliases:Record<string,string[]>={"new zealand":["nz","auckland","wellington","christchurch","hamilton","dunedin"],"australia":["sydney","melbourne","brisbane","perth","adelaide","canberra"],"united kingdom":["uk","london","manchester","edinburgh","bristol","birmingham"],"united states":["usa","united states","new york","san francisco","seattle","austin","boston"]};
 const loc=normalized(p.location),jobLoc=normalized(job.location);const locMatch=!loc||jobLoc.includes(loc)||loc.includes(jobLoc)&&jobLoc!=="not stated"||tokens(loc).some(t=>t.length>3&&jobLoc.includes(t))||(aliases[loc]||[]).some(a=>new RegExp('\\b'+a+'\\b').test(jobLoc));
 if(locMatch){score+=25;reasons.push(p.location?"Location matches":"Open location")}else if(p.remote&&/\bremote\b/i.test(job.location+" "+body.slice(0,1500))){score+=15;reasons.push("Remote mentioned");gaps.push("Check remote-country eligibility")}else {gaps.push("Location needs checking");}
 const keywords=p.keywords.split(",").map(s=>s.trim()).filter(Boolean),matched=keywords.filter(k=>text.includes(normalized(k)));score+=keywords.length?Math.round(10*matched.length/keywords.length):10;for(const k of matched.slice(0,3))reasons.push(k);if(keywords.length>matched.length)gaps.push("Some preferred keywords were not found");
 if(p.visa==="required"&&job.visa!=="supported")return null;
 if(p.visa==="any")score+=10;else if(job.visa==="supported"){score+=10;reasons.push("Sponsorship stated")}else gaps.push(job.visa==="not-supported"?"Sponsorship is not offered":"Sponsorship is unconfirmed");
 if(score<45)return null;
 return {...job,score:Math.min(100,score),reasons,gaps};
}
export function deduplicate(jobs:Job[]){const urls=new Set<string>(),identities=new Set<string>();let duplicates=0;const kept:Job[]=[];for(const j of [...jobs].sort((a,b)=>b.score-a.score)){const url=canonicalUrl(j.url);const identity=[j.company,j.title,j.location].map(normalized).join("|");if(urls.has(url)||identities.has(identity)){duplicates++;continue}urls.add(url);identities.add(identity);kept.push({...j,id:url,url})}return {jobs:kept,duplicates}}
export function looksLikeListing(url:string){return /\/(jobs?|positions?|vacanc(?:y|ies)|careers|requisitions?)\/.{3,}|\/[^/]+\/[a-f0-9-]{12,}|[?&](gh_jid|jobid|job_id|reqid)=/i.test(url)}
export type Page={url:string;final_url?:string;title?:string;text:string;links?:string[]};
export type Hints={title?:string;company?:string;location?:string;salary?:string;url?:string;evidence?:string};
export function parseJob(page:Page,p:Preferences,hints:Hints={},method="fetch"):Job|null{
 const url=safeUrl(page.final_url||page.url);if(!url)return null;
 const text=typeof page.text==="string"?page.text:"";if(text.length<180||/(this (job|position|vacancy).{0,35}(no longer|has been filled|is closed)|no longer accepting applications|job (has expired|not found)|position has been filled)/i.test(text))return null;
 const headings=text.split('\n').map(s=>s.replace(/^#+\s*/,"").replace(/[*]/g,"").trim()).filter(s=>s.length>6&&s.length<160);
 let title=page.title||"";const mainHeading=text.match(/^#{1,2}\s+([^\n]+)/m)?.[1];if(mainHeading&&tokens(p.role).some(t=>normalized(mainHeading).includes(t)))title=mainHeading;if(hints.title&&normalized(text).includes(normalized(hints.title)))title=hints.title;
 if(!tokens(p.role).some(t=>normalized(title).includes(t))){title=headings.find(h=>tokens(p.role).some(t=>normalized(h).includes(t)))||title;}
 if(!title||/jobs in |job search|search (jobs|results)|\d+ .*jobs|careers at|current vacancies|open positions|all jobs/i.test(title))return null;
 if(!looksLikeListing(url)&&!/(apply (now|for this|to this)|submit.{0,20}application)/i.test(text))return null;
 if(!/(responsibilit|qualifications|requirements|about (the|this) role|you.ll|you will|apply|job description)/i.test(text))return null;
 let company="";const at=title.match(/\s+at\s+([^|–—]+)(?:\s*[|–—]|$)/i);const divider=title.split(/\s+[|–—]\s+/);if(at)company=at[1].trim();else if(divider.length>1)company=divider.at(-1)!.replace(/careers|jobs/ig,"").trim();
 title=title.replace(/^Job Application for\s+/i,"").replace(/\s+at\s+[^|–—]+.*$/i,"").replace(/\s+[|–—]\s+.*$/,"").replace(/\s+-\s+(careers|jobs).*$/i,"").trim();
 if(hints.company&&normalized(text).includes(normalized(hints.company)))company=hints.company;
 const u=new URL(url);if(!company){const about=text.match(/(?:\*\*|#{1,3}\s*)ABOUT ([A-Z][A-Z &.-]{2,45})(?:\*\*|\n)/)?.[1];if(about&&!/THE ROLE|THE JOB|YOU|US|TEAM/.test(about))company=about.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());else if(/greenhouse|lever|ashbyhq|smartrecruiters|workable/.test(u.hostname))company=u.pathname.split("/").filter(Boolean)[0]||u.hostname;else company=u.hostname.replace(/^(www|jobs|careers)\./,"").split(".")[0]}
 const clean=text.replace(/[*#]/g,"");const headerLocation=text.match(/^#{1,2}\s+[^\n]+\n+([^\n]{3,350})/m)?.[1]?.trim();const locationLine=clean.match(/(?:^|\n)\s*(?:job )?location(?:s)?\s*[:\n]+\s*([^\n]{3,140})/i)?.[1];let location=locationLine||(headerLocation&&/[,/]|remote|auckland|wellington|london|sydney|melbourne/i.test(headerLocation)?headerLocation:"Not stated");
 if(hints.location&&normalized(text).includes(normalized(hints.location)))location=hints.location;
 else if(location==="Not stated"&&p.location&&normalized(text.slice(0,4000)).includes(normalized(p.location)))location=p.location;
 if(/\bremote\b/i.test(clean.slice(0,1200))&&!/remote/i.test(location))location=location==="Not stated"?"Remote":location+" · Remote";
 let seniority=seniorityOf(title);if(seniority==="Not stated"){if(/(this internship|internship program|internship position|graduate program|entry.level (role|position))/i.test(text))seniority=/internship/i.test(text)?"Internship":"Graduate / entry level";}const {visa,visaEvidence}=classifyVisa(text);
 const evidenceLine=hints.evidence&&text.includes(hints.evidence)?hints.evidence:headings.find(h=>/responsib|you will|you.ll|we are looking|we.re looking|seeking|opportunity/i.test(h)&&h.length>45)||headings.find(h=>h.length>85)||clean.slice(0,350);
 const salary=clean.match(/(?:NZ\$|AU\$|US\$|\$|£|€)\s?[\d,]+(?:\s?[-–]\s?(?:NZ\$|AU\$|US\$|\$|£|€)?\s?[\d,]+)?\s?(?:per (?:hour|year|annum)|\/h(?:r)?|\/year|annually|p\.a\.)?/i)?.[0]||"";
 const job:Job={id:canonicalUrl(url),title,company,location,url,source:u.hostname.replace(/^www\./,""),summary:evidenceLine.slice(0,260),seniority,visa,visaEvidence,salary,score:0,reasons:[],gaps:[],checkedAt:new Date().toISOString(),method,status:"Listing accessible",evidence:evidenceLine.slice(0,600)};
 return rankJob(job,p,text);
}
