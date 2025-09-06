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
    achievements: {}
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

// 업그레이드 데이터 (원본)
const UPGRADES_ORIGINAL = {
    clickPower1: {
        name: "강화된 손가락", icon: "💪", description: "클릭 파워가 2배가 됩니다",
        price: 100, requirement: () => true, effect: () => gameState.clickPower *= 2
    },
    clickPower2: {
        name: "철 손가락", icon: "🤖", description: "클릭 파워가 3배가 됩니다",
        price: 1000, requirement: () => gameState.upgrades.clickPower1, effect: () => gameState.clickPower *= 3
    },
    autoClicker1: {
        name: "자동 클리커", icon: "🤖", description: "자동으로 1초에 1번 클릭합니다",
        price: 5000, requirement: () => gameState.totalClicks >= 100, effect: () => gameState.autoClickers++
    },
    autoClicker2: {
        name: "고급 자동 클리커", icon: "🔥", description: "자동 클리커를 1개 더 추가합니다",
        price: 50000, requirement: () => gameState.upgrades.autoClicker1, effect: () => gameState.autoClickers++
    },
    cursorUpgrade1: {
        name: "커서 효율성", icon: "⚡", description: "커서 생산량이 2배가 됩니다",
        price: 500, requirement: () => buildingsData.cursor.owned >= 5, effect: () => buildingsData.cursor.multiplier = (buildingsData.cursor.multiplier || 1) * 2
    },
    grandmaUpgrade1: {
        name: "할머니의 레시피", icon: "📜", description: "할머니 생산량이 2배가 됩니다",
        price: 5000, requirement: () => buildingsData.grandma.owned >= 5, effect: () => buildingsData.grandma.multiplier = (buildingsData.grandma.multiplier || 1) * 2
    },
    farmUpgrade1: {
        name: "비옥한 토양", icon: "🌱", description: "농장 생산량이 2배가 됩니다",
        price: 50000, requirement: () => buildingsData.farm.owned >= 5, effect: () => buildingsData.farm.multiplier = (buildingsData.farm.multiplier || 1) * 2
    },
    mineUpgrade1: {
        name: "고급 장비", icon: "💎", description: "광산 생산량이 2배가 됩니다",
        price: 500000, requirement: () => buildingsData.mine.owned >= 5, effect: () => buildingsData.mine.multiplier = (buildingsData.mine.multiplier || 1) * 2
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
    totalClicks: document.getElementById('total-clicks'),
    totalBuildings: document.getElementById('total-buildings'),
    offlineTime: document.getElementById('offline-time'),
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
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
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
        const upgradeAutoClickProduction = gameState.clickPower * gameState.autoClickers;
        total += upgradeAutoClickProduction;
        
        if (debug) {
            console.log(`업그레이드 자동 클리커: ${gameState.autoClickers}개 × ${gameState.clickPower} = ${upgradeAutoClickProduction}/초`);
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
    
    // 업그레이드 데이터 복사
    upgradesData = {};
    for (const key in UPGRADES_ORIGINAL) {
        upgradesData[key] = {
            ...UPGRADES_ORIGINAL[key],
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
    gameState.score += gameState.clickPower;
    gameState.totalClicks++;
    gameState.totalScore = Math.max(gameState.totalScore, gameState.score);
    
    // 클릭 효과 표시
    const rect = elements.mainClicker.getBoundingClientRect();
    const x = e.clientX - rect.left - 25;
    const y = e.clientY - rect.top - 25;
    showClickEffect(x, y, gameState.clickPower);
    
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
    const delay = Math.random() * 120000 + 30000; // 0.5-2.5분 (더 자주)
    
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
    if (gameState.totalScore < 1000000) return 0;
    return Math.floor(Math.sqrt(gameState.totalScore / 1000000));
}

function showPrestigeModal() {
    const prestigePoints = calculatePrestigePoints();
    
    if (prestigePoints < 1) {
        showNotification('프레스티지 포인트가 부족합니다! (100만 점 필요)');
        return;
    }
    
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = '프레스티지';
    modalBody.innerHTML = `
        <div style="text-align: center;">
            <h4>🌟 프레스티지 시스템 🌟</h4>
            <p>현재 프레스티지 레벨: ${gameState.prestigeLevel}</p>
            <p>획득 가능한 프레스티지 포인트: <strong>${prestigePoints}</strong></p>
            <p>현재 프레스티지 보너스: <strong>+${gameState.prestigeLevel * 10}%</strong></p>
            <br>
            <p>⚠️ 프레스티지를 하면 점수와 건물이 초기화됩니다!</p>
            <p>하지만 영구적인 생산량 보너스를 얻습니다.</p>
            <br>
            <button id="confirm-prestige" class="header-btn" style="padding: 1rem 2rem; font-size: 1.1rem; background: gold; color: black;">
                프레스티지 실행
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
    
    // 프레스티지 데이터 보존
    gameState.prestigeLevel += prestigePoints;
    gameState.prestigePoints += prestigePoints;
    const preservedData = {
        prestigeLevel: gameState.prestigeLevel,
        prestigePoints: gameState.prestigePoints,
        totalScore: gameState.totalScore,
        goldenCookiesClicked: gameState.goldenCookiesClicked,
        achievements: {...gameState.achievements}
    };
    
    // 게임 상태 초기화
    gameState = {
        ...gameState,
        score: 0,
        clickPower: 1 + (preservedData.prestigeLevel * 0.1),
        totalClicks: 0,
        ratePerSecond: 0,
        buildings: {},
        upgrades: {},
        totalBuildingsCount: 0,
        autoClickers: 0,
        ...preservedData
    };
    
    // 데이터 초기화
    initializeData();
    
    // UI 갱신
    renderBuildings();
    renderUpgrades();
    renderAchievements();
    updateDisplay();
    
    showNotification(`프레스티지 완료! +${prestigePoints} 레벨! (+${prestigePoints * 10}% 보너스)`);
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

// 디스플레이 업데이트
function updateDisplay() {
    if (elements.score) elements.score.textContent = formatNumber(gameState.score);
    if (elements.rate) elements.rate.textContent = formatNumber(gameState.ratePerSecond);
    if (elements.totalClicks) elements.totalClicks.textContent = formatNumber(gameState.totalClicks);
    if (elements.totalBuildings) elements.totalBuildings.textContent = formatNumber(gameState.totalBuildingsCount);
    
    // 오프라인 시간 계산
    const offlineSeconds = Math.floor((Date.now() - gameState.lastSaveTime) / 1000);
    if (elements.offlineTime) elements.offlineTime.textContent = offlineSeconds + '초';
    
    // 프레스티지 버튼 상태
    const prestigeBtn = document.getElementById('prestige-btn');
    if (prestigeBtn) {
        const canPrestige = calculatePrestigePoints() >= 1;
        prestigeBtn.style.background = canPrestige ? 'gold' : '';
        prestigeBtn.style.color = canPrestige ? 'black' : '';
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
        
        // 자동 생산 (일반 건물들의 생산량)
        if (gameState.ratePerSecond > 0) {
            gameState.score += gameState.ratePerSecond / 10; // 100ms마다 1/10초 생산량
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
    console.log('디버그 함수 등록 완료:');
    console.log('- debugGame(): 게임 상태 확인');
    console.log('- addTestScore(amount): 테스트 점수 추가');
    console.log('- testAutoClick(): 10번 자동 클릭');
    console.log('- testBuyBuilding(key, amount): 특정 건물 구매');
    console.log('- testBuyAllBuildings(): 모든 건물 1개씩 구매');
    console.log('- testCursorVsGrandma(): 커서와 할머니 비교 분석');
});