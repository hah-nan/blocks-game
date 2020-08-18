import gridUtil from '../../utils/grid.js'
// import collisionsUtil from '../../utils/collisionsUtil.js'

function getInventoryName(object) {
  if(object.name) {
    return object.name
  }

  if(object.subObjectName) {
    return object.subObjectName
  }

  return object.id
}

function pickupObject(hero, collider) {
  let subObject = _.cloneDeep(collider.mod())

  // subObject.id = 'pickupable-'+window.uniqueID()

  // const name = getInventoryName(subObject)

  if(!subObject.subObjectName) subObject.subObjectName = subObject.id

  if(hero.subObjects && hero.subObjects[subObject.subObjectName] && !collider.tags.stackable) {
    window.socket.emit('sendNotification', { heroId: hero.id, toast: true, log: true, text: 'You can\'t pick this up. You already have a ' + subObject.subObjectName})
    return
  }

  if(!collider.mod().tags['dontDestroyOnPickup']) {
    collider._remove = true
    collider._delete = true
  }

  subObject.inInventory = true
  if(subObject.tags.onMapWhenEquipped) {
    subObject.removed = true
  } else {
    subObject.tags.potential = true
  }

  hero.interactableObject = null
  hero.interactableObjectResult = null
  if(subObject.tags['equipOnPickup']) {
    subObject.isEquipped = true
    window.local.emit('onHeroEquip', hero, subObject)
  }

  // window.local.emit('onHeroPickup', hero, subObject)
  delete subObject.subObjects

  let message = 'You picked up ' + subObject.subObjectName
  if(subObject.count > 1) {
    message = 'You picked up ' + subObject.count + ' ' + subObject.subObjectName
  }
  window.socket.emit('sendNotification', { heroId: hero.id, toast: true, log: true, text: message})
  window.local.emit('onAddSubObject', hero, subObject, subObject.subObjectName )
}

function dropObject(hero, subObject, dropAmount = 1) {
  let object = _.cloneDeep(subObject.mod())

  let subObjectStillHasCount = false
  if(subObject.tags.stackable) {
    let newSubObjectCount = subObject.count - dropAmount
    subObject.count -= dropAmount
    if(newSubObjectCount >= 1) {
      subObjectStillHasCount = true
    }
    object.id = 'stackable-' + window.uniqueID()
    object.count = dropAmount
  }

  object.removed = false
  object.tags.potential = false
  object.tags.subObject = false
  delete object.inInventory
  delete object.isEquipped
  delete object.ownerId

  const {x, y} = gridUtil.snapXYToGrid(object.x, object.y)
  object.x = x
  object.y = y


  // if(object.tags.stackable) {
  //   collisionsUtil.check(object, GAME.objects.filter(({subObjectName}) => {
  //     return subObjectName && subObjectName == object.subObjectName
  //   }))
  // }

  // window.local.emit('onHeroDrop', hero, object)

  if(!subObjectStillHasCount) {
    hero.interactableObject = null
    hero.interactableObjectResult = null
    window.socket.emit('deleteSubObject', hero, subObject.subObjectName)
  }

  let message =  'You dropped ' + object.subObjectName
  if(object.count > 1) {
    message = 'You dropped ' + object.count + ' ' + object.subObjectName
  }
  window.socket.emit('sendNotification', { heroId: hero.id, toast: true, log: true, text: message})
  window.socket.emit('addObjects', [object])
}

function withdrawFromInventory(withdrawer, owner, subObjectName, withdrawAmount) {
  const subObject = owner.subObjects[subObjectName]
  const newObject = _.cloneDeep(subObject)

  if(withdrawer.tags.hero && withdrawer.subObjects && withdrawer.subObjects[subObject.subObjectName] && !collider.tags.stackable) {
    window.socket.emit('sendNotification', { heroId: withdrawer.id, toast: true, log: true, text: 'You can\'t withraw. You already have a ' + subObject.subObjectName})
    return
  }

  let subObjectStillHasCount = false
  if(subObject.tags.stackable) {
    subObject.count -= withdrawAmount
    if(subObject.count >= 1) {
      subObjectStillHasCount = true
    }
    newObject.count = withdrawAmount
    newObject.id = 'stackable-' + window.uniqueID()
  }
  delete newObject.isEquipped
  newObject.inInventory = true

  if(!subObjectStillHasCount) {
    owner.interactableObject = null
    owner.interactableObjectResult = null
    window.socket.emit('deleteSubObject', owner, subObjectName)
  }

  if(withdrawer.tags.hero) {
    let message =  'You withdrew ' + newObject.subObjectName
    if(newObject.count > 1) {
      message = 'You withdrew ' + newObject.count + ' ' + newObject.subObjectName
    }
    window.socket.emit('sendNotification', { heroId: withdrawer.id, toast: true, log: true, text: message})
  }

  if(owner.tags.hero) {
    let message =  'You deposited ' + newObject.subObjectName
    if(newObject.count > 1) {
      message = 'You deposited ' + newObject.count + ' ' + newObject.subObjectName
    }
    window.socket.emit('sendNotification', { heroId: owner.id, toast: true, log: true, text: message})
  }

  window.local.emit('onAddSubObject', withdrawer, newObject, subObjectName)
}

function depositToInventory(depositor, retriever, subObjectName, amount) {

}

export {
  pickupObject,
  dropObject,
  withdrawFromInventory,
  depositToInventory,
}
