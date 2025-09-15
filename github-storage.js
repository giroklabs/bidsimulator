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
        console.log('=== GitHub Storage 초기화 시작 ===');

        // 저장된 토큰과 Gist ID 불러오기
        this.loadStoredCredentials();
        console.log('저장된 인증 정보 로드 완료:', {
            hasAccessToken: !!this.accessToken,
            hasGistId: !!this.gistId,
            hasUserInfo: !!this.userInfo
        });

        // UI 업데이트
        this.updateUI();
        console.log('UI 업데이트 완료');

        // 에러 처리 설정
        this.setupErrorHandling();

        console.log('=== GitHub Storage 초기화 완료 ===');
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
            if (statusElement) {
                statusElement.textContent = `${userName}님 로그인됨`;
                statusElement.className = 'status-indicator connected';
            }
            if (connectButton) connectButton.style.display = 'none';
            if (disconnectButton) disconnectButton.style.display = 'inline-block';
            if (syncButtons) syncButtons.style.display = 'block';
        } else {
            if (statusElement) {
                statusElement.textContent = '클라우드 미연동';
                statusElement.className = 'status-indicator';
            }
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
        console.log('=== Gist 생성 또는 기존 Gist 찾기 시작 ===');
        
        try {
            // 1. 기존 Gist가 있는지 확인 (localStorage에서)
            if (this.gistId) {
                console.log('기존 Gist ID 확인:', this.gistId);
                const exists = await this.checkGistExists(token, this.gistId);
                if (exists) {
                    console.log('✅ 기존 Gist 발견:', this.gistId);
                    return this.gistId;
                }
                console.log('❌ 기존 Gist가 존재하지 않음');
            }
            
            // 2. 사용자의 모든 Gist에서 경매 데이터 Gist 찾기
            console.log('사용자의 모든 Gist에서 경매 데이터 Gist 찾기...');
            const existingGistId = await this.findExistingAuctionGist(token);
            if (existingGistId) {
                console.log('✅ 기존 경매 데이터 Gist 발견:', existingGistId);
                return existingGistId;
            }
            
            // 3. 새 Gist 생성
            console.log('새로운 경매 데이터 Gist 생성...');
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
                console.log('✅ 새 Gist 생성 완료:', gist.id);
                return gist.id;
            } else {
                const errorText = await response.text();
                console.error('Gist 생성 실패 응답:', errorText);
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
    
    // 사용자의 모든 Gist에서 경매 데이터 Gist 찾기
    async findExistingAuctionGist(token) {
        console.log('=== 사용자의 모든 Gist 검색 시작 ===');
        
        try {
            // 사용자의 모든 Gist 목록 가져오기
            const response = await fetch(`${this.GITHUB_API_BASE}/gists`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                console.error('Gist 목록 가져오기 실패:', response.status, response.statusText);
                return null;
            }
            
            const gists = await response.json();
            console.log(`총 ${gists.length}개의 Gist 발견`);
            
            // 경매 데이터 Gist 찾기
            for (const gist of gists) {
                console.log(`Gist 검사: ${gist.id} - ${gist.description}`);
                
                // 설명이 경매 데이터인지 확인
                if (gist.description && gist.description.includes('경매 입찰가격 시뮬레이션 데이터')) {
                    console.log('✅ 경매 데이터 Gist 발견 (설명 기준):', gist.id);
                    
                    // 파일이 있는지 확인
                    if (gist.files && gist.files['auction-data.json']) {
                        console.log('✅ auction-data.json 파일 확인됨');
                        return gist.id;
                    }
                }
                
                // 파일 이름으로도 확인
                if (gist.files && gist.files['auction-data.json']) {
                    console.log('✅ auction-data.json 파일 발견 (파일 기준):', gist.id);
                    return gist.id;
                }
            }
            
            console.log('❌ 기존 경매 데이터 Gist를 찾을 수 없음');
            return null;
            
        } catch (error) {
            console.error('Gist 검색 오류:', error);
            return null;
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
        console.log('=== GitHub 인증 정보 삭제 시작 ===');
        
        // 메모리에서 삭제
        this.accessToken = null;
        this.gistId = null;
        this.userInfo = null;
        
        // localStorage에서 삭제
        localStorage.removeItem('github_access_token');
        localStorage.removeItem('github_gist_id');
        localStorage.removeItem('github_user_info');
        
        // 추가적인 관련 데이터도 삭제
        localStorage.removeItem('github_storage_version');
        localStorage.removeItem('github_last_sync');
        
        console.log('✅ GitHub 인증 정보 삭제 완료');
        console.log('삭제된 항목:', [
            'github_access_token',
            'github_gist_id', 
            'github_user_info',
            'github_storage_version',
            'github_last_sync'
        ]);
        
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
    
    // 모든 매물의 상세 데이터 수집
    collectAllPropertyData() {
        console.log('=== 모든 매물 상세 데이터 수집 시작 ===');
        
        const allPropertyData = {};
        
        try {
            if (!window.storageManager) {
                console.warn('StorageManager가 없습니다');
                return allPropertyData;
            }
            
            const properties = window.storageManager.getProperties();
            console.log('수집할 매물 개수:', properties.length);
            
            properties.forEach((property, index) => {
                console.log(`--- 매물 ${index} 상세 데이터 수집 ---`);
                console.log('매물 정보:', property);
                
                // 매물별 상세 데이터 키
                const propertyKey = `property_all_${index}`;
                console.log('조회할 키:', propertyKey);
                
                // localStorage에서 상세 데이터 조회
                const propertyDataString = localStorage.getItem(propertyKey);
                if (propertyDataString) {
                    try {
                        const propertyData = JSON.parse(propertyDataString);
                        console.log('매물 상세 데이터:', propertyData);
                        
                        // 매물 식별자로 저장
                        const propertyId = property.caseNumber || property.name || `property_${index}`;
                        allPropertyData[propertyId] = {
                            index: index,
                            basicInfo: property,
                            detailedData: propertyData
                        };
                        
                        console.log(`✅ 매물 ${propertyId} 상세 데이터 수집 완료`);
                    } catch (error) {
                        console.error(`❌ 매물 ${index} 데이터 파싱 오류:`, error);
                    }
                } else {
                    console.warn(`❌ 매물 ${index} 상세 데이터 없음 (키: ${propertyKey})`);
                }
            });
            
            console.log('✅ 모든 매물 상세 데이터 수집 완료:', allPropertyData);
            console.log('수집된 매물 개수:', Object.keys(allPropertyData).length);
            
        } catch (error) {
            console.error('❌ 매물 상세 데이터 수집 오류:', error);
        }
        
        return allPropertyData;
    },
    
    // GitHub에 데이터 업로드
    async syncToGitHub() {
        if (!this.accessToken || !this.gistId) {
            alert('GitHub에 연결되지 않았습니다. 먼저 GitHub 연동을 해주세요.');
            return false;
        }
        
        try {
            // 현재 데이터 가져오기 (모든 데이터 포함)
            console.log('=== GitHub 업로드 시작 (모든 데이터 포함) ===');
            console.log('StorageManager 상태:', {
                hasStorageManager: !!window.storageManager,
                currentData: window.storageManager ? window.storageManager.currentData : null
            });
            
            // 기본 매물 데이터
            const basicData = window.storageManager.exportData();
            console.log('기본 매물 데이터:', basicData);
            
            // 모든 매물의 상세 데이터 수집
            const allPropertyData = this.collectAllPropertyData();
            console.log('수집된 모든 매물 상세 데이터:', allPropertyData);
            
            // 통합 데이터 생성
            const completeData = {
                basicData: JSON.parse(basicData),
                propertyDetails: allPropertyData,
                exportDate: new Date().toISOString(),
                version: '2.0'
            };
            
            const completeDataString = JSON.stringify(completeData, null, 2);
            console.log('최종 업로드 데이터:', completeDataString);
            
            // Gist 업데이트
            const gistData = {
                files: {
                    'auction-data.json': {
                        content: completeDataString
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
    
    // 완전한 데이터 복원 (기본 데이터 + 상세 데이터)
    restoreCompleteData(fileContent) {
        console.log('=== 완전한 데이터 복원 시작 ===');
        console.log('파일 내용:', fileContent);
        
        try {
            const downloadedData = JSON.parse(fileContent);
            console.log('파싱된 다운로드 데이터:', downloadedData);
            
            // 새로운 구조 (v2.0) 확인
            if (downloadedData.version === '2.0' && downloadedData.basicData && downloadedData.propertyDetails) {
                console.log('✅ 새로운 데이터 구조 (v2.0) 감지');
                
                // 1. 기본 매물 데이터 복원
                console.log('1. 기본 매물 데이터 복원...');
                const basicDataString = JSON.stringify(downloadedData.basicData);
                const basicRestoreSuccess = window.storageManager.importData(basicDataString);
                console.log('기본 데이터 복원 결과:', basicRestoreSuccess);
                
                if (!basicRestoreSuccess) {
                    console.error('❌ 기본 데이터 복원 실패');
                    return false;
                }
                
                // 2. 각 매물의 상세 데이터 복원
                console.log('2. 매물별 상세 데이터 복원...');
                const propertyDetails = downloadedData.propertyDetails;
                console.log('복원할 상세 데이터:', propertyDetails);
                
                Object.keys(propertyDetails).forEach(propertyId => {
                    const propertyData = propertyDetails[propertyId];
                    console.log(`--- 매물 ${propertyId} 상세 데이터 복원 ---`);
                    console.log('매물 데이터:', propertyData);
                    
                    const index = propertyData.index;
                    const detailedData = propertyData.detailedData;
                    
                    if (index !== undefined && detailedData) {
                        const propertyKey = `property_all_${index}`;
                        console.log('저장할 키:', propertyKey);
                        
                        try {
                            localStorage.setItem(propertyKey, JSON.stringify(detailedData));
                            console.log(`✅ 매물 ${propertyId} 상세 데이터 복원 완료`);
                        } catch (error) {
                            console.error(`❌ 매물 ${propertyId} 상세 데이터 복원 실패:`, error);
                        }
                    } else {
                        console.warn(`❌ 매물 ${propertyId} 데이터 형식 오류`);
                    }
                });
                
                console.log('✅ 완전한 데이터 복원 성공');
                return true;
                
            } else {
                // 기존 구조 (v1.0) 지원
                console.log('✅ 기존 데이터 구조 (v1.0) 감지, 기본 복원');
                const success = window.storageManager.importData(fileContent);
                console.log('기존 구조 복원 결과:', success);
                return success;
            }
            
        } catch (error) {
            console.error('❌ 데이터 복원 오류:', error);
            return false;
        }
    },
    
    // GitHub에서 데이터 다운로드
    async syncFromGitHub() {
        console.log('=== GitHub 다운로드 시작 ===');
        
        if (!this.accessToken || !this.gistId) {
            console.error('❌ GitHub 인증 정보 없음');
            alert('GitHub에 연결되지 않았습니다. 먼저 GitHub 연동을 해주세요.');
            return false;
        }
        
        try {
            console.log('GitHub Gist API 요청:', `${this.GIST_API_URL}/${this.gistId}`);
            
            const response = await fetch(`${this.GIST_API_URL}/${this.gistId}`, {
                headers: {
                    'Authorization': `token ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            console.log('GitHub API 응답 상태:', response.status, response.statusText);
            
            if (response.ok) {
                const gist = await response.json();
                console.log('GitHub Gist 응답:', gist);
                
                   if (gist.files && gist.files['auction-data.json']) {
                       const fileContent = gist.files['auction-data.json'].content;
                       console.log('다운로드된 파일 내용:', fileContent);
                       
                       // StorageManager 존재 확인
                       if (!window.storageManager) {
                           console.error('❌ StorageManager가 없습니다');
                           throw new Error('StorageManager가 초기화되지 않았습니다.');
                       }
                       
                       console.log('StorageManager 상태:', {
                           hasStorageManager: !!window.storageManager,
                           hasImportData: typeof window.storageManager.importData === 'function'
                       });
                       
                       // 데이터 복원 (새로운 구조 지원)
                       console.log('데이터 복원 시도...');
                       const success = this.restoreCompleteData(fileContent);
                       console.log('데이터 복원 결과:', success);
                    
                    if (success) {
                        console.log('✅ 데이터 복원 성공');
                        
                        // 복원된 데이터 확인
                        const restoredData = window.storageManager.exportData();
                        console.log('복원된 데이터:', restoredData);
                        
                        alert('GitHub에서 데이터를 성공적으로 다운로드했습니다!');
                        
                        // 매물 목록 새로고침
                        if (window.auctionSimulator && window.auctionSimulator.renderPropertyTree) {
                            console.log('매물 목록 새로고침...');
                            window.auctionSimulator.renderPropertyTree();
                        }
                        
                        return true;
                    } else {
                        console.error('❌ 데이터 복원 실패');
                        throw new Error('데이터 복원에 실패했습니다.');
                    }
                } else {
                    console.error('❌ auction-data.json 파일이 없음');
                    console.log('사용 가능한 파일들:', Object.keys(gist.files || {}));
                    throw new Error('auction-data.json 파일을 찾을 수 없습니다.');
                }
            } else {
                const errorText = await response.text();
                console.error('GitHub API 오류 응답:', errorText);
                throw new Error(`GitHub API 오류: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ GitHub 다운로드 오류:', error);
            alert('GitHub에서 데이터 다운로드 중 오류가 발생했습니다: ' + error.message);
            return false;
        }
    }
};

// GitHub Storage 초기화
if (typeof window !== 'undefined') {
    window.githubStorage.init();
}

// GitHub 연동 상태 테스트 함수
window.testGitHubConnection = function() {
    console.log('=== GitHub 연동 상태 테스트 ===');
    console.log('GitHub Storage 객체:', window.githubStorage);
    console.log('연동 상태:', {
        hasAccessToken: !!window.githubStorage.accessToken,
        hasGistId: !!window.githubStorage.gistId,
        hasUserInfo: !!window.githubStorage.userInfo
    });
    
    // 버튼 상태 확인
    const syncButtons = document.getElementById('github-sync-buttons');
    const uploadBtn = document.getElementById('github-sync-to-btn');
    console.log('업로드 버튼 요소:', uploadBtn);
    console.log('업로드 버튼 표시 상태:', syncButtons ? syncButtons.style.display : 'N/A');
    
    // StorageManager 상태 확인
    console.log('StorageManager 상태:', {
        hasStorageManager: !!window.storageManager,
        currentData: window.storageManager ? window.storageManager.currentData : null
    });
};

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
    console.log('GitHub 업로드 버튼 찾기:', syncToButton);
    if (syncToButton) {
        syncToButton.addEventListener('click', () => {
            console.log('=== GitHub 업로드 버튼 클릭됨 ===');
            console.log('GitHub 연동 상태:', {
                hasAccessToken: !!window.githubStorage.accessToken,
                hasGistId: !!window.githubStorage.gistId,
                hasUserInfo: !!window.githubStorage.userInfo
            });
            window.githubStorage.syncToGitHub();
        });
        console.log('GitHub 업로드 버튼 이벤트 리스너 등록 완료');
    } else {
        console.error('github-sync-to-btn 요소를 찾을 수 없습니다');
    }

    // 다운로드 버튼
    const syncFromButton = document.getElementById('github-sync-from-btn');
    if (syncFromButton) {
        syncFromButton.addEventListener('click', () => window.githubStorage.syncFromGitHub());
    }
});