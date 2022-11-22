import * as crypto from 'crypto'
import { EditorRange, MarkdownView, Notice, TFile, Workspace } from "obsidian"

/**
A group of related obsidian leafs
*/
export abstract class Session {
  public id: string

  name: string
  protected workspace: Workspace

  /** Obsidian workspace layout */
  protected layout: unknown 


  constructor (workspace: Workspace, defaultSessionLayout: unknown, defaultName: string, id?: string) {
    this.workspace = workspace
    this.name = defaultName
    this.layout = defaultSessionLayout
    this.id = id? id : crypto.randomBytes(10).toString("hex")
  }


  public abstract loadSession: () => Promise<void>
  public abstract cleanUp: () => Promise<void>
}

export class DefaultSessionState extends Session {
  private activeSession: boolean

  /** Will initiate renaming the session to the first opened file */
  initializeName = async (): Promise<WorkingSessionState | null> => {


    const activeSession = () => this.activeSession // When accesing this var from the thread, the thread needs the most updated value, not the saved value. Needs to be lazy loaded

    const workspace = this.workspace
    const file: TFile = await new Promise(resolve => {
      workspace.on("file-open", function(file: TFile) {
        if (!activeSession() || !file) return // If the session has changed
        workspace.off("file-open", this)
        resolve(file)
      })
    })


    if (!activeSession()) return null // If the session has changed 

    const name = file.name
    new Notice(`New workspace Renamed to: "${name}"`)

    // After Default session is renamed, it becomes a working session, so working state

    const nextState = new WorkingSessionState(this.workspace, this.layout, name, this.id)
    return nextState
  }

  loadSession = async () => {
    if (this.layout) {
      await this.workspace.changeLayout(this.layout)
    } else {
      this.workspace.detachLeavesOfType("markdown") 
    }
    this.activeSession = true
  }

  cleanUp = async () => {
    this.activeSession = false
  }

  changeName = (name: string, callback?: () => void): WorkingSessionState => {
    const workingSession = new WorkingSessionState(this.workspace, this.layout, name, this.id)
    if (callback) callback()
    return workingSession
  }

}

export class WorkingSessionState extends Session {

  constructor(workspace: Workspace, workingSessionLayout: unknown, name: string, id?: string) { 
    super (workspace, workingSessionLayout, name, id)
  }

  private lineNumber: number
  private character: number

  private saveCursorPosition = () => {
    const view = this.workspace.getActiveViewOfType(MarkdownView)
    if (!view) {
      return
    } 


    const cursor = view.editor.getCursor()
    this.lineNumber = cursor.line
    this.character = cursor.ch
  }

  public loadCursorPosition = () => {
    const view = this.workspace.getActiveViewOfType(MarkdownView)
    if (!view) {
      return
    }

    view.editor.setCursor(this.lineNumber, this.character)

    const editorRange: EditorRange = {
      from: view.editor.getCursor(),
      to: view.editor.getCursor()
    }

    view.editor.scrollIntoView(editorRange, true)

    this.workspace.off("file-open", this.loadCursorPosition)
  } 

  private workspaceLayoutUpdater = () => {
    this.layout = this.workspace.getLayout()
  }

  loadSession = async () => {
    await this.workspace.changeLayout(this.layout)

    // Because the file does not open right when the workspace is switched, I need to open in on the file change
    this.workspace.on('file-open', this.loadCursorPosition)
  }

  changeName = (name: string, callback: () => void) => {
    this.name = name
    callback()
  }

  cleanUp = async () => {
    // Referenced in the loadWorkspace function, the loadCursor will be run when the first file is opened. When the workspace is closed, this listener needs to be turned off. 
    this.workspace.off('file-open', this.loadCursorPosition)

    // Saving the state of the workspace
    this.workspaceLayoutUpdater()

    // Saving the cursor position to be loaded at the next loadWorkspace call
    this.saveCursorPosition()
  }
}

