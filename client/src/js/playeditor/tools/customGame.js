function init() {
  var saveCustomGameFx = document.getElementById("save-custom-fx");
  saveCustomGameFx.addEventListener('click', () => {
    window.saveCodeEditor()
  })

  var resetCustomGameFx = document.getElementById("reset-custom-fx");
  resetCustomGameFx.addEventListener('click', () => {
    window.resetCodeEditor()
  })


  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/monokai");
  editor.session.setMode("ace/mode/javascript");
  // editor.resize()
  editor.setValue(window.templateGameString);
  editor.setOptions({
    fontSize: "20pt",
  });
  window.customGameEditor = editor
  window.customGameEditor.session.on('change', function(delta) {
    document.getElementById("is-code-editor-saved").innerHTML = "Not saved"
  });

  let codeEditorStorage = localStorage.getItem('codeEditor')
  if(codeEditorStorage !== 'null' && codeEditorStorage !== 'undefined' && codeEditorStorage) {
    editor.setValue(localStorage.getItem('codeEditor'));
  }

  window.saveCodeEditor = function() {
    try {
      let customFx = window.customGameEditor.getValue()
      eval('(function a() {' + customFx + ' return { init, loaded, start, onKeyDown, input, onCollide, intelligence, update, render } })')
      window.liveCustomGame = customFx
      window.socket.emit('updateCustomGameFx', customFx)
      localStorage.setItem('codeEditor', customFx)
    } catch (e) {
      console.log(e)
      document.getElementById("is-code-editor-saved").innerHTML = "THERE WAS AN ERROR IN FX CODE"
    }

  }

  window.resetCodeEditor = function() {
    window.customGameEditor.setValue(window.templateGameString);
    localStorage.setItem('codeEditor', null)
  }
}

export default {
  init
}
