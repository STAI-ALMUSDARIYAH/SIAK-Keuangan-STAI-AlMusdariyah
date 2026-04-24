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
pg.innerHTML=`<div class="pb"><div><h2><i class="fas fa-arrow-circle-down"></i> Pemasukan</h2><p>TA ${TA} | <em>SPP otomatis masuk saat pembayaran</em></p></div><button class="btn btn-p" onclick="openForm('income')"><i class="fas fa-plus"></i> Tambah Manual</button></div>
<div class="cd"><div class="cd-hd"><h3>Data Pemasukan</h3><span class="cnt-b">${S.income.length}</span></div><div class="tw"><table class="t"><thead><tr><th>No</th><th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th>Jumlah</th><th>Sumber</th><th>Aksi</th></tr></thead>
<tbody>${S.income.length?S.income.map((r,i)=>{const fromSpp=r['Ref SPP']&&r['Ref SPP']!=='-'&&r['Ref SPP']!=='';
return`<tr><td>${i+1}</td><td>${fDate(r.Tanggal)}</td><td>${trunc(r.Keterangan,35)}</td><td><span class="bg bg-b">${r.Kategori}</span></td><td style="font-weight:700;color:var(--g)">+${fRp(r.Jumlah)}</td>
<td>${fromSpp?'<span class="bg bg-t"><i class="fas fa-sync"></i> Auto SPP</span>':'<span class="bg bg-y">Manual</span>'}</td>
<td><div style="display:flex;gap:3px">${fromSpp?'<span style="font-size:.65rem;color:var(--tx3)">Dari SPP</span>':`<button class="btn-ic ed" onclick="openForm('income','${r.ID}')"><i class="fas fa-edit"></i></button><button class="btn-ic dl" onclick="delRec('pemasukan','${r.ID}','deletePemasukan')"><i class="fas fa-trash"></i></button>`}</div></td></tr>`}).join(''):'<tr><td colspan="7" class="empty-s"><i class="fas fa-inbox"></i><p>Belum ada</p></td></tr>'}</tbody></table></div></div>`}

