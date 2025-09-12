// 게임 상태
let gameState = {
    score: 0,
    clickPower: 1,
    totalClicks: 0,
    ratePerSecond: 0,
    totalBuildingsCount: 0,
    autoClickers: 0,
    prestigeLevel: 0,
    totalScore: 0,
    prestigePoints: 0,
    goldenCookiesClicked: 0,
    lastSaveTime: Date.now(),
    buildings: {},
    upgrades: {},
    achievements: {},
    // 클릭 랭킹 시스템
    clickRankingStart: 0,
    clicksInCurrentMinute: 0,
    maxClicksInMinute: 0,
    // 무한 성장 모드
    infiniteMode: false
};

// 건물 데이터 (원본)
const BUILDINGS_ORIGINAL = {
    cursor: { name: "마법 커서", icon: "👆", description: "클릭 파워를 영구적으로 +0.5 증가시킵니다", basePrice: 15, baseProduction: 0, isClickPowerBooster: true, clickPowerBonus: 0.5 },
    grandma: { name: "할머니", icon: "👵", description: "자동으로 쿠키를 구워줍니다", basePrice: 100, baseProduction: 2, isClickPowerBooster: false },
    farm: { name: "농장", icon: "🚜", description: "밀을 재배해 쿠키 재료를 공급합니다", basePrice: 1100, baseProduction: 8, isClickPowerBooster: false },
    mine: { name: "광산", icon: "⛏️", description: "설탕과 소금을 채굴합니다", basePrice: 12000, baseProduction: 47, isClickPowerBooster: false },
    factory: { name: "공장", icon: "🏭", description: "대량으로 쿠키를 생산합니다", basePrice: 130000, baseProduction: 260, isClickPowerBooster: false },
    bank: { name: "은행", icon: "🏦", description: "쿠키 투자로 이자 수익을 얻습니다", basePrice: 1400000, baseProduction: 1400, isClickPowerBooster: false }
};

// 현재 건물 데이터 (복사본)
let buildingsData = {};

// 업그레이드 가격 계산 (프레스티지 레벨에 따라 증가)
function calculateUpgradePrice(basePrice) {
    return Math.floor(basePrice * Math.pow(1.2, gameState.prestigeLevel));
}

