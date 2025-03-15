const { Engine, Render, Runner, Bodies, Composite, Events, Mouse, MouseConstraint } = Matter;

const engine = Engine.create();
const render = Render.create({
    element: document.getElementById('game-container'),
    engine: engine,
    options: {
        width: 310,
//        width: window.innerWidth > 600 ? 400 : window.innerWidth, // PC用の固定幅(400px)かスマホサイズかを判断
        height: 430,
        wireframes: false,
        background: '#FFD1DC'  // 薄いピンク色の背景に変更
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);


let isGameOver = false;
let isSkippingGameOverCheck = false;  // ゲームオーバー判定を一時的に無効にするためのフラグ

// BGMの設定
const bgm = document.getElementById('bgm');
let isFirstPlay = true;  // 最初の再生かどうかを判定するフラグ
bgm.volume = 0.2;  // 初期音量を設定

// ミュートの切り替え
let isMuted = false;

// ミュートボタンを動的に生成してゲーム画面に追加
function createMuteButton() {
    const muteButton = document.createElement('button');
    muteButton.id = 'mute-button';
    muteButton.textContent = '🔇';
    muteButton.style.position = 'absolute';
    muteButton.style.top = '10px';  // ゲーム画面内の位置を調整
    muteButton.style.right = '10px';
    muteButton.style.zIndex = '10';
    muteButton.style.padding = '5px';
    muteButton.style.border = 'none';
    muteButton.style.background = 'rgba(255, 255, 255, 0.7)';
    muteButton.style.borderRadius = '5px';
    muteButton.style.cursor = 'pointer';

    // ミュートボタンのクリックイベント
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        bgm.muted = isMuted;

        if (isMuted) {
            muteButton.textContent = '🔈';  // ミュート解除アイコンに変更
        } else {
            muteButton.textContent = '🔇';  // ミュートアイコンに変更
        }
    });

    // ゲームコンテナにミュートボタンを追加
    const gameContainer = document.getElementById('game-container');
    gameContainer.appendChild(muteButton);
}

