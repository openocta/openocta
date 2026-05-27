import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("thinking-timer")
export class ThinkingTimer extends LitElement {
  @property({ type: Number }) start = Date.now();

  @state() private elapsed = 0;
  private timerId: any = null;

  connectedCallback() {
    super.connectedCallback();
    this.elapsed = Date.now() - this.start;
    this.timerId = setInterval(() => {
      this.elapsed = Date.now() - this.start;
    }, 100);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  createRenderRoot() {
    return this; // Render in light DOM so it inherits CSS styles
  }

  render() {
    const ms = Math.max(0, this.elapsed);
    let timeStr = "";
    if (ms < 60000) {
      timeStr = (ms / 1000).toFixed(1);
    } else {
      const mins = Math.floor(ms / 60000);
      const secs = ((ms % 60000) / 1000).toFixed(1);
      timeStr = `${mins}m ${secs}`;
    }
    return html`思考（${timeStr}）s`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "thinking-timer": ThinkingTimer;
  }
}
