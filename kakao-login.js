/**
 * 카카오 로그인 서비스
 * 카카오 OAuth 2.0을 사용한 로그인 및 GitHub Gist 연동
 */

window.kakaoLogin = {
    // 카카오 API 설정
    KAKAO_CLIENT_ID: 'YOUR_KAKAO_REST_API_KEY', // 카카오 개발자 콘솔에서 발급받은 REST API 키
    KAKAO_REDIRECT_URI: window.location.origin + '/kakao-callback',
    KAKAO_AUTH_URL: 'https://kauth.kakao.com/oauth/authorize',
    KAKAO_TOKEN_URL: 'https://kauth.kakao.com/oauth/token',
    KAKAO_USER_INFO_URL: 'https://kapi.kakao.com/v2/user/me',
    
    // 카카오 사용자 정보
    kakaoUserInfo: null,
    kakaoAccessToken: null,
    
    /**
     * 카카오 로그인 초기화
     */
    init() {
        console.log('=== 카카오 로그인 초기화 시작 ===');
        
        // URL에서 카카오 콜백 처리
        this.handleKakaoCallback();
        
        // 저장된 카카오 토큰 확인
        this.loadStoredKakaoToken();
        
        console.log('=== 카카오 로그인 초기화 완료 ===');
    },
    
    /**
     * 카카오 로그인 시작
     */
    startKakaoLogin() {
        console.log('=== 카카오 로그인 시작 ===');
        
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.KAKAO_CLIENT_ID,
            redirect_uri: this.KAKAO_REDIRECT_URI,
            scope: 'profile_nickname,profile_image,account_email' // 필요한 권한
        });
        
        const kakaoAuthUrl = `${this.KAKAO_AUTH_URL}?${params.toString()}`;
        console.log('카카오 인증 URL:', kakaoAuthUrl);
        
        // 카카오 로그인 페이지로 리디렉션
        window.location.href = kakaoAuthUrl;
    },
    
    /**
     * 카카오 콜백 처리
     */
    async handleKakaoCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        
        if (error) {
            console.error('카카오 로그인 오류:', error);
            alert('카카오 로그인 중 오류가 발생했습니다: ' + error);
            return;
        }
        
        if (code) {
            console.log('카카오 인증 코드 수신:', code.substring(0, 10) + '...');
            
            try {
                // 1. 코드를 액세스 토큰으로 교환
                const accessToken = await this.getAccessTokenFromKakao(code);
                console.log('카카오 액세스 토큰 획득:', accessToken ? '성공' : '실패');
                
                if (accessToken) {
                    // 2. 사용자 정보 가져오기
                    const userInfo = await this.getKakaoUserInfo(accessToken);
                    console.log('카카오 사용자 정보:', userInfo);
                    
                    if (userInfo) {
                        // 3. GitHub Gist와 연동
                        await this.linkWithGitHubGist(userInfo, accessToken);
                        
                        // 4. URL 정리
                        this.clearKakaoCallbackUrl();
                        
                        alert(`카카오 로그인 성공!\n환영합니다, ${userInfo.nickname}님!`);
                    }
                }
            } catch (error) {
                console.error('카카오 로그인 처리 오류:', error);
                alert('카카오 로그인 처리 중 오류가 발생했습니다: ' + error.message);
            }
        }
    },
    
    /**
     * 카카오에서 액세스 토큰 가져오기
     */
    async getAccessTokenFromKakao(code) {
        try {
            const response = await fetch(this.KAKAO_TOKEN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: this.KAKAO_CLIENT_ID,
                    redirect_uri: this.KAKAO_REDIRECT_URI,
                    code: code
                }).toString()
            });
            
            if (!response.ok) {
                throw new Error(`토큰 요청 실패: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('카카오 토큰 응답:', data);
            
            if (data.access_token) {
                this.kakaoAccessToken = data.access_token;
                // 토큰 저장
                localStorage.setItem('kakao_access_token', data.access_token);
                return data.access_token;
            } else {
                throw new Error('카카오 액세스 토큰을 받지 못했습니다.');
            }
        } catch (error) {
            console.error('카카오 토큰 요청 오류:', error);
            throw error;
        }
    },
    
    /**
     * 카카오 사용자 정보 가져오기
     */
    async getKakaoUserInfo(accessToken) {
        try {
            const response = await fetch(this.KAKAO_USER_INFO_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
                }
            });
            
            if (!response.ok) {
                throw new Error(`사용자 정보 요청 실패: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('카카오 사용자 정보 응답:', data);
            
            // 사용자 정보 정리
            const userInfo = {
                id: data.id,
                nickname: data.kakao_account?.profile?.nickname || '카카오 사용자',
                profileImage: data.kakao_account?.profile?.profile_image_url || '',
                email: data.kakao_account?.email || '',
                connectedAt: data.connected_at
            };
            
            this.kakaoUserInfo = userInfo;
            // 사용자 정보 저장
            localStorage.setItem('kakao_user_info', JSON.stringify(userInfo));
            
            return userInfo;
        } catch (error) {
            console.error('카카오 사용자 정보 요청 오류:', error);
            throw error;
        }
    },
    
    /**
     * GitHub Gist와 연동
     */
    async linkWithGitHubGist(kakaoUserInfo, kakaoAccessToken) {
        console.log('=== 카카오-GitHub Gist 연동 시작 ===');
        
        try {
            // 기존 GitHub 연동이 있는지 확인
            if (window.githubStorage && window.githubStorage.accessToken && window.githubStorage.gistId) {
                console.log('기존 GitHub 연동 발견, 카카오 정보와 연결');
                
                // 카카오 정보를 GitHub Gist에 저장
                await this.saveKakaoInfoToGist(kakaoUserInfo, kakaoAccessToken);
                
                // UI 업데이트
                this.updateKakaoLoginUI();
                
            } else {
                console.log('GitHub 연동이 없음, GitHub 연동을 먼저 진행해야 합니다.');
                alert('카카오 로그인 성공!\n\nGitHub 연동을 먼저 진행한 후 카카오 로그인을 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('카카오-GitHub 연동 오류:', error);
            throw error;
        }
    },
    
    /**
     * 카카오 정보를 GitHub Gist에 저장
     */
    async saveKakaoInfoToGist(kakaoUserInfo, kakaoAccessToken) {
        try {
            // 현재 데이터 가져오기
            const currentData = window.storageManager.exportData();
            const dataObj = JSON.parse(currentData);
            
            // 카카오 정보 추가
            dataObj.kakaoInfo = {
                userInfo: kakaoUserInfo,
                accessToken: kakaoAccessToken,
                linkedAt: new Date().toISOString()
            };
            
            // 업데이트된 데이터를 GitHub에 저장
            const gistData = {
                files: {
                    'auction-data.json': {
                        content: JSON.stringify(dataObj, null, 2)
                    }
                }
            };
            
            const response = await fetch(`${window.githubStorage.GIST_API_URL}/${window.githubStorage.gistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${window.githubStorage.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gistData)
            });
            
            if (response.ok) {
                console.log('카카오 정보가 GitHub Gist에 저장되었습니다.');
            } else {
                throw new Error('GitHub Gist 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('카카오 정보 GitHub 저장 오류:', error);
            throw error;
        }
    },
    
    /**
     * 저장된 카카오 토큰 불러오기
     */
    loadStoredKakaoToken() {
        const token = localStorage.getItem('kakao_access_token');
        const userInfo = localStorage.getItem('kakao_user_info');
        
        if (token && userInfo) {
            this.kakaoAccessToken = token;
            this.kakaoUserInfo = JSON.parse(userInfo);
            console.log('저장된 카카오 정보 로드:', this.kakaoUserInfo);
            this.updateKakaoLoginUI();
        }
    },
    
    /**
     * 카카오 로그인 UI 업데이트
     */
    updateKakaoLoginUI() {
        const kakaoStatusElement = document.getElementById('kakao-status');
        const kakaoLoginButton = document.getElementById('kakao-login-btn');
        const kakaoLogoutButton = document.getElementById('kakao-logout-btn');
        
        if (this.kakaoUserInfo) {
            // 로그인된 상태
            if (kakaoStatusElement) {
                kakaoStatusElement.textContent = `✅ ${this.kakaoUserInfo.nickname}님 카카오 로그인됨`;
            }
            if (kakaoLoginButton) kakaoLoginButton.style.display = 'none';
            if (kakaoLogoutButton) kakaoLogoutButton.style.display = 'inline-block';
        } else {
            // 로그인되지 않은 상태
            if (kakaoStatusElement) {
                kakaoStatusElement.textContent = '❌ 카카오 미로그인';
            }
            if (kakaoLoginButton) kakaoLoginButton.style.display = 'inline-block';
            if (kakaoLogoutButton) kakaoLogoutButton.style.display = 'none';
        }
    },
    
    /**
     * 카카오 로그아웃
     */
    logoutFromKakao() {
        const confirmLogout = confirm('카카오 로그아웃을 하시겠습니까?');
        
        if (confirmLogout) {
            // 로컬 저장소에서 카카오 정보 삭제
            localStorage.removeItem('kakao_access_token');
            localStorage.removeItem('kakao_user_info');
            
            // 메모리에서 정보 삭제
            this.kakaoAccessToken = null;
            this.kakaoUserInfo = null;
            
            // UI 업데이트
            this.updateKakaoLoginUI();
            
            alert('카카오 로그아웃이 완료되었습니다.');
        }
    },
    
    /**
     * 카카오 콜백 URL 정리
     */
    clearKakaoCallbackUrl() {
        if (window.location.search.includes('code=') || window.location.search.includes('error=')) {
            const url = new URL(window.location);
            url.search = '';
            window.history.replaceState({}, document.title, url.toString());
        }
    }
};

// 카카오 로그인 초기화
if (typeof window !== 'undefined') {
    window.kakaoLogin.init();
}

// UI 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', () => {
    // 카카오 로그인 버튼
    const kakaoLoginButton = document.getElementById('kakao-login-btn');
    if (kakaoLoginButton) {
        kakaoLoginButton.addEventListener('click', () => {
            console.log('카카오 로그인 버튼 클릭됨');
            window.kakaoLogin.startKakaoLogin();
        });
        console.log('카카오 로그인 버튼 이벤트 리스너 등록 완료');
    }
    
    // 카카오 로그아웃 버튼
    const kakaoLogoutButton = document.getElementById('kakao-logout-btn');
    if (kakaoLogoutButton) {
        kakaoLogoutButton.addEventListener('click', () => {
            console.log('카카오 로그아웃 버튼 클릭됨');
            window.kakaoLogin.logoutFromKakao();
        });
        console.log('카카오 로그아웃 버튼 이벤트 리스너 등록 완료');
    }
});
