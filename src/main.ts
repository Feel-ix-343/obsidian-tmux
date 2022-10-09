import { Notice, Plugin } from 'obsidian';
import { Session } from './Session';
import { WorkspaceManager } from './WorkspaceManager';


export default class ObsidianTmux extends Plugin {
  /** Workspaces indexed by id */
  workspaceManager: WorkspaceManager

  onload = async () => {
    this.workspaceManager = new WorkspaceManager()


    const createNewSession = () => {

      // Reset the workspace to a default workspace
      this.app.workspace.detachLeavesOfType("markdown") // TODO: have the user define a default workspace; this would allow someboyd like you to reset to the flow note

      let newSession = new Session(
        this.app.workspace,
        this.app.workspace.getLayout(),
        `Session (${[...this.workspaceManager.sessions.values()].length + 1})`
      )

      this.workspaceManager.createSession(newSession)

      new Notice(`Session "${newSession.name}" created`)
    }

    this.addCommand({
      id: "create-session",
      name: "Create Blank Session",
      callback: createNewSession
    })

    const sessionsDisplay = this.addStatusBarItem()
    this.workspaceManager.sessionUpdateSubscription(() => {
      console.log("DOING CHANGE")
      let sessions = [...this.workspaceManager.sessions.values()]
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
          el.onclick = () => this.workspaceManager.changeSession(session)
        });
      })
    })







    // Event listener will response to use input to load the workspaces

  }

  onunload() {
    // TODO: Remove event listeners
  }
}

