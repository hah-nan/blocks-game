import React from 'react';
import DatGui, { DatBoolean, DatColor, DatNumber, DatString } from 'react-dat-gui';

export default class PhysicsLive extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
          objectSelected: this.props.objectSelected
        }
        this.handleUpdate = this.handleUpdate.bind(this)
    }

    // Update current state with changes from controls
    handleUpdate(newData) {
      const { objectSelected } = this.state
      const id = objectSelected.id

      this.setState({
        objectSelected: {...objectSelected, ...newData}
      })

      const updatedProps = {
        speed: newData.speed,
        jumpVelocity: newData.jumpVelocity,
        velocityMax: newData.velocityMax
      }

      if(PAGE.role.isHost) {
        Object.assign(OBJECTS.getObjectOrHeroById(id), updatedProps)
      } else {
        if(objectSelected.tags.hero) {
          window.socket.emit('editHero', { id, ...updatedProps})
        // }
        // else if(objectSelected.tags.subObject) {
        // window.socket.emit('editSubObject', objectSelected.ownerId, objectSelected.subObjectName, updatedProps)
        } else {
          window.socket.emit('editObjects', [{ id, ...updatedProps }])
        }
      }
    }

    render() {
        const { objectSelected } = this.state;
        return (
            <div className='PhysicsLive'>
              <DatGui data={objectSelected} onUpdate={this.handleUpdate}>
                <div className="LiveEditor__title">Live Physics Editor</div>
                <DatNumber path='speed' label='Speed' min={0} max={1000} step={1} />
              </DatGui>
            </div>
        )
    }
}
