/**
 * GitHub 연동 저장소 시스템
 * GitHub Gist API를 사용하여 데이터를 클라우드에 저장/불러오기
 */

window.githubStorage = {
    // GitHub API 설정
    GITHUB_API_BASE: 'https://api.github.com',
    GIST_API_URL: 'https://api.github.com/gists',

    // OAuth 설정 (GitHub OAuth App에서 생성)
    CLIENT_ID: 'Ov23li1iPKmWdw0h568z', // 새로운 GitHub OAuth App Client ID
    REDIRECT_URI: 'https://giroklabs.github.io/bidsimulator', // GitHub Pages URL
    OAUTH_URL: 'https://github.com/login/oauth/authorize',

    // 인증 토큰 (OAuth로 획득)
    accessToken: null,

    // 사용자 정보
    userInfo: null,

    // Gist ID (저장된 데이터의 고유 ID)
    gistId: null,

    // 디바이스 코드 (디바이스 흐름용)
    deviceCode: null,
    userCode: null,
    
    // 초기화
    init() {
        console.log('GitHub Storage 초기화 시작');

        // 저장된 토큰과 Gist ID 불러오기
        this.loadStoredCredentials();

        // URL에서 OAuth 콜백 처리 (저장된 자격증명 로드 후)
        this.handleOAuthCallback();

        // 모바일 감지 및 최적화
        this.detectMobileAndOptimize();

        // UI 업데이트
        this.updateUI();

        // 에러 처리 설정
        this.setupErrorHandling();

        console.log('GitHub Storage 초기화 완료');
    },
    
    // 에러 처리 설정
    setupErrorHandling() {
        // CSP 에러 모니터링
        window.addEventListener('error', (event) => {
            if (event.message && event.message.includes('Content Security Policy')) {
                console.warn('CSP 에러 감지됨:', event.message);
                // CSP 에러가 발생해도 OAuth는 계속 시도
            }
        });
        
        // 리소스 로딩 실패 모니터링
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.message && event.reason.message.includes('CSP')) {
                console.warn('CSP 관련 Promise rejection:', event.reason.message);
            }
        });
    },
    
    // OAuth 콜백 처리
    // URL에서 OAuth 콜백 처리 (GitHub 가이드 기반)
    async handleOAuthCallback() {
        // URL 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        // OAuth 콜백이 아닌 경우 리턴
        if (!code && !error) {
            return;
        }

        console.log('OAuth 콜백 처리 시작:', { code: !!code, state, error });

        if (error) {
            console.error('OAuth 오류:', error, errorDescription);
            let errorMessage = 'GitHub 인증에 실패했습니다.';

            switch (error) {
                case 'access_denied':
                    errorMessage = '사용자가 GitHub 인증을 취소했습니다.';
                    break;
                case 'redirect_uri_mismatch':
                    errorMessage = '리다이렉션 URL이 일치하지 않습니다.';
                    break;
                case 'application_suspended':
                    errorMessage = 'GitHub 앱이 일시 중단되었습니다.';
                    break;
                default:
                    errorMessage = `인증 오류: ${errorDescription || error}`;
            }

            alert(errorMessage);
            this.clearUrlParams();
            return;
        }

        if (code) {
            // State 검증 (CSRF 보호)
            const savedState = sessionStorage.getItem('github_oauth_state');
            if (savedState && state !== savedState) {
                console.error('State 불일치 - CSRF 공격 가능성');
                alert('보안 오류가 발생했습니다. 다시 시도해주세요.');
                this.clearUrlParams();
                return;
            }

            console.log('OAuth 인증 코드 수신 - 토큰 교환 시작');

            try {
                // 코드를 액세스 토큰으로 교환
                const success = await this.exchangeCodeForToken(code);

                if (success) {
                    console.log('OAuth 인증 성공');

                    // 모바일 리디렉션인 경우 원래 페이지로 복귀
                    const redirectUrl = sessionStorage.getItem('github_oauth_redirect_url');
                    if (redirectUrl && redirectUrl !== window.location.href) {
                        console.log('모바일 리디렉션 복귀:', redirectUrl);
                        window.location.href = redirectUrl;
                        return;
                    }

                    // UI 업데이트
                    this.updateUI();
                    alert('GitHub 연동이 완료되었습니다!');
                } else {
                    throw new Error('토큰 교환 실패');
                }

            } catch (tokenError) {
                console.error('토큰 교환 중 오류:', tokenError);
                alert('인증 토큰 교환 중 오류가 발생했습니다. 다시 시도해주세요.');
            }

            // URL 정리
            this.clearUrlParams();
        }
    },
    
    // 저장된 인증 정보 불러오기
    loadStoredCredentials() {
        this.accessToken = localStorage.getItem('github_access_token');
        this.gistId = localStorage.getItem('github_gist_id');
        this.userInfo = JSON.parse(localStorage.getItem('github_user_info') || 'null');
        
        if (this.accessToken && this.gistId) {
            console.log('저장된 GitHub 인증 정보 발견');
        }
    },
    
    // 사용자 정보 가져오기
    async fetchUserInfo() {
        try {
            const response = await fetch(`${this.GITHUB_API_BASE}/user`, {
                headers: {
                    'Authorization': `token ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`사용자 정보 조회 실패: ${response.status}`);
            }

            this.userInfo = await response.json();
            console.log('사용자 정보 조회 성공:', this.userInfo.login);
            return this.userInfo;

        } catch (error) {
            console.error('사용자 정보 조회 오류:', error);
            throw new Error('사용자 정보를 가져올 수 없습니다.');
        }
    },

    // Gist 생성 또는 기존 Gist 가져오기
    async createOrGetGist() {
        try {
            // 기존 Gist가 있는지 확인
            if (this.gistId) {
                const exists = await this.checkGistExists(this.gistId);
                if (exists) {
                    console.log('기존 Gist 발견:', this.gistId);
                    return this.gistId;
                }
            }

            // 새 Gist 생성
            console.log('새 Gist 생성 중...');
            const gistData = {
                description: '경매 입찰가격 시뮬레이션 데이터 - 자동 생성',
                public: false,
                files: {
                    'auction-data.json': {
                        content: JSON.stringify({
                            version: '1.0',
                            created: new Date().toISOString(),
                            properties: []
                        }, null, 2)
                    }
                }
            };

            const response = await fetch(this.GIST_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gistData)
            });

            if (!response.ok) {
                throw new Error(`Gist 생성 실패: ${response.status}`);
            }

            const gist = await response.json();
            this.gistId = gist.id;
            console.log('Gist 생성 성공:', this.gistId);
            return this.gistId;

        } catch (error) {
            console.error('Gist 처리 오류:', error);
            throw new Error('데이터 저장소를 생성할 수 없습니다.');
        }
    },

    // Gist 존재 여부 확인
    async checkGistExists(gistId) {
        try {
            const response = await fetch(`${this.GIST_API_URL}/${gistId}`, {
                headers: {
                    'Authorization': `token ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Gist 존재 확인 오류:', error);
            return false;
        }
    },

    // CSRF 보호를 위한 State 생성
    generateState() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    },

    // URL 파라미터 정리
    clearUrlParams() {
        const url = new URL(window.location);
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        url.searchParams.delete('error');
        url.searchParams.delete('error_description');

        // 브라우저 히스토리 업데이트 (깔끔한 URL 유지)
        window.history.replaceState({}, document.title, url.pathname + url.hash);
    },

    // 인증 정보 저장
    saveCredentials() {
        localStorage.setItem('github_access_token', this.accessToken);
        localStorage.setItem('github_gist_id', this.gistId);
        if (this.userInfo) {
            localStorage.setItem('github_user_info', JSON.stringify(this.userInfo));
        }

        console.log('GitHub 인증 정보 저장 완료');
        this.updateUI();
    },

    // 기존 saveCredentials 함수 (하위 호환성 유지)
    saveCredentialsLegacy(token, gistId, userInfo = null) {
        this.accessToken = token;
        this.gistId = gistId;
        this.userInfo = userInfo;

        localStorage.setItem('github_access_token', token);
        localStorage.setItem('github_gist_id', gistId);
        if (userInfo) {
            localStorage.setItem('github_user_info', JSON.stringify(userInfo));
        }

        console.log('GitHub 인증 정보 저장 완료 (레거시)');
        this.updateUI();
    },
    
    // 인증 정보 삭제
    clearCredentials() {
        this.accessToken = null;
        this.gistId = null;
        
        localStorage.removeItem('github_access_token');
        localStorage.removeItem('github_gist_id');
        
        console.log('GitHub 인증 정보 삭제 완료');
        this.updateUI();
    },
    
    // UI 업데이트
    updateUI() {
        const statusElement = document.getElementById('github-status');
        const connectButton = document.getElementById('github-connect-btn');
        const disconnectButton = document.getElementById('github-disconnect-btn');
        const syncButtons = document.getElementById('github-sync-buttons');
        
        if (this.accessToken && this.gistId) {
            const userName = this.userInfo ? this.userInfo.login : '사용자';
            if (statusElement) statusElement.textContent = `✅ ${userName}님 로그인됨`;
            if (connectButton) connectButton.style.display = 'none';
            if (disconnectButton) disconnectButton.style.display = 'inline-block';
            if (syncButtons) syncButtons.style.display = 'block';
        } else {
            if (statusElement) statusElement.textContent = '❌ GitHub 미연동';
            if (connectButton) connectButton.style.display = 'inline-block';
            if (disconnectButton) disconnectButton.style.display = 'none';
            if (syncButtons) syncButtons.style.display = 'none';
        }
    },
    
    // GitHub OAuth 로그인 시작 (GitHub 가이드 기반 다중 흐름 지원)
    async connectToGitHub() {
        try {
            console.log('GitHub OAuth 연결 시작');

            // 네트워크 연결 상태 확인
            if (!navigator.onLine) {
                throw new Error('네트워크 연결이 필요합니다. 인터넷 연결을 확인해주세요.');
            }

            // 모바일 브라우저 감지
            const isMobile = this.isMobileDevice();

            // 사용자에게 인증 방식 선택
            const authMethod = await this.selectAuthMethod(isMobile);

            switch (authMethod) {
                case 'redirect':
                    console.log('리디렉션 방식 OAuth 선택');
                    return await this.startOAuthFlowRedirect();

                case 'popup':
                    console.log('팝업 방식 OAuth 선택');
                    return await this.startOAuthFlowPopup();

                case 'device':
                    console.log('디바이스 흐름 OAuth 선택');
                    return await this.startOAuthFlowDevice();

                case 'token':
                default:
                    console.log('토큰 방식으로 폴백');
                    return await this.connectToGitHubWithToken();
            }

        } catch (error) {
            console.error('OAuth 연결 오류:', error);
            alert('GitHub 연결 중 오류가 발생했습니다: ' + error.message);

            // 오류 시 토큰 방식으로 폴백
            setTimeout(() => {
                if (confirm('OAuth 방식에 문제가 있습니다.\n\nPersonal Access Token 방식으로 시도하시겠습니까?\n\n(더 안정적인 방법입니다)')) {
                    this.connectToGitHubWithToken();
                }
            }, 1000);
        }
    },

    // 인증 방식 선택 (사용자 친화적)
    async selectAuthMethod(isMobile) {
        const methods = [];

        if (isMobile) {
            methods.push(
                '웹 브라우저로 이동하여 인증 (권장)',
                '디바이스 코드 방식',
                'Personal Access Token 방식'
            );
        } else {
            methods.push(
                '팝업 창으로 인증 (권장)',
                '웹 브라우저로 이동하여 인증',
                '디바이스 코드 방식',
                'Personal Access Token 방식'
            );
        }

        const methodNames = methods.map((method, index) => `${index + 1}. ${method}`).join('\n');

        const choice = prompt(`GitHub 인증 방식을 선택해주세요:\n\n${methodNames}\n\n번호를 입력하세요 (기본: 1):`, '1');

        if (!choice || choice.trim() === '') {
            return isMobile ? 'redirect' : 'popup';
        }

        const choiceNum = parseInt(choice.trim());

        if (isMobile) {
            switch (choiceNum) {
                case 1: return 'redirect';
                case 2: return 'device';
                case 3: return 'token';
                default: return 'redirect';
            }
        } else {
            switch (choiceNum) {
                case 1: return 'popup';
                case 2: return 'redirect';
                case 3: return 'device';
                case 4: return 'token';
                default: return 'popup';
            }
        }
    },

    // 모바일 브라우저 감지 및 최적화
    detectMobileAndOptimize() {
        const isMobile = this.isMobileDevice();
        console.log('모바일 감지:', isMobile, 'UserAgent:', navigator.userAgent);

        // 모바일 공지 표시
        const mobileNotice = document.getElementById('mobile-notice');
        if (mobileNotice) {
            mobileNotice.style.display = isMobile ? 'block' : 'none';
        }

        // 모바일 환경 최적화
        if (isMobile) {
            this.optimizeForMobile();
        }
    },

    // 모바일 환경 최적화
    optimizeForMobile() {
        console.log('모바일 환경 최적화 적용');

        // 터치 이벤트 최적화
        const buttons = document.querySelectorAll('.github-btn');
        buttons.forEach(button => {
            // 터치 시작/종료 이벤트 추가
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.98)';
            }, { passive: true });

            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.style.transform = '';
                }, 150);
            }, { passive: true });
        });

        // 모바일에서 팝업 대신 리디렉션 우선 사용
        this.mobileOptimized = true;
    },

    // 모바일 브라우저 감지
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768 && window.innerHeight <= 1024);
    },

    // OAuth 권한 부여 URL 구성 (GitHub 가이드 기반)
    buildAuthorizeUrl(state = null) {
        const params = new URLSearchParams({
            client_id: this.CLIENT_ID,
            redirect_uri: this.REDIRECT_URI,
            scope: 'gist', // Gist API 접근 권한만 요청
            state: state || this.generateState(),
            allow_signup: 'true' // GitHub 계정이 없는 경우 회원가입 허용
        });

        return `${this.OAUTH_URL}?${params.toString()}`;
    },

    // 팝업 방식 OAuth (데스크톱용)
    async startOAuthFlowPopup() {
        const authUrl = this.buildAuthorizeUrl();

        // 팝업 창 열기
        const popup = window.open(
            authUrl,
            'github-oauth',
            'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
            alert('팝업이 차단되었습니다. 팝업 차단을 해제하거나 모바일에서 다시 시도해주세요.');
            return false;
        }

        // 팝업 모니터링
        return new Promise((resolve, reject) => {
            const checkClosed = setInterval(() => {
                try {
                    if (popup.closed) {
                        clearInterval(checkClosed);
                        // 팝업이 닫혔지만 인증이 완료되었는지 확인
                        setTimeout(() => {
                            if (this.accessToken && this.userInfo) {
                                resolve(true);
                            } else {
                                reject(new Error('OAuth 인증이 취소되었거나 실패했습니다.'));
                            }
                        }, 1000);
                    }
                } catch (error) {
                    clearInterval(checkClosed);
                    reject(error);
                }
            }, 1000);

            // 타임아웃 (3분)
            setTimeout(() => {
                clearInterval(checkClosed);
                if (popup && !popup.closed) {
                    popup.close();
                }
                reject(new Error('OAuth 인증 시간이 초과되었습니다.'));
            }, 180000);
        });
    },

    // 리디렉션 방식 OAuth (모바일용)
    async startOAuthFlowRedirect() {
        // 현재 페이지 URL을 세션에 저장 (콜백 후 복귀용)
        sessionStorage.setItem('github_oauth_redirect_url', window.location.href);

        // GitHub OAuth 페이지로 리디렉션
        const authUrl = this.buildAuthorizeUrl();
        console.log('OAuth 리디렉션:', authUrl);
        window.location.href = authUrl;

        // 리디렉션 후에는 이 함수가 실행되지 않음
        return false;
    },

    // 디바이스 흐름 OAuth (모바일/CLI용 - GitHub 가이드 기반)
    async startOAuthFlowDevice() {
        try {
            console.log('디바이스 흐름 OAuth 시작');

            // 1. 디바이스 코드 요청
            const deviceCodeData = await this.requestDeviceCode();

            // 2. 사용자에게 인증 정보 표시
            const userConfirmed = await this.showDeviceCodeInstructions(deviceCodeData);

            if (!userConfirmed) {
                console.log('사용자가 디바이스 흐름을 취소했습니다.');
                return false;
            }

            // 3. 액세스 토큰 폴링
            const success = await this.pollForAccessToken(deviceCodeData);

            if (success) {
                console.log('디바이스 흐름 인증 성공');
                return true;
            } else {
                throw new Error('토큰 획득 시간 초과');
            }

        } catch (error) {
            console.error('디바이스 흐름 오류:', error);
            alert('디바이스 인증 중 오류가 발생했습니다: ' + error.message);
            return false;
        }
    },

    // 디바이스 코드 요청 (GitHub 가이드 기반)
    async requestDeviceCode() {
        const response = await fetch('https://github.com/login/device/code', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: this.CLIENT_ID,
                scope: 'gist'
            })
        });

        if (!response.ok) {
            throw new Error(`디바이스 코드 요청 실패: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(`GitHub 디바이스 오류: ${data.error_description}`);
        }

        console.log('디바이스 코드 수신:', {
            user_code: data.user_code,
            verification_uri: data.verification_uri
        });

        return {
            device_code: data.device_code,
            user_code: data.user_code,
            verification_uri: data.verification_uri,
            expires_in: data.expires_in,
            interval: data.interval || 5
        };
    },

    // 사용자에게 디바이스 코드 인증 안내 표시
    async showDeviceCodeInstructions(deviceCodeData) {
        const message = `
GitHub 인증이 필요합니다.

1. 아래 URL을 브라우저에서 열어주세요:
   ${deviceCodeData.verification_uri}

2. 인증 코드를 입력하세요:
   ${deviceCodeData.user_code}

3. GitHub에서 인증을 완료해주세요.

이 창은 자동으로 닫히지 않습니다. 인증이 완료되면 이 페이지로 돌아와주세요.
        `;

        console.log('디바이스 인증 안내:', message);

        // 사용자 친화적인 모달 표시 (간단한 confirm으로 대체)
        const confirmed = confirm(`GitHub 인증 코드: ${deviceCodeData.user_code}

브라우저에서 ${deviceCodeData.verification_uri}로 이동하여 위 코드를 입력해주세요.

인증을 시작하시겠습니까?`);

        if (confirmed) {
            // 새 창에서 인증 페이지 열기
            window.open(deviceCodeData.verification_uri, 'github-device-auth',
                'width=600,height=700,scrollbars=yes,resizable=yes');
        }

        return confirmed;
    },

    // 액세스 토큰 폴링 (GitHub 가이드 기반)
    async pollForAccessToken(deviceCodeData) {
        const { device_code, interval, expires_in } = deviceCodeData;
        const startTime = Date.now();
        const maxTime = expires_in * 1000; // 만료 시간

        console.log('토큰 폴링 시작 - 간격:', interval + '초');

        while (Date.now() - startTime < maxTime) {
            try {
                const response = await fetch('https://github.com/login/oauth/access_token', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        client_id: this.CLIENT_ID,
                        device_code: device_code,
                        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
                    })
                });

                const data = await response.json();

                if (data.access_token) {
                    // 토큰 획득 성공!
                    this.accessToken = data.access_token;

                    // 사용자 정보 가져오기
                    await this.fetchUserInfo();

                    // Gist 생성 또는 가져오기
                    await this.createOrGetGist();

                    // 인증 정보 저장
                    this.saveCredentials();

                    return true;
                }

                if (data.error === 'authorization_pending') {
                    // 아직 사용자가 인증하지 않음 - 계속 폴링
                    console.log('인증 대기 중...');
                } else if (data.error === 'slow_down') {
                    // 요청 간격을 늘림
                    console.log('요청 속도 조절 - 간격 증가');
                } else if (data.error === 'expired_token') {
                    throw new Error('인증 코드가 만료되었습니다.');
                } else if (data.error) {
                    throw new Error(`인증 오류: ${data.error_description || data.error}`);
                }

            } catch (error) {
                console.error('토큰 폴링 중 오류:', error);
                throw error;
            }

            // 지정된 간격만큼 대기
            await new Promise(resolve => setTimeout(resolve, interval * 1000));
        }

        throw new Error('토큰 획득 시간 초과');
    },
    
    // 인증 코드를 액세스 토큰으로 교환 (GitHub 가이드 기반)
    async exchangeCodeForToken(code) {
        try {
            console.log('토큰 교환 시작 - 코드:', code.substring(0, 10) + '...');

            // GitHub OAuth 토큰 교환 엔드포인트 호출
            const response = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    // CORS 헤더는 브라우저가 자동으로 처리
                },
                body: new URLSearchParams({
                    client_id: this.CLIENT_ID,
                    code: code,
                    redirect_uri: this.REDIRECT_URI
                    // client_secret은 서버 측에서만 사용 (보안)
                }).toString()
            });

            if (!response.ok) {
                throw new Error(`토큰 교환 실패: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('토큰 교환 응답:', { hasAccessToken: !!data.access_token, hasError: !!data.error });

            if (data.error) {
                throw new Error(`GitHub OAuth 오류: ${data.error_description || data.error}`);
            }

            if (!data.access_token) {
                throw new Error('액세스 토큰을 받지 못했습니다. Client Secret이 필요할 수 있습니다.');
            }

            // 액세스 토큰 저장
            this.accessToken = data.access_token;

            // 사용자 정보 가져오기
            await this.fetchUserInfo();

            // Gist 생성 또는 가져오기
            await this.createOrGetGist();

            // 인증 정보 저장
            this.saveCredentials();

            console.log('토큰 교환 및 인증 완료');
            return true;

        } catch (error) {
            console.error('토큰 교환 오류:', error);

            // CORS 오류나 네트워크 오류인 경우 토큰 방식으로 폴백
            if (error.message.includes('CORS') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                console.log('네트워크 오류 감지 - 토큰 방식으로 폴백');

                if (confirm('OAuth 토큰 교환 중 네트워크 오류가 발생했습니다.\n\nPersonal Access Token 방식으로 시도하시겠습니까?\n\n(더 안정적인 방법입니다)')) {
                    setTimeout(() => {
                        this.connectToGitHubWithToken();
                    }, 500);
                }
                return false;
            }

            // 다른 오류는 사용자에게 표시
            alert(`토큰 교환 중 오류가 발생했습니다:\n${error.message}\n\nPersonal Access Token 방식을 사용해주세요.`);
            return false;
        }
    },
    
    // GitHub 인증 시작 (토큰 방식 - 백업)
    async connectToGitHubWithToken() {
        // 토큰 생성 가이드 표시
        const showGuide = confirm('GitHub Personal Access Token이 필요합니다.\n\n토큰 생성 가이드를 보시겠습니까?');
        
        if (showGuide) {
            // GitHub 토큰 생성 페이지 열기
            window.open('https://github.com/settings/tokens/new?scopes=gist&description=경매시뮬레이션', '_blank');
            
            // 잠시 후 토큰 입력 요청
            setTimeout(() => {
                const token = prompt('GitHub Personal Access Token을 입력하세요:\n\n위에서 생성한 토큰을 복사해서 붙여넣어주세요.');
                this.processToken(token);
            }, 2000);
        } else {
            const token = prompt('GitHub Personal Access Token을 입력하세요:\n\n1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)\n2. Generate new token (classic)\n3. "gist" 권한 체크\n4. 생성된 토큰을 여기에 입력');
            this.processToken(token);
        }
    },
    
    // 토큰 처리
    async processToken(token) {
        if (!token || token.trim() === '') {
            alert('토큰이 입력되지 않았습니다.');
            return false;
        }
        
        try {
            // 토큰 유효성 검증
            const isValid = await this.validateToken(token.trim());
            
            if (isValid) {
                // 사용자 정보 가져오기
                const userInfo = await this.getUserInfo(token.trim());
                
                // 새 Gist 생성 또는 기존 Gist 사용
                const gistId = await this.createOrGetGist(token.trim());
                
                if (gistId) {
                    this.saveCredentials(token.trim(), gistId, userInfo);
                    alert(`GitHub 연동이 완료되었습니다!\n환영합니다, ${userInfo.login}님!`);
                    return true;
                } else {
                    alert('Gist 생성에 실패했습니다.');
                    return false;
                }
            } else {
                alert('유효하지 않은 토큰입니다. 다시 확인해주세요.');
                return false;
            }
        } catch (error) {
            console.error('GitHub 연결 오류:', error);
            alert('GitHub 연결 중 오류가 발생했습니다: ' + error.message);
            return false;
        }
    },
    
    // 토큰 유효성 검증
    async validateToken(token) {
        try {
            const response = await fetch(`${this.GITHUB_API_BASE}/user`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('토큰 검증 오류:', error);
            return false;
        }
    },
    
    // 사용자 정보 가져오기
    async getUserInfo(token) {
        try {
            const response = await fetch(`${this.GITHUB_API_BASE}/user`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('사용자 정보를 가져올 수 없습니다.');
            }
        } catch (error) {
            console.error('사용자 정보 가져오기 오류:', error);
            throw error;
        }
    },
    
    // Gist 생성 또는 기존 Gist 가져오기
    async createOrGetGist(token) {
        try {
            // 기존 Gist가 있는지 확인
            if (this.gistId) {
                const exists = await this.checkGistExists(token, this.gistId);
                if (exists) {
                    return this.gistId;
                }
            }
            
            // 새 Gist 생성
            const gistData = {
                description: '경매 입찰가격 시뮬레이션 데이터',
                public: false,
                files: {
                    'auction-data.json': {
                        content: JSON.stringify({
                            properties: [],
                            lastSaved: new Date().toISOString(),
                            version: '1.0'
                        }, null, 2)
                    }
                }
            };
            
            const response = await fetch(this.GIST_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gistData)
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.id;
            } else {
                throw new Error('Gist 생성 실패');
            }
        } catch (error) {
            console.error('Gist 생성 오류:', error);
            throw error;
        }
    },
    
    // Gist 존재 여부 확인
    async checkGistExists(token, gistId) {
        try {
            const response = await fetch(`${this.GIST_API_URL}/${gistId}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            return response.ok;
        } catch (error) {
            return false;
        }
    },
    
    // 데이터를 GitHub에 저장
    async saveToGitHub() {
        if (!this.accessToken || !this.gistId) {
            alert('GitHub에 연결되지 않았습니다. 먼저 연결해주세요.');
            return false;
        }
        
        try {
            // 로컬 데이터 가져오기
            const localData = window.simpleStorage.getAllData();
            
            // GitHub에 업로드할 데이터 준비
            const uploadData = {
                description: `경매 시뮬레이션 데이터 - ${new Date().toLocaleString('ko-KR')}`,
                files: {
                    'auction-data.json': {
                        content: JSON.stringify(localData, null, 2)
                    }
                }
            };
            
            // GitHub Gist 업데이트
            const response = await fetch(`${this.GIST_API_URL}/${this.gistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(uploadData)
            });
            
            if (response.ok) {
                console.log('GitHub에 데이터 저장 완료');
                alert('✅ GitHub에 데이터가 성공적으로 저장되었습니다!');
                return true;
            } else {
                throw new Error('GitHub 저장 실패');
            }
        } catch (error) {
            console.error('GitHub 저장 오류:', error);
            alert('❌ GitHub 저장 중 오류가 발생했습니다: ' + error.message);
            return false;
        }
    },
    
    // GitHub에서 데이터 불러오기
    async loadFromGitHub() {
        if (!this.accessToken || !this.gistId) {
            alert('GitHub에 연결되지 않았습니다. 먼저 연결해주세요.');
            return false;
        }
        
        try {
            // GitHub Gist에서 데이터 가져오기
            const response = await fetch(`${this.GIST_API_URL}/${this.gistId}`, {
                headers: {
                    'Authorization': `token ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error('GitHub에서 데이터를 가져올 수 없습니다.');
            }
            
            const gistData = await response.json();
            const fileContent = gistData.files['auction-data.json'];
            
            if (!fileContent) {
                throw new Error('저장된 데이터 파일을 찾을 수 없습니다.');
            }
            
            // JSON 파싱
            const remoteData = JSON.parse(fileContent.content);
            
            // 로컬 저장소에 데이터 복원
            const success = window.simpleStorage.saveAllData(remoteData);
            
            if (success) {
                console.log('GitHub에서 데이터 불러오기 완료');
                alert('✅ GitHub에서 데이터를 성공적으로 불러왔습니다!');
                
                // 매물 목록 새로고침
                if (window.auctionSimulator) {
                    window.auctionSimulator.renderPropertyTree();
                }
                
                return true;
            } else {
                throw new Error('로컬 저장소에 데이터 저장 실패');
            }
        } catch (error) {
            console.error('GitHub 불러오기 오류:', error);
            alert('❌ GitHub에서 데이터를 불러오는 중 오류가 발생했습니다: ' + error.message);
            return false;
        }
    },
    
    // 동기화 (GitHub → 로컬)
    async syncFromGitHub() {
        const confirmSync = confirm('GitHub의 데이터로 로컬 데이터를 덮어쓰시겠습니까?\n\n현재 로컬 데이터는 백업되지 않습니다.');
        
        if (confirmSync) {
            return await this.loadFromGitHub();
        }
        
        return false;
    },
    
    // 동기화 (로컬 → GitHub)
    async syncToGitHub() {
        const confirmSync = confirm('로컬 데이터를 GitHub에 업로드하시겠습니까?\n\n기존 GitHub 데이터는 덮어써집니다.');
        
        if (confirmSync) {
            return await this.saveToGitHub();
        }
        
        return false;
    },
    
    // GitHub 연결 해제
    disconnectFromGitHub() {
        const confirmDisconnect = confirm('GitHub 연결을 해제하시겠습니까?');
        
        if (confirmDisconnect) {
            this.clearCredentials();
            alert('GitHub 연결이 해제되었습니다.');
        }
    }
};

// UI 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', () => {
    // GitHub OAuth 로그인 버튼
    const connectButton = document.getElementById('github-connect-btn');
    if (connectButton) {
        connectButton.addEventListener('click', () => {
            window.githubStorage.connectToGitHub();
        });
    }
    
    // GitHub 토큰 연결 버튼
    const tokenButton = document.getElementById('github-token-btn');
    if (tokenButton) {
        tokenButton.addEventListener('click', () => {
            window.githubStorage.connectToGitHubWithToken();
        });
    }
    
    // GitHub 연결 해제 버튼
    const disconnectButton = document.getElementById('github-disconnect-btn');
    if (disconnectButton) {
        disconnectButton.addEventListener('click', () => {
            window.githubStorage.disconnectFromGitHub();
        });
    }
    
    // GitHub 동기화 버튼들
    const syncToButton = document.getElementById('github-sync-to-btn');
    if (syncToButton) {
        syncToButton.addEventListener('click', () => {
            window.githubStorage.syncToGitHub();
        });
    }
    
    const syncFromButton = document.getElementById('github-sync-from-btn');
    if (syncFromButton) {
        syncFromButton.addEventListener('click', () => {
            window.githubStorage.syncFromGitHub();
        });
    }
    
    // GitHub Storage 초기화
    window.githubStorage.init();
});

console.log('GitHub Storage 시스템이 로드되었습니다.');
console.log('- githubStorage.connectToGitHub(): GitHub 연결');
console.log('- githubStorage.saveToGitHub(): GitHub에 저장');
console.log('- githubStorage.loadFromGitHub(): GitHub에서 불러오기');
console.log('- githubStorage.syncToGitHub(): 로컬 → GitHub 동기화');
console.log('- githubStorage.syncFromGitHub(): GitHub → 로컬 동기화');
