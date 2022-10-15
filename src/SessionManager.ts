import { Notice, Workspace, WorkspaceLeaf } from "obsidian"
import { Session } from "./Session"

export class SessionManager {
  public readonly sessions = new Map<string, Session>()
  private readonly sessionChangeObservers: Array<() => void> = new Array()
  private readonly workspace: Workspace
  private activeSessionId: string

  constructor(workspace: Workspace) {
    this.workspace = workspace
    // TODO: Restore saved sessions
    // TODO: Load saved default or previously active
  }

  public createAndLoadSession = (): Session => {

    this.sessions.get(this.activeSessionId)?.cleanUp()

    let newSession = new Session( {
      workspace: this.workspace,
      defaultSessionLayout: null,
      defaultName: `Session (${[...this.sessions.values()].length + 1})` 
    })

    this.sessions.set(newSession.id, newSession)
    this.activeSessionId = newSession.id

    // Updating observer on the new changes!! Exciting!!
    this.callUpdateSubscriptionObservers()
    newSession.initializeName(this.callUpdateSubscriptionObservers)
    newSession.loadWorkspace() // Loads the default workspace

    return newSession
  }

  // TODO: Change session name

  public changeActiveSessionName = (name: string) => {
    let activeSession = this.sessions.get(this.activeSessionId)
    if (!activeSession) {
      new Notice("No Active Session")
      return
    }

    activeSession.name = name
    this.callUpdateSubscriptionObservers()
    activeSession.defaultName = false
  }

  public changeSession = (newSession: Session) => {
    // TODO: Check that session exists; or figure out better way
    this.sessions.get(this.activeSessionId)?.cleanUp()
    this.activeSessionId = newSession.id
    newSession.loadWorkspace()

    this.callUpdateSubscriptionObservers()
  }

  private callUpdateSubscriptionObservers = () => {
    this.sessionChangeObservers.forEach(callback => callback())
  }

  public sessionUpdateSubscription = (observer: () => void) => {
    this.sessionChangeObservers.push(observer)
  }

  public checkSessionActive(session: Session) {
    if (session.id == this.activeSessionId) return true
    else return false
  }


  // TODO: const nextWorkspace()
  // TODO: const previousWorkspace()
}