// 업그레이드 데이터 (원본)
const UPGRADES_ORIGINAL = {
    clickPower1: {
        name: "강화된 손가락", icon: "💪", description: "클릭 파워가 2배가 됩니다",
        basePrice: 100, requirement: () => true, effect: () => gameState.clickPower *= 2
    },
    clickPower2: {
        name: "철 손가락", icon: "🤖", description: "클릭 파워가 3배가 됩니다",
        basePrice: 1000, requirement: () => gameState.upgrades.clickPower1, effect: () => gameState.clickPower *= 3
    },
    clickPower3: {
        name: "다이아몬드 손가락", icon: "💎", description: "클릭 파워가 5배가 됩니다",
        basePrice: 10000, requirement: () => gameState.upgrades.clickPower2, effect: () => gameState.clickPower *= 5
    },
    autoClicker1: {
        name: "자동 클리커", icon: "🤖", description: "자동으로 1초에 1번 클릭합니다",
        basePrice: 5000, requirement: () => gameState.totalClicks >= 100, effect: () => gameState.autoClickers++
    },
    autoClicker2: {
        name: "고급 자동 클리커", icon: "🔥", description: "자동 클리커를 1개 더 추가합니다",
        basePrice: 50000, requirement: () => gameState.upgrades.autoClicker1, effect: () => gameState.autoClickers++
    },
    autoClicker3: {
        name: "슈퍼 자동 클리커", icon: "⚡", description: "자동 클리커를 2개 더 추가합니다",
        basePrice: 200000, requirement: () => gameState.upgrades.autoClicker2, effect: () => gameState.autoClickers += 2
    },
    cursorUpgrade1: {
        name: "커서 효율성", icon: "⚡", description: "커서 생산량이 2배가 됩니다",
        basePrice: 500, requirement: () => buildingsData.cursor.owned >= 5, effect: () => buildingsData.cursor.multiplier = (buildingsData.cursor.multiplier || 1) * 2
    },
    cursorUpgrade2: {
        name: "커서 마스터리", icon: "🌟", description: "커서 생산량이 3배가 됩니다",
        basePrice: 5000, requirement: () => gameState.upgrades.cursorUpgrade1 && buildingsData.cursor.owned >= 15, effect: () => buildingsData.cursor.multiplier = (buildingsData.cursor.multiplier || 1) * 3
    },
    grandmaUpgrade1: {
        name: "할머니의 레시피", icon: "📜", description: "할머니 생산량이 2배가 됩니다",
        basePrice: 5000, requirement: () => buildingsData.grandma.owned >= 5, effect: () => buildingsData.grandma.multiplier = (buildingsData.grandma.multiplier || 1) * 2
    },
    grandmaUpgrade2: {
        name: "할머니의 비밀 레시피", icon: "🎂", description: "할머니 생산량이 4배가 됩니다",
        basePrice: 50000, requirement: () => gameState.upgrades.grandmaUpgrade1 && buildingsData.grandma.owned >= 15, effect: () => buildingsData.grandma.multiplier = (buildingsData.grandma.multiplier || 1) * 4
    },
    farmUpgrade1: {
        name: "비옥한 토양", icon: "🌱", description: "농장 생산량이 2배가 됩니다",
        basePrice: 50000, requirement: () => buildingsData.farm.owned >= 5, effect: () => buildingsData.farm.multiplier = (buildingsData.farm.multiplier || 1) * 2
    },
    farmUpgrade2: {
        name: "고급 농기구", icon: "🚜", description: "농장 생산량이 3배가 됩니다",
        basePrice: 500000, requirement: () => gameState.upgrades.farmUpgrade1 && buildingsData.farm.owned >= 15, effect: () => buildingsData.farm.multiplier = (buildingsData.farm.multiplier || 1) * 3
    },
    mineUpgrade1: {
        name: "고급 장비", icon: "💎", description: "광산 생산량이 2배가 됩니다",
        basePrice: 500000, requirement: () => buildingsData.mine.owned >= 5, effect: () => buildingsData.mine.multiplier = (buildingsData.mine.multiplier || 1) * 2
    },
    mineUpgrade2: {
        name: "자동 채굴 시스템", icon: "🏗️", description: "광산 생산량이 4배가 됩니다",
        basePrice: 5000000, requirement: () => gameState.upgrades.mineUpgrade1 && buildingsData.mine.owned >= 15, effect: () => buildingsData.mine.multiplier = (buildingsData.mine.multiplier || 1) * 4
    },
    factoryUpgrade1: {
        name: "고효율 생산라인", icon: "⚙️", description: "공장 생산량이 2배가 됩니다",
        basePrice: 5000000, requirement: () => buildingsData.factory.owned >= 5, effect: () => buildingsData.factory.multiplier = (buildingsData.factory.multiplier || 1) * 2
    },
    factoryUpgrade2: {
        name: "AI 공장 관리", icon: "🤖", description: "공장 생산량이 5배가 됩니다",
        basePrice: 50000000, requirement: () => gameState.upgrades.factoryUpgrade1 && buildingsData.factory.owned >= 15, effect: () => buildingsData.factory.multiplier = (buildingsData.factory.multiplier || 1) * 5
    },
    bankUpgrade1: {
        name: "고수익 투자", icon: "📈", description: "은행 생산량이 2배가 됩니다",
        basePrice: 50000000, requirement: () => buildingsData.bank.owned >= 5, effect: () => buildingsData.bank.multiplier = (buildingsData.bank.multiplier || 1) * 2
    },
    bankUpgrade2: {
        name: "글로벌 투자", icon: "🌍", description: "은행 생산량이 6배가 됩니다",
        basePrice: 500000000, requirement: () => gameState.upgrades.bankUpgrade1 && buildingsData.bank.owned >= 15, effect: () => buildingsData.bank.multiplier = (buildingsData.bank.multiplier || 1) * 6
    },
    
    // === 프레스티지 레벨 1 업그레이드 ===
    prestige1_click1: {
        name: "초보 클릭 배율", icon: "💪", description: "클릭 파워 +10 증가",
        basePrice: 500000, requirement: () => gameState.prestigeLevel >= 1, effect: () => gameState.clickPower += 10
    },
    prestige1_click2: {
        name: "클릭 효율성", icon: "⚡", description: "클릭 파워 25% 증가",
        basePrice: 1000000, requirement: () => gameState.prestigeLevel >= 1 && gameState.upgrades.prestige1_click1, effect: () => gameState.clickPower *= 1.25
    },
    prestige1_production1: {
        name: "생산성 증대", icon: "🏠", description: "모든 건물 생산량 +20%",
        basePrice: 750000, requirement: () => gameState.prestigeLevel >= 1, effect: () => {
            for (const key in buildingsData) {
                if (!buildingsData[key].isClickPowerBooster) {
                    buildingsData[key].multiplier = (buildingsData[key].multiplier || 1) * 1.2;
                }
            }
        }
    },
    prestige1_production2: {
        name: "자동화 시스템", icon: "🤖", description: "생산 건물 효율 30% 증가",
        basePrice: 1200000, requirement: () => gameState.prestigeLevel >= 1 && gameState.upgrades.prestige1_production1, effect: () => {
            for (const key in buildingsData) {
                if (!buildingsData[key].isClickPowerBooster) {
                    buildingsData[key].multiplier = (buildingsData[key].multiplier || 1) * 1.3;
                }
            }
        }
    },
    prestige1_golden1: {
        name: "골든 발견자", icon: "🔍", description: "골든쿠키 지속시간 +5초",
        basePrice: 800000, requirement: () => gameState.prestigeLevel >= 1, effect: () => gameState.goldenCookieDuration = (gameState.goldenCookieDuration || 12) + 5
    },
    prestige1_golden2: {
        name: "골든 매니아", icon: "⭐", description: "골든쿠키 보너스 +25%",
        basePrice: 1500000, requirement: () => gameState.prestigeLevel >= 1 && gameState.upgrades.prestige1_golden1, effect: () => gameState.goldenCookieBonus = (gameState.goldenCookieBonus || 1) + 0.25
    },
    prestige1_auto1: {
        name: "미니 자동 클리커", icon: "🔄", description: "자동 클리커 +1개",
        basePrice: 600000, requirement: () => gameState.prestigeLevel >= 1, effect: () => gameState.autoClickers++
    },
    prestige1_auto2: {
        name: "자동화 전문가", icon: "🧠", description: "자동 클리커 효율 +50%",
        basePrice: 1100000, requirement: () => gameState.prestigeLevel >= 1 && gameState.upgrades.prestige1_auto1, effect: () => gameState.autoClickerMultiplier = (gameState.autoClickerMultiplier || 1) * 1.5
    },
    prestige1_special1: {
        name: "프레스티지 아우라", icon: "🔮", description: "전체 게임 속도 5% 증가",
        basePrice: 2000000, requirement: () => gameState.prestigeLevel >= 1 && gameState.upgrades.prestige1_click2 && gameState.upgrades.prestige1_production2, effect: () => gameState.gameSpeedMultiplier = (gameState.gameSpeedMultiplier || 1) * 1.05
    },
    prestige1_special2: {
        name: "기적의 도약", icon: "🌟", description: "모든 업그레이드 비용 10% 할인",
        basePrice: 2500000, requirement: () => gameState.prestigeLevel >= 1 && gameState.upgrades.prestige1_special1, effect: () => gameState.upgradeDiscount = (gameState.upgradeDiscount || 1) * 0.9
    },
    
    // === 프레스티지 레벨 2 업그레이드 ===
    prestige2_click1: {
        name: "엘리트 클릭커", icon: "👑", description: "클릭 파워 × 2배",
        basePrice: 5000000, requirement: () => gameState.prestigeLevel >= 2, effect: () => gameState.clickPower *= 2
    },
    prestige2_click2: {
        name: "쿠키 마스터", icon: "🍪", description: "클릭 시 추가 보너스 +50",
        basePrice: 8000000, requirement: () => gameState.prestigeLevel >= 2 && gameState.upgrades.prestige2_click1, effect: () => gameState.clickBonus = (gameState.clickBonus || 0) + 50
    },
    prestige2_production1: {
        name: "대량 생산 시스템", icon: "🏢", description: "생산 건물 효율 × 1.5배",
        basePrice: 6000000, requirement: () => gameState.prestigeLevel >= 2, effect: () => {
            for (const key in buildingsData) {
                if (!buildingsData[key].isClickPowerBooster) {
                    buildingsData[key].multiplier = (buildingsData[key].multiplier || 1) * 1.5;
                }
            }
        }
    },
    prestige2_production2: {
        name: "현대식 공정", icon: "🏦", description: "생산 건물 수에 비례하여 보너스 추가",
        basePrice: 10000000, requirement: () => gameState.prestigeLevel >= 2 && gameState.upgrades.prestige2_production1, effect: () => gameState.buildingCountBonus = true
    },
    prestige2_golden1: {
        name: "골든 전문가", icon: "🧙", description: "골든쿠키 븈도 25% 증가",
        basePrice: 7000000, requirement: () => gameState.prestigeLevel >= 2, effect: () => gameState.goldenCookieFrequency = (gameState.goldenCookieFrequency || 1) * 1.25
    },
    prestige2_golden2: {
        name: "골든 보물 헌터", icon: "🏆", description: "골든쿠키 보너스 × 1.8배",
        basePrice: 12000000, requirement: () => gameState.prestigeLevel >= 2 && gameState.upgrades.prestige2_golden1, effect: () => gameState.goldenCookieBonus = (gameState.goldenCookieBonus || 1) * 1.8
    },
    prestige2_auto1: {
        name: "자동화 전수", icon: "⚙️", description: "자동 클리커 +3개",
        basePrice: 5500000, requirement: () => gameState.prestigeLevel >= 2, effect: () => gameState.autoClickers += 3
    },
    prestige2_auto2: {
        name: "터보 자동화", icon: "🚀", description: "자동 클리커 × 2배 효율",
        basePrice: 9500000, requirement: () => gameState.prestigeLevel >= 2 && gameState.upgrades.prestige2_auto1, effect: () => gameState.autoClickerMultiplier = (gameState.autoClickerMultiplier || 1) * 2
    },
    prestige2_special1: {
        name: "시공간 왜곡", icon: "🌀", description: "게임 속도 10% 추가 증가",
        basePrice: 15000000, requirement: () => gameState.prestigeLevel >= 2 && gameState.upgrades.prestige2_click2 && gameState.upgrades.prestige2_production2, effect: () => gameState.gameSpeedMultiplier = (gameState.gameSpeedMultiplier || 1) * 1.1
    },
    
    // === 프레스티지 레벨 3 업그레이드 ===
    prestige3_click1: {
        name: "전설의 클릭커", icon: "🔱", description: "클릭 파워 × 3배",
        basePrice: 25000000, requirement: () => gameState.prestigeLevel >= 3, effect: () => gameState.clickPower *= 3
    },
    prestige3_click2: {
        name: "마스터 쿠키 세이지", icon: "🧙‍♂️", description: "클릭당 추가 점수 +100",
        basePrice: 40000000, requirement: () => gameState.prestigeLevel >= 3 && gameState.upgrades.prestige3_click1, effect: () => gameState.clickBonus = (gameState.clickBonus || 0) + 100
    },
    prestige3_production1: {
        name: "초인공지능 공장", icon: "🤖", description: "생산 건물 효율 × 2.5배",
        basePrice: 30000000, requirement: () => gameState.prestigeLevel >= 3, effect: () => {
            for (const key in buildingsData) {
                if (!buildingsData[key].isClickPowerBooster) {
                    buildingsData[key].multiplier = (buildingsData[key].multiplier || 1) * 2.5;
                }
            }
        }
    },
    prestige3_production2: {
        name: "산업 혁명", icon: "🏭", description: "건물 10개마다 전체 생산량 +5%",
        basePrice: 50000000, requirement: () => gameState.prestigeLevel >= 3 && gameState.upgrades.prestige3_production1, effect: () => gameState.buildingTenBonus = 0.05
    },
    prestige3_golden1: {
        name: "골든 마그넷", icon: "🧲", description: "골든쿠키 2배 븈도 + 50% 보너스",
        basePrice: 35000000, requirement: () => gameState.prestigeLevel >= 3, effect: () => {
            gameState.goldenCookieMagnet = true;
            gameState.goldenCookieBonus = (gameState.goldenCookieBonus || 1) + 0.5;
        }
    },
    prestige3_golden2: {
        name: "골든 러시", icon: "⚡", description: "골든쿠키 연속 출현 가능",
        basePrice: 60000000, requirement: () => gameState.prestigeLevel >= 3 && gameState.upgrades.prestige3_golden1, effect: () => gameState.goldenCookieRush = true
    },
    prestige3_auto1: {
        name: "자동화 군단", icon: "🤖", description: "자동 클리커 +5개",
        basePrice: 28000000, requirement: () => gameState.prestigeLevel >= 3, effect: () => gameState.autoClickers += 5
    },
    prestige3_auto2: {
        name: "자동화 군주", icon: "👑", description: "자동 클리커 효율 × 3배",
        basePrice: 48000000, requirement: () => gameState.prestigeLevel >= 3 && gameState.upgrades.prestige3_auto1, effect: () => gameState.autoClickerMultiplier = (gameState.autoClickerMultiplier || 1) * 3
    },
    prestige3_special1: {
        name: "시공간 지배", icon: "🕰️", description: "게임 속도 20% 추가 증가",
        basePrice: 75000000, requirement: () => gameState.prestigeLevel >= 3 && gameState.upgrades.prestige3_click2 && gameState.upgrades.prestige3_production2, effect: () => gameState.gameSpeedMultiplier = (gameState.gameSpeedMultiplier || 1) * 1.2
    },
    
    // === 프레스티지 레벨 4 업그레이드 ===
    prestige4_click1: {
        name: "신의 클릭", icon: "✨", description: "클릭 파워 × 5배",
        basePrice: 100000000, requirement: () => gameState.prestigeLevel >= 4, effect: () => gameState.clickPower *= 5
    },
    prestige4_click2: {
        name: "마이다스의 손", icon: "🤲", description: "클릭당 추가 점수 +500",
        basePrice: 180000000, requirement: () => gameState.prestigeLevel >= 4 && gameState.upgrades.prestige4_click1, effect: () => gameState.clickBonus = (gameState.clickBonus || 0) + 500
    },
    prestige4_production1: {
        name: "지구 산업 전환", icon: "🌍", description: "생산 건물 효율 × 4배",
        basePrice: 120000000, requirement: () => gameState.prestigeLevel >= 4, effect: () => {
            for (const key in buildingsData) {
                if (!buildingsData[key].isClickPowerBooster) {
                    buildingsData[key].multiplier = (buildingsData[key].multiplier || 1) * 4;
                }
            }
        }
    },
    prestige4_production2: {
        name: "행성 간 무역", icon: "🚀", description: "건물 5개마다 전체 생산량 +10%",
        basePrice: 200000000, requirement: () => gameState.prestigeLevel >= 4 && gameState.upgrades.prestige4_production1, effect: () => gameState.buildingFiveBonus = 0.1
    },
    prestige4_golden1: {
        name: "골든 시대", icon: "🏅", description: "골든쿠키 빈도 × 3배, 보너스 × 2배",
        basePrice: 140000000, requirement: () => gameState.prestigeLevel >= 4, effect: () => {
            gameState.goldenCookieFrequency = (gameState.goldenCookieFrequency || 1) * 3;
            gameState.goldenCookieBonus = (gameState.goldenCookieBonus || 1) * 2;
        }
    },
    prestige4_golden2: {
        name: "골든 샤워", icon: "✨", description: "골든쿠키가 3개씩 동시에 나타남",
        basePrice: 250000000, requirement: () => gameState.prestigeLevel >= 4 && gameState.upgrades.prestige4_golden1, effect: () => gameState.goldenCookieTriple = true
    },
    prestige4_auto1: {
        name: "자동화 제국", icon: "🏰", description: "자동 클리커 +10개",
        basePrice: 110000000, requirement: () => gameState.prestigeLevel >= 4, effect: () => gameState.autoClickers += 10
    },
    prestige4_auto2: {
        name: "자동화 신", icon: "🔱", description: "자동 클리커 효율 × 5배",
        basePrice: 190000000, requirement: () => gameState.prestigeLevel >= 4 && gameState.upgrades.prestige4_auto1, effect: () => gameState.autoClickerMultiplier = (gameState.autoClickerMultiplier || 1) * 5
    },
    prestige4_special1: {
        name: "멀티 클릭", icon: "👆", description: "클릭 1번에 4번 효과",
        basePrice: 300000000, requirement: () => gameState.prestigeLevel >= 4 && gameState.upgrades.prestige4_click2 && gameState.upgrades.prestige4_production2, effect: () => gameState.multiClick = 4
    },
    
    // === 프레스티지 레벨 5+ (무한성장) 업그레이드 ===
    infinite1: {
        name: "무한의 힘", icon: "♾️", description: "모든 수익 × 2배",
        basePrice: 500000000, requirement: () => gameState.infiniteMode, effect: () => gameState.infiniteMultiplier = (gameState.infiniteMultiplier || 1) * 2
    },
    infinite2: {
        name: "우주의 지배자", icon: "🌌", description: "모든 수익 × 3배",
        basePrice: 2000000000, requirement: () => gameState.infiniteMode && gameState.upgrades.infinite1, effect: () => gameState.infiniteMultiplier = (gameState.infiniteMultiplier || 1) * 3
    },
    infinite3: {
        name: "차원 초월", icon: "🔮", description: "모든 수익 × 5배",
        basePrice: 10000000000, requirement: () => gameState.infiniteMode && gameState.upgrades.infinite2, effect: () => gameState.infiniteMultiplier = (gameState.infiniteMultiplier || 1) * 5
    },
    infinite4: {
        name: "신의 영역", icon: "✨", description: "모든 수익 × 10배",
        basePrice: 50000000000, requirement: () => gameState.infiniteMode && gameState.upgrades.infinite3, effect: () => gameState.infiniteMultiplier = (gameState.infiniteMultiplier || 1) * 10
    },
    infinite5: {
        name: "창조주", icon: "🔱", description: "모든 수익 × 25배",
        basePrice: 250000000000, requirement: () => gameState.infiniteMode && gameState.upgrades.infinite4, effect: () => gameState.infiniteMultiplier = (gameState.infiniteMultiplier || 1) * 25
    },
    infinite6: {
        name: "절대자", icon: "🎆", description: "모든 수익 × 100배",
        basePrice: 1000000000000, requirement: () => gameState.infiniteMode && gameState.upgrades.infinite5, effect: () => gameState.infiniteMultiplier = (gameState.infiniteMultiplier || 1) * 100
    },
    infinite7: {
        name: "전지전능", icon: "♾️", description: "모든 수익 × 500배",
        basePrice: 5000000000000, requirement: () => gameState.infiniteMode && gameState.upgrades.infinite6, effect: () => gameState.infiniteMultiplier = (gameState.infiniteMultiplier || 1) * 500
    },
    infinite8: {
        name: "무한진화", icon: "🌀", description: "모든 수익 × 1000배",
        basePrice: 25000000000000, requirement: () => gameState.infiniteMode && gameState.upgrades.infinite7, effect: () => gameState.infiniteMultiplier = (gameState.infiniteMultiplier || 1) * 1000
    },
    infinite9: {
        name: "우주 재창조", icon: "🌌", description: "모든 수익 × 2500배",
        basePrice: 100000000000000, requirement: () => gameState.infiniteMode && gameState.upgrades.infinite8, effect: () => gameState.infiniteMultiplier = (gameState.infiniteMultiplier || 1) * 2500
    },
    infinite10: {
        name: "완전체", icon: "✨", description: "모든 수익 × 10000배 - 최종 업그레이드",
        basePrice: 1000000000000000, requirement: () => gameState.infiniteMode && gameState.upgrades.infinite9, effect: () => gameState.infiniteMultiplier = (gameState.infiniteMultiplier || 1) * 10000
    }
};

