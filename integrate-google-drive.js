/**
 * 현재 경매 시뮬레이터와 구글 드라이브 연동
 * 기존 localStorage 시스템을 구글 드라이브로 확장
 */

class GoogleDriveIntegration {
    constructor() {
        this.useGoogleDrive = false;
        this.isInitialized = false;
    }

    // 구글 드라이브 연동 활성화
    async enableGoogleDrive() {
        try {
            console.log('구글 드라이브 연동 시작...');
            
            // 구글 드라이브 스토리지 초기화
            const success = await window.googleDriveStorage.initialize();
            
            if (success) {
                this.useGoogleDrive = true;
                this.isInitialized = true;
                
                // UI 업데이트
                this.updateUIForGoogleDrive();
                
                console.log('구글 드라이브 연동 완료');
                alert('구글 드라이브 연동이 완료되었습니다!');
                return true;
            } else {
                throw new Error('구글 드라이브 초기화 실패');
            }
        } catch (error) {
            console.error('구글 드라이브 연동 실패:', error);
            alert('구글 드라이브 연동에 실패했습니다: ' + error.message);
            return false;
        }
    }

    // UI 업데이트 (구글 드라이브 모드)
    updateUIForGoogleDrive() {
        // 사이드바에 구글 드라이브 상태 표시
        const sidebar = document.querySelector('.sidebar-header');
        if (sidebar && !sidebar.querySelector('.google-drive-status')) {
            const statusDiv = document.createElement('div');
            statusDiv.className = 'google-drive-status';
            statusDiv.innerHTML = `
                <div style="background: #4CAF50; color: white; padding: 8px; border-radius: 4px; margin-top: 10px; text-align: center; font-size: 0.8rem;">
                    ☁️ 구글 드라이브 연동됨
                </div>
            `;
            sidebar.appendChild(statusDiv);
        }

        // 매물 추가 버튼 옆에 구글 드라이브 토글 버튼 추가
        const addButton = document.getElementById('addPropertyBtn');
        if (addButton && !addButton.parentNode.querySelector('.google-drive-toggle')) {
            const toggleButton = document.createElement('button');
            toggleButton.className = 'google-drive-toggle';
            toggleButton.innerHTML = '☁️ 구글 드라이브';
            toggleButton.style.cssText = `
                background: #4285f4;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                margin-left: 10px;
                cursor: pointer;
                font-size: 0.8rem;
            `;
            toggleButton.onclick = () => this.toggleGoogleDrive();
            addButton.parentNode.appendChild(toggleButton);
        }
    }

    // 구글 드라이브 토글
    async toggleGoogleDrive() {
        if (this.useGoogleDrive) {
            // 로컬 저장소로 전환
            this.useGoogleDrive = false;
            this.isInitialized = false;
            alert('로컬 저장소로 전환되었습니다.');
        } else {
            // 구글 드라이브로 전환
            await this.enableGoogleDrive();
        }
    }

    // 매물 저장 (구글 드라이브 또는 로컬)
    async saveProperty(propertyIndex, data) {
        try {
            if (this.useGoogleDrive && this.isInitialized) {
                // 구글 드라이브에 저장
                const filename = `매물_${propertyIndex}_${data.name || 'unnamed'}_${Date.now()}.json`;
                await window.googleDriveStorage.saveData(filename, data);
                console.log('구글 드라이브에 저장 완료:', filename);
            } else {
                // 로컬 저장소에 저장 (기존 방식)
                if (window.simpleStorage) {
                    window.simpleStorage.savePropertyData(propertyIndex, data);
                } else if (window.storageManager) {
                    window.storageManager.savePropertyData(propertyIndex, data);
                }
                console.log('로컬 저장소에 저장 완료');
            }
            return true;
        } catch (error) {
            console.error('매물 저장 실패:', error);
            throw error;
        }
    }

    // 매물 불러오기 (구글 드라이브 또는 로컬)
    async loadProperty(propertyIndex) {
        try {
            if (this.useGoogleDrive && this.isInitialized) {
                // 구글 드라이브에서 불러오기
                const files = await window.googleDriveStorage.listFiles();
                const targetFile = files.find(file => 
                    file.name.includes(`매물_${propertyIndex}_`) && file.name.endsWith('.json')
                );
                
                if (targetFile) {
                    const data = await window.googleDriveStorage.loadData(targetFile.name);
                    console.log('구글 드라이브에서 불러오기 완료:', targetFile.name);
                    return data;
                } else {
                    console.log('해당 매물 데이터를 구글 드라이브에서 찾을 수 없습니다');
                    return null;
                }
            } else {
                // 로컬 저장소에서 불러오기 (기존 방식)
                if (window.simpleStorage) {
                    return window.simpleStorage.loadPropertyData(propertyIndex);
                } else if (window.storageManager) {
                    return window.storageManager.loadPropertyData(propertyIndex);
                }
                console.log('로컬 저장소에서 불러오기 완료');
                return null;
            }
        } catch (error) {
            console.error('매물 불러오기 실패:', error);
            throw error;
        }
    }

