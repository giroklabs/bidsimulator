/**
 * GitHub 연동 저장소 시스템
 * GitHub Gist API를 사용하여 데이터를 클라우드에 저장/불러오기
 */

window.githubStorage = {
    // GitHub API 설정
    GITHUB_API_BASE: 'https://api.github.com',
    GIST_API_URL: 'https://api.github.com/gists',
    
    // OAuth 설정 (GitHub OAuth App에서 생성)
    CLIENT_ID: 'Iv1.8a61f9b3a7aba766', // GitHub OAuth App Client ID
    REDIRECT_URI: 'https://giroklabs.github.io/bidsimulator/', // GitHub Pages URL
    OAUTH_URL: 'https://github.com/login/oauth/authorize',
    
    // 인증 토큰 (OAuth로 획득)
    accessToken: null,
    
    // 사용자 정보
    userInfo: null,
    
    // Gist ID (저장된 데이터의 고유 ID)
    gistId: null,
    
    // 초기화
    init() {
        console.log('GitHub Storage 초기화 시작');
        
        // URL에서 OAuth 콜백 처리
        this.handleOAuthCallback();
        
        // 저장된 토큰과 Gist ID 불러오기
        this.loadStoredCredentials();
        
        // UI 업데이트
        this.updateUI();
        
        console.log('GitHub Storage 초기화 완료');
    },
    
    // OAuth 콜백 처리
    handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code && state === 'github_oauth') {
            console.log('OAuth 콜백 감지됨, 토큰 교환 시작');
            this.exchangeCodeForToken(code);
            
            // URL에서 인증 코드 제거
            window.history.replaceState({}, document.title, window.location.pathname);
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
    
    // 인증 정보 저장
    saveCredentials(token, gistId, userInfo = null) {
        this.accessToken = token;
        this.gistId = gistId;
        this.userInfo = userInfo;
        
        localStorage.setItem('github_access_token', token);
        localStorage.setItem('github_gist_id', gistId);
        if (userInfo) {
            localStorage.setItem('github_user_info', JSON.stringify(userInfo));
        }
        
        console.log('GitHub 인증 정보 저장 완료');
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
    
    // GitHub OAuth 로그인 시작
    connectToGitHub() {
        const state = 'github_oauth';
        const scope = 'gist';
        
        const authUrl = `${this.OAUTH_URL}?client_id=${this.CLIENT_ID}&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}&scope=${scope}&state=${state}`;
        
        console.log('GitHub OAuth 로그인 시작');
        window.location.href = authUrl;
    },
    
    // 인증 코드를 액세스 토큰으로 교환
    async exchangeCodeForToken(code) {
        try {
            // GitHub OAuth 토큰 교환 (프록시 서버 필요)
            const response = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: this.CLIENT_ID,
                    client_secret: 'GitHub OAuth App Client Secret', // 실제 환경에서는 서버에서 처리
                    code: code
                })
            });
            
            // CORS 문제로 인해 직접 호출이 불가능하므로 대안 방법 사용
            // GitHub OAuth는 보안상 클라이언트에서 직접 토큰 교환을 할 수 없음
            alert('OAuth 인증이 완료되었지만, 토큰 교환을 위해서는 서버가 필요합니다.\n\n현재는 Personal Access Token 방식을 사용해주세요.');
            
        } catch (error) {
            console.error('토큰 교환 오류:', error);
            alert('인증 중 오류가 발생했습니다. Personal Access Token 방식을 사용해주세요.');
        }
    },
    
    // GitHub 인증 시작 (토큰 방식 - 백업)
    async connectToGitHubWithToken() {
        const token = prompt('GitHub Personal Access Token을 입력하세요:\n\n1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)\n2. Generate new token (classic)\n3. "gist" 권한 체크\n4. 생성된 토큰을 여기에 입력');
        
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
