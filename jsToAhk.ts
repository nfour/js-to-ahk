import { writeFileSync } from 'fs';
import * as _ from 'lodash';
import { dirname, resolve } from 'path';

export function Ahk (...classArgs: ConstructorParameters<typeof AhkBuilder>): IAhkBuilderWithMethods {
  const builder = (() => {
    const base = new AhkBuilder(...classArgs);

    function reduceMethods <K extends any> (
      names: K,
      fn: (name: K[number]) => (this: AhkBuilder, ...args: (string|number)[]) => AhkBuilder
    ) {
      return names.reduce((a, name) => {
        return {
          ...a,
          [name]: fn(name)
        }
      }, {})
    }

    const functionMethods = reduceMethods(globalFunctionNames, (name) => function (...args) {
      this.putFunction(name, ...args)
      this.put('\n')

      return this
    })
    const commandMethods = reduceMethods(globalCommandNames, (name) => function (...args) {
      this.putCommand(name, ...args)

      return this
    })

    const directiveMethods = reduceMethods(globalDirectiveNames, (name) => function (...args) {
      this.putCommand(`#${name}`, ...args)
      return this
    })

    Object.assign(base, functionMethods, commandMethods, directiveMethods)

    return base as IAhkBuilderWithMethods
  })();

  return builder;
}

type IBindingFn<B extends AhkBuilder> = (builder: B) => void


export class AhkBuilder<InDeps extends string = string> {
  stack: string[] = []
  declaredLibraryDeps: InDeps[] = []
  inlineLibraries: { [K in InDeps]: string }

  protected putTransform: undefined | ((text: string) => string)

  constructor ({ inlineLibraries }: { inlineLibraries?: { [K in InDeps]: string } } = {}) {
    this.inlineLibraries = inlineLibraries || ({} as any)
  }

  /**
   * Adds a binding
   * 
   * @example
   * 
   * ahk.bind('LShift', 'RButton')
   * ahk.bind('~Space', (builder) => {
   *   builder.dependency('repeater')
   * 
   *   builder.putFunction('repeater', 'Space', 'Space', 50)
   * })
   * 
   */
  bind(fromKey: IAhkKeys, toKey: IAhkKeys)
  bind(fromKey: IAhkKeys, toKey: string)
  bind(fromKey: string, toKey: IAhkKeys)
  bind(fromKey: string, toKey: string)
  bind(fromKey: string, toFn: IBindingFn<this>)
  bind(fromKey: IAhkKeys, toFn: IBindingFn<this>)
  bind(fromKey: string, to: string | IBindingFn<this>): this {
    this.put(`${fromKey}::`)

    if (to instanceof Function) {
      this.put('\n')

      // Indent all incoming `put`
      this.setPutTransform((text) => `  ${text}`)

      try {
        to(this)
      } finally {
        // Remove the indent transform
        this.setPutTransform(undefined)
      }

      this.put('\nReturn\n')
    } else {
      this.put(`${to}\n`)
    }

    return this;
  }

  /** Pushes text to the stack */
  put(text: string) {
    this.stack.push(
      this.putTransform
        ? this.putTransform(text)
        : text
    )

    return this;
  }

  /** Produces a function call, like `GetKeyState("LShift", "P")` */
  putFunction (func: IGlobalNames, ...args: (string|number)[]): this
  putFunction (func: string, ...args: (string|number)[]): this
  putFunction (func: string, ...args: (string|number)[]): this {
    const wrappedArgs = args.map((key) => typeof key === 'string' ? `"${key}"` : key)
    
    this.put(`${func}(${wrappedArgs.join(', ')})`)

    return this;
  }

  /** Produces a command, like `Send, {LShift}` */
  putCommand (func: IGlobalNames, ...args: (string|number)[]): this
  putCommand (func: string, ...args: (string|number)[]): this
  putCommand (func: string, ...args: (string|number)[]): this {
    this.put(`${func}${args.length ? ', ' : ''}${args.join(', ')}\n`)

    return this;
  }

  /** Declare the need for an inline library dependency */
  dependency (depName: InDeps): this {
    this.declaredLibraryDeps = _.uniq([...this.declaredLibraryDeps, depName])

    return this;
  }

  toFile (filePath: string): this {
    writeFileSync(
      resolve(dirname(require.main.filename), filePath),
      this.transpile(),
      'utf8'
    )

    return this;
  }

