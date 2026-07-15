import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { Clause, LegalDoc, LegalList } from "@/components/legal-doc";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "이용약관",
  description:
    "나들로 서비스 이용약관입니다. 서비스가 제공하는 정보의 성격과 이용자·운영자의 책임 범위를 안내합니다.",
  alternates: { canonical: `${siteConfig.url}/terms` },
};

const EFFECTIVE = "2026년 7월 16일";

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="TERMS"
        title="이용약관"
        description="나들로가 제공하는 정보의 성격과, 이용자·운영자의 권리와 책임을 안내합니다."
      />

      <LegalDoc updatedAt={EFFECTIVE}>
        <Clause n={1} title="목적">
          <p>
            본 약관은 나들로(이하 ‘서비스’)가 제공하는 나들이 장소 정보 및 지도
            서비스의 이용 조건과 절차, 이용자와 운영자의 권리·의무·책임 사항을
            정하는 것을 목적으로 합니다.
          </p>
        </Clause>

        <Clause n={2} title="정의">
          <LegalList
            items={[
              <>
                <b className="font-semibold text-foreground">서비스</b>: 나들로가
                웹을 통해 제공하는 파크골프장·온천·수영장·등산 명소 등의 위치와
                정보 조회 서비스를 말합니다.
              </>,
              <>
                <b className="font-semibold text-foreground">이용자</b>: 본
                약관에 따라 서비스를 이용하는 모든 방문자를 말합니다.
              </>,
              <>
                <b className="font-semibold text-foreground">콘텐츠</b>:
                서비스가 제공하는 장소 정보, 지도, 글·이미지 등 일체의 자료를
                말합니다.
              </>,
            ]}
          />
        </Clause>

        <Clause n={3} title="약관의 효력과 변경">
          <p>
            본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다. 운영자는
            관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시
            본 페이지에 공지합니다.
          </p>
        </Clause>

        <Clause n={4} title="서비스의 제공">
          <LegalList
            items={[
              "서비스는 회원가입 없이 누구나 무료로 이용할 수 있습니다.",
              "서비스는 각 지방자치단체·공공기관 등이 공개한 자료를 바탕으로 장소 정보를 정리해 제공합니다.",
              "운영자는 서비스의 내용을 개선하거나 일부를 변경·중단할 수 있습니다.",
            ]}
          />
        </Clause>

        <Clause n={5} title="정보의 정확성과 면책">
          <p>
            서비스가 제공하는 위치·운영시간·요금·연락처 등 모든 정보는{" "}
            <b className="font-semibold text-foreground">나들이 참고용 자료</b>
            입니다. 실제 시설의 운영 상황과 다를 수 있으므로, 방문 전 해당
            시설에 직접 확인하시기 바랍니다.
          </p>
          <p>
            운영자는 정보의 정확성·완전성을 보장하지 않으며, 이용자가 정보를
            신뢰하여 행한 판단과 그 결과에 대해 법령이 허용하는 범위에서 책임을
            지지 않습니다.
          </p>
        </Clause>

        <Clause n={6} title="외부 서비스 및 링크">
          <p>
            서비스는 카카오맵 등 외부 서비스와 시설 예약·홈페이지 등 외부 링크를
            포함할 수 있습니다. 외부 서비스의 이용과 그 콘텐츠에 대한 책임은 해당
            사업자에게 있으며, 각 서비스의 약관과 정책이 적용됩니다.
          </p>
        </Clause>

        <Clause n={7} title="지식재산권">
          <p>
            서비스가 직접 작성한 글·이미지·화면 구성 등에 대한 권리는 운영자에게
            있습니다. 이용자는 운영자의 사전 동의 없이 이를 무단으로 복제·배포·
            상업적으로 이용할 수 없습니다. 다만 공공기관이 공개한 원자료의 권리는
            해당 기관에 있습니다.
          </p>
        </Clause>

        <Clause n={8} title="이용자의 의무">
          <p>이용자는 서비스를 이용하며 다음 행위를 해서는 안 됩니다.</p>
          <LegalList
            items={[
              "자동화된 방법으로 콘텐츠를 대량 수집하거나 서버에 과도한 부하를 주는 행위",
              "서비스의 정상적인 운영을 방해하거나 시스템에 무단으로 접근하는 행위",
              "콘텐츠를 무단으로 복제·재배포하거나 상업적으로 이용하는 행위",
            ]}
          />
        </Clause>

        <Clause n={9} title="책임의 제한">
          <p>
            운영자는 천재지변, 외부 서비스(지도·통계 등) 장애, 이용자의 기기·통신
            환경 등 운영자의 합리적 통제를 벗어난 사유로 발생한 손해에 대해
            책임을 지지 않습니다.
          </p>
        </Clause>

        <Clause n={10} title="준거법 및 분쟁 해결">
          <p>
            본 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련한 분쟁은
            관련 법령이 정한 절차에 따라 해결합니다.
          </p>
        </Clause>

        <Clause n={11} title="문의">
          <p>
            약관에 관한 문의는 이메일{" "}
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
