import { GameMainParameterObject, RPGAtsumaruWindow } from "./parameterObject";

declare const window: RPGAtsumaruWindow;

export function main(param: GameMainParameterObject): void {
	const scene = new g.Scene({
		game: g.game,
		// このシーンで利用するアセットのIDを列挙し、シーンに通知します
		assetIds: ["intai", "inu", "kanemoti", "karaoke_2", "karaoke", "kiyomizu", "korean", "launch", "n_kou", "result",
			// tslint:disable-next-line: max-line-length
			"doumo_toomo", "gogo_no_zyugyou", "hattastu_syougai", "karaoke_ikuka", "katsudon_channel", "korean_sound", "n_kou_taigaku", "san_ryuunen", "teacher_block"]
	});
	let time = 60; // 制限時間
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
		// 読み込み成功
		// タイトル画面出す
		const titleSprite = new g.Sprite({
			scene: titleScene,
			src: titleScene.assets["title"]
		});
		// 追加
		titleScene.append(titleSprite);
		// 5秒待つ
		titleScene.setTimeout(() => {
			scene.loaded.add(() => {

				// 5秒引く
				time -= 5;

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
					text: "残り時間: 0",
					font: font,
					fontSize: font.size / 2,
					textColor: "black",
					x: 0.7 * g.game.width
				});
				scene.append(timeLabel);

				// プレイヤー画像
				const playerSprite = new g.Sprite({
					scene: scene,
					src: scene.assets["inu"]
				});
				playerSprite.x = 100;
				playerSprite.y = 200;
				playerSprite.modified();
				scene.append(playerSprite);

				// 地面
				const groundFilledRect = new g.FilledRect({
					scene: scene,
					width: g.game.width,
					height: 20,
					cssColor: "black"
				});
				groundFilledRect.y = playerSprite.y + playerSprite.height; // 地面の高さ
				groundFilledRect.modified();
				scene.append(groundFilledRect);

				// 音の名前の配列
				const soundList = ["doumo_toomo", "gogo_no_zyugyou", "hattastu_syougai", "karaoke_ikuka", "katsudon_channel", "korean_sound", "n_kou_taigaku", "san_ryuunen", "teacher_block"];

				// ジャンプする
				// 連打対策
				let isJump = true;
				scene.pointDownCapture.add(() => {
					if (isJump) {
						// 音発生！
						const soundRandom = g.game.random.get(0, soundList.length - 1);
						(scene.assets[soundList[soundRandom]] as g.AudioAsset).play();
						// 押せなくする
						isJump = false;
						// 計算に必要な奴
						const v0 = 15;
						const gravity = 0.9;
						const ground = 210;
						let jumpTime = 0;
						// 計算する
						const jumpUpdateFanc = () => {
							// 公式
							const calc = (0.5 * gravity * jumpTime * jumpTime - v0 * jumpTime + ground);
							if (calc <= ground) {
								// ジャンプ中
								playerSprite.y = calc;
							} else {
								playerSprite.update.remove(jumpUpdateFanc);
								isJump = true;
							}
							jumpTime++;
							playerSprite.modified();
						};
						playerSprite.update.add(jumpUpdateFanc);
					}
				});

				// 障害物？作成
				// 使う画像の名前の配列
				const imgList = ["intai", "kanemoti", "karaoke_2", "karaoke", "kiyomizu", "korean", "launch", "n_kou"];
				// 定期実行
				scene.setInterval(() => {
					// 生成も少しずらす
					const timeoutRandom = g.game.random.get(500, 1000);
					scene.setTimeout(() => {
						// 画像はらんだむ
						const random = g.game.random.get(0, imgList.length - 1);
						const obj = new g.Sprite({
							scene: scene,
							src: scene.assets[imgList[random]]
						});
						// いち
						obj.x = g.game.width + obj.width;
						obj.y = groundFilledRect.y - obj.height;
						// 動かす
						obj.update.add(() => {
							// 時間内なら
							if (time >= 5) {
								obj.x -= 10;
								obj.modified();
								// 当たったら
								if (g.Collision.intersectAreas(obj, playerSprite)) {
									// 消す＋減点
									obj.destroy();
									g.game.vars.gameState.score -= 50;
									// テキスト反映
									scoreLabel.text = `スコア: ${g.game.vars.gameState.score}`;
									scoreLabel.invalidate();
								}
							}
						});
						scene.append(obj);
					}, timeoutRandom);
				}, 1500);

				// 進んだら点数あっぷ
				scene.update.add(() => {
					// 時間内なら
					if (time >= 5) {
						g.game.vars.gameState.score++;
						// テキスト反映
						scoreLabel.text = `スコア: ${g.game.vars.gameState.score}`;
						scoreLabel.invalidate();
					}
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
					// 終了画面
					if (time <= 5) {
						const resultSprite = new g.Sprite({
							scene: scene,
							src: scene.assets["result"]
						});
						scene.append(resultSprite);
					}
					// カウントダウン処理
					time -= 1 / g.game.fps;
					timeLabel.text = "残り時間: " + Math.ceil(time - 5) + " 秒";
					timeLabel.invalidate();
				};
				scene.update.add(updateHandler);
				// ここまでゲーム内容を記述します
			});
			g.game.pushScene(scene);
		}, 5000);
	});
	// シーン切り替え
	g.game.pushScene(titleScene);

}
