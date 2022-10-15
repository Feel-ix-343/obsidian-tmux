import { App, Modal, Setting } from "obsidian";

export class ChangeNameModal extends Modal {
  result: string;
  onSubmit: (result: string) => void;

  constructor(app: App, onSubmit: (result: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    const submit = () => {
      this.close()
      this.onSubmit(this.result)
    }

    this.titleEl.setText("Rename Session")


    let s = new Setting(contentEl)
      .addText((text) => 
         text
           .setPlaceholder("New Name")
           .onChange((value) => {
             this.result = value
           })
           .inputEl.addClass("change-name-input")
        )
      .addButton((btn) => 
        btn
          .setButtonText("Save")
          .setCta()
          .onClick(submit)
        )

    s.infoEl.remove()

    contentEl.addEventListener("keypress", (ev) => {
      if (ev.key == "Enter") {
        submit()
      }
    })

  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
