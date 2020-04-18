import heroModifiers from '../../games/default/compendium/heroCompendium.js'
import camera from '../camera.js'
import collisions from '../../collisions'
import gridTool from '../../grid.js'
import JSONEditor from 'jsoneditor'

function init() {
  window.editingHero = {
    id: null,
  }
  var herojsoneditor = document.createElement("div")
  herojsoneditor.id = 'herojsoneditor'
  document.getElementById('tool-'+TOOLS.HERO_EDITOR).appendChild(herojsoneditor);
  window.heroeditor = new JSONEditor(herojsoneditor, { modes: ['tree', 'code'], search: false, onChangeJSON: (object) => {
    if(window.editingGame.branch) {
      w.editingGame.hero = object
    } else {
      sendHeroUpdate({ tags: object.tags, flags: object.flags })
    }
  }});

  let el =document.getElementsByClassName("hero-modifier-select");  // Find the elements
  for(var i = 0; i < el.length; i++){
    for(let modifierName in heroModifiers) {
      let modEl = document.createElement('button')
      modEl.innerHTML = modifierName
      modEl.onclick= function() {
        if(window.currentTool === window.TOOLS.HERO_EDITOR) {
          let editorState = window.objecteditor.get()
          window.objecteditor.update( window.mergeDeep( editorState, JSON.parse(JSON.stringify(heroModifiers[modifierName])) ) )
          sendHeroUpdate(heroModifiers[modifierName])
        } else {
          let editorState = window.objecteditor.get()
          window.objecteditor.saved = false
          window.objecteditor.update( window.mergeDeep( editorState, { tags: { heroUpdate: true }}, { heroUpdate: JSON.parse(JSON.stringify(heroModifiers[modifierName])) } ) )
          window.updateObjectEditorNotifier()
        }
      }
      el[i].appendChild(modEl)
    }
  }

  var sendHeroButton = document.getElementById("send-hero")
  sendHeroButton.addEventListener('click', sendEditorHeroOther)
  var sendHeroPosButton = document.getElementById("send-hero-pos")
  sendHeroPosButton.addEventListener('click', sendEditorHeroPos)
  var findHeroButton = document.getElementById("find-hero");
  findHeroButton.addEventListener('click', () => {
    window.findHero()
  })
  var respawnHeroButton = document.getElementById("respawn-hero");
  respawnHeroButton.addEventListener('click', respawnHero)
  var resetHeroButton = document.getElementById("reset-hero");
  resetHeroButton.addEventListener('click', resetHeroToDefault)
  var deleteButton = document.getElementById("delete-hero");
  deleteButton.addEventListener('click', () => {
    window.socket.emit('deleteHero', window.editingHero.id)
  })

  window.clickToSetHeroSpawnToggle = document.getElementById('click-to-set-spawn-hero')
  window.syncHeroToggle = document.getElementById('sync-hero')
  window.syncHeroToggle.onclick = (e) => {
    if(e.srcElement.checked) {
      window.socket.emit('updateWorld', { syncHero: true })
    } else {
      window.socket.emit('updateWorld', { syncHero: false })
    }
  }
  var zoomOutButton = document.getElementById("hero-zoomOut");
  zoomOutButton.addEventListener('click', () => window.socket.emit('editHero', { id: window.editingHero.id, zoomMultiplier: window.editingHero.zoomMultiplier + .1250 }))
  var zoomInButton = document.getElementById("hero-zoomIn");
  zoomInButton.addEventListener('click', () => window.socket.emit('editHero', { id: window.editingHero.id, zoomMultiplier: window.editingHero.zoomMultiplier - .1250 }))

  function sendHeroUpdate(update) {
    window.mergeDeep(window.editingHero, update)
    window.socket.emit('editHero', window.editingHero)
  }
  window.sendHeroUpdate = sendHeroUpdate

  function sendEditorHeroOther(update) {
    // get the hero from the editor, everything except for the x, y values
    let hero = window.heroeditor.get()
    const heroCopy = Object.assign({}, hero)
    delete heroCopy.x
    delete heroCopy.y
    window.socket.emit('editHero', heroCopy)
  }

  function sendEditorHeroPos() {
    let hero = window.heroeditor.get()
    window.socket.emit('editHero', { id: hero.id, x: hero.x, y: hero.y })
  }

  function respawnHero() {
    window.socket.emit('respawnHero', editingHero)
    // let hero = heroeditor.get()
    // window.socket.emit('updateHero', { id: hero.id, x: hero.spawnPointX, y: hero.spawnPointY })
  }
  function resetHeroToDefault() {
    window.socket.emit('resetHeroToDefault', editingHero)
  }

  window.setEditingHero = function(hero) {
    window.editingHero = hero
    window.heroeditor.update(window.editingHero)
    window.heroeditor.expandAll()
  }

  window.getEditingHero = function() {
    window.heroeditor.update(w.editingGame.heros[window.editingHero.id])
    window.heroeditor.expandAll()
  }

  window.findHero = function() {
    camera.setCamera(ctx, w.editingGame.heros[window.editingHero.id])
  }

  window.setEditorToAnyHero = function () {
    // init to any hero
    if(w.editingGame.heros.undefined) {
      window.socket.emit('deleteHero', 'undefined')
      delete w.editingGame.heros.undefined
    }

    if(w.editingGame.heros.null) {
      window.socket.emit('deleteHero', 'null')
      delete w.editingGame.heros.null
    }

    for(var heroId in w.editingGame.heros) {
      if(w.editingGame.heros[heroId].tags && w.editingGame.heros[heroId].tags.isPlayer) {
        window.setEditingHero(w.editingGame.heros[heroId])
        break;
      }
    }
  }

}

function loaded() {
  if(w.editingGame.world.syncHero) {
    window.syncHeroToggle.checked = true;
  }
}

export default {
  init
}
