# GitHub OAuth App 설정 가이드

## 1. GitHub OAuth App 생성

### 1단계: GitHub 저장소 설정으로 이동
1. https://github.com/giroklabs/bidsimulator/settings/applications/new 접속
2. 또는 GitHub 저장소 → Settings → Developer settings → OAuth Apps → New OAuth App

### 2단계: OAuth App 정보 입력
```
Application name: 경매 입찰가격 시뮬레이션
Homepage URL: https://giroklabs.github.io/bidsimulator/
Application description: 경매 입찰가격 시뮬레이션 서비스
Authorization callback URL: https://giroklabs.github.io/bidsimulator/
```

### 3단계: OAuth App 생성
- "Register application" 버튼 클릭
- **Client ID**와 **Client Secret** 확인 및 저장

## 2. 코드에서 Client ID 업데이트

### github-storage.js 파일 수정
```javascript
// OAuth 설정 (GitHub OAuth App에서 생성)
CLIENT_ID: 'YOUR_CLIENT_ID_HERE', // 실제 Client ID로 교체
REDIRECT_URI: 'https://giroklabs.github.io/bidsimulator/', // GitHub Pages URL
```

## 3. OAuth 플로우 제한사항

### 현재 제한사항
- GitHub OAuth는 보안상 **Client Secret**이 필요
- **Client Secret**은 서버에서만 안전하게 사용 가능
- 클라이언트 사이드에서는 직접 토큰 교환 불가능

### 해결 방안
1. **Personal Access Token 방식** 사용 (현재 구현됨)
2. **프록시 서버** 구축하여 토큰 교환 처리
3. **GitHub App** 방식으로 변경

## 4. 현재 구현된 기능

### OAuth 로그인 버튼
- GitHub OAuth 페이지로 리디렉션
- 사용자 인증 완료 후 콜백 처리

### 토큰 방식 로그인 (백업)
- Personal Access Token 입력
- 직접 인증 및 사용자 정보 가져오기

## 5. 사용 방법

### OAuth 방식 (권장)
1. "🔗 GitHub 로그인" 버튼 클릭
2. GitHub에서 로그인 및 권한 승인
3. 자동으로 사이트로 돌아옴

### 토큰 방식 (백업)
1. "🔑 토큰으로 연결" 버튼 클릭
2. Personal Access Token 입력
3. 수동으로 토큰 생성 필요

## 6. 보안 고려사항

- **Client Secret**은 절대 클라이언트에 노출하지 않음
- **Personal Access Token**은 사용자 개인 정보
- **HTTPS** 환경에서만 사용 권장
- **토큰 만료** 정책 적용 고려
