/**
 * Default script for playground
 */
'use strict'

import React, {PropTypes as types} from 'react'
import {mount} from 'sg-react'
import {
  ApContainer,
  ApButton,
  ApBigButton,
  ApText,
  ApForm,
  ApSelectableArticle
} from 'apeman-react-basic'
import co from 'co'
import sugoCaller from 'sugo-caller'
import asleep from 'asleep'

const serialCommandCandidates = [
  '#PS07A000T010#PS07A180T010',
  '#PS09A000T010#PS09A180T010',
  '#PS11A000T010#PS11A180T010',
  '#PS01A000T010#PS01A180T010',
  '#PS00A000T010#PS00A180T010',
  '#PR255G255B000T010'
]

const rapiroPresets = {
  '#M0': 'Stop',
  '#M1': 'Move Forward',
  '#M2': 'Move Back',
  '#M3': 'Turn right',
  '#M4': 'Turn left',
  '#M5': 'Wave both hands',
  '#M6': 'Wave right hands',
  '#M7': 'Grip both hands',
  '#M8': 'Wave left hand',
  '#M9': 'Stretch out right hand'
}

/**
 * Dynamic component create from the online-editor
 * @class Playground
 */
const Playground = React.createClass({
  // --------------------
  // Specs
  // --------------------

  getInitialState () {
    const s = this
    let { actors } = s.props
    return {
      /** Key of actor to connect */
      actorKey: actors.length > 0 ? actors[ 0 ].key : null,
      /** Date ping send */
      pingAt: null,
      /** Date pong received */
      pongAt: null,

      /** Serial command text */
      serialCommand: '',

      presetSending: false,
      commandSending: false
    }
  },

  render () {
    const s = this
    let { state, props } = s
    let { actors } = props
    let { actorKey, pingAt, pongAt } = state
    return (
      <div className='dynamic-component'>
        <ApSelectableArticle
          options={ (actors || []).reduce((options, actor) => Object.assign(options, { [actor.key]: actor.key }), {}) }
          name='actorKey'
          label='Spot: '
          alt='No actor found! You need to connect one before playing'
          value={ actorKey }
          onChange={ (e) => s.setState({ actorKey: e.target.value }) }
        >
          <ApSelectableArticle.Content contentFor={ String(actorKey) }>
            <div className='playground-row'>
              <ApContainer>
                <div className='playground-item'>
                  <p>Send a ping and receive pong.</p>
                </div>
                <div className='playground-item'>
                  <ApBigButton
                    onTap={ () => s.withCaller(function * sendPing (caller) {
                      if (s.state.pongAt) {
                        // Reset to send ping
                        s.setState({ pingAt: null, pongAt: null })
                        return
                      }

                      // Set up
                      let actor = yield caller.connect(actorKey)
                      let noop = actor.get('noop')

                      // Do ping-pong
                      console.log('Send ping to noop...')
                      s.setState({ pingAt: new Date().toLocaleTimeString() })
                      let pong = yield noop.ping()
                      s.setState({ pongAt: new Date().toLocaleTimeString() })
                      console.log(`...received ping from noop: "${pong}"`)

                      // Tear down
                      yield actor.disconnect()
                      yield asleep(10)
                    }) }
                    spinning={ pingAt && !pongAt }
                    primary={ !pingAt }
                  >{ pongAt ? `Pong at ${pongAt}` : (pingAt ? 'Waiting...' : 'Send ping')} </ApBigButton>
                </div>
              </ApContainer>
            </div>
            <div className='playground-row'>
              <ApContainer>
                <div className='playground-item'>
                  <h5 className='rapiro-form-legend'>Prset</h5>
                  <ApForm className='rapiro-preset-form'
                          spinning={ state.presetSending }
                  >
                    {
                      Object.keys(rapiroPresets).map((command) => (
                        <ApButton onTap={ () => s.submitPresetCommand(command) }
                                  className="rapiro-preset-button"
                                  key={ command }
                        > {rapiroPresets[ command ]}</ApButton>
                      ))
                    }
                  </ApForm>
                </div>
              </ApContainer>
            </div>
            <div className='playground-row'>
              <ApContainer>
                <div className='playground-item'>
                  <div>
                    <h5 className='rapiro-form-legend'>Serial Command</h5>
                    <ApForm className='rapiro-command-form'
                            spinning={ state.commandSending }
                    >
                      <ApText name='text'
                              placehodler='SerialCommand to Write'
                              candidates={ serialCommandCandidates }
                              value={ state.serialCommand }
                              onKeyUp={ (e) => (e.keyCode === 13) && s.submitSerialCommand() }
                              onChange={ (e) => s.setState({ serialCommand: e.target.value }) }
                      />
                      <ApButton
                        primary
                        onTap={ () => s.submitSerialCommand() }
                      > Send </ApButton>
                    </ApForm>
                  </div>
                </div>
              </ApContainer>
            </div>
          </ApSelectableArticle.Content>
        </ApSelectableArticle>
      </div>
    )
  },

  // --------------------
  // LifeCycle
  // --------------------

  componentDidMount () {
    const s = this
    let { protocol, host } = window.location
    s.caller = sugoCaller(`${protocol}//${host}/callers`)
  },

  // --------------------
  // custom
  // --------------------

  withCaller (handler) {
    const s = this
    let { caller } = s
    if (!caller) {
      return
    }
    return co(handler, caller)
      .then(() => s.forceUpdate())
      .catch((err) => console.error(err))
  },

  doSend (commands) {
    const s = this
    return s.withCaller(function * (caller) {
      let { actorKey } = s.state
      // Set up
      let actor = yield caller.connect(actorKey)

      let rapiro = actor.get('rapiro')

      let usb = (yield rapiro.list()).filter((item) => /usbserial/.test(item.comName))[ 0 ]
      if (!usb) {
        alert('Rapiro not Connected!')
        return
      }

      let isOpen = yield rapiro.isOpen()
      if (!isOpen) {
        yield rapiro.connect(usb.comName, {
          baudRate: 57600
        })
      }

      yield rapiro.color({
        RED: 10,
        GREEN: 10,
        BLUE: 10
      }, 10)

      yield asleep(10)

      for (let command of [].concat(commands || [])) {
        rapiro.serialCommand(command)
        yield asleep(1000)
      }

      yield asleep(10)

      yield actor.disconnect()
      yield asleep(10)
    })
  },

  submitPresetCommand (command) {
    const s = this
    return co(function * () {
      if (!command) {
        return
      }
      s.setState({ presetSending: true })

      yield s.doSend(command)

      s.setState({ presetSending: false })
    })
  },

  submitSerialCommand () {
    const s = this
    return co(function * () {
      let { serialCommand } = s.state
      if (!serialCommand) {
        return
      }
      s.setState({ commandSending: true })

      yield s.doSend(serialCommand)

      s.setState({ commandSending: false, serialCommand: '' })
    })
  }
})

// Mount react component
let timer = setInterval(() => {
  let container = document.getElementById('playground-root')
  if (!container) {
    return
  }
  mount(container, Playground, Object.assign({}, {
    actors: [].concat(window.actors || [])
  })).catch((err) => console.error(err))
  clearTimeout(timer)
}, 100)

