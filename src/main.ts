import { GameMainParameterObject, RPGAtsumaruWindow } from "./parameterObject";

declare const window: RPGAtsumaruWindow;

export function main(param: GameMainParameterObject): void {
	const scene = new g.Scene({
		game: g.game,
		// このシーンで利用するアセットのIDを列挙し、シーンに通知します
		assetIds: ["inu", "n_kou", "result", "intai"]
	});
	let time = 70; // 制限時間
	if (param.sessionParameter.totalTimeLimit) {
		time = param.sessionParameter.totalTimeLimit; // セッションパラメータで制限時間が指定されたらその値を使用します
	}
	// 市場コンテンツのランキングモードでは、g.game.vars.gameState.score の値をスコアとして扱います
	g.game.vars.gameState = { score: 0 };

	// タイトル画面
	const titleScene = new g.Scene({
		game: g.game,
		assetIds: ["title"]
	});
	titleScene.loaded.add(() => {
		// タイトル画像
		const titleSprite = new g.Sprite({
			scene: titleScene,
			src: titleScene.assets["title"]
		});
		// タイトル画像追加
		titleScene.append(titleSprite);
		// 読み込み成功時
		titleScene.setTimeout(() => {
			// 5秒経ったらゲーム開始。
			time -= 5;
			scene.loaded.add(() => {
				// ここからゲーム内容を記述します

				// 背景用意
				const backgroundFilledRect = new g.FilledRect({
					scene: scene,
					width: g.game.width,
					height: g.game.height,
					cssColor: "white"
				});
				scene.append(backgroundFilledRect);

				// フォントの生成
				const font = new g.DynamicFont({
					game: g.game,
					fontFamily: g.FontFamily.SansSerif,
					size: 48
				});

				// スコア表示用のラベル
				const scoreLabel = new g.Label({
					scene: scene,
					text: "スコア: 0",
					font: font,
					fontSize: font.size / 2,
					textColor: "black"
				});
				scene.append(scoreLabel);

				// 残り時間表示用ラベル
				const timeLabel = new g.Label({
					scene: scene,
					text: "時間: 70",
					font: font,
					fontSize: font.size / 2,
					textColor: "black",
					x: 0.7 * g.game.width
				});
				scene.append(timeLabel);

				// プレイヤーの表示
				const playerSprite = new g.Sprite({
					scene: scene,
					src: scene.assets["inu"],
					y: 200,
					x: 100
				});
				scene.append(playerSprite);

				// 地面
				const groundFilledRect = new g.FilledRect({
					scene: scene,
					width: g.game.width,
					height: 20,
					cssColor: "black",
					y: (playerSprite.y + playerSprite.height) // プレイヤーの下にいるように
				});
				scene.append(groundFilledRect);

				// 物理の授業。
				// 押したらジャンプできるようにする。
				// 連打対策
				let isJump = true; // ジャンプ可能ならtrue
				scene.pointDownCapture.add(() => {
					if (isJump) {
						isJump = false;
						// 計算に必要なもの
						const v0 = 15; // 初速度
						const gravity = 0.9; // 重力加速度
						const ground = 210; // 地面の位置
						let jumpTime = 0; // 時間
						// 毎フレーム呼ばれる関数
						const jumpUpdateFanc = () => {
							// 公式
							const calc = (0.5 * gravity * jumpTime * jumpTime - v0 * jumpTime + ground);
							if (calc <= ground) {
								// ジャンプ中
								playerSprite.y = calc;
							} else {
								// 着地
								playerSprite.update.remove(jumpUpdateFanc); // 毎フレーム呼ばれる関数解除
								isJump = true; // ジャンプできるようにする
							}
							jumpTime += 1;
							playerSprite.modified();
						};
						playerSprite.update.add(jumpUpdateFanc); // 毎フレーム呼ばれる関数登録
					}
				});

				// 障害物作成
				scene.setInterval(() => {
					if (time >= 5) {
						// 時間内
						// ちょっとランダム
						const timeRandom = g.game.random.get(500, 1000);
						scene.setTimeout(() => {
							const nKouSprite = new g.Sprite({
								scene: scene,
								src: scene.assets["n_kou"]
							});
							// 位置
							nKouSprite.y = groundFilledRect.y - nKouSprite.height;
							nKouSprite.x = g.game.width + nKouSprite.width;
							// 動かす
							nKouSprite.update.add(() => {
								if (time >= 5) {
									nKouSprite.x -= 10;
									nKouSprite.modified();
									// 当たり判定
									if (g.Collision.intersectAreas(nKouSprite, playerSprite)) {
										// 当たったら消して減点！
										nKouSprite.destroy();
										g.game.vars.gameState.score -= 50;
										scoreLabel.text = `スコア: ${g.game.vars.gameState.score}`;
										scoreLabel.invalidate(); // 再描画
									}
								}
							});
							scene.append(nKouSprite);
						}, timeRandom);
					}
				}, 1500);

				// // おまけ。得点要素も
				// scene.setInterval(() => {
				// 	// ランダムで出すか決定
				// 	const random = g.game.random.get(1, 5);
				// 	if (random === 5) {
				// 		const intaiSprite = new g.Sprite({
				// 			scene: scene,
				// 			src: scene.assets["intai"]
				// 		});
				// 		intaiSprite.x = (g.game.width + intaiSprite.width);
				// 		intaiSprite.y = g.game.random.get(50, 200); // 高さはランダム
				// 		intaiSprite.update.add(() => {
				// 			if (time >= 5) {
				// 				intaiSprite.x -= 10;
				// 				intaiSprite.modified();
				// 				// 当たり判定
				// 				if (g.Collision.intersectAreas(intaiSprite, playerSprite)) {
				// 					// 当たったら消して点数入れる！
				// 					intaiSprite.destroy();
				// 					g.game.vars.gameState.score += 500;
				// 					scoreLabel.text = `スコア: ${g.game.vars.gameState.score}`;
				// 					scoreLabel.invalidate(); // 再描画
				// 				}
				// 			}
				// 		});
				// 		scene.append(intaiSprite);
				// 	}
				// }, 1000);

				// 進んだら点数を加算。
				playerSprite.update.add(() => {
					// スコア
					g.game.vars.gameState.score += 1;
					// スコアテキスト反映
					scoreLabel.text = `スコア: ${g.game.vars.gameState.score}`;
					scoreLabel.invalidate(); // 再描画
				});

				const updateHandler = () => {
					if (time <= 0) {
						// RPGアツマール環境であればランキングを表示します
						if (param.isAtsumaru) {
							const boardId = 1;
							window.RPGAtsumaru.experimental.scoreboards.setRecord(boardId, g.game.vars.gameState.score).then(function () {
								window.RPGAtsumaru.experimental.scoreboards.display(boardId);
							});
						}
						scene.update.remove(updateHandler); // カウントダウンを止めるためにこのイベントハンドラを削除します
					}
					// ゲーム終了
					if (time <= 5) {
						// 終了画面
						const resultSprite = new g.Sprite({
							scene: scene,
							src: scene.assets["result"]
						});
						scene.append(resultSprite);
						// 押せなくする
						scene.pointDownCapture.removeAll();
						playerSprite.update.removeAll();
					}
					// カウントダウン処理
					time -= 1 / g.game.fps;
					timeLabel.text = "残り時間: " + Math.ceil(time - 5) + " 秒"; // 最後の5秒は終了画面のために使う。
					timeLabel.invalidate();
				};
				scene.update.add(updateHandler);
				// ここまでゲーム内容を記述します
			});
			g.game.pushScene(scene);
		}, 5000);

	});
	// 画面切り替え
	g.game.pushScene(titleScene);

}
