#!/bin/bash

# Firebase 설정 검증 스크립트
echo "🔍 Firebase 설정 검증 중..."
echo ""

# 1. GoogleService-Info.plist 파일 존재 확인
echo "✓ 1. GoogleService-Info.plist 파일 확인"
if [ -f "bidcal/bidcal/GoogleService-Info.plist" ]; then
    echo "   ✅ 파일 존재: bidcal/bidcal/GoogleService-Info.plist"
else
    echo "   ❌ 파일 없음: bidcal/bidcal/GoogleService-Info.plist"
    exit 1
fi
echo ""

# 2. API 키 확인
echo "✓ 2. API 키 확인"
API_KEY=$(/usr/libexec/PlistBuddy -c "Print :API_KEY" bidcal/bidcal/GoogleService-Info.plist)
echo "   현재 API 키: $API_KEY"
if [ "$API_KEY" == "AIzaSyDPnxaGJxUayYRse8mbG-ironpSp4nC3qg" ]; then
    echo "   ⚠️  경고: 이것은 노출된 API 키입니다!"
    echo "   👉 Firebase Console에서 새 키를 생성하고 파일을 다시 다운로드하세요."
else
    echo "   ✅ 새로운 API 키가 설정되었습니다."
fi
echo ""

# 3. Bundle ID 확인
echo "✓ 3. Bundle ID 확인"
BUNDLE_ID=$(/usr/libexec/PlistBuddy -c "Print :BUNDLE_ID" bidcal/bidcal/GoogleService-Info.plist)
echo "   Bundle ID: $BUNDLE_ID"
if [ "$BUNDLE_ID" == "com.giroklabs.bidcal" ]; then
    echo "   ✅ Bundle ID 일치"
else
    echo "   ❌ Bundle ID 불일치"
fi
echo ""

# 4. REVERSED_CLIENT_ID 확인
echo "✓ 4. REVERSED_CLIENT_ID 확인"
REVERSED_CLIENT_ID=$(/usr/libexec/PlistBuddy -c "Print :REVERSED_CLIENT_ID" bidcal/bidcal/GoogleService-Info.plist)
echo "   REVERSED_CLIENT_ID: $REVERSED_CLIENT_ID"
echo ""

# 5. URL Scheme 확인
echo "✓ 5. URL Scheme 확인"
URL_SCHEME=$(/usr/libexec/PlistBuddy -c "Print :CFBundleURLTypes:0:CFBundleURLSchemes:0" bidcal/bidcal/Info.plist 2>/dev/null)
if [ -n "$URL_SCHEME" ]; then
    echo "   URL Scheme: $URL_SCHEME"
    if [ "$URL_SCHEME" == "$REVERSED_CLIENT_ID" ]; then
        echo "   ✅ URL Scheme이 REVERSED_CLIENT_ID와 일치합니다."
    else
        echo "   ⚠️  URL Scheme과 REVERSED_CLIENT_ID가 다릅니다."
        echo "   Info.plist를 수동으로 업데이트하세요."
    fi
else
    echo "   ❌ URL Scheme이 설정되지 않았습니다."
    echo "   Xcode에서 Info > URL Types에 추가하세요."
fi
echo ""

# 6. .gitignore 확인
echo "✓ 6. .gitignore 확인"
if grep -q "GoogleService-Info.plist" .gitignore; then
    echo "   ✅ .gitignore에 GoogleService-Info.plist가 추가되어 있습니다."
else
    echo "   ⚠️  .gitignore에 GoogleService-Info.plist가 없습니다."
fi
echo ""

# 7. Git 상태 확인
echo "✓ 7. Git 상태 확인"
if git status | grep -q "GoogleService-Info.plist"; then
    echo "   ⚠️  GoogleService-Info.plist가 Git에 추적되고 있습니다!"
    echo "   git rm --cached bidcal/bidcal/GoogleService-Info.plist 실행이 필요합니다."
else
    echo "   ✅ GoogleService-Info.plist가 Git에 추적되지 않습니다."
fi
echo ""

# 8. 프로젝트 정보
echo "✓ 8. 프로젝트 정보"
PROJECT_ID=$(/usr/libexec/PlistBuddy -c "Print :PROJECT_ID" bidcal/bidcal/GoogleService-Info.plist)
STORAGE_BUCKET=$(/usr/libexec/PlistBuddy -c "Print :STORAGE_BUCKET" bidcal/bidcal/GoogleService-Info.plist)
echo "   Project ID: $PROJECT_ID"
echo "   Storage Bucket: $STORAGE_BUCKET"
echo ""

# 최종 요약
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 검증 완료!"
echo ""
if [ "$API_KEY" == "AIzaSyDPnxaGJxUayYRse8mbG-ironpSp4nC3qg" ]; then
    echo "⚠️  중요: 노출된 API 키를 사용 중입니다!"
    echo ""
    echo "다음 단계를 진행하세요:"
    echo "1. Firebase Console에 로그인"
    echo "   👉 https://console.firebase.google.com/project/$PROJECT_ID"
    echo ""
    echo "2. 프로젝트 설정 > iOS 앱 > GoogleService-Info.plist 다운로드"
    echo ""
    echo "3. 다운로드한 파일로 교체:"
    echo "   cp ~/Downloads/GoogleService-Info.plist bidcal/bidcal/"
    echo ""
    echo "4. Google Cloud Console에서 기존 API 키 삭제"
    echo "   👉 https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
else
    echo "✅ 모든 설정이 완료되었습니다!"
    echo ""
    echo "다음 단계:"
    echo "1. Xcode에서 앱 빌드 및 실행"
    echo "2. Google 로그인 테스트"
    echo "3. Firebase Console에서 사용량 모니터링"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

