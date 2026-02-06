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

// スタンプを押す（重複押印防止付き、ただしテスト用に同日複数回押印可能）
function addStamp(stampId) {
  // テスト用に同日複数回押せるように制限を外す
  // const today = getToday();
  // const lastStampDate = localStorage.getItem('lastStampDate');

  // if (lastStampDate === today) {
  //   alert('本日はすでにスタンプを押しています。');
  //   return;
  // }

  let count = parseInt(localStorage.getItem('stampCount') || '0', 10);
  count += 1;
  localStorage.setItem('stampCount', count.toString());
  // localStorage.setItem('lastStampDate', today);

  alert(`スタンプを押しました！ 現在のスタンプ数: ${count}`);

  if (count >= 5) {
    issueCoupon();
    localStorage.setItem('stampCount', '0');
  }

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

// UI更新：スタンプ画像の表示切替
function updateStampUI() {
  const count = parseInt(localStorage.getItem('stampCount') || '0', 10);
  document.querySelectorAll('.stamp').forEach((img, index) => {
    if (index < count) {
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

  // クーポン画像表示エリアをクリア
  const couponImageContainer = document.getElementById('couponImageContainer');
  couponImageContainer.innerHTML = '';

  // クーポン一覧表示
  const coupons = JSON.parse(localStorage.getItem('coupons') || '[]');
  const couponList = document.getElementById('couponList');
  couponList.innerHTML = '';
  const today = getToday();

  // クーポンコードごとに1つずつリストと画像を表示
  const displayedCodes = new Set();

  coupons.forEach(coupon => {
    if (coupon.used) return; // 使用済みは非表示
    if (coupon.expiry < today) return; // 期限切れは非表示

    if (displayedCodes.has(coupon.code)) return; // 重複表示防止
    displayedCodes.add(coupon.code);

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

    // クーポン画像をコードごとに表示（画像は1つだけ表示）
    const img = document.createElement('img');
    img.src = 'images/coupon.png';
    img.alt = `クーポン画像: ${coupon.code}`;
    img.style.maxWidth = '300px';
    img.style.height = 'auto';
    img.style.border = '2px solid #4CAF50';
    img.style.borderRadius = '8px';
    img.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    img.style.marginTop = '10px';

    // ここで画像をタップ（クリック）したら使用済みにする処理を追加
    img.style.cursor = 'pointer';
    img.title = 'タップで使用済みにします';
    img.onclick = () => {
      coupon.used = true;
      localStorage.setItem('coupons', JSON.stringify(coupons));
      updateUI();
      alert(`クーポンコード ${coupon.code} を使用済みにしました。`);
    };

    couponImageContainer.appendChild(img);
  });

  updateStampUI();
}

// テスト用リセットボタン
function setupResetButton() {
  const resetBtn = document.getElementById('resetBtn');
  resetBtn.onclick = () => {
    if (confirm('本当にリセットしますか？ 全てのスタンプとクーポン情報が消えます。')) {
      localStorage.removeItem('stampCount');
      localStorage.removeItem('lastStampDate');
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
  setupResetButton();
};