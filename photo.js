// 사진 받기 페이지: QR 주소 photo.html#<Drive 파일 id>
const id = location.hash.slice(1), $ = x => document.getElementById(x);
const file = `https://drive.usercontent.google.com/download?id=${id}&export=download`;   // 그냥 열면 내려받기(fetch는 CORS로 막힘)
const img = `https://lh3.googleusercontent.com/d/${id}=s0`;   // 원본 크기, CORS 허용
// 아이폰·아이패드는 웹에서 사진 앱으로 바로 넣을 길이 공유 창의 '이미지 저장'뿐이다(내려받기는 '파일' 앱으로 감)
const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (!/^[\w-]{20,}$/.test(id)) {
  $('pic').hidden = $('save').hidden = true;
  $('msg').textContent = '사진 주소가 올바르지 않아요. QR을 다시 찍어 주세요.';
} else {
  $('pic').src = img;
  $('pic').onerror = () => { $('pic').hidden = true; $('save').hidden = true; $('msg').textContent = '사진을 찾을 수 없어요. 24시간이 지나 지워졌을 수 있어요.'; };
  if (ios) $('msg').innerHTML = "버튼을 누르고 <b>'이미지 저장'</b>을 고르면 사진 앱에 들어가요.<br>24시간 뒤에는 사진이 사라져요.";
  // 미리 받아 둔다: 누른 뒤에 받으면 아이폰이 공유 창을 막는다
  const ready = fetch(img).then(r => r.blob()).then(b => new File([b], `청춘의순간_${id.slice(0, 6)}.jpg`, {type: 'image/jpeg'}));
  ready.catch(() => {});
  $('save').onclick = async () => {
    try {
      const f = await ready;
      if (ios && navigator.canShare && navigator.canShare({files: [f]})) return await navigator.share({files: [f]});
      // 안드로이드 등: 바로 내려받기 → 갤러리의 '다운로드' 앨범에 들어간다
      const a = Object.assign(document.createElement('a'), {href: URL.createObjectURL(f), download: f.name});
      document.body.append(a); a.click(); a.remove();
      $('msg').textContent = '저장했어요! 갤러리의 다운로드 앨범에서 볼 수 있어요.';
    } catch (e) {
      if (e.name !== 'AbortError') location.href = file;   // 공유 취소가 아니면 원본 내려받기로
    }
  };
}
