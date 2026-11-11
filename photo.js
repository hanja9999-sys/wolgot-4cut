// 사진 받기 페이지: QR 주소 photo.html#<Drive 파일 id>
const id = location.hash.slice(1), $ = x => document.getElementById(x);
const file = `https://drive.usercontent.google.com/download?id=${id}&export=download`;   // 그냥 열면 내려받기(fetch는 CORS로 막힘)
const img = `https://lh3.googleusercontent.com/d/${id}=s0`;   // 원본 크기, CORS 허용
if (!/^[\w-]{20,}$/.test(id)) {
  $('pic').hidden = $('save').hidden = true;
  $('msg').textContent = '사진 주소가 올바르지 않습니다. QR을 다시 찍어 주세요.';
} else {
  $('pic').src = img;
  $('pic').onerror = () => { $('pic').hidden = true; $('msg').textContent = '사진을 찾을 수 없습니다. 24시간이 지나 지워졌을 수 있습니다.'; };
  // 미리 받아 둔다: 누른 뒤에 받으면 아이폰이 공유 창을 막는다
  const ready = fetch(img).then(r => r.blob()).then(b => new File([b], `청춘의순간_${id.slice(0, 6)}.jpg`, {type: 'image/jpeg'}));
  ready.catch(() => {});
  $('save').onclick = async () => {
    try {   // 휴대폰은 공유 창의 '이미지 저장'이 사진 앱으로 바로 들어간다
      const f = await ready;
      if (navigator.canShare && navigator.canShare({files: [f]})) return await navigator.share({files: [f]});
      const a = Object.assign(document.createElement('a'), {href: URL.createObjectURL(f), download: f.name});
      a.click();
    } catch (e) {
      if (e.name !== 'AbortError') location.href = file;   // 공유 취소가 아니면 원본 내려받기로
    }
  };
}