    // 모든 매물 불러오기
    async loadAllProperties() {
        try {
            if (this.useGoogleDrive && this.isInitialized) {
                // 구글 드라이브에서 모든 파일 불러오기
                const files = await window.googleDriveStorage.listFiles();
                const propertyFiles = files.filter(file => 
                    file.name.includes('매물_') && file.name.endsWith('.json')
                );
                
                const properties = [];
                for (const file of propertyFiles) {
                    try {
                        const data = await window.googleDriveStorage.loadData(file.name);
                        properties.push(data);
                    } catch (error) {
                        console.error(`파일 ${file.name} 불러오기 실패:`, error);
                    }
                }
                
                console.log('구글 드라이브에서 모든 매물 불러오기 완료:', properties.length + '개');
                return properties;
            } else {
                // 로컬 저장소에서 불러오기 (기존 방식)
                if (window.simpleStorage) {
                    return window.simpleStorage.getProperties();
                } else if (window.storageManager) {
                    return window.storageManager.getProperties();
                }
                console.log('로컬 저장소에서 모든 매물 불러오기 완료');
                return [];
            }
        } catch (error) {
            console.error('모든 매물 불러오기 실패:', error);
            throw error;
        }
    }

    // 백업 생성 (구글 드라이브)
    async createBackup() {
        try {
            if (!this.useGoogleDrive || !this.isInitialized) {
                throw new Error('구글 드라이브가 연동되지 않았습니다');
            }

            // 현재 모든 로컬 데이터 수집
            const allData = {
                properties: this.useGoogleDrive ? await this.loadAllProperties() : [],
                timestamp: new Date().toISOString(),
                version: '1.0'
            };

            // 백업 파일로 저장
            await window.googleDriveHelpers.createBackup(allData);
            alert('구글 드라이브에 백업이 생성되었습니다!');
            console.log('백업 생성 완료');
            return true;
        } catch (error) {
            console.error('백업 생성 실패:', error);
            alert('백업 생성에 실패했습니다: ' + error.message);
            return false;
        }
    }

    // 구글 드라이브에서 로컬로 데이터 가져오기
    async importFromGoogleDrive() {
        try {
            if (!this.useGoogleDrive || !this.isInitialized) {
                throw new Error('구글 드라이브가 연동되지 않았습니다');
            }

            const files = await window.googleDriveStorage.listFiles();
            const backupFiles = files.filter(file => 
                file.name.includes('백업_') && file.name.endsWith('.json')
            );

            if (backupFiles.length === 0) {
                alert('가져올 백업 파일이 없습니다.');
                return false;
            }

            // 가장 최근 백업 파일 선택
            const latestBackup = backupFiles.sort((a, b) => 
                new Date(b.modifiedTime) - new Date(a.modifiedTime)
            )[0];

            const backupData = await window.googleDriveStorage.loadData(latestBackup.name);
            
            // 로컬 저장소에 데이터 복원
            if (window.simpleStorage && backupData.properties) {
                for (let i = 0; i < backupData.properties.length; i++) {
                    window.simpleStorage.savePropertyData(i, backupData.properties[i]);
                }
            }

            alert('구글 드라이브에서 데이터를 성공적으로 가져왔습니다!');
            console.log('데이터 가져오기 완료');
            return true;
        } catch (error) {
            console.error('데이터 가져오기 실패:', error);
            alert('데이터 가져오기에 실패했습니다: ' + error.message);
            return false;
        }
    }
}

// 전역 인스턴스 생성
window.googleDriveIntegration = new GoogleDriveIntegration();

// 기존 경매 시뮬레이터와 연동
if (window.auctionSimulator) {
    // 기존 저장 함수를 래핑
    const originalSaveAllDataForProperty = window.auctionSimulator.saveAllDataForProperty;
    window.auctionSimulator.saveAllDataForProperty = async function(propertyIndex) {
        try {
            // 기존 로직 실행
            const result = await originalSaveAllDataForProperty.call(this, propertyIndex);
            
            // 구글 드라이브에도 저장
            if (window.googleDriveIntegration.useGoogleDrive) {
                const formData = window.simpleFormManager ? 
                    window.simpleFormManager.collectAllFormData() : 
                    window.formDataManager.collectAllFormData();
                await window.googleDriveIntegration.saveProperty(propertyIndex, formData);
            }
            
            return result;
        } catch (error) {
            console.error('매물 저장 중 오류:', error);
            throw error;
        }
    };

    // 기존 불러오기 함수를 래핑
    const originalLoadAllDataForProperty = window.auctionSimulator.loadAllDataForProperty;
    window.auctionSimulator.loadAllDataForProperty = async function(propertyIndex) {
        try {
            // 구글 드라이브에서 먼저 시도
            if (window.googleDriveIntegration.useGoogleDrive) {
                const data = await window.googleDriveIntegration.loadProperty(propertyIndex);
                if (data) {
                    // 구글 드라이브 데이터로 폼 채우기
                    if (window.simpleFormManager) {
                        window.simpleFormManager.loadFormData(data);
                    } else if (window.formDataManager) {
                        window.formDataManager.loadFormData(data);
                    }
                    return;
                }
            }
            
            // 로컬 저장소에서 불러오기 (기존 방식)
            return await originalLoadAllDataForProperty.call(this, propertyIndex);
        } catch (error) {
            console.error('매물 불러오기 중 오류:', error);
            throw error;
        }
    };
}

console.log('Google Drive Integration 모듈이 로드되었습니다.');
console.log('사용법:');
console.log('1. window.googleDriveIntegration.enableGoogleDrive() - 구글 드라이브 연동');
console.log('2. window.googleDriveIntegration.createBackup() - 백업 생성');
console.log('3. window.googleDriveIntegration.importFromGoogleDrive() - 데이터 가져오기');
