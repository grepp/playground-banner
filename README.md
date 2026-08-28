# 프로그래머스 메인 배너 미리보기

운영자가 어드민에 넣을 **배너 HTML**을 편집하고, 프로덕션 `EventBanner`와 같은 스타일로 바로 확인하는 도구입니다.

배포: GitHub Pages (`/playground-banner/` 경로)

## 로컬 개발

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173/` 를 엽니다.

## 빌드

```bash
npm run build
npm run preview
```

`vite preview` 는 GitHub Pages와 같이 `/playground-banner/` 경로로 열립니다.

## 기능

- 미리보기(데스크탑 / 모바일)와 편집기(자유 모드 / 템플릿 모드)를 나눈 UI
- 자유 모드: CodeMirror로 HTML 직접 편집
- 템플릿 모드: 왼쪽에서 옵션을 바꾸면 오른쪽에 생성 HTML이 바로 보임
- 미리보기는 창 너비에 따라 프로덕션과 같이 반응형 (`max-width: 991px`)

## GitHub Pages 배포

1. GitHub에서 이 repository를 연다
2. Settings → Pages → Source: **GitHub Actions**
3. `main`에 push → `.github/workflows/deploy-pages.yml` 이 `dist` 배포
4. URL: `https://<org>.github.io/playground-banner/`