// 현재 업그레이드 데이터 (복사본)
let upgradesData = {};

// 업적 데이터
const achievementsData = {
    firstClick: { name: "첫 클릭", icon: "🎯", description: "첫 번째 클릭을 하세요", requirement: () => gameState.totalClicks >= 1 },
    hundredClicks: { name: "클릭 마스터", icon: "🏆", description: "100번 클릭하세요", requirement: () => gameState.totalClicks >= 100 },
    thousandClicks: { name: "클릭 장인", icon: "⚡", description: "1000번 클릭하세요", requirement: () => gameState.totalClicks >= 1000 },
    firstBuilding: { name: "첫 구매", icon: "🏪", description: "첫 번째 건물을 구매하세요", requirement: () => gameState.totalBuildingsCount >= 1 },
    tenBuildings: { name: "건물 수집가", icon: "🏭", description: "건물을 총 10개 구매하세요", requirement: () => gameState.totalBuildingsCount >= 10 },
    thousandScore: { name: "천 점 달성", icon: "💎", description: "점수 1000을 달성하세요", requirement: () => gameState.score >= 1000 },
    millionScore: { name: "백만장자", icon: "💰", description: "점수 100만을 달성하세요", requirement: () => gameState.totalScore >= 1000000 },
    firstAutoClicker: { name: "자동화 시작", icon: "🤖", description: "첫 번째 자동 클리커를 구매하세요", requirement: () => gameState.autoClickers >= 1 },
    firstGoldenCookie: { name: "황금 발견", icon: "⭐", description: "첫 번째 골든 쿠키를 클릭하세요", requirement: () => gameState.goldenCookiesClicked >= 1 }
};

