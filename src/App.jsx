import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════ */
const COINS = [
  { id:"q25",  label:"25 Kr", value:25,   color:"#C8922A", border:"#A0701A", shine:"#F5C842", size:54 },
  { id:"q50",  label:"50 Kr", value:50,   color:"#9E9E9E", border:"#707070", shine:"#D4D4D4", size:58 },
  { id:"tl1",  label:"1 ₺",  value:100,  color:"#D4A82A", border:"#A8801A", shine:"#F5D050", size:64 },
  { id:"tl5",  label:"5 ₺",  value:500,  color:"#E05555", border:"#B83030", shine:"#FF8A8A", size:74, bill:true },
  { id:"tl10", label:"10 ₺", value:1000, color:"#3A9FCC", border:"#1F75A0", shine:"#72C8EE", size:74, bill:true },
  { id:"tl20", label:"20 ₺", value:2000, color:"#4CAF50", border:"#2E7D32", shine:"#80E080", size:74, bill:true },
  { id:"tl50",  label:"50 ₺",  value:5000,  color:"#7E57C2", border:"#512DA8", shine:"#B39DDB", size:74, bill:true },
  { id:"tl100", label:"100 ₺", value:10000, color:"#00796B", border:"#004D40", shine:"#4DB6AC", size:74, bill:true },
  { id:"tl200", label:"200 ₺", value:20000, color:"#4E342E", border:"#3E2723", shine:"#A1887F", size:74, bill:true },
];

const EASY = [
  {id:1, name:"Elma",    emoji:"🍎", price:175}, {id:2, name:"Muz",     emoji:"🍌", price:250},
  {id:3, name:"Ekmek",   emoji:"🍞", price:300}, {id:4, name:"Su",      emoji:"💧", price:200},
  {id:5, name:"Bisküvi", emoji:"🍪", price:375}, {id:6, name:"Şeker",   emoji:"🍬", price:125},
  {id:7, name:"Kalem",   emoji:"✏️", price:100}, {id:8, name:"Defter",  emoji:"📓", price:450},
];
const HARD = [
  {id:9,  name:"Çikolata",  emoji:"🍫", price:525 }, {id:10, name:"Meyve Suyu", emoji:"🧃", price:750},
  {id:11, name:"Peynir",    emoji:"🧀", price:1275}, {id:12, name:"Dondurma",   emoji:"🍦", price:625},
  {id:13, name:"Pizza",     emoji:"🍕", price:1875}, {id:14, name:"Hamburger",  emoji:"🍔", price:2250},
  {id:15, name:"Sandviç",   emoji:"🥪", price:1125}, {id:16, name:"Oyun Kartı", emoji:"🃏", price:3750},
];

const ACHIEVEMENTS = [
  { id:"first",   title:"İlk Adım",      emoji:"🐣", desc:"İlk soruyu doğru cevapla",  req: s=>s.totalCorrect>=1  },
  { id:"ten",     title:"On'luk",        emoji:"🔟", desc:"10 doğru cevap ver",         req: s=>s.totalCorrect>=10 },
  { id:"fifty",   title:"Elli'lik",      emoji:"🌟", desc:"50 puana ulaş",              req: s=>s.score>=50        },
  { id:"hundred", title:"Yüzde Bir",     emoji:"💯", desc:"100 puana ulaş",             req: s=>s.score>=100       },
  { id:"hard",    title:"Cesur Kaşif",   emoji:"🔥", desc:"Zor seviyeye geç",           req: s=>s.score>=100       },
  { id:"streak3", title:"Seri Başlıyor", emoji:"⚡", desc:"3 doğru arka arkaya",        req: s=>s.maxStreak>=3     },
  { id:"streak5", title:"Dur Duraksama", emoji:"🚀", desc:"5 doğru arka arkaya",        req: s=>s.maxStreak>=5     },
  { id:"shop5",   title:"Alışverişçi",   emoji:"🛍️", desc:"Alışveriş modunda 5 kez kazan", req: s=>s.shopWins>=5 },
];

const AVATARS = ["🦊","🐼","🦁","🐨","🐸","🐯","🦋","🐧","🦄","🐙","🦖","🐬"];

const LEVELS = [
  {min:0,   max:99,   name:"Çaylak",   color:"#78909C", icon:"🌱"},
  {min:100, max:299,  name:"Öğrenci",  color:"#26A69A", icon:"📚"},
  {min:300, max:599,  name:"Usta",     color:"#7E57C2", icon:"⭐"},
  {min:600, max:999,  name:"Uzman",    color:"#EF6C00", icon:"🔥"},
  {min:1000,max:9999, name:"Efsane",   color:"#C62828", icon:"👑"},
];

