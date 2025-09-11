#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
경매 매각통계 데이터 분석 및 활용 모듈
지역별 매각률, 매각가율 데이터를 분석하여 시뮬레이터에 활용
"""

import pandas as pd
import os
import json
from typing import Dict, List, Tuple, Optional

class AuctionStatisticsAnalyzer:
    def __init__(self):
        self.statistics_data = {}
        self.load_all_statistics()
    
    def load_all_statistics(self):
        """모든 지역별 매각통계 데이터를 로드"""
        excel_files = [
            ('서울', '지역별 매각통계_서울_202408~202509.xls'),
            ('경기', '지역별 매각통계_경기_202408~202509.xls'),
            ('부산', '지역별 매각통계_부산_202408~202509.xls'),
            ('인천', '지역별 매각통계_인천_202408~202509.xls')
        ]
        
        for region, filename in excel_files:
            if os.path.exists(filename):
                try:
                    df = pd.read_excel(filename)
                    self.statistics_data[region] = self.process_region_data(df, region)
                    print(f"✅ {region} 지역 데이터 로드 완료: {len(df)}개 구/군")
                except Exception as e:
                    print(f"❌ {region} 지역 데이터 로드 실패: {e}")
            else:
                print(f"❌ 파일을 찾을 수 없습니다: {filename}")
    
    def process_region_data(self, df: pd.DataFrame, region: str) -> Dict:
        """지역별 데이터를 처리하여 구조화된 형태로 변환"""
        processed_data = {
            'region': region,
            'districts': {},
            'summary': {
                'total_auctions': 0,
                'total_sales': 0,
                'total_appraisal_value': 0,
                'total_sale_value': 0,
                'overall_sale_rate': 0.0,
                'overall_sale_price_rate': 0.0
            }
        }
        
        total_auctions = 0
        total_sales = 0
        total_appraisal = 0
        total_sale_value = 0
        
        for _, row in df.iterrows():
            district = row['시/군/구']
            # 숫자에서 쉼표 제거
            auctions = int(str(row['경매건수']).replace(',', ''))
            sales = int(str(row['매각건수']).replace(',', ''))
            
            # 감정가와 매각가에서 쉼표 제거하고 숫자로 변환
            appraisal_str = str(row['감정가(단위:원)']).replace(',', '')
            sale_str = str(row['매각가(단위:원)']).replace(',', '')
            
            try:
                appraisal_value = int(appraisal_str) if appraisal_str.isdigit() else 0
                sale_value = int(sale_str) if sale_str.isdigit() else 0
            except:
                appraisal_value = 0
                sale_value = 0
            
            # 매각율과 매각가율에서 % 제거하고 숫자로 변환
            sale_rate_str = str(row['매각율']).replace('%', '')
            sale_price_rate_str = str(row['매각가율']).replace('%', '')
            
            try:
                sale_rate = float(sale_rate_str) if sale_rate_str.replace('.', '').isdigit() else 0.0
                sale_price_rate = float(sale_price_rate_str) if sale_price_rate_str.replace('.', '').isdigit() else 0.0
            except:
                sale_rate = 0.0
                sale_price_rate = 0.0
            
            processed_data['districts'][district] = {
                'auctions': auctions,
                'sales': sales,
                'appraisal_value': appraisal_value,
                'sale_value': sale_value,
                'sale_rate': sale_rate,
                'sale_price_rate': sale_price_rate,
                'avg_appraisal_per_case': appraisal_value / auctions if auctions > 0 else 0,
                'avg_sale_per_case': sale_value / sales if sales > 0 else 0
            }
            
            total_auctions += auctions
            total_sales += sales
            total_appraisal += appraisal_value
            total_sale_value += sale_value
        
        # 전체 요약 통계 계산
        processed_data['summary'] = {
            'total_auctions': total_auctions,
            'total_sales': total_sales,
            'total_appraisal_value': total_appraisal,
            'total_sale_value': total_sale_value,
            'overall_sale_rate': (total_sales / total_auctions * 100) if total_auctions > 0 else 0.0,
            'overall_sale_price_rate': (total_sale_value / total_appraisal * 100) if total_appraisal > 0 else 0.0
        }
        
        return processed_data
    
    def get_district_statistics(self, region: str, district: str) -> Optional[Dict]:
        """특정 지역의 구/군 통계 정보 반환"""
        if region in self.statistics_data:
            # 정확한 매칭 시도
            if district in self.statistics_data[region]['districts']:
                return self.statistics_data[region]['districts'][district]
            
            # 경기도의 경우 세분화된 구/군 정보 처리
            if region == '경기' and '시' in district:
                # "수원시 영통구" -> "영통구"로 변환하여 검색
                district_parts = district.split(' ')
                if len(district_parts) >= 2:
                    simplified_district = district_parts[-1]  # 마지막 부분 (구/군)
                    if simplified_district in self.statistics_data[region]['districts']:
                        return self.statistics_data[region]['districts'][simplified_district]
            
            # 부분 매칭 시도 (구/군 이름만으로 검색)
            for stored_district, data in self.statistics_data[region]['districts'].items():
                if stored_district in district or district in stored_district:
                    return data
                    
        return None
    
    def get_region_summary(self, region: str) -> Optional[Dict]:
        """지역별 전체 요약 통계 반환"""
        if region in self.statistics_data:
            return self.statistics_data[region]['summary']
        return None
    
    def get_all_regions_summary(self) -> Dict:
        """모든 지역의 요약 통계 반환"""
        summary = {}
        for region, data in self.statistics_data.items():
            summary[region] = data['summary']
        return summary
    
    def find_best_districts_by_sale_rate(self, region: str, limit: int = 5) -> List[Tuple[str, float]]:
        """지역별 매각률이 높은 구/군 순위 반환"""
        if region not in self.statistics_data:
            return []
        
        districts = []
        for district, data in self.statistics_data[region]['districts'].items():
            districts.append((district, data['sale_rate']))
        
        # 매각률 기준으로 내림차순 정렬
        districts.sort(key=lambda x: x[1], reverse=True)
        return districts[:limit]
    
    def find_best_districts_by_sale_price_rate(self, region: str, limit: int = 5) -> List[Tuple[str, float]]:
        """지역별 매각가율이 높은 구/군 순위 반환"""
        if region not in self.statistics_data:
            return []
        
        districts = []
        for district, data in self.statistics_data[region]['districts'].items():
            districts.append((district, data['sale_price_rate']))
        
        # 매각가율 기준으로 내림차순 정렬
        districts.sort(key=lambda x: x[1], reverse=True)
        return districts[:limit]
    
    def get_market_condition_score(self, region: str, district: str) -> float:
        """지역/구별 시장 상황 점수 계산 (0-100)"""
        stats = self.get_district_statistics(region, district)
        if not stats:
            return 50.0  # 기본값
        
        # 매각률과 매각가율을 종합하여 시장 상황 점수 계산
        sale_rate_score = min(stats['sale_rate'] * 2, 100)  # 매각률 * 2 (최대 100)
        sale_price_score = stats['sale_price_rate']  # 매각가율 그대로 사용
        
        # 가중평균 (매각률 60%, 매각가율 40%)
        market_score = (sale_rate_score * 0.6) + (sale_price_score * 0.4)
        return round(market_score, 1)
    
    def get_competition_level(self, region: str, district: str) -> str:
        """지역/구별 경쟁 수준 분석"""
        stats = self.get_district_statistics(region, district)
        if not stats:
            return "보통"
        
        sale_rate = stats['sale_rate']
        
        if sale_rate >= 35:
            return "매우 높음"
        elif sale_rate >= 25:
            return "높음"
        elif sale_rate >= 15:
            return "보통"
        elif sale_rate >= 10:
            return "낮음"
        else:
            return "매우 낮음"
    
    def get_investment_recommendation(self, region: str, district: str) -> Dict:
        """지역/구별 투자 추천 정보"""
        stats = self.get_district_statistics(region, district)
        if not stats:
            return {
                'recommendation': '보통',
                'score': 50,
                'reason': '데이터 부족'
            }
        
        market_score = self.get_market_condition_score(region, district)
        competition = self.get_competition_level(region, district)
        
        if market_score >= 80:
            recommendation = "매우 추천"
            reason = f"매각률 {stats['sale_rate']:.1f}%, 매각가율 {stats['sale_price_rate']:.1f}%로 우수한 성과"
        elif market_score >= 65:
            recommendation = "추천"
            reason = f"매각률 {stats['sale_rate']:.1f}%, 매각가율 {stats['sale_price_rate']:.1f}%로 양호한 성과"
        elif market_score >= 50:
            recommendation = "보통"
            reason = f"매각률 {stats['sale_rate']:.1f}%, 매각가율 {stats['sale_price_rate']:.1f}%로 평균적 성과"
        elif market_score >= 35:
            recommendation = "신중"
            reason = f"매각률 {stats['sale_rate']:.1f}%, 매각가율 {stats['sale_price_rate']:.1f}%로 주의 필요"
        else:
            recommendation = "비추천"
            reason = f"매각률 {stats['sale_rate']:.1f}%, 매각가율 {stats['sale_price_rate']:.1f}%로 낮은 성과"
        
        return {
            'recommendation': recommendation,
            'score': market_score,
            'reason': reason,
            'competition_level': competition,
            'sale_rate': stats['sale_rate'],
            'sale_price_rate': stats['sale_price_rate']
        }
    
    def export_to_json(self, filename: str = 'auction_statistics.json'):
        """분석된 데이터를 JSON 파일로 내보내기"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.statistics_data, f, ensure_ascii=False, indent=2)
            print(f"✅ 통계 데이터를 {filename}으로 내보냈습니다.")
        except Exception as e:
            print(f"❌ JSON 내보내기 실패: {e}")
    
    def print_summary_report(self):
        """전체 요약 보고서 출력"""
        print("\n" + "="*60)
        print("📊 경매 매각통계 분석 보고서")
        print("="*60)
        
        for region, data in self.statistics_data.items():
            summary = data['summary']
            print(f"\n🏙️ {region} 지역")
            print(f"   총 경매건수: {summary['total_auctions']:,}건")
            print(f"   총 매각건수: {summary['total_sales']:,}건")
            print(f"   전체 매각률: {summary['overall_sale_rate']:.1f}%")
            print(f"   전체 매각가율: {summary['overall_sale_price_rate']:.1f}%")
            
            # 상위 구/군 표시
            top_sale_rate = self.find_best_districts_by_sale_rate(region, 3)
            print(f"   매각률 상위 구/군:")
            for i, (district, rate) in enumerate(top_sale_rate, 1):
                print(f"     {i}. {district}: {rate:.1f}%")
        
        print("\n" + "="*60)

def main():
    """메인 실행 함수"""
    analyzer = AuctionStatisticsAnalyzer()
    
    # 요약 보고서 출력
    analyzer.print_summary_report()
    
    # JSON 파일로 내보내기
    analyzer.export_to_json()
    
    # 특정 지역 테스트
    print("\n🔍 테스트: 서울 강남구 분석")
    recommendation = analyzer.get_investment_recommendation('서울', '강남구')
    print(f"투자 추천: {recommendation['recommendation']}")
    print(f"시장 점수: {recommendation['score']}")
    print(f"이유: {recommendation['reason']}")

if __name__ == "__main__":
    main()
