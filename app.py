#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Flask 백엔드 서버
경매 데이터 크롤링 API 제공
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
from auction_crawler import CourtAuctionCrawler
from richgo_crawler import RichgoCrawler
from advanced_crawler import AdvancedAuctionCrawler
from api_data_collector import APIDataCollector
from real_court_auction_crawler import RealCourtAuctionCrawler
from official_api_integration import OfficialAPIIntegration
from auction_statistics import AuctionStatisticsAnalyzer

app = Flask(__name__)
CORS(app)  # CORS 허용

# 크롤러 인스턴스
crawler = CourtAuctionCrawler()
richgo_crawler = RichgoCrawler()
advanced_crawler = AdvancedAuctionCrawler()
api_collector = APIDataCollector()
real_crawler = RealCourtAuctionCrawler()
official_api = OfficialAPIIntegration()
statistics_analyzer = AuctionStatisticsAnalyzer()

@app.route('/')
def serve_index():
    """메인 페이지 서빙"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """정적 파일 서빙"""
    return send_from_directory('.', filename)

@app.route('/api/auction-data', methods=['POST'])
def get_auction_data():
    """
    경매 데이터 가져오기 API
    """
    try:
        data = request.get_json()
        case_number = data.get('caseNumber')
        
        if not case_number:
            return jsonify({'error': '사건번호가 필요합니다.'}), 400
        
        # 경매 데이터 가져오기
        print(f"경매 데이터 요청: {case_number}")
        auction_data = crawler.get_auction_data(case_number)
        
        if auction_data:
            print(f"경매 데이터 반환: {auction_data['caseNumber']}")
            return jsonify({
                'success': True,
                'data': auction_data
            })
        else:
            print("경매 데이터를 찾을 수 없습니다.")
            return jsonify({
                'success': False,
                'error': '경매 데이터를 찾을 수 없습니다.'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/search-auctions', methods=['POST'])
def search_auctions():
    """
    경매 검색 API
    """
    try:
        data = request.get_json()
        filters = data.get('filters', {})
        
        # 경매 검색
        results = crawler.search_auctions(filters)
        
        return jsonify({
            'success': True,
            'data': results,
            'count': len(results)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/richgo-data', methods=['POST'])
def get_richgo_data():
    """
    리치고 부동산 데이터 가져오기 API
    """
    try:
        data = request.get_json()
        location = data.get('location')
        property_type = data.get('propertyType')
        
        print(f"리치고 데이터 요청: {location}, {property_type}")
        
        # 리치고 데이터 가져오기
        richgo_data = richgo_crawler.get_property_data(location, property_type)
        
        if richgo_data:
            print(f"리치고 데이터 반환: {richgo_data['location']}")
            return jsonify({
                'success': True,
                'data': richgo_data
            })
        else:
            print("리치고 데이터를 찾을 수 없습니다.")
            return jsonify({
                'success': False,
                'error': '리치고 데이터를 찾을 수 없습니다.'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/advanced-crawl', methods=['POST'])
def advanced_crawl():
    """
    고급 크롤링 API - 다중 소스에서 데이터 수집
    """
    try:
        data = request.get_json()
        case_number = data.get('caseNumber')
        location = data.get('location')
        property_type = data.get('propertyType')
        
        if not case_number:
            return jsonify({'error': '사건번호가 필요합니다.'}), 400
        
        print(f"고급 크롤링 요청: {case_number}, {location}, {property_type}")
        
        # 고급 크롤링 실행
        results = advanced_crawler.crawl_multiple_sources(case_number, location, property_type)
        
        if results and results['combined']['sources_count'] > 0:
            print(f"고급 크롤링 성공: {results['combined']['sources_count']}개 소스")
            return jsonify({
                'success': True,
                'data': results
            })
        else:
            print("고급 크롤링 실패")
            return jsonify({
                'success': False,
                'error': '데이터를 수집할 수 없습니다.'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/api-collect', methods=['POST'])
def api_collect():
    """
    API 기반 데이터 수집
    """
    try:
        data = request.get_json()
        case_number = data.get('caseNumber')
        location = data.get('location')
        property_type = data.get('propertyType')
        
        if not case_number:
            return jsonify({'error': '사건번호가 필요합니다.'}), 400
        
        print(f"API 수집 요청: {case_number}, {location}, {property_type}")
        
        # API 기반 데이터 수집
        results = api_collector.collect_multiple_api_data(case_number, location, property_type)
        
        if results and results['combined']['sources_count'] > 0:
            print(f"API 수집 성공: {results['combined']['sources_count']}개 소스")
            return jsonify({
                'success': True,
                'data': results
            })
        else:
            print("API 수집 실패")
            return jsonify({
                'success': False,
                'error': 'API에서 데이터를 수집할 수 없습니다.'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/real-auction-data', methods=['POST'])
def get_real_auction_data():
    """
    실제 경매 데이터 수집 API
    """
    try:
        data = request.get_json()
        case_number = data.get('caseNumber')
        
        if not case_number:
            return jsonify({'error': '사건번호가 필요합니다.'}), 400
        
        print(f"실제 경매 데이터 요청: {case_number}")
        
        # 1. 공식 API 시도
        real_data = official_api.get_official_auction_data(case_number)
        if real_data:
            print(f"공식 API에서 실제 데이터 수집 성공: {case_number}")
            return jsonify({
                'success': True,
                'data': real_data,
                'source': '공식 API'
            })
        
        # 2. 실제 크롤링 시도
        real_data = real_crawler.get_real_auction_data(case_number)
        if real_data:
            print(f"실제 크롤링으로 데이터 수집 성공: {case_number}")
            return jsonify({
                'success': True,
                'data': real_data,
                'source': '실제 크롤링'
            })
        
        # 3. 실패시 시뮬레이션 데이터 반환
        print(f"실제 데이터 수집 실패, 시뮬레이션 데이터 반환: {case_number}")
        simulation_data = crawler.get_auction_data(case_number)
        if simulation_data:
            simulation_data['isRealData'] = False
            simulation_data['dataQuality'] = '낮음 (시뮬레이션)'
            return jsonify({
                'success': True,
                'data': simulation_data,
                'source': '시뮬레이션',
                'warning': '실제 데이터를 찾을 수 없어 시뮬레이션 데이터를 제공합니다.'
            })
        
        return jsonify({
            'success': False,
            'error': '데이터를 수집할 수 없습니다.'
        }), 404
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/api-key-info', methods=['GET'])
def get_api_key_info():
    """
    API 키 발급 정보 API
    """
    try:
        api_info = official_api.get_api_key_info()
        return jsonify({
            'success': True,
            'data': api_info
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/regional-stats', methods=['GET'])
def get_regional_stats():
    """
    지역별 낙찰가율 통계 API
    """
    try:
        # 시뮬레이션 지역별 통계 데이터
        regional_stats = {
            '서울시 강남구': {
                'avgBidRate': 0.85,
                'volatility': 0.1,
                'sampleSize': 150,
                'lastUpdated': '2024-01-15'
            },
            '서울시 서초구': {
                'avgBidRate': 0.82,
                'volatility': 0.12,
                'sampleSize': 120,
                'lastUpdated': '2024-01-15'
            },
            '서울시 송파구': {
                'avgBidRate': 0.80,
                'volatility': 0.15,
                'sampleSize': 100,
                'lastUpdated': '2024-01-15'
            },
            '서울시 강동구': {
                'avgBidRate': 0.78,
                'volatility': 0.18,
                'sampleSize': 80,
                'lastUpdated': '2024-01-15'
            }
        }
        
        return jsonify({
            'success': True,
            'data': regional_stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/statistics/district', methods=['POST'])
def get_district_statistics():
    """지역별 구/군 통계 정보 조회"""
    try:
        data = request.get_json()
        region = data.get('region', '')
        district = data.get('district', '')
        
        if not region or not district:
            return jsonify({
                'success': False,
                'error': '지역과 구/군 정보가 필요합니다.'
            }), 400
        
        stats = statistics_analyzer.get_district_statistics(region, district)
        if stats:
            return jsonify({
                'success': True,
                'data': stats
            })
        else:
            return jsonify({
                'success': False,
                'error': f'{region} {district} 데이터를 찾을 수 없습니다.'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/statistics/region-summary', methods=['POST'])
def get_region_summary():
    """지역별 전체 요약 통계 조회"""
    try:
        data = request.get_json()
        region = data.get('region', '')
        
        if not region:
            return jsonify({
                'success': False,
                'error': '지역 정보가 필요합니다.'
            }), 400
        
        summary = statistics_analyzer.get_region_summary(region)
        if summary:
            return jsonify({
                'success': True,
                'data': summary
            })
        else:
            return jsonify({
                'success': False,
                'error': f'{region} 지역 데이터를 찾을 수 없습니다.'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/statistics/investment-recommendation', methods=['POST'])
def get_investment_recommendation():
    """지역/구별 투자 추천 정보 조회"""
    try:
        data = request.get_json()
        region = data.get('region', '')
        district = data.get('district', '')
        
        if not region or not district:
            return jsonify({
                'success': False,
                'error': '지역과 구/군 정보가 필요합니다.'
            }), 400
        
        recommendation = statistics_analyzer.get_investment_recommendation(region, district)
        return jsonify({
            'success': True,
            'data': recommendation
        })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/statistics/top-districts', methods=['POST'])
def get_top_districts():
    """지역별 상위 구/군 조회"""
    try:
        data = request.get_json()
        region = data.get('region', '')
        criteria = data.get('criteria', 'sale_rate')  # sale_rate 또는 sale_price_rate
        limit = data.get('limit', 5)
        
        if not region:
            return jsonify({
                'success': False,
                'error': '지역 정보가 필요합니다.'
            }), 400
        
        if criteria == 'sale_rate':
            top_districts = statistics_analyzer.find_best_districts_by_sale_rate(region, limit)
        elif criteria == 'sale_price_rate':
            top_districts = statistics_analyzer.find_best_districts_by_sale_price_rate(region, limit)
        else:
            return jsonify({
                'success': False,
                'error': 'criteria는 sale_rate 또는 sale_price_rate여야 합니다.'
            }), 400
        
        return jsonify({
            'success': True,
            'data': {
                'region': region,
                'criteria': criteria,
                'districts': [{'district': d[0], 'value': d[1]} for d in top_districts]
            }
        })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/statistics/all-regions', methods=['GET'])
def get_all_regions_summary():
    """모든 지역의 요약 통계 조회"""
    try:
        summary = statistics_analyzer.get_all_regions_summary()
        return jsonify({
            'success': True,
            'data': summary
        })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("경매 시뮬레이터 백엔드 서버 시작...")
    print("http://localhost:5001 에서 접속 가능합니다.")
    app.run(debug=True, host='0.0.0.0', port=5001)
