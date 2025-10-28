# 🔐 Firebase API 키 보안 조치 가이드

## ⚠️ 현재 상황
Google Cloud Platform에서 공개된 API 키를 감지했습니다:
- **API 키**: `AIzaSyDPnxaGJxUayYRse8mbG-ironpSp4nC3qg`
- **프로젝트**: bidcal (id: bidcal-4ea79)
- **노출 위치**: GitHub 저장소의 `GoogleService-Info.plist` 파일

## ✅ 완료된 조치

### 1. Git 추적에서 파일 제거 ✅
```bash
git rm --cached bidcal/GoogleService-Info.plist
```

### 2. .gitignore 추가 ✅
```
GoogleService-Info.plist
bidcal/GoogleService-Info.plist
bidcal/bidcal/GoogleService-Info.plist
```

### 3. 변경사항 커밋 ✅
```bash
git commit -m "security: Remove Firebase credentials from Git tracking"
```

## 🚨 필수 수동 조치 (지금 바로 진행)

### 1단계: Firebase Console에서 API 키 재생성

1. **Firebase Console 접속**
   - URL: https://console.firebase.google.com/
   - 프로젝트 선택: `bidcal-4ea79`

2. **프로젝트 설정 이동**
   - 좌측 상단 톱니바퀴 아이콘 ⚙️ 클릭
   - "프로젝트 설정" 선택

3. **iOS 앱 찾기**
   - "일반" 탭에서 iOS 앱 찾기
   - Bundle ID: `com.giroklabs.bidcal`

4. **새 GoogleService-Info.plist 다운로드**
   - "GoogleService-Info.plist 다운로드" 버튼 클릭
   - 새 파일을 다운로드 (새 API 키 포함)

5. **Xcode 프로젝트에 추가**
   ```bash
   # 다운로드한 파일을 프로젝트 디렉터리로 복사
   cp ~/Downloads/GoogleService-Info.plist /Users/greego/Desktop/bid/bidcal/bidcal/
   ```
   - Xcode에서 파일 드래그 앤 드롭
   - "Copy items if needed" 체크
   - Target: bidcal 선택

### 2단계: Google Cloud Console에서 기존 API 키 삭제

1. **Google Cloud Console 접속**
   - URL: https://console.cloud.google.com/
   - 프로젝트: bidcal-4ea79 선택

2. **API 및 서비스 > 사용자 인증 정보**
   - 좌측 메뉴에서 "API 및 서비스" 클릭
   - "사용자 인증 정보" 선택

3. **노출된 API 키 찾기**
   - API 키 목록에서 `AIzaSyDPnxaGJxUayYRse8mbG-ironpSp4nC3qg` 검색
   - 또는 키 이름으로 검색

4. **API 키 삭제**
   - 키 옆의 삭제 버튼 (🗑️) 클릭
   - 삭제 확인

### 3단계: Git 히스토리에서 완전 삭제 (선택사항, 권장)

**방법 1: BFG Repo-Cleaner 사용 (권장)**

```bash
# BFG 설치 (Homebrew 사용)
brew install bfg

# 저장소 백업
cd /Users/greego/Desktop
cp -r bid bid-backup

# BFG로 파일 히스토리 삭제
cd bid
bfg --delete-files GoogleService-Info.plist

# Git 히스토리 정리
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 강제 푸시 (주의: 협업 시 팀원과 조율 필요)
git push --force
```

**방법 2: git filter-repo 사용**

```bash
# git-filter-repo 설치
brew install git-filter-repo

# 파일 히스토리 삭제
cd /Users/greego/Desktop/bid
git filter-repo --path bidcal/GoogleService-Info.plist --invert-paths

# 강제 푸시
git push --force
```

**방법 3: 새 저장소로 시작 (가장 확실)**