// === PENGELUARAN ===
function rExp(){document.getElementById('p-pengeluaran').innerHTML=`<div class="pb"><div><h2><i class="fas fa-arrow-circle-up"></i> Pengeluaran</h2><p>TA ${TA}</p></div><button class="btn btn-d" onclick="openForm('expense')"><i class="fas fa-plus"></i> Tambah</button></div>
<div class="cd"><div class="cd-hd"><h3>Data Pengeluaran</h3><span class="cnt-b">${S.expense.length}</span></div><div class="tw"><table class="t"><thead><tr><th>No</th><th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th>Jumlah</th><th>Aksi</th></tr></thead>
<tbody>${S.expense.length?S.expense.map((r,i)=>`<tr><td>${i+1}</td><td>${fDate(r.Tanggal)}</td><td>${trunc(r.Keterangan,40)}</td><td><span class="bg bg-p">${r.Kategori}</span></td><td style="font-weight:700;color:var(--r)">-${fRp(r.Jumlah)}</td>
<td><div style="display:flex;gap:3px"><button class="btn-ic ed" onclick="openForm('expense','${r.ID}')"><i class="fas fa-edit"></i></button><button class="btn-ic dl" onclick="delRec('pengeluaran','${r.ID}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join(''):'<tr><td colspan="6" class="empty-s"><p>Belum ada</p></td></tr>'}</tbody></table></div></div>`}

// === SPP (FULL SYNC) ===
function rSPP(){const l=S.spp.filter(s=>s.Status==='Lunas').length,b=S.spp.filter(s=>s.Status==='Belum Bayar').length,c=S.spp.filter(s=>s.Status==='Cicilan').length;
document.getElementById('p-spp').innerHTML=`<div class="pb"><div><h2><i class="fas fa-graduation-cap"></i> Pembayaran SPP</h2><p>Rp 2.500.000/sem | TA ${TA} | <em>Auto sync ke pemasukan & mahasiswa</em></p></div><button class="btn btn-s" onclick="openForm('spp')"><i class="fas fa-plus"></i> Input Pembayaran</button></div>
<div class="spp-g"><div class="spp-c lunas"><i class="fas fa-check-circle"></i><div><small>Lunas</small><h3>${l}</h3></div></div><div class="spp-c belum"><i class="fas fa-times-circle"></i><div><small>Belum</small><h3>${b}</h3></div></div><div class="spp-c cicil"><i class="fas fa-pause-circle"></i><div><small>Cicilan</small><h3>${c}</h3></div></div><div class="spp-c total"><i class="fas fa-users"></i><div><small>Total</small><h3>${S.spp.length}</h3></div></div></div>
<div class="cd"><div class="cd-hd"><h3>Data SPP</h3><span class="cnt-b">${S.spp.length}</span></div><div class="tw"><table class="t"><thead><tr><th>No</th><th>NIM</th><th>Nama</th><th>Prodi</th><th>Sem</th><th>Jumlah</th><th>Status</th><th>Tgl Bayar</th><th>Aksi</th></tr></thead>
<tbody>${S.spp.length?S.spp.map((r,i)=>`<tr><td>${i+1}</td><td><strong>${r.NIM}</strong></td><td>${r.Nama}</td><td>${trunc(r.Prodi,18)}</td><td>${r.Semester}</td><td style="font-weight:700">${fRp(r.Jumlah)}</td>
<td><span class="bg ${r.Status==='Lunas'?'bg-g':r.Status==='Cicilan'?'bg-y':'bg-r'}">${r.Status}</span></td><td>${fDate(r['Tgl Bayar'])}</td>
<td><div style="display:flex;gap:3px"><button class="btn-ic ed" onclick="openForm('spp','${r.ID}')"><i class="fas fa-edit"></i></button><button class="btn-ic dl" onclick="delRec('spp','${r.ID}','deleteSPP')"><i class="fas fa-trash"></i></button></div></td></tr>`).join(''):'<tr><td colspan="9" class="empty-s"><p>Belum ada</p></td></tr>'}</tbody></table></div></div>`}

// === DOSEN ===
function rDosen(){document.getElementById('p-dosen').innerHTML=`<div class="pb"><div><h2><i class="fas fa-chalkboard-teacher"></i> Dosen</h2><p>PAI:${S.dosen.filter(d=>d.Prodi==='PAI').length} HES:${S.dosen.filter(d=>d.Prodi==='HES').length} | Auto sync akun</p></div><button class="btn btn-p" onclick="openForm('dosen')"><i class="fas fa-plus"></i> Tambah</button></div>
<div class="cd"><div class="cd-hd"><h3>Data Dosen</h3><span class="cnt-b">${S.dosen.length}</span></div><div class="tw"><table class="t"><thead><tr><th>No</th><th>NIDN</th><th>Nama</th><th>Prodi</th><th>Jabatan</th><th>Gaji</th><th>Penelitian</th><th>PkM</th><th>Aksi</th></tr></thead>
<tbody>${S.dosen.length?S.dosen.map((r,i)=>`<tr><td>${i+1}</td><td>${r.NIDN}</td><td><strong>${r.Nama}</strong></td><td><span class="bg ${r.Prodi==='PAI'?'bg-b':'bg-t'}">${r.Prodi}</span></td><td>${r.Jabatan}</td><td style="font-weight:600">${fRp(r.Gaji)}</td><td>${fRp(r.Penelitian)}</td><td>${fRp(r.PkM)}</td>
<td><div style="display:flex;gap:3px"><button class="btn-ic ed" onclick="openForm('dosen','${r.ID}')"><i class="fas fa-edit"></i></button><button class="btn-ic dl" onclick="delRec('dosen','${r.ID}','deleteDosen')"><i class="fas fa-trash"></i></button></div></td></tr>`).join(''):'<tr><td colspan="9" class="empty-s"><p>Belum ada</p></td></tr>'}</tbody></table></div></div>`}

// === MAHASISWA ===
function rMhs(){const s=S.summary?.mahasiswaStats||{},pa=s.perAngkatan||[];
document.getElementById('p-mhs').innerHTML=`<div class="pb"><div><h2><i class="fas fa-users"></i> Mahasiswa</h2><p>Total:${s.total||0} | Lunas:${s.lunas||0} Cicilan:${s.cicilan||0} Belum:${s.belum||0} | Auto sync akun+SPP</p></div><button class="btn btn-p" onclick="openForm('mahasiswa')"><i class="fas fa-plus"></i> Tambah</button></div>
<div class="stats"><div class="st"><div class="st-ic blue"><i class="fas fa-book-quran"></i></div><div class="st-d"><small>S1 PAI</small><h3>${s.pai||0}</h3></div></div><div class="st"><div class="st-ic teal"><i class="fas fa-scale-balanced"></i></div><div class="st-d"><small>S1 HES</small><h3>${s.hes||0}</h3></div></div></div>
<div class="cd"><div class="cd-hd"><h3>Per Angkatan</h3></div><div class="tw"><table class="t"><thead><tr><th>Angkatan</th><th>PAI</th><th>HES</th><th>Total</th></tr></thead><tbody>${pa.map(a=>`<tr><td><strong>${a.angkatan}</strong></td><td>${a.pai}</td><td>${a.hes}</td><td><strong>${a.pai+a.hes}</strong></td></tr>`).join('')}</tbody></table></div></div>
<div class="cd"><div class="cd-hd"><h3>Daftar Mahasiswa</h3><span class="cnt-b">${S.mahasiswa.length}</span></div><div class="tw"><table class="t"><thead><tr><th>No</th><th>NIM</th><th>Nama</th><th>Prodi</th><th>Angk</th><th>Sem</th><th>Status SPP</th><th>Bayar</th><th>Sisa</th><th>Login</th><th>Aksi</th></tr></thead>
<tbody>${S.mahasiswa.length?S.mahasiswa.slice(0,100).map((r,i)=>{const bc=r['Status SPP']==='Lunas'?'bg-g':r['Status SPP']==='Cicilan'?'bg-y':'bg-r';
return`<tr><td>${i+1}</td><td><strong>${r.NIM}</strong></td><td>${r.Nama}</td><td>${trunc(r.Prodi,15)}</td><td>${r.Angkatan}</td><td>${r.Semester}</td>
<td><span class="bg ${bc}">${r['Status SPP']}</span></td><td style="color:var(--g);font-weight:600">${fRp(r['Total Bayar'])}</td><td style="color:var(--r)">${fRp(r['Sisa Tagihan'])}</td>
<td><span class="bg bg-b" style="font-size:.6rem">${String(r.NIM).toLowerCase()}</span></td>
<td><div style="display:flex;gap:3px"><button class="btn-ic ed" onclick="openForm('mahasiswa','${r.ID}')"><i class="fas fa-edit"></i></button><button class="btn-ic dl" onclick="delRec('mahasiswa','${r.ID}','deleteMahasiswa')"><i class="fas fa-trash"></i></button></div></td></tr>`}).join(''):'<tr><td colspan="11" class="empty-s"><p>Belum ada</p></td></tr>'}</tbody></table></div></div>`}

// === ANGGARAN ===
function rAng(){const cats={};S.anggaran.forEach(a=>{if(!cats[a.Kategori])cats[a.Kategori]=[];cats[a.Kategori].push(a)});let ch='';for(const[c,items]of Object.entries(cats)){const tot=items.reduce((s,i)=>s+(parseFloat(i.Nominal)||0),0);ch+=`<div class="ang"><div class="ang-hd"><h4>${c}</h4><span class="ang-tot">${fRp(tot)}</span></div><div class="ang-items">${items.map(i=>`<div class="ang-it"><span>${i.Item||i.SubKategori}</span><span>${fRp(i.Nominal)}</span></div>`).join('')}</div></div>`}
document.getElementById('p-anggaran').innerHTML=`<div class="pb"><div><h2><i class="fas fa-coins"></i> Anggaran</h2><p>TA ${TA}</p></div><div class="btn btn-o"><i class="fas fa-calculator"></i> ${fRp(S.anggaran.reduce((s,a)=>s+(parseFloat(a.Nominal)||0),0))}</div></div><div class="ang-g">${ch}</div>`}

// === LAPORAN ===
function rLap(){const s=S.summary||{};document.getElementById('p-laporan').innerHTML=`<div class="pb"><div><h2><i class="fas fa-chart-line"></i> Laporan</h2><p>TA ${TA}</p></div></div>
<div class="rpt-g"><div class="rpt"><small><i class="fas fa-arrow-down"></i> Pemasukan</small><h2 class="txt-g">${fRp(s.totalIncome)}</h2></div><div class="rpt"><small><i class="fas fa-arrow-up"></i> Pengeluaran</small><h2 class="txt-r">${fRp(s.totalExpense)}</h2></div><div class="rpt"><small><i class="fas fa-balance-scale"></i> Saldo</small><h2 class="txt-b">${fRp(s.saldo)}</h2></div></div>
<div class="ch"><div class="ch-hd"><h3><i class="fas fa-chart-area"></i> Tren</h3></div><div class="ch-bd" style="min-height:320px"><canvas id="cR"></canvas></div></div>`;setTimeout(()=>makeChart('report'),100)}

// === REKAP ===
function rRekap(){const ms=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
document.getElementById('p-rekap').innerHTML=`<div class="pb"><div><h2><i class="fas fa-file-invoice-dollar"></i> Rekap</h2><p>TA ${TA}</p></div></div>
<div class="cd"><div class="tw"><table class="t"><thead><tr><th>Bulan</th><th>Pemasukan</th><th>Pengeluaran</th><th>Saldo</th><th>Status</th></tr></thead>
<tbody>${ms.map((m,i)=>{const md=S.monthly[i]||{income:0,expense:0};const s=md.income-md.expense;return`<tr><td><strong>${m}</strong></td><td style="color:var(--g);font-weight:600">${fRp(md.income)}</td><td style="color:var(--r);font-weight:600">${fRp(md.expense)}</td><td style="font-weight:700;color:${s>=0?'var(--g)':'var(--r)'}">${fRp(s)}</td><td><span class="bg ${s>=0?'bg-g':'bg-r'}">${s>=0?'Surplus':'Defisit'}</span></td></tr>`}).join('')}</tbody></table></div></div>`}

// === USERS ===
function rUsers(){document.getElementById('p-users').innerHTML=`<div class="pb"><div><h2><i class="fas fa-user-cog"></i> Users</h2><p>Auto-sync dari Mahasiswa & Dosen</p></div><button class="btn btn-p" onclick="openForm('user')"><i class="fas fa-plus"></i> Tambah</button></div>
<div class="cd"><div class="cd-hd"><h3>Daftar User</h3><span class="cnt-b">${S.users.length}</span></div><div class="tw"><table class="t"><thead><tr><th>No</th><th>Username</th><th>Nama</th><th>Role</th><th>NIM/NIDN</th><th>Status</th><th>Aksi</th></tr></thead>
<tbody>${S.users.map((u,i)=>`<tr><td>${i+1}</td><td><strong>${u.Username}</strong></td><td>${u.Nama}</td><td><span class="bg ${u.Role==='admin'?'bg-r':u.Role==='dosen'?'bg-b':'bg-g'}">${u.Role}</span></td><td>${u['NIM/NIDN']||'-'}</td><td><span class="bg ${u.Status==='Aktif'?'bg-g':'bg-r'}">${u.Status}</span></td>
<td><div style="display:flex;gap:3px"><button class="btn-ic ed" onclick="openForm('user','${u.ID}')"><i class="fas fa-edit"></i></button><button class="btn-ic dl" onclick="delRec('users','${u.ID}','deleteUser')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('')}</tbody></table></div></div>`}

// === PROFILES ===
function rProfDsn(){const dp=S.dosenProfile||{};document.getElementById('p-profil-dsn').innerHTML=`<div class="prof"><div class="prof-ban"><div class="prof-av"><i class="fas fa-chalkboard-teacher"></i></div><div class="prof-nm"><h2>${dp.Nama||S.user.nama}</h2><p>${dp.Jabatan||'-'} — ${dp.Prodi||'-'} | TA ${TA}</p></div></div><div class="prof-det"><div class="prof-it"><label>NIDN</label><span>${dp.NIDN||'-'}</span></div><div class="prof-it"><label>Prodi</label><span>${dp.Prodi||'-'}</span></div><div class="prof-it"><label>Jabatan</label><span>${dp.Jabatan||'-'}</span></div><div class="prof-it"><label>Gaji</label><span style="color:var(--g);font-weight:700">${fRp(dp.Gaji)}</span></div><div class="prof-it"><label>Penelitian</label><span style="color:var(--b);font-weight:700">${fRp(dp.Penelitian)}</span></div><div class="prof-it"><label>PkM</label><span style="color:var(--t);font-weight:700">${fRp(dp.PkM)}</span></div></div></div>`}

function rProfMhs(){const mp=S.mhsProfile||{};document.getElementById('p-profil-mhs').innerHTML=`<div class="prof"><div class="prof-ban" style="background:linear-gradient(135deg,var(--pp),var(--b),var(--t))"><div class="prof-av"><i class="fas fa-user-graduate"></i></div><div class="prof-nm"><h2>${mp.Nama||S.user.nama}</h2><p>${mp.Prodi||'-'} | TA ${TA}</p></div></div><div class="prof-det"><div class="prof-it"><label>NIM</label><span>${mp.NIM||'-'}</span></div><div class="prof-it"><label>Prodi</label><span>${mp.Prodi||'-'}</span></div><div class="prof-it"><label>Angkatan</label><span>${mp.Angkatan||'-'}</span></div><div class="prof-it"><label>Semester</label><span>${mp.Semester||'-'}</span></div><div class="prof-it"><label>Status SPP</label><span class="bg ${mp['Status SPP']==='Lunas'?'bg-g':'bg-r'}">${mp['Status SPP']||'-'}</span></div><div class="prof-it"><label>Total Bayar</label><span style="color:var(--g);font-weight:700">${fRp(mp['Total Bayar'])}</span></div><div class="prof-it"><label>Sisa</label><span style="color:var(--r);font-weight:700">${fRp(mp['Sisa Tagihan'])}</span></div></div></div>`}

function rSppSaya(){const paid=S.mhsSPP.reduce((s,r)=>s+(parseFloat(r.Jumlah)||0),0);const sisa=Math.max(0,BIAYA-paid);
document.getElementById('p-spp-saya').innerHTML=`<div class="pb"><div><h2><i class="fas fa-receipt"></i> SPP Saya</h2><p>Rp 2.500.000/sem | TA ${TA}</p></div></div>
<div class="stats"><div class="st"><div class="st-ic blue"><i class="fas fa-money-bill"></i></div><div class="st-d"><small>Biaya</small><h3>${fRp(BIAYA)}</h3></div></div>
<div class="st"><div class="st-ic green"><i class="fas fa-check"></i></div><div class="st-d"><small>Dibayar</small><h3>${fRp(paid)}</h3></div></div>
<div class="st"><div class="st-ic ${sisa>0?'red':'green'}"><i class="fas fa-${sisa>0?'exclamation':'check-double'}"></i></div><div class="st-d"><small>Sisa</small><h3>${fRp(sisa)}</h3></div></div></div>
<div class="cd"><div class="cd-hd"><h3><i class="fas fa-history"></i> Riwayat Pembayaran</h3></div><div class="tw"><table class="t"><thead><tr><th>No</th><th>Tanggal</th><th>Semester</th><th>Jumlah</th><th>Status</th></tr></thead>
<tbody>${S.mhsSPP.length?S.mhsSPP.map((r,i)=>`<tr><td>${i+1}</td><td>${fDate(r['Tgl Bayar'])}</td><td>Sem ${r.Semester}</td><td style="font-weight:700">${fRp(r.Jumlah)}</td><td><span class="bg ${r.Status==='Lunas'?'bg-g':r.Status==='Cicilan'?'bg-y':'bg-r'}">${r.Status}</span></td></tr>`).join(''):'<tr><td colspan="5" class="empty-s"><p>Belum ada riwayat</p></td></tr>'}</tbody></table></div></div>`}

// === FORMS ===
function openForm(type,eid){const t=document.getElementById('mTitle'),b=document.getElementById('mBody');let item=null;
if(type==='income'){if(eid)item=S.income.find(r=>r.ID===eid);t.textContent=eid?'✏️ Edit Pemasukan':'💰 Tambah Pemasukan';b.innerHTML=txForm('income',item)}
else if(type==='expense'){if(eid)item=S.expense.find(r=>r.ID===eid);t.textContent=eid?'✏️ Edit Pengeluaran':'💸 Tambah Pengeluaran';b.innerHTML=txForm('expense',item)}
else if(type==='spp'){if(eid)item=S.spp.find(r=>r.ID===eid);t.textContent=eid?'✏️ Edit SPP':'🎓 Bayar SPP';b.innerHTML=sppForm(item)}
else if(type==='dosen'){if(eid)item=S.dosen.find(r=>r.ID===eid);t.textContent=eid?'✏️ Edit Dosen':'👨‍🏫 Tambah Dosen';b.innerHTML=dsnForm(item)}
else if(type==='mahasiswa'){if(eid)item=S.mahasiswa.find(r=>r.ID===eid);t.textContent=eid?'✏️ Edit Mahasiswa':'👨‍🎓 Tambah Mahasiswa';b.innerHTML=mhsForm(item)}
else if(type==='user'){if(eid)item=S.users.find(r=>r.ID===eid);t.textContent=eid?'✏️ Edit User':'👤 Tambah User';b.innerHTML=usrForm(item)}
document.getElementById('mBg').classList.add('open')}
function closeModal(){document.getElementById('mBg').classList.remove('open')}
document.getElementById('mBg').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal()});

