import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"
import sharp from "sharp"
const F=(n,w)=>{const d=readFileSync(new URL(`./.scratch/social-cards/probe/fonts/${n}-${w}.ttf`,import.meta.url));return {name:n,data:d.buffer.slice(d.byteOffset,d.byteOffset+d.byteLength),weight:w}}
const fonts=[300,400,500,700].map(w=>F("SpaceGrotesk",w))
const SETTINGS={default:{}, "keep-all":{wordBreak:"keep-all"}, "line-break-strict":{lineBreak:"strict"}, "keep-all+strict":{wordBreak:"keep-all",lineBreak:"strict"}}
mkdirSync("/tmp/cjk",{recursive:true})
for (const [k,style] of Object.entries(SETTINGS)) {
  const node=h("div",{style:{width:600,height:200,display:"flex",background:"#F4F4F1",paddingLeft:20,alignItems:"center"}},
    h("div",{style:{width:560,fontFamily:"Space Grotesk",fontSize:56,fontWeight:500,letterSpacing:"-0.024em",lineHeight:1.04,color:"#14161A",...style}},"Daehyeon Mun (문대현)"))
  const buf=Buffer.from(await new ImageResponse(node,{width:600,height:200,fonts}).arrayBuffer())
  writeFileSync(`/tmp/cjk/${k}.png`,buf)
}
const imgs=[]
for (const k of Object.keys(SETTINGS)) imgs.push({k, b: await sharp(`/tmp/cjk/${k}.png`).png().toBuffer()})
await sharp({create:{width:600,height:200*imgs.length,channels:4,background:{r:255,g:255,b:255,alpha:1}}})
 .composite(imgs.map((im,i)=>({input:im.b,left:0,top:i*200}))).png().toFile("/tmp/cjk-sheet.png")
console.log("order top->bottom:", Object.keys(SETTINGS).join(", "))
