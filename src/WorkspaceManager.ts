import { Session } from "./Session"

export class WorkspaceManager {
  public readonly sessions = new Map<string, Session>()
  private readonly sessionChangeObservers: Array<() => void> = new Array()
  private activeSessionId: string

  constructor() {
    // TODO: Restore saved sessions
    // TODO: Load saved default or previously active
  }

  public createSession = (newSession: Session) => {
    newSession.initializeName(this.callUpdateSubscriptionObservers)

    this.changeSession(newSession)
  }

  // TODO: Change sessoin name

  public changeSession = (newSession: Session) => {
    this.sessions.get(this.activeSessionId)?.removeEventListerers()

    this.sessions.set(newSession.id, newSession)
    this.activeSessionId = newSession.id

    newSession.loadWorkspace()

    this.callUpdateSubscriptionObservers()
  }

  private callUpdateSubscriptionObservers = () => {
    console.log("updatign")
    this.sessionChangeObservers.forEach(callback => callback())
  }

  public sessionUpdateSubscription = (observer: () => void) => {
    console.log("Observer Added")
    this.sessionChangeObservers.push(observer)
  }

  // TODO: const nextWorkspace()
  // TODO: const previousWorkspace()
}