function txForm(type,d){const cats=type==='income'?['SPP','Pendaftaran','Donasi','Hibah','Lainnya']:['Gaji','Operasional','Infrastruktur','ATK','Kegiatan','Lainnya'];
return`<form onsubmit="saveTx(event,'${type}','${d?.ID||''}')"><div class="f-row"><div class="fg"><label>Tanggal</label><input type="date" class="inp" id="fD" value="${d?.Tanggal||todayISO()}" required></div><div class="fg"><label>Kategori</label><select class="inp" id="fC" required><option value="">Pilih</option>${cats.map(c=>`<option ${d?.Kategori===c?'selected':''}>${c}</option>`).join('')}</select></div></div>
<div class="fg"><label>Keterangan</label><input type="text" class="inp" id="fK" value="${d?.Keterangan||''}" required></div><div class="fg"><label>Jumlah (Rp)</label><input type="number" class="inp" id="fJ" value="${d?.Jumlah||''}" min="1" required></div><div class="fg"><label>Catatan</label><textarea class="inp" id="fN">${d?.Catatan||''}</textarea></div>
<div class="m-ft"><button type="button" class="btn btn-o" onclick="closeModal()">Batal</button><button type="submit" class="btn ${type==='income'?'btn-p':'btn-d'}"><i class="fas fa-save"></i> ${d?'Update':'Simpan'}</button></div></form>`}