```bash
# 현재 저장소 백업
cd /Users/greego/Desktop
mv bid bid-old

# 새 저장소 생성
mkdir bid
cd bid
git init

# 최신 코드만 복사 (GoogleService-Info.plist 제외)
cp -r ../bid-old/* .
rm -f bidcal/GoogleService-Info.plist
rm -rf .git
git init

# 새 저장소로 푸시
git add .
git commit -m "Initial commit: Clean repository without sensitive data"
git remote add origin https://github.com/giroklabs/bidsimulator.git
git push -u origin main --force
```

### 4단계: API 키 제한 설정 (추가 보안)

1. **Google Cloud Console > API 및 서비스 > 사용자 인증 정보**

2. **새 API 키 클릭**

3. **API 제한사항 설정**
   - "API 제한사항" 섹션
   - "키 제한" 선택
   - 필요한 API만 선택:
     - ✅ Firebase Authentication API
     - ✅ Cloud Firestore API
     - ✅ Cloud Storage for Firebase API
     - ✅ Firebase Installations API

4. **애플리케이션 제한사항 설정**
   - "iOS 앱" 선택
   - Bundle ID 추가: `com.giroklabs.bidcal`

5. **저장** 버튼 클릭

### 5단계: URL Schemes 업데이트

새로운 `GoogleService-Info.plist`의 `REVERSED_CLIENT_ID`를 확인하고 Xcode에서 업데이트:

1. **새 REVERSED_CLIENT_ID 확인**
   ```bash
   # plist 파일에서 값 확인
   /usr/libexec/PlistBuddy -c "Print :REVERSED_CLIENT_ID" \
     /Users/greego/Desktop/bid/bidcal/bidcal/GoogleService-Info.plist
   ```

2. **Xcode에서 URL Schemes 업데이트**
   - Xcode에서 프로젝트 선택
   - TARGETS > bidcal > Info 탭
   - URL Types > Item 0 > URL Schemes
   - 새 `REVERSED_CLIENT_ID` 값으로 변경

## 🔍 보안 확인 체크리스트

- [ ] Firebase Console에서 새 `GoogleService-Info.plist` 다운로드
- [ ] Xcode 프로젝트에 새 파일 추가
- [ ] Google Cloud Console에서 기존 API 키 삭제
- [ ] API 키 제한사항 설정 (애플리케이션 제한 + API 제한)
- [ ] Git 히스토리에서 민감한 파일 제거 (선택)
- [ ] `.gitignore`에 `GoogleService-Info.plist` 추가 확인
- [ ] 앱 빌드 및 Firebase 연결 테스트
- [ ] GitHub 저장소에 민감한 정보 없는지 재확인

## 📚 참고 자료

- [Firebase 보안 규칙](https://firebase.google.com/docs/rules)
- [Google Cloud API 키 모범 사례](https://cloud.google.com/docs/authentication/api-keys)
- [보안 침해된 GCP 사용자 인증 정보 처리](https://cloud.google.com/iam/docs/best-practices-for-securing-service-accounts)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)

## ⚡ 긴급 연락처

문제 발생 시:
- Firebase Support: https://firebase.google.com/support
- Google Cloud Support: https://cloud.google.com/support

## 🎯 향후 예방 조치

1. **개발 환경 변수 사용**
   - `.xcconfig` 파일로 환경 변수 관리
   - Xcode Build Settings에서 참조

2. **Pre-commit Hook 설정**
   ```bash
   # .git/hooks/pre-commit 파일 생성
   #!/bin/bash
   if git diff --cached --name-only | grep -q "GoogleService-Info.plist"; then
     echo "Error: Attempting to commit GoogleService-Info.plist"
     echo "This file contains sensitive API keys and should not be committed."
     exit 1
   fi
   ```

3. **GitHub Secret Scanning 활성화**
   - Settings > Security > Code security and analysis
   - Secret scanning 활성화

4. **정기적인 보안 점검**
   - 월 1회 API 키 사용량 확인
   - 의심스러운 활동 모니터링

---

**마지막 업데이트**: 2025-10-28
**작성자**: Girok Labs

