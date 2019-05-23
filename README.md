# (WIP) Simple AHK - A limited AHK transpiler

> Write Javscript and produce .ahk scripts

This project is limited in scope to:
- Set key bindings
- Set keys to autofire
- Set keys to toggle
- _A composition of the above_

## Example

```ts
import { Script, toggleAutofireWhilePressed, toggleAutofireOnTap, toggleOnTap } from 'js-to-ahk

const ahk = new Script({ filePath: './myScript.ahk' })
  .IfWinActive('ahk_class', 'some_thing')
  .SingleInstance('Force')
  .bind('LShift', 'Space')
  .bind('$~LButton', toggleAutofireWhilePressed('LButton', 'LButton'))
  .bind('$~RButton', toggleAutofireOnTap('RButton', 'RButton'))
  .bind('$z', toggleOnTap('x', 'w'))
  .write() // Saves myScript.ahk (synchronously)
```