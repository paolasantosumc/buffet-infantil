import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from './db.js';

const app = express();
app.use(cors());
app.use(express.json({limit:'1mb'}));
const secret = () => process.env.JWT_SECRET || 'development-only-change-this-secret';
const asyncRoute = fn => (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const auth = (req,res,next)=>{
  const raw=req.headers.authorization||'';
  try { req.user=jwt.verify(raw.replace(/^Bearer\s+/i,''),secret()); next(); }
  catch { res.status(401).json({error:'Faça login para continuar.'}); }
};
const optionalAuth = (req,res,next)=>{
  const raw=req.headers.authorization||'';
  if(!raw) return next();
  try { req.user=jwt.verify(raw.replace(/^Bearer\\s+/i,''),secret()); } catch {}
  next();
};
const admin = (req,res,next)=>req.user?.role==='admin'?next():res.status(403).json({error:'Acesso restrito ao administrador.'});

app.get('/api/health',(req,res)=>res.json({ok:true,service:'Comida Feliz API'}));
app.get('/api/packages',asyncRoute(async(req,res)=>{
  const {rows}=await getPool().query('SELECT id,name,description,price_per_guest,min_guests,features,highlighted FROM packages WHERE active=true ORDER BY id');
  res.json(rows);
}));
app.post('/api/auth/register',asyncRoute(async(req,res)=>{
  const {name,email,password,phone}=req.body||{};
  if(!name||!email||!password||String(password).length<6) return res.status(400).json({error:'Informe nome, e-mail e senha com pelo menos 6 caracteres.'});
  const hash=await bcrypt.hash(password,12);
  try {
    const {rows}=await getPool().query('INSERT INTO users(name,email,password_hash,phone) VALUES($1,lower($2),$3,$4) RETURNING id,name,email,phone,role',[name,email,hash,phone||null]);
    const user=rows[0];res.status(201).json({user,token:jwt.sign(user,secret(),{expiresIn:'7d'})});
  } catch(e){if(e.code==='23505')return res.status(409).json({error:'Este e-mail já possui cadastro.'});throw e;}
}));
app.post('/api/auth/login',asyncRoute(async(req,res)=>{
  const {email,password}=req.body||{};
  const {rows}=await getPool().query('SELECT id,name,email,phone,role,password_hash FROM users WHERE email=lower($1)',[email||'']);
  if(!rows[0]||!await bcrypt.compare(password||'',rows[0].password_hash))return res.status(401).json({error:'E-mail ou senha inválidos.'});
  const {password_hash,...user}=rows[0];res.json({user,token:jwt.sign(user,secret(),{expiresIn:'7d'})});
}));
app.get('/api/auth/me',auth,(req,res)=>res.json({user:req.user}));
app.post('/api/bookings',optionalAuth,asyncRoute(async(req,res)=>{
  const b=req.body||{};
  const required=['customer_name','email','phone','event_date','event_time','guest_count','package_id','event_address'];
  if(required.some(k=>!b[k]))return res.status(400).json({error:'Preencha todos os campos obrigatórios.'});
  if(Number(b.guest_count)<10||Number(b.guest_count)>1000)return res.status(400).json({error:'A quantidade deve ser entre 10 e 1.000 convidados.'});
  const pool=getPool();
  const pkg=await pool.query('SELECT id,price_per_guest,min_guests FROM packages WHERE id=$1 AND active=true',[b.package_id]);
  if(!pkg.rows[0])return res.status(400).json({error:'Pacote não encontrado.'});
  const estimate=Number(pkg.rows[0].price_per_guest)*Number(b.guest_count);
  const {rows}=await pool.query(`INSERT INTO bookings(user_id,customer_name,email,phone,event_date,event_time,guest_count,package_id,event_address,message,estimated_total)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id,status,estimated_total,created_at`,
    [req.user?.id||null,b.customer_name,b.email,b.phone,b.event_date,b.event_time,b.guest_count,b.package_id,b.event_address,b.message||null,estimate]);
  res.status(201).json(rows[0]);
}));
app.get('/api/bookings/mine',auth,asyncRoute(async(req,res)=>{
  const {rows}=await getPool().query(`SELECT b.*,p.name AS package_name FROM bookings b LEFT JOIN packages p ON p.id=b.package_id WHERE lower(b.email)=lower($1) ORDER BY b.created_at DESC`,[req.user.email]);
  res.json(rows);
}));
app.get('/api/admin/bookings',auth,admin,asyncRoute(async(req,res)=>{
  const {rows}=await getPool().query(`SELECT b.*,p.name AS package_name FROM bookings b LEFT JOIN packages p ON p.id=b.package_id ORDER BY b.created_at DESC`);
  res.json(rows);
}));
app.patch('/api/admin/bookings/:id',auth,admin,asyncRoute(async(req,res)=>{
  const allowed=['pending','contacted','confirmed','cancelled'];
  if(!allowed.includes(req.body.status))return res.status(400).json({error:'Status inválido.'});
  const {rows}=await getPool().query('UPDATE bookings SET status=$1 WHERE id=$2 RETURNING id,status',[req.body.status,req.params.id]);
  if(!rows[0])return res.status(404).json({error:'Pedido não encontrado.'});
  res.json(rows[0]);
}));
app.use((err,req,res,next)=>{
  console.error(err);
  res.status(500).json({error:err.message?.includes('DATABASE_URL')?'Banco de dados não configurado.': 'Erro interno. Verifique a configuração do servidor.'});
});
export default app;