// DOM 요소들
const elements = {
    score: document.getElementById('score'),
    rate: document.getElementById('rate'),
    prestigeLevel: document.getElementById('prestige-level'),
    totalClicks: document.getElementById('total-clicks'),
    totalBuildings: document.getElementById('total-buildings'),
    maxClicksMinute: document.getElementById('max-clicks-minute'),
    mainClicker: document.getElementById('main-clicker'),
    buildingsList: document.getElementById('buildings-list'),
    upgradesList: document.getElementById('upgrades-list'),
    achievementsList: document.getElementById('achievements-list'),
    clickEffects: document.getElementById('click-effects'),
    goldenCookie: document.getElementById('golden-cookie'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notification-text')
};

// 유틸리티 함수들
function formatNumber(num) {
    // 무한성장 모드를 위한 확장된 단위 시스템
    if (num >= 1e66) return (num / 1e66).toFixed(2) + 'Uv'; // Unvigintillion
    if (num >= 1e63) return (num / 1e63).toFixed(2) + 'Vg'; // Vigintillion
    if (num >= 1e60) return (num / 1e60).toFixed(2) + 'Nv'; // Novemdecillion
    if (num >= 1e57) return (num / 1e57).toFixed(2) + 'Oc'; // Octodecillion
    if (num >= 1e54) return (num / 1e54).toFixed(2) + 'Sp'; // Septendecillion
    if (num >= 1e51) return (num / 1e51).toFixed(2) + 'Sd'; // Sexdecillion
    if (num >= 1e48) return (num / 1e48).toFixed(2) + 'Qd'; // Quindecillion
    if (num >= 1e45) return (num / 1e45).toFixed(2) + 'Qy'; // Quattuordecillion
    if (num >= 1e42) return (num / 1e42).toFixed(2) + 'Td'; // Tredecillion
    if (num >= 1e39) return (num / 1e39).toFixed(2) + 'Dd'; // Duodecillion
    if (num >= 1e36) return (num / 1e36).toFixed(2) + 'Ud'; // Undecillion
    if (num >= 1e33) return (num / 1e33).toFixed(2) + 'Dc'; // Decillion
    if (num >= 1e30) return (num / 1e30).toFixed(2) + 'No'; // Nonillion
    if (num >= 1e27) return (num / 1e27).toFixed(2) + 'Ot'; // Octillion
    if (num >= 1e24) return (num / 1e24).toFixed(2) + 'St'; // Septillion
    if (num >= 1e21) return (num / 1e21).toFixed(2) + 'Sx'; // Sextillion
    if (num >= 1e18) return (num / 1e18).toFixed(2) + 'Qt'; // Quintillion
    if (num >= 1e15) return (num / 1e15).toFixed(2) + 'Qa'; // Quadrillion
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';  // Trillion
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';    // Billion
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';    // Million
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';    // Thousand
    return Math.floor(num).toString();
}

function calculateBuildingPrice(building) {
    return Math.floor(building.basePrice * Math.pow(1.15, building.owned));
}

function calculateTotalProduction(debug = false) {
    let total = 0;
    
    if (debug) console.log('=== 생산량 계산 ===');
    
    for (const key in buildingsData) {
        const building = buildingsData[key];
        const multiplier = building.multiplier || 1;
        const prestigeBonus = 1 + (gameState.prestigeLevel * 0.1);
        
        if (building.isClickPowerBooster) {
            // 클릭 파워 부스터 (커서): 생산량 없음, 클릭 파워만 증가
            if (debug && building.owned > 0) {
                const totalClickPowerBonus = building.clickPowerBonus * building.owned * multiplier * prestigeBonus;
                console.log(`${building.name}: ${building.owned}개 × ${building.clickPowerBonus} = +${totalClickPowerBonus} 클릭파워 (생산량 없음)`);
            }
        } else {
            // 일반 생산 건물: 고정 생산량
            const buildingProduction = building.baseProduction * building.owned * multiplier * prestigeBonus;
            total += buildingProduction;
            
            if (debug && building.owned > 0) {
                console.log(`${building.name}: ${building.owned}개 × ${building.baseProduction} × ${multiplier} × ${prestigeBonus} = ${buildingProduction}/초`);
            }
        }
    }
    
    // 업그레이드로 얻은 자동 클리커들
    if (gameState.autoClickers > 0) {
        const autoClickerMultiplier = (gameState.autoClickerMultiplier || 1);
        const upgradeAutoClickProduction = (gameState.clickPower + (gameState.clickBonus || 0)) * gameState.autoClickers * autoClickerMultiplier;
        total += upgradeAutoClickProduction;
        
        if (debug) {
            console.log(`업그레이드 자동 클리커: ${gameState.autoClickers}개 × ${gameState.clickPower + (gameState.clickBonus || 0)} × ${autoClickerMultiplier} = ${upgradeAutoClickProduction}/초`);
        }
    }
    
    if (debug) console.log(`총 생산량: ${total}/초`);
    return total;
}

// 클릭 파워 계산 함수 (새로 추가)
function calculateClickPower() {
    let clickPower = 1; // 기본 클릭 파워
    
    // 프레스티지 보너스
    clickPower += gameState.prestigeLevel * 0.1;
    
    // 건물에서 오는 클릭 파워 보너스 (커서)
    for (const key in buildingsData) {
        const building = buildingsData[key];
        if (building.isClickPowerBooster && building.owned > 0) {
            const multiplier = building.multiplier || 1;
            const prestigeBonus = 1 + (gameState.prestigeLevel * 0.1);
            clickPower += building.clickPowerBonus * building.owned * multiplier * prestigeBonus;
        }
    }
    
    return clickPower;
}

// 데이터 초기화
function initializeData() {
    // 건물 데이터 복사
    buildingsData = {};
    for (const key in BUILDINGS_ORIGINAL) {
        buildingsData[key] = {
            ...BUILDINGS_ORIGINAL[key],
            owned: 0,
            multiplier: 1
        };
    }
    
    // 업그레이드 데이터 복사 (가격 계산 포함)
    upgradesData = {};
    for (const key in UPGRADES_ORIGINAL) {
        upgradesData[key] = {
            ...UPGRADES_ORIGINAL[key],
            price: calculateUpgradePrice(UPGRADES_ORIGINAL[key].basePrice),
            purchased: false
        };
    }
    
    // 업적 초기화
    for (const key in achievementsData) {
        achievementsData[key].unlocked = false;
    }
}

// 게임 초기화
function initGame() {
    initializeData();
    loadGame();
    
    renderBuildings();
    renderUpgrades();
    renderAchievements();
    updateDisplay();
    
    setupEventListeners();
    startGameLoop();
    scheduleGoldenCookie();
    
    console.log('게임이 초기화되었습니다!');
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 메인 클리커
    elements.mainClicker.addEventListener('click', handleMainClick);
    
    // 탭 전환
    document.querySelectorAll('.shop-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // 헤더 버튼들
    document.getElementById('prestige-btn').addEventListener('click', showPrestigeModal);
    document.getElementById('save-btn').addEventListener('click', () => {
        saveGame();
        showNotification('게임이 저장되었습니다!');
    });
    document.getElementById('load-btn').addEventListener('click', () => {
        loadGame();
        showNotification('게임을 불러왔습니다!');
    });
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    
    // 골든 쿠키
    elements.goldenCookie.addEventListener('click', handleGoldenCookie);
    
    // 건물 구매 이벤트 위임
    elements.buildingsList.addEventListener('click', (e) => {
        const buildingItem = e.target.closest('.building-item');
        if (buildingItem && buildingItem.classList.contains('affordable')) {
            const key = buildingItem.getAttribute('data-building-key');
            if (key) {
                buyBuilding(key);
            }
        }
    });
    
    // 업그레이드 구매 이벤트 위임
    elements.upgradesList.addEventListener('click', (e) => {
        const upgradeItem = e.target.closest('.upgrade-item');
        if (upgradeItem && upgradeItem.classList.contains('affordable')) {
            const key = upgradeItem.getAttribute('data-upgrade-key');
            if (key) {
                buyUpgrade(key);
            }
        }
    });
    
    // 모달 닫기
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') closeModal();
    });
}

