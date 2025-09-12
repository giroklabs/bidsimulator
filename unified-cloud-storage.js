/**
 * 통합 클라우드 스토리지 매니저
 * 구글, 카카오, 네이버 클라우드 서비스를 통합 관리
 */

class UnifiedCloudStorage {
    constructor() {
        this.providers = {
            google: {
                name: '구글 드라이브',
                enabled: false,
                instance: window.googleDriveStorage,
                helpers: window.googleDriveHelpers
            },
            kakao: {
                name: '카카오 드라이브',
                enabled: false,
                instance: window.kakaoDriveStorage,
                helpers: window.kakaoDriveHelpers
            },
            naver: {
                name: '네이버 클라우드',
                enabled: false,
                instance: window.naverCloudStorage,
                helpers: window.naverCloudHelpers
            },
            naverDB: {
                name: '네이버 클라우드 DB',
                enabled: false,
                instance: window.naverCloudDB,
                helpers: window.naverCloudDBHelpers
            }
        };
        
        this.activeProvider = null;
        this.isInitialized = false;
    }

    // 클라우드 서비스 초기화
    async initialize(providerName) {
        try {
            if (!this.providers[providerName]) {
                throw new Error(`지원하지 않는 클라우드 서비스: ${providerName}`);
            }

            const provider = this.providers[providerName];
            console.log(`${provider.name} 초기화 시작...`);

            const success = await provider.instance.initialize();
            
            if (success) {
                provider.enabled = true;
                this.activeProvider = provider;
                this.isInitialized = true;
                
                // UI 업데이트
                this.updateUIForProvider(providerName);
                
                console.log(`${provider.name} 초기화 완료`);
                alert(`${provider.name} 연동이 완료되었습니다!`);
                return true;
            } else {
                throw new Error(`${provider.name} 초기화 실패`);
            }
        } catch (error) {
            console.error('클라우드 서비스 초기화 실패:', error);
            alert('클라우드 서비스 연동에 실패했습니다: ' + error.message);
            return false;
        }
    }

