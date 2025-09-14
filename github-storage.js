/**
 * GitHub 연동 저장소 시스템
 * GitHub Gist API를 사용하여 데이터를 클라우드에 저장/불러오기 (Personal Access Token 방식)
 */

window.githubStorage = {
    // GitHub API 설정
    GITHUB_API_BASE: 'https://api.github.com',
    GIST_API_URL: 'https://api.github.com/gists',

    // 인증 토큰 (Personal Access Token)
    accessToken: null,

    // 사용자 정보
    userInfo: null,

    // Gist ID (저장된 데이터의 고유 ID)
    gistId: null,
    
    // 초기화
    init() {
        console.log('GitHub Storage 초기화 시작');

        // 저장된 토큰과 Gist ID 불러오기
        this.loadStoredCredentials();

        // UI 업데이트
        this.updateUI();

        // 에러 처리 설정
        this.setupErrorHandling();

        console.log('GitHub Storage 초기화 완료');
    },
    
    // 에러 처리 설정
    setupErrorHandling() {
        // 네트워크 오류 모니터링
        window.addEventListener('error', (event) => {
            if (event.message && event.message.includes('fetch')) {
                console.warn('네트워크 오류 감지됨:', event.message);
            }
        });
        
        // Promise rejection 처리
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.message && event.reason.message.includes('fetch')) {
                console.warn('네트워크 관련 Promise rejection:', event.reason);
            }
        });
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
            if (statusElement) statusElement.textContent = '❌ 클라우드 미연동';
            if (connectButton) connectButton.style.display = 'inline-block';
            if (disconnectButton) disconnectButton.style.display = 'none';
            if (syncButtons) syncButtons.style.display = 'none';
        }
    },
    
    // GitHub 인증 시작 (Personal Access Token 방식)
    async connectToGitHub() {
        try {
            console.log('GitHub 연결 시작 - Personal Access Token 방식');

            // 네트워크 연결 상태 확인
            if (!navigator.onLine) {
                throw new Error('네트워크 연결이 필요합니다. 인터넷 연결을 확인해주세요.');
            }

            // Personal Access Token 방식으로 인증
            console.log('Personal Access Token 방식으로 인증 시작');
            return await this.connectToGitHubWithToken();

        } catch (error) {
            console.error('GitHub 연결 오류:', error);
            alert('GitHub 연결 중 오류가 발생했습니다: ' + error.message);
            return false;
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
    
    // GitHub 인증 시작 (토큰 방식)
    async connectToGitHubWithToken() {
        // 토큰 생성 가이드 표시
        const showGuide = confirm('GitHub Personal Access Token이 필요합니다.\n\n토큰 생성 가이드를 보시겠습니까?');
        
        if (showGuide) {
            // GitHub 토큰 생성 페이지 열기
            window.open('https://github.com/settings/tokens/new?scopes=gist&description=경매입찰가격시뮬레이션', '_blank');
            
            // 2초 후 토큰 입력 요청
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
                    this.saveCredentialsLegacy(token.trim(), gistId, userInfo);
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
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gistData)
            });
            
            if (response.ok) {
                const gist = await response.json();
                return gist.id;
            } else {
                throw new Error('Gist 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('Gist 처리 오류:', error);
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
            console.error('Gist 존재 확인 오류:', error);
            return false;
        }
    },
    
    // 인증 정보 저장
    saveCredentialsLegacy(token, gistId, userInfo = null) {
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
        this.userInfo = null;
        
        localStorage.removeItem('github_access_token');
        localStorage.removeItem('github_gist_id');
        localStorage.removeItem('github_user_info');
        
        console.log('GitHub 인증 정보 삭제 완료');
        this.updateUI();
    },
    
    // GitHub 연결 해제
    disconnectFromGitHub() {
        const confirmDisconnect = confirm('GitHub 연동을 해제하시겠습니까?\n\n로컬 데이터는 유지되지만 클라우드 동기화가 중단됩니다.');
        
        if (confirmDisconnect) {
            this.clearCredentials();
            alert('GitHub 연동이 해제되었습니다.');
        }
    },
    
    // GitHub에 데이터 업로드
    async syncToGitHub() {
        if (!this.accessToken || !this.gistId) {
            alert('GitHub에 연결되지 않았습니다. 먼저 GitHub 연동을 해주세요.');
            return false;
        }
        
        try {
            // 현재 데이터 가져오기
            console.log('=== GitHub 업로드 시작 ===');
            console.log('StorageManager 상태:', {
                hasStorageManager: !!window.storageManager,
                currentData: window.storageManager ? window.storageManager.currentData : null
            });
            
            const currentData = window.storageManager.exportData();
            console.log('내보낼 데이터:', currentData);
            
            // Gist 업데이트
            const gistData = {
                files: {
                    'auction-data.json': {
                        content: currentData
                    }
                }
            };
            
            console.log('업로드할 Gist 데이터:', gistData);
            
            const response = await fetch(`${this.GIST_API_URL}/${this.gistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gistData)
            });
            
            if (response.ok) {
                alert('데이터가 GitHub에 성공적으로 업로드되었습니다!');
                return true;
            } else {
                throw new Error('업로드에 실패했습니다.');
            }
        } catch (error) {
            console.error('GitHub 업로드 오류:', error);
            alert('GitHub 업로드 중 오류가 발생했습니다: ' + error.message);
            return false;
        }
    },
    
    // GitHub에서 데이터 다운로드
    async syncFromGitHub() {
        if (!this.accessToken || !this.gistId) {
            alert('GitHub에 연결되지 않았습니다. 먼저 GitHub 연동을 해주세요.');
            return false;
        }
        
        try {
            const response = await fetch(`${this.GIST_API_URL}/${this.gistId}`, {
                headers: {
                    'Authorization': `token ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const gist = await response.json();
                const fileContent = gist.files['auction-data.json'].content;
                
                // 데이터 복원
                const success = window.storageManager.importData(fileContent);
                
                if (success) {
                    alert('GitHub에서 데이터를 성공적으로 다운로드했습니다!');
                    // 페이지 새로고침하여 UI 업데이트
                    window.location.reload();
                    return true;
                } else {
                    throw new Error('데이터 복원에 실패했습니다.');
                }
            } else {
                throw new Error('다운로드에 실패했습니다.');
            }
        } catch (error) {
            console.error('GitHub 다운로드 오류:', error);
            alert('GitHub 다운로드 중 오류가 발생했습니다: ' + error.message);
            return false;
        }
    }
};

// GitHub Storage 초기화
if (typeof window !== 'undefined') {
    window.githubStorage.init();
}

// UI 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', () => {
    // GitHub 연동 버튼
    const connectButton = document.getElementById('github-connect-btn');
    if (connectButton) {
        connectButton.addEventListener('click', () => window.githubStorage.connectToGitHub());
    }

    // 연결 해제 버튼
    const disconnectButton = document.getElementById('github-disconnect-btn');
    if (disconnectButton) {
        disconnectButton.addEventListener('click', () => window.githubStorage.disconnectFromGitHub());
    }

    // 업로드 버튼
    const syncToButton = document.getElementById('github-sync-to-btn');
    if (syncToButton) {
        syncToButton.addEventListener('click', () => window.githubStorage.syncToGitHub());
    }

    // 다운로드 버튼
    const syncFromButton = document.getElementById('github-sync-from-btn');
    if (syncFromButton) {
        syncFromButton.addEventListener('click', () => window.githubStorage.syncFromGitHub());
    }
});