// 메인 클릭 처리
function handleMainClick(e) {
    const clickMultiplier = gameState.infiniteMode ? (gameState.infiniteMultiplier || 1) : 1;
    const baseClickPower = gameState.clickPower * clickMultiplier;
    const totalClicks = gameState.multiClick || 1;
    
    // 멀티 클릭 시스템
    for (let i = 0; i < totalClicks; i++) {
        gameState.score += baseClickPower;
        gameState.totalClicks++;
        
        // 시각 효과
        if (i === 0) {
            const rect = elements.mainClicker.getBoundingClientRect();
            const x = e.clientX - rect.left - 25;
            const y = e.clientY - rect.top - 25;
            const displayValue = baseClickPower * totalClicks;
            showClickEffect(x, y, displayValue);
        }
    }
    
    gameState.totalScore = Math.max(gameState.totalScore, gameState.score);
    
    // 클릭 랭킹 시스템 업데이트 (멀티클릭 횟수만큼 카운트)
    for (let i = 0; i < totalClicks; i++) {
        updateClickRanking();
    }
    
    // 클리커 애니메이션
    elements.mainClicker.style.transform = 'scale(0.95)';
    setTimeout(() => {
        elements.mainClicker.style.transform = 'scale(1)';
    }, 100);
    
    updateDisplay();
    checkAchievements();
}

// 클릭 효과 표시
function showClickEffect(x, y, value) {
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = '+' + formatNumber(value);
    effect.style.left = x + 'px';
    effect.style.top = y + 'px';
    
    elements.clickEffects.appendChild(effect);
    
    setTimeout(() => {
        if (effect.parentNode) {
            effect.parentNode.removeChild(effect);
        }
    }, 1000);
}

// 건물 렌더링
function renderBuildings() {
    if (!elements.buildingsList) return;
    
    elements.buildingsList.innerHTML = '';
    
    for (const key in buildingsData) {
        const building = buildingsData[key];
        const price = calculateBuildingPrice(building);
        const canAfford = gameState.score >= price;
        const multiplier = building.multiplier || 1;
        const prestigeBonus = 1 + (gameState.prestigeLevel * 0.1);
        const totalProduction = building.baseProduction * multiplier * prestigeBonus;
        
        let productionText;
        if (building.isClickPowerBooster) {
            // 클릭 파워 부스터 (커서)
            const clickPowerBonus = building.clickPowerBonus * multiplier * prestigeBonus;
            productionText = `클릭 파워: +${formatNumber(clickPowerBonus)} (현재 총 클릭파워: ${formatNumber(gameState.clickPower)})`;
        } else {
            // 일반 생산 건물
            productionText = `생산량: ${formatNumber(totalProduction)}/초`;
        }

        const buildingElement = document.createElement('div');
        buildingElement.className = `building-item ${canAfford ? 'affordable' : 'expensive'}`;
        buildingElement.setAttribute('data-building-key', key);
        buildingElement.innerHTML = `
            <div class="item-icon">${building.icon}</div>
            <div class="item-info">
                <div class="item-name">${building.name}</div>
                <div class="item-description">${building.description}</div>
                <div class="item-stats">${productionText}</div>
            </div>
            <div class="item-price">
                ${formatNumber(price)}
                ${building.owned > 0 ? `<span class="item-count">${building.owned}</span>` : ''}
            </div>
        `;
        
        elements.buildingsList.appendChild(buildingElement);
    }
}

// 건물 구매
function buyBuilding(key) {
    const building = buildingsData[key];
    const price = calculateBuildingPrice(building);
    
    if (gameState.score >= price) {
        gameState.score -= price;
        building.owned++;
        gameState.totalBuildingsCount++;
        
        console.log(`${building.name} 구매: ${building.owned}개, 개별 생산량: ${building.baseProduction}/초`);
        
        // 생산량 즉시 재계산 (디버그 모드)
        gameState.ratePerSecond = calculateTotalProduction(true);
        
        // UI 즉시 업데이트
        updateDisplay();
        updateBuildingAffordability();
        renderUpgrades(); // 업그레이드 조건 변경될 수 있음
        checkAchievements();
        
        let bonusText;
        if (building.isClickPowerBooster) {
            const clickPowerBonus = building.clickPowerBonus * (building.multiplier || 1);
            bonusText = `클릭 파워 +${clickPowerBonus} (총: ${gameState.clickPower})`;
        } else {
            bonusText = `생산량 +${building.baseProduction * (building.multiplier || 1)}/초`;
        }
        showNotification(`${building.name} 구매 완료! (${bonusText})`);
    }
}

// 업그레이드 렌더링
function renderUpgrades() {
    if (!elements.upgradesList) return;
    
    elements.upgradesList.innerHTML = '';
    
    for (const key in upgradesData) {
        const upgrade = upgradesData[key];
        
        if (upgrade.purchased) continue;
        if (!upgrade.requirement()) continue;
        
        const canAfford = gameState.score >= upgrade.price;
        
        const upgradeElement = document.createElement('div');
        upgradeElement.className = `upgrade-item ${canAfford ? 'affordable' : 'expensive'}`;
        upgradeElement.setAttribute('data-upgrade-key', key);
        upgradeElement.innerHTML = `
            <div class="item-icon">${upgrade.icon}</div>
            <div class="item-info">
                <div class="item-name">${upgrade.name}</div>
                <div class="item-description">${upgrade.description}</div>
            </div>
            <div class="item-price">${formatNumber(upgrade.price)}</div>
        `;
        
        elements.upgradesList.appendChild(upgradeElement);
    }
}

// 업그레이드 구매
function buyUpgrade(key) {
    const upgrade = upgradesData[key];
    
    if (gameState.score >= upgrade.price && !upgrade.purchased) {
        gameState.score -= upgrade.price;
        upgrade.purchased = true;
        gameState.upgrades[key] = true;
        
        // 효과 적용
        upgrade.effect();
        
        // 생산량 재계산 (건물 업그레이드인 경우)
        gameState.ratePerSecond = calculateTotalProduction();
        
        // UI 업데이트
        renderUpgrades();
        renderBuildings(); // 생산량 표시 업데이트
        updateDisplay();
        
        showNotification(`${upgrade.name} 업그레이드 완료!`);
    }
}

// 업적 렌더링
function renderAchievements() {
    if (!elements.achievementsList) return;
    
    elements.achievementsList.innerHTML = '';
    
    for (const key in achievementsData) {
        const achievement = achievementsData[key];
        
        const achievementElement = document.createElement('div');
        achievementElement.className = `achievement-item ${achievement.unlocked ? 'unlocked' : ''}`;
        achievementElement.innerHTML = `
            <div class="item-icon">${achievement.icon}</div>
            <div class="item-info">
                <div class="item-name">${achievement.name}</div>
                <div class="item-description">${achievement.description}</div>
            </div>
        `;
        
        elements.achievementsList.appendChild(achievementElement);
    }
}

// 업적 확인
function checkAchievements() {
    for (const key in achievementsData) {
        const achievement = achievementsData[key];
        
        if (!achievement.unlocked && achievement.requirement()) {
            achievement.unlocked = true;
            gameState.achievements[key] = true;
            showNotification(`업적 달성: ${achievement.name}!`);
            renderAchievements();
        }
    }
}