// ゲーム初期化関数
function startGame() {

// コップを構成するボディを追加
//開始x座標,開始y座標,横幅,立幅
const cupBottom = Bodies.rectangle(150, 425, 280, 10, {
    isStatic: true,
    render: {
        fillStyle: '#8B4513' // コップの底の色を茶色に設定
    },
    friction:0.0001,
    frictionStatic:0.0001
});
const cupLeft = Bodies.rectangle(15, 250, 10, 350, {
    isStatic: true,
    render: {
        fillStyle: '#8B4513' // コップの左側の色を茶色に設定
    }
});
const cupRight = Bodies.rectangle(285, 250, 10, 350, {
    isStatic: true,
    render: {
        fillStyle: '#8B4513' // コップの右側の色を茶色に設定
    }
});

Composite.add(engine.world, [cupBottom, cupLeft, cupRight]);

    const imageUrls = [
        "./img/image1.gif",
        "./img/image2.gif",
        "./img/image3.gif",
        "./img/image4.gif"
    ];

    // 果物画像ごとのサイズ設定（単位はピクセル）
    const fruitSizes = {
        './img/image1.gif': 30,
        './img/image2.gif': 40,
        './img/image3.gif': 60,
        './img/image4.gif': 90,
        './img/image5.gif': 110,
        './img/image6.gif': 110,
        './img/tomato.gif': 120
    };

    const originalImageSize = 320; // 元の画像サイズ（500ピクセル）

    let nextFruitUrl = getRandomImageUrl();
    updateNextFruitPreview(nextFruitUrl);

    function getRandomImageUrl() {
        const randomIndex = Math.floor(Math.random() * imageUrls.length);
        return imageUrls[randomIndex];
    }

    function updateNextFruitPreview(url) {
        const nextFruitImage = document.getElementById('next-fruit-image');
        nextFruitImage.src = url;
    }

    function createFruit(x, y) {
        const fruitImageUrl = nextFruitUrl;  // 現在の次の果物のURL
        const size = fruitSizes[fruitImageUrl] || 32;  // サイズ設定がない場合デフォルト32
        const fruit = Bodies.circle(x, y, size / 2, {
            restitution: 0.5,
            render: {
                sprite: {
                  texture: fruitImageUrl,
                    xScale: size / originalImageSize,
                    yScale: size / originalImageSize
                }
            }
        });
        Composite.add(engine.world, fruit);
        console.log(`フルーツ生成完了: x=${x}, y=${y}`);

        // フルーツを生成後、一定時間ゲームオーバー判定を無効化
        isSkippingGameOverCheck = true;
        setTimeout(() => {
            isSkippingGameOverCheck = false;  // 指定時間後に判定を再開
        }, 500);  // 500msの遅延（必要に応じて調整可能）        

        // 次のフルーツのURLを更新し、プレビュー画像を変更
        nextFruitUrl = getRandomImageUrl();
        updateNextFruitPreview(nextFruitUrl);

        return fruit;
    }

// フルーツをクリックまたはタップで生成するリスナー
let isGeneratingFruit = false;  // フルーツ生成の間隔を制御するためのフラグ

function handleClick(event) {
    // 最初のクリックでBGMを再生
    if (isFirstPlay) {
        bgm.play();
        bgm.volume = 0.2;  // 音量を20%に設定
        isFirstPlay = false;
        createMuteButton();  // ミュートボタンを生成
    }

    if (!isGameOver && !isGeneratingFruit) {
        const rect = render.canvas.getBoundingClientRect();
        let x, y;

        if (event.type === 'click') {
            // PC用のクリックイベント
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
            console.log(`クリックが検出: x=${x}, y=${y}`);
        } else if (event.type === 'touchstart') {
            // スマホ用のタッチイベント
            const touch = event.touches[0];
            x = touch.clientX - rect.left;
            y = touch.clientY - rect.top;
            console.log(`タップが検出: x=${x}, y=${y}`);
        }

        // フルーツは一番上から落ちるようにするため、y座標を0に設定
        createFruit(x, 70);

//        // フルーツ生成の間隔を制御する
        isGeneratingFruit = true;
        setTimeout(() => {
            isGeneratingFruit = false;
        }, 500);  // 500ミリ秒待機（必要に応じて調整可能）

    }
}

// BGMのループ処理
bgm.addEventListener('ended', () => {
    bgm.currentTime = 8.05;  // 秒から再生（適宜調整）
    bgm.play();
});

// タッチイベントの最初の一度のタッチにだけ反応するようにするリスナー
function handleTouchStart(event) {
    handleClick(event);
}

// イベントリスナーをキャンバスに追加
render.canvas.addEventListener('click', handleClick);
render.canvas.addEventListener('touchstart', handleTouchStart);  // スマホ用のタッチイベントを追加



const gameOverHeight = 60; // コップの一定の高さ（例：150）

// コップからあふれたかを確認するイベント
Events.on(engine, 'afterUpdate', () => {
    if (!isGameOver && !isSkippingGameOverCheck) {  // 判定をスキップ中でない場合のみチェック
        Composite.allBodies(engine.world).forEach((body) => {
            if (!body.isStatic) {
                if (body.position.y < gameOverHeight) {  // ゲームオーバーの条件
                    const gameOverMessage = document.getElementById('game-over-message');
                    gameOverMessage.style.display = 'block';
                    isGameOver = true;
                    console.log(`ゲームオーバー: x=${body.position.x}, y=${body.position.y}`);
                    updateFacePreview();
                    render.canvas.removeEventListener('click', handleClick);
                    render.canvas.removeEventListener('touchstart', handleTouchStart);
                    // 物理演算エンジンのランナーを停止
                    Runner.stop(runner);                    
                    
                }
            }
        });
    }
});

let tomatoCount = 0;  // トマトの数カウンター
let scoreCount = 0;  // 得点
let ratio = 1;
function updateTomatoCounter() {
    const counterElement = document.getElementById('tomato-counter');
    counterElement.textContent = `トマトの数: ${tomatoCount}`;
}

function updateScore() {
    const counterElement = document.getElementById('score');
    counterElement.textContent = `とくてん: ${scoreCount}`;
}

function updateFacePreview() {
    const faceImage = document.getElementById('face-image');
    
    // トマトの出現数によって顔画像を変更
    if (tomatoCount === 0) {
        faceImage.src = 'img/face_1.png';
        ratio = 1;
    } else if (tomatoCount === 1) {
        faceImage.src = 'img/face_2.png';
        ratio = 1.5;
    } else if (tomatoCount === 2) {
        faceImage.src = 'img/face_3.png'; 
        ratio = 2;   
    } else if (tomatoCount === 3) {
        faceImage.src = 'img/face_4.png'; 
        ratio = 2.5;   
    } else if (tomatoCount === 4) {
        faceImage.src = 'img/face_5.png';
        ratio = 3;   
    } else if (tomatoCount === 5) {
        faceImage.src = 'img/face_6.png'; 
        ratio = 3.5;   
    } else if (isGameOver === true) {
        faceImage.src = 'img/face_0.png';  
    }
}
let isProcessingCollision = false;
Events.on(engine, 'collisionStart', (event) => {
    if (isProcessingCollision) return; // 処理中ならスキップ
    const pairs = event.pairs;

    pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // どちらのボディも静的（コップなど）でないことを確認
        if (!bodyA.isStatic && !bodyB.isStatic) {
            // 両方のボディの画像URLを取得
            const textureA = bodyA.render.sprite.texture;
            const textureB = bodyB.render.sprite.texture;

            // 画像が同じ場合にのみ処理を行う
            if (textureA === textureB) {
                let newImageUrl;

                // 衝突した画像に応じて次の画像を設定する
                if (textureA.includes('image1.gif')) {
                    newImageUrl = './img/image2.gif';
                    scoreCount = scoreCount + (5 * ratio);
                    updateScore();  // とくてんを更新
                } else if (textureA.includes('image2.gif')) {
                    newImageUrl = './img/image3.gif';
                    scoreCount = scoreCount + (5 * ratio);
                    updateScore();  // とくてんを更新
                } else if (textureA.includes('image3.gif')) {
                    newImageUrl = './img/image4.gif';
                    scoreCount = scoreCount + (10 * ratio);
                    updateScore();  // とくてんを更新
                } else if (textureA.includes('image4.gif')) {
                    newImageUrl = './img/image5.gif';
                    scoreCount = scoreCount + (20 * ratio);
                    updateScore();  // とくてんを更新
                } else if (textureA.includes('image5.gif')) {
                    newImageUrl = './img/image6.gif';
                    scoreCount = scoreCount + (30 * ratio);
                    updateScore();  // とくてんを更新
                } else if (textureA.includes('image6.gif')) {
                    newImageUrl = './img/tomato.gif';
                    tomatoCount++;  // トマトの数を増やす
                    scoreCount = scoreCount + (50 * ratio);
                    updateScore();  // とくてんを更新
                    updateTomatoCounter();  // トマトカウンターを更新
                    updateFacePreview();
                } else {
                    // 他の画像の場合は何もしない
                    return;
                }

                // 衝突したボディを少し遅れて削除
                setTimeout(() => {
                    Composite.remove(engine.world, bodyA);
                    Composite.remove(engine.world, bodyB);

                    // 新しいフルーツを生成し、衝突した2つのフルーツの位置の中間に配置
                    const newX = (bodyA.position.x + bodyB.position.x) / 2;
                    const newY = (bodyA.position.y + bodyB.position.y) / 2;
                    const collisize = fruitSizes[newImageUrl] || 32;  // サイズ設定がない場合デフォルト32
                    const newFruit = Bodies.circle(newX, newY, collisize / 2, {
                        restitution: 0.5,
                        render: {
                            sprite: {
                                texture: newImageUrl,
                                xScale: collisize / originalImageSize,  // サイズを適切に設定
                                yScale: collisize / originalImageSize
                            }
                        }
                    });

                    // 新しいフルーツに物理エンジンを適用して追加
                    Composite.add(engine.world, newFruit);

                    setTimeout(() => {
                        isProcessingCollision = false;
                    }, 100); // 100ミリ秒のクールダウン


                    // 新しいフルーツに初期の下向き速度を与える
                    Matter.Body.setVelocity(newFruit, { x: (Math.random() - 0.5) * 2, y: 5 });

                    // 新しいフルーツに下方向の重力を強制的に適用
                    Matter.Body.applyForce(newFruit, newFruit.position, { x: 0, y: 0.005 });

                    console.log('同じ画像の衝突が検出されました:', textureA, '新しい画像:', newImageUrl);
                    console.log(`新しいフルーツの位置: x=${newX}, y=${newY}`);
                }, 0); // 少しのディレイを設けて次の処理を行う
            }
        }
    });
});
}
// ページ読み込み時にすぐにゲーム開始
window.onload = () => {
    createMuteButton();  // ミュートボタンを生成
    startGame();
};