function sppForm(d){return`<form onsubmit="saveSpp(event,'${d?.ID||''}')">
<div style="background:rgba(39,174,96,.08);border:1px solid rgba(39,174,96,.2);border-radius:var(--rs);padding:.6rem .8rem;margin-bottom:.7rem;font-size:.7rem;color:var(--g)"><i class="fas fa-sync"></i> <strong>Auto-Sync:</strong> SPP → Pemasukan + Mahasiswa otomatis terupdate</div>
<div class="fg"><label>NIM *</label><div style="display:flex;gap:4px"><input type="text" class="inp" id="fNIM" value="${d?.NIM||''}" placeholder="Ketik NIM" required style="flex:1"><button type="button" class="btn btn-o" onclick="cariMhs()"><i class="fas fa-search"></i></button></div></div>
<div id="mhsInfo" style="background:var(--bg);border:1px solid var(--brd);border-radius:var(--rs);padding:.6rem;margin-bottom:.7rem;font-size:.72rem;display:${d?'block':'none'}">${d?'<strong>'+d.Nama+'</strong>':'Cari NIM dulu'}</div>
<div class="f-row"><div class="fg"><label>Nama</label><input type="text" class="inp" id="fNm" value="${d?.Nama||''}" readonly></div><div class="fg"><label>Prodi</label><input type="text" class="inp" id="fPr" value="${d?.Prodi||''}" readonly></div></div>
<div class="f-row"><div class="fg"><label>Angkatan</label><input type="text" class="inp" id="fAng" value="${d?.Angkatan||''}" readonly></div><div class="fg"><label>Semester *</label><select class="inp" id="fSem" required>${[1,2,3,4,5,6,7,8].map(s=>`<option ${parseInt(d?.Semester)===s?'selected':''}>${s}</option>`).join('')}</select></div></div>
<div class="f-row"><div class="fg"><label>Jumlah (Rp) *</label><input type="number" class="inp" id="fJ" value="${d?.Jumlah||BIAYA}" min="1" required></div><div class="fg"><label>Status *</label><select class="inp" id="fSt" required>${['Lunas','Cicilan','Belum Bayar'].map(s=>`<option ${d?.Status===s?'selected':''}>${s}</option>`).join('')}</select></div></div>
<div class="fg"><label>Tgl Bayar</label><input type="date" class="inp" id="fTB" value="${d?.['Tgl Bayar']||todayISO()}"></div>
<div class="m-ft"><button type="button" class="btn btn-o" onclick="closeModal()">Batal</button><button type="submit" class="btn btn-s"><i class="fas fa-save"></i> ${d?'Update':'Bayar & Simpan'}</button></div></form>`}