function getLevel(score) {
  return LEVELS.find(l=>score>=l.min && score<=l.max) || LEVELS[LEVELS.length-1];
}
function getProducts(score) { return score>=100 ? HARD : EASY; }
function fmt(k) {
  if(k%100===0) return `${k/100} ₺`;
  return `${Math.floor(k/100)},${String(k%100).padStart(2,"0")} ₺`;
}
function randFrom(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

/* ═══════════════════════════════════════════════════════════════════
   STORAGE LAYER
═══════════════════════════════════════════════════════════════════ */
async function saveUser(uid, data) {
  try { await window.storage.set(`user:${uid}`, JSON.stringify(data)); } catch(e){}
}
async function loadUser(uid) {
  try {
    const r = await window.storage.get(`user:${uid}`);
    return r ? JSON.parse(r.value) : null;
  } catch(e){ return null; }
}
async function saveSession(uid) {
  try { await window.storage.set("session", uid); } catch(e){}
}
async function loadSession() {
  try { const r=await window.storage.get("session"); return r?r.value:null; } catch(e){ return null; }
}
async function clearSession() {
  try { await window.storage.delete("session"); } catch(e){}
}

/* ═══════════════════════════════════════════════════════════════════
   GOOGLE OAUTH SIMULATION
   (Real implementation: firebase.auth().signInWithPopup(googleProvider))
═══════════════════════════════════════════════════════════════════ */
function simulateGoogleAuth() {
  return new Promise(resolve => {
    const names = [
      {name:"Ahmet Yılmaz", email:"ahmet.yilmaz@gmail.com", picture:"👦"},
      {name:"Elif Kaya",    email:"elif.kaya@gmail.com",    picture:"👧"},
      {name:"Can Demir",    email:"can.demir@gmail.com",    picture:"🧒"},
      {name:"Zeynep Çelik", email:"zeynep.celik@gmail.com", picture:"👩"},
    ];
    // Simulate OAuth popup delay
    setTimeout(()=>resolve({ provider:"google", ...randFrom(names), uid:`g_${Date.now()}` }), 1400);
  });
}
function simulateAppleAuth() {
  return new Promise(resolve => {
    const names = [
      {name:"Mehmet A.",  email:"mehmet@icloud.com", picture:"👨"},
      {name:"Ayşe A.",    email:"ayse@icloud.com",   picture:"👩"},
    ];
    setTimeout(()=>resolve({ provider:"apple", ...randFrom(names), uid:`a_${Date.now()}` }), 1200);
  });
}

/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS & SHARED STYLES
═══════════════════════════════════════════════════════════════════ */
const T = {
  primary:"#E84545",
  primaryDark:"#C0392B",
  accent:"#F5A623",
  accentDark:"#D48B0F",
  success:"#27AE60",
  info:"#2980B9",
  bg:"#FFF8F0",
  card:"#FFFFFF",
  text:"#1A1A2E",
  sub:"#6B7280",
  border:"#E5E7EB",
  shadow:"rgba(0,0,0,0.08)",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
  body{background:#FFF8F0;font-family:'Nunito',sans-serif;}
  button{font-family:'Nunito',sans-serif;cursor:pointer;border:none;outline:none;}
  input{font-family:'Nunito',sans-serif;outline:none;}

  @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pop{0%{transform:scale(0.7)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
  @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes confetti{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(80px) rotate(720deg);opacity:0}}
  @keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(232,69,69,0.4)}50%{box-shadow:0 0 0 10px rgba(232,69,69,0)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes streakPop{0%{transform:scale(0) rotate(-20deg)}60%{transform:scale(1.3) rotate(5deg)}100%{transform:scale(1) rotate(0deg)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}

  .fade-in{animation:fadeIn 0.4s ease both}
  .slide-up{animation:slideUp 0.45s cubic-bezier(.22,.68,0,1.2) both}
  .pop{animation:pop 0.35s cubic-bezier(.22,.68,0,1.2) both}
  .shake{animation:shake 0.4s ease both}
  .float{animation:float 3s ease-in-out infinite}
  .pulse{animation:pulse 2s ease-in-out infinite}
  .streak-pop{animation:streakPop 0.5s cubic-bezier(.22,.68,0,1.2) both}

  .btn-press{transition:transform 0.12s,box-shadow 0.12s;}
  .btn-press:active{transform:scale(0.94)!important;}

  .card{background:#fff;border-radius:20px;box-shadow:0 2px 12px rgba(0,0,0,0.07);}

  ::-webkit-scrollbar{width:0;height:0;}

  .shimmer-bg{
    background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
    background-size:200% 100%;
    animation:shimmer 1.4s infinite;
  }
`;

/* ═══════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════════════════════════════════ */
function Spinner({size=28, color=T.primary}) {
  return <div style={{width:size,height:size,border:`3px solid ${color}22`,borderTop:`3px solid ${color}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>;
}

function XPBar({score, compact=false}) {
  const lv = getLevel(score);
  const nextLv = LEVELS[LEVELS.indexOf(lv)+1];
  const pct = nextLv ? Math.round(((score-lv.min)/(nextLv.min-lv.min))*100) : 100;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{fontSize:compact?14:16}}>{lv.icon}</div>
      <div style={{flex:1}}>
        {!compact && <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
          <span style={{fontSize:11,fontWeight:800,color:lv.color}}>{lv.name}</span>
          <span style={{fontSize:11,fontWeight:700,color:T.sub}}>{score} puan</span>
        </div>}
        <div style={{height:compact?5:7,background:"#F0F0F0",borderRadius:99,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${lv.color},${lv.color}bb)`,borderRadius:99,transition:"width 0.6s cubic-bezier(.22,.68,0,1.2)"}}/>
        </div>
      </div>
    </div>
  );
}

function CoinBtn({coin, onClick, count, disabled}) {
  const [pop, setPop] = useState(false);
  return (
    <button
      className="btn-press"
      onClick={()=>{if(disabled)return;setPop(true);setTimeout(()=>setPop(false),200);onClick(coin);}}
      disabled={disabled}
      style={{
        position:"relative",
        background: coin.bill
          ? `linear-gradient(135deg, ${coin.color}, ${coin.border})`
          : `radial-gradient(circle at 32% 28%, ${coin.shine}, ${coin.color} 40%, ${coin.border})`,
        border: `3px solid ${coin.border}`,
        borderRadius: coin.bill ? "12px" : "50%",
        width: coin.size, height: coin.bill ? 44 : coin.size,
        transform: pop ? "scale(0.84)" : "scale(1)",
        transition: "transform 0.14s",
        boxShadow: disabled ? "none" : `0 5px 14px ${coin.border}55, inset 0 1px 3px rgba(255,255,255,0.5)`,
        display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column",
        opacity: disabled ? 0.38 : 1,
      }}>
      <span style={{fontSize:coin.bill?12:11,fontWeight:900,color:"#fff",textShadow:"0 1px 3px rgba(0,0,0,0.5)",lineHeight:1}}>
        {coin.label}
      </span>
      {count>0 && (
        <span className="pop" style={{position:"absolute",top:-8,right:-8,
          background:"#E84545",color:"#fff",borderRadius:"50%",width:22,height:22,
          fontSize:11,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 2px 6px rgba(232,69,69,0.5)"}}>
          {count}
        </span>
      )}
    </button>
  );
}

function Badge({achievement, earned, small=false}) {
  return (
    <div style={{
      display:"flex",flexDirection:"column",alignItems:"center",gap:4,
      opacity: earned ? 1 : 0.35, filter: earned ? "none" : "grayscale(1)",
    }}>
      <div style={{
        width: small?44:56, height: small?44:56,
        background: earned ? "linear-gradient(135deg,#FFF9C4,#FFD700)" : "#E0E0E0",
        borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
        fontSize: small?20:26,
        boxShadow: earned ? "0 3px 12px rgba(255,215,0,0.5)" : "none",
        border: earned ? "3px solid #FFD700" : "3px solid #ccc",
      }}>
        {achievement.emoji}
      </div>
      {!small && <div style={{fontSize:10,fontWeight:800,color:earned?T.text:T.sub,textAlign:"center",lineHeight:1.2}}>{achievement.title}</div>}
    </div>
  );
}

function StreakBadge({streak}) {
  if(streak<2) return null;
  return (
    <div className="streak-pop" style={{
      display:"inline-flex",alignItems:"center",gap:5,
      background:"linear-gradient(135deg,#FF6B35,#FF4500)",
      color:"#fff",borderRadius:20,padding:"5px 12px",
      fontSize:13,fontWeight:900,
      boxShadow:"0 4px 12px rgba(255,107,53,0.45)"
    }}>
      <span>🔥</span> {streak} SERI!
    </div>
  );
}

function LevelUpModal({level, onClose}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:999,
      display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}>
      <div className="pop card" style={{margin:20,padding:"36px 28px",textAlign:"center",maxWidth:320,width:"100%"}}>
        <div style={{fontSize:72,animation:"float 3s ease-in-out infinite"}}>{level.icon}</div>
        <div style={{fontSize:11,fontWeight:800,color:T.sub,marginTop:12,letterSpacing:2}}>SEVİYE ATLADI!</div>
        <div style={{fontSize:30,fontWeight:900,color:level.color,marginTop:4}}>{level.name}</div>
        <div style={{fontSize:14,color:T.sub,fontWeight:700,marginTop:8}}>Tebrikler! Bir üst seviyeye geçtin 🚀</div>
        <button onClick={onClose} style={{
          marginTop:20,width:"100%",background:`linear-gradient(135deg,${level.color},${level.color}cc)`,
          color:"#fff",border:"none",borderRadius:16,padding:"14px",fontSize:16,fontWeight:900,
          boxShadow:`0 6px 20px ${level.color}44`
        }}>Harika! 🎉</button>
      </div>
    </div>
  );
}

function AchievementToast({achievement, onClose}) {
  useEffect(()=>{ const t=setTimeout(onClose,3500); return ()=>clearTimeout(t); },[]);
  return (
    <div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:998,width:"calc(100% - 32px)",maxWidth:358}}>
      <div className="slide-up card" style={{
        padding:"12px 16px",display:"flex",alignItems:"center",gap:12,
        boxShadow:"0 8px 30px rgba(0,0,0,0.15)",
        border:"2px solid #FFD700",background:"linear-gradient(135deg,#FFF9C4,#FFFDE7)"
      }}>
        <div style={{fontSize:32}}>{achievement.emoji}</div>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:"#B7950B",letterSpacing:1}}>ROZET KAZANILDI!</div>
          <div style={{fontSize:15,fontWeight:900,color:T.text}}>{achievement.title}</div>
          <div style={{fontSize:11,color:T.sub,fontWeight:700}}>{achievement.desc}</div>
        </div>
        <button onClick={onClose} style={{marginLeft:"auto",background:"none",fontSize:18,color:T.sub,padding:4}}>✕</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ONBOARDING
═══════════════════════════════════════════════════════════════════ */
function Onboarding({onDone}) {
  const [step, setStep] = useState(0);
  const slides = [
    { emoji:"🏪", title:"Para Öğreniyorum!", sub:"Türk Lirası ile eğlenceli alışveriş oyunları", color:"#E84545" },
    { emoji:"🛍️", title:"Alışveriş Yap", sub:"Ürünlerin fiyatını öde, para üstü al, doğru parayı bul!", color:"#F5A623" },
    { emoji:"🏆", title:"Puanlar Kazan", sub:"Her doğru cevap puan. 100 puanda sorular zorlaşır!", color:"#27AE60" },
  ];
  const s = slides[step];
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#FFF0E6,#FFE0CC)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28}}>
      <div className="fade-in" key={step} style={{textAlign:"center",maxWidth:320,width:"100%"}}>
        <div style={{fontSize:100,lineHeight:1,animation:"float 3s ease-in-out infinite"}}>{s.emoji}</div>
        <h1 style={{fontFamily:"'Baloo 2',cursive",fontSize:28,fontWeight:800,color:s.color,margin:"20px 0 10px"}}>{s.title}</h1>
        <p style={{fontSize:15,color:T.sub,fontWeight:700,lineHeight:1.6}}>{s.sub}</p>
      </div>
      <div style={{display:"flex",gap:8,margin:"32px 0 24px"}}>
        {slides.map((_,i)=>(
          <div key={i} style={{width:i===step?24:8,height:8,borderRadius:99,
            background:i===step?s.color:"#D0D0D0",transition:"all 0.3s"}}/>
        ))}
      </div>
      <button className="btn-press" onClick={()=> step<slides.length-1 ? setStep(step+1) : onDone()}
        style={{width:"100%",maxWidth:320,padding:"16px",borderRadius:20,
          background:`linear-gradient(135deg,${s.color},${s.color}cc)`,
          color:"#fff",fontSize:17,fontWeight:900,
          boxShadow:`0 8px 24px ${s.color}44`}}>
        {step<slides.length-1 ? "Devam →" : "Hadi Başlayalım! 🚀"}
      </button>
      {step>0 && <button onClick={()=>setStep(0)} style={{marginTop:12,background:"none",color:T.sub,fontSize:13,fontWeight:700}}>Başa dön</button>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AUTH SCREEN — Real Google & Apple OAuth UI
═══════════════════════════════════════════════════════════════════ */
function AuthScreen({onLogin}) {
  const [loading, setLoading] = useState(null); // "google"|"apple"

  const handleGoogle = async () => {
    setLoading("google");
    try {
      const profile = await simulateGoogleAuth();
      onLogin(profile);
    } catch(e){ setLoading(null); }
  };

  const handleApple = async () => {
    setLoading("apple");
    try {
      const profile = await simulateAppleAuth();
      onLogin(profile);
    } catch(e){ setLoading(null); }
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#1A1A2E 0%,#16213E 50%,#0F3460 100%)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>

      {/* Logo area */}
      <div className="fade-in" style={{textAlign:"center",marginBottom:40}}>
        <div style={{width:90,height:90,background:"linear-gradient(135deg,#E84545,#C0392B)",
          borderRadius:26,display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:48,margin:"0 auto 16px",boxShadow:"0 12px 36px rgba(232,69,69,0.45)"}}>
          🏪
        </div>
        <h1 style={{fontFamily:"'Baloo 2',cursive",fontSize:30,fontWeight:800,color:"#fff",margin:"0 0 6px"}}>
          Para Öğreniyorum
        </h1>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <div style={{width:24,height:3,background:"linear-gradient(90deg,#E84545,transparent)"}}/>
          <span style={{fontSize:12,color:"rgba(255,255,255,0.5)",fontWeight:700,letterSpacing:2}}>TÜRK LİRASI EĞİTİMİ</span>
          <div style={{width:24,height:3,background:"linear-gradient(270deg,#E84545,transparent)"}}/>
        </div>
      </div>

      {/* Auth card */}
      <div className="slide-up card" style={{width:"100%",maxWidth:360,padding:"28px 24px"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:16,fontWeight:900,color:T.text}}>Giriş Yap</div>
          <div style={{fontSize:13,color:T.sub,fontWeight:600,marginTop:4}}>
            Puanlarını kaydetmek için hesabınla bağlan
          </div>
        </div>

        {/* Google Button — Official styling */}
        <button className="btn-press" onClick={handleGoogle} disabled={!!loading}
          style={{
            width:"100%",background:"#fff",border:"1.5px solid #DADCE0",
            borderRadius:12,padding:"13px 20px",marginBottom:12,
            display:"flex",alignItems:"center",justifyContent:"center",gap:12,
            boxShadow:"0 2px 8px rgba(0,0,0,0.1)",
            opacity:loading&&loading!=="google"?0.5:1,
          }}>
          {loading==="google" ? <Spinner size={22} color="#4285F4"/> : (
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          <span style={{fontSize:15,fontWeight:700,color:"#3C4043"}}>Google ile devam et</span>
        </button>

        {/* Apple Button — Official styling */}
        <button className="btn-press" onClick={handleApple} disabled={!!loading}
          style={{
            width:"100%",background:"#000",border:"1.5px solid #000",
            borderRadius:12,padding:"13px 20px",marginBottom:20,
            display:"flex",alignItems:"center",justifyContent:"center",gap:12,
            boxShadow:"0 2px 8px rgba(0,0,0,0.2)",
            opacity:loading&&loading!=="apple"?0.5:1,
          }}>
          {loading==="apple" ? <Spinner size={22} color="#fff"/> : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
          )}
          <span style={{fontSize:15,fontWeight:700,color:"#fff"}}>Apple ile devam et</span>
        </button>

        <div style={{textAlign:"center",padding:"0 8px"}}>
          <div style={{height:1,background:T.border,marginBottom:14}}/>
          <p style={{fontSize:11,color:T.sub,fontWeight:600,lineHeight:1.6}}>
            🔒 Giriş yaparak <span style={{color:T.primary,fontWeight:800}}>Gizlilik Politikası</span> ve{" "}
            <span style={{color:T.primary,fontWeight:800}}>Kullanım Şartları</span>'nı kabul etmiş olursunuz.
          </p>
        </div>
      </div>

      <p style={{color:"rgba(255,255,255,0.3)",fontSize:11,fontWeight:600,textAlign:"center",marginTop:20,padding:"0 20px"}}>
        Uygulama bilgileri için: info@paraogreniyorum.com
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PROFILE SETUP
═══════════════════════════════════════════════════════════════════ */
function ProfileSetup({profile, onSave}) {
  const [childName, setChildName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#FFF0E6,#FFE0CC)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div className="slide-up" style={{width:"100%",maxWidth:360}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:20,fontWeight:900,color:T.text}}>Profil Oluştur</div>
          <div style={{fontSize:13,color:T.sub,fontWeight:700,marginTop:4}}>Çocuğun adını ve avatarını seç</div>
        </div>

        {/* Avatar seçici */}
        <div className="card" style={{padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:800,color:T.text,marginBottom:14}}>Avatar Seç</div>
          <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#FFE0B2,#FFCC80)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,
              boxShadow:"0 4px 16px rgba(245,166,35,0.35)",border:"3px solid #F5A623"}}>
              {avatar}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8}}>
            {AVATARS.map(a=>(
              <button key={a} className="btn-press" onClick={()=>setAvatar(a)} style={{
                background:a===avatar?"linear-gradient(135deg,#FFE0B2,#FFCC80)":"#F5F5F5",
                border:a===avatar?"2.5px solid #F5A623":"2.5px solid transparent",
                borderRadius:12,padding:"8px 0",fontSize:22,
                boxShadow:a===avatar?"0 2px 8px rgba(245,166,35,0.3)":"none",
              }}>{a}</button>
            ))}
          </div>
        </div>

        {/* İsim */}
        <div className="card" style={{padding:20,marginBottom:24}}>
          <div style={{fontSize:14,fontWeight:800,color:T.text,marginBottom:10}}>Çocuğun Adı</div>
          <input
            value={childName}
            onChange={e=>setChildName(e.target.value)}
            placeholder="Örn: Ahmet"
            maxLength={20}
            style={{width:"100%",fontSize:18,fontWeight:800,padding:"12px 16px",
              border:`2px solid ${childName?T.primary:T.border}`,borderRadius:14,
              color:T.text,background:T.bg,transition:"border 0.2s"}}
          />
        </div>

        <button className="btn-press" disabled={!childName.trim()} onClick={()=>onSave({avatar,childName:childName.trim()})}
          style={{width:"100%",padding:"16px",borderRadius:20,
            background:childName.trim()?"linear-gradient(135deg,#E84545,#C0392B)":"#E0E0E0",
            color:"#fff",fontSize:17,fontWeight:900,
            boxShadow:childName.trim()?"0 8px 24px rgba(232,69,69,0.4)":"none",
            transition:"all 0.2s"}}>
          Başla! 🚀
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HOME SCREEN
═══════════════════════════════════════════════════════════════════ */
function HomeScreen({user, onSelect, onProfile}) {
  const lv = getLevel(user.score);
  const hard = user.score >= 100;

  const modes = [
    {key:"pay",    emoji:"🛍️", title:"Alışveriş",    desc:"Tam parayı öde",     grad:"linear-gradient(135deg,#FF6B6B,#E84545)", shadow:"rgba(232,69,69,0.35)"},
    {key:"change", emoji:"💰", title:"Para Üstü",    desc:"Üstü hesapla",       grad:"linear-gradient(135deg,#26C6DA,#00ACC1)", shadow:"rgba(0,172,193,0.35)"},
    {key:"multi",  emoji:"🛒", title:"Sepet",        desc:"Toplam ne kadar",    grad:"linear-gradient(135deg,#FFA726,#FB8C00)", shadow:"rgba(251,140,0,0.35)"},
    {key:"learn",  emoji:"📚", title:"Para Tanı",    desc:"Paraları öğren",     grad:"linear-gradient(135deg,#66BB6A,#43A047)", shadow:"rgba(67,160,71,0.35)"},
  ];

  const earned = ACHIEVEMENTS.filter(a=>a.req(user));

  return (
    <div style={{padding:"16px",fontFamily:"'Nunito',sans-serif"}}>
      {/* Hero profile card */}
      <div className="card fade-in" style={{
        background:`linear-gradient(135deg,${lv.color}22,${lv.color}08)`,
        border:`1.5px solid ${lv.color}33`,
        padding:"18px 20px",marginBottom:16
      }}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
          <div style={{width:54,height:54,borderRadius:"50%",
            background:`linear-gradient(135deg,${lv.color}33,${lv.color}11)`,
            border:`2.5px solid ${lv.color}`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>
            {user.avatar}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:17,fontWeight:900,color:T.text}}>{user.childName}</div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
              <span style={{fontSize:11,fontWeight:800,color:lv.color,
                background:`${lv.color}18`,padding:"2px 8px",borderRadius:20}}>
                {lv.icon} {lv.name}
              </span>
              {hard && <span style={{fontSize:11,fontWeight:800,color:"#E84545",
                background:"#E8454518",padding:"2px 8px",borderRadius:20}}>🔥 ZOR</span>}
            </div>
          </div>
          <button onClick={onProfile} style={{background:`${lv.color}18`,border:"none",
            borderRadius:12,padding:"8px 12px",fontSize:13,fontWeight:800,color:lv.color}}>
            Profil
          </button>
        </div>
        <XPBar score={user.score}/>
      </div>

      {/* Level-up banner */}
      {hard && (
        <div className="pop card" style={{
          background:"linear-gradient(135deg,#FF416C,#E84545)",
          padding:"12px 16px",marginBottom:14,
          display:"flex",alignItems:"center",gap:10
        }}>
          <div style={{fontSize:28}}>🔥</div>
          <div>
            <div style={{fontSize:13,fontWeight:900,color:"#fff"}}>100 Puana Ulaştın!</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.8)",fontWeight:700}}>Sorular zorlaştı — tebrikler!</div>
          </div>
        </div>
      )}

      {/* Game modes */}
      <div style={{fontSize:12,fontWeight:800,color:T.sub,letterSpacing:1,marginBottom:10}}>OYUN MODLARI</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        {modes.map((m,i)=>(
          <button key={m.key} className="btn-press fade-in" onClick={()=>onSelect(m.key)}
            style={{
              background:m.grad,borderRadius:20,padding:"20px 16px",
              textAlign:"center",border:"none",
              boxShadow:`0 8px 20px ${m.shadow}`,
              animationDelay:`${i*0.07}s`
            }}>
            <div style={{fontSize:34}}>{m.emoji}</div>
            <div style={{fontSize:15,fontWeight:900,color:"#fff",marginTop:8}}>{m.title}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.8)",fontWeight:700,marginTop:2}}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Achievements strip */}
      {earned.length>0 && (
        <div className="card" style={{padding:"16px",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:900,color:T.text}}>🏆 Rozetler</div>
            <div style={{fontSize:11,fontWeight:700,color:T.sub}}>{earned.length}/{ACHIEVEMENTS.length}</div>
          </div>
          <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
            {ACHIEVEMENTS.map(a=>(
              <Badge key={a.id} achievement={a} earned={!!earned.find(e=>e.id===a.id)} small/>
            ))}
          </div>
        </div>
      )}

      {/* Tip */}
      <div style={{background:"linear-gradient(135deg,#E8F5E9,#F1F8E9)",borderRadius:14,
        padding:"12px 16px",border:"1.5px solid #C8E6C9"}}>
        <div style={{fontSize:12,fontWeight:800,color:"#2E7D32"}}>
          💡 Hatırla: 4 × 25 kuruş = 1 Türk Lirası!
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PROFILE SCREEN
═══════════════════════════════════════════════════════════════════ */
function ProfileScreen({user, onBack, onLogout, onAvatarChange}) {
  const lv = getLevel(user.score);
  const earned = ACHIEVEMENTS.filter(a=>a.req(user));

  return (
    <div style={{fontFamily:"'Nunito',sans-serif",padding:16}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
        <button onClick={onBack} style={{background:"none",border:"none",fontSize:22,cursor:"pointer"}}>←</button>
        <div style={{fontSize:18,fontWeight:900,color:T.text}}>Profil</div>
      </div>

      {/* Profile hero */}
      <div className="card" style={{padding:24,textAlign:"center",marginBottom:14,
        background:`linear-gradient(160deg,${lv.color}18,#fff)`}}>
        <div style={{width:80,height:80,borderRadius:"50%",
          background:`linear-gradient(135deg,${lv.color}30,${lv.color}10)`,
          border:`3px solid ${lv.color}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:42,margin:"0 auto 12px",boxShadow:`0 6px 20px ${lv.color}33`}}>
          {user.avatar}
        </div>
        <div style={{fontSize:22,fontWeight:900,color:T.text}}>{user.childName}</div>
        <div style={{fontSize:12,color:T.sub,fontWeight:700,marginTop:2}}>{user.email}</div>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:8,
          background:`${lv.color}18`,padding:"5px 14px",borderRadius:20}}>
          <span style={{fontSize:16}}>{lv.icon}</span>
          <span style={{fontSize:13,fontWeight:800,color:lv.color}}>{lv.name}</span>
        </div>
        <div style={{marginTop:14}}>
          <XPBar score={user.score}/>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
        {[
          {label:"Puan",   val:user.score,        icon:"⭐"},
          {label:"Doğru",  val:user.totalCorrect||0, icon:"✅"},
          {label:"Seri",   val:user.maxStreak||0,  icon:"🔥"},
        ].map(s=>(
          <div key={s.label} className="card" style={{padding:"14px 10px",textAlign:"center"}}>
            <div style={{fontSize:22}}>{s.icon}</div>
            <div style={{fontSize:20,fontWeight:900,color:T.text,marginTop:4}}>{s.val}</div>
            <div style={{fontSize:10,fontWeight:700,color:T.sub}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* All achievements */}
      <div className="card" style={{padding:16,marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:900,color:T.text,marginBottom:14}}>🏆 Tüm Rozetler</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {ACHIEVEMENTS.map(a=>(
            <Badge key={a.id} achievement={a} earned={!!earned.find(e=>e.id===a.id)}/>
          ))}
        </div>
      </div>

      <button className="btn-press" onClick={onLogout} style={{
        width:"100%",background:"#fff",border:"2px solid #FFCDD2",borderRadius:16,
        padding:"14px",fontSize:15,fontWeight:900,color:"#E84545",
        boxShadow:"0 2px 8px rgba(232,69,69,0.1)"
      }}>Çıkış Yap</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GAME: ALIŞVERIŞ (PAY)
═══════════════════════════════════════════════════════════════════ */
function PayGame({onBack, onScore, totalScore}) {
  const prods = getProducts(totalScore);
  const [cur,    setCur]   = useState(()=>randFrom(prods));
  const [paid,   setPaid]  = useState(0);
  const [counts, setCnts]  = useState({});
  const [result, setRes]   = useState(null);
  const [streak, setStrk]  = useState(0);
  const [pts,    setPts]   = useState(0);
  const [shake,  setShake] = useState(false);

  const addCoin = c => {
    if(result) return;
    const np = paid+c.value;
    setCnts(x=>({...x,[c.id]:(x[c.id]||0)+1}));
    setPaid(np);
    if(np===cur.price){
      setRes("ok"); const gain=10+(streak>=3?5:0); onScore(gain,"pay"); setPts(p=>p+gain); setStrk(s=>s+1);
    } else if(np>cur.price){
      setShake(true); setTimeout(()=>setShake(false),400); setRes("over"); setStrk(0);
    }
  };
  const next  = ()=>{ setCur(randFrom(prods)); setPaid(0); setCnts({}); setRes(null); };
  const reset = ()=>{ setPaid(0); setCnts({}); setRes(null); };

  const pct = Math.min((paid/cur.price)*100,100);

  return (
    <div style={{fontFamily:"'Nunito',sans-serif",padding:16}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <button onClick={onBack} style={{background:"none",border:"none",fontSize:22,cursor:"pointer"}}>←</button>
        <div style={{fontSize:18,fontWeight:900,color:T.text}}>🛍️ Alışveriş</div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          <StreakBadge streak={streak}/>
          <div style={{background:"linear-gradient(135deg,#E84545,#C0392B)",color:"#fff",
            borderRadius:20,padding:"5px 14px",fontSize:14,fontWeight:900,
            boxShadow:"0 4px 12px rgba(232,69,69,0.35)"}}>⭐ {pts}</div>
        </div>
      </div>

      {/* Product card */}
      <div className={`card fade-in ${shake?"shake":""}`} style={{
        padding:24,textAlign:"center",marginBottom:14,
        background:"linear-gradient(160deg,#FFF9F0,#FFF3E0)",
        border:"1.5px solid #FFE0B2"
      }}>
        <div style={{fontSize:68,animation:"float 3s ease-in-out infinite"}}>{cur.emoji}</div>
        <div style={{fontSize:19,fontWeight:900,color:T.text,marginTop:8}}>{cur.name}</div>
        <div style={{fontSize:32,fontWeight:900,color:T.primary,marginTop:4,fontFamily:"'Baloo 2',cursive"}}>
          {fmt(cur.price)}
        </div>
        <div style={{fontSize:11,color:T.sub,fontWeight:700,marginTop:4}}>Bu ürün için tam para öde</div>
      </div>

      {/* Progress bar */}
      <div className="card" style={{padding:"14px 16px",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,fontWeight:800,color:T.sub}}>Ödediğin:</span>
          <span style={{fontSize:16,fontWeight:900,color:paid>cur.price?T.primary:paid===cur.price?T.success:T.text}}>
            {fmt(paid)}
          </span>
        </div>
        <div style={{height:10,background:"#F0F0F0",borderRadius:99,overflow:"hidden"}}>
          <div style={{
            height:"100%",width:`${pct}%`,borderRadius:99,
            background: paid>cur.price?"linear-gradient(90deg,#E84545,#C0392B)":
              paid===cur.price?"linear-gradient(90deg,#27AE60,#1E8449)":
              "linear-gradient(90deg,#F5A623,#E08A0E)",
            transition:"width 0.25s"
          }}/>
        </div>
        {paid<cur.price && paid>0 && (
          <div style={{fontSize:11,color:T.sub,fontWeight:700,marginTop:5,textAlign:"right"}}>
            Kalan: {fmt(cur.price-paid)}
          </div>
        )}
      </div>

      {/* Result */}
      {result==="ok" && (
        <div className="pop card" style={{
          background:"linear-gradient(135deg,#E8F5E9,#C8E6C9)",
          border:"2px solid #81C784",padding:"18px 16px",textAlign:"center",marginBottom:12
        }}>
          <div style={{fontSize:48}}>🎉</div>
          <div style={{fontSize:18,fontWeight:900,color:"#2E7D32",marginTop:8}}>Harika! Tam para!</div>
          {streak>=2 && <div style={{fontSize:13,color:"#388E3C",fontWeight:700,marginTop:4}}>🔥 {streak} seri bonus +5 puan!</div>}
          <button className="btn-press" onClick={next} style={{
            marginTop:14,background:"linear-gradient(135deg,#27AE60,#1E8449)",color:"#fff",
            border:"none",borderRadius:20,padding:"12px 28px",fontSize:16,fontWeight:900,
            boxShadow:"0 6px 18px rgba(39,174,96,0.4)"}}>
            Devam Et →
          </button>
        </div>
      )}
      {result==="over" && (
        <div className="card" style={{background:"linear-gradient(135deg,#FFEBEE,#FFCDD2)",
          border:"2px solid #EF9A9A",padding:"18px 16px",textAlign:"center",marginBottom:12}}>
          <div style={{fontSize:40}}>😅</div>
          <div style={{fontSize:16,fontWeight:900,color:T.primaryDark,marginTop:8}}>
            Fazla ödeme! {fmt(paid-cur.price)} fazla verdin.
          </div>
          <button className="btn-press" onClick={reset} style={{
            marginTop:14,background:"linear-gradient(135deg,#E84545,#C0392B)",color:"#fff",
            border:"none",borderRadius:20,padding:"12px 28px",fontSize:16,fontWeight:900,
            boxShadow:"0 6px 18px rgba(232,69,69,0.4)"}}>
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Coins */}
      {!result && (
        <>
          <div style={{fontSize:12,fontWeight:800,color:T.sub,marginBottom:10,letterSpacing:1}}>
            KULLANMAK İSTEDİĞİN PARAYI SEÇ
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center"}}>
            {COINS.map(c=><CoinBtn key={c.id} coin={c} onClick={addCoin} count={counts[c.id]||0}/>)}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GAME: PARA ÜSTÜ
═══════════════════════════════════════════════════════════════════ */
function ChangeGame({onBack, onScore, totalScore}) {
  const genQ = () => {
    const prods = getProducts(totalScore);
    const p = randFrom(prods);
    const valid = COINS.filter(c=>c.value>p.price);
    const payVal = valid.length>0 ? valid[0].value : COINS[COINS.length-1].value*Math.ceil(p.price/COINS[COINS.length-1].value);
    return {product:p, paid:payVal, change:payVal-p.price};
  };
  const [q,   setQ]  = useState(genQ);
  const [ans, setAns]= useState("");
  const [res, setRes]= useState(null);
  const [pts, setPts]= useState(0);
  const inputRef = useRef();

  const check=()=>{
    const v=Math.round(parseFloat(ans.replace(",","."))*100);
    if(v===q.change){setRes("ok");onScore(10,"change");setPts(p=>p+10);}
    else setRes("wrong");
  };
  const next=()=>{setQ(genQ());setAns("");setRes(null);setTimeout(()=>inputRef.current?.focus(),100);};

  const quickAmounts=totalScore>=100
    ?[25,50,75,100,125,150,175,200,250,300,375,500,625,750,875,1000,1250,1500]
    :[25,50,75,100,125,150,175,200,250,300,375,500];

  return (
    <div style={{fontFamily:"'Nunito',sans-serif",padding:16}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <button onClick={onBack} style={{background:"none",border:"none",fontSize:22,cursor:"pointer"}}>←</button>
        <div style={{fontSize:18,fontWeight:900,color:T.text}}>💰 Para Üstü</div>
        <div style={{marginLeft:"auto",background:"linear-gradient(135deg,#26C6DA,#00ACC1)",color:"#fff",
          borderRadius:20,padding:"5px 14px",fontSize:14,fontWeight:900,
          boxShadow:"0 4px 12px rgba(0,172,193,0.35)"}}>⭐ {pts}</div>
      </div>

      <div className="card fade-in" style={{padding:22,marginBottom:14,
        background:"linear-gradient(135deg,#E0F7FA,#B2EBF2)",border:"1.5px solid #80DEEA"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{fontSize:52}}>{q.product.emoji}</div>
          <div>
            <div style={{fontSize:18,fontWeight:900,color:T.text}}>{q.product.name}</div>
            <div style={{fontSize:12,color:T.sub,fontWeight:700}}>Fiyat etiketine bak 👀</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{background:"rgba(255,255,255,0.8)",borderRadius:14,padding:"12px 10px",textAlign:"center",backdropFilter:"blur(4px)"}}>
            <div style={{fontSize:10,fontWeight:800,color:T.sub,letterSpacing:1}}>FİYAT</div>
            <div style={{fontSize:22,fontWeight:900,color:T.primary,fontFamily:"'Baloo 2',cursive"}}>{fmt(q.product.price)}</div>
          </div>
          <div style={{background:"rgba(255,255,255,0.8)",borderRadius:14,padding:"12px 10px",textAlign:"center",backdropFilter:"blur(4px)"}}>
            <div style={{fontSize:10,fontWeight:800,color:T.sub,letterSpacing:1}}>VERDİĞİN</div>
            <div style={{fontSize:22,fontWeight:900,color:T.success,fontFamily:"'Baloo 2',cursive"}}>{fmt(q.paid)}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{padding:16,marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:900,color:T.text,marginBottom:10,textAlign:"center"}}>
          🤔 Para üstün ne kadar?
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginBottom:12}}>
          {quickAmounts.map(a=>{
            const val=(a/100).toFixed(2).replace(".",",");
            const sel=ans===val;
            return (
              <button key={a} className="btn-press" onClick={()=>{if(!res)setAns(val);}}
                style={{background:sel?"linear-gradient(135deg,#26C6DA,#00ACC1)":"#F5F5F5",
                  color:sel?"#fff":T.text,border:`1.5px solid ${sel?"#00ACC1":"#E0E0E0"}`,
                  borderRadius:10,padding:"5px 9px",fontSize:11,fontWeight:800,
                  boxShadow:sel?"0 3px 8px rgba(0,172,193,0.3)":"none",transition:"all 0.15s"}}>
                {fmt(a)}
              </button>
            );
          })}
        </div>
        <input ref={inputRef} value={ans} onChange={e=>!res&&setAns(e.target.value)}
          placeholder="ya da buraya yaz: 1,50"
          inputMode="decimal"
          style={{width:"100%",fontSize:22,fontWeight:900,textAlign:"center",
            border:`2px solid ${res==="ok"?T.success:res==="wrong"?T.primary:"#26C6DA"}`,
            borderRadius:14,padding:"12px",color:T.text,
            background:res==="ok"?"#E8F5E9":res==="wrong"?"#FFEBEE":"#fff",
            transition:"all 0.2s"}}/>
      </div>

      {res==="ok" && (
        <div className="pop card" style={{background:"linear-gradient(135deg,#E8F5E9,#C8E6C9)",
          border:"2px solid #81C784",padding:"18px 16px",textAlign:"center",marginBottom:12}}>
          <div style={{fontSize:44}}>🎉</div>
          <div style={{fontSize:17,fontWeight:900,color:"#2E7D32",marginTop:8}}>
            Doğru! Para üstün: <span style={{color:T.primary}}>{fmt(q.change)}</span>
          </div>
          <button className="btn-press" onClick={next} style={{marginTop:14,background:"linear-gradient(135deg,#27AE60,#1E8449)",color:"#fff",border:"none",borderRadius:20,padding:"12px 28px",fontSize:16,fontWeight:900,boxShadow:"0 6px 18px rgba(39,174,96,0.4)"}}>
            Devam Et →
          </button>
        </div>
      )}
      {res==="wrong" && (
        <div className="card" style={{background:"linear-gradient(135deg,#FFEBEE,#FFCDD2)",border:"2px solid #EF9A9A",padding:"16px",textAlign:"center",marginBottom:12}}>
          <div style={{fontSize:36}}>🤔</div>
          <div style={{fontSize:14,fontWeight:900,color:T.primaryDark,marginTop:8}}>
            İpucu: {fmt(q.paid)} − {fmt(q.product.price)} = ?
          </div>
          <button className="btn-press" onClick={()=>setRes(null)} style={{marginTop:12,background:"linear-gradient(135deg,#E84545,#C0392B)",color:"#fff",border:"none",borderRadius:20,padding:"12px 24px",fontSize:15,fontWeight:900}}>
            Tekrar Dene
          </button>
        </div>
      )}
      {!res && (
        <button className="btn-press" onClick={check} disabled={!ans}
          style={{width:"100%",background:ans?"linear-gradient(135deg,#26C6DA,#00ACC1)":"#E0E0E0",
            color:"#fff",border:"none",borderRadius:18,padding:"15px",fontSize:16,fontWeight:900,
            boxShadow:ans?"0 8px 20px rgba(0,172,193,0.4)":"none",transition:"all 0.2s"}}>
          Kontrol Et ✓
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GAME: SEPET
═══════════════════════════════════════════════════════════════════ */
function BasketGame({onBack, onScore, totalScore}) {
  const prods = getProducts(totalScore);
  const [basket, setBasket]=useState([]);
  const [phase,  setPhase] =useState("shop");
  const [paid,   setPaid]  =useState(0);
  const [counts, setCnts]  =useState({});

  const total=basket.reduce((s,p)=>s+p.price,0);
  const toggle=p=>setBasket(b=>b.find(x=>x.id===p.id)?b.filter(x=>x.id!==p.id):[...b,p]);
  const addCoin=c=>{
    const np=paid+c.value;
    setCnts(x=>({...x,[c.id]:(x[c.id]||0)+1}));
    setPaid(np);
    if(np>=total){onScore(basket.length*5,"multi");setPhase("done");}
  };
  const restart=()=>{setBasket([]);setPhase("shop");setPaid(0);setCnts({});};

  if(phase==="done"){
    const change=paid-total;
    return (
      <div style={{fontFamily:"'Nunito',sans-serif",padding:20}}>
        <div className="pop" style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:72}}>🎊</div>
          <h2 style={{fontSize:24,fontWeight:900,color:T.success,margin:"12px 0 4px"}}>Alışveriş Tamam!</h2>
          <div style={{background:"linear-gradient(135deg,#E8F5E9,#C8E6C9)",borderRadius:12,padding:"6px 16px",
            display:"inline-block",fontSize:14,fontWeight:800,color:T.success}}>
            +{basket.length*5} puan kazandın! 🌟
          </div>
        </div>
        <div className="card" style={{padding:18,marginBottom:16}}>
          {basket.map(p=>(
            <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:15,fontWeight:700}}>{p.emoji} {p.name}</span>
              <span style={{fontSize:15,fontWeight:900,color:T.primary}}>{fmt(p.price)}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:10,borderTop:`2px solid ${T.text}`}}>
            <span style={{fontSize:16,fontWeight:900}}>TOPLAM</span>
            <span style={{fontSize:20,fontWeight:900,color:T.primary,fontFamily:"'Baloo 2',cursive"}}>{fmt(total)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
            <span style={{fontSize:14,fontWeight:700,color:T.sub}}>Ödediğin</span>
            <span style={{fontSize:15,fontWeight:900}}>{fmt(paid)}</span>
          </div>
          {change>0&&(
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6,paddingTop:8,borderTop:`1px dashed ${T.border}`}}>
              <span style={{fontSize:14,fontWeight:700,color:T.sub}}>Para Üstün</span>
              <span style={{fontSize:18,fontWeight:900,color:T.success,fontFamily:"'Baloo 2',cursive"}}>{fmt(change)}</span>
            </div>
          )}
        </div>
        <button className="btn-press" onClick={restart} style={{width:"100%",background:"linear-gradient(135deg,#FFA726,#FB8C00)",color:"#fff",border:"none",borderRadius:20,padding:"15px",fontSize:16,fontWeight:900,boxShadow:"0 8px 20px rgba(251,140,0,0.4)",marginBottom:10}}>
          🛒 Yeni Alışveriş
        </button>
        <button className="btn-press" onClick={onBack} style={{width:"100%",background:"#fff",border:`2px solid ${T.border}`,borderRadius:20,padding:"13px",fontSize:15,fontWeight:800,color:T.sub}}>
          Ana Menü
        </button>
      </div>
    );
  }

  if(phase==="pay") return (
    <div style={{fontFamily:"'Nunito',sans-serif",padding:16}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <button onClick={()=>setPhase("shop")} style={{background:"none",border:"none",fontSize:22,cursor:"pointer"}}>←</button>
        <div style={{fontSize:18,fontWeight:900}}>💳 Ödeme Yap</div>
      </div>
      <div className="card" style={{padding:16,marginBottom:14}}>
        {basket.map(p=>(
          <div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontWeight:700}}>{p.emoji} {p.name}</span>
            <span style={{fontWeight:900,color:T.primary}}>{fmt(p.price)}</span>
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:8,borderTop:`2px solid ${T.text}`}}>
          <span style={{fontWeight:900,fontSize:16}}>TOPLAM</span>
          <span style={{fontWeight:900,fontSize:22,color:T.primary,fontFamily:"'Baloo 2',cursive"}}>{fmt(total)}</span>
        </div>
      </div>
      <div className="card" style={{padding:"12px 16px",marginBottom:14,textAlign:"center",
        background:paid>=total?"linear-gradient(135deg,#E8F5E9,#C8E6C9)":"linear-gradient(135deg,#E3F2FD,#BBDEFB)",
        border:`2px solid ${paid>=total?T.success:"#64B5F6"}`}}>
        <div style={{fontSize:11,fontWeight:800,color:T.sub}}>ÖDEDİĞİN</div>
        <div style={{fontSize:26,fontWeight:900,fontFamily:"'Baloo 2',cursive"}}>{fmt(paid)}</div>
        {paid<total&&<div style={{fontSize:12,color:T.sub,fontWeight:700}}>Daha {fmt(total-paid)} lazım</div>}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center"}}>
        {COINS.map(c=><CoinBtn key={c.id} coin={c} onClick={addCoin} count={counts[c.id]||0}/>)}
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Nunito',sans-serif",padding:16}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <button onClick={onBack} style={{background:"none",border:"none",fontSize:22,cursor:"pointer"}}>←</button>
        <div style={{fontSize:18,fontWeight:900}}>🛒 Sepet Oluştur</div>
        {basket.length>0&&<div style={{marginLeft:"auto",background:"linear-gradient(135deg,#FFA726,#FB8C00)",color:"#fff",borderRadius:20,padding:"4px 12px",fontSize:13,fontWeight:900}}>{basket.length} ürün</div>}
      </div>
      <div style={{fontSize:12,fontWeight:800,color:T.sub,letterSpacing:1,marginBottom:10}}>
        ALMAK İSTEDİĞİN ÜRÜNLERİ SEÇ
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:90}}>
        {prods.map(p=>{
          const inB=basket.find(x=>x.id===p.id);
          return (
            <button key={p.id} className="btn-press fade-in" onClick={()=>toggle(p)} style={{
              background:inB?"linear-gradient(135deg,#FFF9E6,#FFF3CC)":"#fff",
              border:`2px solid ${inB?"#FFA726":T.border}`,
              borderRadius:18,padding:"14px 12px",textAlign:"center",
              boxShadow:inB?"0 4px 12px rgba(255,167,38,0.2)":T.shadow,
              position:"relative",transition:"all 0.15s"
            }}>
              {inB&&<div style={{position:"absolute",top:-8,right:-8,background:"#FFA726",
                color:"#fff",borderRadius:"50%",width:22,height:22,fontSize:12,
                display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,
                boxShadow:"0 2px 8px rgba(255,167,38,0.5)"}}>✓</div>}
              <div style={{fontSize:34}}>{p.emoji}</div>
              <div style={{fontSize:12,fontWeight:900,color:T.text,marginTop:6}}>{p.name}</div>
              <div style={{fontSize:15,fontWeight:900,color:T.primary,marginTop:2,fontFamily:"'Baloo 2',cursive"}}>{fmt(p.price)}</div>
            </button>
          );
        })}
      </div>
      {basket.length>0&&(
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:390,
          background:"linear-gradient(135deg,#FFA726,#FB8C00)",
          padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",
          boxShadow:"0 -4px 20px rgba(251,140,0,0.3)"}}>
          <div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.7)",fontWeight:800,letterSpacing:1}}>TOPLAM</div>
            <div style={{fontSize:24,fontWeight:900,color:"#fff",fontFamily:"'Baloo 2',cursive"}}>{fmt(total)}</div>
          </div>
          <button className="btn-press" onClick={()=>setPhase("pay")} style={{
            background:"#fff",color:"#FB8C00",border:"none",borderRadius:18,
            padding:"12px 22px",fontSize:16,fontWeight:900,
            boxShadow:"0 4px 12px rgba(0,0,0,0.15)"}}>Öde →</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SVG CURRENCY ILLUSTRATIONS
═══════════════════════════════════════════════════════════════════ */

// 25 Kuruş — altın/pirinç renkli bimetalli sikke
function Coin25() {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="c25o" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#F5D060"/>
          <stop offset="50%" stopColor="#C8922A"/>
          <stop offset="100%" stopColor="#8B5E0A"/>
        </radialGradient>
        <radialGradient id="c25i" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#E8E0C0"/>
          <stop offset="50%" stopColor="#B8A870"/>
          <stop offset="100%" stopColor="#8B7840"/>
        </radialGradient>
      </defs>
      {/* Dış halka */}
      <circle cx="60" cy="60" r="56" fill="url(#c25o)" stroke="#8B5E0A" strokeWidth="2"/>
      {/* Orta daire */}
      <circle cx="60" cy="60" r="40" fill="url(#c25i)"/>
      {/* Kenarlık çizgisi */}
      <circle cx="60" cy="60" r="56" fill="none" stroke="#F5D880" strokeWidth="1" opacity="0.6"/>
      <circle cx="60" cy="60" r="40" fill="none" stroke="#D4B840" strokeWidth="1.5"/>
      {/* Hilal ve yıldız */}
      <path d="M55 44 Q48 52 52 62 Q44 58 44 50 Q44 40 55 44Z" fill="#8B5E0A" opacity="0.7"/>
      <polygon points="62,43 63.5,48 68.5,48 64.5,51 66,56 62,53 58,56 59.5,51 55.5,48 60.5,48" fill="#8B5E0A" opacity="0.7"/>
      {/* Değer yazısı */}
      <text x="60" y="76" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#5C3A0A" fontFamily="serif">25 Kr</text>
      {/* Parlaklık */}
      <ellipse cx="45" cy="42" rx="10" ry="5" fill="white" opacity="0.18" transform="rotate(-30 45 42)"/>
    </svg>
  );
}

// 50 Kuruş — gümüş/nikel bimetalli sikke
function Coin50() {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="c50o" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#E8E8E8"/>
          <stop offset="50%" stopColor="#A0A0A0"/>
          <stop offset="100%" stopColor="#606060"/>
        </radialGradient>
        <radialGradient id="c50i" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#F0D870"/>
          <stop offset="50%" stopColor="#C8A030"/>
          <stop offset="100%" stopColor="#907010"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#c50o)" stroke="#505050" strokeWidth="2"/>
      <circle cx="60" cy="60" r="38" fill="url(#c50i)"/>
      <circle cx="60" cy="60" r="56" fill="none" stroke="#D0D0D0" strokeWidth="1" opacity="0.7"/>
      <circle cx="60" cy="60" r="38" fill="none" stroke="#E0B840" strokeWidth="1.5"/>
      <path d="M55 44 Q48 52 52 62 Q44 58 44 50 Q44 40 55 44Z" fill="#705010" opacity="0.7"/>
      <polygon points="62,43 63.5,48 68.5,48 64.5,51 66,56 62,53 58,56 59.5,51 55.5,48 60.5,48" fill="#705010" opacity="0.7"/>
      <text x="60" y="76" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#503800" fontFamily="serif">50 Kr</text>
      <ellipse cx="45" cy="42" rx="10" ry="5" fill="white" opacity="0.2" transform="rotate(-30 45 42)"/>
    </svg>
  );
}

// 1 TL — bimetalli (gümüş dış, altın iç)
function Coin1TL() {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="c1o" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#F8F0D0"/>
          <stop offset="50%" stopColor="#D4A820"/>
          <stop offset="100%" stopColor="#8B6800"/>
        </radialGradient>
        <radialGradient id="c1i" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#F0F0F0"/>
          <stop offset="50%" stopColor="#B0B0B0"/>
          <stop offset="100%" stopColor="#707070"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#c1o)" stroke="#8B6800" strokeWidth="2.5"/>
      <circle cx="60" cy="60" r="36" fill="url(#c1i)"/>
      <circle cx="60" cy="60" r="56" fill="none" stroke="#F8D840" strokeWidth="1.5" opacity="0.6"/>
      <circle cx="60" cy="60" r="36" fill="none" stroke="#C0C0C0" strokeWidth="1.5"/>
      {/* Atatürk silueti */}
      <ellipse cx="60" cy="50" rx="10" ry="12" fill="#808080" opacity="0.5"/>
      <path d="M50 56 Q60 70 70 56" fill="#808080" opacity="0.4"/>
      <text x="60" y="78" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#505050" fontFamily="serif">1 ₺</text>
      <ellipse cx="44" cy="42" rx="12" ry="5" fill="white" opacity="0.22" transform="rotate(-25 44 42)"/>
    </svg>
  );
}

// Banknot SVG'leri
function Banknot({value, label, c1, c2, c3, person, back}) {
  const w=280, h=128;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{maxWidth:280,display:"block",margin:"0 auto"}}>
      <defs>
        <linearGradient id={`bg${value}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1}/>
          <stop offset="50%" stopColor={c2}/>
          <stop offset="100%" stopColor={c3}/>
        </linearGradient>
        <filter id={`sh${value}`}>
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.25"/>
        </filter>
      </defs>
      {/* Banknot gövdesi */}
      <rect x="2" y="2" width={w-4} height={h-4} rx="8" fill={`url(#bg${value})`} filter={`url(#sh${value})`}/>
      {/* Kenarlık deseni */}
      <rect x="6" y="6" width={w-12} height={h-12} rx="6" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
      <rect x="10" y="10" width={w-20} height={h-20} rx="4" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"/>

      {/* Sol dekoratif bant */}
      <rect x="2" y="2" width="48" height={h-4} rx="8" fill="rgba(0,0,0,0.15)"/>
      <rect x="2" y="2" width="48" height={h-4} rx="8" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>

      {/* Değer - sol büyük */}
      <text x="26" y="58" textAnchor="middle" fontSize="22" fontWeight="900" fill="rgba(255,255,255,0.95)" fontFamily="serif">{label}</text>
      <text x="26" y="76" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.7)" fontFamily="serif">₺</text>

      {/* Orta alan — Atatürk siluet */}
      <ellipse cx="155" cy="52" rx="20" ry="24" fill="rgba(255,255,255,0.12)"/>
      <ellipse cx="155" cy="44" rx="13" ry="15" fill="rgba(255,255,255,0.15)"/>
      <path d="M142 58 Q155 72 168 58" fill="rgba(255,255,255,0.12)"/>
      {/* Atatürk yazısı */}
      <text x="155" y="85" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.55)" fontFamily="serif" letterSpacing="1">ATATÜRK</text>

      {/* Sağ üst — Türkiye Cumhuriyet Merkez Bankası */}
      <text x="240" y="24" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.65)" fontFamily="serif">TÜRKİYE CUMHURİYET</text>
      <text x="240" y="33" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.65)" fontFamily="serif">MERKEZ BANKASI</text>

      {/* Sağ değer */}
      <text x="248" y="72" textAnchor="middle" fontSize="28" fontWeight="900" fill="rgba(255,255,255,0.9)" fontFamily="serif">{label}</text>

      {/* Alt yazı */}
      <text x="155" y={h-14} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.5)" fontFamily="serif" letterSpacing="2">
        TÜRK LİRASI
      </text>

      {/* Hologram daire */}
      <circle cx="230" cy="100" r="10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <circle cx="230" cy="100" r="6" fill="rgba(255,255,255,0.15)"/>

      {/* Güvenlik şeridi */}
      <rect x="88" y="2" width="5" height={h-4} fill="rgba(255,255,255,0.12)"/>

      {/* Dekoratif desen - sağ */}
      <circle cx="195" cy="30" r="16" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
      <circle cx="195" cy="30" r="10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>

      {/* Kişi ismi */}
      <text x="155" y={h-22} textAnchor="middle" fontSize="6.5" fill="rgba(255,255,255,0.45)" fontFamily="serif" fontStyle="italic">
        {person}
      </text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LEARN SCREEN
═══════════════════════════════════════════════════════════════════ */
function LearnScreen({onBack}) {
  const [sel,setSel]=useState(null);

  const facts=[
    {
      label:"25 Kuruş", value:25, color:"#C8922A", bg:"#FFF9E6", border:"#FFD54F",
      desc:"4 tane = 1 TL yapar.", extra:"2 tane = 50 Kuruş",
      type:"coin", visual:<Coin25/>,
      front:"Hilal-yıldız ve 25 Kr yazısı", back:"Türkiye haritası deseni"
    },
    {
      label:"50 Kuruş", value:50, color:"#757575", bg:"#F5F5F5", border:"#BDBDBD",
      desc:"2 tane 25 Kuruş = 50 Kuruş!", extra:"2 tane = 1 TL",
      type:"coin", visual:<Coin50/>,
      front:"Hilal-yıldız ve 50 Kr yazısı", back:"Türkiye haritası deseni"
    },
    {
      label:"1 Türk Lirası", value:100, color:"#C8962A", bg:"#FFF8E6", border:"#FFCA28",
      desc:"100 Kuruş = 1 TL. Ya da 4×25 Kuruş!", extra:"2 tane = 2 TL",
      type:"coin", visual:<Coin1TL/>,
      front:"Atatürk portresi — gümüş dış, altın iç", back:"Ay-yıldız deseni"
    },
    {
      label:"5 Türk Lirası", value:500, color:"#6A0DAD", bg:"#F3E5F5", border:"#CE93D8",
      desc:"5 tane 1 TL = 1 tane 5 TL banknot.", extra:"20 tane 25 Kr = 5 TL",
      type:"bill",
      visual:<Banknot value={500} label="5" c1="#7B1FA2" c2="#6A0DAD" c3="#4A148C" person="Aydin Sayili"/>,
      front:"Mor/eflatun renk — Atatürk + Aydin Sayili", back:"İstanbul Boğazı"
    },
    {
      label:"10 Türk Lirası", value:1000, color:"#C62828", bg:"#FFEBEE", border:"#EF9A9A",
      desc:"10 tane 1 TL veya 2 tane 5 TL!", extra:"40 tane 25 Kr = 10 TL",
      type:"bill",
      visual:<Banknot value={1000} label="10" c1="#E53935" c2="#C62828" c3="#8B0000" person="Cahit Arf"/>,
      front:"Kırmızı renk — Atatürk + Cahit Arf", back:"Efes Antik Kenti"
    },
    {
      label:"20 Türk Lirası", value:2000, color:"#2E7D32", bg:"#F1F8E9", border:"#A5D6A7",
      desc:"2 tane 10 TL = 1 tane 20 TL banknot.", extra:"80 tane 25 Kr = 20 TL",
      type:"bill",
      visual:<Banknot value={2000} label="20" c1="#43A047" c2="#2E7D32" c3="#1B5E20" person="Ahmet Mimar Kemaleddin"/>,
      front:"Yeşil renk — Atatürk + Mimar Kemaleddin", back:"Anıtkabir"
    },
    {
      label:"50 Türk Lirası", value:5000, color:"#BF6000", bg:"#FFF3E0", border:"#FFCC80",
      desc:"5 tane 10 TL = 1 tane 50 TL banknot.", extra:"200 tane 25 Kr = 50 TL",
      type:"bill",
      visual:<Banknot value={5000} label="50" c1="#F57C00" c2="#BF6000" c3="#7A3E00" person="Fatma Aliye Topuz"/>,
      front:"Turuncu/kahve — Atatürk + Fatma Aliye", back:"Fatih Camii"
    },
    {
      label:"100 Türk Lirası", value:10000, color:"#0D47A1", bg:"#E3F2FD", border:"#90CAF9",
      desc:"2 tane 50 TL = 1 tane 100 TL banknot.", extra:"10 tane 10 TL = 100 TL",
      type:"bill",
      visual:<Banknot value={10000} label="100" c1="#1976D2" c2="#0D47A1" c3="#002171" person="Buhurizade Mustafa Itri"/>,
      front:"Mavi renk — Atatürk + Buhurizade Itri", back:"İshak Paşa Sarayı"
    },
    {
      label:"200 Türk Lirası", value:20000, color:"#4E342E", bg:"#EFEBE9", border:"#BCAAA4",
      desc:"2 tane 100 TL = 1 tane 200 TL banknot.", extra:"4 tane 50 TL = 200 TL",
      type:"bill",
      visual:<Banknot value={20000} label="200" c1="#6D4C41" c2="#4E342E" c3="#3E2723" person="Yunus Emre"/>,
      front:"Kahverengi/bordo — Atatürk + Yunus Emre", back:"Hacı Bektaş Dergahı"
    },
  ];

  return (
    <div style={{fontFamily:"'Nunito',sans-serif",padding:16}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <button onClick={onBack} style={{background:"none",border:"none",fontSize:22,cursor:"pointer"}}>←</button>
        <div style={{fontSize:18,fontWeight:900}}>📚 Para Tanı</div>
      </div>

      {/* 25 kr table */}
      <div className="card" style={{padding:16,marginBottom:14,
        background:"linear-gradient(135deg,#FFF9E6,#FFF3CC)",border:"1.5px solid #FFD54F"}}>
        <div style={{fontSize:13,fontWeight:900,color:"#9E7200",marginBottom:12}}>🪙 25 Kuruş Çarpım Tablosu</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {[1,2,3,4,5,6,7,8].map(n=>(
            <div key={n} style={{
              background:n%4===0?"linear-gradient(135deg,#E84545,#C0392B)":"#fff",
              borderRadius:12,padding:"8px 4px",textAlign:"center",
              boxShadow:"0 2px 6px rgba(0,0,0,0.07)"
            }}>
              <div style={{fontSize:10,color:n%4===0?"rgba(255,255,255,0.8)":T.sub,fontWeight:800}}>{n}×25 Kr</div>
              <div style={{fontSize:15,fontWeight:900,color:n%4===0?"#fff":T.text,fontFamily:"'Baloo 2',cursive"}}>{fmt(n*25)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{fontSize:12,fontWeight:800,color:T.sub,letterSpacing:1,marginBottom:10}}>
        GÖRSELE TIKLA — DETAY GÖR
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {facts.map(f=>(
          <div key={f.label} className="card" style={{overflow:"hidden",border:`2px solid ${sel?.label===f.label?f.color:T.border}`,transition:"border 0.2s"}}>
            {/* Başlık satırı */}
            <button className="btn-press" onClick={()=>setSel(sel?.label===f.label?null:f)}
              style={{width:"100%",background:sel?.label===f.label?`${f.bg}`:"#FAFAFA",
                border:"none",padding:"13px 16px",textAlign:"left",
                display:"flex",alignItems:"center",gap:14,transition:"background 0.2s"}}>
              {/* Küçük önizleme */}
              <div style={{width:48,height:f.type==="coin"?48:30,flexShrink:0,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                {f.type==="coin" ? (
                  <svg viewBox="0 0 120 120" width="48" height="48">
                    {f.label==="25 Kuruş" && <>
                      <defs><radialGradient id="m25" cx="40%" cy="35%" r="60%"><stop offset="0%" stopColor="#F5D060"/><stop offset="100%" stopColor="#8B5E0A"/></radialGradient></defs>
                      <circle cx="60" cy="60" r="55" fill="url(#m25)" stroke="#8B5E0A" strokeWidth="3"/>
                      <circle cx="60" cy="60" r="40" fill="#D4A840" opacity="0.6"/>
                      <text x="60" y="68" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#5C3A0A" fontFamily="serif">25</text>
                    </>}
                    {f.label==="50 Kuruş" && <>
                      <defs><radialGradient id="m50" cx="40%" cy="35%" r="60%"><stop offset="0%" stopColor="#E8E8E8"/><stop offset="100%" stopColor="#606060"/></radialGradient></defs>
                      <circle cx="60" cy="60" r="55" fill="url(#m50)" stroke="#505050" strokeWidth="3"/>
                      <circle cx="60" cy="60" r="38" fill="#C8A030" opacity="0.7"/>
                      <text x="60" y="68" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#503800" fontFamily="serif">50</text>
                    </>}
                    {f.label==="1 Türk Lirası" && <>
                      <defs><radialGradient id="m1" cx="40%" cy="35%" r="60%"><stop offset="0%" stopColor="#F8D840"/><stop offset="100%" stopColor="#8B6800"/></radialGradient></defs>
                      <circle cx="60" cy="60" r="55" fill="url(#m1)" stroke="#8B6800" strokeWidth="3"/>
                      <circle cx="60" cy="60" r="36" fill="#C0C0C0" opacity="0.8"/>
                      <text x="60" y="68" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#505050" fontFamily="serif">1₺</text>
                    </>}
                  </svg>
                ) : (
                  <div style={{width:56,height:30,borderRadius:4,
                    background:`linear-gradient(135deg,${f.color},${f.color}88)`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    boxShadow:`0 2px 6px ${f.color}55`,border:`1px solid ${f.color}aa`}}>
                    <span style={{fontSize:13,fontWeight:900,color:"#fff"}}>{f.label.split(" ")[0]}</span>
                  </div>
                )}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:900,color:f.color}}>{f.label}</div>
                <div style={{fontSize:11,color:T.sub,fontWeight:700,marginTop:1}}>{fmt(f.value)}</div>
              </div>
              <div style={{fontSize:16,color:f.color,transition:"transform 0.25s",
                transform:sel?.label===f.label?"rotate(180deg)":"rotate(0)"}}>▼</div>
            </button>

            {/* Detay paneli */}
            {sel?.label===f.label && (
              <div className="fade-in" style={{background:f.bg,borderTop:`1.5px solid ${f.border}`,padding:"16px 16px 18px"}}>
                {/* GÖRSEL */}
                <div style={{display:"flex",justifyContent:"center",marginBottom:14,
                  filter:"drop-shadow(0 6px 16px rgba(0,0,0,0.18))"}}>
                  {f.visual}
                </div>

                {/* Ön/Arka bilgi */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  <div style={{background:"rgba(255,255,255,0.75)",borderRadius:10,padding:"9px 10px"}}>
                    <div style={{fontSize:10,fontWeight:800,color:f.color,marginBottom:3}}>ÖN YÜZ</div>
                    <div style={{fontSize:11,fontWeight:700,color:T.text,lineHeight:1.4}}>{f.front}</div>
                  </div>
                  <div style={{background:"rgba(255,255,255,0.75)",borderRadius:10,padding:"9px 10px"}}>
                    <div style={{fontSize:10,fontWeight:800,color:f.color,marginBottom:3}}>ARKA YÜZ</div>
                    <div style={{fontSize:11,fontWeight:700,color:T.text,lineHeight:1.4}}>{f.back}</div>
                  </div>
                </div>

                {/* Açıklama */}
                <div style={{background:"rgba(255,255,255,0.6)",borderRadius:10,padding:"10px 12px"}}>
                  <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:5}}>📌 {f.desc}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:14}}>💡</span>
                    <span style={{fontSize:12,fontWeight:700,color:T.sub}}>{f.extra}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{height:20}}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   APP SHELL — Score/Achievement management
═══════════════════════════════════════════════════════════════════ */
export default function App() {
  const [appState, setAppState] = useState("loading"); // loading|onboarding|auth|setup|app
  const [uid,  setUid]  = useState(null);
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [toast,  setToast]  = useState(null);
  const [levelUp,setLevelUp]= useState(null);
  const [saving, setSaving] = useState(false);

  // Init
  useEffect(()=>{
    (async()=>{
      try {
        const seen = await window.storage.get("onboarding_done");
        if(!seen) { setAppState("onboarding"); return; }
        const sid = await loadSession();
        if(sid){
          const u = await loadUser(sid);
          if(u){ setUid(sid); setUser(u); setAppState("app"); return; }
        }
        setAppState("auth");
      } catch(e){ setAppState("onboarding"); }
    })();
  },[]);

  const handleOnboardingDone = async () => {
    try { await window.storage.set("onboarding_done","1"); } catch(e){}
    setAppState("auth");
  };

  const handleLogin = async (profile) => {
    // Check if existing user
    let existing = await loadUser(profile.uid);
    if(existing) {
      setUid(profile.uid); setUser(existing);
      await saveSession(profile.uid);
      setAppState("app");
    } else {
      // New user → profile setup
      setUid(profile.uid);
      setUser({...profile, score:0, totalCorrect:0, maxStreak:0, shopWins:0, achievements:[]});
      setAppState("setup");
    }
  };

  const handleProfileSave = async ({avatar, childName}) => {
    const newUser = {...user, avatar, childName};
    setUser(newUser);
    await saveUser(uid, newUser);
    await saveSession(uid);
    setAppState("app");
  };

  const handleLogout = async () => {
    await clearSession();
    setUid(null); setUser(null); setScreen("home");
    setAppState("auth");
  };

  const addScore = useCallback(async (pts, mode) => {
    setUser(prev => {
      if(!prev) return prev;
      const prevLv = getLevel(prev.score);
      const newScore = prev.score + pts;
      const newLv = getLevel(newScore);
      const newStreak = (prev._streak||0) + 1;
      const maxStreak = Math.max(prev.maxStreak||0, newStreak);
      const totalCorrect = (prev.totalCorrect||0) + 1;
      const shopWins = mode==="pay" ? (prev.shopWins||0)+1 : (prev.shopWins||0);

      const updated = {
        ...prev, score:newScore,
        totalCorrect, maxStreak, shopWins,
        _streak: newStreak,
      };

      // Check achievements
      const newEarned = ACHIEVEMENTS.filter(a => a.req(updated) && !prev.achievements?.includes(a.id));
      if(newEarned.length>0){
        updated.achievements = [...(prev.achievements||[]), ...newEarned.map(a=>a.id)];
        setToast(newEarned[0]);
      }

      // Level up?
      if(newLv.name !== prevLv.name) {
        setTimeout(()=>setLevelUp(newLv), 400);
      }

      // Persist
      saveUser(uid, updated);

      return updated;
    });
  }, [uid]);

  if(appState==="loading") return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#1A1A2E,#0F3460)",
      display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <style>{css}</style>
      <div style={{fontSize:64}}>🏪</div>
      <Spinner size={32} color="#E84545"/>
    </div>
  );

  if(appState==="onboarding") return (
    <div style={{maxWidth:390,margin:"0 auto"}}>
      <style>{css}</style>
      <Onboarding onDone={handleOnboardingDone}/>
    </div>
  );

  if(appState==="auth") return (
    <div style={{maxWidth:390,margin:"0 auto"}}>
      <style>{css}</style>
      <AuthScreen onLogin={handleLogin}/>
    </div>
  );

  if(appState==="setup") return (
    <div style={{maxWidth:390,margin:"0 auto"}}>
      <style>{css}</style>
      <ProfileSetup profile={user} onSave={handleProfileSave}/>
    </div>
  );

  const hard = user.score >= 100;

  return (
    <div style={{maxWidth:390,margin:"0 auto",minHeight:"100vh",background:T.bg,fontFamily:"'Nunito',sans-serif",position:"relative"}}>
      <style>{css}</style>

      {/* Overlays */}
      {toast && <AchievementToast achievement={toast} onClose={()=>setToast(null)}/>}
      {levelUp && <LevelUpModal level={levelUp} onClose={()=>setLevelUp(null)}/>}

      {/* Top bar */}
      <div style={{
        background: hard
          ? "linear-gradient(135deg,#4A148C,#880E4F)"
          : "linear-gradient(135deg,#C62828,#E84545)",
        padding:"0 16px",height:60,
        display:"flex",alignItems:"center",gap:10,
        boxShadow:"0 4px 20px rgba(0,0,0,0.2)",
        position:"sticky",top:0,zIndex:100
      }}>
        <div style={{width:34,height:34,borderRadius:12,
          background:"rgba(255,255,255,0.15)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
          {user?.avatar}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:900,color:"#fff",lineHeight:1}}>{user?.childName}</div>
          <XPBar score={user?.score||0} compact/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{background:"rgba(255,255,255,0.15)",borderRadius:20,
            padding:"4px 12px",display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:12}}>⭐</span>
            <span style={{fontSize:14,fontWeight:900,color:"#fff"}}>{user?.score||0}</span>
          </div>
          <div style={{width:3,height:3,borderRadius:"50%",background:"rgba(255,255,255,0.3)"}}/>
          <div style={{fontSize:13}}>🇹🇷</div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{minHeight:"calc(100vh - 60px)",overflowY:"auto"}}>
        {screen==="home"    && <HomeScreen    user={user} onSelect={setScreen} onProfile={()=>setScreen("profile")}/>}
        {screen==="profile" && <ProfileScreen user={user} onBack={()=>setScreen("home")} onLogout={handleLogout}/>}
        {screen==="pay"     && <PayGame     onBack={()=>setScreen("home")} onScore={addScore} totalScore={user.score}/>}
        {screen==="change"  && <ChangeGame  onBack={()=>setScreen("home")} onScore={addScore} totalScore={user.score}/>}
        {screen==="multi"   && <BasketGame  onBack={()=>setScreen("home")} onScore={addScore} totalScore={user.score}/>}
        {screen==="learn"   && <LearnScreen onBack={()=>setScreen("home")}/>}
      </div>
    </div>
  );
}
