/**
 * GitHub 연동 저장소 시스템
 * GitHub Gist API를 사용하여 데이터를 클라우드에 저장/불러오기
 */

window.githubStorage = {
    // GitHub API 설정
    GITHUB_API_BASE: 'https://api.github.com',
    GIST_API_URL: 'https://api.github.com/gists',
    
    // 인증 토큰 (사용자가 입력)
    accessToken: null,
    
    // Gist ID (저장된 데이터의 고유 ID)
    gistId: null,
    
    // 초기화
    init() {
        console.log('GitHub Storage 초기화 시작');
        
        // 저장된 토큰과 Gist ID 불러오기
        this.loadStoredCredentials();
        
        // UI 업데이트
        this.updateUI();
        
        console.log('GitHub Storage 초기화 완료');
    },
    
    // 저장된 인증 정보 불러오기
    loadStoredCredentials() {
        this.accessToken = localStorage.getItem('github_access_token');
        this.gistId = localStorage.getItem('github_gist_id');
        
        if (this.accessToken && this.gistId) {
            console.log('저장된 GitHub 인증 정보 발견');
        }
    },
    
    // 인증 정보 저장
    saveCredentials(token, gistId) {
        this.accessToken = token;
        this.gistId = gistId;
        
        localStorage.setItem('github_access_token', token);
        localStorage.setItem('github_gist_id', gistId);
        
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
            if (statusElement) statusElement.textContent = '✅ GitHub 연동됨';
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
    
    // GitHub 인증 시작
    async connectToGitHub() {
        const token = prompt('GitHub Personal Access Token을 입력하세요:\n\n1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)\n2. Generate new token (classic)\n3. "gist" 권한 체크\n4. 생성된 토큰을 여기에 입력');
        
        if (!token || token.trim() === '') {
            alert('토큰이 입력되지 않았습니다.');
            return false;
        }
        
        try {
            // 토큰 유효성 검증
            const isValid = await this.validateToken(token.trim());
            
            if (isValid) {
                // 새 Gist 생성 또는 기존 Gist 사용
                const gistId = await this.createOrGetGist(token.trim());
                
                if (gistId) {
                    this.saveCredentials(token.trim(), gistId);
                    alert('GitHub 연동이 완료되었습니다!');
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
    // GitHub 연결 버튼
    const connectButton = document.getElementById('github-connect-btn');
    if (connectButton) {
        connectButton.addEventListener('click', () => {
            window.githubStorage.connectToGitHub();
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