  toString(): string {
    return this.transpile()
  }

  protected transpile (): string {
    console.log(this.stack)
    const dependencyTextBlocks = _(this.inlineLibraries)
      .pick(this.declaredLibraryDeps)
      .values()
      .value()

    const isDeps = !!dependencyTextBlocks.length

    const stack = [
      isDeps ? inlineDepsDisclaimerHeader : '' ,
      ...dependencyTextBlocks.map((blob) => `\n${blob}\n`),
      isDeps ? inlineDepsDisclaimerFooter : '' ,
      '\n',
      ...this.stack,
      '\n',
    ]

    return stack.join('')
  }

  protected setPutTransform (input: AhkBuilder['putTransform']) {
    this.putTransform = input;
  }
  
}


export abstract class AhkGlobalFunctions implements IGlobalMethodNameMap {
  //
  // Directives
  //

  abstract SingeInstance(method: 'Force'): this;
  
  /**
   * @example 
   * 
   * ahk_class my_class
   * ahk_exe someApp.exe
   */
  abstract IfWinActive(arg: string): this;
  abstract Persistent(): this;
  abstract InstallKeybdHook(): this;
  abstract InstallMouseHook(): this;
  /** @default 1 */
  abstract MaxThreadsperHotkey(n: number): this;
  /** Defines max hotkeys before a popup box warning will appear */
  abstract MaxHotkeysPerInterval(n: number): this;
  
  //
  // Commands
  //

  abstract SetBatchLines(time: '10ms'): this;
  abstract SetBatchLines(time: string): this;
  abstract SendMode(mode: 'Event' | 'Input' | 'Play'): this;
  abstract SetKeyDelay(before: number, after: number): this;
  abstract SetMouseDelay(): this;
  abstract SoundBeep(frequency: number, duration: number): this;
  abstract Sleep(delay: number): this;
  abstract Suspend(mode: 'On'|'Off'|'Toggle'|'Permit'): this;
  abstract Reload(): this;
  abstract Exit(): this;
  /**
   * @example
   * .Send('{LShift}')
   * .Send('{LShift Down}{LAlt Up}')
   */
  abstract Send(keys: IAhkSendInput): this;
  abstract Send(keys: string): this;

  /**
   * @example
   * .SendInput('{LShift}')
   * .SendInput('{LShift Down}{LAlt Up}')
   */
  abstract SendInput(keys: IAhkSendInput): this;
  abstract SendInput(keys: string): this;

  //
  // Functions
  //

  abstract GetKeyState(keys: IAhkKeys, mode: 'P'): this;
  abstract GetKeyState(keys: string, mode: 'P'): this;
  abstract WinActive(str: string): this;
}

const inlineDepsDisclaimerHeader = `
;;;
;;; Inline dependencies:
;;;
`
const inlineDepsDisclaimerFooter = `
;;;
;;; End of inline dependencies.
;;;
`

const globalFunctionNames = <const> [
  'GetKeyState',
  'WinActive'
]
const globalCommandNames = <const> [
  'SetBatchLines',
  'SendMode',
  'SetKeyDelay',
  'SetMouseDelay',
  'Sleep',
  'Send',
  'SendInput',
  'SoundBeep',
  'Reload',
  'Suspend',
  'Exit',
]

const globalDirectiveNames = <const> [
  'SingeInstance',
  'IfWinActive',
  'Persistent',
  'InstallKeybdHook',
  'InstallMouseHook',
  'MaxThreadsperHotkey',
  'MaxHotkeysPerInterval',
]

type IGlobalNames = typeof globalFunctionNames[number] | typeof globalCommandNames[number]  | typeof globalDirectiveNames[number]

/** This ensures we implement all functions defined in `globalFunctionNames` */
type IGlobalMethodNameMap = { [K in IGlobalNames]: any }


export type IAhkBuilderWithMethods = AhkBuilder & AhkGlobalFunctions

interface IAhkKeyEvent {
  key: IAhkKeys;
  state?: 'Down' | 'Up' | 'DownR' | 'DownTemp'
}

/** The configuration by which to construct an AHK script */
interface IAhkScriptConfig {
  stack: [];

  /** @description Menu, Tray, Icon, shell32.dll, 46 */
  trayIcon: {
    /** @default shell32.dll */
    file: string;

    /** @default 46 */
    index: number;
  }

