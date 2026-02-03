// UUID生成（初回アクセス時に一度だけ実行）
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ユーザー情報の初期化
function initUser() {
  if (!localStorage.getItem('userId')) {
    localStorage.setItem('userId', generateUUID());
    localStorage.setItem('stampCount', '0');
    localStorage.setItem('lastStampDate', '');
    localStorage.setItem('coupons', JSON.stringify([]));
    localStorage.setItem('stamped', JSON.stringify([])); // 押印済みスタンプID管理
  }
}

// 今日の日付をYYYY-MM-DD形式で取得
function getToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// URLパラメータからstampIdを取得
function getStampId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('stampId');
}

// 押印済みスタンプID配列を取得
function loadStamped() {
  const stamped = localStorage.getItem('stamped') || '[]';
  return JSON.parse(stamped);
}

// 押印済みスタンプID配列を保存
function saveStamped(stamped) {
  localStorage.setItem('stamped', JSON.stringify(stamped));
}

// スタンプを押す（押印済み管理）
function stamp(stampId) {
  const stamped = loadStamped();
  if (!stamped.includes(stampId)) {
    stamped.push(stampId);
    saveStamped(stamped);
  }
  updateStampUI();
}

// スタンプ数を増やす（重複押印防止付き）
function addStamp(stampId) {
  const today = getToday();
  const stamped = loadStamped();

  // すでに押されているstampIdなら処理しない
  if (stamped.includes(stampId)) {
    alert('このスタンプはすでに押されています。');
    return;
  }

  // 同じ日にスタンプを押せないように制限
  const lastStampDate = localStorage.getItem('lastStampDate');
  if (lastStampDate === today) {
    alert('本日はすでにスタンプを押しています。');
    return;
  }

  let count = parseInt(localStorage.getItem('stampCount') || '0', 10);
  count += 1;
  localStorage.setItem('stampCount', count.toString());
  localStorage.setItem('lastStampDate', today);

  alert(`スタンプを押しました！ 現在のスタンプ数: ${count}`);

  // スタンプ5個でクーポン発行
  if (count >= 5) {
    issueCoupon();
    localStorage.setItem('stampCount', '0'); // スタンプリセット
  }

  // 押印済みstampIdに追加
  stamped.push(stampId);
  saveStamped(stamped);

  updateUI();
}

// クーポン発行処理
function issueCoupon() {
  const coupons = JSON.parse(localStorage.getItem('coupons') || '[]');
  const today = getToday();
  const couponCode = `CPN${Date.now()}`;
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 1); // 1ヶ月後

  coupons.push({
    code: couponCode,
    issued: today,
    used: false,
    expiry: expiryDate.toISOString().slice(0, 10),
  });

  localStorage.setItem('coupons', JSON.stringify(coupons));
  alert(`クーポンを発行しました！ コード: ${couponCode}`);
}

// UI更新：押されたスタンプをはっきり表示
function updateStampUI() {
  const stamped = loadStamped();
  document.querySelectorAll('.stamp').forEach(img => {
    if (stamped.includes(img.id)) {
      img.classList.add('active');
    } else {
      img.classList.remove('active');
    }
  });
}

// UI更新（スタンプ数・クーポン一覧）
function updateUI() {
  const count = localStorage.getItem('stampCount') || '0';
  document.getElementById('stampCountDisplay').textContent = `スタンプ数: ${count}`;

  // クーポン一覧表示
  const coupons = JSON.parse(localStorage.getItem('coupons') || '[]');
  const couponList = document.getElementById('couponList');
  couponList.innerHTML = '';
  const today = getToday();

  coupons.forEach(coupon => {
    if (coupon.used) return; // 使用済みは非表示
    if (coupon.expiry < today) return; // 期限切れは非表示

    const li = document.createElement('li');
    li.textContent = `コード: ${coupon.code} (有効期限: ${coupon.expiry})`;

    const useBtn = document.createElement('button');
    useBtn.textContent = '使用済みにする';
    useBtn.onclick = () => {
      coupon.used = true;
      localStorage.setItem('coupons', JSON.stringify(coupons));
      updateUI();
    };

    li.appendChild(useBtn);
    couponList.appendChild(li);
  });

  updateStampUI();
}

// ページ内UIで押印スタンプを選ぶ仕組み
function setupStampButtons() {
  document.querySelectorAll('.stampBtn').forEach(btn => {
    btn.onclick = () => {
      const stampId = btn.dataset.stampId;
      addStamp(stampId);
    };
  });
}

// テスト用リセットボタン
function setupResetButton() {
  const resetBtn = document.getElementById('resetBtn');
  resetBtn.onclick = () => {
    if (confirm('本当にリセットしますか？ 全てのスタンプとクーポン情報が消えます。')) {
      localStorage.removeItem('stampCount');
      localStorage.removeItem('lastStampDate');
      localStorage.removeItem('stamped');
      localStorage.removeItem('coupons');
      updateUI();
      alert('リセットしました。');
    }
  };
}

// ページ読み込み時の初期化
window.onload = () => {
  initUser();

  // URLにstampIdがあればスタンプ押印
  const stampId = getStampId();
  if (stampId) {
    addStamp(stampId);
  }

  updateUI();
  setupStampButtons();
  setupResetButton();
};