// 탭 전환
function switchTab(tabName) {
    document.querySelectorAll('.shop-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.shop-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);
    
    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.classList.remove('hidden');
}

// 골든 쿠키 처리
function handleGoldenCookie() {
    // 초기에는 더 큰 보너스, 나중에는 비례적 보너스
    let bonus;
    if (gameState.score < 1000) {
        bonus = Math.max(gameState.score * 0.5 + 50, 100); // 초기에 최소 100점
    } else {
        bonus = Math.max(gameState.ratePerSecond * 60, gameState.score * 0.15);
    }
    
    // 골든 마그넷 업그레이드가 있으면 보너스 50% 증가
    if (gameState.goldenCookieMagnet) {
        bonus *= 1.5;
    }
    
    // 무한성장 모드에서 더블 보너스
    if (gameState.infiniteMode) {
        bonus *= (gameState.infiniteMultiplier || 1);
    }
    
    gameState.score += bonus;
    gameState.goldenCookiesClicked++;
    gameState.totalScore = Math.max(gameState.totalScore, gameState.score);
    
    elements.goldenCookie.classList.add('hidden');
    showNotification(`골든 쿠키! +${formatNumber(bonus)} 점수!`);
    
    updateDisplay();
    checkAchievements();
    scheduleGoldenCookie();
}

// 골든 쿠키 스케줄링
function scheduleGoldenCookie() {
    // 골든 마그넷 업그레이드가 있으면 2배 자주 나타남
    const baseDelay = gameState.goldenCookieMagnet ? 60000 : 120000; // 1-2분 vs 2-4분
    const delay = Math.random() * baseDelay + (baseDelay / 4);
    
    setTimeout(() => {
        if (gameState.ratePerSecond > 0 || gameState.score > 50) {
            const clickArea = document.querySelector('.click-area');
            if (clickArea) {
                const maxX = Math.max(clickArea.clientWidth - 80, 100);
                const maxY = Math.max(clickArea.clientHeight - 80, 100);
                const x = Math.random() * maxX + 40;
                const y = Math.random() * maxY + 40;
                
                elements.goldenCookie.style.left = x + 'px';
                elements.goldenCookie.style.top = y + 'px';
                elements.goldenCookie.classList.remove('hidden');
                
                // 12초 후 자동 사라짐
                setTimeout(() => {
                    if (!elements.goldenCookie.classList.contains('hidden')) {
                        elements.goldenCookie.classList.add('hidden');
                    }
                    scheduleGoldenCookie();
                }, 12000);
            } else {
                scheduleGoldenCookie();
            }
        } else {
            scheduleGoldenCookie();
        }
    }, delay);
}

// 프레스티지 관련 함수들
function calculatePrestigePoints() {
    // 무한 성장 모드에서는 프레스티지 불가
    if (gameState.infiniteMode || gameState.prestigeLevel >= 5) return 0;
    
    // 현재 score (totalScore 아님)로 계산
    if (gameState.score < 1000000) return 0;
    
    // 현재 프레스티지 레벨에 따라 요구사항이 기하급수적으로 증가
    const baseRequirement = 1000000;
    const currentLevel = gameState.prestigeLevel;
    
    // 각 프레스티지 레벨마다 요구사항이 10배씩 증가
    const requiredScoreForNextLevel = baseRequirement * Math.pow(10, currentLevel);
    
    if (gameState.score < requiredScoreForNextLevel) return 0;
    
    // 다음 레벨에 도달했으면 1포인트 지급
    return 1;
}

function showPrestigeModal() {
    // 무한성장 모드 체크
    if (gameState.infiniteMode) {
        showNotification('🎆 이미 무한성장 모드입니다! 더 이상 프레스티지할 수 없습니다.');
        return;
    }
    
    const prestigePoints = calculatePrestigePoints();
    const baseRequirement = 1000000;
    const requiredScoreForNextLevel = baseRequirement * Math.pow(10, gameState.prestigeLevel);
    
    if (prestigePoints < 1) {
        const shortfall = requiredScoreForNextLevel - gameState.score;
        showNotification(`프레스티지 포인트가 부족합니다! ${formatNumber(shortfall)} 점수 더 필요`);
        return;
    }
    
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    const isMaxPrestige = gameState.prestigeLevel >= 4;
    
    modalTitle.textContent = isMaxPrestige ? '무한성장 모드 진입' : '프레스티지';
    modalBody.innerHTML = `
        <div style="text-align: center;">
            ${isMaxPrestige ? 
                '<h4>🌌 무한성장 모드 진입 🌌</h4>' : 
                '<h4>🌟 프레스티지 시스템 🌟</h4>'
            }
            <p>현재 프레스티지 레벨: ${gameState.prestigeLevel}</p>
            <p>필요한 점수: ${formatNumber(requiredScoreForNextLevel)}</p>
            <p>현재 점수: ${formatNumber(gameState.score)}</p>
            <p>획득 가능한 프레스티지 포인트: <strong>${prestigePoints}</strong></p>
            <p>현재 프레스티지 보너스: <strong>+${gameState.prestigeLevel * 10}%</strong></p>
            ${!isMaxPrestige ? 
                `<p>다음 레벨 요구 점수: <strong>${formatNumber(baseRequirement * Math.pow(10, gameState.prestigeLevel + 1))}</strong></p>` : 
                '<p><strong>🎆 프레스티지 5 달성 시 무한성장 모드로 진입합니다!</strong></p>'
            }
            <br>
            ${isMaxPrestige ? 
                '<p>🚀 무한성장 모드에서는 프레스티지를 할 수 없지만, 점수가 끝없이 증가합니다!</p>' : 
                '<p>⚠️ 프레스티지를 하면 점수와 건물이 초기화됩니다!</p><p>하지만 영구적인 생산량 보너스를 얻습니다.</p>'
            }
            <br>
            <button id="confirm-prestige" class="header-btn" style="padding: 1rem 2rem; font-size: 1.1rem; background: ${isMaxPrestige ? 'linear-gradient(45deg, #ff6b6b, #ffd93d)' : 'gold'}; color: ${isMaxPrestige ? 'white' : 'black'};">
                ${isMaxPrestige ? '무한성장 모드 진입' : '프레스티지 실행'}
            </button>
        </div>
    `;
    
    document.getElementById('modal-overlay').classList.remove('hidden');
    
    // 이벤트 리스너 추가 (기존 것 제거 후)
    setTimeout(() => {
        const confirmBtn = document.getElementById('confirm-prestige');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                performPrestige();
                closeModal();
            });
        }
    }, 100);
}

function performPrestige() {
    const prestigePoints = calculatePrestigePoints();
    
    if (prestigePoints < 1) {
        showNotification('프레스티지 포인트가 부족합니다!');
        return;
    }
    
    // 무한 성장 모드 체크 (프레스티지 레벨 5 이후)
    if (gameState.prestigeLevel >= 5) {
        gameState.infiniteMode = true;
        showNotification('🌟 무한 성장 모드 진입! 더 이상 프레스티지할 수 없습니다!');
        return;
    }
    
    // 프레스티지 데이터 보존 (버그 수정: totalScore를 현재 score로 업데이트)
    const newPrestigeLevel = gameState.prestigeLevel + prestigePoints;
    const preservedData = {
        prestigeLevel: newPrestigeLevel,
        prestigePoints: gameState.prestigePoints + prestigePoints,
        totalScore: gameState.score, // 🐛 버그 수정: 현재 score로 새 totalScore 설정
        goldenCookiesClicked: gameState.goldenCookiesClicked,
        achievements: {...gameState.achievements},
        maxClicksInMinute: gameState.maxClicksInMinute,
        infiniteMode: gameState.infiniteMode
    };
    
    // 게임 상태 초기화
    gameState = {
        score: 0,
        clickPower: 1 + (newPrestigeLevel * 0.1),
        totalClicks: 0,
        ratePerSecond: 0,
        totalBuildingsCount: 0,
        autoClickers: 0,
        lastSaveTime: Date.now(),
        buildings: {},
        upgrades: {},
        clickRankingStart: 0,
        clicksInCurrentMinute: 0,
        multiClick: 1,
        goldenCookieMagnet: false,
        infiniteMultiplier: 1,
        clickBonus: 0,
        autoClickerMultiplier: 1,
        gameSpeedMultiplier: 1,
        upgradeDiscount: 1,
        goldenCookieFrequency: 1,
        goldenCookieBonus: 1,
        goldenCookieDuration: 12,
        goldenCookieRush: false,
        goldenCookieTriple: false,
        buildingCountBonus: false,
        buildingTenBonus: 0,
        buildingFiveBonus: 0,
        ...preservedData
    };
    
    // 데이터 초기화
    initializeData();
    
    // UI 갱신
    renderBuildings();
    renderUpgrades();
    renderAchievements();
    updateDisplay();
    
    const nextLevelRequirement = 1000000 * Math.pow(10, gameState.prestigeLevel);
    showNotification(`프레스티지 완료! 레벨 ${gameState.prestigeLevel}! 다음 레벨 요구: ${formatNumber(nextLevelRequirement)}`);
}

// 알림 표시
function showNotification(message) {
    if (elements.notificationText && elements.notification) {
        elements.notificationText.textContent = message;
        elements.notification.classList.remove('hidden');
        
        setTimeout(() => {
            elements.notification.classList.add('hidden');
        }, 3000);
    }
}

// 클릭 랭킹 시스템 업데이트
function updateClickRanking() {
    const now = Date.now();
    
    // 새로운 1분 시작
    if (gameState.clickRankingStart === 0 || now - gameState.clickRankingStart >= 60000) {
        // 이전 기록 저장
        if (gameState.clicksInCurrentMinute > gameState.maxClicksInMinute) {
            gameState.maxClicksInMinute = gameState.clicksInCurrentMinute;
            if (gameState.clicksInCurrentMinute > 0) {
                showNotification(`🏆 새로운 1분 최고 기록: ${gameState.maxClicksInMinute}클릭!`);
            }
        }
        
        // 새로운 1분 시작
        gameState.clickRankingStart = now;
        gameState.clicksInCurrentMinute = 1;
    } else {
        // 현재 1분 내 클릭 수 증가
        gameState.clicksInCurrentMinute++;
        
        // 실시간 기록 갱신
        if (gameState.clicksInCurrentMinute > gameState.maxClicksInMinute) {
            gameState.maxClicksInMinute = gameState.clicksInCurrentMinute;
        }
    }
}