    // UI 업데이트 (클라우드 서비스별)
    updateUIForProvider(providerName) {
        // 기존 상태 표시 제거
        const existingStatus = document.querySelector('.cloud-storage-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        // 새 상태 표시 추가
        const sidebar = document.querySelector('.sidebar-header');
        if (sidebar) {
            const statusDiv = document.createElement('div');
            statusDiv.className = 'cloud-storage-status';
            
            const provider = this.providers[providerName];
            const colors = {
                google: '#4CAF50',
                kakao: '#FEE500',
                naver: '#03C75A'
            };
            
            statusDiv.innerHTML = `
                <div style="background: ${colors[providerName] || '#4285f4'}; color: white; padding: 8px; border-radius: 4px; margin-top: 10px; text-align: center; font-size: 0.8rem;">
                    ☁️ ${provider.name} 연동됨
                </div>
            `;
            sidebar.appendChild(statusDiv);
        }
    }

    // 매물 데이터 저장
    async savePropertyData(propertyIndex, data) {
        try {
            if (!this.isInitialized || !this.activeProvider) {
                throw new Error('클라우드 서비스가 초기화되지 않았습니다');
            }

            const provider = this.activeProvider;
            console.log(`${provider.name}에 매물 데이터 저장 중...`);

            if (providerName === 'naverDB') {
                // 네이버 클라우드 DB는 인덱스 기반
                await provider.helpers.savePropertyData(propertyIndex, data);
            } else {
                // 다른 서비스들은 파일명 기반
                const filename = `매물_${propertyIndex}_${Date.now()}.json`;
                await provider.helpers.savePropertyData(propertyIndex, data);
            }

            console.log(`${provider.name}에 매물 데이터 저장 완료`);
            return true;
        } catch (error) {
            console.error('매물 데이터 저장 실패:', error);
            throw error;
        }
    }

    // 매물 데이터 불러오기
    async loadPropertyData(propertyIndex) {
        try {
            if (!this.isInitialized || !this.activeProvider) {
                throw new Error('클라우드 서비스가 초기화되지 않았습니다');
            }

            const provider = this.activeProvider;
            console.log(`${provider.name}에서 매물 데이터 불러오기 중...`);

            let data;
            if (providerName === 'naverDB') {
                // 네이버 클라우드 DB는 인덱스 기반
                data = await provider.helpers.loadPropertyData(propertyIndex);
            } else {
                // 다른 서비스들은 파일 목록에서 찾기
                const files = await provider.instance.listFiles();
                const targetFile = files.find(file => 
                    file.name.includes(`매물_${propertyIndex}_`) && file.name.endsWith('.json')
                );
                
                if (targetFile) {
                    data = await provider.helpers.loadPropertyData(targetFile.name);
                } else {
                    console.log(`해당 매물 데이터를 ${provider.name}에서 찾을 수 없습니다`);
                    return null;
                }
            }

            console.log(`${provider.name}에서 매물 데이터 불러오기 완료`);
            return data;
        } catch (error) {
            console.error('매물 데이터 불러오기 실패:', error);
            throw error;
        }
    }

    // 모든 매물 데이터 불러오기
    async loadAllProperties() {
        try {
            if (!this.isInitialized || !this.activeProvider) {
                throw new Error('클라우드 서비스가 초기화되지 않았습니다');
            }

            const provider = this.activeProvider;
            console.log(`${provider.name}에서 모든 매물 데이터 불러오기 중...`);

            let properties = [];
            if (providerName === 'naverDB') {
                // 네이버 클라우드 DB
                properties = await provider.helpers.loadAllProperties();
            } else {
                // 다른 서비스들
                const files = await provider.instance.listFiles();
                const propertyFiles = files.filter(file => 
                    file.name.includes('매물_') && file.name.endsWith('.json')
                );
                
                for (const file of propertyFiles) {
                    try {
                        const data = await provider.helpers.loadPropertyData(file.name);
                        if (data) {
                            properties.push(data);
                        }
                    } catch (error) {
                        console.error(`파일 ${file.name} 불러오기 실패:`, error);
                    }
                }
            }

            console.log(`${provider.name}에서 모든 매물 데이터 불러오기 완료: ${properties.length}개`);
            return properties;
        } catch (error) {
            console.error('모든 매물 데이터 불러오기 실패:', error);
            throw error;
        }
    }

    // 백업 생성
    async createBackup(allData) {
        try {
            if (!this.isInitialized || !this.activeProvider) {
                throw new Error('클라우드 서비스가 초기화되지 않았습니다');
            }

            const provider = this.activeProvider;
            console.log(`${provider.name}에 백업 생성 중...`);

            await provider.helpers.createBackup(allData);
            
            console.log(`${provider.name}에 백업 생성 완료`);
            alert(`${provider.name}에 백업이 생성되었습니다!`);
            return true;
        } catch (error) {
            console.error('백업 생성 실패:', error);
            alert('백업 생성에 실패했습니다: ' + error.message);
            return false;
        }
    }

    // 클라우드 서비스 전환
    async switchProvider(newProviderName) {
        try {
            if (this.activeProvider) {
                console.log(`현재 ${this.activeProvider.name}에서 ${this.providers[newProviderName].name}로 전환`);
            }

            const success = await this.initialize(newProviderName);
            if (success) {
                console.log(`클라우드 서비스 전환 완료: ${newProviderName}`);
                return true;
            } else {
                throw new Error('클라우드 서비스 전환 실패');
            }
        } catch (error) {
            console.error('클라우드 서비스 전환 실패:', error);
            return false;
        }
    }

    // 로그아웃
    async logout() {
        try {
            if (this.activeProvider && this.activeProvider.instance.logout) {
                await this.activeProvider.instance.logout();
            }
            
            this.activeProvider = null;
            this.isInitialized = false;
            
            // UI 상태 초기화
            const statusDiv = document.querySelector('.cloud-storage-status');
            if (statusDiv) {
                statusDiv.remove();
            }
            
            console.log('클라우드 서비스 로그아웃 완료');
        } catch (error) {
            console.error('로그아웃 실패:', error);
        }
    }

    // 지원하는 클라우드 서비스 목록 조회
    getAvailableProviders() {
        return Object.keys(this.providers).map(key => ({
            id: key,
            name: this.providers[key].name,
            enabled: this.providers[key].enabled
        }));
    }

    // 현재 활성 클라우드 서비스 정보
    getActiveProvider() {
        return this.activeProvider ? {
            id: Object.keys(this.providers).find(key => this.providers[key] === this.activeProvider),
            name: this.activeProvider.name,
            enabled: true
        } : null;
    }
}

// 전역 인스턴스 생성
window.unifiedCloudStorage = new UnifiedCloudStorage();

// 경매 시뮬레이터와 연동하는 래퍼 함수들
window.cloudStorageHelpers = {
    // 구글 드라이브 연동
    async enableGoogleDrive() {
        return await window.unifiedCloudStorage.initialize('google');
    },

    // 카카오 드라이브 연동
    async enableKakaoDrive() {
        return await window.unifiedCloudStorage.initialize('kakao');
    },

    // 네이버 클라우드 연동
    async enableNaverCloud() {
        return await window.unifiedCloudStorage.initialize('naver');
    },

    // 네이버 클라우드 DB 연동
    async enableNaverCloudDB() {
        return await window.unifiedCloudStorage.initialize('naverDB');
    },

    // 매물 저장
    async saveProperty(propertyIndex, data) {
        return await window.unifiedCloudStorage.savePropertyData(propertyIndex, data);
    },

    // 매물 불러오기
    async loadProperty(propertyIndex) {
        return await window.unifiedCloudStorage.loadPropertyData(propertyIndex);
    },

    // 모든 매물 불러오기
    async loadAllProperties() {
        return await window.unifiedCloudStorage.loadAllProperties();
    },

    // 백업 생성
    async createBackup(allData) {
        return await window.unifiedCloudStorage.createBackup(allData);
    },

    // 클라우드 서비스 전환
    async switchProvider(providerName) {
        return await window.unifiedCloudStorage.switchProvider(providerName);
    },

    // 로그아웃
    async logout() {
        return await window.unifiedCloudStorage.logout();
    },

    // 지원하는 서비스 목록
    getAvailableProviders() {
        return window.unifiedCloudStorage.getAvailableProviders();
    },

    // 현재 활성 서비스
    getActiveProvider() {
        return window.unifiedCloudStorage.getActiveProvider();
    }
};

console.log('통합 클라우드 스토리지 매니저가 로드되었습니다.');
console.log('사용법:');
console.log('1. window.cloudStorageHelpers.enableGoogleDrive() - 구글 드라이브 연동');
console.log('2. window.cloudStorageHelpers.enableKakaoDrive() - 카카오 드라이브 연동');
console.log('3. window.cloudStorageHelpers.enableNaverCloud() - 네이버 클라우드 연동');
console.log('4. window.cloudStorageHelpers.enableNaverCloudDB() - 네이버 클라우드 DB 연동');
