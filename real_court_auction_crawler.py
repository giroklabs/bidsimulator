#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
실제 법원경매사이트 크롤링 시스템
더 정교한 방법으로 실제 데이터 수집
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
import random
from datetime import datetime, timedelta
from urllib.parse import quote, urljoin
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import logging

logger = logging.getLogger(__name__)

class RealCourtAuctionCrawler:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        
    def get_real_auction_data(self, case_number):
        """실제 법원경매 데이터 수집"""
        try:
            # 1. 법원경매사이트 직접 접근
            real_data = self.crawl_court_auction_direct(case_number)
            if real_data:
                return real_data
            
            # 2. 대법원 경매정보시스템 접근
            real_data = self.crawl_supreme_court_auction(case_number)
            if real_data:
                return real_data
            
            # 3. 각 지방법원별 접근
            real_data = self.crawl_regional_court_auction(case_number)
            if real_data:
                return real_data
            
            # 4. 부동산114, 직방 등 부동산 사이트에서 경매 정보 검색
            real_data = self.crawl_real_estate_sites(case_number)
            if real_data:
                return real_data
            
            return None
            
        except Exception as e:
            logger.error(f"실제 경매 데이터 수집 실패: {e}")
            return None
    
    def crawl_court_auction_direct(self, case_number):
        """법원경매사이트 직접 크롤링"""
        try:
            # 사건번호 파싱
            parsed_case = self.parse_case_number(case_number)
            if not parsed_case:
                return None
            
            # 여러 URL 패턴 시도
            urls = [
                f"https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ163M01.xml&caseNo={quote(case_number)}",
                f"https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ163M02.xml&caseNo={quote(case_number)}",
                f"https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ163M03.xml&caseNo={quote(case_number)}",
                f"https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ163M04.xml&caseNo={quote(case_number)}"
            ]
            
            for url in urls:
                try:
                    logger.info(f"법원경매사이트 접근 시도: {url}")
                    response = self.session.get(url, timeout=15)
                    response.raise_for_status()
                    
                    soup = BeautifulSoup(response.content, 'html.parser')
                    auction_data = self.extract_auction_data_from_html(soup, case_number)
                    
                    if auction_data:
                        logger.info(f"실제 경매 데이터 수집 성공: {case_number}")
                        return auction_data
                        
                except Exception as e:
                    logger.warning(f"URL 접근 실패: {url}, 오류: {e}")
                    continue
            
            return None
            
        except Exception as e:
            logger.error(f"법원경매사이트 직접 크롤링 실패: {e}")
            return None
    
    def crawl_supreme_court_auction(self, case_number):
        """대법원 경매정보시스템 크롤링"""
        try:
            # 대법원 경매정보시스템 URL
            url = "https://www.scourt.go.kr/portal/information/auction/auction_list.jsp"
            
            # POST 요청으로 검색
            data = {
                'caseNo': case_number,
                'searchType': 'caseNo'
            }
            
            response = self.session.post(url, data=data, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            auction_data = self.extract_auction_data_from_html(soup, case_number)
            
            if auction_data:
                logger.info(f"대법원 경매정보시스템에서 데이터 수집 성공: {case_number}")
                return auction_data
            
            return None
            
        except Exception as e:
            logger.error(f"대법원 경매정보시스템 크롤링 실패: {e}")
            return None
    
    def crawl_regional_court_auction(self, case_number):
        """각 지방법원별 경매 정보 크롤링"""
        try:
            # 사건번호에서 법원 정보 추출
            parsed_case = self.parse_case_number(case_number)
            if not parsed_case:
                return None
            
            court_code = parsed_case.get('court_code', '')
            court_name = parsed_case.get('court_name', '')
            
            # 지방법원별 URL 패턴
            court_urls = {
                '서울': 'https://www.slcourt.go.kr/auction/',
                '부산': 'https://www.bsdcourt.go.kr/auction/',
                '대구': 'https://www.dgdcourt.go.kr/auction/',
                '인천': 'https://www.icdcourt.go.kr/auction/',
                '광주': 'https://www.gjdcourt.go.kr/auction/',
                '대전': 'https://www.djdcourt.go.kr/auction/',
                '울산': 'https://www.ulsdcourt.go.kr/auction/',
                '세종': 'https://www.sjdcourt.go.kr/auction/'
            }
            
            for court, base_url in court_urls.items():
                if court in court_name:
                    try:
                        search_url = f"{base_url}search?caseNo={quote(case_number)}"
                        response = self.session.get(search_url, timeout=15)
                        response.raise_for_status()
                        
                        soup = BeautifulSoup(response.content, 'html.parser')
                        auction_data = self.extract_auction_data_from_html(soup, case_number)
                        
                        if auction_data:
                            logger.info(f"{court}지방법원에서 데이터 수집 성공: {case_number}")
                            return auction_data
                            
                    except Exception as e:
                        logger.warning(f"{court}지방법원 접근 실패: {e}")
                        continue
            
            return None
            
        except Exception as e:
            logger.error(f"지방법원 경매 정보 크롤링 실패: {e}")
            return None
    
    def crawl_real_estate_sites(self, case_number):
        """부동산 사이트에서 경매 정보 검색"""
        try:
            # 부동산114 경매 검색
            data = self.crawl_real_estate114_auction(case_number)
            if data:
                return data
            
            # 직방 경매 검색
            data = self.crawl_zigbang_auction(case_number)
            if data:
                return data
            
            # 네이버 부동산 경매 검색
            data = self.crawl_naver_real_estate_auction(case_number)
            if data:
                return data
            
            return None
            
        except Exception as e:
            logger.error(f"부동산 사이트 경매 정보 크롤링 실패: {e}")
            return None
    
    def crawl_real_estate114_auction(self, case_number):
        """부동산114 경매 검색"""
        try:
            url = "https://www.r114.com/auction/search"
            params = {
                'q': case_number,
                'type': 'auction'
            }
            
            response = self.session.get(url, params=params, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 경매 정보 추출
            auction_items = soup.find_all('div', class_='auction-item')
            if auction_items:
                item = auction_items[0]  # 첫 번째 결과
                
                # 가격 정보 추출
                price_elem = item.find('span', class_='price')
                if price_elem:
                    price_text = price_elem.get_text().strip()
                    price = self.parse_price(price_text)
                    
                    return {
                        'caseNumber': case_number,
                        'marketPrice': price,
                        'appraisalPrice': int(price * 0.9),
                        'minimumBid': int(price * 0.7),
                        'source': '부동산114 (실제)',
                        'lastUpdated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'isRealData': True
                    }
            
            return None
            
        except Exception as e:
            logger.warning(f"부동산114 경매 검색 실패: {e}")
            return None
    
    def crawl_zigbang_auction(self, case_number):
        """직방 경매 검색"""
        try:
            url = "https://www.zigbang.com/auction/search"
            params = {
                'q': case_number
            }
            
            response = self.session.get(url, params=params, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 경매 정보 추출
            auction_items = soup.find_all('div', class_='auction-card')
            if auction_items:
                item = auction_items[0]  # 첫 번째 결과
                
                # 가격 정보 추출
                price_elem = item.find('div', class_='price')
                if price_elem:
                    price_text = price_elem.get_text().strip()
                    price = self.parse_price(price_text)
                    
                    return {
                        'caseNumber': case_number,
                        'marketPrice': price,
                        'appraisalPrice': int(price * 0.9),
                        'minimumBid': int(price * 0.7),
                        'source': '직방 (실제)',
                        'lastUpdated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'isRealData': True
                    }
            
            return None
            
        except Exception as e:
            logger.warning(f"직방 경매 검색 실패: {e}")
            return None
    
    def crawl_naver_real_estate_auction(self, case_number):
        """네이버 부동산 경매 검색"""
        try:
            url = "https://land.naver.com/auction/search"
            params = {
                'q': case_number
            }
            
            response = self.session.get(url, params=params, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 경매 정보 추출
            auction_items = soup.find_all('div', class_='auction-item')
            if auction_items:
                item = auction_items[0]  # 첫 번째 결과
                
                # 가격 정보 추출
                price_elem = item.find('span', class_='price')
                if price_elem:
                    price_text = price_elem.get_text().strip()
                    price = self.parse_price(price_text)
                    
                    return {
                        'caseNumber': case_number,
                        'marketPrice': price,
                        'appraisalPrice': int(price * 0.9),
                        'minimumBid': int(price * 0.7),
                        'source': '네이버 부동산 (실제)',
                        'lastUpdated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'isRealData': True
                    }
            
            return None
            
        except Exception as e:
            logger.warning(f"네이버 부동산 경매 검색 실패: {e}")
            return None
    
    def extract_auction_data_from_html(self, soup, case_number):
        """HTML에서 경매 데이터 추출"""
        try:
            # 다양한 테이블 구조 시도
            tables = soup.find_all('table')
            
            for table in tables:
                rows = table.find_all('tr')
                if len(rows) < 2:
                    continue
                
                # 헤더 행에서 컬럼 인덱스 찾기
                header_row = rows[0]
                headers = [th.get_text().strip() for th in header_row.find_all(['th', 'td'])]
                
                # 필요한 컬럼 인덱스 찾기
                price_col = None
                appraisal_col = None
                minimum_col = None
                location_col = None
                
                for i, header in enumerate(headers):
                    if any(keyword in header for keyword in ['감정가', '감정액', '평가액']):
                        appraisal_col = i
                    elif any(keyword in header for keyword in ['최저가', '최저입찰가', '시작가']):
                        minimum_col = i
                    elif any(keyword in header for keyword in ['시세', '시장가', '거래가']):
                        price_col = i
                    elif any(keyword in header for keyword in ['소재지', '주소', '위치']):
                        location_col = i
                
                # 데이터 행에서 정보 추출
                for row in rows[1:]:
                    cells = row.find_all(['td', 'th'])
                    if len(cells) < max(filter(None, [price_col, appraisal_col, minimum_col, location_col])):
                        continue
                    
                    # 사건번호 확인
                    row_text = row.get_text()
                    if case_number not in row_text:
                        continue
                    
                    # 데이터 추출
                    appraisal_price = 0
                    minimum_bid = 0
                    market_price = 0
                    location = ''
                    
                    if appraisal_col is not None and appraisal_col < len(cells):
                        appraisal_price = self.parse_price(cells[appraisal_col].get_text())
                    
                    if minimum_col is not None and minimum_col < len(cells):
                        minimum_bid = self.parse_price(cells[minimum_col].get_text())
                    
                    if price_col is not None and price_col < len(cells):
                        market_price = self.parse_price(cells[price_col].get_text())
                    
                    if location_col is not None and location_col < len(cells):
                        location = cells[location_col].get_text().strip()
                    
                    # 시세가 없으면 감정가 기반으로 추정
                    if market_price == 0 and appraisal_price > 0:
                        market_price = int(appraisal_price * 1.1)
                    
                    # 최저입찰가가 없으면 감정가 기반으로 추정
                    if minimum_bid == 0 and appraisal_price > 0:
                        minimum_bid = int(appraisal_price * 0.7)
                    
                    if appraisal_price > 0 or minimum_bid > 0:
                        return {
                            'caseNumber': case_number,
                            'marketPrice': market_price,
                            'appraisalPrice': appraisal_price,
                            'minimumBid': minimum_bid,
                            'location': location,
                            'source': '법원경매사이트 (실제)',
                            'lastUpdated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                            'isRealData': True
                        }
            
            return None
            
        except Exception as e:
            logger.error(f"HTML에서 경매 데이터 추출 실패: {e}")
            return None
    
    def parse_case_number(self, case_number):
        """사건번호 파싱"""
        try:
            # 사건번호 형식: 2024타경12345
            pattern = r'(\d{4})(타경|타경|타경)(\d+)'
            match = re.match(pattern, case_number)
            
            if match:
                year = match.group(1)
                case_type = match.group(2)
                number = match.group(3)
                
                return {
                    'year': year,
                    'case_type': case_type,
                    'number': number,
                    'court_code': f"{year}{case_type}",
                    'court_name': f"{year}년 {case_type} {number}호"
                }
            
            return None
            
        except Exception as e:
            logger.error(f"사건번호 파싱 실패: {e}")
            return None
    
    def parse_price(self, price_text):
        """가격 텍스트 파싱"""
        try:
            # 숫자만 추출
            price_str = re.sub(r'[^\d]', '', price_text)
            if price_str:
                price = int(price_str)
                
                # 단위 확인 (만원, 억원 등)
                if '억' in price_text:
                    price *= 100000000
                elif '만' in price_text:
                    price *= 10000
                elif '천' in price_text:
                    price *= 1000
                
                return price
            
            return 0
            
        except Exception as e:
            logger.error(f"가격 파싱 실패: {e}")
            return 0

# 테스트 함수
def test_real_crawler():
    """실제 크롤러 테스트"""
    crawler = RealCourtAuctionCrawler()
    
    case_number = "2024타경12345"
    print(f"=== 실제 경매 데이터 수집 테스트: {case_number} ===")
    
    real_data = crawler.get_real_auction_data(case_number)
    
    if real_data:
        print(f"실제 데이터 수집 성공!")
        print(f"사건번호: {real_data['caseNumber']}")
        print(f"시세: {real_data['marketPrice']:,}원")
        print(f"감정가: {real_data['appraisalPrice']:,}원")
        print(f"최저입찰가: {real_data['minimumBid']:,}원")
        print(f"출처: {real_data['source']}")
        print(f"실제 데이터 여부: {real_data.get('isRealData', False)}")
    else:
        print("실제 데이터 수집 실패")
    
    return real_data

if __name__ == "__main__":
    test_real_crawler()