// 디스플레이 업데이트
function updateDisplay() {
    if (elements.score) elements.score.textContent = formatNumber(gameState.score);
    if (elements.rate) elements.rate.textContent = formatNumber(gameState.ratePerSecond);
    if (elements.prestigeLevel) elements.prestigeLevel.textContent = gameState.prestigeLevel;
    if (elements.totalClicks) elements.totalClicks.textContent = formatNumber(gameState.totalClicks);
    if (elements.totalBuildings) elements.totalBuildings.textContent = formatNumber(gameState.totalBuildingsCount);
    if (elements.maxClicksMinute) elements.maxClicksMinute.textContent = formatNumber(gameState.maxClicksInMinute);
    
    // 프레스티지 버튼 상태
    const prestigeBtn = document.getElementById('prestige-btn');
    if (prestigeBtn) {
        const canPrestige = calculatePrestigePoints() >= 1;
        if (gameState.infiniteMode) {
            prestigeBtn.textContent = '무한성장';
            prestigeBtn.style.background = 'linear-gradient(45deg, #ff6b6b, #ffd93d)';
            prestigeBtn.style.color = 'white';
            prestigeBtn.style.cursor = 'default';
        } else {
            prestigeBtn.textContent = '프레스티지';
            prestigeBtn.style.background = canPrestige ? 'gold' : '';
            prestigeBtn.style.color = canPrestige ? 'black' : '';
            prestigeBtn.style.cursor = 'pointer';
        }
    }
}

// 게임 루프
let lastUIUpdate = 0;
let gameLoopInterval;

function startGameLoop() {
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
    }
    
    gameLoopInterval = setInterval(() => {
        // 클릭 파워를 매번 다시 계산 (커서 건물이 영향)
        gameState.clickPower = calculateClickPower();
        
        // 생산량을 매번 다시 계산 (건물이 바뀔 수 있으므로)
        gameState.ratePerSecond = calculateTotalProduction();
        
        // 자동 생산 (일반 건물들의 생산량) + 무한성장 보너스
        if (gameState.ratePerSecond > 0) {
            let productionMultiplier = gameState.infiniteMode ? (gameState.infiniteMultiplier || 1) : 1;
            productionMultiplier *= (gameState.gameSpeedMultiplier || 1);
            
            // 건물 수 보너스 적용
            if (gameState.buildingCountBonus) {
                const totalBuildings = gameState.totalBuildingsCount;
                productionMultiplier *= (1 + totalBuildings * 0.02); // 건물 하나당 2% 보너스
            }
            if (gameState.buildingTenBonus > 0) {
                const tenGroups = Math.floor(gameState.totalBuildingsCount / 10);
                productionMultiplier *= (1 + tenGroups * gameState.buildingTenBonus);
            }
            if (gameState.buildingFiveBonus > 0) {
                const fiveGroups = Math.floor(gameState.totalBuildingsCount / 5);
                productionMultiplier *= (1 + fiveGroups * gameState.buildingFiveBonus);
            }
            
            gameState.score += (gameState.ratePerSecond / 10) * productionMultiplier; // 100ms마다 1/10초 생산량
        }
        
        // 자동 클릭으로 인한 클릭 수 증가 (업그레이드로 얻은 자동 클리커만)
        if (gameState.autoClickers > 0) {
            gameState.totalClicks += gameState.autoClickers / 10; // 100ms마다 클릭 수 증가
        }
        
        // 총 점수 업데이트
        gameState.totalScore = Math.max(gameState.totalScore, gameState.score);
        
        updateDisplay();
        
        // UI를 더 자주 업데이트 (구매 가능성 등)
        const now = Date.now();
        if (now - lastUIUpdate > 200) { // 200ms마다 (더 자주)
            updateBuildingAffordability();
            updateUpgradeAffordability();
            lastUIUpdate = now;
        }
        
        // 자동 저장 (60초마다)
        if (now - gameState.lastSaveTime > 60000) {
            saveGame();
        }
    }, 100);
    
    console.log('게임 루프 시작됨');
}

// 건물 구매 가능성만 업데이트하는 효율적인 함수
function updateBuildingAffordability() {
    if (!elements.buildingsList) return;
    
    const buildingItems = elements.buildingsList.querySelectorAll('.building-item');
    let index = 0;
    
    for (const key in buildingsData) {
        const building = buildingsData[key];
        const price = calculateBuildingPrice(building);
        const canAfford = gameState.score >= price;
        
        if (buildingItems[index]) {
            const item = buildingItems[index];
            item.setAttribute('data-building-key', key); // 키 저장
            
            // 생산량 업데이트
            const statsElement = item.querySelector('.item-stats');
            if (statsElement) {
                const multiplier = building.multiplier || 1;
                const prestigeBonus = 1 + (gameState.prestigeLevel * 0.1);
                
                let productionText;
                if (building.isClickPowerBooster) {
                    // 클릭 파워 부스터 (커서)
                    const clickPowerBonus = building.clickPowerBonus * multiplier * prestigeBonus;
                    productionText = `클릭 파워: +${formatNumber(clickPowerBonus)} (현재 총 클릭파워: ${formatNumber(gameState.clickPower)})`;
                } else {
                    // 일반 생산 건물
                    const totalProduction = building.baseProduction * multiplier * prestigeBonus;
                    productionText = `생산량: ${formatNumber(totalProduction)}/초`;
                }
                
                statsElement.textContent = productionText;
            }
            
            // 가격 업데이트
            const priceElement = item.querySelector('.item-price');
            if (priceElement) {
                priceElement.innerHTML = `${formatNumber(price)}${building.owned > 0 ? `<span class="item-count">${building.owned}</span>` : ''}`;
            }
            
            // 클래스 업데이트만 (이벤트 리스너는 유지)
            if (canAfford) {
                item.classList.remove('expensive');
                item.classList.add('affordable');
            } else {
                item.classList.remove('affordable');
                item.classList.add('expensive');
            }
        }
        index++;
    }
}

// 업그레이드 구매 가능성만 업데이트하는 효율적인 함수
function updateUpgradeAffordability() {
    if (!elements.upgradesList) return;
    
    const upgradeItems = elements.upgradesList.querySelectorAll('.upgrade-item');
    let index = 0;
    
    for (const key in upgradesData) {
        const upgrade = upgradesData[key];
        
        if (upgrade.purchased || !upgrade.requirement()) {
            continue;
        }
        
        const canAfford = gameState.score >= upgrade.price;
        
        if (upgradeItems[index]) {
            const item = upgradeItems[index];
            item.setAttribute('data-upgrade-key', key); // 키 저장
            
            // 클래스 업데이트만 (이벤트 리스너는 유지)
            if (canAfford) {
                item.classList.remove('expensive');
                item.classList.add('affordable');
            } else {
                item.classList.remove('affordable');
                item.classList.add('expensive');
            }
        }
        index++;
    }
}

// 저장/불러오기
function saveGame() {
    try {
        const saveData = {
            gameState: {...gameState},
            buildingsData: {...buildingsData},
            upgradesData: {...upgradesData},
            achievementsData: {...achievementsData},
            timestamp: Date.now()
        };
        
        localStorage.setItem('clickerGameSave', JSON.stringify(saveData));
        gameState.lastSaveTime = Date.now();
        console.log('게임 저장 완료');
    } catch (e) {
        console.error('저장 실패:', e);
        showNotification('저장에 실패했습니다!');
    }
}

