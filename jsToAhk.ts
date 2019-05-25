import { writeFileSync } from 'fs';
import { uniq } from 'lodash';

export function Ahk (...classArgs: ConstructorParameters<typeof AhkBuilder>): IAhkBuilderWithMethods {
  const builder = (() => {
    const base = new AhkBuilder(...classArgs);

    const globalMethods = globalFunctionNames.reduce((a, funcName) => {
      return {
        ...a,
        [funcName]: function (this: AhkBuilder, ...args: (string|number)[]) {
          this.putFunction(funcName, ...args)
        } 
      }
    }, {})

    Object.assign(base, globalMethods)

    return base as IAhkBuilderWithMethods
  })();

  return builder;
}

type IBindingFn<B extends AhkBuilder> = (builder: B) => void


export class AhkBuilder<InDeps extends string = string> {
  stack: string[] = []
  inlineLibraryDependencies: InDeps[] = []
  inlineLibraries: { [K in InDeps]: string }

  protected putTransform: undefined | ((text: string) => string)

  constructor ({ inlineLibraries }: { inlineLibraries?: { [K in InDeps]: string } }) {
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
  putFunction (func: IGlobalFunctionNames, ...args: (string|number)[]): this
  putFunction (func: string, ...args: (string|number)[]): this
  putFunction (func: string, ...args: (string|number)[]): this {
    const wrappedArgs = args.map((key) => typeof key === 'string' ? `"${key}"` : key)
    
    this.put(`${func}(${wrappedArgs.join(', ')})`)

    return this;
  }

  /** Produces a command, like `Send, {LShift}` */
  putCommand (func: IGlobalFunctionNames, ...args: (string|number)[]): this
  putCommand (func: string, ...args: (string|number)[]): this
  putCommand (func: string, ...args: (string|number)[]): this {
    this.put(`${func}, ${args.join(', ')}`)

    return this;
  }

  /** Declare the need for an inline library dependency */
  dependency (depName: InDeps) {
    this.inlineLibraryDependencies = uniq([...this.inlineLibraryDependencies, depName])
  }

  toFile (filePath: string): this {
    writeFileSync(filePath, this.transpile())

    return this;
  }

  toString(): string {
    return this.transpile()
  }

  protected transpile (): string {
    const declaredDeps = this.inlineLibraryDependencies.values()
    return ''
  }

  protected setPutTransform (input: AhkBuilder['putTransform']) {
    this.putTransform = input;
  }
  
}

const globalFunctionNames = <const> [
  'SetBatchLines',
  'SendMode',
  'SetKeyDelay',
  'SingeInstance',
  'IfWinActive',
  'Persistant',
  'InstallKeybdHook',
  'InstallMouseHook',
  'MaxThreadsperHotkey',
  'MaxHotkeysPerInterval',
  'Send',
  'GetKeyState',
]

type IGlobalFunctionNames = typeof globalFunctionNames[number]

/** This ensures we implement all functions defined in `globalFunctionNames` */
type IGlobalFunctionNameMap = { [K in IGlobalFunctionNames]: any }

export abstract class AhkGlobalFunctions implements IGlobalFunctionNameMap {
  abstract SetBatchLines(lines: string): this;
  abstract SendMode(mode: 'Event' | 'Input' | 'Play'): this;
  abstract SetKeyDelay(before: number, after: number): this;
  /** Foo */
  abstract SingeInstance(method: 'Force'): this;
  /**
   * @example 
   * 
   * - ahk_class my_class
   * - ahk_exe someApp.exe
   */
  abstract IfWinActive(arg: string): this;
  abstract Persistant(): this;
  abstract InstallKeybdHook(): this;
  abstract InstallMouseHook(): this;
  /** @default 1 */
  abstract MaxThreadsperHotkey(n: number): this;
  /** Defines max hotkeys before a popup box warning will appear */
  abstract MaxHotkeysPerInterval(n: number): this;

  abstract Send(keys: string): this;
  abstract GetKeyState(keys: string, mode: 'P'): this;
}

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