function dsnForm(d){return`<form onsubmit="saveDsn(event,'${d?.ID||''}')">
<div style="background:rgba(52,152,219,.08);border:1px solid rgba(52,152,219,.2);border-radius:var(--rs);padding:.6rem;margin-bottom:.7rem;font-size:.7rem;color:var(--b)"><i class="fas fa-sync"></i> Akun login otomatis dibuat (NIDN/nidn)</div>
<div class="f-row"><div class="fg"><label>NIDN *</label><input type="text" class="inp" id="fNIDN" value="${d?.NIDN||''}" required></div><div class="fg"><label>Prodi *</label><select class="inp" id="fPr" required><option value="PAI" ${d?.Prodi==='PAI'?'selected':''}>PAI</option><option value="HES" ${d?.Prodi==='HES'?'selected':''}>HES</option></select></div></div>
<div class="fg"><label>Nama *</label><input type="text" class="inp" id="fNm" value="${d?.Nama||''}" required></div><div class="fg"><label>Jabatan</label><input type="text" class="inp" id="fJb" value="${d?.Jabatan||'Dosen Tetap'}"></div>
<div class="f-row"><div class="fg"><label>Gaji</label><input type="number" class="inp" id="fGj" value="${d?.Gaji||0}" min="0"></div><div class="fg"><label>Penelitian</label><input type="number" class="inp" id="fPn" value="${d?.Penelitian||0}" min="0"></div></div>
<div class="fg"><label>PkM</label><input type="number" class="inp" id="fPk" value="${d?.PkM||0}" min="0"></div>
<div class="m-ft"><button type="button" class="btn btn-o" onclick="closeModal()">Batal</button><button type="submit" class="btn btn-p"><i class="fas fa-save"></i> ${d?'Update':'Simpan'}</button></div></form>`}

