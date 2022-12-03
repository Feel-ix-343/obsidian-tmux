import { Notice, Workspace } from "obsidian"
import { DefaultSessionState, Session, WorkingSessionState } from "./Session"

  /** I guess this is like a mini session manager, but it only interacts with the sessions map. I made it for DRY && to reduce global mutable state
  */
class Sessions {
  public readonly sessions = new Map<string, Session>()
  public activeSessionId: string

  constructor(sessions: Map<string, Session>) {
    this.sessions = sessions
  }

  public updateActiveSession = (session: Session, callback?: () => void) => {
    this.sessions.set(session.id, session)
    this.activeSessionId = session.id
    if (callback) callback()
  }

  public getActiveSession = () => {
    return this.sessions.get(this.activeSessionId)
  }
}

export class SessionManager {
  private readonly workspace: Workspace

  private defaultWorkspace = null

  private readonly sessionChangeObservers: Array<() => void> = []
  private callUpdateSubscriptionObservers = () => {
    this.sessionChangeObservers.forEach(callback => callback())
  }

  public readonly sessions = new Sessions(new Map<string, Session>())

  constructor(workspace: Workspace) {
    this.workspace = workspace
    // TODO: Restore saved sessions
  }

  public setDefaultWorkspace = () => {
    this.defaultWorkspace = this.workspace.getLayout()
    new Notice("Default Session Set")
  }

  public createAndLoadSession = async (): Promise<Session> => {
    await this.sessions.getActiveSession()?.cleanUp()

    const newDefaultSession = new DefaultSessionState(
      this.workspace,
      this.defaultWorkspace,
      'New Session',
    )

    this.sessions.updateActiveSession(newDefaultSession, this.callUpdateSubscriptionObservers)

    await newDefaultSession.loadSession() // Loads the default workspace

    newDefaultSession.initializeName().then(workingSession => {
      if (workingSession) { 
        this.sessions.updateActiveSession(workingSession, this.callUpdateSubscriptionObservers)
      }
    })

    return newDefaultSession
  }

  public changeSession = async (newSession: Session) => {
    await this.sessions.getActiveSession()?.cleanUp()
    this.sessions.updateActiveSession(newSession, this.callUpdateSubscriptionObservers)
    await newSession.loadSession()

    if (newSession instanceof DefaultSessionState) {
      newSession.initializeName().then(workingSession => {
        if (workingSession) { 
          this.sessions.updateActiveSession(workingSession, this.callUpdateSubscriptionObservers)
        }
      })
    }
  }


  public sessionUpdateSubscription = (observer: () => void) => {
    this.sessionChangeObservers.push(observer)
  }

  public checkSessionActive = (session: Session) => {
    return session === this.sessions.getActiveSession()
  }

  public changeActiveSessionName = (name: string) => {
    const activeSession = this.sessions.getActiveSession()
    if (!activeSession) {
      new Notice("No Active Session")
      return
    }

    if (activeSession instanceof DefaultSessionState) {
      this.sessions.updateActiveSession(activeSession.changeName(name), this.callUpdateSubscriptionObservers)
    } else if (activeSession instanceof WorkingSessionState) {
      activeSession.changeName(name, this.callUpdateSubscriptionObservers)
    }
  }

  private getSessionFromActive = (direction: number): Session | undefined => {
    const ids = [...this.sessions.sessions.keys()]
    const activeSession = this.sessions.getActiveSession()
    if (!activeSession) return undefined
    const activeSessionIndex = ids.indexOf(activeSession.id)
    const newSession = this.sessions.sessions.get(ids[activeSessionIndex + direction])

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
    if (sessionId == this.sessions.getActiveSession()?.id) {
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

    this.sessions.sessions.delete(sessionId)
    this.callUpdateSubscriptionObservers()
  }

  public killActiveSession = () => {
    const activeSession = this.sessions.getActiveSession()
    if (!activeSession) return null
    this.killSession(activeSession.id)
  }

  public moveCurrentNoteToNewWorkspace = async () => {
    // TODO: Simplfy the creation process

    // Save the current file
    const activeFile = this.workspace.getActiveFile()
    if (!activeFile) {
      new Notice("No Active File")
      return
    }

    this.workspace.getLeaf(false).detach() // If a file is open, then the leaf will be active. This leaf needs to be closed

    // Close the current workspace
    await this.sessions.getActiveSession()?.cleanUp()

    // Creating and loading a new session
    const newSession = new DefaultSessionState(this.workspace, null, "opening file...")
    this.sessions.updateActiveSession(newSession, this.callUpdateSubscriptionObservers)

    await newSession.loadSession()

    // Open the new file
    this.workspace.getMostRecentLeaf()?.openFile(activeFile) // This should implicitly update the session created above. 

    const newWorkingSession = newSession.changeName(activeFile.name)
    this.sessions.updateActiveSession(newWorkingSession, this.callUpdateSubscriptionObservers)
  }
}
