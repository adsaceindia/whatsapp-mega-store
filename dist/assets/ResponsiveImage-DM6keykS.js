import{r as f,H as n,j as s}from"./index-DVmq-NvI.js";function d({src:r,alt:u,className:a="",...l}){const[p,o]=f.useState(!1),c=n.useRef(null);n.useEffect(()=>{var e;(e=c.current)!=null&&e.complete&&o(!0)},[r]);const i=(e=>{if(!e)return"";try{if(e.includes("images.unsplash.com")){const t=new URL(e);return t.searchParams.set("fm","webp"),t.searchParams.set("q","75"),`
          ${t.toString()}&w=400 400w,
          ${t.toString()}&w=800 800w,
          ${t.toString()}&w=1200 1200w
        `.trim()}}catch{}return""})(r);return s.jsxs("picture",{className:`block w-full h-full ${a}`,children:[i&&s.jsx("source",{type:"image/webp",srcSet:i,sizes:"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}),s.jsx("img",{ref:c,src:r,alt:u,loading:"lazy",onLoad:()=>o(!0),className:`transition-opacity duration-500 w-full h-full object-cover ${p?"opacity-100":"opacity-0"} ${a}`,referrerPolicy:"no-referrer",...l})]})}export{d as R};
