package expo.modules.mudracamera

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MudraCameraModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MudraCamera")

    View(MudraCameraView::class) {
      Events("onAIStatusChange")

      Prop("mudraId") { view: MudraCameraView, id: String ->
        view.setMudraId(id)
      }
    }
  }
}