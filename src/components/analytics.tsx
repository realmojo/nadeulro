import Script from "next/script";

/**
 * 웹 분석 스크립트: Google Analytics(gtag) + 네이버 웹마스터(wcs).
 * next/script `afterInteractive`로 로드해 초기 렌더를 막지 않는다.
 */
const GA_ID = "G-DFE2BJRLF0";
const NAVER_WA = "19d45054f3b14c0";
const ADSENSE_CLIENT = "ca-pub-9130836798889522";

export function Analytics() {
  return (
    <>
      {/* Google Analytics (gtag.js) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>

      {/* 네이버 웹마스터도구 (wcslog) */}
      <Script
        src="//wcs.pstatic.net/wcslog.js"
        strategy="afterInteractive"
      />
      <Script id="naver-wcs" strategy="afterInteractive">
        {`
          if(!window.wcs_add) window.wcs_add = {};
          wcs_add["wa"] = "${NAVER_WA}";
          if(window.wcs) { wcs_do(); }
        `}
      </Script>

      {/* Google AdSense */}
      <Script
        id="adsbygoogle-init"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
        async
      />
    </>
  );
}
