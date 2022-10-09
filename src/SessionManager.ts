import { Workspace } from "obsidian"
import { Session } from "./Session"

export class SessionManager {
  public readonly sessions = new Map<string, Session>()
  private readonly sessionChangeObservers: Array<() => void> = new Array()
  private activeSessionId: string
  private readonly workspace: Workspace

  constructor(workspace: Workspace) {
    this.workspace = workspace
    // TODO: Restore saved sessions
    // TODO: Load saved default or previously active
  }

  public createAndLoadSession = (): Session => {

    this.sessions.get(this.activeSessionId)?.cleanUp()

    console.log("cleanedup")

    this.workspace.detachLeavesOfType("markdown") // TODO: have the user define a default workspace; this would allow someboyd like you to reset to the flow note

    let newSession = new Session(
      this.workspace,
      this.workspace.getLayout(),
      `Session (${[...this.sessions.values()].length + 1})`
    )

    this.sessions.set(newSession.id, newSession)
    this.activeSessionId = newSession.id

    // Updating observer on the new changes!! Exciting!!
    this.callUpdateSubscriptionObservers()
    newSession.initializeName(this.callUpdateSubscriptionObservers)
    newSession.loadWorkspace() // Although there is nothing to load, the event listeners will be started from this function call

    return newSession
  }

  // TODO: Change session name

  public changeSession = (newSession: Session) => {
    // TODO: Check that session exists; or figure out better way
    this.sessions.get(this.activeSessionId)?.cleanUp()
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
