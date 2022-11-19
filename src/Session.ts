import * as crypto from 'crypto'
import { EditorRange, MarkdownView, Notice, TFile, Workspace } from "obsidian"

/**
A group of related obsidian leafs
*/
export class Session {
  readonly id = crypto.randomBytes(10).toString("hex")
  /** When a workspace is initialized, it will be given a default name of Workspace ([workspace index]); this propety idicates if the workspace still has that name */
  defaultName = true

  name: string
  private workspace: Workspace

  /** Obsidian workspace layout */
  private layout: unknown 

  private lineNumber: number
  private character: number

  nameInitializationCallback: () => void // TODO: Make this better; not global. It is global because nameInitializer is linked to an event listener and can not accept a callbackk in its arguements

  constructor (workspace: Workspace, defaultSessionLayout: unknown, defaultName: string) {
    this.workspace = workspace
    this.name = defaultName
    this.layout = defaultSessionLayout
  }


  loadWorkspace = () => {
    if (this.layout) { // If there is a saved layout
      this.workspace.changeLayout(this.layout)
    } else { // Indicating the the default layout has not been changed; still null as assigned from SessionManager
      this.workspace.detachLeavesOfType("markdown") 
    }
    // Because the file does not open right when the workspace is switched, I need to open in on the file change
    this.workspace.on('file-open', this.loadCursorPosition)
  }

  /** Will initiate renaming the session to the first opened file */
  initializeName = (callback: () => void) => {
    this.nameInitializationCallback = callback // Sets this so the nameInitializer will be able to access it. This is confusing because I want to use nameInitializer as a references for the workspace.off function, so I am not giving it parameters. 

    const compose = async (file: TFile) => {
      if (!file) return // Somehow prevents lazy evaluation, which turns off the event listener before the function is called? WTF javascript. 
      this.nameInitializer(file)
      this.workspace.off("file-open", compose)
      callback()
    }

    this.turnOffNameInitializer = () => this.workspace.off("file-open", compose)
    this.workspace.on('file-open', compose)
  }

  /** This function is definied by the initialze name function, and at first is undefined. */
  private turnOffNameInitializer: (() => void) | null

  private nameInitializer = (firstFile: TFile, callback: () => void) => {
    if (!firstFile) {
      return
    }

    // precaution incase the event gets called twice before it finishes or name is changed by user before being automatically set
    if (!this.defaultName) {
      this.workspace.off('file-open', this.nameInitializer)
      return 
    }

    this.name = firstFile.name
    this.defaultName = false

    new Notice(`New workspace Renamed to: "${this.name}"`)

    // Killing the event listener
    // this.workspace.off('file-open', this.nameInitializer)

  }

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

  cleanUp = () => {
    // Referenced in the loadWorkspace function, the loadCursor will be run when the first file is opened. When the workspace is closed, this listener needs to be turned off. 
    this.workspace.off('file-open', this.loadCursorPosition)

    // Saving the state of the workspace
    this.workspaceLayoutUpdater()

    // Stopping the name initialzation function
    if (this.turnOffNameInitializer) this.turnOffNameInitializer()

    // Saving the cursor position to be loaded at the next loadWorkspace call
    this.saveCursorPosition()
  }

}
