type ToastType = 'success' | 'error'
type Listener = (message: string, type: ToastType) => void

const listeners: Listener[] = []

export const toastEmitter = {
  on(fn: Listener): () => void {
    listeners.push(fn)
    return () => {
      const i = listeners.indexOf(fn)
      if (i > -1) listeners.splice(i, 1)
    }
  },
  emit(message: string, type: ToastType = 'error') {
    listeners.forEach((fn) => fn(message, type))
  },
}
