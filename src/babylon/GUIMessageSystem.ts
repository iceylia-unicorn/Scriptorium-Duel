// src/babylon/GUIMessageSystem.ts
import { TextBlock, Rectangle, Image, Control } from "@babylonjs/gui";
import { Animation } from "@babylonjs/core";
import { globalBabylon } from "./globals";

class MessageQueue {
    private static instance: MessageQueue;
    private messages: Array<{
        message: string;
        callback?: () => void;
        resolve: () => void;
    }> = [];
    private isShowing = false;
    private textBlock: TextBlock;

    private constructor() {
        this.textBlock = new TextBlock("messageText");
        this.textBlock.color = "#D8B4A6";
        this.textBlock.fontSize = 40;
        this.textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.textBlock.top = "50px";
        this.textBlock.isVisible = false;
        this.textBlock.paddingTop =10;
        this.textBlock.fontFamily = "KaiTi";
        globalBabylon.advancedTexture!.addControl(this.textBlock);
    }

    private animateOpacity(from: number, to: number, duration: number): Promise<void> {
        return new Promise((resolve) => {
            const anim = new Animation(
                "opacityAnim",
                "alpha",
                60,
                Animation.ANIMATIONTYPE_FLOAT,
                Animation.ANIMATIONLOOPMODE_CONSTANT
            );
            anim.setKeys([
                { frame: 0, value: from },
                { frame: duration, value: to }
            ]);
            this.textBlock.animations = [anim];
            globalBabylon.scene!.beginAnimation(this.textBlock, 0, duration, false, 1.0, () => resolve());
        });
    }

    public static getInstance(): MessageQueue {
        if (!MessageQueue.instance) {
            MessageQueue.instance = new MessageQueue();
        }
        return MessageQueue.instance;
    }

    public async showMessage(message: string, callback?: () => void): Promise<void> {
        return new Promise<void>((resolve) => {
            this.messages.push({ message, callback, resolve });
            this.processQueue();
        });
    }

    private async processQueue(): Promise<void> {
        if (this.isShowing || this.messages.length === 0) return;
        this.isShowing = true;

        const { message, callback, resolve } = this.messages.shift()!;
        this.textBlock.text = message;
        this.textBlock.isVisible = true;
        await this.animateOpacity(0, 1, 30);
        await new Promise((res) => setTimeout(res, 2000));
        await this.animateOpacity(1, 0, 30);
        this.textBlock.isVisible = false;
        callback?.();
        resolve();
        this.isShowing = false;
        this.processQueue();
    }
}

export default MessageQueue;

// todo 印记功能显示模块.
class ParchmentDisplay {
    private static instance: ParchmentDisplay;
    private panel: Rectangle;
    private title: TextBlock;
    private description: TextBlock;

    private constructor(parchmentImageUrl: string) {
        this.panel = new Rectangle("parchmentPanel");
        this.panel.width = 0.8;
        this.panel.height = "30%";
        this.panel.thickness = 0;
        this.panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.panel.isVisible = false;
        this.panel.isPointerBlocker = true;

        const background = new Image("parchmentBg", parchmentImageUrl);
        background.stretch = Image.STRETCH_FILL;
        this.panel.addControl(background);
        // this.panel.background = "#fffbe6"; // 浅羊皮纸色
        this.title = new TextBlock("parchmentTitle");
        this.title.text = "";
        this.title.fontSize = "26px";
        this.title.color = "black";
        this.title.top = "-40%";
        this.title.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.panel.addControl(this.title);

        this.description = new TextBlock("parchmentDesc");
        this.description.text = "";
        this.description.fontSize = "20px";
        this.description.color = "black";
        this.description.textWrapping = true;
        this.description.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.description.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.description.paddingTop = "40px";
        this.panel.addControl(this.description);

        globalBabylon.advancedTexture!.addControl(this.panel);
        globalBabylon.scene!.onPointerObservable.add(() => {
            if (this.panel.isVisible) {
                this.panel.isVisible = false;
            }
        });
    }

    public static init(parchmentImageUrl: string) {
        if (!ParchmentDisplay.instance) {
            ParchmentDisplay.instance = new ParchmentDisplay(parchmentImageUrl);
        }
    }

    public static get instanceRef(): ParchmentDisplay {
        if (!ParchmentDisplay.instance) {
            throw new Error("ParchmentDisplay 未初始化，请先调用 init 方法");
        }
        return ParchmentDisplay.instance;
    }

    public show(titleText: string, descText: string) {
        this.title.text = titleText;
        this.description.text = descText;
        this.panel.isVisible = true;
    }

    public hide() {
        this.panel.isVisible = false;
    }
}

export const parchment = {
    init: (url: string) => ParchmentDisplay.init(url),
    show: (title: string, desc: string) => ParchmentDisplay.instanceRef.show(title, desc),
    hide: () => ParchmentDisplay.instanceRef.hide(),
};