function mhsForm(d){return`<form onsubmit="saveMhs(event,'${d?.ID||''}')">
<div style="background:rgba(52,152,219,.08);border:1px solid rgba(52,152,219,.2);border-radius:var(--rs);padding:.6rem;margin-bottom:.7rem;font-size:.7rem;color:var(--b)"><i class="fas fa-sync"></i> ${d?'User otomatis terupdate':'Akun login otomatis dibuat (NIM/nim)'}</div>
<div class="f-row"><div class="fg"><label>NIM *</label><input type="text" class="inp" id="fNIM" value="${d?.NIM||''}" required></div><div class="fg"><label>Angkatan *</label><select class="inp" id="fAng" required>${[2022,2023,2024,2025].map(y=>`<option ${parseInt(d?.Angkatan)===y?'selected':''}>${y}</option>`).join('')}</select></div></div>
<div class="fg"><label>Nama *</label><input type="text" class="inp" id="fNm" value="${d?.Nama||''}" required></div>
<div class="fg"><label>Prodi *</label><select class="inp" id="fPr" required><option value="">Pilih</option>${['S1 Pendidikan Agama Islam','S1 Hukum Ekonomi Syariah (Muamalah)'].map(p=>`<option ${d?.Prodi===p?'selected':''}>${p}</option>`).join('')}</select></div>
<div class="fg"><label>Semester</label><select class="inp" id="fSem">${[1,2,3,4,5,6,7,8].map(s=>`<option ${parseInt(d?.Semester)===s?'selected':''}>${s}</option>`).join('')}</select></div>
<div class="m-ft"><button type="button" class="btn btn-o" onclick="closeModal()">Batal</button><button type="submit" class="btn btn-p"><i class="fas fa-save"></i> ${d?'Update':'Simpan & Buat Akun'}</button></div></form>`}

function usrForm(d){return`<form onsubmit="saveUsr(event,'${d?.ID||''}')">
<div class="f-row"><div class="fg"><label>Username *</label><input type="text" class="inp" id="fUs" value="${d?.Username||''}" required></div><div class="fg"><label>Password ${d?'(kosongkan=tetap)':' *'}</label><input type="text" class="inp" id="fPw" ${d?'':'required'}></div></div>
<div class="fg"><label>Nama *</label><input type="text" class="inp" id="fNm" value="${d?.Nama||''}" required></div>
<div class="f-row"><div class="fg"><label>Role</label><select class="inp" id="fRl">${['admin','dosen','mahasiswa'].map(r=>`<option ${d?.Role===r?'selected':''}>${r}</option>`).join('')}</select></div><div class="fg"><label>NIM/NIDN</label><input type="text" class="inp" id="fNN" value="${d?.['NIM/NIDN']||''}"></div></div>
<div class="f-row"><div class="fg"><label>Prodi</label><input type="text" class="inp" id="fPr" value="${d?.Prodi||''}"></div><div class="fg"><label>Status</label><select class="inp" id="fSt"><option ${d?.Status==='Aktif'?'selected':''}>Aktif</option><option ${d?.Status==='Nonaktif'?'selected':''}>Nonaktif</option></select></div></div>
<div class="m-ft"><button type="button" class="btn btn-o" onclick="closeModal()">Batal</button><button type="submit" class="btn btn-p"><i class="fas fa-save"></i> ${d?'Update':'Simpan'}</button></div></form>`}

