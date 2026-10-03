export type Preferences={role:string;location:string;keywords:string;seniority:string;visa:string;remote:boolean;sources:string};
export type Job={id:string;title:string;company:string;location:string;url:string;source:string;summary:string;seniority:string;visa:string;visaEvidence:string;salary:string;score:number;reasons:string[];gaps:string[];checkedAt:string;method:string;status:string;evidence:string};
export type Run={jobs:Job[];checkedAt:string;sources:number;duplicates:number;excluded:number;calls:{search:number;fetch:number;agent:number};warnings:string[];preferences:Preferences};
