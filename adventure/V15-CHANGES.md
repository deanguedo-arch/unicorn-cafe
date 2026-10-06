# Sneaky Unicorn v15 — Family Treasure Team

## Canonical mechanic changes

### Family carrying
- Parent unicorn carries 1 treasure.
- Each rescued/following baby carries 1 additional treasure.
- Carry capacity is therefore 1 / 2 / 3 as zero / one / two babies are rescued.
- The actual treasure is drawn beside the unicorn carrying it.
- Returning to the suitcase/home drop automatically unloads every carried treasure at once.
- Carried treasures remain preserved through sparkly contact resets.

### Adventure jail loop
- A regular opponent hit by Rainbow Blast goes to jail and stays there.
- Regular opponents no longer return on their own timer.
- When every regular opponent on the map is jailed simultaneously, a 1.25 s rainbow release beat plays.
- The entire group returns to patrol together.
- Release positions prefer patrol points away from the player, followed by a 1.35 s contact-safe grace window.
- Police Unicorn mode is unchanged: captured dumplings remain jailed permanently.

### Rainbow Blast aiming
- Blast direction stores the unicorn's last meaningful real movement vector.
- Stopping does not change the stored aim.
- Tiny movement jitter does not update aim.
- The game no longer invents a left/right aim direction while idle.
- Before any meaningful movement has happened, pressing Blast does not fire sideways.

## Preserved v14 systems
- Two patrol people on regular maps with independently variable speed.
- Collect-all objectives.
- Two magical secret doors and two baby rescues per regular level.
- Duckling-style baby followers.
- Sparkly send-back contact reset.
- Halloween dumpling Police Unicorn map and King Dumpling boss.