// === CARI MAHASISWA (untuk SPP) ===
async function cariMhs(){const nim=v('fNIM');if(!nim){toast('Ketik NIM','warning');return}
try{const r=await apiGet('getMahasiswaByNIM','&nim='+encodeURIComponent(nim));
if(r.success&&r.data){const m=r.data;document.getElementById('fNm').value=m.Nama||'';document.getElementById('fPr').value=m.Prodi||'';document.getElementById('fAng').value=m.Angkatan||'';if(m.Semester)document.getElementById('fSem').value=m.Semester;
document.getElementById('mhsInfo').style.display='block';
document.getElementById('mhsInfo').innerHTML=`<i class="fas fa-check-circle" style="color:var(--g)"></i> <strong>${m.Nama}</strong> — ${m.Prodi}<br>SPP: <strong>${m['Status SPP']||'-'}</strong> | Bayar: <strong>${fRp(m['Total Bayar'])}</strong> | Sisa: <strong style="color:var(--r)">${fRp(m['Sisa Tagihan'])}</strong>`;
toast('Ditemukan!','success')}
else{document.getElementById('mhsInfo').style.display='block';document.getElementById('mhsInfo').innerHTML='<i class="fas fa-times-circle" style="color:var(--r)"></i> NIM tidak ditemukan';toast('Tidak ditemukan','error')}}catch(e){toast('Error: '+e.message,'error')}}

// === SAVE HANDLERS ===
async function saveTx(e,type,eid){e.preventDefault();const sheet=type==='income'?'pemasukan':'pengeluaran';const data={date:v('fD'),description:v('fK'),category:v('fC'),amount:parseFloat(v('fJ')),notes:v('fN')};
try{showLoad('Menyimpan...');if(eid)await apiWrite({action:'updateData',sheet,id:eid,data});else await apiWrite({action:'addData',sheet,data});closeModal();await loadData();goTo(type==='income'?'pemasukan':'pengeluaran');toast('Berhasil!','success')}catch(er){toast('Gagal: '+er.message,'error')}finally{hideLoad()}}

async function saveSpp(e,eid){e.preventDefault();const data={nim:v('fNIM'),name:v('fNm'),prodi:v('fPr'),angkatan:v('fAng'),semester:v('fSem'),amount:parseFloat(v('fJ')),status:v('fSt'),payDate:v('fTB')};
try{showLoad('Menyimpan & sinkronisasi...');if(eid)await apiWrite({action:'updateSPP',id:eid,data});else await apiWrite({action:'addSPP',data});closeModal();await loadData();goTo('spp');toast('SPP tersimpan! Pemasukan & mahasiswa otomatis terupdate 🎉','success')}catch(er){toast('Gagal: '+er.message,'error')}finally{hideLoad()}}

async function saveDsn(e,eid){e.preventDefault();const data={nidn:v('fNIDN'),nama:v('fNm'),prodi:v('fPr'),jabatan:v('fJb'),gaji:parseFloat(v('fGj')),penelitian:parseFloat(v('fPn')||0),pkm:parseFloat(v('fPk')||0)};
try{showLoad('Menyimpan...');if(eid)await apiWrite({action:'updateDosen',id:eid,data});else await apiWrite({action:'addDosen',data});closeModal();await loadData();goTo('dosen');toast('Dosen & akun berhasil!','success')}catch(er){toast('Gagal: '+er.message,'error')}finally{hideLoad()}}

async function saveMhs(e,eid){e.preventDefault();const data={nim:v('fNIM'),nama:v('fNm'),prodi:v('fPr'),angkatan:v('fAng'),semester:v('fSem'),status:'Aktif'};
try{showLoad('Menyimpan...');let r;if(eid)r=await apiWrite({action:'updateMahasiswa',id:eid,data});else r=await apiWrite({action:'addMahasiswa',data});closeModal();await loadData();goTo('mhs');
if(!eid&&r.loginInfo)toast(`Mahasiswa ditambahkan! Login: ${r.loginInfo.username}/${r.loginInfo.password}`,'success');else toast('Berhasil!','success')}catch(er){toast('Gagal: '+er.message,'error')}finally{hideLoad()}}

async function saveUsr(e,eid){e.preventDefault();const data={username:v('fUs'),nama:v('fNm'),role:v('fRl'),nimNidn:v('fNN'),prodi:v('fPr'),status:v('fSt')};const pw=v('fPw');if(pw)data.password=pw;if(!eid&&!pw){toast('Password wajib!','error');return}
try{showLoad('Menyimpan...');if(eid)await apiWrite({action:'updateUser',id:eid,data});else await apiWrite({action:'addUser',data});closeModal();await loadData();goTo('users');toast('Berhasil!','success')}catch(er){toast('Gagal: '+er.message,'error')}finally{hideLoad()}}

async function delRec(sheet,id,action){if(!confirm('Hapus? Data terkait ikut terhapus/terupdate.'))return;
try{showLoad('Menghapus & sinkron...');await apiWrite({action:action||'deleteData',sheet,id});await loadData();goTo(document.querySelector('.sb-lk.on')?.dataset.pg||'dashboard');toast('Dihapus & tersinkron!','warning')}catch(er){toast('Gagal: '+er.message,'error')}finally{hideLoad()}}

