// 운결 서비스 워커
// - 앱 파일을 캐시하고, 설치 시 만세력 엔진(esm.sh)과 그 하위 모듈까지 자동으로 내려받아 저장합니다.
// - 앱을 수정해 다시 올릴 때는 VER 숫자를 올리면 이전 캐시가 정리됩니다.
const VER = "ungyeol-v16";;
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
const ENGINE = "https://esm.sh/manseryeok@2.0.0";
const MATCH = { ignoreVary: true };

const put = (req, res) => caches.open(VER).then(c => c.put(req, res)).catch(() => {});

// 엔진 모듈을 따라가며 import 되는 하위 모듈까지 모두 저장
async function precacheModules(url, seen = new Set()) {
  if (seen.has(url)) return;
  seen.add(url);
  const cache = await caches.open(VER);
  let res = await cache.match(url, MATCH);
  if (!res) {
    res = await fetch(url);
    if (!res.ok) return;
    await cache.put(url, res.clone());
  }
  const text = await res.clone().text();
  const re = /(?:from|import)\s*\(?\s*["'](\/[^"']+|https:\/\/esm\.sh\/[^"']+)["']/g;
  for (const m of text.matchAll(re)) await precacheModules(new URL(m[1], url).href, seen);
}

self.addEventListener("install", e => {
  e.waitUntil(
    Promise.all([
      caches.open(VER).then(c => c.addAll(SHELL)),
      precacheModules(ENGINE).catch(() => {}) // 오프라인 설치여도 앱 설치는 계속 진행
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VER).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    // 앱 파일: 네트워크 우선(업데이트 반영), 실패 시 캐시
    e.respondWith(
      fetch(req)
        .then(res => { if (res.ok) put(req, res.clone()); return res; })
        .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
    );
  } else if (url.hostname === "esm.sh") {
    // 만세력 엔진: 캐시 우선, 없으면 네트워크 후 저장
    e.respondWith(
      caches.match(req, MATCH).then(hit => hit || fetch(req).then(res => { if (res.ok) put(req, res.clone()); return res; }))
    );
  }
});
