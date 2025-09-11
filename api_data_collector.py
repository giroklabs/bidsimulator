#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API 기반 부동산 데이터 수집 시스템
공식 API와 비공식 API를 통한 데이터 수집
"""

import requests
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class APIDataCollector:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Content-Type': 'application/json'
        })
        
        # API 엔드포인트 설정
        self.api_endpoints = {
            'court_auction': 'https://www.courtauction.go.kr/api/auction',
            'richgo': 'https://m.richgo.ai/api/property',
            'real_estate114': 'https://www.r114.com/api/search',
            'zigbang': 'https://www.zigbang.com/api/v1/search',
            'naver_real_estate': 'https://land.naver.com/api/auction'
        }
    
    def collect_court_auction_data(self, case_number: str) -> Optional[Dict]:
        """법원경매 API 데이터 수집"""
        try:
            # 실제 API 엔드포인트 (예시)
            url = f"{self.api_endpoints['court_auction']}/search"
            params = {
                'caseNo': case_number,
                'format': 'json'
            }
            
            response = self.session.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return self.parse_court_auction_api_data(data, case_number)
            else:
                logger.warning(f"법원경매 API 호출 실패: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"법원경매 API 수집 실패: {e}")
            return None
    
    def collect_richgo_data(self, location: str, property_type: str) -> Optional[Dict]:
        """리치고 API 데이터 수집"""
        try:
            # 리치고 내부 API 호출
            url = f"{self.api_endpoints['richgo']}/search"
            payload = {
                'location': location,
                'propertyType': property_type,
                'limit': 10
            }
            
            response = self.session.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return self.parse_richgo_api_data(data, location, property_type)
            else:
                logger.warning(f"리치고 API 호출 실패: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"리치고 API 수집 실패: {e}")
            return None
    
    def collect_naver_real_estate_data(self, location: str, property_type: str) -> Optional[Dict]:
        """네이버 부동산 API 데이터 수집"""
        try:
            # 네이버 부동산 API (비공식)
            url = "https://land.naver.com/api/auction/search"
            params = {
                'q': location,
                'type': property_type,
                'page': 1,
                'size': 10
            }
            
            response = self.session.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return self.parse_naver_api_data(data, location, property_type)
            else:
                logger.warning(f"네이버 부동산 API 호출 실패: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"네이버 부동산 API 수집 실패: {e}")
            return None
    
    def collect_kb_real_estate_data(self, location: str, property_type: str) -> Optional[Dict]:
        """KB부동산 API 데이터 수집"""
        try:
            # KB부동산 공식 API
            url = "https://api.kbland.kr/api/auction/search"
            headers = {
                'Authorization': 'Bearer YOUR_API_KEY',  # 실제 API 키 필요
                'Content-Type': 'application/json'
            }
            
            payload = {
                'location': location,
                'propertyType': property_type,
                'dateFrom': (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
                'dateTo': datetime.now().strftime('%Y-%m-%d')
            }
            
            response = self.session.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return self.parse_kb_api_data(data, location, property_type)
            else:
                logger.warning(f"KB부동산 API 호출 실패: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"KB부동산 API 수집 실패: {e}")
            return None
    
    def collect_multiple_api_data(self, case_number: str, location: str, property_type: str) -> Dict:
        """다중 API에서 데이터 수집"""
        results = {
            'caseNumber': case_number,
            'location': location,
            'propertyType': property_type,
            'sources': {},
            'combined': {},
            'lastUpdated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # 1. 법원경매 API
        logger.info("법원경매 API 데이터 수집 시작...")
        court_data = self.collect_court_auction_data(case_number)
        if court_data:
            results['sources']['court_auction'] = court_data
        
        # 2. 리치고 API
        logger.info("리치고 API 데이터 수집 시작...")
        richgo_data = self.collect_richgo_data(location, property_type)
        if richgo_data:
            results['sources']['richgo'] = richgo_data
        
        # 3. 네이버 부동산 API
        logger.info("네이버 부동산 API 데이터 수집 시작...")
        naver_data = self.collect_naver_real_estate_data(location, property_type)
        if naver_data:
            results['sources']['naver'] = naver_data
        
        # 4. KB부동산 API
        logger.info("KB부동산 API 데이터 수집 시작...")
        kb_data = self.collect_kb_real_estate_data(location, property_type)
        if kb_data:
            results['sources']['kb'] = kb_data
        
        # 5. 데이터 통합 및 분석
        results['combined'] = self.combine_api_data(results['sources'])
        
        return results
    
    def parse_court_auction_api_data(self, data: Dict, case_number: str) -> Dict:
        """법원경매 API 데이터 파싱"""
        try:
            if 'data' in data and len(data['data']) > 0:
                item = data['data'][0]
                return {
                    'caseNumber': case_number,
                    'court': item.get('court', ''),
                    'propertyType': item.get('propertyType', ''),
                    'location': item.get('location', ''),
                    'appraisalPrice': item.get('appraisalPrice', 0),
                    'minimumBid': item.get('minimumBid', 0),
                    'auctionDate': item.get('auctionDate', ''),
                    'status': item.get('status', ''),
                    'marketPrice': int(item.get('appraisalPrice', 0) * 1.1),
                    'source': '법원경매 API',
                    'lastUpdated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
            return None
        except Exception as e:
            logger.error(f"법원경매 API 데이터 파싱 실패: {e}")
            return None
    
    def parse_richgo_api_data(self, data: Dict, location: str, property_type: str) -> Dict:
        """리치고 API 데이터 파싱"""
        try:
            if 'results' in data and len(data['results']) > 0:
                item = data['results'][0]
                return {
                    'location': location,
                    'propertyType': property_type,
                    'marketPrice': item.get('price', 0),
                    'pricePerSqm': item.get('pricePerSqm', 0),
                    'transactionVolume': item.get('transactionVolume', 0),
                    'priceChange': item.get('priceChange', 0),
                    'analysis': item.get('analysis', {}),
                    'source': '리치고 API',
                    'lastUpdated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
            return None
        except Exception as e:
            logger.error(f"리치고 API 데이터 파싱 실패: {e}")
            return None
    
    def parse_naver_api_data(self, data: Dict, location: str, property_type: str) -> Dict:
        """네이버 부동산 API 데이터 파싱"""
        try:
            if 'items' in data and len(data['items']) > 0:
                item = data['items'][0]
                return {
                    'location': location,
                    'propertyType': property_type,
                    'marketPrice': item.get('price', 0),
                    'pricePerSqm': item.get('pricePerSqm', 0),
                    'transactionVolume': item.get('transactionVolume', 0),
                    'source': '네이버 부동산 API',
                    'lastUpdated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
            return None
        except Exception as e:
            logger.error(f"네이버 부동산 API 데이터 파싱 실패: {e}")
            return None
    
    def parse_kb_api_data(self, data: Dict, location: str, property_type: str) -> Dict:
        """KB부동산 API 데이터 파싱"""
        try:
            if 'data' in data and len(data['data']) > 0:
                item = data['data'][0]
                return {
                    'location': location,
                    'propertyType': property_type,
                    'marketPrice': item.get('marketPrice', 0),
                    'appraisalPrice': item.get('appraisalPrice', 0),
                    'minimumBid': item.get('minimumBid', 0),
                    'source': 'KB부동산 API',
                    'lastUpdated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
            return None
        except Exception as e:
            logger.error(f"KB부동산 API 데이터 파싱 실패: {e}")
            return None
    
    def combine_api_data(self, sources_data: Dict) -> Dict:
        """API 데이터 통합 및 분석"""
        combined = {
            'marketPrice': 0,
            'appraisalPrice': 0,
            'minimumBid': 0,
            'confidence': 0,
            'sources_count': len(sources_data),
            'analysis': {}
        }
        
        prices = []
        sources = []
        
        # 각 소스에서 가격 데이터 수집
        for source_name, data in sources_data.items():
            if isinstance(data, dict):
                if 'marketPrice' in data and data['marketPrice'] > 0:
                    prices.append(data['marketPrice'])
                    sources.append(source_name)
                elif 'appraisalPrice' in data and data['appraisalPrice'] > 0:
                    prices.append(data['appraisalPrice'])
                    sources.append(source_name)
        
        if prices:
            # 가격 데이터 통합
            combined['marketPrice'] = int(sum(prices) / len(prices))
            combined['appraisalPrice'] = int(combined['marketPrice'] * 0.9)
            combined['minimumBid'] = int(combined['marketPrice'] * 0.7)
            combined['confidence'] = min(100, len(sources) * 25)
            
            # 분석 결과
            combined['analysis'] = {
                'priceRange': f"{min(prices):,}원 ~ {max(prices):,}원",
                'averagePrice': f"{combined['marketPrice']:,}원",
                'priceVariation': f"{((max(prices) - min(prices)) / min(prices) * 100):.1f}%",
                'recommendation': self.get_investment_recommendation(combined['marketPrice']),
                'riskLevel': self.get_risk_level(combined['confidence']),
                'dataQuality': self.get_data_quality_score(sources)
            }
        
        return combined
    
    def get_investment_recommendation(self, price: int) -> str:
        """투자 추천 분석"""
        if price > 300000000:
            return "고가 매물 - 신중한 검토 필요"
        elif price > 200000000:
            return "중가 매물 - 투자 적합"
        else:
            return "저가 매물 - 투자 기회"
    
    def get_risk_level(self, confidence: int) -> str:
        """위험도 분석"""
        if confidence >= 75:
            return "낮음"
        elif confidence >= 50:
            return "중간"
        else:
            return "높음"
    
    def get_data_quality_score(self, sources: List[str]) -> str:
        """데이터 품질 점수"""
        official_sources = ['court_auction', 'kb']
        official_count = sum(1 for source in sources if source in official_sources)
        
        if official_count >= 2:
            return "높음 (공식 소스 2개 이상)"
        elif official_count >= 1:
            return "중간 (공식 소스 1개)"
        else:
            return "낮음 (비공식 소스만)"

# 테스트 함수
def test_api_collector():
    """API 수집기 테스트"""
    collector = APIDataCollector()
    
    case_number = "2024타경12345"
    location = "서울시 강남구"
    property_type = "아파트"
    
    print(f"=== API 데이터 수집 테스트: {case_number} ===")
    results = collector.collect_multiple_api_data(case_number, location, property_type)
    
    print(f"사건번호: {results['caseNumber']}")
    print(f"수집된 소스 수: {results['combined']['sources_count']}")
    print(f"신뢰도: {results['combined']['confidence']}%")
    
    if results['combined']['marketPrice'] > 0:
        print(f"통합 시세: {results['combined']['marketPrice']:,}원")
        print(f"분석 결과: {results['combined']['analysis']['recommendation']}")
        print(f"데이터 품질: {results['combined']['analysis']['dataQuality']}")
    
    return results

if __name__ == "__main__":
    test_api_collector()
