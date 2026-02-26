# Security Policy

## 지원 버전

| 버전 | 지원 상태 |
|------|-----------|
| 1.0.x | :white_check_mark: 지원 |

## 보안 취약점 보고

보안 취약점을 발견하셨다면, **공개 이슈로 보고하지 마시고** 아래 방법으로 비공개 보고해 주세요:

1. [GitHub Security Advisories](https://github.com/seunggulee1007/tistory-monologuje-skin/security/advisories/new)를 통해 비공개로 보고

## 보안 고려사항

이 프로젝트는 티스토리 블로그 스킨으로, 다음과 같은 보안 특성을 가집니다:

- **클라이언트 사이드 전용**: 서버 사이드 코드가 없으며, 모든 JavaScript는 브라우저에서 실행
- **외부 통신**: PlantUML 렌더링을 위해 `plantuml.com`에 요청 (활성화 시)
- **CDN 의존성**: highlight.js를 CDN에서 로드
- **로컬 스토리지**: 다크모드 설정, 읽기 위치 등을 `localStorage`에 저장 (민감 정보 없음)

## 대응 시간

- 보고 확인: 3일 이내
- 초기 평가: 7일 이내
- 수정 릴리스: 심각도에 따라 결정
