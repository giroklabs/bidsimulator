/**
 * 구글 드라이브 저장소 클래스
 * Google Drive API를 사용하여 데이터를 구글 드라이브에 저장
 */

class GoogleDriveStorage {
    constructor() {
        this.API_KEY = 'YOUR_API_KEY'; // Google Cloud Console에서 발급
        this.CLIENT_ID = 'YOUR_CLIENT_ID'; // OAuth 2.0 클라이언트 ID
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
        this.FOLDER_NAME = '경매시뮬레이터';
        this.FOLDER_ID = null;
        this.isAuthenticated = false;
    }

    // Google Drive API 초기화
    async initialize() {
        try {
            await this.loadGoogleAPI();
            await this.authenticate();
            await this.createOrFindFolder();
            console.log('Google Drive Storage 초기화 완료');
            return true;
        } catch (error) {
            console.error('Google Drive Storage 초기화 실패:', error);
            return false;
        }
    }

    // Google API 로드
    loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                window.gapi.load('client:auth2', () => {
                    window.gapi.client.init({
                        apiKey: this.API_KEY,
                        clientId: this.CLIENT_ID,
                        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                        scope: this.SCOPES
                    }).then(() => {
                        resolve();
                    }).catch(reject);
                });
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 사용자 인증
    async authenticate() {
        try {
            const authInstance = window.gapi.auth2.getAuthInstance();
            const user = await authInstance.signIn();
            this.isAuthenticated = true;
            console.log('Google Drive 인증 완료:', user.getBasicProfile().getName());
            return true;
        } catch (error) {
            console.error('Google Drive 인증 실패:', error);
            throw error;
        }
    }

    // 전용 폴더 생성 또는 찾기
    async createOrFindFolder() {
        try {
            // 기존 폴더 찾기
            const response = await window.gapi.client.drive.files.list({
                q: `name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder'`,
                fields: 'files(id, name)'
            });

            if (response.result.files.length > 0) {
                this.FOLDER_ID = response.result.files[0].id;
                console.log('기존 폴더 발견:', this.FOLDER_ID);
            } else {
                // 새 폴더 생성
                const folderResponse = await window.gapi.client.drive.files.create({
                    resource: {
                        name: this.FOLDER_NAME,
                        mimeType: 'application/vnd.google-apps.folder'
                    },
                    fields: 'id'
                });
                this.FOLDER_ID = folderResponse.result.id;
                console.log('새 폴더 생성:', this.FOLDER_ID);
            }
        } catch (error) {
            console.error('폴더 처리 실패:', error);
            throw error;
        }
    }

    // 데이터 저장
    async saveData(filename, data) {
        try {
            if (!this.isAuthenticated) {
                throw new Error('Google Drive 인증이 필요합니다');
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
                throw new Error('Google Drive 인증이 필요합니다');
            }

            const file = await this.findFile(filename);
            if (!file) {
                console.log(`파일을 찾을 수 없습니다: ${filename}`);
                return null;
            }

            const response = await window.gapi.client.drive.files.get({
                fileId: file.id,
                alt: 'media'
            });

            const data = JSON.parse(response.body);
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
            const response = await window.gapi.client.drive.files.list({
                q: `name='${filename}' and parents in '${this.FOLDER_ID}'`,
                fields: 'files(id, name, modifiedTime)'
            });

            return response.result.files.length > 0 ? response.result.files[0] : null;
        } catch (error) {
            console.error('파일 찾기 실패:', error);
            throw error;
        }
    }

    // 새 파일 생성
    async createFile(filename, blob) {
        const metadata = {
            name: filename,
            parents: [this.FOLDER_ID]
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
            },
            body: form
        });

        if (!response.ok) {
            throw new Error(`파일 생성 실패: ${response.statusText}`);
        }

        return response.json();
    }

    // 파일 업데이트
    async updateFile(fileId, blob) {
        const form = new FormData();
        form.append('file', blob);

        const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
            },
            body: blob
        });

        if (!response.ok) {
            throw new Error(`파일 업데이트 실패: ${response.statusText}`);
        }

        return response.json();
    }

    // 파일 목록 조회
    async listFiles() {
        try {
            const response = await window.gapi.client.drive.files.list({
                q: `parents in '${this.FOLDER_ID}'`,
                fields: 'files(id, name, modifiedTime, size)',
                orderBy: 'modifiedTime desc'
            });

            return response.result.files;
        } catch (error) {
            console.error('파일 목록 조회 실패:', error);
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

            await window.gapi.client.drive.files.delete({
                fileId: file.id
            });

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
            const authInstance = window.gapi.auth2.getAuthInstance();
            await authInstance.signOut();
            this.isAuthenticated = false;
            console.log('Google Drive 로그아웃 완료');
        } catch (error) {
            console.error('로그아웃 실패:', error);
        }
    }
}

// 전역 인스턴스 생성
window.googleDriveStorage = new GoogleDriveStorage();

// 경매 시뮬레이터와 연동하는 래퍼 함수들
window.googleDriveHelpers = {
    // 매물 데이터 저장
    async savePropertyData(propertyIndex, data) {
        const filename = `매물_${propertyIndex}_${Date.now()}.json`;
        return await window.googleDriveStorage.saveData(filename, data);
    },

    // 매물 데이터 불러오기
    async loadPropertyData(filename) {
        return await window.googleDriveStorage.loadData(filename);
    },

    // 모든 매물 데이터 저장
    async saveAllProperties(properties) {
        const filename = `모든매물_${Date.now()}.json`;
        return await window.googleDriveStorage.saveData(filename, properties);
    },

    // 백업 데이터 저장
    async createBackup(allData) {
        const filename = `백업_${new Date().toISOString().split('T')[0]}.json`;
        return await window.googleDriveStorage.saveData(filename, allData);
    }
};

console.log('Google Drive Storage 모듈이 로드되었습니다.');
console.log('사용법:');
console.log('1. window.googleDriveStorage.initialize() - 초기화');
console.log('2. window.googleDriveHelpers.savePropertyData(index, data) - 매물 저장');
console.log('3. window.googleDriveHelpers.loadPropertyData(filename) - 매물 불러오기');
