/**
 * 카카오 드라이브 스토리지 서비스
 * 카카오 드라이브 API를 사용한 데이터 저장 및 관리
 */

window.kakaoDriveStorage = {
    // 카카오 드라이브 API 설정
    KAKAO_DRIVE_API_URL: 'https://kapi.kakao.com/v1/api/drive',
    KAKAO_UPLOAD_API_URL: 'https://kapi.kakao.com/v1/api/drive/files',
    
    // 카카오 드라이브 정보
    driveInfo: null,
    folderId: null,
    
    /**
     * 카카오 드라이브 스토리지 초기화
     */
    async init() {
        console.log('=== 카카오 드라이브 스토리지 초기화 시작 ===');
        
        // 카카오 로그인 상태 확인
        const kakaoAccessToken = localStorage.getItem('kakao_access_token');
        if (!kakaoAccessToken) {
            console.log('카카오 로그인이 필요합니다.');
            return false;
        }
        
        try {
            // 카카오 드라이브 정보 가져오기
            await this.getDriveInfo();
            
            // 전용 폴더 생성 또는 찾기
            await this.ensureProjectFolder();
            
            console.log('=== 카카오 드라이브 스토리지 초기화 완료 ===');
            return true;
        } catch (error) {
            console.error('카카오 드라이브 초기화 오류:', error);
            return false;
        }
    },
    
    /**
     * 카카오 드라이브 정보 가져오기
     */
    async getDriveInfo() {
        try {
            const kakaoAccessToken = localStorage.getItem('kakao_access_token');
            
            const response = await fetch(`${this.KAKAO_DRIVE_API_URL}/info`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${kakaoAccessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
                }
            });
            
            if (!response.ok) {
                throw new Error(`드라이브 정보 요청 실패: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('카카오 드라이브 정보:', data);
            
            this.driveInfo = data;
            return data;
        } catch (error) {
            console.error('카카오 드라이브 정보 가져오기 오류:', error);
            throw error;
        }
    },
    
    /**
     * 프로젝트 전용 폴더 생성 또는 찾기
     */
    async ensureProjectFolder() {
        try {
            const kakaoAccessToken = localStorage.getItem('kakao_access_token');
            const folderName = '경매입찰시뮬레이션';
            
            // 기존 폴더 검색
            const existingFolder = await this.findFolder(folderName);
            
            if (existingFolder) {
                this.folderId = existingFolder.id;
                console.log('기존 폴더 발견:', existingFolder);
                return existingFolder;
            }
            
            // 새 폴더 생성
            const newFolder = await this.createFolder(folderName);
            this.folderId = newFolder.id;
            console.log('새 폴더 생성:', newFolder);
            return newFolder;
            
        } catch (error) {
            console.error('폴더 생성/찾기 오류:', error);
            throw error;
        }
    },
    
    /**
     * 폴더 검색
     */
    async findFolder(folderName) {
        try {
            const kakaoAccessToken = localStorage.getItem('kakao_access_token');
            
            const response = await fetch(`${this.KAKAO_DRIVE_API_URL}/folders`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${kakaoAccessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
                }
            });
            
            if (!response.ok) {
                throw new Error(`폴더 목록 요청 실패: ${response.status}`);
            }
            
            const data = await response.json();
            const folders = data.folders || [];
            
            // 이름으로 폴더 찾기
            const foundFolder = folders.find(folder => folder.name === folderName);
            return foundFolder || null;
            
        } catch (error) {
            console.error('폴더 검색 오류:', error);
            return null;
        }
    },
    
    /**
     * 새 폴더 생성
     */
    async createFolder(folderName) {
        try {
            const kakaoAccessToken = localStorage.getItem('kakao_access_token');
            
            const response = await fetch(`${this.KAKAO_DRIVE_API_URL}/folders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${kakaoAccessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
                },
                body: new URLSearchParams({
                    name: folderName,
                    parent_id: 'root' // 루트 폴더에 생성
                }).toString()
            });
            
            if (!response.ok) {
                throw new Error(`폴더 생성 실패: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('폴더 생성 오류:', error);
            throw error;
        }
    },
    
    /**
     * 데이터를 카카오 드라이브에 저장
     */
    async saveToKakaoDrive(data, fileName = 'auction-data.json') {
        try {
            console.log('=== 카카오 드라이브에 데이터 저장 시작 ===');
            
            if (!this.folderId) {
                await this.init();
            }
            
            const kakaoAccessToken = localStorage.getItem('kakao_access_token');
            
            // JSON 데이터를 Blob으로 변환
            const jsonData = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            
            // FormData 생성
            const formData = new FormData();
            formData.append('file', blob, fileName);
            formData.append('folder_id', this.folderId);
            
            // 파일 업로드
            const response = await fetch(`${this.KAKAO_UPLOAD_API_URL}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${kakaoAccessToken}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`파일 업로드 실패: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('카카오 드라이브 저장 완료:', result);
            
            return result;
            
        } catch (error) {
            console.error('카카오 드라이브 저장 오류:', error);
            throw error;
        }
    },
    
    /**
     * 카카오 드라이브에서 데이터 불러오기
     */
    async loadFromKakaoDrive(fileName = 'auction-data.json') {
        try {
            console.log('=== 카카오 드라이브에서 데이터 불러오기 시작 ===');
            
            if (!this.folderId) {
                await this.init();
            }
            
            const kakaoAccessToken = localStorage.getItem('kakao_access_token');
            
            // 폴더 내 파일 목록 가져오기
            const response = await fetch(`${this.KAKAO_DRIVE_API_URL}/folders/${this.folderId}/files`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${kakaoAccessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
                }
            });
            
            if (!response.ok) {
                throw new Error(`파일 목록 요청 실패: ${response.status}`);
            }
            
            const data = await response.json();
            const files = data.files || [];
            
            // 파일 찾기
            const targetFile = files.find(file => file.name === fileName);
            if (!targetFile) {
                console.log('저장된 파일을 찾을 수 없습니다.');
                return null;
            }
            
            // 파일 다운로드
            const downloadResponse = await fetch(`${this.KAKAO_DRIVE_API_URL}/files/${targetFile.id}/download`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${kakaoAccessToken}`
                }
            });
            
            if (!downloadResponse.ok) {
                throw new Error(`파일 다운로드 실패: ${downloadResponse.status}`);
            }
            
            const fileData = await downloadResponse.text();
            const parsedData = JSON.parse(fileData);
            
            console.log('카카오 드라이브에서 데이터 불러오기 완료:', parsedData);
            return parsedData;
            
        } catch (error) {
            console.error('카카오 드라이브 불러오기 오류:', error);
            throw error;
        }
    },
    
    /**
     * 카카오 드라이브 상태 확인
     */
    getStatus() {
        return {
            isInitialized: !!this.folderId,
            hasAccessToken: !!localStorage.getItem('kakao_access_token'),
            folderId: this.folderId,
            driveInfo: this.driveInfo
        };
    },
    
    /**
     * 카카오 드라이브 연결 해제
     */
    disconnect() {
        this.driveInfo = null;
        this.folderId = null;
        console.log('카카오 드라이브 연결 해제');
    }
};

// 카카오 드라이브 스토리지 초기화
if (typeof window !== 'undefined') {
    // 카카오 로그인 후 자동 초기화
    document.addEventListener('DOMContentLoaded', () => {
        // 카카오 로그인 상태 확인 후 초기화
        const kakaoAccessToken = localStorage.getItem('kakao_access_token');
        if (kakaoAccessToken) {
            window.kakaoDriveStorage.init();
        }
    });
}
