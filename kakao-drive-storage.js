/**
 * 카카오 드라이브 저장소 클래스
 * 카카오 클라우드 스토리지를 사용하여 데이터 저장
 */

class KakaoDriveStorage {
    constructor() {
        this.APP_KEY = 'YOUR_KAKAO_APP_KEY'; // 카카오 개발자 콘솔에서 발급
        this.REDIRECT_URI = 'http://localhost:8003'; // 리다이렉트 URI
        this.ACCESS_TOKEN = null;
        this.isAuthenticated = false;
        this.FOLDER_NAME = '경매시뮬레이터';
        this.FOLDER_ID = null;
    }

    // 카카오 드라이브 API 초기화
    async initialize() {
        try {
            await this.loadKakaoSDK();
            await this.authenticate();
            await this.createOrFindFolder();
            console.log('카카오 드라이브 Storage 초기화 완료');
            return true;
        } catch (error) {
            console.error('카카오 드라이브 Storage 초기화 실패:', error);
            return false;
        }
    }

    // 카카오 SDK 로드
    loadKakaoSDK() {
        return new Promise((resolve, reject) => {
            if (window.Kakao) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.1.0/kakao.min.js';
            script.onload = () => {
                window.Kakao.init(this.APP_KEY);
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 카카오 로그인 및 인증
    async authenticate() {
        try {
            // 카카오 로그인
            const authData = await this.kakaoLogin();
            
            if (authData.access_token) {
                this.ACCESS_TOKEN = authData.access_token;
                this.isAuthenticated = true;
                console.log('카카오 드라이브 인증 완료');
                return true;
            } else {
                throw new Error('카카오 인증 토큰을 받지 못했습니다');
            }
        } catch (error) {
            console.error('카카오 드라이브 인증 실패:', error);
            throw error;
        }
    }

    // 카카오 로그인 처리
    kakaoLogin() {
        return new Promise((resolve, reject) => {
            window.Kakao.Auth.login({
                success: function(authObj) {
                    console.log('카카오 로그인 성공:', authObj);
                    resolve(authObj);
                },
                fail: function(err) {
                    console.error('카카오 로그인 실패:', err);
                    reject(err);
                }
            });
        });
    }

    // 전용 폴더 생성 또는 찾기
    async createOrFindFolder() {
        try {
            // 기존 폴더 찾기
            const folders = await this.listFolders();
            const existingFolder = folders.find(folder => folder.name === this.FOLDER_NAME);

            if (existingFolder) {
                this.FOLDER_ID = existingFolder.id;
                console.log('기존 폴더 발견:', this.FOLDER_ID);
            } else {
                // 새 폴더 생성
                const newFolder = await this.createFolder(this.FOLDER_NAME);
                this.FOLDER_ID = newFolder.id;
                console.log('새 폴더 생성:', this.FOLDER_ID);
            }
        } catch (error) {
            console.error('폴더 처리 실패:', error);
            throw error;
        }
    }

    // 폴더 목록 조회
    async listFolders() {
        try {
            const response = await fetch('https://kapi.kakao.com/v1/api/storage/folders', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`폴더 목록 조회 실패: ${response.statusText}`);
            }

            const data = await response.json();
            return data.folders || [];
        } catch (error) {
            console.error('폴더 목록 조회 실패:', error);
            throw error;
        }
    }

    // 폴더 생성
    async createFolder(folderName) {
        try {
            const response = await fetch('https://kapi.kakao.com/v1/api/storage/folders', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: folderName,
                    parent_id: null // 루트 폴더에 생성
                })
            });

            if (!response.ok) {
                throw new Error(`폴더 생성 실패: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('폴더 생성 실패:', error);
            throw error;
        }
    }

    // 데이터 저장
    async saveData(filename, data) {
        try {
            if (!this.isAuthenticated) {
                throw new Error('카카오 드라이브 인증이 필요합니다');
            }

            const jsonData = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });

            // 기존 파일 찾기
            const existingFile = await this.findFile(filename);
            
            if (existingFile) {
                // 파일 업데이트
                await this.updateFile(existingFile.id, blob);
                console.log(`파일 업데이트 완료: ${filename}`);
            } else {
                // 새 파일 생성
                await this.createFile(filename, blob);
                console.log(`새 파일 생성 완료: ${filename}`);
            }

            return true;
        } catch (error) {
            console.error('데이터 저장 실패:', error);
            throw error;
        }
    }

    // 데이터 불러오기
    async loadData(filename) {
        try {
            if (!this.isAuthenticated) {
                throw new Error('카카오 드라이브 인증이 필요합니다');
            }

            const file = await this.findFile(filename);
            if (!file) {
                console.log(`파일을 찾을 수 없습니다: ${filename}`);
                return null;
            }

            const response = await fetch(`https://kapi.kakao.com/v1/api/storage/files/${file.id}/download`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.ACCESS_TOKEN}`
                }
            });

            if (!response.ok) {
                throw new Error(`파일 다운로드 실패: ${response.statusText}`);
            }

            const text = await response.text();
            const data = JSON.parse(text);
            console.log(`데이터 불러오기 완료: ${filename}`);
            return data;
        } catch (error) {
            console.error('데이터 불러오기 실패:', error);
            throw error;
        }
    }

    // 파일 찾기
    async findFile(filename) {
        try {
            const files = await this.listFiles();
            return files.find(file => file.name === filename);
        } catch (error) {
            console.error('파일 찾기 실패:', error);
            throw error;
        }
    }

    // 파일 목록 조회
    async listFiles() {
        try {
            const response = await fetch(`https://kapi.kakao.com/v1/api/storage/folders/${this.FOLDER_ID}/files`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`파일 목록 조회 실패: ${response.statusText}`);
            }

            const data = await response.json();
            return data.files || [];
        } catch (error) {
            console.error('파일 목록 조회 실패:', error);
            throw error;
        }
    }

    // 새 파일 생성
    async createFile(filename, blob) {
        try {
            const formData = new FormData();
            formData.append('file', blob, filename);
            formData.append('folder_id', this.FOLDER_ID);

            const response = await fetch('https://kapi.kakao.com/v1/api/storage/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.ACCESS_TOKEN}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`파일 생성 실패: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('파일 생성 실패:', error);
            throw error;
        }
    }

    // 파일 업데이트
    async updateFile(fileId, blob) {
        try {
            const formData = new FormData();
            formData.append('file', blob);

            const response = await fetch(`https://kapi.kakao.com/v1/api/storage/files/${fileId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.ACCESS_TOKEN}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`파일 업데이트 실패: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('파일 업데이트 실패:', error);
            throw error;
        }
    }

    // 파일 삭제
    async deleteFile(filename) {
        try {
            const file = await this.findFile(filename);
            if (!file) {
                console.log(`삭제할 파일을 찾을 수 없습니다: ${filename}`);
                return false;
            }

            const response = await fetch(`https://kapi.kakao.com/v1/api/storage/files/${file.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.ACCESS_TOKEN}`
                }
            });

            if (!response.ok) {
                throw new Error(`파일 삭제 실패: ${response.statusText}`);
            }

            console.log(`파일 삭제 완료: ${filename}`);
            return true;
        } catch (error) {
            console.error('파일 삭제 실패:', error);
            throw error;
        }
    }

    // 로그아웃
    async logout() {
        try {
            window.Kakao.Auth.logout();
            this.ACCESS_TOKEN = null;
            this.isAuthenticated = false;
            console.log('카카오 드라이브 로그아웃 완료');
        } catch (error) {
            console.error('로그아웃 실패:', error);
        }
    }
}

