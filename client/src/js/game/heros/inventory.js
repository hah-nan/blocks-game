function pickupObject(hero, collider) {
  let subObject = _.cloneDeep(collider.mod())

  let subObjectAlreadyExisted = false

  if(subObject.name && subObject.tags.stackable) {
    subObject.id = subObject.name
  } else {
    subObject.id = 'pickupable-'+window.uniqueID()
  }

  if(hero.subObjects[subObject.name]) {
    subObject = hero.subObjects[subObject.name]
    if(!subObject.count) subObject.count = 1
    subObject.count++
    subObjectAlreadyExisted = true
  }

  if(!collider.mod().tags['dontDestroyOnPickup']) {
    collider._destroy = true
    collider._destroyedBy = hero
  }

  subObject.inInventory = true

  if(!subObjectAlreadyExisted) {
    if(subObject.tags.appearWhenEquipped) {
      subObject.removed = true
    } else {
      subObject.tags.potential = true
    }
  }

  if(subObject.tags['equipOnPickup']) {
    subObject.isEquipped = true
    window.local.emit('onHeroEquip', hero, subObject)
  }

  // window.local.emit('onHeroPickup', hero, subObject)

  // dont add a new subObject
  if(subObjectAlreadyExisted) return

  hero.interactableObject = null
  hero.interactableObjectResult = null
  delete subObject.subObjects
  window.socket.emit('addSubObject', hero, subObject, subObject.id)
}

function dropObject(hero, subObject) {
  let subObjectStillHasCount = false
  if(subObject.tags.stackable && subobject.count >= 1) {
    subObject.count--
    subObjectStillHasCount = true
  }

  let object = _.cloneDeep(subObject.mod())

  object.id = 'object-' + window.uniqueID()
  object.removed = false
  object.tags.potential = false
  delete object.inInventory
  delete object.isEquipped

  // window.local.emit('onHeroDrop', hero, object)
  window.socket.emit('addObjects', [object])

  if(!subObjectStillHasCount) {
    hero.interactableObject = null
    hero.interactableObjectResult = null
    window.socket.emit('deleteSubObject', hero, subObject.subObjectName)
  }
}

export {
  pickupObject,
  dropObject,
}
