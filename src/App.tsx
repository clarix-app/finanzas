import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { createClient, User } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

type Space = 'personal' | 'empresa'
const fmt = (n: number) => '$' + Math.abs(Math.round(n)).toLocaleString('es-CO')
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

interface AuthCtx { user: User|null; loading: boolean; signIn: (e:string,p:string)=>Promise<any>; signUp: (e:string,p:string,n:string)=>Promise<any>; signOut: ()=>Promise<void> }
const AuthContext = createContext<AuthCtx|undefined>(undefined)

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User|null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => { setUser(session?.user??null); setLoading(false) })
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,s) => { setUser(s?.user??null); setLoading(false) })
    return () => subscription.unsubscribe()
  }, [])
  return (
    <AuthContext.Provider value={{
      user, loading,
      signIn: (e,p) => supabase.auth.signInWithPassword({email:e,password:p}).then(r=>({error:r.error})),
      signUp: (e,p,n) => supabase.auth.signUp({email:e,password:p,options:{data:{name:n}}}).then(r=>({error:r.error})),
      signOut: () => supabase.auth.signOut().then(()=>{})
    }}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth() {
  const c = useContext(AuthContext)
  if (!c) throw new Error('useAuth')
  return c
}

const btn: React.CSSProperties = {padding:'7px 14px',borderRadius:'9px',fontSize:'12px',fontWeight:600,cursor:'pointer',border:'none',background:'linear-gradient(135deg,#8b7ff0,#6a8af0)',color:'#fff',fontFamily:'sans-serif'}
const inp: React.CSSProperties = {width:'100%',background:'#1a1a2e',border:'1px solid #252535',borderRadius:'7px',padding:'7px 10px',color:'#e8e8f0',fontSize:'12px',outline:'none',boxSizing:'border-box',marginBottom:'9px'}
const card: React.CSSProperties = {background:'#12121e',borderRadius:'12px',border:'1px solid #252535'}

function LoginPage({onReg}:{onReg:()=>void}) {
  const {signIn} = useAuth()
  const [email,setEmail] = useState('')
  const [pw,setPw] = useState('')
  const [loading,setLoading] = useState(false)
  const [err,setErr] = useState('')

  return (
    <div style={{minHeight:'100vh',background:'#0d0d14',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'400px'}}>
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <div style={{width:'52px',height:'52px',borderRadius:'14px',background:'linear-gradient(135deg,#8b7ff0,#6a8af0)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 0 24px rgba(139,127,240,.4)'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <h1 style={{fontFamily:'sans-serif',fontSize:'28px',fontWeight:700,color:'#e8e8f0',margin:'0 0 6px'}}>Clarix</h1>
          <p style={{color:'#6060a0',fontSize:'14px',margin:0}}>Inicia sesión para continuar</p>
        </div>
        <div style={{...card,padding:'28px'}}>
          {err && <div style={{background:'rgba(248,113,113,.1)',border:'1px solid rgba(248,113,113,.3)',borderRadius:'8px',padding:'10px',color:'#f87171',fontSize:'13px',marginBottom:'16px'}}>{err}</div>}
          <label style={{display:'block',fontSize:'10px',color:'#6060a0',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:'6px'}}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" style={inp}/>
          <label style={{display:'block',fontSize:'10px',color:'#6060a0',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:'6px'}}>Contraseña</label>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" style={{...inp,marginBottom:'20px'}}/>
          <button onClick={async()=>{setLoading(true);setErr('');const{error}=await signIn(email,pw);if(error)setErr('Email o contraseña incorrectos');setLoading(false)}} style={{...btn,width:'100%',padding:'13px',fontSize:'14px'}}>{loading?'Iniciando...':'Iniciar sesión'}</button>
        </div>
        <p style={{textAlign:'center',marginTop:'20px',color:'#6060a0',fontSize:'14px'}}>
          ¿No tienes cuenta? <button onClick={onReg} style={{background:'none',border:'none',color:'#a89ef5',cursor:'pointer',fontSize:'14px',fontWeight:600}}>Crear cuenta</button>
        </p>
      </div>
    </div>
  )
}

function RegisterPage({onLogin}:{onLogin:()=>void}) {
  const {signUp} = useAuth()
  const [name,setName] = useState('')
  const [email,setEmail] = useState('')
  const [pw,setPw] = useState('')
  const [loading,setLoading] = useState(false)
  const [err,setErr] = useState('')
  const [ok,setOk] = useState(false)

  if (ok) return (
    <div style={{minHeight:'100vh',background:'#0d0d14',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:'20px'}}>
        <div style={{fontSize:'48px',marginBottom:'16px'}}>✅</div>
        <h2 style={{color:'#e8e8f0',marginBottom:'10px'}}>¡Cuenta creada!</h2>
        <p style={{color:'#6060a0',marginBottom:'24px'}}>Ya puedes iniciar sesión.</p>
        <button onClick={onLogin} style={{...btn,padding:'12px 28px'}}>Ir al login</button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#0d0d14',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'400px'}}>
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <div style={{width:'52px',height:'52px',borderRadius:'14px',background:'linear-gradient(135deg,#8b7ff0,#6a8af0)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 0 24px rgba(139,127,240,.4)'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <h1 style={{fontFamily:'sans-serif',fontSize:'28px',fontWeight:700,color:'#e8e8f0',margin:'0 0 6px'}}>Clarix</h1>
          <p style={{color:'#6060a0',fontSize:'14px',margin:0}}>Crea tu cuenta gratis</p>
        </div>
        <div style={{...card,padding:'28px'}}>
          {err && <div style={{background:'rgba(248,113,113,.1)',border:'1px solid rgba(248,113,113,.3)',borderRadius:'8px',padding:'10px',color:'#f87171',fontSize:'13px',marginBottom:'16px'}}>{err}</div>}
          <label style={{display:'block',fontSize:'10px',color:'#6060a0',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:'6px'}}>Nombre</label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" style={inp}/>
          <label style={{display:'block',fontSize:'10px',color:'#6060a0',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:'6px'}}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" style={inp}/>
          <label style={{display:'block',fontSize:'10px',color:'#6060a0',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:'6px'}}>Contraseña</label>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" style={{...inp,marginBottom:'20px'}}/>
          <button onClick={async()=>{if(pw.length<6){setErr('Mínimo 6 caracteres');return}setLoading(true);setErr('');const{error}=await signUp(email,pw,name);if(error)setErr(error.message||'Error');else setOk(true);setLoading(false)}} style={{...btn,width:'100%',padding:'13px',fontSize:'14px'}}>{loading?'Creando...':'Crear cuenta'}</button>
        </div>
        <p style={{textAlign:'center',marginTop:'20px',color:'#6060a0',fontSize:'14px'}}>
          ¿Ya tienes cuenta? <button onClick={onLogin} style={{background:'none',border:'none',color:'#a89ef5',cursor:'pointer',fontSize:'14px',fontWeight:600}}>Iniciar sesión</button>
        </p>
      </div>
    </div>
  )
}

function Dashboard({txs,gami,space,month,year,isEmp,userName,onOpen}:any) {
  const ing = txs.filter((t:any)=>t.type==='ingreso').reduce((s:number,t:any)=>s+t.amount,0)
  const eg = txs.filter((t:any)=>t.type==='egreso').reduce((s:number,t:any)=>s+t.amount,0)
  const util = ing - eg
  const hour = new Date().getHours()
  const greet = hour<12?'Buenos días':hour<18?'Buenas tardes':'Buenas noches'
  const xpPct = gami ? ((gami.xp%500)/500)*100 : 0
  return (
    <div style={{padding:'20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px'}}>
        <div>
          <div style={{fontFamily:'sans-serif',fontWeight:700,fontSize:'17px',color:'#e8e8f0'}}>Inicio</div>
          <div style={{fontSize:'11px',color:'#5555a0',marginTop:'2px'}}>{isEmp?'Finanzas empresa':'Finanzas personales'} · {MONTHS[month]} {year}</div>
        </div>
        <button style={btn} onClick={onOpen}>+ Registrar</button>
      </div>
      <div style={{...card,padding:'16px 18px',marginBottom:'12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontFamily:'sans-serif',fontWeight:700,fontSize:'15px',color:'#e8e8f0'}}>{greet}, {userName} 👋</div>
          <div style={{fontSize:'11px',color:'#6060a0',marginTop:'3px'}}>{isEmp?'Tu negocio va por buen camino':'Tus finanzas están bajo control'}</div>
          {gami && <div style={{display:'flex',alignItems:'center',gap:'5px',marginTop:'7px',fontSize:'11px',color:'#fbbf24'}}><div style={{width:'7px',height:'7px',borderRadius:'50%',background:'#fbbf24'}}/>{gami.streak_days} días de racha 🔥</div>}
        </div>
        {gami && (
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'10px',color:'#6060a0',marginBottom:'5px'}}>Nivel {gami.level}</div>
            <div style={{width:'120px',height:'5px',background:'#1a1a2e',borderRadius:'99px',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${xpPct}%`,background:'linear-gradient(90deg,#8b7ff0,#6a8af0)',borderRadius:'99px'}}/>
            </div>
            <div style={{fontSize:'10px',color:'#6060a0',marginTop:'3px'}}>{gami.xp} XP</div>
          </div>
        )}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'9px',marginBottom:'12px'}}>
        {[{l:'Ingresos',v:ing,c:'#a89ef5'},{l:isEmp?'Egresos':'Gastos',v:eg,c:'#f87171'},{l:isEmp?'Utilidad':'Ahorro',v:util,c:'#4ade80'}].map((k,i)=>(
          <div key={i} style={{...card,padding:'13px 15px'}}>
            <div style={{fontSize:'10px',color:'#6060a0',textTransform:'uppercase',letterSpacing:'.1em'}}>{k.l}</div>
            <div style={{fontFamily:'sans-serif',fontWeight:700,fontSize:'1.25rem',marginTop:'5px',color:k.c}}>{fmt(k.v)}</div>
          </div>
        ))}
      </div>
      <div style={{...card,padding:'14px'}}>
        <div style={{fontSize:'10px',color:'#6060a0',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:'10px'}}>Últimos movimientos</div>
        {txs.length===0 ? <div style={{textAlign:'center',padding:'20px',color:'#6060a0',fontSize:'12px'}}>No hay movimientos este mes. ¡Registra el primero!</div> :
          txs.slice(0,5).map((t:any)=>(
            <div key={t.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(37,37,53,.5)'}}>
              <div><div style={{fontSize:'12px',color:'#c0c0e0'}}>{t.description}</div><div style={{fontSize:'10px',color:'#6060a0',marginTop:'2px'}}>{t.date} · {t.payment_method||'—'}</div></div>
              <div style={{fontFamily:'sans-serif',fontWeight:700,fontSize:'13px',color:t.type==='ingreso'?'#4ade80':'#f87171'}}>{t.type==='ingreso'?'+':'-'}{fmt(t.amount)}</div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

function Modal({pms,space,onAdd,onClose}:any) {
  const [mode,setMode] = useState('menu')
  const [type,setType] = useState('ingreso')
  const [date,setDate] = useState(new Date().toISOString().split('T')[0])
  const [desc,setDesc] = useState('')
  const [amount,setAmount] = useState('')
  const [pm,setPm] = useState(pms[0]?.name||'')
  const [client,setClient] = useState('')
  const [saving,setSaving] = useState(false)
  const [aiFb,setAiFb] = useState('')

  const doAI = (t:'audio'|'foto'|'chat') => {
    setMode('form')
    const msgs = {audio:['🎙 Escuchando...','✅ Arriendo 800k',800000,'Pago arriendo','egreso'],foto:['📷 Analizando...','✅ Supermercado $245k',245000,'Supermercado','egreso'],chat:['💬 Procesando...','✅ Consultoría $1.5M',1500000,'Consultoría','ingreso']}
    setAiFb(msgs[t][0] as string)
    setTimeout(()=>{setAiFb(msgs[t][1] as string);setAmount(String(msgs[t][2]));setDesc(msgs[t][3] as string);setType(msgs[t][4] as string)},1200)
  }

  const save = async () => {
    if (!desc||!amount) return
    setSaving(true)
    await onAdd({space,date,type,description:desc,amount:Number(amount),payment_method:pm,client:space==='empresa'?client:undefined})
    setSaving(false)
    onClose()
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(5,5,10,.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,backdropFilter:'blur(4px)'}} onClick={onClose}>
      <div style={{background:'#17172a',border:'1px solid #2a2a3e',borderRadius:'14px',padding:'20px',width:'375px',maxWidth:'95vw'}} onClick={e=>e.stopPropagation()}>
        {mode==='menu' ? <>
          <div style={{fontFamily:'sans-serif',fontWeight:700,fontSize:'15px',marginBottom:'14px',color:'#e8e8f0'}}>¿Cómo quieres registrar?</div>
          {[{id:'manual',ic:'✏️',l:'Manual',d:'Llena el formulario'},{id:'audio',ic:'🎙',l:'Audio',d:'Habla en lenguaje natural'},{id:'foto',ic:'📷',l:'Foto de recibo',d:'La IA lee el recibo'},{id:'chat',ic:'💬',l:'Chat IA',d:'Escribe en lenguaje natural'}].map(o=>(
            <div key={o.id} onClick={()=>o.id==='manual'?setMode('form'):doAI(o.id as any)} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 12px',borderRadius:'10px',cursor:'pointer',border:'1px solid #2a2a3e',background:'#12121e',marginBottom:'8px'}}>
              <div style={{width:'34px',height:'34px',borderRadius:'9px',background:'rgba(139,127,240,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>{o.ic}</div>
              <div><div style={{fontSize:'12px',fontWeight:600,color:'#e8e8f0'}}>{o.l}</div><div style={{fontSize:'10px',color:'#6060a0'}}>{o.d}</div></div>
            </div>
          ))}
          <button onClick={onClose} style={{width:'100%',padding:'9px',background:'transparent',border:'1px solid #252535',borderRadius:'9px',color:'#6060a0',fontSize:'12px',cursor:'pointer',marginTop:'4px'}}>Cancelar</button>
        </> : <>
          <div style={{fontFamily:'sans-serif',fontWeight:700,fontSize:'15px',marginBottom:'14px',color:'#e8e8f0'}}>Nueva transacción</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'9px'}}>
            <div>
              <label style={{display:'block',fontSize:'10px',color:'#6060a0',marginBottom:'4px'}}>Tipo</label>
              <select value={type} onChange={e=>setType(e.target.value)} style={{...inp,marginBottom:0,cursor:'pointer'}}><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></select>
            </div>
            <div>
              <label style={{display:'block',fontSize:'10px',color:'#6060a0',marginBottom:'4px'}}>Fecha</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{...inp,marginBottom:0}}/>
            </div>
          </div>
          <label style={{display:'block',fontSize:'10px',color:'#6060a0',marginBottom:'4px'}}>Descripción</label>
          <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Ej: Consultoría..." style={inp}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'9px'}}>
            <div>
              <label style={{display:'block',fontSize:'10px',color:'#6060a0',marginBottom:'4px'}}>Monto</label>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" style={{...inp,marginBottom:0}}/>
            </div>
            <div>
              <label style={{display:'block',fontSize:'10px',color:'#6060a0',marginBottom:'4px'}}>Forma de pago</label>
              <select value={pm} onChange={e=>setPm(e.target.value)} style={{...inp,marginBottom:0,cursor:'pointer'}}>{pms.map((p:any)=><option key={p.id}>{p.name}</option>)}</select>
            </div>
          </div>
          {space==='empresa' && <>
            <label style={{display:'block',fontSize:'10px',color:'#6060a0',marginBottom:'4px'}}>Cliente</label>
            <input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre del cliente..." style={inp}/>
          </>}
          {aiFb && <div style={{background:'#1a1a2e',border:'1px solid #252535',borderRadius:'8px',padding:'10px',marginBottom:'12px',fontSize:'11px',color:'#a89ef5'}}>{aiFb}</div>}
          <div style={{background:'#1a1a2e',border:'1px solid #252535',borderRadius:'8px',padding:'10px',marginBottom:'12px'}}>
            <div style={{fontSize:'10px',color:'#6060a0',marginBottom:'6px'}}>✨ IA activa</div>
            <div style={{display:'flex',gap:'5px'}}>
              {(['audio','foto','chat'] as const).map(t=><button key={t} onClick={()=>doAI(t)} style={{flex:1,padding:'6px',background:'#12121e',border:'1px solid #252535',borderRadius:'7px',fontSize:'11px',cursor:'pointer',color:'#c0c0e0'}}>{t==='audio'?'🎙':t==='foto'?'📷':'💬'} {t.charAt(0).toUpperCase()+t.slice(1)}</button>)}
            </div>
          </div>
          <div style={{display:'flex',gap:'7px',justifyContent:'flex-end'}}>
            <button onClick={onClose} style={{padding:'7px 14px',borderRadius:'9px',fontSize:'12px',cursor:'pointer',border:'1px solid #2a2a3e',background:'#1a1a2e',color:'#c0c0e0'}}>Cancelar</button>
            <button onClick={save} disabled={saving} style={{...btn,opacity:saving?0.6:1}}>{saving?'Guardando...':'Guardar'}</button>
          </div>
        </>}
      </div>
    </div>
  )
}

function MainApp() {
  const {user, signOut} = useAuth()
  const [page, setPage] = useState('dashboard')
  const [space, setSpace] = useState<Space>('personal')
  const [month, setMonth] = useState(new Date().getMonth())
  const [year] = useState(new Date().getFullYear())
  const [txs, setTxs] = useState<any[]>([])
  const [cats, setCats] = useState<any[]>([])
  const [pms, setPms] = useState<any[]>([])
  const [gami, setGami] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { if(user) loadAll() }, [user, space])

  async function loadAll() {
    setLoading(true)
    const [t,c,p,g] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id',user!.id).eq('space',space).order('date',{ascending:false}),
      supabase.from('categories').select('*').eq('user_id',user!.id),
      supabase.from('payment_methods').select('*').eq('user_id',user!.id),
      supabase.from('gamification').select('*').eq('user_id',user!.id).single(),
    ])
    if(t.data) setTxs(t.data)
    if(c.data) setCats(c.data)
    if(p.data) setPms(p.data)
    if(g.data) setGami(g.data)
    setLoading(false)
  }

  async function addTx(tx: any) {
    const {data,error} = await supabase.from('transactions').insert({...tx,user_id:user!.id}).select().single()
    if(!error&&data) {
      setTxs(prev=>[data,...prev])
      const xp=(gami?.xp||0)+10; const lv=Math.floor(xp/500)+1
      await supabase.from('gamification').update({xp,level:lv,streak_days:(gami?.streak_days||0)+1,last_record_date:new Date().toISOString().split('T')[0]}).eq('user_id',user!.id)
      setGami((prev:any)=>prev?{...prev,xp,level:lv}:prev)
    }
  }

  const txMonth = txs.filter(t=>{ const d=new Date(t.date); return d.getMonth()===month&&d.getFullYear()===year })
  const isEmp = space==='empresa'
  const userName = user?.user_metadata?.name||user?.email?.split('@')[0]||'Usuario'

  const navItems = [
    {id:'dashboard',l:'Inicio',d:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'},
    {id:'movimientos',l:'Movimientos',d:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'},
    {id:'reportes',l:'Reportes',d:'M18 20V10M12 20V4M6 20v-6'},
    {id:'ajustes',l:'Ajustes',d:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'},
  ]

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'#0d0d14'}}>
      {/* SIDEBAR */}
      <div style={{width:'200px',flexShrink:0,background:'#0f0f18',borderRight:'1px solid #1e1e2e',display:'flex',flexDirection:'column',height:'100vh'}}>
        <div style={{padding:'16px 14px 12px',borderBottom:'1px solid #1e1e2e'}}>
          <div style={{width:'30px',height:'30px',borderRadius:'8px',background:'linear-gradient(135deg,#8b7ff0,#6a8af0)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'8px',boxShadow:'0 0 14px rgba(139,127,240,.35)'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div style={{fontFamily:'sans-serif',fontWeight:700,fontSize:'15px',color:'#e8e8f0'}}>Clarix</div>
          <div style={{fontSize:'10px',color:'#5555a0',marginTop:'1px'}}>Planeación financiera</div>
        </div>
        <div style={{margin:'8px 10px 4px',background:'#18182a',borderRadius:'8px',padding:'3px',display:'flex',border:'1px solid #2a2a3e'}}>
          {(['personal','empresa'] as Space[]).map(s=>(
            <button key={s} onClick={()=>setSpace(s)} style={{flex:1,padding:'5px 0',textAlign:'center',borderRadius:'5px',fontSize:'10px',fontWeight:600,cursor:'pointer',border:'none',background:space===s?'linear-gradient(135deg,#8b7ff0,#6a8af0)':'transparent',color:space===s?'#fff':'#7070b0'}}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
        <nav style={{flex:1,overflowY:'auto',padding:'6px 8px'}}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>setPage(item.id)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 9px',borderRadius:'9px',cursor:'pointer',fontSize:'12px',fontWeight:500,marginBottom:'2px',border:'none',width:'100%',textAlign:'left',background:page===item.id?'rgba(139,127,240,.2)':'transparent',color:page===item.id?'#b0a8ff':'#8888b8'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={item.d}/></svg>
              {item.l}
            </button>
          ))}
        </nav>
        <div style={{padding:'10px 12px',borderTop:'1px solid #1e1e2e',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:'11px',fontWeight:500,color:'#e8e8f0'}}>{userName}</div>
            <div style={{fontSize:'10px',color:'#5555a0',marginTop:'1px'}}>{user?.email}</div>
          </div>
          <button onClick={signOut} style={{background:'none',border:'none',color:'#6060a0',cursor:'pointer',fontSize:'16px'}}>→</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,overflowY:'auto',background:'#0d0d14'}}>
        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#6060a0'}}>Cargando datos...</div>
        ) : (
          <>
            {page==='dashboard' && <Dashboard txs={txMonth} gami={gami} space={space} month={month} year={year} isEmp={isEmp} userName={userName} onOpen={()=>setShowModal(true)}/>}
            {page==='movimientos' && (
              <div style={{padding:'20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px'}}>
                  <div>
                    <div style={{fontFamily:'sans-serif',fontWeight:700,fontSize:'17px',color:'#e8e8f0'}}>Movimientos</div>
                    <div style={{fontSize:'11px',color:'#5555a0',marginTop:'2px'}}>{MONTHS[month]} {year}</div>
                  </div>
                  <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                    <select value={month} onChange={e=>setMonth(Number(e.target.value))} style={{...inp,width:'auto',marginBottom:0,padding:'6px 10px',cursor:'pointer'}}>
                      {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                    </select>
                    <button style={btn} onClick={()=>setShowModal(true)}>+ Registrar</button>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'9px',marginBottom:'12px'}}>
                  {[
                    {l:'Ingresos',v:txMonth.filter(t=>t.type==='ingreso').reduce((s:number,t:any)=>s+t.amount,0),c:'#a89ef5'},
                    {l:'Egresos',v:txMonth.filter(t=>t.type==='egreso').reduce((s:number,t:any)=>s+t.amount,0),c:'#f87171'},
                    {l:'Balance',v:txMonth.filter(t=>t.type==='ingreso').reduce((s:number,t:any)=>s+t.amount,0)-txMonth.filter(t=>t.type==='egreso').reduce((s:number,t:any)=>s+t.amount,0),c:'#4ade80'},
                  ].map((k,i)=>(
                    <div key={i} style={{...card,padding:'13px 15px'}}>
                      <div style={{fontSize:'10px',color:'#6060a0',textTransform:'uppercase',letterSpacing:'.1em'}}>{k.l}</div>
                      <div style={{fontFamily:'sans-serif',fontWeight:700,fontSize:'1.25rem',marginTop:'5px',color:k.c}}>{fmt(k.v)}</div>
                    </div>
                  ))}
                </div>
                <div style={{...card,overflow:'hidden'}}>
                  <div style={{display:'grid',gridTemplateColumns:'80px 1fr 90px',padding:'8px 13px',borderBottom:'1px solid #252535',fontSize:'10px',color:'#6060a0',textTransform:'uppercase'}}>
                    <span>Fecha</span><span>Descripción</span><span style={{textAlign:'right'}}>Monto</span>
                  </div>
                  {txMonth.length===0 ? <div style={{padding:'24px',textAlign:'center',color:'#6060a0',fontSize:'12px'}}>No hay movimientos este mes</div> :
                    txMonth.map(t=>(
                      <div key={t.id} style={{display:'grid',gridTemplateColumns:'80px 1fr 90px',padding:'9px 13px',borderBottom:'1px solid rgba(37,37,53,.5)',alignItems:'center',fontSize:'12px',color:'#c0c0e0'}}>
                        <span style={{fontSize:'11px',color:'#6060a0'}}>{t.date.slice(5).replace('-','/')}</span>
                        <span>{t.description}</span>
                        <span style={{fontFamily:'sans-serif',fontWeight:700,textAlign:'right',color:t.type==='ingreso'?'#4ade80':'#f87171'}}>{t.type==='ingreso'?'+':'-'}{fmt(t.amount)}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
            {page==='reportes' && (
              <div style={{padding:'20px'}}>
                <div style={{fontFamily:'sans-serif',fontWeight:700,fontSize:'17px',color:'#e8e8f0',marginBottom:'16px'}}>Reportes · {MONTHS[month]}</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'9px',marginBottom:'12px'}}>
                  {[
                    {l:'Ingresos',v:txMonth.filter(t=>t.type==='ingreso').reduce((s:number,t:any)=>s+t.amount,0),c:'#a89ef5'},
                    {l:'Egresos',v:txMonth.filter(t=>t.type==='egreso').reduce((s:number,t:any)=>s+t.amount,0),c:'#f87171'},
                    {l:'Neto',v:txMonth.filter(t=>t.type==='ingreso').reduce((s:number,t:any)=>s+t.amount,0)-txMonth.filter(t=>t.type==='egreso').reduce((s:number,t:any)=>s+t.amount,0),c:'#4ade80'},
                  ].map((k,i)=>(
                    <div key={i} style={{...card,padding:'13px 15px'}}>
                      <div style={{fontSize:'10px',color:'#6060a0',textTransform:'uppercase',letterSpacing:'.1em'}}>{k.l}</div>
                      <div style={{fontFamily:'sans-serif',fontWeight:700,fontSize:'1.25rem',marginTop:'5px',color:k.c}}>{fmt(k.v)}</div>
                    </div>
                  ))}
                </div>
                <div style={{...card,padding:'14px'}}>
                  <div style={{fontSize:'10px',color:'#6060a0',textTransform:'uppercase',marginBottom:'12px'}}>Top movimientos</div>
                  {[...txMonth].sort((a,b)=>b.amount-a.amount).slice(0,8).map(t=>{
                    const maxAmt = Math.max(...txMonth.map((x:any)=>x.amount),1)
                    const pct = Math.round(t.amount/txMonth.filter((x:any)=>x.type===t.type).reduce((s:number,x:any)=>s+x.amount,0)*100)||0
                    return (
                      <div key={t.id} style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                        <span style={{fontSize:'11px',flex:1,color:'#c0c0e0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.description}</span>
                        <div style={{width:'80px',height:'4px',background:'#1a1a2e',borderRadius:'99px',overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${t.amount/maxAmt*100}%`,background:t.type==='ingreso'?'#8b7ff0':'#f87171',borderRadius:'99px'}}/>
                        </div>
                        <span style={{fontSize:'10px',color:'#6060a0',minWidth:'26px',textAlign:'right'}}>{pct}%</span>
                        <span style={{fontFamily:'sans-serif',fontWeight:700,fontSize:'11px',color:t.type==='ingreso'?'#a89ef5':'#f87171',minWidth:'80px',textAlign:'right'}}>{fmt(t.amount)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {page==='ajustes' && (
              <div style={{padding:'20px'}}>
                <div style={{fontFamily:'sans-serif',fontWeight:700,fontSize:'17px',color:'#e8e8f0',marginBottom:'16px'}}>Ajustes</div>
                <div style={{...card,padding:'16px'}}>
                  <div style={{fontSize:'12px',color:'#c0c0e0',marginBottom:'8px'}}>Email: {user?.email}</div>
                  <div style={{fontSize:'12px',color:'#c0c0e0',marginBottom:'8px'}}>Espacio activo: {space}</div>
                  <div style={{fontSize:'12px',color:'#c0c0e0',marginBottom:'16px'}}>Categorías cargadas: {cats.length}</div>
                  <button onClick={signOut} style={{...btn,background:'rgba(248,113,113,.2)',color:'#f87171'}}>Cerrar sesión</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && <Modal pms={pms} space={space} onAdd={addTx} onClose={()=>setShowModal(false)}/>}
    </div>
  )
}

export default function App() {
  const {user, loading} = useAuth()
  const [view, setView] = useState<'login'|'register'>('login')

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0d0d14',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'linear-gradient(135deg,#8b7ff0,#6a8af0)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div style={{color:'#6060a0',fontSize:'13px'}}>Cargando Clarix...</div>
      </div>
    </div>
  )

  if (!user) return view==='register'
    ? <RegisterPage onLogin={()=>setView('login')}/>
    : <LoginPage onReg={()=>setView('register')}/>

  return <MainApp/>
}
