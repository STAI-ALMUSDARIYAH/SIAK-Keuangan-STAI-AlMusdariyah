/*==========================================
  SIK STAI Al-Musdariyah v6 FULL SYNC
  SPP↔Pemasukan↔Mahasiswa↔User
==========================================*/
const API='https://script.google.com/macros/s/AKfycby0zxNuVMBq-9UCGH-xa9HbT4tgjgAAgNmFpeGN8YpBOhVCjbjJ1z_OfkESbFgfxQ8-JQ/exec';
const TA='2025/2026',BIAYA=2500000;
const S={user:null,income:[],expense:[],spp:[],dosen:[],mahasiswa:[],anggaran:[],users:[],summary:null,monthly:[],dosenProfile:{},mhsProfile:{},mhsSPP:[],biayaSemester:BIAYA,charts:{}};
let clockTimer=null;

// === WAKTU WIB ===
function wib(){return new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Jakarta'}))}
function hari(d){return['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][d.getDay()]}
function bulan(d){return['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][d.getMonth()]}
function pad(n){return String(n).padStart(2,'0')}
function fullDate(){const d=wib();return hari(d)+', '+d.getDate()+' '+bulan(d)+' '+d.getFullYear()}
function fullTime(){const d=wib();return pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds())}
function todayISO(){const d=wib();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function fDate(v){if(!v||v==='-')return'-';try{const d=new Date(v);if(isNaN(d))return v;const ds=['Min','Sen','Sel','Rab','Kam','Jum','Sab'],ms=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];return ds[d.getDay()]+', '+d.getDate()+' '+ms[d.getMonth()]+' '+d.getFullYear()}catch(e){return v}}
function fRp(n){n=parseFloat(n)||0;return'Rp '+n.toLocaleString('id-ID')}
function trunc(s,n){return s&&s.length>n?s.slice(0,n)+'...':s||'-'}
function v(id){const e=document.getElementById(id);return e?e.value:''}

// === CLOCK ===
function startClock(){if(clockTimer)clearInterval(clockTimer);tick();clockTimer=setInterval(tick,1000)}
function tick(){const t=fullTime(),d=fullDate();[['loginClock',t],['loginDate',d],['tbClock',t],['dashClock',t],['dashDate',d]].forEach(([i,v])=>{const e=document.getElementById(i);if(e)e.textContent=v})}

// === INIT ===
document.addEventListener('DOMContentLoaded',()=>{initTheme();initSidebar();startClock();const s=sessionStorage.getItem('stai_user');if(s){S.user=JSON.parse(s);enterApp()}});

// === LOGIN ===
async function handleLogin(e){e.preventDefault();const btn=document.getElementById('loginBtn'),err=document.getElementById('loginError'),u=document.getElementById('loginUser').value.trim(),p=document.getElementById('loginPass').value.trim();
if(!u||!p){err.innerHTML='<i class="fas fa-exclamation-circle"></i> Lengkapi field';return}
btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Memproses...';err.textContent='';
try{const r=await(await fetch(`${API}?action=login&username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`)).json();
if(r.success){S.user=r.user;sessionStorage.setItem('stai_user',JSON.stringify(r.user));toast('Selamat datang '+r.user.nama,'success');enterApp()}
else err.innerHTML='<i class="fas fa-exclamation-circle"></i> '+(r.error||'Gagal')}
catch(er){err.innerHTML='<i class="fas fa-exclamation-circle"></i> Server error'}
finally{btn.disabled=false;btn.innerHTML='<span>Masuk</span><i class="fas fa-arrow-right"></i>'}}
function fillLogin(u,p){document.getElementById('loginUser').value=u;document.getElementById('loginPass').value=p}
function togglePass(){const i=document.getElementById('loginPass'),c=document.getElementById('eyeIcon');i.type=i.type==='password'?'text':'password';c.className=i.type==='password'?'fas fa-eye':'fas fa-eye-slash'}
function doLogout(){if(!confirm('Keluar?'))return;S.user=null;sessionStorage.removeItem('stai_user');document.getElementById('loginScreen').classList.remove('hide');document.getElementById('app').style.display='none'}

// === APP ===
async function enterApp(){document.getElementById('loginScreen').classList.add('hide');document.getElementById('app').style.display='flex';
document.getElementById('sbName').textContent=S.user.nama;document.getElementById('sbRole').textContent=S.user.role;
const ic={admin:'fa-user-shield',dosen:'fa-chalkboard-teacher',mahasiswa:'fa-user-graduate'};
document.getElementById('sbAv').innerHTML=`<i class="fas ${ic[S.user.role]||'fa-user'}"></i>`;
buildNav();showLoad('Memuat data...');await loadData();hideLoad();goTo('dashboard')}

// === API ===
async function apiGet(a,x=''){return(await fetch(`${API}?action=${a}${x}`)).json()}
async function apiWrite(b){const p=new URLSearchParams();p.set('action',b.action);if(b.sheet)p.set('sheet',b.sheet);if(b.id)p.set('id',b.id);if(b.data)p.set('data',JSON.stringify(b.data));const r=await(await fetch(`${API}?${p}`)).json();if(!r.success)throw new Error(r.error||'Gagal');return r}

async function loadData(){const role=S.user.role;try{
if(role==='admin'){const[a,b,c,d,e,f,g,h,i]=await Promise.all([apiGet('getData','&sheet=pemasukan'),apiGet('getData','&sheet=pengeluaran'),apiGet('getData','&sheet=spp'),apiGet('getDosen'),apiGet('getMahasiswa'),apiGet('getAnggaran'),apiGet('getUsers'),apiGet('getSummary'),apiGet('getMonthly')]);
S.income=a.data||[];S.expense=b.data||[];S.spp=c.data||[];S.dosen=d.data||[];S.mahasiswa=e.data||[];S.anggaran=f.data||[];S.users=g.data||[];S.summary=h.summary;S.monthly=i.monthly||[]}
else if(role==='dosen'){const[a,b,c]=await Promise.all([apiGet('getDosenProfile',`&userId=${S.user.id}`),apiGet('getAnggaran'),apiGet('getSummary')]);S.dosenProfile=a.profile||{};S.anggaran=b.data||[];S.summary=c.summary}
else{const[a,b,c]=await Promise.all([apiGet('getMahasiswaProfile',`&userId=${S.user.id}`),apiGet('getMahasiswaSPP',`&userId=${S.user.id}`),apiGet('getSummary')]);S.mhsProfile=a.profile||{};S.mhsSPP=b.data||[];S.biayaSemester=b.biayaPerSemester||BIAYA;S.summary=c.summary}
}catch(e){console.error(e);toast('Gagal memuat: '+e.message,'error')}}

async function doRefresh(){const ic=document.getElementById('refIc');ic.classList.add('fa-spin');showLoad('Sinkronisasi...');await loadData();hideLoad();ic.classList.remove('fa-spin');goTo(document.querySelector('.sb-lk.on')?.dataset.pg||'dashboard');toast('Berhasil!','success')}

// === NAV ===
function buildNav(){const nav=document.getElementById('sbNav'),role=S.user.role;let h='';
if(role==='admin')h=`<div class="sb-sec"><span class="sb-sec-t">UTAMA</span><a class="sb-lk on" data-pg="dashboard"><i class="fas fa-th-large"></i><span>Dashboard</span></a><a class="sb-lk" data-pg="pemasukan"><i class="fas fa-arrow-circle-down"></i><span>Pemasukan</span></a><a class="sb-lk" data-pg="pengeluaran"><i class="fas fa-arrow-circle-up"></i><span>Pengeluaran</span></a><a class="sb-lk" data-pg="spp"><i class="fas fa-graduation-cap"></i><span>SPP</span></a></div><div class="sb-sec"><span class="sb-sec-t">DATA</span><a class="sb-lk" data-pg="dosen"><i class="fas fa-chalkboard-teacher"></i><span>Dosen</span></a><a class="sb-lk" data-pg="mhs"><i class="fas fa-users"></i><span>Mahasiswa</span></a><a class="sb-lk" data-pg="anggaran"><i class="fas fa-coins"></i><span>Anggaran</span></a></div><div class="sb-sec"><span class="sb-sec-t">LAPORAN</span><a class="sb-lk" data-pg="laporan"><i class="fas fa-chart-line"></i><span>Laporan</span></a><a class="sb-lk" data-pg="rekap"><i class="fas fa-file-invoice-dollar"></i><span>Rekap</span></a></div><div class="sb-sec"><span class="sb-sec-t">SISTEM</span><a class="sb-lk" data-pg="users"><i class="fas fa-user-cog"></i><span>Users</span></a></div>`;
else if(role==='dosen')h=`<div class="sb-sec"><span class="sb-sec-t">DOSEN</span><a class="sb-lk on" data-pg="dashboard"><i class="fas fa-th-large"></i><span>Dashboard</span></a><a class="sb-lk" data-pg="profil-dsn"><i class="fas fa-id-card"></i><span>Profil</span></a><a class="sb-lk" data-pg="anggaran"><i class="fas fa-coins"></i><span>Anggaran</span></a></div>`;
else h=`<div class="sb-sec"><span class="sb-sec-t">MAHASISWA</span><a class="sb-lk on" data-pg="dashboard"><i class="fas fa-th-large"></i><span>Dashboard</span></a><a class="sb-lk" data-pg="profil-mhs"><i class="fas fa-id-card"></i><span>Profil</span></a><a class="sb-lk" data-pg="spp-saya"><i class="fas fa-receipt"></i><span>SPP Saya</span></a></div>`;
nav.innerHTML=h;nav.querySelectorAll('.sb-lk').forEach(l=>{l.addEventListener('click',e=>{e.preventDefault();nav.querySelectorAll('.sb-lk').forEach(x=>x.classList.remove('on'));l.classList.add('on');goTo(l.dataset.pg);closeSb()})})}

function goTo(pg){const w=document.getElementById('pgWrap');document.getElementById('tbPage').textContent=pgT(pg);w.innerHTML='';const d=document.createElement('div');d.className='pg on';d.id='p-'+pg;w.appendChild(d);
const r={dashboard:rDash,pemasukan:rInc,pengeluaran:rExp,spp:rSPP,dosen:rDosen,mhs:rMhs,anggaran:rAng,laporan:rLap,rekap:rRekap,users:rUsers,'profil-dsn':rProfDsn,'profil-mhs':rProfMhs,'spp-saya':rSppSaya};(r[pg]||function(){d.innerHTML='<div class="empty-s"><i class="fas fa-tools"></i><p>Dalam pengembangan</p></div>'})()}
function pgT(p){return{dashboard:'Dashboard',pemasukan:'Pemasukan',pengeluaran:'Pengeluaran',spp:'SPP',dosen:'Dosen',mhs:'Mahasiswa',anggaran:'Anggaran',laporan:'Laporan',rekap:'Rekap',users:'Users','profil-dsn':'Profil','profil-mhs':'Profil','spp-saya':'SPP Saya'}[p]||p}

// === DASHBOARD ===
function rDash(){const pg=document.getElementById('p-dashboard'),role=S.user.role,sum=S.summary||{},gr={admin:'Admin',dosen:'Bapak/Ibu',mahasiswa:'Mahasiswa/i'};
let h=`<div class="wel"><div class="wel-info"><h1>Assalamu'alaikum, ${gr[role]}! 👋</h1><p>${S.user.nama} — SIK STAI Al-Musdariyah</p><div class="wel-meta"><span><i class="fas fa-calendar"></i> <span id="dashDate">${fullDate()}</span></span><span><i class="fas fa-clock"></i> <span id="dashClock">${fullTime()}</span> WIB</span><span><i class="fas fa-book"></i> TA ${TA}</span></div></div><img src="assets/logokampus.png" alt="" class="wel-logo" onerror="this.style.display='none'"></div>`;

if(role==='admin'){const ms=sum.mahasiswaStats||{};
h+=`<div class="stats">
<div class="st"><div class="st-ic green"><i class="fas fa-arrow-down"></i></div><div class="st-d"><small>Pemasukan</small><h3>${fRp(sum.totalIncome)}</h3><div class="sub">TA ${TA}</div></div><div class="st-bg"><i class="fas fa-wallet"></i></div></div>
<div class="st"><div class="st-ic red"><i class="fas fa-arrow-up"></i></div><div class="st-d"><small>Pengeluaran</small><h3>${fRp(sum.totalExpense)}</h3><div class="sub">TA ${TA}</div></div><div class="st-bg"><i class="fas fa-money-bill"></i></div></div>
<div class="st"><div class="st-ic blue"><i class="fas fa-scale-balanced"></i></div><div class="st-d"><small>Saldo</small><h3>${fRp(sum.saldo)}</h3><div class="sub">${sum.saldo>=0?'✅ Sehat':'⚠️ Defisit'}</div></div><div class="st-bg"><i class="fas fa-landmark"></i></div></div>
<div class="st"><div class="st-ic purple"><i class="fas fa-users"></i></div><div class="st-d"><small>Mahasiswa</small><h3>${ms.total||0}</h3><div class="sub">PAI:${ms.pai||0} HES:${ms.hes||0}</div></div><div class="st-bg"><i class="fas fa-user-graduate"></i></div></div>
<div class="st"><div class="st-ic teal"><i class="fas fa-chalkboard-teacher"></i></div><div class="st-d"><small>Dosen</small><h3>${sum.dosenStats?.total||0}</h3><div class="sub">PAI:${sum.dosenStats?.pai||0} HES:${sum.dosenStats?.hes||0}</div></div><div class="st-bg"><i class="fas fa-chalkboard"></i></div></div>
<div class="st"><div class="st-ic orange"><i class="fas fa-receipt"></i></div><div class="st-d"><small>SPP Lunas</small><h3>${ms.lunas||0}/${ms.total||0}</h3><div class="sub">Rp 2.5jt/sem</div></div><div class="st-bg"><i class="fas fa-file-invoice-dollar"></i></div></div>
</div>
<div class="ch-row"><div class="ch"><div class="ch-hd"><h3><i class="fas fa-chart-bar"></i> Keuangan ${TA}</h3></div><div class="ch-bd"><canvas id="cM"></canvas></div></div>
<div class="ch"><div class="ch-hd"><h3><i class="fas fa-chart-pie"></i> Distribusi</h3></div><div class="ch-bd"><canvas id="cD"></canvas></div></div></div>
<div class="cd"><div class="cd-hd"><h3><i class="fas fa-clock"></i> Transaksi Terakhir</h3></div><div class="tw"><table class="t"><thead><tr><th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th>Jenis</th><th>Jumlah</th></tr></thead><tbody>${recentRows()}</tbody></table></div></div>`;
pg.innerHTML=h;setTimeout(()=>{makeChart('monthly');makeChart('donut')},100)}

else if(role==='dosen'){const dp=S.dosenProfile||{};
h+=`<div class="stats"><div class="st"><div class="st-ic green"><i class="fas fa-money-bill-wave"></i></div><div class="st-d"><small>Gaji</small><h3>${fRp(dp.Gaji)}</h3></div></div>
<div class="st"><div class="st-ic blue"><i class="fas fa-flask"></i></div><div class="st-d"><small>Penelitian</small><h3>${fRp(dp.Penelitian)}</h3></div></div>
<div class="st"><div class="st-ic teal"><i class="fas fa-hands-helping"></i></div><div class="st-d"><small>PkM</small><h3>${fRp(dp.PkM)}</h3></div></div></div>
<div class="prof"><div class="prof-ban"><div class="prof-av"><i class="fas fa-chalkboard-teacher"></i></div><div class="prof-nm"><h2>${dp.Nama||S.user.nama}</h2><p>${dp.Jabatan||'-'} — ${dp.Prodi||'-'}</p></div></div>
<div class="prof-det"><div class="prof-it"><label>NIDN</label><span>${dp.NIDN||'-'}</span></div><div class="prof-it"><label>Prodi</label><span>${dp.Prodi||'-'}</span></div><div class="prof-it"><label>Status</label><span class="bg bg-g">Aktif</span></div></div></div>`;
pg.innerHTML=h}

else{const mp=S.mhsProfile||{},paid=parseFloat(mp['Total Bayar'])||0,sisa=parseFloat(mp['Sisa Tagihan'])||Math.max(0,BIAYA-paid),pct=Math.min(100,Math.round(paid/BIAYA*100)),sc=mp['Status SPP']==='Lunas'?'lunas':mp['Status SPP']==='Cicilan'?'cicilan':'belum';
h+=`<div class="stats"><div class="st"><div class="st-ic blue"><i class="fas fa-university"></i></div><div class="st-d"><small>Biaya/Sem</small><h3>${fRp(BIAYA)}</h3></div></div>
<div class="st"><div class="st-ic green"><i class="fas fa-check-circle"></i></div><div class="st-d"><small>Dibayar</small><h3>${fRp(paid)}</h3></div></div>
<div class="st"><div class="st-ic ${sisa>0?'red':'green'}"><i class="fas fa-${sisa>0?'exclamation':'check-double'}"></i></div><div class="st-d"><small>Sisa</small><h3>${fRp(sisa)}</h3></div></div></div>
<div class="spp-info"><div class="spp-circ ${sc}"><span class="pct">${pct}%</span><span class="pct-l">Terbayar</span></div>
<div class="spp-det"><h3>${mp.Nama||S.user.nama}</h3><p>NIM: ${mp.NIM||'-'} | ${mp.Prodi||'-'}</p><p>Angkatan ${mp.Angkatan||'-'} | Sem ${mp.Semester||'-'} | TA ${TA}</p>
<span class="bg ${sc==='lunas'?'bg-g':sc==='cicilan'?'bg-y':'bg-r'}">${mp['Status SPP']||'Belum Bayar'}</span></div></div>`;
pg.innerHTML=h}}

function recentRows(){const all=[...S.income.map(i=>({...i,_t:'in'})),...S.expense.map(e=>({...e,_t:'out'}))].sort((a,b)=>new Date(b.Tanggal)-new Date(a.Tanggal)).slice(0,8);
if(!all.length)return'<tr><td colspan="5" class="empty-s"><p>Belum ada</p></td></tr>';
return all.map(tx=>{const i=tx._t==='in';return`<tr><td>${fDate(tx.Tanggal)}</td><td>${trunc(tx.Keterangan,35)}</td><td><span class="bg bg-b">${tx.Kategori}</span></td><td><span class="bg ${i?'bg-g':'bg-r'}"><i class="fas fa-arrow-${i?'down':'up'}"></i>${i?'Masuk':'Keluar'}</span></td><td style="font-weight:700;color:${i?'var(--g)':'var(--r)'}">${i?'+':'-'}${fRp(tx.Jumlah)}</td></tr>`}).join('')}

// === PEMASUKAN ===
function rInc(){const pg=document.getElementById('p-pemasukan');
pg.innerHTML=`<div class="pb"><div><h2><i class="fas fa-arrow-circle-down"></i> Pemasukan</h2><p>TA ${TA} | 