// 전역 인스턴스 생성
window.kakaoDriveStorage = new KakaoDriveStorage();

// 경매 시뮬레이터와 연동하는 래퍼 함수들
window.kakaoDriveHelpers = {
    // 매물 데이터 저장
    async savePropertyData(propertyIndex, data) {
        const filename = `매물_${propertyIndex}_${Date.now()}.json`;
        return await window.kakaoDriveStorage.saveData(filename, data);
    },

    // 매물 데이터 불러오기
    async loadPropertyData(filename) {
        return await window.kakaoDriveStorage.loadData(filename);
    },

    // 모든 매물 데이터 저장
    async saveAllProperties(properties) {
        const filename = `모든매물_${Date.now()}.json`;
        return await window.kakaoDriveStorage.saveData(filename, properties);
    },

    // 백업 데이터 저장
    async createBackup(allData) {
        const filename = `백업_${new Date().toISOString().split('T')[0]}.json`;
        return await window.kakaoDriveStorage.saveData(filename, allData);
    }
};

console.log('카카오 드라이브 Storage 모듈이 로드되었습니다.');
console.log('사용법:');
console.log('1. window.kakaoDriveStorage.initialize() - 초기화');
console.log('2. window.kakaoDriveHelpers.savePropertyData(index, data) - 매물 저장');
console.log('3. window.kakaoDriveHelpers.loadPropertyData(filename) - 매물 불러오기');
