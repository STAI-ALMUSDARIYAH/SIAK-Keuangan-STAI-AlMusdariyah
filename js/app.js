// ==========================================
// SIK STAI Al-Musdariyah v4 - Full Rebuild
// Tahun Akademik 2025/2026
// ==========================================

const API_URL='https://script.google.com/macros/s/AKfycby0zxNuVMBq-9UCGH-xa9HbT4tgjgAAgNmFpeGN8YpBOhVCjbjJ1z_OfkESbFgfxQ8-JQ/exec';
const TA='2025/2026';

const S={user:null,income:[],expense:[],spp:[],dosen:[],mahasiswa:[],anggaran:[],users:[],summary:null,monthly:[],dosenProfile:{},mhsProfile:{},mhsSPP:[],biayaSemester:2500000,charts:{}};
let clockTimer=null;

// ==========================================
// WAKTU INDONESIA (WIB)
// ==========================================
function wibNow(){
    return new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Jakarta'}));
}
function getHari(d){return['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][d.getDay()]}
function getBulan(d){return['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][d.getMonth()]}
function pad(n){return String(n).padStart(2,'0')}

function fullDate(){const d=wibNow();return getHari(d)+', '+d.getDate()+' '+getBulan(d)+' '+d.getFullYear()}
function fullTime(){const d=wibNow();return pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds())}
function todayISO(){const d=wibNow();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}

function fDate(v){
    if(!v||v==='-')return'-';
    try{const d=new Date(v);if(isNaN(d))return v;
    const days=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
    const mons=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return days[d.getDay()]+', '+d.getDate()+' '+mons[d.getMonth()]+' '+d.getFullYear();}catch(e){return v}}

function fRp(n){n=parseFloat(n)||0;return'Rp '+n.toLocaleString('id-ID')}
function trunc(s,n){return s&&s.length>n?s.slice(0,n)+'...':s||'-'}
function v(id){const e=document.getElementById(id);return e?e.value:''}

// ==========================================
// CLOCK
// ==========================================
function startClock(){
    if(clockTimer)clearInterval(clockTimer);
    tickClock();
    clockTimer=setInterval(tickClock,1000);
}

function tickClock(){
    const t=fullTime();const d=fullDate();
    const els=[
        ['loginClock',t],['loginDate',d],
        ['tbClock',t],['dashClock',t],['dashDate',d]
    ];
    els.forEach(([id,val])=>{const e=document.getElementById(id);if(e)e.textContent=val;});
}

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded',()=>{
    initTheme();initSidebar();startClock();
    const saved=sessionStorage.getItem('stai_user');
    if(saved){S.user=JSON.parse(saved);enterApp();}
});

// ==========================================
// LOGIN
// ==========================================
async function handleLogin(e){
    e.preventDefault();
    const btn=document.getElementById('loginBtn'),err=document.getElementById('loginError');
    const u=document.getElementById('loginUser').value.trim(),p=document.getElementById('loginPass').value.trim();
    if(!u||!p){err.innerHTML='<i class="fas fa-exclamation-circle"></i> Lengkapi semua field';return}
    btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Memproses...';err.textContent='';
    try{
        const res=await fetch(`${API_URL}?action=login&username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`);
        const data=await res.json();
        if(data.success){S.user=data.user;sessionStorage.setItem('stai_user',JSON.stringify(data.user));toast('Login berhasil! Selamat datang '+data.user.nama,'success');enterApp();}
        else{err.innerHTML='<i class="fas fa-exclamation-circle"></i> '+(data.error||'Login gagal');}
    }catch(er){err.innerHTML='<i class="fas fa-exclamation-circle"></i> Gagal terhubung ke server';}
    finally{btn.disabled=false;btn.innerHTML='<span>Masuk</span><i class="fas fa-arrow-right"></i>';}
}

function fillLogin(u,p){document.getElementById('loginUser').value=u;document.getElementById('loginPass').value=p}
function togglePass(){const i=document.getElementById('loginPass'),ic=document.getElementById('eyeIcon');if(i.type==='password'){i.type='text';ic.className='fas fa-eye-slash'}else{i.type='password';ic.className='fas fa-eye'}}
function doLogout(){if(!confirm('Yakin ingin keluar?'))return;S.user=null;sessionStorage.removeItem('stai_user');document.getElementById('loginScreen').classList.remove('hide');document.getElementById('app').style.display='none';toast('Berhasil logout','info')}

// ==========================================
// ENTER APP
// ==========================================
async function enterApp(){
    document.getElementById('loginScreen').classList.add('hide');
    document.getElementById('app').style.display='flex';
    document.getElementById('sbName').textContent=S.user.nama;
    document.getElementById('sbRole').textContent=S.user.role;
    const icons={admin:'fa-user-shield',dosen:'fa-chalkboard-teacher',mahasiswa:'fa-user-graduate'};
    document.getElementById('sbAv').innerHTML=`<i class="fas ${icons[S.user.role]||'fa-user'}"></i>`;
    buildNav();
    showLoad('Memuat data...');
    await loadData();
    hideLoad();
    goTo('dashboard');
}

// ==========================================
// API
// ==========================================
async function apiGet(action,extra=''){const r=await fetch(`${API_URL}?action=${action}${extra}`);return r.json()}
async function apiWrite(body){
    const p=new URLSearchParams();p.set('action',body.action);
    if(body.sheet)p.set('sheet',body.sheet);if(body.id)p.set('id',body.id);
    if(body.data)p.set('data',JSON.stringify(body.data));
    const r=await fetch(`${API_URL}?${p.toString()}`);const d=await r.json();
    if(!d.success)throw new Error(d.error||'Gagal');return d;
}

async function loadData(){
    const role=S.user.role;
    try{
        if(role==='admin'){
            const[a,b,c,d,e,f,g,h,i]=await Promise.all([apiGet('getData','&sheet=pemasukan'),apiGet('getData','&sheet=pengeluaran'),apiGet('getData','&sheet=spp'),apiGet('getDosen'),apiGet('getMahasiswa'),apiGet('getAnggaran'),apiGet('getUsers'),apiGet('getSummary'),apiGet('getMonthly')]);
            S.income=a.data||[];S.expense=b.data||[];S.spp=c.data||[];S.dosen=d.data||[];S.mahasiswa=e.data||[];S.anggaran=f.data||[];S.users=g.data||[];S.summary=h.summary;S.monthly=i.monthly||[];
        }else if(role==='dosen'){
            const[a,b,c]=await Promise.all([apiGet('getDosenProfile',`&userId=${S.user.id}`),apiGet('getAnggaran'),apiGet('getSummary')]);
            S.dosenProfile=a.profile||{};S.anggaran=b.data||[];S.summary=c.summary;
        }else{
            const[a,b,c]=await Promise.all([apiGet('getMahasiswaProfile',`&userId=${S.user.id}`),apiGet('getMahasiswaSPP',`&userId=${S.user.id}`),apiGet('getSummary')]);
            S.mhsProfile=a.profile||{};S.mhsSPP=b.data||[];S.biayaSemester=b.biayaPerSemester||2500000;S.summary=c.summary;
        }
    }catch(e){console.error(e);toast('Gagal memuat data: '+e.message,'error')}
}

async function doRefresh(){
    const ic=document.getElementById('refIc');ic.classList.add('fa-spin');showLoad('Menyinkronkan...');
    await loadData();hideLoad();ic.classList.remove('fa-spin');
    goTo(document.querySelector('.sb-lk.on')?.dataset.pg||'dashboard');
    toast('Data berhasil diperbarui!','success');
}

// ==========================================
// NAV
// ==========================================
function buildNav(){
    const nav=document.getElementById('sbNav');const role=S.user.role;let h='';
    if(role==='admin'){h=`
        <div class="sb-sec"><span class="sb-sec-t">UTAMA</span>
        <a class="sb-lk on" data-pg="dashboard"><i class="fas fa-th-large"></i><span>Dashboard</span></a>
        <a class="sb-lk" data-pg="pemasukan"><i class="fas fa-arrow-circle-down"></i><span>Pemasukan</span></a>
        <a class="sb-lk" data-pg="pengeluaran"><i class="fas fa-arrow-circle-up"></i><span>Pengeluaran</span></a>
        <a class="sb-lk" data-pg="spp"><i class="fas fa-graduation-cap"></i><span>SPP</span></a></div>
        <div class="sb-sec"><span class="sb-sec-t">DATA</span>
        <a class="sb-lk" data-pg="dosen"><i class="fas fa-chalkboard-teacher"></i><span>Dosen</span></a>
        <a class="sb-lk" data-pg="mhs"><i class="fas fa-users"></i><span>Mahasiswa</span></a>
        <a class="sb-lk" data-pg="anggaran"><i class="fas fa-coins"></i><span>Anggaran</span></a></div>
        <div class="sb-sec"><span class="sb-sec-t">LAPORAN</span>
        <a class="sb-lk" data-pg="laporan"><i class="fas fa-chart-line"></i><span>Laporan</span></a>
        <a class="sb-lk" data-pg="rekap"><i class="fas fa-file-invoice-dollar"></i><span>Rekap</span></a></div>
        <div class="sb-sec"><span class="sb-sec-t">SISTEM</span>
        <a class="sb-lk" data-pg="users"><i class="fas fa-user-cog"></i><span>Users</span></a></div>`;
    }else if(role==='dosen'){h=`
        <div class="sb-sec"><span class="sb-sec-t">MENU DOSEN</span>
        <a class="sb-lk on" data-pg="dashboard"><i class="fas fa-th-large"></i><span>Dashboard</span></a>
        <a class="sb-lk" data-pg="profil-dsn"><i class="fas fa-id-card"></i><span>Profil</span></a>
        <a class="sb-lk" data-pg="anggaran"><i class="fas fa-coins"></i><span>Anggaran</span></a></div>`;
    }else{h=`
        <div class="sb-sec"><span class="sb-sec-t">MENU MAHASISWA</span>
        <a class="sb-lk on" data-pg="dashboard"><i class="fas fa-th-large"></i><span>Dashboard</span></a>
        <a class="sb-lk" data-pg="profil-mhs"><i class="fas fa-id-card"></i><span>Profil</span></a>
        <a class="sb-lk" data-pg="spp-saya"><i class="fas fa-receipt"></i><span>SPP Saya</span></a></div>`;}
    nav.innerHTML=h;
    nav.querySelectorAll('.sb-lk').forEach(l=>{l.addEventListener('click',e=>{e.preventDefault();nav.querySelectorAll('.sb-lk').forEach(x=>x.classList.remove('on'));l.classList.add('on');goTo(l.dataset.pg);closeSb()})});
}

function goTo(pg){
    const w=document.getElementById('pgWrap');
    document.getElementById('tbPage').textContent=pgTitle(pg);
    w.innerHTML='';const d=document.createElement('div');d.className='pg on';d.id='p-'+pg;w.appendChild(d);
    const r={dashboard:rDash,pemasukan:rInc,pengeluaran:rExp,spp:rSPP,dosen:rDosen,mhs:rMhs,anggaran:rAng,laporan:rLap,rekap:rRekap,users:rUsers,'profil-dsn':rProfDsn,'profil-mhs':rProfMhs,'spp-saya':rSppSaya};
    if(r[pg])r[pg]();else d.innerHTML='<div class="empty-s"><i class="fas fa-tools"></i><p>Halaman dalam pengembangan</p></div>';
}

function pgTitle(p){const m={dashboard:'Dashboard',pemasukan:'Pemasukan',pengeluaran:'Pengeluaran',spp:'SPP',dosen:'Dosen',mhs:'Mahasiswa',anggaran:'Anggaran',laporan:'Laporan',rekap:'Rekap Bulanan',users:'Users','profil-dsn':'Profil Dosen','profil-mhs':'Profil Mahasiswa','spp-saya':'SPP Saya'};return m[p]||p}

// ==========================================
// DASHBOARD
// ==========================================
function rDash(){
    const pg=document.getElementById('p-dashboard');const role=S.user.role;const sum=S.summary||{};
    const greet={admin:'Admin',dosen:'Bapak/Ibu Dosen',mahasiswa:'Mahasiswa/i'};
    let h=`<div class="wel"><div class="wel-info"><h1>Assalamu'alaikum, ${greet[role]}! 👋</h1><p>${S.user.nama} — SIK STAI Al-Musdariyah Cimahi</p>
    <div class="wel-meta"><span><i class="fas fa-calendar"></i> <span id="dashDate">${fullDate()}</span></span><span><i class="fas fa-clock"></i> <span id="dashClock">${fullTime()}</span> WIB</span><span><i class="fas fa-user-tag"></i> ${S.user.role}</span><span><i class="fas fa-book"></i> TA ${TA}</span></div>
    </div><img src="assets/logokampus.png" alt="" class="wel-logo" onerror="this.style.display='none'"></div>`;

    if(role==='admin'){
        h+=`<div class="stats">
        <div class="st"><div class="st-ic green"><i class="fas fa-arrow-down"></i></div><div class="st-d"><small>Total Pemasukan</small><h3>${fRp(sum.totalIncome)}</h3><div class="sub"><i class="fas fa-check-circle"></i> TA ${TA}</div></div><div class="st-bg"><i class="fas fa-wallet"></i></div></div>
        <div class="st"><div class="st-ic red"><i class="fas fa-arrow-up"></i></div><div class="st-d"><small>Total Pengeluaran</small><h3>${fRp(sum.totalExpense)}</h3><div class="sub"><i class="fas fa-info-circle"></i> TA ${TA}</div></div><div class="st-bg"><i class="fas fa-money-bill"></i></div></div>
        <div class="st"><div class="st-ic blue"><i class="fas fa-scale-balanced"></i></div><div class="st-d"><small>Saldo Kas</small><h3>${fRp(sum.saldo)}</h3><div class="sub"><i class="fas fa-shield-alt"></i> ${sum.saldo>=0?'Sehat':'Defisit'}</div></div><div class="st-bg"><i class="fas fa-landmark"></i></div></div>
        <div class="st"><div class="st-ic purple"><i class="fas fa-users"></i></div><div class="st-d"><small>Mahasiswa</small><h3>${sum.mahasiswaStats?.total||0}</h3><div class="sub">PAI: ${sum.mahasiswaStats?.pai||0} | HES: ${sum.mahasiswaStats?.hes||0}</div></div><div class="st-bg"><i class="fas fa-user-graduate"></i></div></div>
        <div class="st"><div class="st-ic teal"><i class="fas fa-chalkboard-teacher"></i></div><div class="st-d"><small>Dosen</small><h3>${sum.dosenStats?.total||0}</h3><div class="sub">PAI: ${sum.dosenStats?.pai||0} | HES: ${sum.dosenStats?.hes||0}</div></div><div class="st-bg"><i class="fas fa-chalkboard"></i></div></div>
        <div class="st"><div class="st-ic orange"><i class="fas fa-receipt"></i></div><div class="st-d"><small>SPP Lunas</small><h3>${sum.sppStats?.lunas||0} <small style="font-size:.65rem;color:var(--tx3)">/ ${sum.sppStats?.total||0}</small></h3><div class="sub">Rp 2.500.000/sem</div></div><div class="st-bg"><i class="fas fa-file-invoice-dollar"></i></div></div>
        </div>
        <div class="ch-row"><div class="ch"><div class="ch-hd"><h3><i class="fas fa-chart-bar"></i> Keuangan TA ${TA}</h3></div><div class="ch-bd"><canvas id="cM"></canvas></div></div>
        <div class="ch"><div class="ch-hd"><h3><i class="fas fa-chart-pie"></i> Distribusi</h3></div><div class="ch-bd"><canvas id="cD"></canvas></div></div></div>
        <div class="cd"><div class="cd-hd"><h3><i class="fas fa-clock"></i> Transaksi Terakhir</h3></div><div class="tw"><table class="t"><thead><tr><th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th>Jenis</th><th>Jumlah</th></tr></thead><tbody>${recentRows()}</tbody></table></div></div>`;
        pg.innerHTML=h;setTimeout(()=>{makeChart('monthly');makeChart('donut')},100);
    }else if(role==='dosen'){
        const dp=S.dosenProfile||{};
        h+=`<div class="stats">
        <div class="st"><div class="st-ic green"><i class="fas fa-money-bill-wave"></i></div><div class="st-d"><small>Gaji</small><h3>${fRp(dp.Gaji)}</h3><div class="sub">TA ${TA}</div></div></div>
        <div class="st"><div class="st-ic blue"><i class="fas fa-flask"></i></div><div class="st-d"><small>Penelitian</small><h3>${fRp(dp.Penelitian)}</h3></div></div>
        <div class="st"><div class="st-ic teal"><i class="fas fa-hands-helping"></i></div><div class="st-d"><small>PkM</small><h3>${fRp(dp.PkM)}</h3></div></div>
        <div class="st"><div class="st-ic purple"><i class="fas fa-users"></i></div><div class="st-d"><small>Mahasiswa</small><h3>${sum.mahasiswaStats?.total||0}</h3></div></div></div>
        <div class="prof"><div class="prof-ban"><div class="prof-av"><i class="fas fa-chalkboard-teacher"></i></div><div class="prof-nm"><h2>${dp.Nama||S.user.nama}</h2><p>${dp.Jabatan||'Dosen'} — ${dp.Prodi||'-'} | TA ${TA}</p></div></div>
        <div class="prof-det"><div class="prof-it"><label>NIDN</label><span>${dp.NIDN||'-'}</span></div><div class="prof-it"><label>Prodi</label><span>${dp.Prodi||'-'}</span></div><div class="prof-it"><label>Jabatan</label><span>${dp.Jabatan||'-'}</span></div><div class="prof-it"><label>Status</label><span class="bg bg-g">${dp.Status||'Aktif'}</span></div></div></div>`;
        pg.innerHTML=h;
    }else{
        const mp=S.mhsProfile||{};const paid=parseFloat(mp['Total Bayar'])||0;const pct=Math.min(100,Math.round((paid/S.biayaSemester)*100));const sc=mp['Status SPP']==='Lunas'?'lunas':mp['Status SPP']==='Cicilan'?'cicilan':'belum';
        h+=`<div class="stats">
        <div class="st"><div class="st-ic blue"><i class="fas fa-university"></i></div><div class="st-d"><small>Biaya/Semester</small><h3>${fRp(S.biayaSemester)}</h3><div class="sub">TA ${TA}</div></div></div>
        <div class="st"><div class="st-ic green"><i class="fas fa-check-circle"></i></div><div class="st-d"><small>Sudah Bayar</small><h3>${fRp(paid)}</h3></div></div>
        <div class="st"><div class="st-ic ${paid>=S.biayaSemester?'green':'red'}"><i class="fas fa-${paid>=S.biayaSemester?'check':'exclamation-triangle'}"></i></div><div class="st-d"><small>Sisa</small><h3>${fRp(Math.max(0,S.biayaSemester-paid))}</h3></div></div></div>
        <div class="spp-info"><div class="spp-circ ${sc}"><span class="pct">${pct}%</span><span class="pct-l">Terbayar</span></div>
        <div class="spp-det"><h3>${mp.Nama||S.user.nama}</h3><p>NIM: ${mp.NIM||'-'} | ${mp.Prodi||'-'}</p><p>Angkatan: ${mp.Angkatan||'-'} | Sem ${mp.Semester||'-'} | TA ${TA}</p><span class="bg ${sc==='lunas'?'bg-g':sc==='cicilan'?'bg-y':'bg-r'}">${mp['Status SPP']||'Belum Bayar'}</span></div></div>`;
        pg.innerHTML=h;
    }
}

function recentRows(){
    const all=[...S.income.map(i=>({...i,_t:'in'})),...S.expense.map(e=>({...e,_t:'out'}))].sort((a,b)=>new Date(b.Tanggal)-new Date(a.Tanggal)).slice(0,8);
    if(!all.length)return'<tr><td colspan="5" class="empty-s"><p>Belum ada transaksi</p></td></tr>';
    return all.map(tx=>{const isIn=tx._t==='in';return`<tr><td>${fDate(tx.Tanggal)}</td><td>${trunc(tx.Keterangan,35)}</td><td><span class="bg bg-b">${tx.Kategori}</span></td><td><span class="bg ${isIn?'bg-g':'bg-r'}"><i class="fas fa-arrow-${isIn?'down':'up'}"></i> ${isIn?'Masuk':'Keluar'}</span></td><td style="font-weight:700;color:${isIn?'var(--g)':'var(--r)'}">${isIn?'+':'-'}${fRp(tx.Jumlah)}</td></tr>`}).join('');
}

// ==========================================
// CRUD PAGES (Pemasukan, Pengeluaran, SPP, Dosen, Users)
// ==========================================
function rInc(){document.getElementById('p-pemasukan').innerHTML=`<div class="pb"><div><h2><i class="fas fa-arrow-circle-down"></i> Pemasukan</h2><p>TA ${TA}</p></div><button class="btn btn-p" onclick="openForm('income')"><i class="fas fa-plus"></i> Tambah</button></div><div class="cd"><div class="cd-hd"><h3>Data Pemasukan</h3><span class="cnt-b">${S.income.length} data</span></div><div class="tw"><table class="t"><thead><tr><th>No</th><th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th>Jumlah</th><th>Aksi</th></tr></thead><tbody>${S.income.length?S.income.map((r,i)=>`<tr><td>${i+1}</td><td>${fDate(r.Tanggal)}</td><td>${trunc(r.Keterangan,40)}</td><td><span class="bg bg-b">${r.Kategori}</span></td><td style="font-weight:700;color:var(--g)">+${fRp(r.Jumlah)}</td><td><div style="display:flex;gap:3px"><button class="btn-ic ed" onclick="openForm('income','${r.ID}')"><i class="fas fa-edit"></i></button><button class="btn-ic dl" onclick="delRec('pemasukan','${r.ID}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join(''):'<tr><td colspan="6" class="empty-s"><i class="fas fa-inbox"></i><p>Belum ada data</p></td></tr>'}</tbody></table></div></div>`}

function rExp(){document.getElementById('p-pengeluaran').innerHTML=`<div class="pb"><div><h2><i class="fas fa-arrow-circle-up"></i> Pengeluaran</h2><p>TA ${TA}</p></div><button class="btn btn-d" onclick="openForm('expense')"><i class="fas fa-plus"></i> Tambah</button></div><div class="cd"><div class="cd-hd"><h3>Data Pengeluaran</h3><span class="cnt-b">${S.expense.length} data</span></div><div class="tw"><table class="t"><thead><tr><th>No</th><th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th>Jumlah</th><th>Aksi</th></tr></thead><tbody>${S.expense.length?S.expense.map((r,i)=>`<tr><td>${i+1}</td><td>${fDate(r.Tanggal)}</td><td>${trunc(r.Keterangan,40)}</td><td><span class="bg bg-p">${r.Kategori}</span></td><td style="font-weight:700;color:var(--r)">-${fRp(r.Jumlah)}</td><td><div style="display:flex;gap:3px"><button class="btn-ic ed" onclick="openForm('expense','${r.ID}')"><i class="fas fa-edit"></i></button><button class="btn-ic dl" onclick="delRec('pengeluaran','${r.ID}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join(''):'<tr><td colspan="6" class="empty-s"><i class="fas fa-inbox"></i><p>Belum ada data</p></td></tr>'}</tbody></table></div></div>`}

function rSPP(){const l=S.spp.filter(s=>s.Status==='Lunas').length,b=S.spp.filter(s=>s.Status==='Belum Bayar').length,c=S.spp.filter(s=>s.Status==='Cicilan').length;document.getElementById('p-spp').innerHTML=`<div class="pb"><div><h2><i class="fas fa-graduation-cap"></i> SPP</h2><p>Rp 2.500.000/sem | TA ${TA}</p></div><button class="btn btn-p" onclick="openForm('spp')"><i class="fas fa-plus"></i> Input</button></div><div class="spp-g"><div class="spp-c lunas"><i class="fas fa-check-circle"></i><div><small>Lunas</small><h3>${l}</h3></div></div><div class="spp-c belum"><i class="fas fa-times-circle"></i><div><small>Belum</small><h3>${b}</h3></div></div><div class="spp-c cicil"><i class="fas fa-pause-circle"></i><div><small>Cicilan</small><h3>${c}</h3></div></div><div class="spp-c total"><i class="fas fa-users"></i><div><small>Total</small><h3>${S.spp.length}</h3></div></div></div><div class="cd"><div class="cd-hd"><h3>Data SPP</h3><span class="cnt-b">${S.spp.length}</span></div><div class="tw"><table class="t"><thead><tr><th>No</th><th>NIM</th><th>Nama</th><th>Prodi</th><th>Sem</th><th>Jumlah</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${S.spp.length?S.spp.map((r,i)=>`<tr><td>${i+1}</td><td><strong>${r.NIM}</strong></td><td>${r.Nama}</td><td>${trunc(r.Prodi,18)}</td><td>${r.Semester}</td><td style="font-weight:700">${fRp(r.Jumlah)}</td><td><span class="bg ${r.Status==='Lunas'?'bg-g':r.Status==='Cicilan'?'bg-y':'bg-r'}">${r.Status}</span></td><td><div style="display:flex;gap:3px"><button class="btn-ic ed" onclick="openForm('spp','${r.ID}')"><i class="fas fa-edit"></i></button><button class="btn-ic dl" onclick="delRec('spp','${r.ID}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join(''):'<tr><td colspan="8" class="empty-s"><p>Belum ada</p></td></tr>'}</tbody></table></div></div>`}

function rDosen(){document.getElementById('p-dosen').innerHTML=`<div class="pb"><div><h2><i class="fas fa-chalkboard-teacher"></i> Dosen</h2><p>PAI: ${S.dosen.filter(d=>d.Prodi==='PAI').length} | HES: ${S.dosen.filter(d=>d.Prodi==='HES').length}</p></div><button class="btn btn-p" onclick="openForm('dosen')"><i class="fas fa-plus"></i> Tambah</button></div><div class="cd"><div class="cd-hd"><h3>Data Dosen</h3><span class="cnt-b">${S.dosen.length}</span></div><div class="tw"><table class="t"><thead><tr><th>No</th><th>NIDN</th><th>Nama</th><th>Prodi</th><th>Jabatan</th><th>Gaji</th><th>Penelitian</th><th>PkM</th><th>Aksi</th></tr></thead><tbody>${S.dosen.length?S.dosen.map((r,i)=>`<tr><td>${i+1}</td><td>${r.NIDN}</td><td><strong>${r.Nama}</strong></td><td><span class="bg ${r.Prodi==='PAI'?'bg-b':'bg-t'}">${r.Prodi}</span></td><td>${r.Jabatan}</td><td style="font-weight:600">${fRp(r.Gaji)}</td><td>${fRp(r.Penelitian)}</td><td>${fRp(r.PkM)}</td><td><div style="display:flex;gap:3px"><button class="btn-ic ed" onclick="openForm('dosen','${r.ID}')"><i class="fas fa-edit"></i></button><button class="btn-ic dl" onclick="delRec('dosen','${r.ID}','deleteDosen')"><i class="fas fa-trash"></i></button></div></td></tr>`).join(''):'<tr><td colspan="9" class="empty-s"><p>Belum ada</p></td></tr>'}</tbody></table></div></div>`}

function rMhs(){const s=S.summary?.mahasiswaStats;const pa=s?.perAngkatan||[];document.getElementById('p-mhs').innerHTML=`<div class="pb"><div><h2><i class="fas fa-users"></i> Mahasiswa</h2><p>Total: ${s?.total||0} | TA ${TA}</p></div></div><div class="stats"><div class="st"><div class="st-ic blue"><i class="fas fa-book-quran"></i></div><div class="st-d"><small>S1 PAI</small><h3>${s?.pai||0}</h3></div></div><div class="st"><div class="st-ic teal"><i class="fas fa-scale-balanced"></i></div><div class="st-d"><small>S1 HES</small><h3>${s?.hes||0}</h3></div></div><div class="st"><div class="st-ic purple"><i class="fas fa-users"></i></div><div class="st-d"><small>Total</small><h3>${s?.total||0}</h3></div></div></div><div class="cd"><div class="cd-hd"><h3><i class="fas fa-layer-group"></i> Per Angkatan</h3></div><div class="tw"><table class="t"><thead><tr><th>Angkatan</th><th>S1 PAI</th><th>S1 HES</th><th>Total</th></tr></thead><tbody>${pa.map(a=>`<tr><td><strong>${a.angkatan}</strong></td><td>${a.pai}</td><td>${a.hes}</td><td><strong>${a.pai+a.hes}</strong></td></tr>`).join('')}</tbody></table></div></div>`}

function rAng(){const cats={};S.anggaran.forEach(a=>{if(!cats[a.Kategori])cats[a.Kategori]=[];cats[a.Kategori].push(a)});let ch='';for(const[c,items]of Object.entries(cats)){const tot=items.reduce((s,i)=>s+(parseFloat(i.Nominal)||0),0);ch+=`<div class="ang"><div class="ang-hd"><h4>${c}</h4><span class="ang-tot">${fRp(tot)}</span></div><div class="ang-items">${items.map(i=>`<div class="ang-it"><span>${i.Item||i.SubKategori}</span><span>${fRp(i.Nominal)}</span></div>`).join('')}</div></div>`}const gt=S.anggaran.reduce((s,a)=>s+(parseFloat(a.Nominal)||0),0);document.getElementById('p-anggaran').innerHTML=`<div class="pb"><div><h2><i class="fas fa-coins"></i> Anggaran</h2><p>TA ${TA}</p></div><div class="btn btn-o"><i class="fas fa-calculator"></i> Total: ${fRp(gt)}</div></div><div class="ang-g">${ch}</div>`}

function rLap(){const s=S.summary||{};document.getElementById('p-laporan').innerHTML=`<div class="pb"><div><h2><i class="fas fa-chart-line"></i> Laporan</h2><p>TA ${TA}</p></div></div><div class="rpt-g"><div class="rpt"><small><i class="fas fa-arrow-down"></i> Pemasukan</small><h2 class="txt-g">${fRp(s.totalIncome)}</h2></div><div class="rpt"><small><i class="fas fa-arrow-up"></i> Pengeluaran</small><h2 class="txt-r">${fRp(s.totalExpense)}</h2></div><div class="rpt"><small><i class="fas fa-balance-scale"></i> Saldo</small><h2 class="txt-b">${fRp(s.saldo)}</h2></div></div><div class="ch"><div class="ch-hd"><h3><i class="fas fa-chart-area"></i> Tren Keuangan</h3></div><div class="ch-bd" style="min-height:320px"><canvas id="cR"></canvas></div></div>`;setTimeout(()=>makeChart('report'),100)}

function rRekap(){const ms=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];document.getElementById('p-rekap').innerHTML=`<div class="pb"><div><h2><i class="fas fa-file-invoice-dollar"></i> Rekap</h2><p>TA ${TA}</p></div></div><div class="cd"><div class="tw"><table class="t"><thead><tr><th>Bulan</th><th>Pemasukan</th><th>Pengeluaran</th><th>Saldo</th><th>Status</th></tr></thead><tbody>${ms.map((m,i)=>{const md=S.monthly[i]||{income:0,expense:0};const s=md.income-md.expense;return`<tr><td><strong>${m}</strong></td><td style="color:var(--g);font-weight:600">${fRp(md.income)}</td><td style="color:var(--r);font-weight:600">${fRp(md.expense)}</td><td style="font-weight:700;color:${s>=0?'var(--g)':'var(--r)'}">${fRp(s)}</td><td><span class="bg ${s>=0?'bg-g':'bg-r'}">${s>=0?'Surplus':'Defisit'}</span></td></tr>`}).join('')}</tbody></table></div></div>`}

function rUsers(){document.getElementById('p-users').innerHTML=`<div class="pb"><div><h2><i class="fas fa-user-cog"></i> Users</h2></div><button class="btn btn-p" onclick="openForm('user')"><i class="fas fa-plus"></i> Tambah</button></div><div class="cd"><div class="cd-hd"><h3>Daftar User</h3><span class="cnt-b">${S.users.length}</span></div><div class="tw"><table class="t"><thead><tr><th>No</th><th>Username</th><th>Nama</th><th>Role</th><th>NIM/NIDN</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${S.users.map((u,i)=>`<tr><td>${i+1}</td><td><strong>${u.Username}</strong></td><td>${u.Nama}</td><td><span class="bg ${u.Role==='admin'?'bg-r':u.Role==='dosen'?'bg-b':'bg-g'}">${u.Role}</span></td><td>${u['NIM/NIDN']||'-'}</td><td><span class="bg ${u.Status==='Aktif'?'bg-g':'bg-r'}">${u.Status}</span></td><td><div style="display:flex;gap:3px"><button class="btn-ic ed" onclick="openForm('user','${u.ID}')"><i class="fas fa-edit"></i></button><button class="btn-ic dl" onclick="delRec('users','${u.ID}','deleteUser')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('')}</tbody></table></div></div>`}

function rProfDsn(){const dp=S.dosenProfile||{};document.getElementById('p-profil-dsn').innerHTML=`<div class="prof"><div class="prof-ban"><div class="prof-av"><i class="fas fa-chalkboard-teacher"></i></div><div class="prof-nm"><h2>${dp.Nama||S.user.nama}</h2><p>${dp.Jabatan||'Dosen'} — ${dp.Prodi||'-'} | TA ${TA}</p></div></div><div class="prof-det"><div class="prof-it"><label>NIDN</label><span>${dp.NIDN||'-'}</span></div><div class="prof-it"><label>Prodi</label><span>${dp.Prodi||'-'}</span></div><div class="prof-it"><label>Jabatan</label><span>${dp.Jabatan||'-'}</span></div><div class="prof-it"><label>Gaji</label><span style="color:var(--g);font-weight:700">${fRp(dp.Gaji)}</span></div><div class="prof-it"><label>Penelitian</label><span style="color:var(--b);font-weight:700">${fRp(dp.Penelitian)}</span></div><div class="prof-it"><label>PkM</label><span style="color:var(--t);font-weight:700">${fRp(dp.PkM)}</span></div><div class="prof-it"><label>Status</label><span class="bg bg-g">${dp.Status||'Aktif'}</span></div></div></div>`}

function rProfMhs(){const mp=S.mhsProfile||{};document.getElementById('p-profil-mhs').innerHTML=`<div class="prof"><div class="prof-ban" style="background:linear-gradient(135deg,var(--pp),var(--b),var(--t))"><div class="prof-av"><i class="fas fa-user-graduate"></i></div><div class="prof-nm"><h2>${mp.Nama||S.user.nama}</h2><p>${mp.Prodi||'-'} | TA ${TA}</p></div></div><div class="prof-det"><div class="prof-it"><label>NIM</label><span>${mp.NIM||'-'}</span></div><div class="prof-it"><label>Prodi</label><span>${mp.Prodi||'-'}</span></div><div class="prof-it"><label>Angkatan</label><span>${mp.Angkatan||'-'}</span></div><div class="prof-it"><label>Semester</label><span>Sem ${mp.Semester||'-'}</span></div><div class="prof-it"><label>Status SPP</label><span class="bg ${mp['Status SPP']==='Lunas'?'bg-g':'bg-r'}">${mp['Status SPP']||'-'}</span></div><div class="prof-it"><label>Total Bayar</label><span style="font-weight:700;color:var(--g)">${fRp(mp['Total Bayar'])}</span></div></div></div>`}

function rSppSaya(){const paid=S.mhsSPP.reduce((s,r)=>s+(parseFloat(r.Jumlah)||0),0);const sisa=Math.max(0,S.biayaSemester-paid);const pct=Math.min(100,Math.round((paid/S.biayaSemester)*100));document.getElementById('p-spp-saya').innerHTML=`<div class="pb"><div><h2><i class="fas fa-receipt"></i> SPP Saya</h2><p>Rp 2.500.000/sem | TA ${TA}</p></div></div><div class="stats"><div class="st"><div class="st-ic blue"><i class="fas fa-money-bill"></i></div><div class="st-d"><small>Biaya</small><h3>${fRp(S.biayaSemester)}</h3></div></div><div class="st"><div class="st-ic green"><i class="fas fa-check"></i></div><div class="st-d"><small>Dibayar</small><h3>${fRp(paid)}</h3></div></div><div class="st"><div class="st-ic ${sisa>0?'red':'green'}"><i class="fas fa-${sisa>0?'exclamation':'check-double'}"></i></div><div class="st-d"><small>Sisa</small><h3>${fRp(sisa)}</h3></div></div></div><div class="cd"><div class="cd-hd"><h3><i class="fas fa-history"></i> Riwayat</h3></div><div class="tw"><table class="t"><thead><tr><th>No</th><th>Tanggal</th><th>Sem</th><th>Jumlah</th><th>Status</th></tr></thead><tbody>${S.mhsSPP.length?S.mhsSPP.map((r,i)=>`<tr><td>${i+1}</td><td>${fDate(r['Tgl Bayar'])}</td><td>Sem ${r.Semester}</td><td style="font-weight:700">${fRp(r.Jumlah)}</td><td><span class="bg ${r.Status==='Lunas'?'bg-g':r.Status==='Cicilan'?'bg-y':'bg-r'}">${r.Status}</span></td></tr>`).join(''):'<tr><td colspan="5" class="empty-s"><p>Belum ada riwayat</p></td></tr>'}</tbody></table></div></div>`}

// ==========================================
// FORMS & MODAL
// ==========================================
function openForm(type,eid){
    const t=document.getElementById('mTitle'),b=document.getElementById('mBody');let item=null;
    if(type==='income'){if(eid)item=S.income.find(r=>r.ID===eid);t.textContent=eid?'✏️ Edit Pemasukan':'💰 Tambah Pemasukan';b.innerHTML=txForm('income',item)}
    else if(type==='expense'){if(eid)item=S.expense.find(r=>r.ID===eid);t.textContent=eid?'✏️ Edit Pengeluaran':'💸 Tambah Pengeluaran';b.innerHTML=txForm('expense',item)}
    else if(type==='spp'){if(eid)item=S.spp.find(r=>r.ID===eid);t.textContent=eid?'✏️ Edit SPP':'🎓 Input SPP';b.innerHTML=sppForm(item)}
    else if(type==='dosen'){if(eid)item=S.dosen.find(r=>r.ID===eid);t.textContent=eid?'✏️ Edit Dosen':'👨‍🏫 Tambah Dosen';b.innerHTML=dsnForm(item)}
    else if(type==='user'){if(eid)item=S.users.find(r=>r.ID===eid);t.textContent=eid?'✏️ Edit User':'👤 Tambah User';b.innerHTML=usrForm(item)}
    document.getElementById('mBg').classList.add('open');
}
function closeModal(){document.getElementById('mBg').classList.remove('open')}
document.getElementById('mBg').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal()});

function txForm(type,d){const cats=type==='income'?['SPP','Pendaftaran','Donasi','Hibah','Lainnya']:['Gaji','Operasional','Infrastruktur','ATK','Kegiatan','Lainnya'];return`<form onsubmit="saveTx(event,'${type}','${d?.ID||''}')"><div class="f-row"><div class="fg"><label>Tanggal</label><input type="date" class="inp" id="fD" value="${d?.Tanggal||todayISO()}" required></div><div class="fg"><label>Kategori</label><select class="inp" id="fC" required><option value="">Pilih</option>${cats.map(c=>`<option ${d?.Kategori===c?'selected':''}>${c}</option>`).join('')}</select></div></div><div class="fg"><label>Keterangan</label><input type="text" class="inp" id="fK" value="${d?.Keterangan||''}" required></div><div class="fg"><label>Jumlah (Rp)</label><input type="number" class="inp" id="fJ" value="${d?.Jumlah||''}" min="1" required></div><div class="fg"><label>Catatan</label><textarea class="inp" id="fN">${d?.Catatan||''}</textarea></div><div class="m-ft"><button type="button" class="btn btn-o" onclick="closeModal()">Batal</button><button type="submit" class="btn ${type==='income'?'btn-p':'btn-d'}"><i class="fas fa-save"></i> ${d?'Update':'Simpan'}</button></div></form>`}

function sppForm(d){return`<form onsubmit="saveSpp(event,'${d?.ID||''}')"><div class="f-row"><div class="fg"><label>NIM</label><input type="text" class="inp" id="fNIM" value="${d?.NIM||''}" required></div><div class="fg"><label>Semester</label><select class="inp" id="fSem" required>${[1,2,3,4,5,6,7,8].map(s=>`<option ${parseInt(d?.Semester)===s?'selected':''}>${s}</option>`).join('')}</select></div></div><div class="fg"><label>Nama</label><input type="text" class="inp" id="fNm" value="${d?.Nama||''}" required></div><div class="fg"><label>Prodi</label><select class="inp" id="fPr" required><option value="">Pilih</option>${['S1 Pendidikan Agama Islam','S1 Hukum Ekonomi Syariah (Muamalah)'].map(p=>`<option ${d?.Prodi===p?'selected':''}>${p}</option>`).join('')}</select></div><div class="f-row"><div class="fg"><label>Jumlah (Rp)</label><input type="number" class="inp" id="fJ" value="${d?.Jumlah||2500000}" min="1" required></div><div class="fg"><label>Status</label><select class="inp" id="fSt" required>${['Lunas','Cicilan','Belum Bayar'].map(s=>`<option ${d?.Status===s?'selected':''}>${s}</option>`).join('')}</select></div></div><div class="fg"><label>Tgl Bayar</label><input type="date" class="inp" id="fTB" value="${d?.['Tgl Bayar']||todayISO()}"></div><div class="m-ft"><button type="button" class="btn btn-o" onclick="closeModal()">Batal</button><button type="submit" class="btn btn-p"><i class="fas fa-save"></i> ${d?'Update':'Simpan'}</button></div></form>`}

function dsnForm(d){return`<form onsubmit="saveDsn(event,'${d?.ID||''}')"><div class="f-row"><div class="fg"><label>NIDN</label><input type="text" class="inp" id="fNIDN" value="${d?.NIDN||''}" required></div><div class="fg"><label>Prodi</label><select class="inp" id="fPr" required><option value="PAI" ${d?.Prodi==='PAI'?'selected':''}>PAI</option><option value="HES" ${d?.Prodi==='HES'?'selected':''}>HES</option></select></div></div><div class="fg"><label>Nama</label><input type="text" class="inp" id="fNm" value="${d?.Nama||''}" required></div><div class="fg"><label>Jabatan</label><input type="text" class="inp" id="fJb" value="${d?.Jabatan||'Dosen Tetap'}" required></div><div class="f-row"><div class="fg"><label>Gaji</label><input type="number" class="inp" id="fGj" value="${d?.Gaji||0}" min="0" required></div><div class="fg"><label>Penelitian</label><input type="number" class="inp" id="fPn" value="${d?.Penelitian||0}" min="0"></div></div><div class="fg"><label>PkM</label><input type="number" class="inp" id="fPk" value="${d?.PkM||0}" min="0"></div><div class="m-ft"><button type="button" class="btn btn-o" onclick="closeModal()">Batal</button><button type="submit" class="btn btn-p"><i class="fas fa-save"></i> ${d?'Update':'Simpan'}</button></div></form>`}

function usrForm(d){return`<form onsubmit="saveUsr(event,'${d?.ID||''}')"><div class="f-row"><div class="fg"><label>Username</label><input type="text" class="inp" id="fUs" value="${d?.Username||''}" required></div><div class="fg"><label>Password</label><input type="text" class="inp" id="fPw" placeholder="${d?'Kosongkan jika tidak diubah':''}" ${d?'':'required'}></div></div><div class="fg"><label>Nama</label><input type="text" class="inp" id="fNm" value="${d?.Nama||''}" required></div><div class="f-row"><div class="fg"><label>Role</label><select class="inp" id="fRl" required>${['admin','dosen','mahasiswa'].map(r=>`<option ${d?.Role===r?'selected':''}>${r}</option>`).join('')}</select></div><div class="fg"><label>NIM/NIDN</label><input type="text" class="inp" id="fNN" value="${d?.['NIM/NIDN']||''}"></div></div><div class="f-row"><div class="fg"><label>Prodi</label><input type="text" class="inp" id="fPr" value="${d?.Prodi||''}"></div><div class="fg"><label>Status</label><select class="inp" id="fSt" required><option ${d?.Status==='Aktif'?'selected':''}>Aktif</option><option ${d?.Status==='Nonaktif'?'selected':''}>Nonaktif</option></select></div></div><div class="m-ft"><button type="button" class="btn btn-o" onclick="closeModal()">Batal</button><button type="submit" class="btn btn-p"><i class="fas fa-save"></i> ${d?'Update':'Simpan'}</button></div></form>`}

// ==========================================
// SAVE HANDLERS
// ==========================================
async function saveTx(e,type,eid){e.preventDefault();const sheet=type==='income'?'pemasukan':'pengeluaran';const data={date:v('fD'),description:v('fK'),category:v('fC'),amount:parseFloat(v('fJ')),notes:v('fN')};try{showLoad('Menyimpan...');if(eid)await apiWrite({action:'updateData',sheet,id:eid,data});else await apiWrite({action:'addData',sheet,data});closeModal();await loadData();goTo(type==='income'?'pemasukan':'pengeluaran');toast('Berhasil!','success')}catch(er){toast('Gagal: '+er.message,'error')}finally{hideLoad()}}

async function saveSpp(e,eid){e.preventDefault();const data={nim:v('fNIM'),name:v('fNm'),prodi:v('fPr'),angkatan:v('fNIM').substring(0,4),semester:v('fSem'),amount:parseFloat(v('fJ')),status:v('fSt'),payDate:v('fTB')};try{showLoad('Menyimpan...');if(eid)await apiWrite({action:'updateData',sheet:'spp',id:eid,data});else await apiWrite({action:'addData',sheet:'spp',data});closeModal();await loadData();goTo('spp');toast('Berhasil!','success')}catch(er){toast('Gagal: '+er.message,'error')}finally{hideLoad()}}

async function saveDsn(e,eid){e.preventDefault();const data={nidn:v('fNIDN'),nama:v('fNm'),prodi:v('fPr'),jabatan:v('fJb'),gaji:parseFloat(v('fGj')),penelitian:parseFloat(v('fPn')||0),pkm:parseFloat(v('fPk')||0)};try{showLoad('Menyimpan...');if(eid)await apiWrite({action:'updateDosen',id:eid,data});else await apiWrite({action:'addDosen',data});closeModal();await loadData();goTo('dosen');toast('Berhasil!','success')}catch(er){toast('Gagal: '+er.message,'error')}finally{hideLoad()}}

async function saveUsr(e,eid){e.preventDefault();const data={username:v('fUs'),nama:v('fNm'),role:v('fRl'),nimNidn:v('fNN'),prodi:v('fPr'),status:v('fSt')};const pw=v('fPw');if(pw)data.password=pw;if(!eid&&!pw){toast('Password wajib!','error');return}try{showLoad('Menyimpan...');if(eid)await apiWrite({action:'updateUser',id:eid,data});else await apiWrite({action:'addUser',data});closeModal();await loadData();goTo('users');toast('Berhasil!','success')}catch(er){toast('Gagal: '+er.message,'error')}finally{hideLoad()}}

async function delRec(sheet,id,action){if(!confirm('Hapus data ini?'))return;try{showLoad('Menghapus...');await apiWrite({action:action||'deleteData',sheet,id});await loadData();const pg=document.querySelector('.sb-lk.on')?.dataset.pg||'dashboard';goTo(pg);toast('Dihapus!','warning')}catch(er){toast('Gagal: '+er.message,'error')}finally{hideLoad()}}

// ==========================================
// CHARTS
// ==========================================
function makeChart(type){
    const dk=document.documentElement.getAttribute('data-theme')==='dark';
    const gc=dk?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)';const tc=dk?'#8b949e':'#5a6a7b';const cc=dk?'#1c2333':'#fff';
    const ms=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    if(type==='monthly'){const ctx=document.getElementById('cM');if(!ctx)return;if(S.charts.m)S.charts.m.destroy();S.charts.m=new Chart(ctx,{type:'bar',data:{labels:ms,datasets:[{label:'Masuk',data:S.monthly.map(m=>m.income),backgroundColor:'rgba(39,174,96,.75)',borderColor:'#27ae60',borderWidth:2,borderRadius:6,borderSkipped:false},{label:'Keluar',data:S.monthly.map(m=>m.expense),backgroundColor:'rgba(231,76,60,.75)',borderColor:'#e74c3c',borderWidth:2,borderRadius:6,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fRp(c.raw)}`}}},scales:{x:{grid:{display:false},ticks:{color:tc,font:{family:'Poppins',size:10}}},y:{grid:{color:gc},ticks:{color:tc,font:{family:'Poppins',size:10},callback:v=>'Rp '+(v/1e6).toFixed(0)+'jt'}}}}})}
    else if(type==='donut'){const ctx=document.getElementById('cD');if(!ctx)return;if(S.charts.d)S.charts.d.destroy();const cats=['Gaji','Operasional','Infrastruktur','ATK','Kegiatan','Lainnya'];const cols=['#e74c3c','#3498db','#f39c12','#9b59b6','#1abc9c','#95a5a6'];const data=cats.map(c=>S.expense.filter(e=>e.Kategori===c).reduce((s,e)=>s+(parseFloat(e.Jumlah)||0),0));S.charts.d=new Chart(ctx,{type:'doughnut',data:{labels:cats,datasets:[{data,backgroundColor:cols,borderWidth:3,borderColor:cc,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom',labels:{usePointStyle:true,padding:10,color:tc,font:{family:'Poppins',size:9}}},tooltip:{callbacks:{label:c=>`${c.label}: ${fRp(c.raw)}`}}}}})}
    else if(type==='report'){const ctx=document.getElementById('cR');if(!ctx)return;if(S.charts.r)S.charts.r.destroy();S.charts.r=new Chart(ctx,{type:'line',data:{labels:ms,datasets:[{label:'Masuk',data:S.monthly.map(m=>m.income),borderColor:'#27ae60',backgroundColor:'rgba(39,174,96,.08)',fill:true,tension:.4,pointRadius:4,borderWidth:3},{label:'Keluar',data:S.monthly.map(m=>m.expense),borderColor:'#e74c3c',backgroundColor:'rgba(231,76,60,.08)',fill:true,tension:.4,pointRadius:4,borderWidth:3},{label:'Saldo',data:S.monthly.map(m=>m.income-m.expense),borderColor:'#3498db',backgroundColor:'transparent',fill:false,tension:.4,pointRadius:4,borderWidth:3,borderDash:[6,3]}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{usePointStyle:true,color:tc,font:{family:'Poppins',size:10}}},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fRp(c.raw)}`}}},scales:{x:{grid:{display:false},ticks:{color:tc,font:{family:'Poppins',size:10}}},y:{grid:{color:gc},ticks:{color:tc,font:{family:'Poppins',size:10},callback:v=>'Rp '+(v/1e6).toFixed(0)+'jt'}}}}})}
}

