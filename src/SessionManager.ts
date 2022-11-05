import { Notice, Workspace } from "obsidian"
import { Session } from "./Session"


export class SessionManager {
  public readonly sessions = new Map<string, Session>()
  private readonly sessionChangeObservers: Array<() => void> = []
  private readonly workspace: Workspace
  private activeSessionId: string

  constructor(workspace: Workspace) {
    this.workspace = workspace
    // TODO: Restore saved sessions
    // TODO: Load saved default or previously active
  }

  public createAndLoadSession = (): Session => {
    this.sessions.get(this.activeSessionId)?.cleanUp()

    const newSession = new Session(
            this.workspace,
            null,
            'New Session'
    )

    this.sessions.set(newSession.id, newSession)
    this.activeSessionId = newSession.id

    // Updating observer on the new changes!! Exciting!!
    this.callUpdateSubscriptionObservers()
    newSession.initializeName(this.callUpdateSubscriptionObservers)
    newSession.loadWorkspace() // Loads the default workspace

    return newSession
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

  public changeActiveSessionName = (name: string) => {
    const activeSession = this.sessions.get(this.activeSessionId)
    if (!activeSession) {
      new Notice("No Active Session")
      return
    }

    activeSession.name = name
    this.callUpdateSubscriptionObservers()
    activeSession.defaultName = false
  }

  private getSessionFromActive = (direction: number): Session | undefined => {
    const ids = [...this.sessions.keys()]
    const activeSessionIndex = ids.indexOf(this.activeSessionId)
    const newSession = this.sessions.get(ids[activeSessionIndex + direction])

    return newSession
  }

  public nextSession = () => {
    const s = this.getSessionFromActive(1)
    if (!s) {
      new Notice("No Next Session")
      return
    }
    this.changeSession(s)
  }

  public previousSession = () => {
    const s = this.getSessionFromActive(-1)
    if (!s) {
      new Notice("No Previous Session")
      return
    }
    this.changeSession(s)
  }

  public killSession = (sessionId: string) => {
    if (sessionId == this.activeSessionId) {
      // Switch sessions
      const sleft = this.getSessionFromActive(-1)
      if (sleft) {
        this.changeSession(sleft)
      } else {
        const sright = this.getSessionFromActive(1)
        if (sright) {
          this.changeSession(sright)
        } else {
          this.createAndLoadSession()
        }
      }
    }

    this.sessions.delete(sessionId)
    this.callUpdateSubscriptionObservers()
  }

  public killActiveSession = () => {
    this.killSession(this.activeSessionId)
  }
}
