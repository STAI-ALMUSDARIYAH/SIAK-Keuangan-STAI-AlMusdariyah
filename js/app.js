// ==========================================
// SIK STAI Al-Musdariyah Cimahi
// Frontend - Multi Role + Google Sheets
// ==========================================

const API_URL = 'https://script.google.com/macros/s/AKfycby0zxNuVMBq-9UCGH-xa9HbT4tgjgAAgNmFpeGN8YpBOhVCjbjJ1z_OfkESbFgfxQ8-JQ/exec';

// ===== STATE =====
const S = {
    user: null,
    income: [], expense: [], spp: [],
    dosen: [], mahasiswa: [], anggaran: [], users: [],
    summary: null, monthly: [],
    charts: {}
};

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    checkSession();
});

function checkSession() {
    const saved = sessionStorage.getItem('stai_user');
    if (saved) {
        S.user = JSON.parse(saved);
        showApp();
    }
}

// ==========================================
// LOGIN
// ==========================================
async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const errEl = document.getElementById('loginError');
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();

    if (!user || !pass) { errEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Lengkapi semua field'; return; }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    errEl.textContent = '';

    try {
        const url = `${API_URL}?action=login&username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
            S.user = data.user;
            sessionStorage.setItem('stai_user', JSON.stringify(data.user));
            toast('Login berhasil! Selamat datang ' + data.user.nama, 'success');
            showApp();
        } else {
            errEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + (data.error || 'Login gagal');
        }
    } catch (err) {
        errEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Gagal terhubung ke server';
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Masuk</span><i class="fas fa-arrow-right"></i>';
    }
}

function fillLogin(u, p) {
    document.getElementById('loginUser').value = u;
    document.getElementById('loginPass').value = p;
}

function togglePassword() {
    const inp = document.getElementById('loginPass');
    const ic = document.getElementById('passIcon');
    if (inp.type === 'password') { inp.type = 'text'; ic.className = 'fas fa-eye-slash'; }
    else { inp.type = 'password'; ic.className = 'fas fa-eye'; }
}

function handleLogout() {
    if (!confirm('Yakin ingin keluar?')) return;
    S.user = null;
    sessionStorage.removeItem('stai_user');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appShell').style.display = 'none';
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    toast('Berhasil logout', 'info');
}

// ==========================================
// SHOW APP
// ==========================================
async function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appShell').style.display = 'flex';

    // Set user info
    document.getElementById('sUserName').textContent = S.user.nama;
    document.getElementById('sRoleBadge').textContent = S.user.role;
    const avatarIcons = { admin: 'fa-user-shield', dosen: 'fa-chalkboard-teacher', mahasiswa: 'fa-user-graduate' };
    document.getElementById('sAvatar').innerHTML = `<i class="fas ${avatarIcons[S.user.role] || 'fa-user'}"></i>`;

    buildSidebarNav();
    showLoading('Memuat data...');
    await loadDataForRole();
    hideLoading();
    navigateTo('dashboard');
}

// ==========================================
// SIDEBAR NAV (role-based)
// ==========================================
function buildSidebarNav() {
    const nav = document.getElementById('sNav');
    const role = S.user.role;
    let html = '';

    if (role === 'admin') {
        html = `
        <div class="s-nav-section">
            <span class="s-nav-title">MENU UTAMA</span>
            <a class="s-link active" data-page="dashboard"><i class="fas fa-th-large"></i><span>Dashboard</span></a>
            <a class="s-link" data-page="pemasukan"><i class="fas fa-arrow-circle-down"></i><span>Pemasukan</span></a>
            <a class="s-link" data-page="pengeluaran"><i class="fas fa-arrow-circle-up"></i><span>Pengeluaran</span></a>
            <a class="s-link" data-page="spp"><i class="fas fa-graduation-cap"></i><span>Pembayaran SPP</span></a>
        </div>
        <div class="s-nav-section">
            <span class="s-nav-title">DATA MASTER</span>
            <a class="s-link" data-page="data-dosen"><i class="fas fa-chalkboard-teacher"></i><span>Data Dosen</span></a>
            <a class="s-link" data-page="data-mahasiswa"><i class="fas fa-users"></i><span>Data Mahasiswa</span></a>
            <a class="s-link" data-page="anggaran"><i class="fas fa-coins"></i><span>Anggaran</span></a>
        </div>
        <div class="s-nav-section">
            <span class="s-nav-title">LAPORAN</span>
            <a class="s-link" data-page="laporan"><i class="fas fa-chart-line"></i><span>Laporan</span></a>
            <a class="s-link" data-page="rekap"><i class="fas fa-file-invoice-dollar"></i><span>Rekap Bulanan</span></a>
        </div>
        <div class="s-nav-section">
            <span class="s-nav-title">SISTEM</span>
            <a class="s-link" data-page="users"><i class="fas fa-user-cog"></i><span>Manajemen User</span></a>
        </div>`;
    } else if (role === 'dosen') {
        html = `
        <div class="s-nav-section">
            <span class="s-nav-title">MENU DOSEN</span>
            <a class="s-link active" data-page="dashboard"><i class="fas fa-th-large"></i><span>Dashboard</span></a>
            <a class="s-link" data-page="profil-dosen"><i class="fas fa-id-card"></i><span>Profil Saya</span></a>
            <a class="s-link" data-page="anggaran"><i class="fas fa-coins"></i><span>Anggaran Kampus</span></a>
        </div>`;
    } else if (role === 'mahasiswa') {
        html = `
        <div class="s-nav-section">
            <span class="s-nav-title">MENU MAHASISWA</span>
            <a class="s-link active" data-page="dashboard"><i class="fas fa-th-large"></i><span>Dashboard</span></a>
            <a class="s-link" data-page="profil-mhs"><i class="fas fa-id-card"></i><span>Profil Saya</span></a>
            <a class="s-link" data-page="spp-saya"><i class="fas fa-receipt"></i><span>Status SPP</span></a>
        </div>`;
    }

    nav.innerHTML = html;

    // Bind nav clicks
    nav.querySelectorAll('.s-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const page = link.dataset.page;
            nav.querySelectorAll('.s-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            navigateTo(page);
            closeSidebar();
        });
    });
}

// ==========================================
// DATA LOADING
// ==========================================
async function loadDataForRole() {
    const role = S.user.role;
    try {
        if (role === 'admin') {
            const [inc, exp, spp, dsn, mhs, ang, usr, sum, mon] = await Promise.all([
                apiGet('getData', '&sheet=pemasukan'),
                apiGet('getData', '&sheet=pengeluaran'),
                apiGet('getData', '&sheet=spp'),
                apiGet('getDosen'),
                apiGet('getMahasiswa'),
                apiGet('getAnggaran'),
                apiGet('getUsers'),
                apiGet('getSummary'),
                apiGet('getMonthly'),
            ]);
            S.income = inc.data || [];
            S.expense = exp.data || [];
            S.spp = spp.data || [];
            S.dosen = dsn.data || [];
            S.mahasiswa = mhs.data || [];
            S.anggaran = ang.data || [];
            S.users = usr.data || [];
            S.summary = sum.summary;
            S.monthly = mon.monthly || [];
        } else if (role === 'dosen') {
            const [prof, ang, sum] = await Promise.all([
                apiGet('getDosenProfile', `&userId=${S.user.id}`),
                apiGet('getAnggaran'),
                apiGet('getSummary'),
            ]);
            S.dosenProfile = prof.profile || {};
            S.anggaran = ang.data || [];
            S.summary = sum.summary;
        } else if (role === 'mahasiswa') {
            const [prof, sppData, sum] = await Promise.all([
                apiGet('getMahasiswaProfile', `&userId=${S.user.id}`),
                apiGet('getMahasiswaSPP', `&userId=${S.user.id}`),
                apiGet('getSummary'),
            ]);
            S.mhsProfile = prof.profile || {};
            S.mhsSPP = sppData.data || [];
            S.biayaSemester = sppData.biayaPerSemester || 2500000;
            S.summary = sum.summary;
        }
    } catch (err) {
        console.error('Load error:', err);
        toast('Gagal memuat data: ' + err.message, 'error');
    }
}

async function refreshAllData() {
    const icon = document.getElementById('refreshIcon');
    icon.classList.add('fa-spin');
    showLoading('Menyinkronkan data...');
    await loadDataForRole();
    hideLoading();
    icon.classList.remove('fa-spin');
    navigateTo(document.querySelector('.s-link.active')?.dataset.page || 'dashboard');
    toast('Data berhasil diperbarui!', 'success');
}

// ==========================================
// API HELPERS - FIXED CORS
// ==========================================
async function apiGet(action, extra = '') {
    const res = await fetch(`${API_URL}?action=${action}${extra}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
}

// FIX: Semua write operation pakai GET (bypass CORS)
async function apiPost(body) {
    // Encode data as URL parameter
    const params = new URLSearchParams();
    params.set('action', body.action);
    if (body.sheet) params.set('sheet', body.sheet);
    if (body.id) params.set('id', body.id);
    if (body.data) params.set('data', JSON.stringify(body.data));

    const url = `${API_URL}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Gagal menyimpan');
    return result;
}

// ==========================================
// NAVIGATION
// ==========================================
function navigateTo(page) {
    const container = document.getElementById('pageContainer');
    document.getElementById('tbPage').textContent = pageTitle(page);

    const renderers = {
        'dashboard':       () => renderDashboard(),
        'pemasukan':       () => renderPemasukan(),
        'pengeluaran':     () => renderPengeluaran(),
        'spp':             () => renderSPP(),
        'data-dosen':      () => renderDataDosen(),
        'data-mahasiswa':  () => renderDataMahasiswa(),
        'anggaran':        () => renderAnggaran(),
        'laporan':         () => renderLaporan(),
        'rekap':           () => renderRekap(),
        'users':           () => renderUsers(),
        'profil-dosen':    () => renderProfilDosen(),
        'profil-mhs':      () => renderProfilMhs(),
        'spp-saya':        () => renderSPPSaya(),
    };

    container.innerHTML = '';
    const page_div = document.createElement('div');
    page_div.className = 'page active';
    page_div.id = 'pg-' + page;
    container.appendChild(page_div);

    if (renderers[page]) renderers[page]();
    else page_div.innerHTML = '<div class="empty-state"><i class="fas fa-tools"></i><p>Halaman sedang dikembangkan</p></div>';
}

function pageTitle(page) {
    const titles = {
        dashboard:'Dashboard', pemasukan:'Pemasukan', pengeluaran:'Pengeluaran',
        spp:'Pembayaran SPP', 'data-dosen':'Data Dosen', 'data-mahasiswa':'Data Mahasiswa',
        anggaran:'Anggaran Kampus', laporan:'Laporan Keuangan', rekap:'Rekap Bulanan',
        users:'Manajemen User', 'profil-dosen':'Profil Dosen', 'profil-mhs':'Profil Mahasiswa',
        'spp-saya':'Status SPP'
    };
    return titles[page] || page;
}

// ==========================================
// RENDER: DASHBOARD
// ==========================================
function renderDashboard() {
    const pg = document.getElementById('pg-dashboard');
    const role = S.user.role;
    const sum = S.summary || {};

    const dateStr = new Date().toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    const greetings = { admin:'Admin', dosen:'Bapak/Ibu Dosen', mahasiswa:'Mahasiswa/i' };

    let html = `
    <div class="welcome">
        <div class="welcome-info">
            <h1>Assalamu'alaikum, ${greetings[role]}! 👋</h1>
            <p>${S.user.nama} — Sistem Informasi Keuangan STAI Al-Musdariyah Cimahi</p>
            <div class="welcome-meta">
                <span><i class="fas fa-calendar"></i> ${dateStr}</span>
                <span><i class="fas fa-user-tag"></i> ${S.user.role}</span>
            </div>
        </div>
        <div class="welcome-big-icon">
    <img src="assets/logokampus.png" alt="Logo" style="width:80px;height:80px;object-fit:contain;opacity:.7;border-radius:12px;">
</div>
    </div>`;

    if (role === 'admin') {
        html += `
        <div class="stats">
            <div class="stat">
                <div class="stat-ic green"><i class="fas fa-arrow-down"></i></div>
                <div class="stat-data">
                    <small>Total Pemasukan</small>
                    <h3>${fRp(sum.totalIncome)}</h3>
                    <div class="sub"><i class="fas fa-check-circle"></i> Tahun 2024/2025</div>
                </div>
                <div class="stat-bg"><i class="fas fa-wallet"></i></div>
            </div>
            <div class="stat">
                <div class="stat-ic red"><i class="fas fa-arrow-up"></i></div>
                <div class="stat-data">
                    <small>Total Pengeluaran</small>
                    <h3>${fRp(sum.totalExpense)}</h3>
                    <div class="sub"><i class="fas fa-info-circle"></i> Tahun 2024/2025</div>
                </div>
                <div class="stat-bg"><i class="fas fa-money-bill"></i></div>
            </div>
            <div class="stat">
                <div class="stat-ic blue"><i class="fas fa-scale-balanced"></i></div>
                <div class="stat-data">
                    <small>Saldo Kas</small>
                    <h3>${fRp(sum.saldo)}</h3>
                    <div class="sub"><i class="fas fa-shield-alt"></i> ${sum.saldo >= 0 ? 'Sehat' : 'Defisit'}</div>
                </div>
                <div class="stat-bg"><i class="fas fa-landmark"></i></div>
            </div>
            <div class="stat">
                <div class="stat-ic purple"><i class="fas fa-users"></i></div>
                <div class="stat-data">
                    <small>Total Mahasiswa</small>
                    <h3>${sum.mahasiswaStats?.total || 0}</h3>
                    <div class="sub"><i class="fas fa-graduation-cap"></i> PAI: ${sum.mahasiswaStats?.pai||0} | HES: ${sum.mahasiswaStats?.hes||0}</div>
                </div>
                <div class="stat-bg"><i class="fas fa-user-graduate"></i></div>
            </div>
            <div class="stat">
                <div class="stat-ic teal"><i class="fas fa-chalkboard-teacher"></i></div>
                <div class="stat-data">
                    <small>Total Dosen</small>
                    <h3>${sum.dosenStats?.total || 0}</h3>
                    <div class="sub"><i class="fas fa-id-badge"></i> PAI: ${sum.dosenStats?.pai||0} | HES: ${sum.dosenStats?.hes||0}</div>
                </div>
                <div class="stat-bg"><i class="fas fa-chalkboard"></i></div>
            </div>
            <div class="stat">
                <div class="stat-ic orange"><i class="fas fa-receipt"></i></div>
                <div class="stat-data">
                    <small>SPP Lunas</small>
                    <h3>${sum.sppStats?.lunas || 0} <small style="font-size:.7rem;color:var(--text3)">/ ${sum.sppStats?.total||0}</small></h3>
                    <div class="sub"><i class="fas fa-money-check"></i> Biaya: Rp 2.500.000/semester</div>
                </div>
                <div class="stat-bg"><i class="fas fa-file-invoice-dollar"></i></div>
            </div>
        </div>

        <div class="charts-row">
            <div class="chart-box">
                <div class="chart-hd"><h3><i class="fas fa-chart-bar"></i> Grafik Keuangan Bulanan</h3></div>
                <div class="chart-bd"><canvas id="cMonthly"></canvas></div>
            </div>
            <div class="chart-box">
                <div class="chart-hd"><h3><i class="fas fa-chart-pie"></i> Distribusi Pengeluaran</h3></div>
                <div class="chart-bd"><canvas id="cDonut"></canvas></div>
            </div>
        </div>

        <div class="card">
            <div class="card-hd">
                <h3><i class="fas fa-clock"></i> Transaksi Terakhir</h3>
            </div>
            <div class="tbl-wrap"><table class="tbl"><thead><tr>
                <th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th>Jenis</th><th>Jumlah</th>
            </tr></thead><tbody>${recentTxRows()}</tbody></table></div>
        </div>`;

        pg.innerHTML = html;
        setTimeout(() => { initChart('monthly'); initChart('donut'); }, 100);

    } else if (role === 'dosen') {
        const dp = S.dosenProfile || {};
        html += `
        <div class="stats">
            <div class="stat"><div class="stat-ic green"><i class="fas fa-money-bill-wave"></i></div>
                <div class="stat-data"><small>Gaji Bulanan</small><h3>${fRp(dp.Gaji)}</h3></div></div>
            <div class="stat"><div class="stat-ic blue"><i class="fas fa-flask"></i></div>
                <div class="stat-data"><small>Dana Penelitian</small><h3>${fRp(dp.Penelitian)}</h3></div></div>
            <div class="stat"><div class="stat-ic teal"><i class="fas fa-hands-helping"></i></div>
                <div class="stat-data"><small>Dana PkM</small><h3>${fRp(dp.PkM)}</h3></div></div>
            <div class="stat"><div class="stat-ic purple"><i class="fas fa-users"></i></div>
                <div class="stat-data"><small>Total Mahasiswa</small><h3>${sum.mahasiswaStats?.total||0}</h3></div></div>
        </div>
        <div class="profile-card">
            <div class="profile-banner">
                <div class="profile-avatar"><i class="fas fa-chalkboard-teacher"></i></div>
                <div class="profile-name"><h2>${dp.Nama || S.user.nama}</h2><p>${dp.Jabatan || 'Dosen'} — Prodi ${dp.Prodi || '-'}</p></div>
            </div>
            <div class="profile-detail">
                <div class="profile-item"><label>NIDN</label><span>${dp.NIDN || '-'}</span></div>
                <div class="profile-item"><label>Prodi</label><span>${dp.Prodi || '-'}</span></div>
                <div class="profile-item"><label>Jabatan</label><span>${dp.Jabatan || '-'}</span></div>
                <div class="profile-item"><label>Status</label><span class="bdg bdg-green">${dp.Status || 'Aktif'}</span></div>
            </div>
        </div>`;
        pg.innerHTML = html;

    } else if (role === 'mahasiswa') {
        const mp = S.mhsProfile || {};
        const paid = parseFloat(mp['Total Bayar']) || 0;
        const pct = Math.min(100, Math.round((paid / S.biayaSemester) * 100));
        const stClass = mp['Status SPP'] === 'Lunas' ? 'lunas' : mp['Status SPP'] === 'Cicilan' ? 'cicilan' : 'belum';

        html += `
        <div class="stats">
            <div class="stat"><div class="stat-ic blue"><i class="fas fa-university"></i></div>
                <div class="stat-data"><small>Biaya Per Semester</small><h3>${fRp(S.biayaSemester)}</h3></div></div>
            <div class="stat"><div class="stat-ic green"><i class="fas fa-check-circle"></i></div>
                <div class="stat-data"><small>Sudah Dibayar</small><h3>${fRp(paid)}</h3></div></div>
            <div class="stat"><div class="stat-ic ${paid >= S.biayaSemester ? 'green':'red'}"><i class="fas fa-${paid >= S.biayaSemester ? 'check':'exclamation-triangle'}"></i></div>
                <div class="stat-data"><small>Sisa Tagihan</small><h3>${fRp(Math.max(0,S.biayaSemester - paid))}</h3></div></div>
        </div>

        <div class="spp-info-card">
            <div class="spp-circle ${stClass}">
                <span class="pct">${pct}%</span>
                <span class="pct-label">Terbayar</span>
            </div>
            <div class="spp-info-detail">
                <h3>${mp.Nama || S.user.nama}</h3>
                <p>NIM: ${mp.NIM || '-'} | Prodi: ${mp.Prodi || '-'}</p>
                <p>Angkatan: ${mp.Angkatan || '-'} | Semester: ${mp.Semester || '-'}</p>
                <span class="bdg ${stClass === 'lunas' ? 'bdg-green' : stClass === 'cicilan' ? 'bdg-yellow' : 'bdg-red'}">
                    ${mp['Status SPP'] || 'Belum Bayar'}
                </span>
            </div>
        </div>`;
        pg.innerHTML = html;
    }
}

function recentTxRows() {
    const all = [
        ...S.income.map(i => ({...i, _t:'in'})),
        ...S.expense.map(e => ({...e, _t:'out'}))
    ].sort((a,b) => new Date(b.Tanggal) - new Date(a.Tanggal)).slice(0,8);

    if (!all.length) return '<tr><td colspan="5" class="empty-state"><p>Belum ada transaksi</p></td></tr>';
    return all.map(tx => {
        const isIn = tx._t === 'in';
        return `<tr>
            <td>${fDate(tx.Tanggal)}</td>
            <td>${trunc(tx.Keterangan,40)}</td>
            <td><span class="bdg bdg-blue">${tx.Kategori}</span></td>
            <td><span class="bdg ${isIn?'bdg-green':'bdg-red'}"><i class="fas fa-arrow-${isIn?'down':'up'}"></i> ${isIn?'Masuk':'Keluar'}</span></td>
            <td style="font-weight:700;color:${isIn?'var(--green)':'var(--red)'}">${isIn?'+':'-'}${fRp(tx.Jumlah)}</td>
        </tr>`;
    }).join('');
}

// ==========================================
// RENDER: PEMASUKAN
// ==========================================
function renderPemasukan() {
    const pg = document.getElementById('pg-pemasukan');
    pg.innerHTML = `
    <div class="page-bar">
        <div><h2><i class="fas fa-arrow-circle-down"></i> Data Pemasukan</h2><p>Kelola pemasukan kampus STAI Al-Musdariyah</p></div>
        <button class="btn btn-p" onclick="openFormModal('income')"><i class="fas fa-plus"></i> Tambah</button>
    </div>
    <div class="card">
        <div class="card-hd"><h3>Daftar Pemasukan</h3><span class="count-badge">${S.income.length} data</span></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr>
            <th>No</th><th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th>Jumlah</th><th>Aksi</th>
        </tr></thead><tbody>${S.income.length ? S.income.map((r,i)=>`<tr>
            <td>${i+1}</td><td>${fDate(r.Tanggal)}</td><td>${trunc(r.Keterangan,45)}</td>
            <td><span class="bdg bdg-blue">${r.Kategori}</span></td>
            <td style="font-weight:700;color:var(--green)">+${fRp(r.Jumlah)}</td>
            <td><div style="display:flex;gap:3px">
                <button class="btn-ic edit" onclick="openFormModal('income','${r.ID}')"><i class="fas fa-edit"></i></button>
                <button class="btn-ic del" onclick="delRecord('pemasukan','${r.ID}')"><i class="fas fa-trash"></i></button>
            </div></td></tr>`).join('') :
            '<tr><td colspan="6" class="empty-state"><i class="fas fa-inbox"></i><p>Belum ada data</p></td></tr>'}</tbody></table></div>
    </div>`;
}

// ==========================================
// RENDER: PENGELUARAN
// ==========================================
function renderPengeluaran() {
    const pg = document.getElementById('pg-pengeluaran');
    pg.innerHTML = `
    <div class="page-bar">
        <div><h2><i class="fas fa-arrow-circle-up"></i> Data Pengeluaran</h2><p>Kelola pengeluaran kampus</p></div>
        <button class="btn btn-d" onclick="openFormModal('expense')"><i class="fas fa-plus"></i> Tambah</button>
    </div>
    <div class="card">
        <div class="card-hd"><h3>Daftar Pengeluaran</h3><span class="count-badge">${S.expense.length} data</span></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr>
            <th>No</th><th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th>Jumlah</th><th>Aksi</th>
        </tr></thead><tbody>${S.expense.length ? S.expense.map((r,i)=>`<tr>
            <td>${i+1}</td><td>${fDate(r.Tanggal)}</td><td>${trunc(r.Keterangan,45)}</td>
            <td><span class="bdg bdg-purple">${r.Kategori}</span></td>
            <td style="font-weight:700;color:var(--red)">-${fRp(r.Jumlah)}</td>
            <td><div style="display:flex;gap:3px">
                <button class="btn-ic edit" onclick="openFormModal('expense','${r.ID}')"><i class="fas fa-edit"></i></button>
                <button class="btn-ic del" onclick="delRecord('pengeluaran','${r.ID}')"><i class="fas fa-trash"></i></button>
            </div></td></tr>`).join('') :
            '<tr><td colspan="6" class="empty-state"><i class="fas fa-inbox"></i><p>Belum ada data</p></td></tr>'}</tbody></table></div>
    </div>`;
}

// ==========================================
// RENDER: SPP
// ==========================================
function renderSPP() {
    const pg = document.getElementById('pg-spp');
    const lunas = S.spp.filter(s=>s.Status==='Lunas').length;
    const belum = S.spp.filter(s=>s.Status==='Belum Bayar').length;
    const cicil = S.spp.filter(s=>s.Status==='Cicilan').length;

    pg.innerHTML = `
    <div class="page-bar">
        <div><h2><i class="fas fa-graduation-cap"></i> Pembayaran SPP</h2><p>Biaya per semester: Rp 2.500.000</p></div>
        <button class="btn btn-p" onclick="openFormModal('spp')"><i class="fas fa-plus"></i> Input Pembayaran</button>
    </div>
    <div class="spp-sum">
        <div class="spp-sc lunas"><i class="fas fa-check-circle"></i><div><small>Lunas</small><h3>${lunas}</h3></div></div>
        <div class="spp-sc belum"><i class="fas fa-times-circle"></i><div><small>Belum Bayar</small><h3>${belum}</h3></div></div>
        <div class="spp-sc cicil"><i class="fas fa-pause-circle"></i><div><small>Cicilan</small><h3>${cicil}</h3></div></div>
        <div class="spp-sc total"><i class="fas fa-users"></i><div><small>Total</small><h3>${S.spp.length}</h3></div></div>
    </div>
    <div class="card">
        <div class="card-hd"><h3>Data SPP</h3><span class="count-badge">${S.spp.length} data</span></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr>
            <th>No</th><th>NIM</th><th>Nama</th><th>Prodi</th><th>Sem</th><th>Jumlah</th><th>Status</th><th>Aksi</th>
        </tr></thead><tbody>${S.spp.length ? S.spp.map((r,i)=>{
            const bc = r.Status==='Lunas'?'bdg-green':r.Status==='Cicilan'?'bdg-yellow':'bdg-red';
            return `<tr><td>${i+1}</td><td><strong>${r.NIM}</strong></td><td>${r.Nama}</td>
            <td>${trunc(r.Prodi,20)}</td><td>${r.Semester}</td>
            <td style="font-weight:700">${fRp(r.Jumlah)}</td>
            <td><span class="bdg ${bc}">${r.Status}</span></td>
            <td><div style="display:flex;gap:3px">
                <button class="btn-ic edit" onclick="openFormModal('spp','${r.ID}')"><i class="fas fa-edit"></i></button>
                <button class="btn-ic del" onclick="delRecord('spp','${r.ID}')"><i class="fas fa-trash"></i></button>
            </div></td></tr>`;}).join('') :
            '<tr><td colspan="8" class="empty-state"><p>Belum ada data</p></td></tr>'}</tbody></table></div>
    </div>`;
}

// ==========================================
// RENDER: DATA DOSEN
// ==========================================
function renderDataDosen() {
    const pg = document.getElementById('pg-data-dosen');
    pg.innerHTML = `
    <div class="page-bar">
        <div><h2><i class="fas fa-chalkboard-teacher"></i> Data Dosen</h2><p>PAI: ${S.dosen.filter(d=>d.Prodi==='PAI').length} | HES: ${S.dosen.filter(d=>d.Prodi==='HES').length}</p></div>
        <button class="btn btn-p" onclick="openFormModal('dosen')"><i class="fas fa-plus"></i> Tambah Dosen</button>
    </div>
    <div class="card">
        <div class="card-hd"><h3>Daftar Dosen</h3><span class="count-badge">${S.dosen.length} dosen</span></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr>
            <th>No</th><th>NIDN</th><th>Nama</th><th>Prodi</th><th>Jabatan</th><th>Gaji</th><th>Penelitian</th><th>PkM</th><th>Aksi</th>
        </tr></thead><tbody>${S.dosen.length ? S.dosen.map((r,i)=>`<tr>
            <td>${i+1}</td><td>${r.NIDN}</td><td><strong>${r.Nama}</strong></td>
            <td><span class="bdg ${r.Prodi==='PAI'?'bdg-blue':'bdg-teal'}">${r.Prodi}</span></td>
            <td>${r.Jabatan}</td>
            <td style="font-weight:600">${fRp(r.Gaji)}</td>
            <td>${fRp(r.Penelitian)}</td><td>${fRp(r.PkM)}</td>
            <td><div style="display:flex;gap:3px">
                <button class="btn-ic edit" onclick="openFormModal('dosen','${r.ID}')"><i class="fas fa-edit"></i></button>
                <button class="btn-ic del" onclick="delDosen('${r.ID}')"><i class="fas fa-trash"></i></button>
            </div></td></tr>`).join('') :
            '<tr><td colspan="9" class="empty-state"><p>Belum ada data</p></td></tr>'}</tbody></table></div>
    </div>`;
}

// ==========================================
// RENDER: DATA MAHASISWA (summary)
// ==========================================
function renderDataMahasiswa() {
    const pg = document.getElementById('pg-data-mahasiswa');
    const stats = S.summary?.mahasiswaStats;
    const perAngkatan = stats?.perAngkatan || [];

    pg.innerHTML = `
    <div class="page-bar">
        <div><h2><i class="fas fa-users"></i> Data Mahasiswa</h2><p>Total: ${stats?.total||0} mahasiswa aktif</p></div>
    </div>
    <div class="stats">
        <div class="stat"><div class="stat-ic blue"><i class="fas fa-book-quran"></i></div>
            <div class="stat-data"><small>S1 Pendidikan Agama Islam</small><h3>${stats?.pai||0}</h3></div></div>
        <div class="stat"><div class="stat-ic teal"><i class="fas fa-scale-balanced"></i></div>
            <div class="stat-data"><small>S1 Hukum Ekonomi Syariah</small><h3>${stats?.hes||0}</h3></div></div>
        <div class="stat"><div class="stat-ic purple"><i class="fas fa-users"></i></div>
            <div class="stat-data"><small>Total Seluruh Prodi</small><h3>${stats?.total||0}</h3></div></div>
    </div>
    <div class="card">
        <div class="card-hd"><h3><i class="fas fa-layer-group"></i> Distribusi Per Angkatan</h3></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr>
            <th>Angkatan</th><th>S1 PAI</th><th>S1 HES (Muamalah)</th><th>Total</th>
        </tr></thead><tbody>${perAngkatan.map(a=>`<tr>
            <td><strong>${a.angkatan}</strong></td>
            <td>${a.pai}</td><td>${a.hes}</td>
            <td><strong>${a.pai+a.hes}</strong></td>
        </tr>`).join('')}</tbody></table></div>
    </div>`;
}

// ==========================================
// RENDER: ANGGARAN
// ==========================================
function renderAnggaran() {
    const pg = document.getElementById('pg-anggaran');
    const categories = {};
    S.anggaran.forEach(a => {
        if (!categories[a.Kategori]) categories[a.Kategori] = [];
        categories[a.Kategori].push(a);
    });

    let cardsHtml = '';
    for (const [cat, items] of Object.entries(categories)) {
        const total = items.reduce((s,i) => s + (parseFloat(i.Nominal)||0), 0);
        cardsHtml += `
        <div class="ang-card">
            <div class="ang-card-hd">
                <h4>${cat}</h4>
                <span class="ang-total">${fRp(total)}</span>
            </div>
            <div class="ang-items">${items.map(i => `
                <div class="ang-item">
                    <span>${i.Item || i.SubKategori}</span>
                    <span>${fRp(i.Nominal)}</span>
                </div>`).join('')}
            </div>
        </div>`;
    }

    const grandTotal = S.anggaran.reduce((s,a) => s + (parseFloat(a.Nominal)||0), 0);

    pg.innerHTML = `
    <div class="page-bar">
        <div><h2><i class="fas fa-coins"></i> Anggaran Kampus</h2><p>STAI Al-Musdariyah Cimahi — Prodi PAI & HES</p></div>
        <div class="btn btn-o"><i class="fas fa-calculator"></i> Total: ${fRp(grandTotal)}</div>
    </div>
    <div class="ang-grid">${cardsHtml}</div>`;
}

// ==========================================
// RENDER: LAPORAN
// ==========================================
function renderLaporan() {
    const pg = document.getElementById('pg-laporan');
    const s = S.summary || {};
    pg.innerHTML = `
    <div class="page-bar">
        <div><h2><i class="fas fa-chart-line"></i> Laporan Keuangan</h2><p>Tahun Akademik 2024/2025</p></div>
    </div>
    <div class="report-cards">
        <div class="rpt-card"><small><i class="fas fa-arrow-down"></i> Total Pemasukan</small><h2 class="txt-g">${fRp(s.totalIncome)}</h2></div>
        <div class="rpt-card"><small><i class="fas fa-arrow-up"></i> Total Pengeluaran</small><h2 class="txt-r">${fRp(s.totalExpense)}</h2></div>
        <div class="rpt-card"><small><i class="fas fa-balance-scale"></i> Saldo Bersih</small><h2 class="txt-b">${fRp(s.saldo)}</h2></div>
    </div>
    <div class="chart-box"><div class="chart-hd"><h3><i class="fas fa-chart-area"></i> Tren Keuangan</h3></div>
        <div class="chart-bd" style="min-height:350px"><canvas id="cReport"></canvas></div>
    </div>`;
    setTimeout(() => initChart('report'), 100);
}

// ==========================================
// RENDER: REKAP
// ==========================================
function renderRekap() {
    const pg = document.getElementById('pg-rekap');
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    pg.innerHTML = `
    <div class="page-bar"><div><h2><i class="fas fa-file-invoice-dollar"></i> Rekap Bulanan</h2></div></div>
    <div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>Bulan</th><th>Pemasukan</th><th>Pengeluaran</th><th>Saldo</th><th>Status</th>
    </tr></thead><tbody>${months.map((m,i)=>{
        const md = S.monthly[i] || {income:0,expense:0};
        const s = md.income - md.expense;
        return `<tr><td><strong>${m}</strong></td>
            <td style="color:var(--green);font-weight:600">${fRp(md.income)}</td>
            <td style="color:var(--red);font-weight:600">${fRp(md.expense)}</td>
            <td style="font-weight:700;color:${s>=0?'var(--green)':'var(--red)'}">${fRp(s)}</td>
            <td><span class="bdg ${s>=0?'bdg-green':'bdg-red'}">${s>=0?'Surplus':'Defisit'}</span></td></tr>`;
    }).join('')}</tbody></table></div></div>`;
}

// ==========================================
// RENDER: USERS
// ==========================================
function renderUsers() {
    const pg = document.getElementById('pg-users');
    pg.innerHTML = `
    <div class="page-bar">
        <div><h2><i class="fas fa-user-cog"></i> Manajemen User</h2><p>Kelola akun login admin, dosen, mahasiswa</p></div>
        <button class="btn btn-p" onclick="openFormModal('user')"><i class="fas fa-plus"></i> Tambah User</button>
    </div>
    <div class="card">
        <div class="card-hd"><h3>Daftar User</h3><span class="count-badge">${S.users.length} user</span></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr>
            <th>No</th><th>Username</th><th>Nama</th><th>Role</th><th>NIM/NIDN</th><th>Status</th><th>Aksi</th>
        </tr></thead><tbody>${S.users.map((u,i)=>{
            const rc = u.Role==='admin'?'bdg-red':u.Role==='dosen'?'bdg-blue':'bdg-green';
            return `<tr><td>${i+1}</td><td><strong>${u.Username}</strong></td><td>${u.Nama}</td>
            <td><span class="bdg ${rc}">${u.Role}</span></td><td>${u['NIM/NIDN']||'-'}</td>
            <td><span class="bdg ${u.Status==='Aktif'?'bdg-green':'bdg-red'}">${u.Status}</span></td>
            <td><div style="display:flex;gap:3px">
                <button class="btn-ic edit" onclick="openFormModal('user','${u.ID}')"><i class="fas fa-edit"></i></button>
                <button class="btn-ic del" onclick="delUser('${u.ID}')"><i class="fas fa-trash"></i></button>
            </div></td></tr>`;}).join('')}</tbody></table></div>
    </div>`;
}

// ==========================================
// RENDER: PROFIL DOSEN
// ==========================================
function renderProfilDosen() {
    const pg = document.getElementById('pg-profil-dosen');
    const dp = S.dosenProfile || {};
    pg.innerHTML = `
    <div class="profile-card">
        <div class="profile-banner">
            <div class="profile-avatar"><i class="fas fa-chalkboard-teacher"></i></div>
            <div class="profile-name"><h2>${dp.Nama || S.user.nama}</h2><p>${dp.Jabatan||'Dosen'} — Prodi ${dp.Prodi||'-'}</p></div>
        </div>
        <div class="profile-detail">
            <div class="profile-item"><label>NIDN</label><span>${dp.NIDN||'-'}</span></div>
            <div class="profile-item"><label>Program Studi</label><span>${dp.Prodi||'-'}</span></div>
            <div class="profile-item"><label>Jabatan</label><span>${dp.Jabatan||'-'}</span></div>
            <div class="profile-item"><label>Gaji Bulanan</label><span style="color:var(--green);font-weight:700">${fRp(dp.Gaji)}</span></div>
            <div class="profile-item"><label>Dana Penelitian</label><span style="color:var(--blue);font-weight:700">${fRp(dp.Penelitian)}</span></div>
            <div class="profile-item"><label>Dana PkM</label><span style="color:var(--teal);font-weight:700">${fRp(dp.PkM)}</span></div>
            <div class="profile-item"><label>Status</label><span class="bdg bdg-green">${dp.Status||'Aktif'}</span></div>
        </div>
    </div>`;
}

// ==========================================
// RENDER: PROFIL MHS
// ==========================================
function renderProfilMhs() {
    const pg = document.getElementById('pg-profil-mhs');
    const mp = S.mhsProfile || {};
    pg.innerHTML = `
    <div class="profile-card">
        <div class="profile-banner" style="background:linear-gradient(135deg,var(--purple),var(--blue),var(--teal))">
            <div class="profile-avatar"><i class="fas fa-user-graduate"></i></div>
            <div class="profile-name"><h2>${mp.Nama || S.user.nama}</h2><p>Mahasiswa — ${mp.Prodi||'-'}</p></div>
        </div>
        <div class="profile-detail">
            <div class="profile-item"><label>NIM</label><span>${mp.NIM||'-'}</span></div>
            <div class="profile-item"><label>Program Studi</label><span>${mp.Prodi||'-'}</span></div>
            <div class="profile-item"><label>Angkatan</label><span>${mp.Angkatan||'-'}</span></div>
            <div class="profile-item"><label>Semester</label><span>Semester ${mp.Semester||'-'}</span></div>
            <div class="profile-item"><label>Status SPP</label><span class="bdg ${mp['Status SPP']==='Lunas'?'bdg-green':'bdg-red'}">${mp['Status SPP']||'-'}</span></div>
            <div class="profile-item"><label>Total Bayar</label><span style="font-weight:700;color:var(--green)">${fRp(mp['Total Bayar'])}</span></div>
        </div>
    </div>`;
}

// ==========================================
// RENDER: SPP SAYA (mahasiswa)
// ==========================================
function renderSPPSaya() {
    const pg = document.getElementById('pg-spp-saya');
    const paid = S.mhsSPP.reduce((s,r) => s + (parseFloat(r.Jumlah)||0), 0);
    const sisa = Math.max(0, S.biayaSemester - paid);
    const pct  = Math.min(100, Math.round((paid/S.biayaSemester)*100));

    pg.innerHTML = `
    <div class="page-bar"><div><h2><i class="fas fa-receipt"></i> Status SPP Saya</h2><p>Biaya per semester: Rp 2.500.000</p></div></div>
    <div class="stats">
        <div class="stat"><div class="stat-ic blue"><i class="fas fa-money-bill"></i></div>
            <div class="stat-data"><small>Biaya Semester</small><h3>${fRp(S.biayaSemester)}</h3></div></div>
        <div class="stat"><div class="stat-ic green"><i class="fas fa-check"></i></div>
            <div class="stat-data"><small>Sudah Dibayar</small><h3>${fRp(paid)}</h3></div></div>
        <div class="stat"><div class="stat-ic ${sisa>0?'red':'green'}"><i class="fas fa-${sisa>0?'exclamation':'check-double'}"></i></div>
            <div class="stat-data"><small>Sisa Tagihan</small><h3>${fRp(sisa)}</h3></div></div>
    </div>
    <div class="card">
        <div class="card-hd"><h3><i class="fas fa-history"></i> Riwayat Pembayaran</h3></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr>
            <th>No</th><th>Tanggal</th><th>Semester</th><th>Jumlah</th><th>Status</th>
        </tr></thead><tbody>${S.mhsSPP.length ? S.mhsSPP.map((r,i)=>`<tr>
            <td>${i+1}</td><td>${fDate(r['Tgl Bayar'])}</td><td>Sem ${r.Semester}</td>
            <td style="font-weight:700">${fRp(r.Jumlah)}</td>
            <td><span class="bdg ${r.Status==='Lunas'?'bdg-green':r.Status==='Cicilan'?'bdg-yellow':'bdg-red'}">${r.Status}</span></td>
        </tr>`).join('') : '<tr><td colspan="5" class="empty-state"><p>Belum ada riwayat pembayaran</p></td></tr>'
        }</tbody></table></div>
    </div>`;
}

// ==========================================
// MODAL FORMS
// ==========================================
function openFormModal(type, editId) {
    const title = document.getElementById('modalTitle');
    const body  = document.getElementById('modalBody');
    const isEdit = !!editId;
    let item = null;

    if (type === 'income') {
        if (isEdit) item = S.income.find(r => r.ID === editId);
        title.textContent = isEdit ? '✏️ Edit Pemasukan' : '💰 Tambah Pemasukan';
        body.innerHTML = txForm('income', item);
    } else if (type === 'expense') {
        if (isEdit) item = S.expense.find(r => r.ID === editId);
        title.textContent = isEdit ? '✏️ Edit Pengeluaran' : '💸 Tambah Pengeluaran';
        body.innerHTML = txForm('expense', item);
    } else if (type === 'spp') {
        if (isEdit) item = S.spp.find(r => r.ID === editId);
        title.textContent = isEdit ? '✏️ Edit SPP' : '🎓 Input Pembayaran SPP';
        body.innerHTML = sppFormHtml(item);
    } else if (type === 'dosen') {
        if (isEdit) item = S.dosen.find(r => r.ID === editId);
        title.textContent = isEdit ? '✏️ Edit Dosen' : '👨‍🏫 Tambah Dosen';
        body.innerHTML = dosenFormHtml(item);
    } else if (type === 'user') {
        if (isEdit) item = S.users.find(r => r.ID === editId);
        title.textContent = isEdit ? '✏️ Edit User' : '👤 Tambah User';
        body.innerHTML = userFormHtml(item);
    }

    document.getElementById('modalBg').classList.add('open');
}

function closeModal() { document.getElementById('modalBg').classList.remove('open'); }
document.getElementById('modalBg').addEventListener('click', e => { if(e.target===e.currentTarget) closeModal(); });

function txForm(type, d) {
    const cats = type==='income'
        ? ['SPP','Pendaftaran','Donasi','Hibah','Lainnya']
        : ['Gaji','Operasional','Infrastruktur','ATK','Kegiatan','Lainnya'];
    return `<form onsubmit="submitTx(event,'${type}','${d?.ID||''}')">
        <div class="form-row">
            <div class="f-group"><label>Tanggal</label><input type="date" class="inp" id="mDate" value="${d?.Tanggal||today()}" required></div>
            <div class="f-group"><label>Kategori</label><select class="inp" id="mCat" required><option value="">Pilih...</option>${cats.map(c=>`<option ${d?.Kategori===c?'selected':''} value="${c}">${c}</option>`).join('')}</select></div>
        </div>
        <div class="f-group"><label>Keterangan</label><input type="text" class="inp" id="mDesc" value="${d?.Keterangan||''}" placeholder="Deskripsi..." required></div>
        <div class="f-group"><label>Jumlah (Rp)</label><input type="number" class="inp" id="mAmt" value="${d?.Jumlah||''}" min="1" required></div>
        <div class="f-group"><label>Catatan</label><textarea class="inp" id="mNotes" placeholder="Opsional...">${d?.Catatan||''}</textarea></div>
        <div class="modal-foot"><button type="button" class="btn btn-o" onclick="closeModal()">Batal</button><button type="submit" class="btn ${type==='income'?'btn-p':'btn-d'}"><i class="fas fa-save"></i> ${d?'Update':'Simpan'}</button></div>
    </form>`;
}

function sppFormHtml(d) {
    return `<form onsubmit="submitSPP(event,'${d?.ID||''}')">
        <div class="form-row">
            <div class="f-group"><label>NIM</label><input type="text" class="inp" id="mNIM" value="${d?.NIM||''}" required></div>
            <div class="f-group"><label>Semester</label><select class="inp" id="mSem" required>${[1,2,3,4,5,6,7,8].map(s=>`<option ${parseInt(d?.Semester)===s?'selected':''} value="${s}">Sem ${s}</option>`).join('')}</select></div>
        </div>
        <div class="f-group"><label>Nama</label><input type="text" class="inp" id="mName" value="${d?.Nama||''}" required></div>
        <div class="f-group"><label>Program Studi</label><select class="inp" id="mProdi" required><option value="">Pilih...</option>${['S1 Pendidikan Agama Islam','S1 Hukum Ekonomi Syariah (Muamalah)'].map(p=>`<option ${d?.Prodi===p?'selected':''} value="${p}">${p}</option>`).join('')}</select></div>
        <div class="form-row">
            <div class="f-group"><label>Jumlah Bayar (Rp)</label><input type="number" class="inp" id="mAmt" value="${d?.Jumlah||2500000}" min="1" required></div>
            <div class="f-group"><label>Status</label><select class="inp" id="mStatus" required>${['Lunas','Cicilan','Belum Bayar'].map(s=>`<option ${d?.Status===s?'selected':''} value="${s}">${s}</option>`).join('')}</select></div>
        </div>
        <div class="f-group"><label>Tanggal Bayar</label><input type="date" class="inp" id="mPayDate" value="${d?.['Tgl Bayar']||today()}"></div>
        <div class="modal-foot"><button type="button" class="btn btn-o" onclick="closeModal()">Batal</button><button type="submit" class="btn btn-p"><i class="fas fa-save"></i> ${d?'Update':'Simpan'}</button></div>
    </form>`;
}

function dosenFormHtml(d) {
    return `<form onsubmit="submitDosen(event,'${d?.ID||''}')">
        <div class="form-row">
            <div class="f-group"><label>NIDN</label><input type="text" class="inp" id="mNIDN" value="${d?.NIDN||''}" required></div>
            <div class="f-group"><label>Prodi</label><select class="inp" id="mProdi" required><option value="PAI" ${d?.Prodi==='PAI'?'selected':''}>PAI</option><option value="HES" ${d?.Prodi==='HES'?'selected':''}>HES</option></select></div>
        </div>
        <div class="f-group"><label>Nama Lengkap</label><input type="text" class="inp" id="mName" value="${d?.Nama||''}" required></div>
        <div class="f-group"><label>Jabatan</label><input type="text" class="inp" id="mJabatan" value="${d?.Jabatan||'Dosen Tetap'}" required></div>
        <div class="form-row">
            <div class="f-group"><label>Gaji (Rp)</label><input type="number" class="inp" id="mGaji" value="${d?.Gaji||0}" min="0" required></div>
            <div class="f-group"><label>Dana Penelitian (Rp)</label><input type="number" class="inp" id="mPenelitian" value="${d?.Penelitian||0}" min="0"></div>
        </div>
        <div class="f-group"><label>Dana PkM (Rp)</label><input type="number" class="inp" id="mPkM" value="${d?.PkM||0}" min="0"></div>
        <div class="modal-foot"><button type="button" class="btn btn-o" onclick="closeModal()">Batal</button><button type="submit" class="btn btn-p"><i class="fas fa-save"></i> ${d?'Update':'Simpan'}</button></div>
    </form>`;
}

function userFormHtml(d) {
    return `<form onsubmit="submitUser(event,'${d?.ID||''}')">
        <div class="form-row">
            <div class="f-group"><label>Username</label><input type="text" class="inp" id="mUser" value="${d?.Username||''}" required></div>
            <div class="f-group"><label>Password</label><input type="text" class="inp" id="mPass" value="" placeholder="${d?'Kosongkan jika tidak diubah':'Password...'}" ${d?'':'required'}></div>
        </div>
        <div class="f-group"><label>Nama Lengkap</label><input type="text" class="inp" id="mName" value="${d?.Nama||''}" required></div>
        <div class="form-row">
            <div class="f-group"><label>Role</label><select class="inp" id="mRole" required>${['admin','dosen','mahasiswa'].map(r=>`<option ${d?.Role===r?'selected':''} value="${r}">${r}</option>`).join('')}</select></div>
            <div class="f-group"><label>NIM/NIDN</label><input type="text" class="inp" id="mNimNidn" value="${d?.['NIM/NIDN']||''}"></div>
        </div>
        <div class="form-row">
            <div class="f-group"><label>Prodi</label><input type="text" class="inp" id="mProdi" value="${d?.Prodi||''}"></div>
            <div class="f-group"><label>Status</label><select class="inp" id="mStatus" required><option ${d?.Status==='Aktif'?'selected':''} value="Aktif">Aktif</option><option ${d?.Status==='Nonaktif'?'selected':''} value="Nonaktif">Nonaktif</option></select></div>
        </div>
        <div class="modal-foot"><button type="button" class="btn btn-o" onclick="closeModal()">Batal</button><button type="submit" class="btn btn-p"><i class="fas fa-save"></i> ${d?'Update':'Simpan'}</button></div>
    </form>`;
}

// ==========================================
// SUBMIT HANDLERS
// ==========================================
async function submitTx(e, type, editId) {
    e.preventDefault();
    const sheet = type === 'income' ? 'pemasukan' : 'pengeluaran';
    const data = {
        date: v('mDate'), description: v('mDesc'), category: v('mCat'),
        amount: parseFloat(v('mAmt')), notes: v('mNotes')
    };
    try {
        showLoading('Menyimpan...');
        if (editId) await apiPost({action:'updateData', sheet, id:editId, data});
        else await apiPost({action:'addData', sheet, data});
        closeModal();
        await loadDataForRole();
        navigateTo(type === 'income' ? 'pemasukan' : 'pengeluaran');
        toast(`Data ${type==='income'?'pemasukan':'pengeluaran'} berhasil ${editId?'diupdate':'ditambahkan'}!`, 'success');
    } catch(err) { toast('Gagal: '+err.message,'error'); }
    finally { hideLoading(); }
}

async function submitSPP(e, editId) {
    e.preventDefault();
    const data = {
        nim: v('mNIM'), name: v('mName'), prodi: v('mProdi'),
        angkatan: v('mNIM').substring(0,4),
        semester: v('mSem'), amount: parseFloat(v('mAmt')),
        status: v('mStatus'), payDate: v('mPayDate')
    };
    try {
        showLoading('Menyimpan...');
        if (editId) await apiPost({action:'updateData', sheet:'spp', id:editId, data});
        else await apiPost({action:'addData', sheet:'spp', data});
        closeModal();
        await loadDataForRole(); navigateTo('spp');
        toast('Data SPP berhasil disimpan!', 'success');
    } catch(err) { toast('Gagal: '+err.message,'error'); }
    finally { hideLoading(); }
}

async function submitDosen(e, editId) {
    e.preventDefault();
    const data = {
        nidn: v('mNIDN'), nama: v('mName'), prodi: v('mProdi'),
        jabatan: v('mJabatan'), gaji: parseFloat(v('mGaji')),
        penelitian: parseFloat(v('mPenelitian')||0), pkm: parseFloat(v('mPkM')||0)
    };
    try {
        showLoading('Menyimpan...');
        if (editId) await apiPost({action:'updateDosen', id:editId, data});
        else await apiPost({action:'addDosen', data});
        closeModal();
        await loadDataForRole(); navigateTo('data-dosen');
        toast('Data dosen berhasil disimpan!', 'success');
    } catch(err) { toast('Gagal: '+err.message,'error'); }
    finally { hideLoading(); }
}

async function submitUser(e, editId) {
    e.preventDefault();
    const data = {
        username: v('mUser'), nama: v('mName'), role: v('mRole'),
        nimNidn: v('mNimNidn'), prodi: v('mProdi'), status: v('mStatus')
    };
    const pass = v('mPass');
    if (pass) data.password = pass;
    if (!editId && !pass) { toast('Password wajib diisi untuk user baru','error'); return; }
    try {
        showLoading('Menyimpan...');
        if (editId) await apiPost({action:'updateUser', id:editId, data});
        else await apiPost({action:'addUser', data});
        closeModal();
        await loadDataForRole(); navigateTo('users');
        toast('User berhasil disimpan!', 'success');
    } catch(err) { toast('Gagal: '+err.message,'error'); }
    finally { hideLoading(); }
}

// ==========================================
// DELETE HANDLERS
// ==========================================
async function delRecord(sheet, id) {
    if(!confirm('Hapus data ini?')) return;
    try { showLoading('Menghapus...'); await apiPost({action:'deleteData',sheet,id});
        await loadDataForRole();
        const page = sheet==='pemasukan'?'pemasukan':sheet==='pengeluaran'?'pengeluaran':'spp';
        navigateTo(page); toast('Data berhasil dihapus','warning');
    } catch(err){toast('Gagal: '+err.message,'error');}finally{hideLoading();}
}

async function delDosen(id) {
    if(!confirm('Hapus data dosen ini?')) return;
    try { showLoading('Menghapus...'); await apiPost({action:'deleteDosen',id});
        await loadDataForRole(); navigateTo('data-dosen'); toast('Dosen berhasil dihapus','warning');
    } catch(err){toast('Gagal: '+err.message,'error');}finally{hideLoading();}
}

async function delUser(id) {
    if(!confirm('Hapus user ini?')) return;
    try { showLoading('Menghapus...'); await apiPost({action:'deleteUser',id});
        await loadDataForRole(); navigateTo('users'); toast('User berhasil dihapus','warning');
    } catch(err){toast('Gagal: '+err.message,'error');}finally{hideLoading();}
}

// ==========================================
// CHARTS
// ==========================================
function initChart(type) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridC = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)';
    const txtC  = isDark ? '#8b949e' : '#5a6a7b';
    const cardBg = isDark ? '#1c2333' : '#fff';
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

    if (type === 'monthly') {
        const ctx = document.getElementById('cMonthly');
        if(!ctx) return;
        if(S.charts.monthly) S.charts.monthly.destroy();
        S.charts.monthly = new Chart(ctx, {
            type:'bar', data:{labels:months, datasets:[
                {label:'Pemasukan',data:S.monthly.map(m=>m.income),backgroundColor:'rgba(39,174,96,.75)',borderColor:'#27ae60',borderWidth:2,borderRadius:6,borderSkipped:false},
                {label:'Pengeluaran',data:S.monthly.map(m=>m.expense),backgroundColor:'rgba(231,76,60,.75)',borderColor:'#e74c3c',borderWidth:2,borderRadius:6,borderSkipped:false}
            ]},options:chartOpts(gridC,txtC,cardBg)
        });
    } else if (type === 'donut') {
        const ctx = document.getElementById('cDonut');
        if(!ctx) return;
        if(S.charts.donut) S.charts.donut.destroy();
        const cats=['Gaji','Operasional','Infrastruktur','ATK','Kegiatan','Lainnya'];
        const colors=['#e74c3c','#3498db','#f39c12','#9b59b6','#1abc9c','#95a5a6'];
        const data=cats.map(c=>S.expense.filter(e=>e.Kategori===c).reduce((s,e)=>s+(parseFloat(e.Jumlah)||0),0));
        S.charts.donut = new Chart(ctx, {
            type:'doughnut', data:{labels:cats,datasets:[{data,backgroundColor:colors,borderWidth:3,borderColor:cardBg,hoverOffset:8}]},
            options:{responsive:true,maintainAspectRatio:false,cutout:'65%',
                plugins:{legend:{position:'bottom',labels:{usePointStyle:true,padding:12,color:txtC,font:{family:'Poppins',size:10}}},
                tooltip:{callbacks:{label:c=>`${c.label}: ${fRp(c.raw)}`}}}}
        });
    } else if (type === 'report') {
        const ctx = document.getElementById('cReport');
        if(!ctx) return;
        if(S.charts.report) S.charts.report.destroy();
        S.charts.report = new Chart(ctx, {
            type:'line', data:{labels:months, datasets:[
                {label:'Pemasukan',data:S.monthly.map(m=>m.income),borderColor:'#27ae60',backgroundColor:'rgba(39,174,96,.08)',fill:true,tension:.4,pointRadius:4,borderWidth:3},
                {label:'Pengeluaran',data:S.monthly.map(m=>m.expense),borderColor:'#e74c3c',backgroundColor:'rgba(231,76,60,.08)',fill:true,tension:.4,pointRadius:4,borderWidth:3},
                {label:'Saldo',data:S.monthly.map(m=>m.income-m.expense),borderColor:'#3498db',backgroundColor:'transparent',fill:false,tension:.4,pointRadius:4,borderWidth:3,borderDash:[6,3]}
            ]},options:{...chartOpts(gridC,txtC,cardBg),plugins:{legend:{labels:{usePointStyle:true,color:txtC,font:{family:'Poppins',size:11}}}}}
        });
    }
}

function chartOpts(gridC,txtC,cardBg) {
    return {
        responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false},tooltip:{backgroundColor:cardBg,titleColor:txtC,bodyColor:txtC,borderColor:gridC,borderWidth:1,padding:10,
            titleFont:{family:'Poppins',weight:'600'},bodyFont:{family:'Poppins'},
            callbacks:{label:c=>`${c.dataset.label}: ${fRp(c.raw)}`}}},
        scales:{x:{grid:{display:false},ticks:{color:txtC,font:{family:'Poppins',size:10}}},
            y:{grid:{color:gridC},ticks:{color:txtC,font:{family:'Poppins',size:10},callback:v=>'Rp '+(v/1e6).toFixed(0)+'jt'}}}
    };
}

// ==========================================
// SIDEBAR & THEME
// ==========================================
function initSidebar() {
    document.getElementById('tbMenu').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
        document.getElementById('sOverlay').classList.add('show');
    });
    const close = () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sOverlay').classList.remove('show'); };
    document.getElementById('sOverlay').addEventListener('click', close);
    document.getElementById('sClose').addEventListener('click', close);
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sOverlay').classList.remove('show');
}

function initTheme() {
    const saved = localStorage.getItem('stai_theme') || 'light';
    applyTheme(saved);
    document.getElementById('themeBtn').addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        applyTheme(cur === 'dark' ? 'light' : 'dark');
    });
}
function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('stai_theme', t);
    document.getElementById('themeIcon').className = t==='dark'?'fas fa-sun':'fas fa-moon';
    // Re-render charts
    Object.keys(S.charts).forEach(k => { if(S.charts[k]) { try{initChart(k);}catch(e){} } });
}

// ==========================================
// UTILITIES
// ==========================================
function fRp(n){n=parseFloat(n)||0;return 'Rp '+n.toLocaleString('id-ID');}
function fDate(d){if(!d)return'-';try{return new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return d;}}
function today(){return new Date().toISOString().split('T')[0];}
function trunc(s,n){return s&&s.length>n?s.slice(0,n)+'...':s||'-';}
function v(id){const el=document.getElementById(id);return el?el.value:'';}

function showLoading(text){
    document.getElementById('loaderText').textContent=text||'Memuat...';
    document.getElementById('loadingOverlay').classList.add('show');
}
function hideLoading(){document.getElementById('loadingOverlay').classList.remove('show');}

function toast(msg,type='success'){
    const icons={success:'fa-check-circle',error:'fa-times-circle',warning:'fa-exclamation-triangle',info:'fa-info-circle'};
    const box=document.getElementById('toastBox');
    const t=document.createElement('div');
    t.className=`toast ${type}`;
    t.innerHTML=`<i class="toast-ic fas ${icons[type]||icons.info}"></i><span class="toast-msg">${msg}</span>`;
    box.appendChild(t);
    setTimeout(()=>{t.style.cssText='opacity:0;transform:translateX(50px);transition:all .3s';setTimeout(()=>t.remove(),300);},3500);
}

// ===== THEME OBSERVER FOR CHARTS =====
new MutationObserver(()=>{
    setTimeout(()=>Object.keys(S.charts).forEach(k=>{try{initChart(k)}catch(e){}}),150);
}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});