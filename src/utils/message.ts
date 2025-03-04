import {type App, createApp, h} from 'vue'
import MessageComponent from '../components/Message.vue'
interface MessageItem {
    container: HTMLDivElement
    remove: () => void
}

const messageQueue: MessageItem[] = []

interface MessageOptions {
    type?: 'info' | 'success' | 'warning' | 'error'
    message: string
    duration?: number
}

const createMessage = (options: MessageOptions) => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const remove = () => {
        document.body.removeChild(container)
        const index = messageQueue.findIndex(item => item.container === container)
        if (index !== -1) {
            messageQueue.splice(index, 1)
        }
        updateMessageOffset()
    }

    let app: App<Element>
    app = createApp({
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
    messageQueue.push({ container, remove })
    updateMessageOffset()
}

const updateMessageOffset = () => {
    messageQueue.forEach((item, index) => {
        const element = item.container.firstElementChild as HTMLElement
        if (element) {
            element.style.top = `${4 + index * 70}px`
        }
    })
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