// ==========================================
// SIDEBAR & THEME
// ==========================================
function initSidebar(){
    document.getElementById('tbHam').addEventListener('click',()=>{document.getElementById('sb').classList.add('open');document.getElementById('sbOv').classList.add('on')});
    const cls=()=>{document.getElementById('sb').classList.remove('open');document.getElementById('sbOv').classList.remove('on')};
    document.getElementById('sbOv').addEventListener('click',cls);document.getElementById('sbX').addEventListener('click',cls);
}
function closeSb(){document.getElementById('sb').classList.remove('open');document.getElementById('sbOv').classList.remove('on')}

function initTheme(){
    const s=localStorage.getItem('stai_theme')||'light';setTheme(s);
    document.getElementById('thBtn').addEventListener('click',()=>{const c=document.documentElement.getAttribute('data-theme');setTheme(c==='dark'?'light':'dark')});
}
function setTheme(t){document.documentElement.setAttribute('data-theme',t);localStorage.setItem('stai_theme',t);document.getElementById('thIc').className=t==='dark'?'fas fa-sun':'fas fa-moon';setTimeout(()=>Object.keys(S.charts).forEach(k=>{try{makeChart(k==='m'?'monthly':k==='d'?'donut':'report')}catch(e){}}),100)}

// ==========================================
// UI HELPERS
// ==========================================
function showLoad(t){document.getElementById('loadText').textContent=t||'Memuat...';document.getElementById('loadOverlay').classList.add('on')}
function hideLoad(){document.getElementById('loadOverlay').classList.remove('on')}

function toast(msg,type='success'){
    const icons={success:'fa-check-circle',error:'fa-times-circle',warning:'fa-exclamation-triangle',info:'fa-info-circle'};
    const box=document.getElementById('toastBox');const t=document.createElement('div');t.className=`toast ${type}`;
    t.innerHTML=`<i class="toast-i fas ${icons[type]||icons.info}"></i><span class="toast-m">${msg}</span>`;
    box.appendChild(t);setTimeout(()=>{t.style.cssText='opacity:0;transform:translateX(40px);transition:all .3s';setTimeout(()=>t.remove(),300)},3500);
}

new MutationObserver(()=>setTimeout(()=>Object.keys(S.charts).forEach(k=>{try{makeChart(k==='m'?'monthly':k==='d'?'donut':'report')}catch(e){}}),150)).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
