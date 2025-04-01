// src/babylon/GUIMessageSystem.ts
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { Scene,Animation } from "@babylonjs/core";
import { globalBabylon } from "./globals";

class MessageQueue {
    private static instance: MessageQueue;
    private messages: string[] = [];
    private isShowing = false;
    private textBlock: TextBlock;

    private constructor(textBlock: TextBlock) {
        this.textBlock = textBlock;
        this.textBlock.isVisible = false;
    }

    private animateOpacity(from: number, to: number, duration: number): Promise<void> {
        return new Promise((resolve) => {
            // 修改此处：使用直接导入的Animation类
            const anim = new Animation(
                "opacityAnim",
                "alpha",
                60,
                Animation.ANIMATIONTYPE_FLOAT,
                Animation.ANIMATIONLOOPMODE_CONSTANT
            );

            anim.setKeys([{ frame: 0, value: from }, { frame: 60, value: to }]);

            this.textBlock.animations = [anim];
            this.textBlock.isVisible = true; // 添加可见性控制

            globalBabylon.scene!.beginAnimation(this.textBlock, 0, 60, false, duration / 60)
                .onAnimationEndObservable.add(() => {
                if (to === 0) this.textBlock.isVisible = false;
                resolve();
            });
        });
    }

    public static initialize(scene: Scene): MessageQueue {
        if (!this.instance) {
            // 确保删除已存在的UI
            const existing = scene.getTextureByName("MessageUI") as AdvancedDynamicTexture;
            existing?.dispose();

            const guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("MessageUI", true, scene);

            const messageText = new TextBlock("messageText", " ");
            // 修改字体设置确保可见
            messageText.color = "#D8B4A6";
            messageText.fontSize = 40; // 增大字号
            messageText.fontFamily = "KaiTi";
            messageText.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_TOP;
            messageText.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
            messageText.top = "60px"; // 增加顶部间距
            messageText.alpha = 1; // 初始不透明
            messageText.shadowColor = "black";
            messageText.shadowOffsetX = 3;
            messageText.shadowOffsetY = 3;
            messageText.paddingTop = 10; // 增加内边距

            guiTexture.addControl(messageText);
            this.instance = new MessageQueue(messageText);
        }
        return this.instance;
    }

    public static getInstance(): MessageQueue {
        if (!this.instance) {
            throw new Error("MessageQueue not initialized. Call initialize() first.");
        }
        return this.instance;
    }

    public addMessage(message: string): void {
        this.messages.push(message);
        if (!this.isShowing) this.showNext();
    }

    private async showNext(): Promise<void> {
        if (this.messages.length === 0) return;

        this.isShowing = true;
        this.textBlock.text = this.messages.shift()!;

        await this.animateOpacity(0, 1, 500);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.animateOpacity(1, 0, 500);

        this.isShowing = false;
        this.showNext();
    }

    public dispose(): void {
        this.textBlock.dispose();
        MessageQueue.instance = null!;
    }
}

// 导出便捷方法
export const initGUIMessageSystem = (scene: Scene) => MessageQueue.initialize(scene);
export const showGUIText = (text: string) => MessageQueue.getInstance().addMessage(text);
export const disposeMessageSystem = () => {
    if (MessageQueue.getInstance()) {
        MessageQueue.getInstance().dispose();
    }
};