import { useState, useRef, useEffect, useCallback } from “react”;

const CATEGORIES = {
character: { label:“الشخصية”, emoji:“👤”, color:”#FF6B6B”, items:[“محقق متقاعد”,“ساحرة شابة”,“رائد فضاء”,“طبيب سري”,“لص محترف”,“أميرة مفقودة”,“عالم مجنون”,“جاسوس مزدوج”,“صياد وحوش”,“ملك مخلوع”,“روبوت واعٍ”,“نبي كاذب”] },
place:     { label:“المكان”,    emoji:“🗺️”, color:”#4ECDC4”, items:[“مدينة تحت الماء”,“محطة فضائية مهجورة”,“قرية معزولة”,“متاهة لا نهاية لها”,“جزيرة طافية”,“مدينة بلا شمس”,“غابة تتحرك”,“مكتبة لا نهائية”,“قطار لا يتوقف”,“برج يمتد للسماء”,“صحراء من الثلج”,“عالم داخل حلم”] },
conflict:  { label:“الصراع”,   emoji:“⚡”,  color:”#FFE66D”, items:[“خيانة من أقرب شخص”,“سر يهدد العالم”,“عودة شر قديم”,“اختيار بين حياتين”,“مطاردة لا تنتهي”,“ذاكرة مسروقة”,“حرب على وشك الانفجار”,“مرض غريب ينتشر”,“نبوءة لا مفر منها”,“شخصية أخرى داخل عقلك”,“الزمن يعود للخلف”,“موت يعود للحياة”] },
genre:     { label:“النوع”,     emoji:“🎭”, color:”#A8E6CF”, items:[“رعب نفسي”,“خيال علمي”,“فانتازيا ملحمية”,“رومانسي داكن”,“إثارة وتشويق”,“مغامرة”,“غموض وتحقيق”,“ما وراء الطبيعة”,“ديستوبيا”,“أكشن”,“دراما عائلية”,“كوميديا سوداء”] }
};

const TWISTS = [“البطل هو الشرير في النهاية”,“كل شيء كان حلماً… أو ربما لا”,“الوقت يعمل بشكل معكوس”,“الشخصية الثانوية هي المحرك الحقيقي”,“العدو والبطل نفس الشخص”,“العالم كله وهم مصطنع”,“النهاية هي البداية”,“الوحش الحقيقي هو الإنسان”];

const AVATARS = [“🧙”,“🦸”,“🧛”,“🧜”,“🧝”,“🕵️”,“👸”,“🤖”,“🧟”,“🦊”,“🐉”,“⚔️”];

// ── Shared storage helpers ──────────────────────────────────────────────────
const COMMUNITY_KEY = “community-stories-v1”;

async function loadCommunity() {
try {
const r = await window.storage.get(COMMUNITY_KEY, true);
return r ? JSON.parse(r.value) : [];
} catch { return []; }
}

async function saveCommunity(stories) {
try {
await window.storage.set(COMMUNITY_KEY, JSON.stringify(stories), true);
} catch (e) { console.error(“storage error”, e); }
}

// ── Spin Wheel Canvas ───────────────────────────────────────────────────────
function SpinWheel({ data, spinning, result }) {
const canvasRef = useRef(null);
const animRef   = useRef(null);
const angleRef  = useRef(0);
const busyRef   = useRef(false);

useEffect(() => {
const canvas = canvasRef.current;
if (!canvas) return;
const ctx = canvas.getContext(“2d”);
const S = canvas.width, C = S / 2, R = C - 8;
const items = data.items;
const slice = (2 * Math.PI) / items.length;

```
function draw(a) {
  ctx.clearRect(0, 0, S, S);
  const g = ctx.createRadialGradient(C,C,0,C,C,R);
  g.addColorStop(0, data.color+"33"); g.addColorStop(1,"transparent");
  ctx.fillStyle = g; ctx.fillRect(0,0,S,S);

  items.forEach((item, i) => {
    const s = a + i*slice, e = s + slice;
    ctx.beginPath(); ctx.moveTo(C,C); ctx.arc(C,C,R,s,e); ctx.closePath();
    ctx.fillStyle = data.color+(i%2===0?"22":"11"); ctx.fill();
    ctx.strokeStyle = data.color+"44"; ctx.lineWidth=1; ctx.stroke();
    ctx.save(); ctx.translate(C,C); ctx.rotate(s+slice/2);
    ctx.textAlign="right"; ctx.fillStyle="#fff";
    ctx.font=`bold 10px 'Noto Sans Arabic',sans-serif`;
    ctx.shadowColor=data.color; ctx.shadowBlur=4;
    const w=item.split(" ");
    if(w.length>2){ctx.fillText(w.slice(0,2).join(" "),R-10,-4);ctx.fillText(w.slice(2).join(" "),R-10,10);}
    else ctx.fillText(item,R-10,4);
    ctx.restore();
  });

  ctx.beginPath(); ctx.arc(C,C,18,0,2*Math.PI);
  ctx.fillStyle="#0a0a0f"; ctx.fill();
  ctx.strokeStyle=data.color; ctx.lineWidth=2; ctx.stroke();
  ctx.font="16px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(data.emoji,C,C);

  ctx.beginPath(); ctx.moveTo(C-10,2); ctx.lineTo(C+10,2); ctx.lineTo(C,22); ctx.closePath();
  ctx.fillStyle=data.color; ctx.shadowColor=data.color; ctx.shadowBlur=10; ctx.fill(); ctx.shadowBlur=0;
}

if (spinning && !busyRef.current) {
  busyRef.current = true;
  const ri = data.items.indexOf(result);
  const target = angleRef.current + (6+Math.random()*4)*2*Math.PI + (-ri*slice - slice/2 - Math.PI/2 - angleRef.current%(2*Math.PI));
  const go = () => {
    const d = target - angleRef.current;
    if(d<=0.01){angleRef.current=target;busyRef.current=false;draw(angleRef.current);return;}
    angleRef.current += Math.max(0.002, 0.3*Math.pow(d/(target-angleRef.current+0.001),0.4));
    draw(angleRef.current); animRef.current=requestAnimationFrame(go);
  };
  animRef.current=requestAnimationFrame(go);
}
if(!spinning) draw(angleRef.current);
return ()=>{if(animRef.current)cancelAnimationFrame(animRef.current);};
```

},[spinning,data,result]);

return <canvas ref={canvasRef} width={220} height={220} style={{display:“block”}}/>;
}

// ── Story Card ──────────────────────────────────────────────────────────────
function StoryCard({ story, onLike, myId }) {
const liked = story.likes?.includes(myId);
return (
<div style={{background:“rgba(255,255,255,0.03)”,border:“1px solid rgba(255,255,255,0.08)”,borderRadius:16,padding:20,marginBottom:16,transition:“border-color .2s”}}
onMouseEnter={e=>e.currentTarget.style.borderColor=“rgba(255,255,255,0.15)”}
onMouseLeave={e=>e.currentTarget.style.borderColor=“rgba(255,255,255,0.08)”}>
{/* author */}
<div style={{display:“flex”,alignItems:“center”,gap:10,marginBottom:14}}>
<div style={{width:36,height:36,borderRadius:“50%”,background:“rgba(108,99,255,0.2)”,border:“1px solid rgba(108,99,255,0.4)”,display:“flex”,alignItems:“center”,justifyContent:“center”,fontSize:18}}>
{story.avatar}
</div>
<div>
<div style={{fontWeight:700,fontSize:14,color:”#fff”}}>{story.author}</div>
<div style={{fontSize:11,color:“rgba(255,255,255,0.3)”}}>{story.date}</div>
</div>
</div>

```
  {/* story sentence */}
  <p style={{fontSize:15,lineHeight:1.9,color:"rgba(255,255,255,0.85)",marginBottom:10}}>
    قصة <strong style={{color:CATEGORIES.genre.color}}>{story.results.genre}</strong> عن{" "}
    <strong style={{color:CATEGORIES.character.color}}>{story.results.character}</strong> يجد نفسه في{" "}
    <strong style={{color:CATEGORIES.place.color}}>{story.results.place}</strong> ويواجه{" "}
    <strong style={{color:CATEGORIES.conflict.color}}>{story.results.conflict}</strong>.
  </p>

  {story.twist && (
    <div style={{fontSize:12,color:"#a09cff",marginBottom:10}}>🌀 {story.twist}</div>
  )}

  {story.aiStory && (
    <div style={{fontSize:13,color:"rgba(255,255,255,0.55)",background:"rgba(108,99,255,0.06)",border:"1px solid rgba(108,99,255,0.15)",borderRadius:10,padding:"10px 14px",marginBottom:12,lineHeight:1.85}}>
      {story.aiStory}
    </div>
  )}

  {/* tags */}
  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
    {Object.entries(CATEGORIES).map(([k,d])=>(
      <span key={k} style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:d.color+"15",color:d.color,border:`1px solid ${d.color}33`}}>
        {d.emoji} {story.results[k]}
      </span>
    ))}
  </div>

  {/* like */}
  <button onClick={()=>onLike(story.id)}
    style={{background:liked?"rgba(255,107,107,0.2)":"rgba(255,255,255,0.05)",border:liked?"1px solid rgba(255,107,107,0.5)":"1px solid rgba(255,255,255,0.1)",color:liked?"#ff8f8f":"rgba(255,255,255,0.4)",fontFamily:"'Cairo',sans-serif",fontSize:13,fontWeight:700,padding:"6px 16px",borderRadius:20,cursor:"pointer",transition:"all .2s",display:"inline-flex",alignItems:"center",gap:6}}>
    {liked?"❤️":"🤍"} {story.likes?.length||0}
  </button>
</div>
```

);
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function StoryWheel() {
const [spinning,  setSpinning]  = useState(false);
const [results,   setResults]   = useState({});
const [twist,     setTwist]     = useState(null);
const [revealed,  setRevealed]  = useState(false);
const [spinKey,   setSpinKey]   = useState(0);
const [favorites, setFavorites] = useState([]);
const [aiStory,   setAiStory]   = useState(””);
const [aiLoading, setAiLoading] = useState(false);
const [activeTab, setActiveTab] = useState(“wheel”);
const [copied,    setCopied]    = useState(false);
const [showNotif, setShowNotif] = useState(””);

// community
const [community,    setCommunity]    = useState([]);
const [commLoading,  setCommLoading]  = useState(false);
const [authorName,   setAuthorName]   = useState(””);
const [sharing,      setSharing]      = useState(false);
const [sortBy,       setSortBy]       = useState(“newest”); // newest | liked
const [myId]  = useState(()=> Math.random().toString(36).slice(2));
const [myAvatar] = useState(()=> AVATARS[Math.floor(Math.random()*AVATARS.length)]);

// load community on mount & when tab opens
const fetchCommunity = useCallback(async () => {
setCommLoading(true);
const data = await loadCommunity();
setCommunity(data);
setCommLoading(false);
}, []);

useEffect(()=>{ if(activeTab===“community”) fetchCommunity(); },[activeTab,fetchCommunity]);

// spin
const spinAll = () => {
if(spinning) return;
setRevealed(false); setTwist(null); setAiStory(””);
const nr={};
Object.keys(CATEGORIES).forEach(k=>{ const it=CATEGORIES[k].items; nr[k]=it[Math.floor(Math.random()*it.length)]; });
setResults(nr); setSpinning(true); setSpinKey(x=>x+1);
setTimeout(()=>{ setSpinning(false); setTwist(TWISTS[Math.floor(Math.random()*TWISTS.length)]); setRevealed(true); },4500);
};

// AI expand
const expandWithAI = async () => {
if(!results.character||aiLoading) return;
setAiLoading(true); setAiStory(””);
try {
const res = await fetch(”/api/generate”,{
method:“POST”, headers:{“Content-Type”:“application/json”},
body:JSON.stringify({ model:“claude-sonnet-4-20250514”, max_tokens:1000,
messages:[{role:“user”,content:`أنت كاتب قصص إبداعي محترف. اكتب فقرة واحدة فقط (5-7 جمل) باللغة العربية تصف مقدمة لقصة:\n- النوع: ${results.genre}\n- الشخصية: ${results.character}\n- المكان: ${results.place}\n- الصراع: ${results.conflict}\n- الـ Twist: ${twist}\nأسلوب أدبي جذاب من السطر الأول. الفقرة فقط بدون أي مقدمة.`}]
})
});
const d=await res.json();
setAiStory(d.content?.find(b=>b.type===“text”)?.text||””);
} catch { setAiStory(“حدث خطأ، حاول مرة ثانية.”); }
setAiLoading(false);
};

// favorites
const saveFavorite = () => {
if(!revealed||!results.character) return;
setFavorites(p=>[{id:Date.now(),results:{…results},twist,aiStory},…p]);
notify(“❤️ تم الحفظ في المفضلة”);
};
const removeFavorite = id => setFavorites(p=>p.filter(f=>f.id!==id));

// copy/share
const shareStory = () => {
const t=`قصة ${results.genre} عن ${results.character} يجد نفسه في ${results.place} ويواجه ${results.conflict}.\n🌀 Twist: ${twist}`;
if(navigator.share) navigator.share({title:“فكرة قصة 📖”,text:t});
else { navigator.clipboard.writeText(t); setCopied(true); setTimeout(()=>setCopied(false),2000); }
};

// share to community
const shareToCommunity = async () => {
if(!revealed||!results.character||sharing) return;
setSharing(true);
const name = authorName.trim()||“مجهول”;
const entry = {
id: Date.now()+”-”+myId,
author: name,
avatar: myAvatar,
date: new Date().toLocaleDateString(“ar-SA”,{day:“numeric”,month:“short”,year:“numeric”}),
results:{…results}, twist, aiStory,
likes:[], authorId: myId
};
const current = await loadCommunity();
const updated = [entry, …current].slice(0,200); // max 200
await saveCommunity(updated);
setCommunity(updated);
notify(“🌍 تمت المشاركة مع المجتمع!”);
setSharing(false);
};

// like
const handleLike = async (storyId) => {
const updated = community.map(s=>{
if(s.id!==storyId) return s;
const likes=s.likes||[];
return {…s, likes: likes.includes(myId) ? likes.filter(x=>x!==myId) : […likes,myId]};
});
setCommunity(updated);
await saveCommunity(updated);
};

const notify = (msg) => { setShowNotif(msg); setTimeout(()=>setShowNotif(””),2500); };

const hasResult = Object.keys(results).length>0;
const sorted = […community].sort((a,b)=>
sortBy===“liked” ? (b.likes?.length||0)-(a.likes?.length||0) : b.id-a.id
);

return (
<div style={{minHeight:“100vh”,background:”#07070d”,color:”#fff”,fontFamily:”‘Noto Sans Arabic’,‘Cairo’,sans-serif”,direction:“rtl”,position:“relative”,overflow:“hidden”}}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Noto+Sans+Arabic:wght@400;700;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} .glow-text{text-shadow:0 0 30px currentColor;} .wheel-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:10px;transition:all .3s;backdrop-filter:blur(10px);} .wheel-card:hover{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.15);} .spin-btn{background:linear-gradient(135deg,#6c63ff,#ff6b6b);border:none;color:white;font-family:'Cairo',sans-serif;font-size:20px;font-weight:900;padding:18px 60px;border-radius:50px;cursor:pointer;transition:all .3s;position:relative;overflow:hidden;} .spin-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,#ff6b6b,#6c63ff);opacity:0;transition:opacity .3s;} .spin-btn:hover::before{opacity:1;} .spin-btn:hover{transform:scale(1.05);box-shadow:0 0 40px rgba(108,99,255,.5);} .spin-btn:active{transform:scale(.97);} .spin-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;} .spin-btn span{position:relative;} .rtag{display:inline-block;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} @keyframes pulse-glow{0%,100%{box-shadow:0 0 20px rgba(108,99,255,.3)}50%{box-shadow:0 0 40px rgba(255,107,107,.5)}} .story-box{animation:fadeUp .6s ease forwards,pulse-glow 3s infinite;} .bg-orb{position:fixed;border-radius:50%;filter:blur(80px);opacity:.15;pointer-events:none;z-index:0;} .content{position:relative;z-index:1;} .abtn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:white;font-family:'Cairo',sans-serif;font-size:14px;font-weight:700;padding:10px 20px;border-radius:30px;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:6px;} .abtn:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.25);transform:translateY(-1px);} .abtn:disabled{opacity:.5;cursor:not-allowed;transform:none;} .abtn.ai{background:rgba(108,99,255,.15);border-color:rgba(108,99,255,.4);color:#a09cff;} .abtn.ai:hover{background:rgba(108,99,255,.25);} .abtn.fav{background:rgba(255,107,107,.1);border-color:rgba(255,107,107,.3);color:#ff8f8f;} .abtn.fav:hover{background:rgba(255,107,107,.2);} .abtn.share{background:rgba(78,205,196,.1);border-color:rgba(78,205,196,.3);color:#4ecdc4;} .abtn.share:hover{background:rgba(78,205,196,.2);} .abtn.comm{background:rgba(168,230,207,.1);border-color:rgba(168,230,207,.3);color:#a8e6cf;} .abtn.comm:hover{background:rgba(168,230,207,.2);} .tab-btn{background:transparent;border:none;color:rgba(255,255,255,.4);font-family:'Cairo',sans-serif;font-size:15px;font-weight:700;padding:10px 20px;cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;} .tab-btn.active{color:#fff;border-bottom-color:#6c63ff;} @keyframes notif{0%{opacity:0;transform:translateX(-50%) translateY(10px)}20%,80%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-10px)}} .notif{animation:notif 2.5s ease forwards;} .ai-text{background:rgba(108,99,255,.08);border:1px solid rgba(108,99,255,.2);border-radius:12px;padding:20px;margin-top:16px;font-size:16px;line-height:2;color:rgba(255,255,255,.85);animation:fadeUp .5s ease;} @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:1}} .dots span{animation:shimmer 1.2s infinite;display:inline-block;margin:0 2px;} .dots span:nth-child(2){animation-delay:.2s}.dots span:nth-child(3){animation-delay:.4s} .sort-btn{background:transparent;border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.4);font-family:'Cairo',sans-serif;font-size:13px;padding:6px 14px;border-radius:20px;cursor:pointer;transition:all .2s;} .sort-btn.active{background:rgba(108,99,255,.2);border-color:rgba(108,99,255,.5);color:#a09cff;} .name-input{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:#fff;font-family:'Cairo',sans-serif;font-size:14px;padding:10px 16px;border-radius:12px;outline:none;width:180px;transition:border-color .2s;} .name-input:focus{border-color:rgba(168,230,207,.5);} .name-input::placeholder{color:rgba(255,255,255,.25);} .spin-indicator{width:8px;height:8px;border-radius:50%;background:#4ecdc4;display:inline-block;animation:shimmer .8s infinite;margin-left:6px;}`}</style>

```
  <div className="bg-orb" style={{width:400,height:400,background:"#6c63ff",top:-100,right:-100}}/>
  <div className="bg-orb" style={{width:300,height:300,background:"#ff6b6b",bottom:100,left:-50}}/>
  <div className="bg-orb" style={{width:200,height:200,background:"#4ECDC4",top:"50%",left:"50%"}}/>

  {showNotif && (
    <div className="notif" style={{position:"fixed",top:24,left:"50%",background:"linear-gradient(135deg,#6c63ff,#ff6b6b)",color:"#fff",padding:"12px 28px",borderRadius:30,fontWeight:700,zIndex:999,fontSize:14,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(108,99,255,.4)"}}>
      {showNotif}
    </div>
  )}

  <div className="content" style={{maxWidth:960,margin:"0 auto",padding:"40px 20px"}}>

    {/* Header */}
    <div style={{textAlign:"center",marginBottom:32}}>
      <div style={{fontSize:13,letterSpacing:4,color:"#6c63ff",marginBottom:12,fontWeight:700}}>✦ مولّد أفكار القصص ✦</div>
      <h1 className="glow-text" style={{fontSize:"clamp(36px,7vw,72px)",fontWeight:900,color:"#fff",lineHeight:1.1,marginBottom:12}}>اكتشف قصتك</h1>
      <p style={{color:"rgba(255,255,255,.4)",fontSize:16}}>لفّ العجلات واحصل على فكرة قصة فريدة</p>
    </div>

    {/* Tabs */}
    <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,.08)",marginBottom:32,gap:4}}>
      {[
        {id:"wheel",    label:"🎲 المولّد"},
        {id:"favorites",label:`❤️ المفضلة${favorites.length>0?" ("+favorites.length+")":""}`},
        {id:"community",label:<>🌍 المجتمع{community.length>0&&<span style={{background:"#6c63ff",color:"#fff",borderRadius:"50%",padding:"1px 7px",fontSize:11,marginRight:6}}>{community.length}</span>}</>}
      ].map(t=>(
        <button key={t.id} className={`tab-btn ${activeTab===t.id?"active":""}`} onClick={()=>setActiveTab(t.id)}>{t.label}</button>
      ))}
    </div>

    {/* ── WHEEL TAB ── */}
    {activeTab==="wheel" && (
      <>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:20,marginBottom:40}}>
          {Object.entries(CATEGORIES).map(([k,d])=>(
            <div key={k} className="wheel-card">
              <div style={{fontSize:13,fontWeight:700,color:d.color,letterSpacing:2}}>{d.label}</div>
              <SpinWheel key={`${k}-${spinKey}`} data={d} spinning={spinning} result={results[k]}/>
              {revealed&&results[k]&&(
                <div className="rtag" style={{background:d.color+"22",color:d.color,border:`1px solid ${d.color}44`,animation:"fadeUp .5s ease"}}>{results[k]}</div>
              )}
            </div>
          ))}
        </div>

        <div style={{textAlign:"center",marginBottom:40}}>
          <button className="spin-btn" onClick={spinAll} disabled={spinning}>
            <span>{spinning?"⟳  جاري التحميص...":"🎲  لفّ العجلات"}</span>
          </button>
        </div>

        {revealed&&hasResult&&(
          <div className="story-box" style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.1)",borderRadius:20,padding:32,backdropFilter:"blur(20px)",marginBottom:24}}>
            <div style={{fontSize:12,letterSpacing:3,color:"rgba(255,255,255,.4)",marginBottom:20}}>✦ فكرة قصتك ✦</div>

            <p style={{fontSize:"clamp(16px,2.5vw,20px)",lineHeight:2,color:"rgba(255,255,255,.9)"}}>
              قصة <strong style={{color:CATEGORIES.genre.color}}>{results.genre}</strong> عن{" "}
              <strong style={{color:CATEGORIES.character.color}}>{results.character}</strong> يجد نفسه في{" "}
              <strong style={{color:CATEGORIES.place.color}}>{results.place}</strong> ويواجه{" "}
              <strong style={{color:CATEGORIES.conflict.color}}>{results.conflict}</strong>.
            </p>

            {twist&&(
              <div style={{marginTop:20,padding:"14px 18px",background:"rgba(108,99,255,.1)",border:"1px solid rgba(108,99,255,.3)",borderRadius:12,display:"flex",gap:12,alignItems:"center"}}>
                <span style={{fontSize:20}}>🌀</span>
                <div>
                  <div style={{fontSize:11,color:"#6c63ff",letterSpacing:2,marginBottom:4}}>TWIST</div>
                  <div style={{fontSize:15,color:"rgba(255,255,255,.8)"}}>{twist}</div>
                </div>
              </div>
            )}

            {aiLoading&&<div className="ai-text"><div className="dots">✍️ الذكاء الاصطناعي يكتب<span>.</span><span>.</span><span>.</span></div></div>}
            {aiStory&&!aiLoading&&(
              <div className="ai-text">
                <div style={{fontSize:11,color:"#a09cff",letterSpacing:2,marginBottom:12}}>✦ AI كتب لك المقدمة ✦</div>
                {aiStory}
              </div>
            )}

            <div style={{marginTop:20,display:"flex",gap:8,flexWrap:"wrap"}}>
              {Object.entries(CATEGORIES).map(([k,d])=>(
                <span key={k} className="rtag" style={{background:d.color+"15",color:d.color,border:`1px solid ${d.color}33`}}>{d.emoji} {results[k]}</span>
              ))}
            </div>

            {/* actions */}
            <div style={{marginTop:24,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
              <button className="abtn ai" onClick={expandWithAI} disabled={aiLoading}>
                <span>✨</span><span>{aiLoading?"جاري الكتابة...":aiStory?"أعد الكتابة بـ AI":"وسّع الفكرة بـ AI"}</span>
              </button>
              <button className="abtn fav" onClick={saveFavorite}><span>❤️</span><span>احفظ</span></button>
              <button className="abtn share" onClick={shareStory}><span>{copied?"✅":"📤"}</span><span>{copied?"تم النسخ!":"شارك"}</span></button>
            </div>

            {/* share to community */}
            <div style={{marginTop:16,padding:"16px 20px",background:"rgba(168,230,207,.05)",border:"1px solid rgba(168,230,207,.15)",borderRadius:14,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:18}}>🌍</span>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontSize:13,color:"#a8e6cf",fontWeight:700,marginBottom:6}}>شارك فكرتك مع المجتمع</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,.35)"}}>ستظهر لجميع المستخدمين في تاب المجتمع</div>
              </div>
              <input className="name-input" value={authorName} onChange={e=>setAuthorName(e.target.value)}
                placeholder="اسمك (اختياري)" maxLength={20}/>
              <button className="abtn comm" onClick={shareToCommunity} disabled={sharing}>
                <span>{sharing?"...":"🚀"}</span><span>{sharing?"جاري النشر...":"انشر للمجتمع"}</span>
              </button>
            </div>
          </div>
        )}

        {!hasResult&&<div style={{textAlign:"center",color:"rgba(255,255,255,.2)",fontSize:14}}>اضغط الزر لتبدأ ✨</div>}
      </>
    )}

    {/* ── FAVORITES TAB ── */}
    {activeTab==="favorites"&&(
      <div>
        {favorites.length===0?(
          <div style={{textAlign:"center",color:"rgba(255,255,255,.2)",padding:"60px 0",fontSize:16}}>
            <div style={{fontSize:48,marginBottom:16}}>❤️</div>
            لا يوجد أفكار محفوظة بعد<br/>
            <span style={{fontSize:13}}>احفظ أفكارك المفضلة من المولّد</span>
          </div>
        ):favorites.map(fav=>(
          <div key={fav.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:20,marginBottom:16,animation:"fadeUp .4s ease"}}>
            <p style={{fontSize:16,lineHeight:2,color:"rgba(255,255,255,.9)",marginBottom:10}}>
              قصة <strong style={{color:CATEGORIES.genre.color}}>{fav.results.genre}</strong> عن{" "}
              <strong style={{color:CATEGORIES.character.color}}>{fav.results.character}</strong> في{" "}
              <strong style={{color:CATEGORIES.place.color}}>{fav.results.place}</strong> مع{" "}
              <strong style={{color:CATEGORIES.conflict.color}}>{fav.results.conflict}</strong>.
            </p>
            {fav.twist&&<div style={{fontSize:13,color:"#a09cff",marginBottom:10}}>🌀 {fav.twist}</div>}
            {fav.aiStory&&<div style={{fontSize:13,color:"rgba(255,255,255,.55)",background:"rgba(108,99,255,.06)",border:"1px solid rgba(108,99,255,.15)",borderRadius:10,padding:"10px 14px",marginBottom:12,lineHeight:1.85}}>{fav.aiStory}</div>}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {Object.entries(CATEGORIES).map(([k,d])=>(
                <span key={k} className="rtag" style={{background:d.color+"15",color:d.color,border:`1px solid ${d.color}33`,fontSize:12}}>{d.emoji} {fav.results[k]}</span>
              ))}
            </div>
            <button className="abtn" onClick={()=>removeFavorite(fav.id)} style={{fontSize:12,padding:"6px 14px",color:"rgba(255,255,255,.3)",borderColor:"rgba(255,255,255,.08)"}}>🗑️ حذف</button>
          </div>
        ))}
      </div>
    )}

    {/* ── COMMUNITY TAB ── */}
    {activeTab==="community"&&(
      <div>
        {/* header row */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontWeight:700,fontSize:18,color:"#fff"}}>أفكار المجتمع 🌍</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.35)",marginTop:2}}>
              {community.length} فكرة منشورة من مستخدمين حول العالم
              <span className="spin-indicator" style={{marginRight:8}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className={`sort-btn ${sortBy==="newest"?"active":""}`} onClick={()=>setSortBy("newest")}>🕐 الأحدث</button>
            <button className={`sort-btn ${sortBy==="liked"?"active":""}`}  onClick={()=>setSortBy("liked")}>🔥 الأكثر إعجاباً</button>
            <button className="abtn" onClick={fetchCommunity} style={{fontSize:13,padding:"6px 14px"}} disabled={commLoading}>
              {commLoading?"...":"↻ تحديث"}
            </button>
          </div>
        </div>

        {commLoading&&community.length===0?(
          <div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,.3)"}}>
            <div className="dots" style={{fontSize:20}}>جاري التحميل<span>.</span><span>.</span><span>.</span></div>
          </div>
        ):sorted.length===0?(
          <div style={{textAlign:"center",color:"rgba(255,255,255,.2)",padding:"60px 0",fontSize:16}}>
            <div style={{fontSize:48,marginBottom:16}}>🌍</div>
            لا يوجد أفكار منشورة بعد<br/>
            <span style={{fontSize:13}}>كن أول من ينشر فكرة!</span>
          </div>
        ):(
          sorted.map(s=>(
            <StoryCard key={s.id} story={s} onLike={handleLike} myId={myId}/>
          ))
        )}
      </div>
    )}

  </div>
</div>
```

);
}
