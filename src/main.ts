import { Notice, Plugin } from 'obsidian';
import { SessionManager } from './SessionManager';


export default class ObsidianTmux extends Plugin {
  /** Workspaces indexed by id */
  sessionManager: SessionManager

  onload = async () => {
    this.sessionManager = new SessionManager(this.app.workspace)


    const createNewSession = () => {
      let newSession = this.sessionManager.createAndLoadSession()
      new Notice(`Session "${newSession.name}" created`)
    }
    this.addCommand({
      id: "create-session",
      name: "Create Blank Session",
      callback: createNewSession
    })

    this.addCommand({
      id: "test",
      name: "test",
      callback: this.sessionManager.clearWorkspace
    })

    const sessionsDisplay = this.addStatusBarItem()
    this.sessionManager.sessionUpdateSubscription(() => {
      sessionsDisplay.querySelectorAll(".session_display_element").forEach(node => node.remove())

      let sessions = [...this.sessionManager.sessions.values()]

      sessions.forEach(session => {
        sessionsDisplay.createEl(
          "span", 
          { text: session.name, cls: ["session_display_element status-bar-item mod-clickable"] },
          (el) => {
            if (this.sessionManager.checkSessionActive(session)) el.classList.add("hovered")
            el.onclick = () => this.sessionManager.changeSession(session)
          }
        );
      })
    })


    // Event listener will response to use input to load the workspaces

  }

  onunload() {
    // TODO: Remove event listeners
  }
}

