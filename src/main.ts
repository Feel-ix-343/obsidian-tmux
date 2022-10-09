import { Notice, Plugin } from 'obsidian';
import { Session } from './Session';
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

    const sessionsDisplay = this.addStatusBarItem()
    this.sessionManager.sessionUpdateSubscription(() => {
      console.log("DOING CHANGE")
      let sessions = [...this.sessionManager.sessions.values()]
      console.log(sessions)

      let displayEl: Element;
      if (sessionsDisplay.getElementsByClassName("session_display").length == 0) {
        displayEl = sessionsDisplay.createDiv({cls: "session_display"})
      } else {
        displayEl = sessionsDisplay.getElementsByClassName("session_display").item(0)!
      }

      displayEl.innerHTML = ""

      sessions.forEach(session => {
        displayEl.createEl("span", { text: session.name, cls: "session_display_element" }, (el) => {
          el.onclick = () => this.sessionManager.changeSession(session)
        });
      })
    })







    // Event listener will response to use input to load the workspaces

  }

  onunload() {
    // TODO: Remove event listeners
  }
}

