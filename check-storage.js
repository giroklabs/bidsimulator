/**
 * 저장 위치 확인 도구
 */

// 저장 위치 확인 함수
window.checkStorageLocation = () => {
    console.log('=== 저장 위치 확인 ===');
    
    // 1. localStorage 전체 내용 확인
    console.log('📁 localStorage 전체 내용:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`  ${key}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
    }
    
    // 2. 주요 저장 키 확인
    const mainKey = 'auctionSimulatorData';
    const mainData = localStorage.getItem(mainKey);
    if (mainData) {
        console.log(`📊 메인 저장 키 "${mainKey}":`);
        try {
            const parsed = JSON.parse(mainData);
            console.log('  - properties 개수:', parsed.properties?.length || 0);
            console.log('  - currentPropertyIndex:', parsed.currentPropertyIndex);
            console.log('  - lastSaved:', parsed.lastSaved);
            
            if (parsed.properties && parsed.properties.length > 0) {
                console.log('  - 매물 목록:');
                parsed.properties.forEach((prop, index) => {
                    console.log(`    ${index}: ${prop.name} (${prop.caseNumber})`);
                    if (prop.data) {
                        console.log(`      - auctionInfo: ${Object.keys(prop.data.auctionInfo || {}).length}개 필드`);
                        console.log(`      - inspectionData: ${Object.keys(prop.data.inspectionData || {}).length}개 필드`);
                        console.log(`      - simulationResult: ${Object.keys(prop.data.simulationResult || {}).length}개 필드`);
                        console.log(`      - saleRateInfo: ${Object.keys(prop.data.saleRateInfo || {}).length}개 필드`);
                        console.log(`      - lastSaved: ${prop.data.lastSaved}`);
                    }
                });
            }
        } catch (error) {
            console.error('메인 데이터 파싱 오류:', error);
        }
    } else {
        console.log(`❌ 메인 저장 키 "${mainKey}"가 없습니다.`);
    }
    
    // 3. 브라우저 저장 공간 정보
    console.log('💾 브라우저 저장 공간 정보:');
    try {
        const used = JSON.stringify(localStorage).length;
        console.log(`  - 현재 사용량: ${(used / 1024).toFixed(2)} KB`);
        console.log(`  - localStorage 최대 용량: 약 5-10MB (브라우저별 상이)`);
        
        // 용량 테스트
        const testKey = 'storage_test';
        let testSize = 0;
        try {
            const testData = 'x'.repeat(1024); // 1KB 테스트 데이터
            localStorage.setItem(testKey, testData);
            testSize = localStorage.getItem(testKey).length;
            localStorage.removeItem(testKey);
            console.log(`  - 1KB 테스트 데이터 저장/삭제 성공`);
        } catch (error) {
            console.error(`  - 저장 공간 부족 또는 오류:`, error);
        }
    } catch (error) {
        console.error('저장 공간 정보 확인 오류:', error);
    }
    
    // 4. StorageManager 상태 확인
    if (window.storageManager) {
        console.log('🔧 StorageManager 상태:');
        console.log('  - storageKey:', window.storageManager.storageKey);
        console.log('  - currentData:', window.storageManager.currentData);
    } else {
        console.log('❌ StorageManager가 초기화되지 않았습니다.');
    }
};

// 저장 데이터 백업 함수
window.backupStorage = () => {
    console.log('=== 저장 데이터 백업 ===');
    const backup = {};
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        backup[key] = localStorage.getItem(key);
    }
    
    const backupJson = JSON.stringify(backup, null, 2);
    console.log('백업 데이터:', backupJson);
    
    // 파일로 다운로드
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auction-simulator-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('백업 파일이 다운로드되었습니다.');
};

// 저장 데이터 복원 함수
window.restoreStorage = (backupData) => {
    console.log('=== 저장 데이터 복원 ===');
    if (!backupData) {
        console.error('복원할 백업 데이터가 없습니다.');
        return;
    }
    
    try {
        // 현재 데이터 백업
        const currentBackup = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            currentBackup[key] = localStorage.getItem(key);
        }
        
        // localStorage 초기화
        localStorage.clear();
        
        // 백업 데이터 복원
        Object.keys(backupData).forEach(key => {
            localStorage.setItem(key, backupData[key]);
        });
        
        console.log('데이터 복원 완료');
        console.log('복원된 키들:', Object.keys(backupData));
        
        // 페이지 새로고침 권장
        console.log('페이지를 새로고침하여 변경사항을 적용하세요.');
        
    } catch (error) {
        console.error('데이터 복원 실패:', error);
        
        // 복원 실패 시 현재 데이터 복구
        Object.keys(currentBackup).forEach(key => {
            localStorage.setItem(key, currentBackup[key]);
        });
        console.log('원래 데이터로 복구되었습니다.');
    }
};

// 저장 공간 정리 함수
window.cleanupStorage = () => {
    console.log('=== 저장 공간 정리 ===');
    
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // 오래된 키나 불필요한 키 식별
        if (key && (key.includes('temp') || key.includes('old') || key.includes('backup'))) {
            keysToRemove.push(key);
        }
    }
    
    if (keysToRemove.length > 0) {
        console.log('정리할 키들:', keysToRemove);
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`제거됨: ${key}`);
        });
        console.log('저장 공간 정리 완료');
    } else {
        console.log('정리할 항목이 없습니다.');
    }
};

console.log('저장 위치 확인 도구가 로드되었습니다:');
console.log('- checkStorageLocation(): 저장 위치 및 내용 확인');
console.log('- backupStorage(): 현재 데이터 백업 다운로드');
console.log('- restoreStorage(backupData): 백업 데이터 복원');
console.log('- cleanupStorage(): 불필요한 데이터 정리');
