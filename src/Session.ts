import * as crypto from 'crypto'
import { Notice, TFile, Workspace } from "obsidian"

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
  private layout: any // TODO: Save position of side panels, save active leaf

  nameInitializationCallback: () => void // TODO: Make this better; not global. It is global because nameInitializer is linked to an event listener and can not accept a callbackk in its arguements

  constructor ({ workspace, defaultSessionLayout, defaultName }: { workspace: Workspace; defaultSessionLayout: any; defaultName: string }) {
    this.workspace = workspace
    this.name = defaultName
    this.layout = defaultSessionLayout
  }

  initializeName = (callback: () => void) => {
    this.nameInitializationCallback = callback
    this.workspace.on('file-open', this.nameInitializer)
  }

  private nameInitializer = (firstFile: TFile) => {
    // !file occurs on the first call to this function;  // TODO: Handle changing workspaces
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
    this.workspace.off('file-open', this.nameInitializer)

    this.nameInitializationCallback() // This should not be undefined
  }

  loadWorkspace = () => {
    if (this.layout) {
      this.workspace.changeLayout(this.layout)
    } else { // Indicating the the default layout has not been changed; still null
      this.workspace.detachLeavesOfType("markdown") // TODO: have the user define a default workspace; this would allow someboyd like you to reset to the flow note
    }

    if (this.defaultName) {
      this.initializeName(this.nameInitializationCallback)
    }

    this.workspace.on("layout-change", this.workspaceLayoutUpdater)
    this.workspace.on("file-open", this.workspaceLayoutUpdater)
    this.workspace.on("editor-change", this.workspaceLayoutUpdater)

  }

  private workspaceLayoutUpdater = () => {
    this.layout = this.workspace.getLayout()
    new Notice(`"${this.name}" updated`)
  }

  cleanUp = () => {
    this.workspace.off("layout-change", this.workspaceLayoutUpdater)
    this.workspace.off("file-open", this.workspaceLayoutUpdater)
    this.workspace.off("editor-change", this.workspaceLayoutUpdater)

    this.workspace.off("file-open", this.nameInitializer)


    // this.workspace.detachLeavesOfType("markdown") // TODO: have the user define a default workspace; this would allow someboyd like you to reset to the flow note
  }

}
