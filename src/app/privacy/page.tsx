import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { Clause, LegalDoc, LegalList } from "@/components/legal-doc";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description:
    "나들로가 이용자의 개인정보를 어떻게 다루는지 안내합니다. 나들로는 회원가입 없이 운영되며 최소한의 정보만 처리합니다.",
  alternates: { canonical: `${siteConfig.url}/privacy` },
};

const EFFECTIVE = "2026년 7월 16일";

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="PRIVACY"
        title="개인정보처리방침"
        description="나들로는 회원가입 없이 이용할 수 있으며, 서비스 운영에 꼭 필요한 최소한의 정보만 처리합니다."
      />

      <LegalDoc updatedAt={EFFECTIVE}>
        <Clause title="1. 총칙">
          <p>
            나들로(이하 ‘서비스’)는 이용자의 개인정보를 소중히 여기며,
            「개인정보 보호법」 등 관련 법령을 준수합니다. 서비스는{" "}
            <b className="font-semibold text-foreground">회원가입·로그인 없이</b>{" "}
            이용할 수 있으며, 이름·연락처 등 이용자를 직접 식별하는 개인정보를
            수집·저장하지 않습니다.
          </p>
        </Clause>

        <Clause title="2. 수집하는 정보와 방법">
          <p>서비스는 다음의 정보를 자동으로 생성·수집할 수 있습니다.</p>
          <LegalList
            items={[
              <>
                <b className="font-semibold text-foreground">이용 기록·통계</b>:
                방문 페이지, 접속 시각, 브라우저·기기 종류, 대략적 접속 지역 등
                (웹 분석 도구를 통해 비식별 형태로 수집)
              </>,
              <>
                <b className="font-semibold text-foreground">쿠키</b>: 서비스
                이용 통계와 화면 설정 저장을 위한 쿠키 및 브라우저 저장소
                (localStorage)
              </>,
              <>
                <b className="font-semibold text-foreground">위치정보</b>: ‘내
                주변 보기’ 사용 시 브라우저가 제공하는 현재 위치. 아래 제4조
                참고
              </>,
            ]}
          />
        </Clause>

        <Clause title="3. 이용 목적">
          <LegalList
            items={[
              "가까운 나들이 장소를 지도에 표시하고 길찾기를 돕기 위해",
              "서비스 이용 현황을 파악해 화면과 콘텐츠를 개선하기 위해",
              "오류를 확인하고 안정적으로 운영하기 위해",
            ]}
          />
        </Clause>

        <Clause title="4. 위치정보의 처리">
          <p>
            서비스는 이용자가 <b className="font-semibold text-foreground">직접
            동의하고 요청한 경우에만</b> 브라우저를 통해 현재 위치를 확인합니다.
            위치는 지도를 이용자 주변으로 이동시키는 데에만 쓰이며,{" "}
            <b className="font-semibold text-foreground">서버로 전송하거나
            저장하지 않습니다.</b> 위치 권한은 브라우저 설정에서 언제든지 다시
            거부·삭제할 수 있습니다.
          </p>
        </Clause>

        <Clause title="5. 제3자 도구 및 서비스">
          <p>
            서비스는 지도 표시와 이용 통계를 위해 다음의 외부 서비스를 이용하며,
            각 서비스의 개인정보 처리는 해당 사업자의 방침을 따릅니다.
          </p>
          <LegalList
            items={[
              <>
                <b className="font-semibold text-foreground">카카오맵</b>{" "}
                (카카오): 지도·길찾기 표시
              </>,
              <>
                <b className="font-semibold text-foreground">Google
                Analytics</b> (Google): 이용 통계 분석
              </>,
              <>
                <b className="font-semibold text-foreground">네이버
                애널리틱스</b> (네이버): 이용 통계 분석
              </>,
            ]}
          />
        </Clause>

        <Clause title="6. 보유 및 파기">
          <p>
            서비스는 이용자를 식별하는 개인정보를 직접 저장하지 않습니다. 웹 분석
            도구가 생성하는 통계 정보는 각 사업자의 보관 정책에 따라 보관·파기되며,
            서비스가 별도로 보관하지 않습니다.
          </p>
        </Clause>

        <Clause title="7. 이용자의 권리">
          <LegalList
            items={[
              "브라우저 설정에서 쿠키 저장을 거부하거나 삭제할 수 있습니다. 다만 일부 기능이 제한될 수 있습니다.",
              "위치 권한은 브라우저 주소창의 사이트 설정에서 언제든 철회할 수 있습니다.",
              "Google·네이버가 제공하는 분석 거부(옵트아웃) 도구를 이용해 통계 수집을 거부할 수 있습니다.",
            ]}
          />
        </Clause>

        <Clause title="8. 아동의 개인정보">
          <p>
            서비스는 만 14세 미만 아동을 주 대상으로 하지 않으며, 아동의
            개인정보를 고의로 수집하지 않습니다.
          </p>
        </Clause>

        <Clause title="9. 방침의 변경">
          <p>
            본 방침은 법령이나 서비스 내용의 변경에 따라 수정될 수 있으며, 변경
            시 본 페이지를 통해 공지합니다.
          </p>
        </Clause>

        <Clause title="10. 문의">
          <p>
            개인정보 처리에 관한 문의는 이메일{" "}
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="font-semibold text-primary hover:underline"
            >
              {siteConfig.contactEmail}
            </a>
            로 연락해 주세요.
          </p>
        </Clause>
      </LegalDoc>
    </>
  );
}