function loadGame() {
    try {
        const saveData = localStorage.getItem('clickerGameSave');
        if (!saveData) {
            console.log('저장 데이터가 없습니다.');
            return;
        }
        
        const data = JSON.parse(saveData);
        
        // 게임 상태 복원
        if (data.gameState) {
            Object.assign(gameState, data.gameState);
        }
        
        // 건물 데이터 복원
        if (data.buildingsData) {
            for (const key in data.buildingsData) {
                if (buildingsData[key]) {
                    Object.assign(buildingsData[key], data.buildingsData[key]);
                }
            }
        }
        
        // 업그레이드 데이터 복원
        if (data.upgradesData) {
            for (const key in data.upgradesData) {
                if (upgradesData[key]) {
                    Object.assign(upgradesData[key], data.upgradesData[key]);
                }
            }
        }
        
        // 업적 데이터 복원
        if (data.achievementsData) {
            for (const key in data.achievementsData) {
                if (achievementsData[key]) {
                    Object.assign(achievementsData[key], data.achievementsData[key]);
                }
            }
        }
        
        // 오프라인 진행 계산
        if (data.timestamp && gameState.ratePerSecond > 0) {
            const offlineTime = (Date.now() - data.timestamp) / 1000;
            const offlineProduction = gameState.ratePerSecond * offlineTime;
            
            if (offlineProduction > 0) {
                gameState.score += offlineProduction;
                gameState.totalScore = Math.max(gameState.totalScore, gameState.score);
                showNotification(`오프라인 수익: +${formatNumber(offlineProduction)} (${Math.floor(offlineTime)}초)`);
            }
        }
        
        // 생산량 재계산
        gameState.ratePerSecond = calculateTotalProduction();
        
        // UI 업데이트
        renderBuildings();
        renderUpgrades();
        renderAchievements();
        updateDisplay();
        
        console.log('게임 불러오기 완료');
    } catch (e) {
        console.error('불러오기 실패:', e);
        showNotification('불러오기에 실패했습니다!');
    }
}

function resetGame() {
    if (confirm('정말로 게임을 초기화하시겠습니까? 모든 진행상황이 사라집니다.')) {
        localStorage.removeItem('clickerGameSave');
        location.reload();
    }
}

// 모달 닫기
function closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.classList.add('hidden');
    }
}

// 페이지 언로드 시 자동 저장
window.addEventListener('beforeunload', saveGame);

// 디버깅 및 테스트 함수들 (개발용)
function debugGame() {
    console.log('=== 게임 상태 디버그 ===');
    console.log('점수:', formatNumber(gameState.score));
    console.log('클릭 파워:', gameState.clickPower);
    console.log('총 클릭 수:', formatNumber(gameState.totalClicks));
    console.log('자동 클리커:', gameState.autoClickers);
    console.log('프레스티지 레벨:', gameState.prestigeLevel);
    
    // 생산량 상세 계산
    calculateTotalProduction(true);
    
    console.log('건물 현황:');
    for (const key in buildingsData) {
        const building = buildingsData[key];
        if (building.owned > 0) {
            const multiplier = building.multiplier || 1;
            const prestigeBonus = 1 + (gameState.prestigeLevel * 0.1);
            const production = building.baseProduction * building.owned * multiplier * prestigeBonus;
            console.log(`- ${building.name}: ${building.owned}개, 총 생산량: ${formatNumber(production)}/초`);
        }
    }
    
    const activeUpgrades = Object.keys(gameState.upgrades).filter(key => gameState.upgrades[key]);
    const unlockedAchievements = Object.keys(gameState.achievements).filter(key => gameState.achievements[key]);
    
    console.log('활성 업그레이드:', activeUpgrades.length > 0 ? activeUpgrades : '없음');
    console.log('달성한 업적:', unlockedAchievements.length > 0 ? unlockedAchievements : '없음');
}

// 테스트용 점수 추가 함수
function addTestScore(amount = 1000) {
    gameState.score += amount;
    gameState.totalScore = Math.max(gameState.totalScore, gameState.score);
    updateDisplay();
    // 즉시 UI 업데이트
    updateBuildingAffordability();
    updateUpgradeAffordability();
    checkAchievements();
    console.log(`${amount} 점수 추가됨. 현재 점수: ${formatNumber(gameState.score)}`);
}

// 테스트용 자동 클릭 함수
function testAutoClick() {
    const rect = elements.mainClicker.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            handleMainClick({
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2
            });
        }, i * 100);
    }
    console.log('10번 자동 클릭 실행됨');
}

// 테스트용 건물 구매 함수
function testBuyBuilding(buildingKey = 'cursor', amount = 1) {
    for (let i = 0; i < amount; i++) {
        if (buildingsData[buildingKey]) {
            buyBuilding(buildingKey);
        }
    }
    console.log(`${buildingKey} ${amount}개 구매 시도 완료`);
}

// 테스트용 모든 건물 1개씩 구매
function testBuyAllBuildings() {
    const buildings = ['cursor', 'grandma', 'farm', 'mine', 'factory', 'bank'];
    buildings.forEach(key => {
        if (buildingsData[key]) {
            buyBuilding(key);
        }
    });
    console.log('모든 건물 1개씩 구매 완료');
}

// 테스트용 커서와 할머니 비교 함수
function testCursorVsGrandma() {
    console.log('=== 🆚 커서 vs 할머니 완전 분석 ===');
    
    if (buildingsData.cursor) {
        const cursor = buildingsData.cursor;
        const multiplier = cursor.multiplier || 1;
        const prestigeBonus = 1 + (gameState.prestigeLevel * 0.1);
        const clickPowerBonus = cursor.clickPowerBonus * cursor.owned * multiplier * prestigeBonus;
        console.log(`👆 마법 커서: ${cursor.owned}개`);
        console.log(`   - 역할: 클릭 파워 영구 증가`);
        console.log(`   - 효과: +${clickPowerBonus} 클릭파워`);
        console.log(`   - 특징: 수동 클릭할 때마다 더 많은 점수!`);
    }
    
    if (buildingsData.grandma) {
        const grandma = buildingsData.grandma;
        const multiplier = grandma.multiplier || 1;
        const prestigeBonus = 1 + (gameState.prestigeLevel * 0.1);
        const production = grandma.baseProduction * grandma.owned * multiplier * prestigeBonus;
        console.log(`👵 할머니: ${grandma.owned}개`);
        console.log(`   - 역할: 자동 쿠키 생산`);
        console.log(`   - 효과: ${production}/초 생산`);
        console.log(`   - 특징: 가만히 있어도 자동으로 점수 증가!`);
    }
    
    console.log(`\n💪 현재 총 클릭파워: ${gameState.clickPower}`);
    console.log(`🏭 현재 총 자동생산: ${gameState.ratePerSecond}/초`);
    console.log('\n💡 전략:');
    console.log('- 커서: 수동 클릭을 자주 한다면 구매');
    console.log('- 할머니: 방치형 플레이를 한다면 구매');
    console.log('- 둘 다: 완전히 다른 역할이므로 모두 필요!');
}

// 테스트용 프레스티지 시스템 분석 함수
function testPrestigeSystem() {
    console.log('=== 🌟 프레스티지 시스템 분석 ===');
    console.log(`현재 프레스티지 레벨: ${gameState.prestigeLevel}`);
    console.log(`현재 총 점수: ${formatNumber(gameState.totalScore)}`);
    
    const baseRequirement = 1000000;
    for (let level = 0; level <= gameState.prestigeLevel + 3; level++) {
        const requiredScore = baseRequirement * Math.pow(10, level);
        const available = gameState.totalScore >= requiredScore ? '✅' : '❌';
        console.log(`레벨 ${level}: ${formatNumber(requiredScore)} 점수 필요 ${available}`);
    }
    
    const currentPrestigePoints = calculatePrestigePoints();
    console.log(`\n현재 획득 가능한 프레스티지 포인트: ${currentPrestigePoints}`);
    
    if (currentPrestigePoints > 0) {
        const nextLevelRequirement = baseRequirement * Math.pow(10, gameState.prestigeLevel + 1);
        console.log(`다음 프레스티지까지 필요한 점수: ${formatNumber(nextLevelRequirement)}`);
    }
}

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료, 게임 초기화 시작...');
    initGame();
    
    // 개발자 도구에서 사용할 수 있는 함수들 등록
    window.debugGame = debugGame;
    window.addTestScore = addTestScore;
    window.testAutoClick = testAutoClick;
    window.testBuyBuilding = testBuyBuilding;
    window.testBuyAllBuildings = testBuyAllBuildings;
    window.testCursorVsGrandma = testCursorVsGrandma;
    window.testPrestigeSystem = testPrestigeSystem;
    console.log('디버그 함수 등록 완료:');
    console.log('- debugGame(): 게임 상태 확인');
    console.log('- addTestScore(amount): 테스트 점수 추가');
    console.log('- testAutoClick(): 10번 자동 클릭');
    console.log('- testBuyBuilding(key, amount): 특정 건물 구매');
    console.log('- testBuyAllBuildings(): 모든 건물 1개씩 구매');
    console.log('- testCursorVsGrandma(): 커서와 할머니 비교 분석');
    console.log('- testPrestigeSystem(): 프레스티지 시스템 분석');
});