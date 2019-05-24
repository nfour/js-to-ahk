# (WIP) Simple AHK - A limited AHK transpiler

> Write Javscript and produce .ahk scripts

This project is limited in scope to:
- Set key bindings
- Set keys to repeat
- Set keys to toggle
- _A composition of the above_

## Example

```ts
import { ahkScript, repeatWhilePressed, toggleRepeatOnTap, toggleOnTap } from 'simple-ahk

ahkScript('./myScript.ahk')
  .IfWinActive('ahk_class', 'some_thing')
  .SingleInstance('Force')
  .bind('LShift', 'Space')
  .bind( '$~LButton', repeatWhilePressed({ whilePressed: 'LButton', repeatKeys: ['LButton'] }))
  .bind('$~RButton', toggleRepeatOnTap({ whenTapped: 'RButton', repeatKeys: ['RButton'] }))
  .bind('$x', toggleOnTap({ whenTapped: 'x', toogleKeys: ['z'] }))
```