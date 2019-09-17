# DivineStumbler
Revised DrunkStumbler for IdleLands4   
https://idle.land

# To Use
Download a userscript manager like [tampermonkey](https://www.tampermonkey.net/) or [greasemonkey](https://www.greasespot.net/)  
Import the script  
Once logged into idlelands, click on "Divine Stumbler" in the left-hand menu  
Enter a series of coordinates as `x,y` like so:
```
123,321
42,81
145,98
```
Click `Submit` then toggle `Enabled`

# Expected Behavior
Once enabled with supplied coordinates, the script will set your DivineDirection to the first location.  
On arrival, it will set your DivineDirection to the next location.  
And so on and so forth.  
Once you reach the last location, it will begin heading back through the locations in a loop unless you toggle off `Loop`  
If you click on the map it will skip to the next location. This is useful if you change your path halfway through and need to get it back to your current leg.

## Todo
- Single leg mode, turn off on destination reach
- Userscript manager showing errors for undefined wsHook
- Block outgoing DD locations not defined in the path.
- Auto class change affirm
- When submitting a new path, send a new DD immediately (Maybe)
- DD steps not updating
- New DD when reached checkpoint not being set
- Possibly add other automations (ie pet gather, gamble, leave party)
- Also taking suggestions