  /** @example [['SendMode', ['Input']]] */
  globalOperations: [
    keyof AhkGlobalFunctions,
    Parameters<AhkGlobalFunctions[keyof AhkGlobalFunctions]>
  ][]

  keyBindings: [
    IAhkKeyEvent,
    Function
  ][]

}

export type IAhkKeys = (
  '!'
| '#'
| '+'
| '^'
| '{'
| '}'
| 'Click' | 'WheelDown' | 'WheelUp' | 'WheelLeft' | 'WheelRight' | 'LButton' | 'RButton' | 'MButton' | 'XButton1' | 'XButton2'
| 'Enter' | 'Escape' | 'Space' | 'Tab' | 'Backspace' | 'Delete' | 'Insert'
| 'Up' | 'Down' | 'Left' | 'Right'
| 'Home' | 'End' | 'PgUp' | 'PgDn'
| 'CapsLock' | 'ScrollLock' | 'NumLock'
| 'Control' | 'LControl' | 'RControl'
| 'Alt' | 'LAlt' | 'RAlt'
| 'Shift' | 'LShift' | 'RShift'
| 'LWin' | 'RWin'
| 'AppsKey' | 'Sleep'
| 'Numpad0' | 'NumpadDot' | 'NumpadEnter' | 'NumpadMult' | 'NumpadDiv' | 'NumpadAdd' | 'NumpadSub' | 'NumpadDel' | 'NumpadIns' | 'NumpadClear' | 'NumpadUp' | 'NumpadDown' | 'NumpadLeft' | 'NumpadRight' | 'NumpadHome' | 'NumpadEnd' | 'NumpadPgUp' | 'NumpadPgDn'
| 'Browser_Back' | 'Browser_Forward' | 'Browser_Refresh' | 'Browser_Stop' | 'Browser_Search' | 'Browser_Favorites' | 'Browser_Home'
| 'Volume_Mute' | 'Volume_Down' | 'Volume_Up'
| 'Media_Next' | 'Media_Prev' | 'Media_Stop' | 'Media_Play_Pause'
| 'Launch_Mail' | 'Launch_Media' | 'Launch_App1' | 'Launch_App2'
| 'PrintScreen' | 'CtrlBreak' | 'Pause'
| 'Blind'
| 'Raw'
)

export type IAhkSendInput = (
  '{Click}' | '{WheelDown}' | '{WheelUp}' | '{WheelLeft}' | '{WheelRight}' | '{LButton}' | '{RButton}' | '{MButton}' | '{XButton1}' | '{XButton2}'
| '{Enter}' | '{Escape}' | '{Space}' | '{Tab}' | '{Backspace}' | '{Delete}' | '{Insert}'
| '{Up}' | '{Down}' | '{Left}' | '{Right}'
| '{Home}' | '{End}' | '{PgUp}' | '{PgDn}'
| '{CapsLock}' | '{ScrollLock}' | '{NumLock}'
| '{Control}' | '{LControl}' | '{RControl}'
| '{Alt}' | '{LAlt}' | '{RAlt}'
| '{Shift}' | '{LShift}' | '{RShift}'
| '{LWin}' | '{RWin}'
| '{AppsKey}' | '{Sleep}'
| '{Numpad0}' | '{NumpadDot}' | '{NumpadEnter}' | '{NumpadMult}' | '{NumpadDiv}' | '{NumpadAdd}' | '{NumpadSub}' | '{NumpadDel}' | '{NumpadIns}' | '{NumpadClear}' | '{NumpadUp}' | '{NumpadDown}' | '{NumpadLeft}' | '{NumpadRight}' | '{NumpadHome}' | '{NumpadEnd}' | '{NumpadPgUp}' | '{NumpadPgDn}'
| '{Browser_Back}' | '{Browser_Forward}' | '{Browser_Refresh}' | '{Browser_Stop}' | '{Browser_Search}' | '{Browser_Favorites}' | '{Browser_Home}'
| '{Volume_Mute}' | '{Volume_Down}' | '{Volume_Up}'
| '{Media_Next}' | '{Media_Prev}' | '{Media_Stop}' | '{Media_Play_Pause}'
| '{Launch_Mail}' | '{Launch_Media}' | '{Launch_App1}' | '{Launch_App2}'
| '{PrintScreen}' | '{CtrlBreak}' | '{Pause}'
| '{Blind}'
| '{Raw}'
)