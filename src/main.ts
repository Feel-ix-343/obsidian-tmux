import { Menu, Notice, Plugin } from 'obsidian';
import { ChangeNameModal } from './ChangeNameModal';
import { SessionManager } from './SessionManager';


export default class ObsidianTmux extends Plugin {
  /** Workspaces indexed by id */
  sessionManager: SessionManager

  onload = async () => {
    this.sessionManager = new SessionManager(this.app.workspace)


    const createNewSession = async () => {
      const newSession = await this.sessionManager.createAndLoadSession()
      new Notice(`Session "${newSession.name}" created`)
    }
    this.addCommand({
      id: "create-session",
      name: "Create Blank Session",
      hotkeys: [{modifiers: ["Mod", "Shift"], key: "c"}],
      callback: createNewSession
    })

    const changeActiveSessionName = () => {
      new ChangeNameModal(this.app, (name) => {
        this.sessionManager.changeActiveSessionName(name)
      }).open()
    }
    this.addCommand({
      id: "change-name",
      name: "Rename Active Session",
      hotkeys: [{modifiers: ["Mod", "Shift"], key: ","}],
      callback: changeActiveSessionName
    })

    this.addCommand({
      id: "next-session",
      name: "Go To Next Session",
      hotkeys: [{modifiers: ["Mod", "Shift"], key: "n"}],
      callback: this.sessionManager.nextSession
    })

    this.addCommand({
      id: "previous-session",
      name: "Go To Previous Session",
      hotkeys: [{modifiers: ["Mod", "Shift"], key: "p"}],
      callback: this.sessionManager.previousSession
    })

    this.addCommand({
      id: "kill-active-session",
      name: "Kill Active Session",
      hotkeys: [{modifiers: ["Mod", "Shift"], key: "x"}],
      callback: this.sessionManager.killActiveSession
    })

    this.addCommand({
      id: "set-default-session",
      name: "Set Default Session",
      callback: this.sessionManager.setDefaultWorkspace
    })
     

    const sessionsDisplay = this.addStatusBarItem()

    const sessionsDisplayContainer = sessionsDisplay.createDiv({cls: "session_display_container"})

    this.sessionManager.sessionUpdateSubscription(() => {
      sessionsDisplayContainer.querySelectorAll(".session_display_element").forEach(node => node.remove())
      sessionsDisplayContainer.querySelectorAll(".session_close_button").forEach(node => node.remove())

      const sessions = [...this.sessionManager.sessions.values()]

      sessions.forEach(session => {
        sessionsDisplayContainer.createEl(
          "div", 
          { text: session.name, cls: ["session_display_element status-bar-item mod-clickable"] },
          (el) => {
            if (this.sessionManager.checkSessionActive(session)) { 
              el.classList.add("hovered") 
            }
            el.oncontextmenu = (ev) => {
              ev.preventDefault()
              const menu = new Menu()
              menu.addItem((item) => {
                item
                  .setTitle(`Kill Session "${session.name}"`)
                  .setIcon("x-circle")
                  .onClick(() => {
                    this.sessionManager.killSession(session.id)
                    new Notice("Session Killed")
                  })
              })

              menu.showAtMouseEvent(ev)
            }

            el.onclick = () => this.sessionManager.changeSession(session)
          }
        );
      })
    })

    sessionsDisplay.appendChild(sessionsDisplayContainer)




    // Event listener will response to use input to load the workspaces

  }

  onunload() {
    // TODO: Remove event listeners
  }
}

