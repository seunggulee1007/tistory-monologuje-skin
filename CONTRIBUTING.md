# Contributing to Monolog

Monolog에 기여해 주셔서 감사합니다! 이 문서는 기여 방법을 안내합니다.

## 기여 방법

### 버그 리포트

1. [Issues](https://github.com/seunggulee1007/tistory-monologuje-skin/issues)에서 이미 보고된 버그인지 확인해 주세요.
2. 새로운 버그라면 **Bug Report** 템플릿으로 이슈를 생성해 주세요.
3. 재현 가능한 단계, 기대 동작, 실제 동작을 포함해 주세요.

### 기능 제안

1. [Issues](https://github.com/seunggulee1007/tistory-monologuje-skin/issues)에서 **Feature Request** 템플릿으로 이슈를 생성해 주세요.
2. 어떤 문제를 해결하려는 건지, 원하는 동작이 무엇인지 설명해 주세요.

### Pull Request

1. 이 저장소를 Fork합니다.
2. 기능 브랜치를 생성합니다: `git checkout -b feat/your-feature`
3. 변경 사항을 커밋합니다: `git commit -m "feat: 기능 설명"`
4. 브랜치에 Push합니다: `git push origin feat/your-feature`
5. Pull Request를 생성합니다.

## 개발 환경 설정

이 프로젝트는 빌드 도구가 없는 순수 HTML/CSS/JS 프로젝트입니다.

```bash
# 저장소 클론
git clone https://github.com/seunggulee1007/tistory-monologuje-skin.git
cd tistory-monologuje-skin

# 로컬 프리뷰 (아무 정적 서버)
npx serve .
# 또는
python3 -m http.server 8080
```

`preview.html`을 브라우저에서 열면 티스토리 없이도 디자인을 확인할 수 있습니다.

## 파일 구조

| 파일 | 역할 |
|------|------|
| `skin.html` | 티스토리 HTML 템플릿 |
| `style.css` | 전체 스타일시트 |
| `images/script.js` | 메인 JavaScript (17개 모듈) |
| `images/pako.min.js` | PlantUML 인코딩 라이브러리 (수정 불필요) |
| `index.xml` | 스킨 메타데이터 + 커스텀 변수 정의 |

## 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/ko/v1.0.0/)를 따릅니다:

| 접두사 | 용도 |
|--------|------|
| `feat:` | 새로운 기능 |
| `fix:` | 버그 수정 |
| `docs:` | 문서 변경 |
| `style:` | CSS/포매팅 변경 (기능 변화 없음) |
| `refactor:` | 코드 리팩토링 |
| `chore:` | 빌드/도구 설정 변경 |

## 코드 가이드라인

- **CSS**: 빌드 도구 없이 CSS Custom Properties 사용. 모든 색상은 변수로 정의
- **JS**: Vanilla JavaScript만 사용. 외부 의존성 추가 불가 (pako 제외)
- **HTML**: 티스토리 치환자(`[##_..._##]`) 문법 유지
- **호환성**: Chrome 80+, Firefox 78+, Safari 14+, Edge 80+ 지원 필수

## 테스트

티스토리 플랫폼 특성상 자동 테스트 환경이 없습니다. 변경 사항은 다음을 확인해 주세요:

1. `preview.html`에서 시각적 확인
2. 다크모드/라이트모드 전환 확인
3. 모바일 반응형 확인 (Chrome DevTools)
4. 키보드 단축키 동작 확인

## 라이선스

기여하신 코드는 [MIT License](LICENSE)를 따릅니다.
