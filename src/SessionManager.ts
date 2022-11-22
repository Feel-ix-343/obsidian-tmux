import { Notice, Workspace } from "obsidian"
import { DefaultSessionState, Session, WorkingSessionState } from "./Session"


export class SessionManager {
  public readonly sessions = new Map<string, Session>()
  private readonly sessionChangeObservers: Array<() => void> = []
  private readonly workspace: Workspace

  private defaultWorkspace = null

  private activeSessionId: string // GLOBAL MUTABLE VARIABLE ALERT DONT HURT ME

  constructor(workspace: Workspace) {
    this.workspace = workspace
    // TODO: Restore saved sessions
  }

  public setDefaultWorkspace = () => {
    this.defaultWorkspace = this.workspace.getLayout()
    new Notice("Default Session Set")
  }

  public createAndLoadSession = async (): Promise<Session> => {
    this.sessions.get(this.activeSessionId)?.cleanUp()

    const newDefaultSession = new DefaultSessionState(
      this.workspace,
      this.defaultWorkspace,
      'New Session',
    )

    this.sessions.set(newDefaultSession.id, newDefaultSession)
    this.activeSessionId = newDefaultSession.id

    // Updating observer on the new changes!! Exciting!!
    this.callUpdateSubscriptionObservers()
    // newDefaultSession.initializeName(this.callUpdateSubscriptionObservers)

    await newDefaultSession.loadSession() // Loads the default workspace

    newDefaultSession.initializeName().then(workingSession => {
      if (workingSession) { 
        this.sessions.set(this.activeSessionId, workingSession)
        this.callUpdateSubscriptionObservers()
      }
    })

    return newDefaultSession
  }

  public changeSession = (newSession: Session) => {
    this.sessions.get(this.activeSessionId)?.cleanUp()
    this.activeSessionId = newSession.id

    newSession.loadSession()

    if (newSession instanceof DefaultSessionState) {
      newSession.initializeName().then(workingSession => {
        if (workingSession) { 
          this.sessions.set(this.activeSessionId, workingSession)
          this.callUpdateSubscriptionObservers()
        }
      })
    }

    this.callUpdateSubscriptionObservers()
  }

  private callUpdateSubscriptionObservers = () => {
    this.sessionChangeObservers.forEach(callback => callback())
  }

  public sessionUpdateSubscription = (observer: () => void) => {
    this.sessionChangeObservers.push(observer)
  }

  public checkSessionActive = (session: Session) => {
    if (session.id == this.activeSessionId) return true
    else return false
  }

  public changeActiveSessionName = (name: string) => {
    const activeSession = this.sessions.get(this.activeSessionId)
    if (!activeSession) {
      new Notice("No Active Session")
      return
    }

    if (activeSession instanceof DefaultSessionState) {
      this.sessions.set(this.activeSessionId, activeSession.changeName(name, this.callUpdateSubscriptionObservers))
    } else if (activeSession instanceof WorkingSessionState) {
      activeSession.changeName(name, this.callUpdateSubscriptionObservers)
    }
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
