import { clipboard } from 'electron';
import { isSerialNumber } from './serialDetector';

export class ClipboardMonitor {
    private lastClipboard: string = '';
    private interval: NodeJS.Timeout | null = null;
    private isEnabled: boolean = true;

    constructor(private onDetected: (serial: string) => void) { }

    start(intervalMs: number = 800) {
        if (this.interval) return;

        this.interval = setInterval(() => {
            if (!this.isEnabled) return;

            const text = clipboard.readText().trim();
            if (!text || text === this.lastClipboard) return;
            this.lastClipboard = text;

            if (isSerialNumber(text)) {
                this.onDetected(text);
            }
        }, intervalMs);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }
}
