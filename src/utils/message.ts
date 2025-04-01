import { createApp, h } from 'vue'
import MessageComponent from '../components/Message.vue'

interface MessageOptions {
    type?: 'info' | 'success' | 'warning' | 'error'
    message: string
    duration?: number
}

// 当前显示的消息实例
let currentMessage: { remove: () => void } | null = null

const createMessage = (options: MessageOptions) => {
    // 关闭当前显示的消息
    if (currentMessage) {
        currentMessage.remove()
        currentMessage = null
    }

    const container = document.createElement('div')
    document.body.appendChild(container)

    const remove = () => {
        setTimeout(() => {
            document.body.removeChild(container)
            currentMessage = null
        }, 300) // 与 Message.vue 的过渡动画时间一致（300ms）
    }

    const app = createApp({
        render() {
            return h(MessageComponent, {
                type: options.type,
                message: options.message,
                duration: options.duration,
                onVnodeUnmounted: () => remove()
            })
        }
    })

    app.mount(container)
    currentMessage = { remove }
}

const message = {
    info: (msg: string, duration?: number) => {
        createMessage({ type: 'info', message: msg, duration })
    },
    success: (msg: string, duration?: number) => {
        createMessage({ type: 'success', message: msg, duration })
    },
    warning: (msg: string, duration?: number) => {
        createMessage({ type: 'warning', message: msg, duration })
    },
    error: (msg: string, duration?: number) => {
        createMessage({ type: 'error', message: msg, duration })
    }
}

export default message