// === CHARTS ===
function makeChart(type){const dk=document.documentElement.getAttribute('data-theme')==='dark';const gc=dk?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)';const tc=dk?'#8b949e':'#5a6a7b';const cc=dk?'#1c2333':'#fff';const ms=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
if(type==='monthly'){const ctx=document.getElementById('cM');if(!ctx)return;if(S.charts.m)S.charts.m.destroy();S.charts.m=new Chart(ctx,{type:'bar',data:{labels:ms,datasets:[{label:'Masuk',data:S.monthly.map(m=>m.income),backgroundColor:'rgba(39,174,96,.75)',borderColor:'#27ae60',borderWidth:2,borderRadius:6,borderSkipped:false},{label:'Keluar',data:S.monthly.map(m=>m.expense),backgroundColor:'rgba(231,76,60,.75)',borderColor:'#e74c3c',borderWidth:2,borderRadius:6,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fRp(c.raw)}`}}},scales:{x:{grid:{display:false},ticks:{color:tc,font:{family:'Poppins',size:10}}},y:{grid:{color:gc},ticks:{color:tc,font:{family:'Poppins',size:10},callback:v=>'Rp '+(v/1e6).toFixed(0)+'jt'}}}}})}
else if(type==='donut'){const ctx=document.getElementById('cD');if(!ctx)return;if(S.charts.d)S.charts.d.destroy();const cats=['Gaji','Operasional','Infrastruktur','ATK','Kegiatan','SPP','Lainnya'];const cols=['#e74c3c','#3498db','#f39c12','#9b59b6','#1abc9c','#27ae60','#95a5a6'];
// Untuk donut pemasukan by kategori
const data=cats.map(c=>S.income.filter(e=>e.Kategori===c).reduce((s,e)=>s+(parseFloat(e.Jumlah)||0),0));
S.charts.d=new Chart(ctx,{type:'doughnut',data:{labels:cats,datasets:[{data,backgroundColor:cols,borderWidth:3,borderColor:cc,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom',labels:{usePointStyle:true,padding:10,color:tc,font:{family:'Poppins',size:9}}},tooltip:{callbacks:{label:c=>`${c.label}: ${fRp(c.raw)}`}}}}})}
else if(type==='report'){const ctx=document.getElementById('cR');if(!ctx)return;if(S.charts.r)S.charts.r.destroy();S.charts.r=new Chart(ctx,{type:'line',data:{labels:ms,datasets:[{label:'Masuk',data:S.monthly.map(m=>m.income),borderColor:'#27ae60',backgroundColor:'rgba(39,174,96,.08)',fill:true,tension:.4,pointRadius:4,borderWidth:3},{label:'Keluar',data:S.monthly.map(m=>m.expense),borderColor:'#e74c3c',backgroundColor:'rgba(231,76,60,.08)',fill:true,tension:.4,pointRadius:4,borderWidth:3},{label:'Saldo',data:S.monthly.map(m=>m.income-m.expense),borderColor:'#3498db',fill:false,tension:.4,pointRadius:4,borderWidth:3,borderDash:[6,3]}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{usePointStyle:true,color:tc,font:{family:'Poppins',size:10}}},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fRp(c.raw)}`}}},scales:{x:{grid:{display:false},ticks:{color:tc}},y:{grid:{color:gc},ticks:{color:tc,callback:v=>'Rp '+(v/1e6).toFixed(0)+'jt'}}}}})}}

// === SIDEBAR & THEME ===
function initSidebar(){document.getElementById('tbHam').addEventListener('click',()=>{document.getElementById('sb').classList.add('open');document.getElementById('sbOv').classList.add('on')});const c=()=>{document.getElementById('sb').classList.remove('open');document.getElementById('sbOv').classList.remove('on')};document.getElementById('sbOv').addEventListener('click',c);document.getElementById('sbX').addEventListener('click',c)}
function closeSb(){document.getElementById('sb').classList.remove('open');document.getElementById('sbOv').classList.remove('on')}
function initTheme(){const s=localStorage.getItem('stai_theme')||'light';setTh(s);document.getElementById('thBtn').addEventListener('click',()=>{setTh(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark')})}
function setTh(t){document.documentElement.setAttribute('data-theme',t);localStorage.setItem('stai_theme',t);document.getElementById('thIc').className=t==='dark'?'fas fa-sun':'fas fa-moon';setTimeout(()=>Object.keys(S.charts).forEach(k=>{try{makeChart(k==='m'?'monthly':k==='d'?'donut':'report')}catch(e){}}),100)}

// === UI ===
function showLoad(t){document.getElementById('loadText').textContent=t||'Memuat...';document.getElementById('loadOverlay').classList.add('on')}
function hideLoad(){document.getElementById('loadOverlay').classList.remove('on')}
function toast(msg,type='success'){const ic={success:'fa-check-circle',error:'fa-times-circle',warning:'fa-exclamation-triangle',info:'fa-info-circle'};const b=document.getElementById('toastBox');const t=document.createElement('div');t.className=`toast ${type}`;t.innerHTML=`<i class="toast-i fas ${ic[type]||ic.info}"></i><span class="toast-m">${msg}</span>`;b.appendChild(t);setTimeout(()=>{t.style.cssText='opacity:0;transform:translateX(40px);transition:all .3s';setTimeout(()=>t.remove(),300)},4000)}
new MutationObserver(()=>setTimeout(()=>Object.keys(S.charts).forEach(k=>{try{makeChart(k==='m'?'monthly':k==='d'?'donut':'report')}catch(e){}}),150)).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
